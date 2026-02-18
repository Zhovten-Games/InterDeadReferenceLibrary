#!/usr/bin/env python3
"""Build timing artifacts from audio using WhisperX and lightweight heuristics."""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


EXIT_OK = 0
EXIT_ERROR = 2


@dataclass
class Segment:
    start: float
    end: float
    text: str


class CliError(Exception):
    """Handled CLI error with a user-facing message."""


class JsonIO:
    @staticmethod
    def read_json(path: Path) -> Any:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)

    @staticmethod
    def write_json(path: Path, payload: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, indent=2)
            file.write("\n")


class WorkdirContext:
    def __init__(self, workdir: Path, out: Path, audio: Optional[str]) -> None:
        self.workdir = workdir.resolve()
        self.out = (self.workdir / out).resolve() if not out.is_absolute() else out.resolve()
        self.audio = self._resolve_audio(audio)

    def _resolve_audio(self, audio: Optional[str]) -> Optional[Path]:
        if audio is None:
            return None
        source = Path(audio)
        if source.is_absolute():
            return source
        return (self.workdir / source).resolve()


class EnvironmentValidator:
    def __init__(self, context: WorkdirContext) -> None:
        self.context = context

    def run(self) -> None:
        errors: List[str] = []
        if not self.context.workdir.exists() or not self.context.workdir.is_dir():
            errors.append(f"Workdir does not exist or is not a directory: {self.context.workdir}")
        if self.context.audio is None:
            errors.append("Audio path is required for validation.")
        elif not self.context.audio.exists():
            errors.append(f"Audio file does not exist: {self.context.audio}")
        if shutil.which("ffmpeg") is None:
            errors.append("ffmpeg is not available in PATH.")
        if importlib.util.find_spec("whisperx") is None:
            errors.append("Python package 'whisperx' is not importable in this environment.")

        if errors:
            raise CliError("\n".join(errors))


class WhisperXService:
    def __init__(self, device: str, model_name: str, compute_type: str, language: str) -> None:
        self.device = device
        self.model_name = model_name
        self.compute_type = compute_type
        self.language = language

    def _import_whisperx(self):
        try:
            import whisperx  # type: ignore
        except ImportError as exc:
            raise CliError("Failed to import whisperx. Install it in this tool-specific virtual environment.") from exc
        return whisperx

    def transcribe(self, audio_path: Path) -> Dict[str, Any]:
        whisperx = self._import_whisperx()
        language = None if self.language == "auto" else self.language
        model = whisperx.load_model(
            self.model_name,
            self.device,
            compute_type=self.compute_type,
            language=language,
        )
        audio = whisperx.load_audio(str(audio_path))
        result = model.transcribe(audio, language=language)

        normalized_segments = [
            {"start": float(item["start"]), "end": float(item["end"]), "text": str(item.get("text", "")).strip()}
            for item in result.get("segments", [])
        ]
        return {
            "language": result.get("language", language),
            "segments": normalized_segments,
        }

    def align(self, audio_path: Path, transcript: Dict[str, Any]) -> Dict[str, Any]:
        whisperx = self._import_whisperx()
        audio = whisperx.load_audio(str(audio_path))

        language_code = self.language
        if language_code == "auto":
            language_code = transcript.get("language") or "ru"

        align_model, metadata = whisperx.load_align_model(language_code=language_code, device=self.device)
        aligned = whisperx.align(
            transcript.get("segments", []),
            align_model,
            metadata,
            audio,
            self.device,
            return_char_alignments=False,
        )

        payload: Dict[str, Any] = {
            "language": transcript.get("language", language_code),
            "segments": [
                {
                    "start": float(item["start"]),
                    "end": float(item["end"]),
                    "text": str(item.get("text", "")).strip(),
                }
                for item in aligned.get("segments", transcript.get("segments", []))
            ],
        }
        if "word_segments" in aligned:
            payload["word_segments"] = aligned["word_segments"]
        if "words" in aligned:
            payload["words"] = aligned["words"]
        return payload


class BlockBuilder:
    def __init__(
        self,
        gap_threshold: float,
        max_block_duration: float,
        max_block_chars: int,
        min_block_duration: float,
    ) -> None:
        self.gap_threshold = gap_threshold
        self.max_block_duration = max_block_duration
        self.max_block_chars = max_block_chars
        self.min_block_duration = min_block_duration

    def _to_segments(self, items: Iterable[Dict[str, Any]]) -> List[Segment]:
        segments: List[Segment] = []
        for item in items:
            segments.append(
                Segment(
                    start=float(item["start"]),
                    end=float(item["end"]),
                    text=str(item.get("text", "")).strip(),
                )
            )
        return sorted(segments, key=lambda it: it.start)

    def build(self, items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        segments = self._to_segments(items)
        if not segments:
            return []

        grouped: List[List[Segment]] = [[segments[0]]]

        for segment in segments[1:]:
            current = grouped[-1]
            block_start = current[0].start
            block_end = current[-1].end
            block_chars = len(" ".join(item.text for item in current if item.text).strip())
            gap = max(0.0, segment.start - block_end)
            incoming_chars = len(segment.text)

            should_split = (
                gap > self.gap_threshold
                or (segment.end - block_start) > self.max_block_duration
                or (block_chars + incoming_chars + 1) > self.max_block_chars
            )

            if should_split:
                grouped.append([segment])
            else:
                current.append(segment)

        merged = self._merge_short_blocks(grouped)
        return [self._make_block(index + 1, block_segments) for index, block_segments in enumerate(merged)]

    def _merge_short_blocks(self, grouped: List[List[Segment]]) -> List[List[Segment]]:
        if len(grouped) <= 1:
            return grouped

        result: List[List[Segment]] = []
        for block in grouped:
            duration = block[-1].end - block[0].start
            if result and duration < self.min_block_duration:
                candidate = result[-1] + block
                candidate_duration = candidate[-1].end - candidate[0].start
                candidate_chars = len(" ".join(item.text for item in candidate if item.text))
                if candidate_duration <= self.max_block_duration and candidate_chars <= self.max_block_chars:
                    result[-1] = candidate
                    continue
            result.append(block)

        return result

    @staticmethod
    def _make_block(block_id: int, segments: List[Segment]) -> Dict[str, Any]:
        text = " ".join(item.text for item in segments if item.text).strip()
        return {
            "id": block_id,
            "start": float(segments[0].start),
            "end": float(segments[-1].end),
            "text": text,
            "segments": [{"start": s.start, "end": s.end, "text": s.text} for s in segments],
        }


class CueExporter:
    def __init__(self, typing_duration: float, text_mode: str) -> None:
        self.typing_duration = typing_duration
        self.text_mode = text_mode

    def export(self, blocks: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cues: List[Dict[str, Any]] = []
        for block in blocks:
            cues.append(
                {
                    "start": float(block["start"]),
                    "end": float(block["end"]),
                    "text": self._resolve_text(block),
                    "typingDuration": self.typing_duration,
                }
            )
        return cues

    def _resolve_text(self, block: Dict[str, Any]) -> str:
        if self.text_mode == "empty":
            return ""
        if self.text_mode == "block_text":
            return str(block.get("text", ""))
        return "…"


def _default_compute_type(device: str, compute_type: Optional[str]) -> str:
    if compute_type:
        return compute_type
    return "int8" if device == "cpu" else "float16"


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="WhisperX timing builder utility.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--workdir", default=".", help="Working directory with input/output artifacts.")
    common.add_argument("--audio", required=True, help="Audio path relative to workdir or absolute path.")
    common.add_argument("--out", default="out", help="Output directory relative to workdir or absolute path.")

    validate = subparsers.add_parser("validate", parents=[common], help="Validate environment and required inputs.")
    validate.set_defaults(handler=cmd_validate)

    transcribe = subparsers.add_parser("transcribe", parents=[common], help="Run WhisperX transcription.")
    transcribe.add_argument("--language", default="ru", help="Language code or 'auto'.")
    transcribe.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    transcribe.add_argument("--model", default="large-v3")
    transcribe.add_argument("--compute-type", default=None)
    transcribe.set_defaults(handler=cmd_transcribe)

    align = subparsers.add_parser("align", parents=[common], help="Run WhisperX alignment with word timestamps.")
    align.add_argument("--language", default="ru", help="Language code or 'auto'.")
    align.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    align.set_defaults(handler=cmd_align)

    blocks = subparsers.add_parser("blocks", help="Group transcript/aligned segments into blocks.")
    blocks.add_argument("--workdir", default=".")
    blocks.add_argument("--out", default="out")
    blocks.add_argument("--input", default=None, help="Explicit JSON input file (aligned/transcript).")
    blocks.add_argument("--gap-threshold", type=float, default=1.2)
    blocks.add_argument("--max-block-duration", type=float, default=25.0)
    blocks.add_argument("--max-block-chars", type=int, default=240)
    blocks.add_argument("--min-block-duration", type=float, default=2.0)
    blocks.set_defaults(handler=cmd_blocks)

    export = subparsers.add_parser("export-cues", help="Export cue template for emoji overlay builder.")
    export.add_argument("--workdir", default=".")
    export.add_argument("--out", default="out")
    export.add_argument("--typing-duration", type=float, default=0.0)
    export.add_argument("--text-mode", choices=["empty", "ellipsis", "block_text"], default="ellipsis")
    export.set_defaults(handler=cmd_export_cues)

    return parser


def cmd_validate(args: argparse.Namespace) -> int:
    context = WorkdirContext(Path(args.workdir), Path(args.out), args.audio)
    EnvironmentValidator(context).run()
    print("Validation passed.")
    return EXIT_OK


def cmd_transcribe(args: argparse.Namespace) -> int:
    context = WorkdirContext(Path(args.workdir), Path(args.out), args.audio)
    if context.audio is None:
        raise CliError("Audio path is required.")

    validator = EnvironmentValidator(context)
    validator.run()

    service = WhisperXService(
        device=args.device,
        model_name=args.model,
        compute_type=_default_compute_type(args.device, args.compute_type),
        language=args.language,
    )
    transcript = service.transcribe(context.audio)
    output_path = context.out / "transcript.json"
    JsonIO.write_json(output_path, transcript)
    print(f"Saved transcript to: {output_path}")
    return EXIT_OK


def cmd_align(args: argparse.Namespace) -> int:
    context = WorkdirContext(Path(args.workdir), Path(args.out), args.audio)
    if context.audio is None:
        raise CliError("Audio path is required.")

    validator = EnvironmentValidator(context)
    validator.run()

    transcript_path = context.out / "transcript.json"
    if not transcript_path.exists():
        raise CliError(f"Transcript input is missing: {transcript_path}")

    transcript = JsonIO.read_json(transcript_path)
    service = WhisperXService(
        device=args.device,
        model_name="large-v3",
        compute_type=_default_compute_type(args.device, None),
        language=args.language,
    )
    aligned = service.align(context.audio, transcript)
    output_path = context.out / "aligned.json"
    JsonIO.write_json(output_path, aligned)
    print(f"Saved aligned result to: {output_path}")
    return EXIT_OK


def _select_segments_source(workdir: Path, out_dir: Path, explicit_input: Optional[str]) -> Path:
    if explicit_input:
        source = Path(explicit_input)
        return source if source.is_absolute() else (workdir / source)

    aligned = out_dir / "aligned.json"
    transcript = out_dir / "transcript.json"
    if aligned.exists():
        return aligned
    if transcript.exists():
        return transcript
    raise CliError(f"Cannot find segment source. Tried: {aligned} and {transcript}")


def cmd_blocks(args: argparse.Namespace) -> int:
    workdir = Path(args.workdir).resolve()
    out_dir = (workdir / args.out).resolve() if not Path(args.out).is_absolute() else Path(args.out).resolve()

    source = _select_segments_source(workdir, out_dir, args.input)
    if not source.exists():
        raise CliError(f"Input file does not exist: {source}")

    payload = JsonIO.read_json(source)
    segments = payload.get("segments")
    if not isinstance(segments, list):
        raise CliError("Input JSON must contain a 'segments' array.")

    builder = BlockBuilder(
        gap_threshold=args.gap_threshold,
        max_block_duration=args.max_block_duration,
        max_block_chars=args.max_block_chars,
        min_block_duration=args.min_block_duration,
    )
    blocks = builder.build(segments)
    output_path = out_dir / "blocks.json"
    JsonIO.write_json(output_path, blocks)
    print(f"Saved blocks to: {output_path}")
    return EXIT_OK


def cmd_export_cues(args: argparse.Namespace) -> int:
    workdir = Path(args.workdir).resolve()
    out_dir = (workdir / args.out).resolve() if not Path(args.out).is_absolute() else Path(args.out).resolve()
    blocks_path = out_dir / "blocks.json"
    if not blocks_path.exists():
        raise CliError(f"Missing blocks input: {blocks_path}")

    blocks = JsonIO.read_json(blocks_path)
    if not isinstance(blocks, list):
        raise CliError("blocks.json must be an array of block objects.")

    exporter = CueExporter(typing_duration=args.typing_duration, text_mode=args.text_mode)
    cues = exporter.export(blocks)
    output_path = out_dir / "cues.template.json"
    JsonIO.write_json(output_path, cues)
    print(f"Saved cue template to: {output_path}")
    return EXIT_OK


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    try:
        return args.handler(args)
    except CliError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    raise SystemExit(main())

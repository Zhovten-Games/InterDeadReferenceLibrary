#!/usr/bin/env python3
"""Emoji Overlay Video Builder CLI."""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Protocol, Sequence


class LoggerPort(Protocol):
    def info(self, message: str) -> None: ...

    def warning(self, message: str) -> None: ...

    def error(self, message: str) -> None: ...


class ConsoleLogger(LoggerPort):
    def info(self, message: str) -> None:
        print(f"[INFO] {message}")

    def warning(self, message: str) -> None:
        print(f"[WARN] {message}")

    def error(self, message: str) -> None:
        print(f"[ERROR] {message}")


class FileSystemPort(Protocol):
    def exists(self, path: Path) -> bool: ...

    def mkdir(self, path: Path) -> None: ...


class LocalFileSystem(FileSystemPort):
    def exists(self, path: Path) -> bool:
        return path.exists()

    def mkdir(self, path: Path) -> None:
        path.mkdir(parents=True, exist_ok=True)


class ProcessRunnerPort(Protocol):
    def run(self, args: Sequence[str]) -> int: ...


class CommandPrinter:
    @staticmethod
    def to_shell(command: Sequence[str], os_name: Optional[str] = None) -> str:
        current_os = os_name or os.name
        if current_os == "nt":
            return subprocess.list2cmdline(list(command))
        return shlex.join(list(command))


class SubprocessRunner(ProcessRunnerPort):
    def run(self, args: Sequence[str]) -> int:
        result = subprocess.run(args, check=False)
        return result.returncode


@dataclass(frozen=True)
class InputsConfig:
    background: str
    audio: str
    emoji_pack_id: str
    emoji_override_dir: Optional[str]


@dataclass(frozen=True)
class SafeAreaConfig:
    width: int
    offset_x: int = 0
    padding_left: int = 0


@dataclass(frozen=True)
class VideoConfig:
    width: int = 1280
    height: int = 720
    fps: int = 30
    crf: int = 20


@dataclass(frozen=True)
class RenderConfig:
    mode: str = "ffmpeg_overlays"
    tmp_dir: str = "out/.tmp_frames"


@dataclass(frozen=True)
class CueConfig:
    text: str
    start: float
    end: float
    typing_duration: float = 0.0


@dataclass(frozen=True)
class LayoutConfig:
    emoji_size: int = 72
    gap: int = 8
    top_margin: int = 60
    center_y: Optional[int] = None
    offset_y: int = 0


@dataclass(frozen=True)
class OutputConfig:
    file: str = "out/final.mp4"


@dataclass(frozen=True)
class AppConfig:
    inputs: InputsConfig
    safe_area: SafeAreaConfig
    video: VideoConfig
    render: RenderConfig
    layout: LayoutConfig
    output: OutputConfig
    cues: List[CueConfig]


class EmojiTokenizer:
    """Splits text to emoji clusters and preserves ZWJ/skin-tone combinations."""

    _skin_modifiers = set(range(0x1F3FB, 0x1F400))

    @staticmethod
    def split_clusters(text: str) -> List[str]:
        clusters: List[str] = []
        i = 0
        while i < len(text):
            cluster = text[i]
            i += 1

            while i < len(text):
                code = ord(text[i])
                prev = ord(cluster[-1])
                if code == 0xFE0F or code in EmojiTokenizer._skin_modifiers:
                    cluster += text[i]
                    i += 1
                    continue
                if prev == 0x200D:
                    cluster += text[i]
                    i += 1
                    continue
                if code == 0x200D:
                    cluster += text[i]
                    i += 1
                    continue
                if 0x1F1E6 <= prev <= 0x1F1FF and 0x1F1E6 <= code <= 0x1F1FF:
                    cluster += text[i]
                    i += 1
                    continue
                if code == 0x20E3:
                    cluster += text[i]
                    i += 1
                    continue
                break

            if not cluster.isspace():
                clusters.append(cluster)
        return clusters


class EmojiCodepointEncoder:
    @staticmethod
    def to_filename(cluster: str) -> str:
        points = [f"{ord(ch):x}" for ch in cluster if ord(ch) != 0xFE0F]
        return "-".join(points) + ".png"


class EmojiAssetResolver:
    def __init__(self, assets_root: Path, emoji_pack_id: str, override_dir: Optional[Path], logger: LoggerPort):
        self._assets_root = assets_root
        self._emoji_pack_id = emoji_pack_id
        self._override_dir = override_dir
        self._logger = logger

    def _bundled_pack_dir(self) -> Path:
        if self._emoji_pack_id == "twemoji-72x72":
            return self._assets_root / "emoji" / "twemoji" / "72x72"

        if "-" in self._emoji_pack_id:
            family, size = self._emoji_pack_id.split("-", 1)
            return self._assets_root / "emoji" / family / size

        return self._assets_root / "emoji" / self._emoji_pack_id

    def resolve(self, emoji: str) -> Path:
        filename = EmojiCodepointEncoder.to_filename(emoji)
        if self._override_dir:
            override = self._override_dir / filename
            if override.exists():
                return override
        bundled = self._bundled_pack_dir() / filename
        if bundled.exists():
            return bundled
        raise FileNotFoundError(f"Emoji asset not found for '{emoji}' as '{filename}'")


class LayoutService:
    @staticmethod
    def start_x(video_width: int, safe_area: SafeAreaConfig) -> int:
        return int((video_width - safe_area.width) / 2 + safe_area.offset_x + safe_area.padding_left)

    @staticmethod
    def top_y(video_height: int, layout: LayoutConfig) -> int:
        if layout.center_y is not None:
            center = layout.center_y
            return int(center + layout.offset_y - layout.emoji_size / 2)
        return int(layout.top_margin + layout.offset_y)

    @staticmethod
    def shown_count(total: int, now: float, start: float, typing_duration: float) -> int:
        if now < start:
            return 0
        if typing_duration <= 0:
            return total
        progress = min(max((now - start) / typing_duration, 0.0), 1.0)
        return min(total, int(progress * total + 1e-9) + (1 if progress > 0 else 0))


class ConfigLoader:
    def __init__(self, workdir: Path):
        self._workdir = workdir

    def load(self) -> AppConfig:
        config_path = self._workdir / "config.json"
        if not config_path.exists():
            raise FileNotFoundError(f"Missing required config: {config_path}")

        data = json.loads(config_path.read_text(encoding="utf-8"))
        inputs = data.get("inputs", {})

        cues_raw = data.get("cues", [])
        cues = [
            CueConfig(
                text=item["text"],
                start=float(item["start"]),
                end=float(item["end"]),
                typing_duration=float(item.get("typingDuration", 0.0)),
            )
            for item in cues_raw
        ]
        cues.sort(key=lambda c: c.start)

        safe_data = data.get("safeArea", {})
        video_data = data.get("video", {})
        render_data = data.get("render", {})
        layout_data = data.get("layout", {})
        output_data = data.get("output", {})

        return AppConfig(
            inputs=InputsConfig(
                background=inputs["background"],
                audio=inputs["audio"],
                emoji_pack_id=inputs.get("emojiPackId", "twemoji-72x72"),
                emoji_override_dir=inputs.get("emojiOverrideDir"),
            ),
            safe_area=SafeAreaConfig(
                width=int(safe_data.get("width", 1000)),
                offset_x=int(safe_data.get("offsetX", 0)),
                padding_left=int(safe_data.get("paddingLeft", 0)),
            ),
            video=VideoConfig(
                width=int(video_data.get("width", 1280)),
                height=int(video_data.get("height", 720)),
                fps=int(video_data.get("fps", 30)),
                crf=int(video_data.get("crf", 20)),
            ),
            render=RenderConfig(
                mode=render_data.get("mode", "ffmpeg_overlays"),
                tmp_dir=render_data.get("tmpDir", "out/.tmp_frames"),
            ),
            layout=LayoutConfig(
                emoji_size=int(layout_data.get("emojiSize", 72)),
                gap=int(layout_data.get("gap", 8)),
                top_margin=int(layout_data.get("topMargin", 60)),
                center_y=layout_data.get("centerY"),
                offset_y=int(layout_data.get("offsetY", 0)),
            ),
            output=OutputConfig(file=output_data.get("file", "out/final.mp4")),
            cues=cues,
        )


class ValidationService:
    def __init__(self, fs: FileSystemPort):
        self._fs = fs

    @staticmethod
    def _bundled_pack_dir(assets_root: Path, emoji_pack_id: str) -> Path:
        if emoji_pack_id == "twemoji-72x72":
            return assets_root / "emoji" / "twemoji" / "72x72"
        if "-" in emoji_pack_id:
            family, size = emoji_pack_id.split("-", 1)
            return assets_root / "emoji" / family / size
        return assets_root / "emoji" / emoji_pack_id

    def validate(
        self,
        workdir: Path,
        config: AppConfig,
        assets_root: Path,
        emoji_pack_id: str,
        emoji_dir: Optional[Path],
        resolver: Optional["EmojiAssetResolver"] = None,
    ) -> List[str]:
        errors: List[str] = []

        for rel in [config.inputs.background, config.inputs.audio]:
            if not self._fs.exists(workdir / rel):
                errors.append(f"Missing required input file: {workdir / rel}")

        if emoji_dir is not None and not self._fs.exists(emoji_dir):
            errors.append(f"Emoji override dir not found: {emoji_dir}")
        if emoji_dir is None and config.inputs.emoji_override_dir:
            config_override = workdir / config.inputs.emoji_override_dir
            if not self._fs.exists(config_override):
                errors.append(f"Emoji override dir not found: {config_override}")

        active_emoji_dir = emoji_dir or (workdir / config.inputs.emoji_override_dir if config.inputs.emoji_override_dir else None)
        if active_emoji_dir is None:
            bundled = self._bundled_pack_dir(assets_root, emoji_pack_id)
            if not self._fs.exists(bundled):
                errors.append(f"Bundled emoji pack folder is missing: {bundled}")

        for i, cue in enumerate(config.cues):
            if cue.end <= cue.start:
                errors.append(f"Cue #{i} has invalid time range: start={cue.start}, end={cue.end}")
            if i > 0 and cue.start < config.cues[i - 1].end:
                errors.append(f"Cue #{i} overlaps with cue #{i - 1}")

        if resolver is not None:
            for cue_index, cue in enumerate(config.cues):
                for emoji in EmojiTokenizer.split_clusters(cue.text):
                    try:
                        resolver.resolve(emoji)
                    except FileNotFoundError as err:
                        errors.append(f"Cue #{cue_index} missing emoji asset: {err}")

        return errors


class FfmpegCommandFactory:
    def build(self, workdir: Path, config: AppConfig, resolver: EmojiAssetResolver) -> List[str]:
        bg = str(workdir / config.inputs.background)
        audio = str(workdir / config.inputs.audio)
        output = str(workdir / config.output.file)

        inputs = ["-loop", "1", "-i", bg, "-i", audio]
        filter_steps: List[str] = [f"[0:v]scale={config.video.width}:{config.video.height}[v0]"]

        x0 = LayoutService.start_x(config.video.width, config.safe_area)
        y0 = LayoutService.top_y(config.video.height, config.layout)

        current = "v0"
        input_index = 2

        for cue in config.cues:
            emojis = EmojiTokenizer.split_clusters(cue.text)
            total = len(emojis)
            for idx, emoji in enumerate(emojis):
                emoji_path = resolver.resolve(emoji)
                inputs.extend(["-loop", "1", "-i", str(emoji_path)])

                image_idx = input_index
                scaled_name = f"e{image_idx}"
                next_video = f"v{image_idx}"
                filter_steps.append(
                    f"[{image_idx}:v]scale={config.layout.emoji_size}:{config.layout.emoji_size}[{scaled_name}]"
                )

                x = x0 + idx * (config.layout.emoji_size + config.layout.gap)
                if cue.typing_duration > 0 and total > 0:
                    progress = f"({total}*(t-{cue.start})/max({cue.typing_duration},0.001))"
                    appear_expr = f"between(t,{cue.start},{cue.end})*gte({progress},{idx})"
                else:
                    appear_expr = f"between(t,{cue.start},{cue.end})"

                filter_steps.append(
                    f"[{current}][{scaled_name}]overlay={x}:{y0}:enable='{appear_expr}'[{next_video}]"
                )
                current = next_video
                input_index += 1

        filter_complex = ";".join(filter_steps)
        return [
            "ffmpeg",
            "-y",
            *inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            f"[{current}]",
            "-map",
            "1:a:0",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-r",
            str(config.video.fps),
            "-crf",
            str(config.video.crf),
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            output,
        ]


class BuildService:
    def __init__(self, fs: FileSystemPort, runner: ProcessRunnerPort, logger: LoggerPort):
        self._fs = fs
        self._runner = runner
        self._logger = logger

    def build(self, command: List[str], out_file: Path) -> int:
        self._fs.mkdir(out_file.parent)
        self._logger.info("Executing ffmpeg command...")
        return self._runner.run(command)


class CliApp:
    def __init__(self, fs: FileSystemPort, runner: ProcessRunnerPort, logger: LoggerPort):
        self._fs = fs
        self._runner = runner
        self._logger = logger

    def run(self, argv: Sequence[str]) -> int:
        parser = argparse.ArgumentParser(description="Build emoji overlay videos from local assets.")
        sub = parser.add_subparsers(dest="command", required=True)

        for name in ["build", "validate", "probe"]:
            s = sub.add_parser(name)
            s.add_argument("--workdir", required=True)
            s.add_argument("--emoji-pack", default=None)
            s.add_argument("--emoji-dir")
            s.add_argument("--assets-root")
            s.add_argument("--dry-run", action="store_true")

        args = parser.parse_args(argv)

        workdir = Path(args.workdir).resolve()
        config = ConfigLoader(workdir).load()
        assets_root = Path(args.assets_root or os.getenv("EMOJI_VIDEO_ASSETS_ROOT") or Path(__file__).resolve().parent / "assets")
        emoji_dir = Path(args.emoji_dir).resolve() if args.emoji_dir else None
        emoji_pack_id = args.emoji_pack or config.inputs.emoji_pack_id

        resolver = EmojiAssetResolver(
            assets_root=assets_root,
            emoji_pack_id=emoji_pack_id,
            override_dir=emoji_dir or (workdir / config.inputs.emoji_override_dir if config.inputs.emoji_override_dir else None),
            logger=self._logger,
        )

        validation = ValidationService(self._fs)
        errors = validation.validate(workdir, config, assets_root, emoji_pack_id, emoji_dir, resolver)
        if errors:
            for err in errors:
                self._logger.error(err)
            return 2

        command = FfmpegCommandFactory().build(workdir, config, resolver)

        if args.command == "validate":
            self._logger.info("Validation passed.")
            return 0
        if args.command == "probe":
            print(CommandPrinter.to_shell(command))
            return 0

        if args.dry_run:
            print(CommandPrinter.to_shell(command))
            return 0

        return BuildService(self._fs, self._runner, self._logger).build(command, (workdir / config.output.file))


def main() -> int:
    app = CliApp(LocalFileSystem(), SubprocessRunner(), ConsoleLogger())
    return app.run(sys.argv[1:])


if __name__ == "__main__":
    raise SystemExit(main())

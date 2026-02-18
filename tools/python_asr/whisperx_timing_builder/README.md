# whisperx_timing_builder

CLI helper to extract timing data from audio (`mp3/wav/...`) with WhisperX and prepare intermediate JSON artifacts for manual or semi-automatic emoji cue markup.

> This tool is standalone and intended to run in its own Python virtual environment.

## Outputs

By default (`--out out`), the tool writes:

- `out/transcript.json` — segment timestamps (`start/end/text`).
- `out/aligned.json` — aligned segments and optional word-level timestamps.
- `out/blocks.json` — heuristic blocks grouped from segments.
- `out/cues.template.json` — cue template for `emoji_overlay_video_builder`.

## Setup (separate venv)

### Linux / macOS / WSL

```bash
cd InterDeadReferenceLibrary/tools/python_asr/whisperx_timing_builder
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
pip install whisperx
```

### Windows (PowerShell)

```powershell
cd InterDeadReferenceLibrary/tools/python_asr/whisperx_timing_builder
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install whisperx
```

## Verify ffmpeg

```bash
ffmpeg -version
```

## CLI usage

```bash
python3 whisperx_timing_builder.py <command> [options]
```

Global concept: use `--workdir` to point to the folder containing your audio and where outputs should be generated.

### 1) validate

Checks:
- workdir exists,
- audio exists,
- `ffmpeg` in PATH,
- Python package `whisperx` importable.

Returns `0` on success, `2` on environment/file errors.

```bash
python3 whisperx_timing_builder.py validate \
  --workdir ./session \
  --audio input.mp3
```

### 2) transcribe

Runs WhisperX ASR and saves `out/transcript.json`.

```bash
python3 whisperx_timing_builder.py transcribe \
  --workdir ./session \
  --audio input.mp3 \
  --language ru \
  --device cpu \
  --model large-v3 \
  --compute-type int8 \
  --out out
```

### 3) align

Runs alignment based on `out/transcript.json` and audio, saves `out/aligned.json`.

> Note: `align` uses WhisperX alignment models selected by language/device; `--model` and `--compute-type` are intentionally part of transcription only.

```bash
python3 whisperx_timing_builder.py align \
  --workdir ./session \
  --audio input.mp3 \
  --language ru \
  --device cpu \
  --out out
```

### 4) blocks

Builds block groups from `out/aligned.json` (fallback: `out/transcript.json`) and writes `out/blocks.json`.

```bash
python3 whisperx_timing_builder.py blocks \
  --workdir ./session \
  --out out \
  --gap-threshold 1.2 \
  --max-block-duration 25.0 \
  --max-block-chars 240 \
  --min-block-duration 2.0
```

### 5) export-cues

Exports cue template compatible with `emoji_overlay_video_builder`.

```bash
python3 whisperx_timing_builder.py export-cues \
  --workdir ./session \
  --out out \
  --typing-duration 0.0 \
  --text-mode ellipsis
```

`--text-mode` values:
- `empty` → `""`
- `ellipsis` → `"…"`
- `block_text` → block text from `blocks.json`

## Example pipeline

The repository includes a ready-to-run example in `session/` with `input.mp3` and generated artifacts under `session/out/`.


```bash
python3 whisperx_timing_builder.py validate --workdir ./session --audio input.mp3
python3 whisperx_timing_builder.py transcribe --workdir ./session --audio input.mp3 --language ru --device cpu
python3 whisperx_timing_builder.py align --workdir ./session --audio input.mp3 --language ru --device cpu
python3 whisperx_timing_builder.py blocks --workdir ./session
python3 whisperx_timing_builder.py export-cues --workdir ./session --text-mode ellipsis
```

## Transfer to emoji overlay config

1. Open generated `session/out/cues.template.json` (or `./session/out/cues.template.json` if you run from this tool directory).
2. Copy entries into your `config.json` used by `tools/python_ffmpeg/emoji_overlay_video_builder`.
3. Replace placeholder text/emoji and adjust timing if needed.

Expected cue item shape:

```json
{
  "start": 12.34,
  "end": 15.67,
  "text": "…",
  "typingDuration": 0.0
}
```

## Notes

- Logs and diagnostics are in English.
- Commands are idempotent and overwrite outputs on repeat runs.
- Models are not stored in the repository; WhisperX manages model downloads in user environment.


## Tests

Run unit tests (grouping + cue export logic):

```bash
python3 -m unittest discover -s tests -p "test_*.py" -v
```

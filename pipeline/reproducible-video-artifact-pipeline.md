# InterDead reproducible video artifact pipeline

This document summarizes the sequence from the case article and links each stage to implementation docs.

## 1) Video/audio breakdown (ASR + timing artifacts)

Run the ASR/alignment flow to get `aligned.json`, `blocks.json`, and `cues.template.json`.

- Main doc: [tools/python_asr/whisperx_timing_builder/README.md](../tools/python_asr/whisperx_timing_builder/README.md)

## 2) GPT prompt step (generate cues)

Use the prompt:

1. [prompts/emoji-cue-generation-prompt-twemoji-ffmpeg-overlay-mode.md](../prompts/emoji-cue-generation-prompt-twemoji-ffmpeg-overlay-mode.md)

The result of this stage is a `cues[]` block ready to be inserted into final builder config.

## 3) Final video assembly (FFmpeg overlays)

Assemble final output video with deterministic emoji overlays from `config.json`.

- Main doc: [tools/python_ffmpeg/emoji_overlay_video_builder/README.md](../tools/python_ffmpeg/emoji_overlay_video_builder/README.md)

## Full chain (strict order)

1. `whisperx_timing_builder` → timing artifacts
2. GPT prompt → `cues[]`
3. `emoji_overlay_video_builder` → final rendered artifact

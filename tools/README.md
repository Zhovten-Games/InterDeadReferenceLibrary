# Tools navigation

This directory contains helper scripts used to build and maintain the InterDead reference materials.

## Utilities

- **wiki_export_to_md_zip.py** (Python)
  - Location: [tools/python/wiki_export_to_md_zip/](./python/wiki_export_to_md_zip/)
  - Purpose: convert a MediaWiki/Fandom XML export into a ZIP archive of `.md` files, with optional category folders.
  - Related docs and usage: [tools/python/wiki_export_to_md_zip/README.md](./python/wiki_export_to_md_zip/README.md)

- **emoji_overlay_video_builder.py** (Python + FFmpeg)
  - Location: [tools/python_ffmpeg/emoji_overlay_video_builder/](./python_ffmpeg/emoji_overlay_video_builder/)
  - Purpose: assemble a 720p video with timed emoji overlays and typing-like reveal from local assets.
  - Related docs and usage: [tools/python_ffmpeg/emoji_overlay_video_builder/README.md](./python_ffmpeg/emoji_overlay_video_builder/README.md)

- **whisperx_timing_builder.py** (Python + WhisperX + FFmpeg)
  - Location: [tools/python_asr/whisperx_timing_builder/](./python_asr/whisperx_timing_builder/)
  - Purpose: extract speech/line timecodes from audio and generate intermediate JSON artifacts (`transcript`, `aligned`, `blocks`, `cues.template`) for emoji cue preparation.
  - Related docs and usage: [tools/python_asr/whisperx_timing_builder/README.md](./python_asr/whisperx_timing_builder/README.md)

## Related content

- [Wiki sources](../wiki/)

# Emoji Overlay Video Builder (Python + FFmpeg)

CLI utility that builds a 1280x720 video from a working directory with:
- a background image,
- an audio track,
- emoji overlays by time cues,
- typing-like reveal of emoji sequence.

## Commands

```bash
python3 emoji_overlay_video_builder.py validate --workdir ./session
python3 emoji_overlay_video_builder.py probe --workdir ./session
python3 emoji_overlay_video_builder.py build --workdir ./session
```

## Session example

Use the repository-provided `session/` folder as the canonical example workspace:
- `session/config.json`
- `session/input.mp3`
- `session/bg.webp`
- `session/out/final.mp4` (example output artifact)

## Runtime overrides

- `--assets-root` or `EMOJI_VIDEO_ASSETS_ROOT` for bundled assets root.
- `--emoji-dir` for custom emoji overrides.
- `--emoji-pack` for bundled pack selection (`family-size`, for example `twemoji-72x72`). If omitted, `config.inputs.emojiPackId` is used.

Priority for assets root:
1. `--assets-root`
2. `EMOJI_VIDEO_ASSETS_ROOT`
3. `./assets` next to script

Priority for emoji directory:
1. `--emoji-dir`
2. `config.inputs.emojiOverrideDir`
3. bundled pack (`assets/emoji/<family>/<size>`)

## Minimal `config.json`

```json
{
  "inputs": {
    "background": "background.png",
    "audio": "audio.wav",
    "emojiPackId": "twemoji-72x72",
    "emojiOverrideDir": null
  },
  "safeArea": {
    "width": 1000,
    "offsetX": 0,
    "paddingLeft": 0
  },
  "video": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "crf": 20
  },
  "layout": {
    "emojiSize": 72,
    "gap": 8,
    "topMargin": 60,
    "offsetY": 0
  },
  "render": {
    "mode": "ffmpeg_overlays",
    "tmpDir": "out/.tmp_frames"
  },
  "output": {
    "file": "out/final.mp4"
  },
  "cues": [
    { "text": "📼💻✨", "start": 0.5, "end": 2.8, "typingDuration": 1.2 }
  ]
}
```

## Notes

- Current implementation uses ffmpeg overlay filtergraph pipeline (no rawvideo stdin mode yet).
- This mode is intended for relatively small/medium cue volumes because each emoji becomes an ffmpeg input and overlay node.
- Validation checks mandatory inputs, cue time ranges/overlaps, override directory existence, and emoji asset resolvability for all cues.
- Some source text can remain partially unrecognized by ASR/OCR pipelines, so cue text may require manual cleanup before final rendering.
- `probe` prints generated ffmpeg command without execution (POSIX via `shlex.join`, Windows via `subprocess.list2cmdline`).
- All logs and diagnostics are in English.

## Bundled assets and licensing

- Repository contains only a **sample download script** for a minimal emoji subset:
  `assets/emoji/twemoji/72x72/generate_sample_assets.sh`.
- For production, point `--assets-root` to a full emoji pack location.
- Twemoji attribution details are in `assets/emoji/twemoji/NOTICE.md`.

## Tests

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
```

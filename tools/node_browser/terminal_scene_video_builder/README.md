# Cinematic Single-Text Video Builder

This tool renders a simple cinematic page and records it to MP4.

## Scene model

The runtime has a single scene mode: `text_overlay`.

Rendered layers:
1. Background image.
2. Framework membrane canvas (`.scene__membrane`) rendered by InterDeadCore framework (idle behavior depends on framework runtime defaults).
3. Single text overlay with fade-in/fade-out timing.
   - Supports `textOverlay.reveal.mode: "line_by_line"` for progressive per-line output.
   - Supports `textOverlay.reveal.mode: "credits_scroll"` for continuous monologue-style scrolling tied to overlay timing.
4. Background audio (preview playback + muxed into final MP4).

Terminal log, status line, input strip, local membrane adapter, and pulse scheduling are not used in the active runtime path.

## Commands

```bash
node ./terminal_scene_video_builder.js validate --workdir ./session
node ./terminal_scene_video_builder.js probe --workdir ./session
node ./terminal_scene_video_builder.js serve --workdir ./session --port 4173
node ./terminal_scene_video_builder.js record --workdir ./session
```

## Framework requirement

A compatible browser framework bundle is mandatory. No fallback to local membrane is performed.

Bundle resolution order:
1. `render.frameworkBundlePath` in session config.
2. `TSVB_FRAMEWORK_BUNDLE` environment variable.
3. Default relative path to `InterDeadCore/framework/dist/browser/interdead-framework.global.js`.

If bundle is missing, `validate`, `serve`, and `record` fail with explicit errors.


### Build framework bundle explicitly

`terminal_scene_video_builder` requires a compatible built browser bundle file. The default path points to the `@interdead/framework` build output.

```bash
cd ../../../../InterDeadCore/framework
npm ci
npm run build
```

Then point the session to the built file:

- `render.frameworkBundlePath` in `session/config.json`, or
- `TSVB_FRAMEWORK_BUNDLE` environment variable.

Why not store the framework directly inside `terminal_scene_video_builder/node_modules`?
- `node_modules` is installation output and should stay reproducible from `package.json`/lockfile.
- Checked-in framework builds inside another tool's `node_modules` are fragile and usually cleaned by package managers.
- Keeping a single build source in `InterDeadCore/framework` avoids drift between tools and versions.

## Minimal config contract

`textOverlay.content` and `textOverlay.contentFile` are mutually exclusive; provide exactly one of them.
If `contentFile` is used, loader normalizes runtime config to inline `textOverlay.content` (source path is not kept in runtime model).
`textOverlay.end` is optional; when omitted, runtime uses `input.mp3` duration to finish the overlay timing window.
`textOverlay.topInsetPx` and `textOverlay.bottomInsetPx` can be used to reserve top/bottom safe margins for the scrolling viewport.
When `textOverlay.end` is set, audio-based clipping is applied only if `textOverlay.reveal.fitToAudioDuration` is explicitly `true`.

```json
{
  "inputs": { "background": "bg.png", "audio": "input.mp3" },
  "video": { "width": 1280, "height": 720, "fps": 30, "crf": 15 },
  "render": {
    "mode": "browser_frames",
    "tmpDir": "out/.tmp_frames",
    "sceneHtmlPath": "../app/scene.html",
    "frameworkBundlePath": null,
    "frameworkMembrane": {
      "lineCount": 24,
      "amplitude": 7,
      "pulseDecay": 0.9,
      "lineColor": "rgba(138, 229, 144, 0.28)",
      "pulseColor": "rgba(198, 110, 72, 0.45)"
    }
  },
  "scene": { "mode": "text_overlay" },
  "layout": { "safeWidth": 1000 },
  "textOverlay": {
    "contentFile": "text.md",
    "start": 0.8,
    "fadeInSec": 1.4,
    "fadeOutSec": 1.2,
    "reveal": {
      "mode": "credits_scroll",
      "fitToAudioDuration": true
    },
    "x": 0.5,
    "y": 0.0,
    "anchorX": 0.5,
    "anchorY": 0.0,
    "align": "center",
    "maxWidth": 960,
    "fontSize": 78,
    "topInsetPx": 80,
    "bottomInsetPx": 80
  },
  "output": { "file": "out/final.mp4" }
}
```

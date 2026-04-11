# InterDead Styled Screenshot Builder

A small config-driven utility for one-click screenshots in the InterDead visual style.

## Placement decision

The utility is located under:

- `InterDeadReferenceLibrary/tools/node_browser/styled_screenshot_builder`

Reason:
- It is a browser-rendered Node.js tool.
- It is conceptually close to `terminal_scene_video_builder` and can reuse the same runtime expectations (`node + playwright`).
- Keeping it in `node_browser` keeps similar automation tools grouped together.

## Key behavior

- Uses InterDeadIT-like gradient and scanline CSS background.
- Does **not** use membrane runtime integration (CSS-only fallback).
- Supports resolution presets (`4k` by default), plus custom `video.width` / `video.height` override.
- Supports multiple text blocks at arbitrary positions (`x/y` in px or `xPct/yPct` in percentages).
- Supports per-item typography options: `lineHeight`, `letterSpacing`, `textTransform`, and `textShadow`.
- Supports explicit text anchor mode via `anchor` (`top-left`, `center`, `bottom-right`, etc.).
- Uses heading font logic similar to InterDeadIT (locale forms are accepted and normalized to base language):
  - `en` family (e.g., `en-US`) normalizes to `en` → `Pirata One`
  - `ru` / `uk` families (e.g., `ru-RU`, `uk-UA`) normalize to `ru` / `uk` → `Triodion`
- On `shot` command: renders once, saves one screenshot, exits.

## Validation highlights

`validate` checks real config readiness, including:

- `textItems` structure and required fields (`text`, X/Y coordinates).
- Numeric fields (`fontSize`, `fontWeight`, `maxWidth`, etc.).
- `align` and `anchor` allowed values.
- `page.lang` normalization and supported language set.
- `output.file` as non-empty string.
- Color-like checks for `background.color` and `textItems[].color`.

## Commands

```bash
node ./styled_screenshot_builder.js validate --workdir ./session
node ./styled_screenshot_builder.js shot --workdir ./session
```

## Config example

`session/config.json`

```json
{
  "video": {
    "preset": "4k"
  },
  "page": {
    "lang": "en-US"
  },
  "background": {
    "color": "#001501",
    "image": null,
    "enableScanlines": true,
    "scanlinesOpacity": 0.2,
    "vignetteOpacity": 0.62
  },
  "textItems": [
    {
      "text": "INTERDEAD SCREENSHOT",
      "xPct": 50,
      "yPct": 50,
      "fontSize": 200,
      "align": "center",
      "anchor": "center",
      "lineHeight": 1.1,
      "letterSpacing": 0.02
    }
  ],
  "screenshot": {
    "type": "png",
    "omitBackground": false
  },
  "output": {
    "file": "out/screenshot.png"
  }
}
```

## Notes

- Requires `playwright` in the runtime environment.
- Fonts are requested from Google Fonts at render time, and the tool logs whether target heading fonts are actually loaded.

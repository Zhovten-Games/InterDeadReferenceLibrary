# Wiki workspace (drafts & discussions)

This directory is where we keep **discussion drafts** for the InterDead Wiki before they are finalized and published.
The clean (public) wiki URLs are derived using the export script, which embeds the canonical URL for each page.
See: [tools/python/wiki_export_to_md_zip/wiki_export_to_md_zip.py](../tools/python/wiki_export_to_md_zip/wiki_export_to_md_zip.py).

## Locales

| Locale | Clean wiki URL | Markdown sources |
| --- | --- | --- |
| EN | https://interdead.fandom.com/wiki/InterDead_Wiki | [wiki/en/](./en/) |
| RU | https://interdead.fandom.com/ru/wiki/Interdead_%D0%92%D0%B8%D0%BA%D0%B8 | [wiki/ru/](./ru/) |
| UA | https://interdead.fandom.com/uk/wiki/Main_Page | [wiki/ua/](./ua/) |
| JA | https://interdead.fandom.com/ja/wiki/InterDead_Wiki | [wiki/ja/](./ja/) |

## Build/export tooling

The Markdown sources in this workspace are produced by the MediaWiki export script:
[tools/python/wiki_export_to_md_zip/wiki_export_to_md_zip.py](../tools/python/wiki_export_to_md_zip/wiki_export_to_md_zip.py).

# MediaWiki Export → Markdown → ZIP (with Category Folders)

A small utility that converts a **MediaWiki/Fandom XML export** into a **ZIP archive** containing one **`.md` file per page**.  
Each output file starts with a footnote pointing to the page’s **clean (web) version URL**.  
Optionally, pages can be placed into **category-named folders** inside the ZIP (one category per article).

## What it does

- Reads a MediaWiki XML export (streaming, low memory usage).
- For each page:
  - Extracts raw wikitext from `<revision><text>`.
  - Prepends a footnote:
    - `[^clean]: Clean version: <page-url>`
- Writes everything directly into a ZIP archive.
- Optional: `--by-category` places pages into folders by a single category.

## Requirements

- Python 3.10+ recommended (works on 3.8+ in most cases).
- No third-party libraries.

## Usage

### Interactive
```bash
python wiki_export_to_md_zip.py
````

### Non-interactive

```bash
python wiki_export_to_md_zip.py \
  --input "InterDead+Wiki-20260107014150-EN.xml" \
  --wiki-url "https://interdead.fandom.com/wiki/InterDead_Wiki" \
  --out-zip "./interdead_en_md.zip"
```

### Enable category folders

```bash
python wiki_export_to_md_zip.py \
  --input "InterDead+Wiki-20260107014150-EN.xml" \
  --wiki-url "https://interdead.fandom.com/wiki/InterDead_Wiki" \
  --out-zip "./interdead_en_md.zip" \
  --by-category
```

### Custom folder for uncategorized pages

```bash
python wiki_export_to_md_zip.py --by-category --category-default "_needs_category_check"
```

## Arguments

* `--input`
  Path to the MediaWiki XML export file.

* `--wiki-url`
  Any page URL from the target wiki branch (EN/UK/RU/JA). Used to derive the correct `/wiki` prefix.

* `--out-zip`
  Output ZIP path **or** folder path. If a folder is provided, `wiki_md.zip` will be created inside it.

* `--folder-in-zip`
  Root folder name inside the ZIP (default: `wiki_md`).

* `--include-empty`
  Include pages whose `<text>` is empty.

* `--by-category`
  Create an extra level of folders: `wiki_md/<CategoryName>/<Page>.md`.

* `--category-default`
  Folder name for pages without a detected category (default: `_uncategorized`).

## How category detection works

If `--by-category` is enabled, the script scans wikitext for a single category tag, e.g.:

* `[[Category:Something]]`
* `[[Category:Something|SortKey]]`

It also supports common localized aliases depending on the wiki branch:

* EN: `Category`
* RU: `Категория` (and `Category`)
* UK: `Категорія` (and `Category`)
* JA: `カテゴリ` (and `Category`)

The script **does not remove** category tags from page text — it only uses them to decide folder placement.

## Risks / Known limitations

### Category-related

* **Template-added categories**: if a category is added indirectly via templates (not as a literal `[[Category:...]]` in the page text), the script may not detect it → page goes to the default folder.
* **Multiple categories**: the script picks the **first** match. If pages contain more than one category, folder placement may be inconsistent.
* **Redirected category names**: if a category name redirects on the website, the “clean version” may display a different canonical category title than the tag in wikitext.

### URL-related

* The script derives the page URL prefix from `--wiki-url`. If you pass a URL from the wrong language branch (e.g., RU URL for an EN dump), the “clean version” links will point to the wrong branch.

### Filenames / collisions

* Page titles are sanitized for Windows-safe filenames. In rare cases, different titles can become the same sanitized name; the script resolves this by appending `__2`, `__3`, etc.

### Content format

* Output content is **wikitext**, not rendered Markdown. The file extension is `.md` for convenience/portability, but the body remains original wikitext by design.

## Output layout example

Without categories:

```
wiki_md/
  Some_Page.md
  Another_Page.md
```

With `--by-category`:

```
wiki_md/
  Lore/
    Some_Page.md
  Mechanics/
    Another_Page.md
  _uncategorized/
    Page_Without_Category.md
```
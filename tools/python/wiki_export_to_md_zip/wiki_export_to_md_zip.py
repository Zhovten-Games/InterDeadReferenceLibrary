#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
MediaWiki (Fandom) XML export -> Markdown files -> ZIP

Rules:
- Extract wikitext from XML; do not modify it.
- Add a footnote (before the page text) with a clean page URL.
- Interactive prompts are in English.

Optional:
- Place files into category folders (category is read from wikitext as [[Category:...]] or localized aliases).
"""

from __future__ import annotations

import argparse
import os
import re
import zipfile
from dataclasses import dataclass
from typing import Dict, Iterable, Optional, List
from urllib.parse import urlparse, quote
import xml.etree.ElementTree as ET


FOOTNOTE_ID = "clean"
DEFAULT_FOLDER_IN_ZIP = "wiki_md"
DEFAULT_ZIP_NAME = "wiki_md.zip"
DEFAULT_UNCATEGORIZED_FOLDER = "_uncategorized"


@dataclass(frozen=True)
class WikiUrlParts:
    root: str          # e.g. https://interdead.fandom.com
    page_prefix: str   # e.g. /wiki or /ru/wiki or /uk/wiki or /ja/wiki


def prompt_non_empty(prompt: str) -> str:
    while True:
        v = input(prompt).strip()
        if v:
            return v
        print("Value cannot be empty. Please try again.")


def prompt_optional(prompt: str) -> str:
    return input(prompt).strip()


def derive_url_parts(wiki_main_url: str) -> WikiUrlParts:
    """
    Accepts a URL like:
      https://interdead.fandom.com/wiki/InterDead_Wiki
      https://interdead.fandom.com/uk/wiki/Main_Page
      https://interdead.fandom.com/ru/wiki/Interdead_%D0%92%D0%B8%D0%BA%D0%B8
      https://interdead.fandom.com/ja/wiki/InterDead_Wiki

    Derives:
      root: https://interdead.fandom.com
      page_prefix: /wiki or /uk/wiki or /ru/wiki or /ja/wiki
    """
    p = urlparse(wiki_main_url.strip())
    if not p.scheme or not p.netloc:
        raise ValueError("Invalid URL: missing scheme or host.")

    root = f"{p.scheme}://{p.netloc}"
    path = p.path or ""

    if "/wiki/" not in path:
        raise ValueError("Invalid URL: expected '/wiki/' to be present in the path.")

    # Remove the last path segment (page title), keep only the wiki prefix.
    # Example: /ru/wiki/Interdead_Вики -> /ru/wiki
    prefix = path.rsplit("/", 1)[0]
    if "/wiki" not in prefix:
        raise ValueError("Could not derive wiki path prefix from the URL.")

    return WikiUrlParts(root=root, page_prefix=prefix)


def make_page_url(parts: WikiUrlParts, title: str) -> str:
    """
    Builds a canonical page URL from title.
    MediaWiki commonly uses underscores in URLs.
    """
    normalized = title.replace(" ", "_")
    encoded = quote(normalized, safe="-_.()~")  # keep minimal safe set
    return f"{parts.root}{parts.page_prefix}/{encoded}"


def sanitize_filename(title: str) -> str:
    """
    Windows-safe filename sanitization.
    Keeps Unicode, replaces forbidden chars, collapses underscores.
    """
    name = title.replace(" ", "_")
    name = re.sub(r'[<>:"/\\|?*\x00-\x1F]', "_", name)
    name = re.sub(r"_+", "_", name).strip("._ ")
    if not name:
        name = "untitled"
    # Avoid pathologically long filenames
    return name[:180]


def sanitize_folder_name(name: str) -> str:
    """
    Similar to sanitize_filename, but intended for folder names inside ZIP.
    """
    name = (name or "").replace(" ", "_")
    name = re.sub(r'[<>:"/\\|?*\x00-\x1F]', "_", name)
    name = re.sub(r"_+", "_", name).strip("._ ")
    if not name:
        name = DEFAULT_UNCATEGORIZED_FOLDER
    return name[:120]


def iter_pages(xml_path: str) -> Iterable[tuple[str, str]]:
    """
    Streams pages out of MediaWiki export XML.
    Returns (title, wikitext).
    Namespace-agnostic: uses wildcard namespace selectors { * }.
    """
    context = ET.iterparse(xml_path, events=("end",))
    for event, elem in context:
        if not elem.tag.endswith("page"):
            continue

        title_el = elem.find("./{*}title")
        if title_el is None or title_el.text is None:
            elem.clear()
            continue
        title = title_el.text

        # Grab the first revision/text (exports usually have 1 revision)
        text_el = elem.find("./{*}revision/{*}text")
        wikitext = ""
        if text_el is not None and text_el.text is not None:
            wikitext = text_el.text

        yield title, wikitext

        elem.clear()


def extract_site_base(xml_path: str) -> Optional[str]:
    """
    Reads <siteinfo><base> from the export, if present.
    """
    context = ET.iterparse(xml_path, events=("end",))
    for event, elem in context:
        if elem.tag.endswith("base"):
            if elem.text:
                return elem.text.strip()
        # siteinfo is near the top; no need to keep elements
        elem.clear()
    return None


def build_md(page_url: str, wikitext: str) -> str:
    """
    Adds a footnote at the very beginning.
    Does not touch the page text.
    """
    header = (
        f"[^{FOOTNOTE_ID}]: Clean version: {page_url}\n"
        f"[^{FOOTNOTE_ID}]\n\n"
    )
    return header + (wikitext or "")


def resolve_zip_path(user_input: str) -> str:
    """
    If the user passes a directory, place DEFAULT_ZIP_NAME inside it.
    If the user passes a file path, ensure it ends with .zip.
    """
    p = os.path.abspath(user_input.strip().strip('"'))
    if os.path.isdir(p):
        return os.path.join(p, DEFAULT_ZIP_NAME)

    # If it doesn't look like a file path with .zip, append .zip
    if not p.lower().endswith(".zip"):
        p = p + ".zip"
    return p


def category_aliases(parts: WikiUrlParts) -> List[str]:
    """
    Fandom/MediaWiki category namespace names by language branch.
    We keep a small practical set and always include 'Category'.
    """
    aliases = ["Category"]
    prefix = parts.page_prefix.lower()

    # RU
    if prefix.startswith("/ru/"):
        aliases.insert(0, "Категория")
    # UK
    if prefix.startswith("/uk/"):
        aliases.insert(0, "Категорія")
    # JA
    if prefix.startswith("/ja/"):
        aliases.insert(0, "カテゴリ")

    # Safety: include the other common Cyrillic forms too (in case of mixed usage)
    for extra in ["Категория", "Категорія", "カテゴリ"]:
        if extra not in aliases:
            aliases.append(extra)

    return aliases


def extract_single_category(wikitext: str, aliases: List[str]) -> Optional[str]:
    """
    Extract the first category from wikitext.
    Matches:
      [[Category:Name]]
      [[Category:Name|SortKey]]
      [[Категория:...]]
      [[Категорія:...]]
      [[カテゴリ:...]]
    Assumes you have at most one meaningful category per page.
    """
    if not wikitext:
        return None

    ns = "|".join(re.escape(a) for a in aliases)
    # Capture name until '|' or ']]'
    pattern = re.compile(r"\[\[\s*(?:" + ns + r")\s*:\s*([^\]\|]+)", re.IGNORECASE)
    m = pattern.search(wikitext)
    if not m:
        return None
    cat = (m.group(1) or "").strip()
    return cat or None


def main() -> int:
    ap = argparse.ArgumentParser(description="Convert MediaWiki XML export to Markdown files and ZIP them.")
    ap.add_argument("--input", help="Path to MediaWiki XML export file (often .xml).")
    ap.add_argument("--wiki-url", help="Wiki main page URL (optional; Enter to auto-use <siteinfo><base>).")
    ap.add_argument("--out-zip", help="Output ZIP file path or folder path.")
    ap.add_argument("--folder-in-zip", default=DEFAULT_FOLDER_IN_ZIP, help="Root folder name inside ZIP.")
    ap.add_argument("--include-empty", action="store_true", help="Include pages with empty <text>.")
    ap.add_argument("--by-category", action="store_true", help="Place pages into folders by single category.")
    ap.add_argument("--category-default", default=DEFAULT_UNCATEGORIZED_FOLDER,
                    help="Folder for pages without category (used with --by-category).")
    args = ap.parse_args()

    print("=== MediaWiki export -> Markdown -> ZIP ===")

    xml_path = args.input or prompt_non_empty("Path to MediaWiki XML export file: ")
    if not os.path.isfile(xml_path):
        print(f"ERROR: File not found: {xml_path}")
        return 2

    wiki_url = args.wiki_url
    if wiki_url is None:
        wiki_url = prompt_optional(
            "Wiki main page URL (optional; Enter to use <siteinfo><base> from export): "
        )

    if not wiki_url:
        base = extract_site_base(xml_path)
        if not base:
            print("ERROR: Could not read <siteinfo><base> from the export; please provide Wiki URL.")
            return 3
        wiki_url = base
        print(f"Using export base URL: {wiki_url}")

    try:
        parts = derive_url_parts(wiki_url)
    except Exception as e:
        print(f"ERROR: Wiki URL is not acceptable: {e}")
        return 4

    out_zip_raw = args.out_zip
    if not out_zip_raw:
        out_zip_raw = prompt_non_empty("Output ZIP path (file or folder; will be overwritten if exists): ")
    out_zip = resolve_zip_path(out_zip_raw)

    out_dir_in_zip = (args.folder_in_zip or DEFAULT_FOLDER_IN_ZIP).strip().strip("/\\") or DEFAULT_FOLDER_IN_ZIP

    # Ensure parent directory exists
    parent_dir = os.path.dirname(out_zip) or "."
    os.makedirs(parent_dir, exist_ok=True)

    counts: Dict[str, int] = {}
    written = 0
    skipped_empty = 0

    aliases = category_aliases(parts)
    default_cat_folder = sanitize_folder_name(args.category_default)

    # Write into ZIP
    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for title, wikitext in iter_pages(xml_path):
            if (not wikitext) and (not args.include_empty):
                skipped_empty += 1
                continue

            page_url = make_page_url(parts, title)
            md = build_md(page_url, wikitext)

            base_name = sanitize_filename(title)
            n = counts.get(base_name, 0)
            counts[base_name] = n + 1

            if n > 0:
                file_name = f"{base_name}__{n+1}.md"
            else:
                file_name = f"{base_name}.md"

            # Root folder in ZIP
            folder = out_dir_in_zip

            # Optional: category subfolder
            if args.by_category:
                cat = extract_single_category(wikitext, aliases)
                cat_folder = sanitize_folder_name(cat) if cat else default_cat_folder
                folder = f"{out_dir_in_zip}/{cat_folder}"

            arcname = f"{folder}/{file_name}"
            zf.writestr(arcname, md)
            written += 1

    print(f"Done. Written pages: {written}. Skipped empty pages: {skipped_empty}.")
    print(f"ZIP saved to: {out_zip}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
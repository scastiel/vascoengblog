# Vasco Engineering blog

A minimal, static, dark-first engineering blog built with [Jekyll](https://jekyllrb.com/).
Posts are hand-authored HTML; the shell (header, footer, theme toggle, styles) is
shared across every page.

## Run locally

```sh
bundle install            # first time only
bundle exec jekyll serve  # → http://127.0.0.1:4000
```

## Add a post

Create `_posts/YYYY-MM-DD-slug.html` — plain HTML with a front-matter header. Jekyll
wraps it in the post layout, so you only write the article body.

```html
---
title: "Your title"
date: 2026-07-07
category_label: Architecture        # mono eyebrow above the title (optional)
summary: One line shown in the Home / Articles lists.
dek: Optional italic standfirst under the title.
---
<h2 id="section-one">A chapter</h2>
<p>Prose…</p>
```

The table of contents is generated automatically from each post's `<h2 id="…">`
headings (add `data-toc-title="Short label"` for a shorter sidebar label). Prev/next
and the Home/Articles lists are derived from post dates.

See [CLAUDE.md](CLAUDE.md) for the full layout, conventions, and prose helpers.

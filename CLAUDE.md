# CLAUDE.md

Guidance for working in this repo.

## What this is

A static, dark-first engineering blog for Vasco, built with **Jekyll 4**. The design
is Swiss/grid, near-brutalist typography (sans headings, serif body, mono metadata),
with a persisted dark/light theme. No CMS, no backend, **no images** — pure typography
by intent. Posts are authored as **HTML files**, not Markdown.

## Local toolchain (important gotcha)

The **system Ruby (2.6) `jekyll` is broken** on this machine — it pulls an x86_64
`google-protobuf` binary (via `jekyll-sass-converter 3.x` → `sass-embedded`) that
can't load on Apple Silicon. Use the **Homebrew Ruby 3.3** toolchain instead:

```sh
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export GEM_HOME="$HOME/.gem/newengblog"
export PATH="$GEM_HOME/bin:$PATH"
bundle exec jekyll build     # or: serve
```

`Gemfile` pins `jekyll-sass-converter` to `~> 2.0` (native `sassc`) to avoid the above.
Editing `_config.yml` requires a server restart; editing templates/assets only needs a
rebuild (`jekyll serve` without `--detach` watches automatically).

## Layout

```
_config.yml            Site config + default author byline (defaults block)
_layouts/default.html  Page shell: <head>, header, footer, JS
_layouts/post.html     Post: head block, TOC aside, prose, prev/next (extends default)
_includes/head.html    Meta, no-flash theme script, inline design tokens, fonts, CSS link
_includes/{header,footer,post-row}.html
assets/css/style.css   All design tokens + every component class
assets/js/blog.js      Theme toggle · external-links-in-new-tab · TOC + scroll-spy
index.html             Home (/)      — most recent posts + about
articles.html          Index (/articles/) — flat chronological list
_posts/*.html          Posts, authored as HTML
```

## Conventions

- **Updating a branch with `main`: always rebase, never merge.** Use `git fetch`
  then `git rebase origin/main` to keep history linear. Do not `git merge origin/main`.
- **Typography.** Post titles (front-matter `title:` and any `<h2>` headings) use
  **Title Case** — capitalize principal words; keep articles, coordinating
  conjunctions, and short prepositions (`a`, `an`, `the`, `and`, `or`, `in`, `of`,
  `on`, `to`, `for`, `or`, …) lowercase unless they're the first/last word. Use
  **typographically correct quotes and apostrophes** everywhere prose is displayed
  (post bodies, `summary`/`dek` front matter): curly apostrophe `’` (`&#8217;`),
  curly double quotes `“…”` (`&#8220;`/`&#8221;`), curly single quotes `‘…’`
  (`&#8216;`/`&#8217;`). Never leave straight `'` or `"` in rendered text. (Em dashes
  are already written as `&#8212;`.)
- **No duplication.** Shared chrome lives in `_includes`/`_layouts`. The design's
  original inline styles were lifted into `assets/css/style.css` as `.vx-*` classes;
  prefer adding/reusing a class over inline styles.
- **Design tokens** are CSS custom properties that flip on `data-theme`
  (`dark`/`light`), inlined in `head.html` with a no-flash script that runs before
  first paint. Theme resolution: a stored `localStorage['vx-theme']` override wins;
  otherwise the OS `prefers-color-scheme` is used (falling back to dark). The header
  button sets the persisted override; `blog.js` also follows live OS changes while no
  override is set.
- **Author byline** is declared per-post in front matter (`author`, `author_role`,
  `author_initials`) — there is no global default author. Setting `author_url` (e.g. a
  LinkedIn profile) renders the author name as a link; being an external host, it opens
  in a new tab via `blog.js`.
- **TOC** is built client-side from `.vx-prose h2[id]` (`blog.js` → `initToc`). Posts
  never restate their own outline. Use `data-toc-title` for a shorter sidebar label.
- **Prev/next** uses Jekyll's `page.previous`/`page.next` (Newer = next, Older = prev).
- **External links** (any host ≠ the site's) open in a new tab with `rel="noopener"`,
  applied in `blog.js`. Internal links stay in the same tab.
- **Careers** links point to `https://jobs.ashbyhq.com/vasco`.
- **Permalinks** are `/articles/:title/` (clean slugs under `/articles/`, no dates
  in the URL), matching the live site at engineering.vasco.app.

## Prose helpers (inside a post body)

- `<p class="lead">` — oversized lead paragraph
- `<p class="vx-eyebrow">` — mono accent kicker above an `<h2>`
- `<blockquote>` — Helvetica pull-quote; `<blockquote class="quote">` — serif-italic
- `<pre><code>` with `<span class="c">` (comment) / `<span class="k">` (keyword)
- `<p class="outro">` — small italic sign-off
- Signature blocks: `.vx-diff` (git-diff timeline) and `.vx-numbers` → `.vx-ngrid` /
  `.vx-stat` (by-the-numbers grid; add `.hero` to one cell for the accent number).
  See the "Four agent frameworks" post for both.

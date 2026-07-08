/* Vasco Engineering blog — the whole interactive surface, kept tiny.
   Behaviors: theme toggle, external links, post TOC + scroll-spy, and
   inline glossary tooltips built from the post's own Glossary section. */
(function () {
  'use strict';

  var docEl = document.documentElement;

  /* --- Theme toggle ------------------------------------------------------ */
  function applyThemeIcon() {
    var t = docEl.getAttribute('data-theme') || 'dark';
    // Glyph shows the mode you'd switch *to*: sun in dark, moon in light.
    var glyph = t === 'light' ? '☾' : '☀';
    var icons = document.querySelectorAll('.vx-theme-icon');
    for (var i = 0; i < icons.length; i++) icons[i].textContent = glyph;
  }

  function toggleTheme() {
    var next = docEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    docEl.setAttribute('data-theme', next);
    try { localStorage.setItem('vx-theme', next); } catch (e) {}
    applyThemeIcon();
  }

  function storedTheme() {
    try {
      var t = localStorage.getItem('vx-theme');
      return (t === 'light' || t === 'dark') ? t : null;
    } catch (e) { return null; }
  }

  // Follow OS theme changes live, unless the user has overridden via the button.
  function watchSystemTheme() {
    if (!window.matchMedia) return;
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      if (storedTheme()) return; // user override wins
      docEl.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      applyThemeIcon();
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange); // older Safari
  }

  /* --- TOC: build from the post's own <h2 id> headings, then scroll-spy -- */
  function initToc() {
    var nav = document.querySelector('[data-toc-nav]');
    var prose = document.querySelector('.vx-prose');
    if (!nav || !prose) return;

    // Skip headings inside the hidden glossary — it's a tooltip source, not a section.
    var headings = [].filter.call(prose.querySelectorAll('h2[id]'), function (h) {
      return !h.closest('.vx-glossary');
    });
    if (!headings.length) {
      // No chapters — drop the whole aside so the grid doesn't reserve space.
      var aside = document.querySelector('.vx-toc');
      if (aside) aside.style.display = 'none';
      return;
    }

    var links = [];
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.setAttribute('data-toc', h.id);
      a.textContent = h.getAttribute('data-toc-title') || h.textContent;
      nav.appendChild(a);
      links.push(a);
    }

    function setActive(id) {
      for (var j = 0; j < links.length; j++) {
        var on = links[j].getAttribute('data-toc') === id;
        links[j].classList.toggle('is-active', on);
      }
    }

    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (vis.length) setActive(vis[0].target.id);
    }, { rootMargin: '-90px 0px -65% 0px', threshold: 0 });

    for (var k = 0; k < headings.length; k++) io.observe(headings[k]);
    setActive(headings[0].id);
  }

  /* --- Glossary tooltips ------------------------------------------------- */
  /* Reads the post's own "#glossary" section and, for each entry, decorates
     the first in-body occurrence of the term with a hover/focus tooltip.
     The visible Glossary section stays as the canonical list / no-JS fallback. */
  function initGlossary() {
    var prose = document.querySelector('.vx-prose');
    if (!prose) return;
    var heading = prose.querySelector('#glossary');
    if (!heading) return;

    // Collect entries from the <p><strong>Term</strong>: definition</p> rows
    // that follow the Glossary heading (until the next section, if any).
    var entries = [];
    var node = heading.nextElementSibling;
    for (; node; node = node.nextElementSibling) {
      if (/^H[1-4]$/.test(node.tagName)) break;      // next section starts
      if (node.tagName !== 'P') continue;
      var strong = node.querySelector('strong');
      if (!strong) continue;
      var label = strong.textContent.trim();
      var def = node.textContent.slice(strong.textContent.length)
        .replace(/^\s*[:：]\s*/, '').trim();
      // Match on the short form (text before a parenthetical expansion).
      var term = label.replace(/\s*\(.*$/, '').trim();
      if (!term) continue;
      entries.push({ term: term, label: label, def: def });
    }
    if (!entries.length) return;

    // Longer terms first so multi-word phrases win over their substrings.
    entries.sort(function (a, b) { return b.term.length - a.term.length; });

    // Skip nodes whose meaning would be broken by wrapping, plus everything
    // inside the Glossary section itself (it *follows* the heading in the DOM).
    var SKIP = { A: 1, CODE: 1, PRE: 1, H1: 1, H2: 1, H3: 1, H4: 1,
                 BLOCKQUOTE: 1 };
    function skipNode(text) {
      for (var el = text.parentNode; el && el !== prose; el = el.parentNode) {
        if (SKIP[el.tagName]) return true;
        if (el.classList && (el.classList.contains('vx-term') ||
            el.classList.contains('vx-diff') ||
            el.classList.contains('vx-numbers') ||
            el.classList.contains('vx-eyebrow'))) return true;
      }
      // DOCUMENT_POSITION_FOLLOWING => node comes after the heading.
      if (heading.compareDocumentPosition(text) & 4) return true;
      return false;
    }

    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); }

    // Place the (fixed-position) tip near its term, clamped to the viewport.
    var GAP = 10, MARGIN = 12, openTip = null;
    function placeTip(term, tip) {
      var tr = term.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var vw = document.documentElement.clientWidth, vh = window.innerHeight;
      var centerX = tr.left + tr.width / 2;
      var left = Math.max(MARGIN, Math.min(centerX - tw / 2, vw - tw - MARGIN));
      var top = tr.top - th - GAP, below = false;
      if (top < MARGIN) { top = tr.bottom + GAP; below = true; } // flip under
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
      tip.style.setProperty('--arrow-x', (centerX - left) + 'px');
      tip.classList.toggle('below', below);
    }
    function open(term, tip) { openTip = tip; placeTip(term, tip); tip.classList.add('is-open'); }
    function close(tip) { tip.classList.remove('is-open'); if (openTip === tip) openTip = null; }
    // A fixed tip would detach from its term on scroll — just dismiss it.
    window.addEventListener('scroll', function () { if (openTip) close(openTip); }, true);

    entries.forEach(function (entry) {
      // Whitespace-flexible, allow a trailing plural "s", word-bounded.
      var pattern = esc(entry.term).replace(/\s+/g, '\\s+');
      var re = new RegExp('\\b' + pattern + 's?\\b', 'i');

      var walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, null);
      var text;
      while ((text = walker.nextNode())) {
        if (skipNode(text)) continue;
        var m = re.exec(text.nodeValue);
        if (!m) continue;

        var after = text.splitText(m.index);
        after.nodeValue = after.nodeValue.slice(m[0].length);

        var span = document.createElement('span');
        span.className = 'vx-term';
        span.setAttribute('tabindex', '0');
        span.textContent = m[0];

        var tip = document.createElement('span');
        tip.className = 'vx-tip';
        tip.setAttribute('role', 'tooltip');
        var termEl = document.createElement('span');
        termEl.className = 'vx-tip-term';
        termEl.textContent = entry.label;
        tip.appendChild(termEl);
        tip.appendChild(document.createTextNode(entry.def));
        span.appendChild(tip);

        (function (s, tp) {
          s.addEventListener('mouseenter', function () { open(s, tp); });
          s.addEventListener('mouseleave', function () { close(tp); });
          s.addEventListener('focus', function () { open(s, tp); });
          s.addEventListener('blur', function () { close(tp); });
        })(span, tip);

        after.parentNode.insertBefore(span, after);
        break; // only the first occurrence of each term
      }
    });
  }

  /* --- Boot -------------------------------------------------------------- */
  function init() {
    applyThemeIcon();

    var toggles = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < toggles.length; i++) toggles[i].addEventListener('click', toggleTheme);

    watchSystemTheme();

    // Open external links (anything off this site) in a new tab.
    var externals = document.querySelectorAll('a[href^="http"]');
    for (var k = 0; k < externals.length; k++) {
      if (externals[k].hostname !== window.location.hostname) {
        externals[k].target = '_blank';
        externals[k].rel = 'noopener';
      }
    }

    initToc();
    initGlossary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

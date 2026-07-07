/* Vasco Engineering blog — the whole interactive surface, kept tiny.
   Three behaviors: theme toggle, copy-link, and post TOC + scroll-spy. */
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

    var headings = prose.querySelectorAll('h2[id]');
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

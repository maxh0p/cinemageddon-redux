// ==UserScript==
// @name         Cinemageddon Redux
// @namespace    cg-redux
// @description  Modern frontend rework for cinemageddon.net, rendered from the legacy server HTML
// @version      0.23.8
// @author       maxh0p
// @license      MIT
// @icon         https://cinemageddon.net/favicon.ico
// @homepageURL  https://github.com/maxh0p/cinemageddon-redux
// @supportURL   https://github.com/maxh0p/cinemageddon-redux/issues
// @downloadURL  https://raw.githubusercontent.com/maxh0p/cinemageddon-redux/main/cg-redux.user.js
// @updateURL    https://raw.githubusercontent.com/maxh0p/cinemageddon-redux/main/cg-redux.user.js
// @match        https://cinemageddon.net/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      v3.sg.media-imdb.com
// @connect      letterboxd.com
// ==/UserScript==

(function () {
  'use strict';

  // Pages we take over. Anything not listed renders as the legacy site.
  const ROUTES = {
    '/browse.php': renderBrowse,
    '/userdetails.php': renderUser,
    '/details.php': renderDetails,
    '/': renderIndex,
    '/index.php': renderIndex,
    '/credits.php': renderCredits,
    '/viewrequests.php': renderRequests,
    '/randomtrailer.php': renderTrailer,
    '/featurama.php': renderFeaturama,
    '/competitions.php': renderCompetitions,
    '/stats.php': renderStats,
    '/ranks.php': renderRanks,
    '/invite.php': renderInvite,
    '/chat.php': renderIrc,
    '/topten.php': renderTopTen,
    '/cocks/showpage.php': renderCocksPage,
    '/cocks/index.php': renderCocksIndex,
    '/cocks/': renderCocksIndex,
    '/cocks/notawiki.php': renderCocksList,
    '/login.php': renderLogin,
    '/signup.php': renderSignup,
    '/users.php': renderUsers,
    '/staff.php': renderStaff,
    '/log.php': renderSiteLog,
    '/helpdesk.php': renderHelpdesk,
    '/bookmarks.php': renderBookmarks,
    '/friends.php': renderFriends,
    '/myreseeds.php': renderReseeds,
    '/polls.php': renderPolls,
    '/help/index.php': renderHelp,
    '/help/': renderHelp,
    '/cocks/subscriptions.php': renderCocksSubs,
    '/cocks/endoscope.php': renderCocksScope,
    '/upload.php': renderUpload,
    '/my.php': renderEditProfile,
    '/forums.php': renderForums,
    '/messages.php': renderMessages,
    '/inbox.php': renderMessages,
    '/sendmessage.php': renderSendMessage,
    '/viewsnatches.php': renderSnatches,
    '/comment.php': renderCommentComposer,
    '/cigars.php': renderCigars,
    '/tags.php': renderTags,
    '/smilies.php': renderSmilies,
    '/donate.php': renderHelpArticle,
  };

  ROUTES['/testconnect.php'] = renderHelpArticle;
  const route =
    ROUTES[location.pathname] ||
    (location.pathname.startsWith('/help/') ? renderHelpArticle : undefined);

  /* --------------------------------- themes ---------------------------------- */
  // Every themeable value is a custom property on #cg-redux-root, so a scheme is
  // just a different set of them and switching is one attribute flip. Declared up
  // here because the pre-render cloak needs the background colour before anything
  // else runs.
  //
  // Roles, so new schemes stay coherent:
  //   bg/panel/panel2  three surface depths, back to front
  //   text/muted/faint three text weights
  //   accent/accent2   the brand pair (accent2 is the link/hover colour)
  //   onAccent         ink that sits ON an accent-filled surface
  //   lineSoft/line/lineStrong  borders, quietest to loudest
  //   hair/hairStrong/wash      overlays that tint whatever is beneath them
  //   sink             recessed strips (post headers), backdrop = modal scrim
  //   tile             filter applied to CG's /pic/bg.png stripe texture

  const THEMES = {
    warm: {
      label: 'Warm',
      scheme: 'dark',
      bg: '#171512', panel: '#262320', panel2: '#2f2b26',
      text: '#e8e6e1', muted: '#9a9890', faint: '#7b7466',
      accent: '#f0a028', accentRgb: '240, 160, 40', accent2: '#ffbe55', onAccent: '#171512',
      green: '#7dc46a', greenRgb: '125, 196, 106', red: '#e06c5a', redRgb: '224, 108, 90',
      lineSoft: '#322e28', line: '#3b362e', lineStrong: '#4a443a', lineHard: '#000',
      hover: '#35312a',
      hair: 'rgba(255, 255, 255, 0.06)', hairStrong: 'rgba(255, 255, 255, 0.1)', wash: 'rgba(255, 255, 255, 0.025)',
      sink: 'rgba(0, 0, 0, 0.22)', backdrop: 'rgba(13, 12, 10, 0.86)',
      shadow: '0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 22px rgba(0, 0, 0, 0.22)',
      shadowLg: '0 18px 44px rgba(0, 0, 0, 0.6)',
      sbThumb: '#4a443a', sbTrack: '#1f1d19',
      // sepia+saturate warm the neutral-grey tile to match the brown theme
      tile: 'brightness(0.45) sepia(0.6) saturate(1.15)',
    },
    cold: {
      label: 'Cold',
      scheme: 'dark',
      bg: '#0f1013', panel: '#17181c', panel2: '#1f2126',
      text: '#e6e7ea', muted: '#94979f', faint: '#70747d',
      accent: '#f0a028', accentRgb: '240, 160, 40', accent2: '#ffbe55', onAccent: '#0f1013',
      green: '#57c877', greenRgb: '87, 200, 119', red: '#f0655d', redRgb: '240, 101, 93',
      lineSoft: '#23252b', line: '#2b2e35', lineStrong: '#3a3e48', lineHard: '#000',
      hover: '#24262d',
      hair: 'rgba(255, 255, 255, 0.06)', hairStrong: 'rgba(255, 255, 255, 0.1)', wash: 'rgba(255, 255, 255, 0.025)',
      sink: 'rgba(0, 0, 0, 0.25)', backdrop: 'rgba(9, 10, 13, 0.86)',
      shadow: '0 1px 2px rgba(0, 0, 0, 0.45), 0 8px 22px rgba(0, 0, 0, 0.25)',
      shadowLg: '0 18px 44px rgba(0, 0, 0, 0.62)',
      sbThumb: '#3a3e48', sbTrack: '#131418',
      tile: 'brightness(0.4) saturate(0.6)',
    },
  };
  const DEFAULT_THEME = 'warm';

  // Read straight from localStorage rather than store.get() — this runs at
  // document-start, before store is initialised.
  function themeName() {
    try {
      const v = JSON.parse(localStorage.getItem('cgx:theme'));
      if (v === 'classic') return 'warm'; // short-lived 0.23.x keys
      if (v === 'modern') return 'cold';
      if (v && THEMES[v]) return v;
    } catch {}
    return DEFAULT_THEME;
  }
  const theme = THEMES[themeName()];

  // Cloak the page pre-render so the legacy UI never flashes. Hiding <body>
  // (not <html>) keeps the html background painting, so the interstitial is
  // theme-coloured instead of a white flash.
  const cloak = document.createElement('style');
  cloak.id = 'cg-cloak';
  cloak.textContent = `html{background:${theme.bg} !important}html>body{visibility:hidden !important}`;
  if (route) document.documentElement.appendChild(cloak);

  function uncloak() {
    cloak.remove();
    // Signal for external cloaks (e.g. a Stylus style hiding the page until
    // the redux render lands): html:not([data-cgx-ready]) body { ... }
    document.documentElement.setAttribute('data-cgx-ready', '1');
  }

  function main() {
    // Logged out, any routed URL can come back as the login page or the
    // public welcome page — detect both by shape and render accordingly.
    // (The login form specifically posts to takelogin.php; matching on any
    // password form would misfire on signup/profile pages.)
    const loggedOut = !document.querySelector('a[href*="logout"]');
    const loginForm = [...document.forms].find(
      (f) => /takelogin/i.test(f.getAttribute('action') || '') && f.querySelector('input[type="password"]')
    );
    let handler = route;
    if (loggedOut && loginForm) handler = renderLogin;
    else if (loggedOut && /you are logged out/i.test(txt(document.body))) handler = renderWelcome;
    if (!handler) return uncloak();
    try {
      handler(document);
    } catch (err) {
      // Parser broke (markup changed / unusual page variant): fall back to legacy UI.
      console.warn('[cg-redux] falling back to legacy UI:', err);
      const root = document.getElementById('cg-redux-root');
      if (root) root.remove();
      const style = document.getElementById('cg-redux-style');
      if (style) style.remove();
    }
    uncloak();
  }

  /* ---------------------------------- utils ---------------------------------- */

  const txt = (node) => (node ? node.textContent.trim().replace(/\s+/g, ' ') : '');

  // BR-separated text lines. textContent-based on purpose: we parse while the page
  // is cloaked (visibility:hidden), where innerText returns empty strings.
  function lines(node) {
    const out = [''];
    (function walk(n) {
      for (const ch of n.childNodes) {
        if (ch.nodeName === 'BR') out.push('');
        else if (ch.nodeType === Node.TEXT_NODE) out[out.length - 1] += ch.textContent;
        else walk(ch);
      }
    })(node);
    return out.map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
  }

  // el('div', {class: 'x', onclick: fn}, child, 'text', ...)
  const plural = (n, word) => `${n} ${word}${+n === 1 ? '' : 's'}`;
  // Fix legacy "(s)" laziness: "18 Seeder(s)" → "18 seeders", "1 peer(s)" → "1 peer".
  const smartPlurals = (text) => text.replace(/(\d+)\s*([A-Za-z]+)\(s\)/g, (m, n, w) => plural(n, w.toLowerCase()));
  // "18 seeder(s), 0 leecher(s) = 18 peer(s) total" → "18 seeders · 0 leechers"
  const smartPeers = (text) => {
    const s = (text.match(/(\d+)\s*seeder/i) || [])[1];
    const l = (text.match(/(\d+)\s*leecher/i) || [])[1];
    return s != null && l != null ? plural(s, 'seeder') + ' · ' + plural(l, 'leecher') : smartPlurals(text);
  };

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const child of children.flat()) {
      if (child == null) continue;
      node.append(child.nodeType ? child : document.createTextNode(child));
    }
    return node;
  }

  /* --------------------------------- parsers --------------------------------- */

  function parseTorrentRow(tr) {
    const c = tr.cells;
    if (!c || c.length < 9) return null;
    const detailsLink = c[1].querySelector('a[href*="details.php"]');
    if (!detailsLink) return null;

    const catImg = c[0].querySelector('img');
    const sub = c[1].querySelector('font');
    const dateParts = lines(c[3]);
    const sizeParts = lines(c[4]);

    // "Title [Country] [Year/Rip/...]" → name + bracket tags
    const raw = txt(detailsLink);
    const tagMatch = raw.match(/^(.*?)\s*(\[.+)$/);
    const tags = tagMatch
      ? (tagMatch[2].match(/\[([^\]]+)\]/g) || []).map((t) => t.slice(1, -1))
      : [];

    // Bonus torrents carry a spinning-coin gif (pic/golden3.gif, golden4.gif, …)
    // whose alt/title holds the amount, e.g. "40% bonus".
    const bonusImg = c[1].querySelector('img[src*="golden"]');
    const bonus = bonusImg
      ? (bonusImg.getAttribute('alt') || bonusImg.getAttribute('title') || '').trim() || 'bonus'
      : null;

    const imdbHref = c[1].querySelector('a[href*="imdb"]')?.href;
    const imdbId = imdbHref ? (imdbHref.match(/tt\d+/) || [])[0] : null;
    const bookmarkLink = c[1].querySelector('a[href*="bookmark.php"]');

    return {
      id: Number((detailsLink.getAttribute('href').match(/id=(\d+)/) || [])[1] || 0),
      snatchedByUser: tr.classList.contains('torrenttable_usersnatched'),
      bonus,
      title: tagMatch ? tagMatch[1] : raw,
      tags,
      subtitle: txt(sub),
      href: detailsLink.href,
      download: c[1].querySelector('a[href*="download.php"]')?.href,
      imdb: imdbHref,
      imdbId,
      letterboxd: imdbId ? `https://letterboxd.com/imdb/${imdbId}/` : null,
      bookmark: bookmarkLink?.href,
      bookmarkEl: bookmarkLink,
      bookmarked: /remove|del/i.test(
        (bookmarkLink?.querySelector('img')?.alt || '') + (bookmarkLink?.getAttribute('href') || '')
      ),
      cgSearch: c[1].querySelector('a[href*="browse.php?search="]')?.href,
      forumSearch: c[1].querySelector('a[href*="forums.php"]')?.href,
      category: catImg?.title || catImg?.alt || '',
      catIcon: catImg?.src,
      comments: txt(c[2]),
      date: dateParts[0] || '',
      time: dateParts[1] || '',
      size: sizeParts[0] || '',
      files: sizeParts[1] || '',
      snatched: txt(c[5]),
      seeders: txt(c[6]),
      leechers: txt(c[7]),
      upper: txt(c[8]),
    };
  }

  function parseBrowse(doc) {
    const tables = [...doc.querySelectorAll('table.torrenttable')];
    const mainTable = tables[tables.length - 1];
    const featuredTable = tables.length > 1 ? tables[0] : null;
    const parseTable = (t) =>
      t ? [...t.rows].map(parseTorrentRow).filter(Boolean) : [];

    // Pagination links (keep original hrefs)
    const pageLinks = [...doc.querySelectorAll('a[href*="page="]')]
      .filter((a) => /^[\d\s\-,]+$|prev|next/i.test(a.textContent))
      .map((a) => ({ label: txt(a).replace(/[<>]/g, '').trim(), href: a.href }));
    const seen = new Set();
    const pages = pageLinks.filter((p) => !seen.has(p.label) && seen.add(p.label));

    // Legacy forms — our UI drives these, so search/filter behavior is identical.
    // The search field must come from the form that ALSO holds the filter
    // checkboxes (the main browse form) — the sidebar site-search form matches
    // `elements.search` too, and submitting that one drops every filter.
    const searchForm =
      [...doc.forms].find((f) => f.elements.search && [...f.elements].some((e) => e.type === 'checkbox')) ||
      [...doc.forms].find((f) => f.elements.search);
    const filterForm = [...doc.forms].find((f) =>
      [...f.elements].some((e) => e.type === 'checkbox')
    );
    const filters = filterForm
      ? [...filterForm.elements]
          .filter((e) => e.type === 'checkbox')
          .map((box) => ({
            box,
            label: txt(box.nextElementSibling) || box.name,
            // Legacy groups these as "Category filter:" / "Show only:"; the
            // odd one out is `descr` ("Also search descriptions?"), which
            // belongs with the search box, not the filters.
            group: /^c\d+$/.test(box.name) ? 'category' : box.name === 'descr' ? 'search' : 'show',
          }))
      : [];

    // Sort links live in the main table's header row — text links (Name,
    // Added, Size) plus icon-only columns whose meaning is in the img alt.
    const SORT_ALIASES = { favourited: 'Bookmarked', completed: 'Snatched' };
    const sorts = mainTable
      ? [...mainTable.rows[0].querySelectorAll('a')]
          .map((a) => {
            let label = txt(a) || a.querySelector('img')?.alt || '';
            label = SORT_ALIASES[label.toLowerCase()] || label;
            return { label, href: a.href };
          })
          .filter((s) => s.label)
      : [];

    // Featured refresh countdown — legacy renders it as static text in the
    // heading above the featured table ("… Next update in 23h 13m 48s.").
    // Matched against the smallest element in the document that still contains
    // the phrase, rather than the featured table's previous sibling: the note
    // has moved around inside legacy's markup before, and losing the countdown
    // to a stray wrapper element is the failure mode we keep hitting.
    let featuredNote = '';
    let featuredEta = null;
    const noteHost = [...doc.querySelectorAll('td, div, p, b, font, span, h1, h2')]
      .filter((n) => /next update in/i.test(n.textContent || ''))
      .pop();
    if (noteHost) {
      featuredNote = txt(noteHost);
      // Should the phrase ever land in a big wrapper, keep only the countdown
      // sentence and the one before it (that's where the "50% bonus" lives).
      if (featuredNote.length > 220) {
        const parts = featuredNote.split(/(?<=\.)\s+/);
        const i = parts.findIndex((s) => /next update in/i.test(s));
        if (i >= 0) featuredNote = parts.slice(Math.max(0, i - 1), i + 1).join(' ').trim();
      }
      const m = featuredNote.match(
        /next update in\s+(?:(\d+)\s*d\w*\s*)?(?:(\d+)\s*h\w*\s*)?(?:(\d+)\s*m\w*\s*)?(?:(\d+)\s*s\w*)?/i
      );
      if (m && (m[1] || m[2] || m[3] || m[4]))
        featuredEta = +(m[1] || 0) * 86400 + +(m[2] || 0) * 3600 + +(m[3] || 0) * 60 + +(m[4] || 0);
    }

    return {
      featured: parseTable(featuredTable),
      featuredNote,
      featuredEta,
      torrents: parseTable(mainTable),
      sorts,
      pages,
      searchForm,
      filters,
      filterForm,
    };
  }

  function parseUserBar(doc) {
    const logout = doc.querySelector('a[href*="logout"]');
    const bar = logout ? logout.closest('div, td, p') : null;
    if (!bar) return null;
    const text = txt(bar);
    const get = (re) => (text.match(re) || [])[1] || '';

    const userLink = bar.querySelector('a[href*="userdetails.php"]');
    const creditsLink = bar.querySelector('a[href*="credits.php"]');
    const donorImg = bar.querySelector('img[alt*="Donated" i], img[title*="Donated" i]');
    const pmLink = [...bar.querySelectorAll('a')].find((a) => /message|pm|inbox/i.test(a.getAttribute('href') || ''));

    // Seeding/leeching counts follow their marker icons as text/bold nodes.
    const numAfter = (img) => {
      let n = img && img.nextSibling;
      while (n) {
        const t = (n.textContent || '').trim();
        if (t) return t;
        n = n.nextSibling;
      }
      return '';
    };

    return {
      name: txt(userLink),
      profile: userLink?.href,
      klass: get(/\(([^)]+)\)/),
      donor: donorImg ? donorImg.title || donorImg.alt : '',
      credits: txt(creditsLink),
      creditsHref: creditsLink?.href,
      ratio: get(/r:\s*([^\s|]+)/i),
      up: get(/u:\s*([\d.,]+\s*[a-z]{1,3})/i),
      down: get(/d:\s*([\d.,]+\s*[a-z]{1,3})/i),
      seeding: numAfter(bar.querySelector('img[alt*="seed" i], img[title*="seed" i]')),
      leeching: numAfter(bar.querySelector('img[alt*="leech" i], img[title*="leech" i]')),
      pm: txt(pmLink) || get(/pm:\s*(\d+)/i),
      pmHref: pmLink?.href,
      pmNew: get(/\((\d+)\s*new\)/i),
      logoutHref: logout.href,
    };
  }

  /* --------------------------------- render ---------------------------------- */

  // The legacy sidebar: td.colhead cells are section headers with plain links
  // between them, plus the site-wide search form. Parsed, not hardcoded, so
  // dynamic labels (counters, subscriptions) carry over.
  function parseSidebar(doc) {
    const candidates = [...doc.querySelectorAll('td')].filter((cell) => {
      const t = cell.textContent || '';
      return (
        t.includes('Community') &&
        t.includes('Torrents') &&
        t.includes('Personal') &&
        cell.querySelectorAll('a').length > 10
      );
    });
    const holder = candidates.pop(); // document order puts the deepest matching cell last
    if (!holder) return { sections: [], form: null };
    const sections = [];
    let current = null;
    for (const node of holder.querySelectorAll('td.colhead, a')) {
      if (node.classList.contains('colhead')) {
        current = { title: txt(node), links: [] };
        sections.push(current);
      } else if (current) {
        const label = txt(node);
        if (label) current.links.push({ label, href: node.href });
      }
    }
    return { sections: sections.filter((s) => s.links.length), form: holder.querySelector('form') };
  }

  function buildSidebar(doc) {
    const { sections, form } = parseSidebar(doc);

    let searchBlock = null;
    if (form && form.elements.search) {
      const input = el('input', { class: 'cgx-side-search', type: 'search', placeholder: 'Site search…' });
      const select = el(
        'select',
        { class: 'cgx-side-select' },
        [...(form.elements.cat?.options || [])].map((o) => el('option', { value: o.value }, o.textContent))
      );
      const go = () => {
        form.elements.search.value = input.value;
        if (form.elements.cat) form.elements.cat.value = select.value;
        form.submit();
      };
      input.addEventListener('keydown', (e) => e.key === 'Enter' && go());
      searchBlock = el(
        'div',
        { class: 'cgx-side-section' },
        el('h3', {}, 'Search'),
        input,
        select,
        el('button', { class: 'cgx-btn primary', type: 'button', onclick: go }, 'Search')
      );
    }

    // Several sidebar links can share a path — Browse is /browse.php and My
    // Uploads is /browse.php?owner=<id>. Score every link and highlight only
    // the best match, so the specific link wins instead of the bare one.
    //   3 = same path, same query   2 = same path, link's params are a subset
    //   1 = same path, link has no query at all
    // `page` is dropped from both sides: paging through My Uploads is still
    // My Uploads.
    const hereParams = new URLSearchParams(location.search);
    hereParams.delete('page');
    const score = (href) => {
      let u;
      try {
        u = new URL(href);
      } catch {
        return 0;
      }
      if (u.pathname !== location.pathname) return 0;
      const mine = new URLSearchParams(u.search);
      mine.delete('page');
      const keys = [...mine.keys()];
      if (!keys.length) return 1;
      if (!keys.every((k) => hereParams.get(k) === mine.get(k))) return 0;
      return keys.length === [...hereParams.keys()].length ? 3 : 2;
    };
    const scored = sections.map((s) => s.links.map((l) => score(l.href)));
    const best = Math.max(0, ...scored.flat());

    const aside = el(
      'aside',
      { class: 'cgx-sidebar' },
      sections.map((s, si) =>
        el(
          'div',
          { class: 'cgx-side-section' },
          el('h3', {}, s.title),
          s.links.map((l, li) =>
            el('a', { class: 'cgx-side-link' + (best && scored[si][li] === best ? ' active' : ''), href: l.href }, l.label)
          )
        )
      ),
      searchBlock
    );

    // The sidebar is its own scroll container, so a link far down the list can
    // land out of sight. Nudge it into view by setting scrollTop directly —
    // scrollIntoView() would drag the whole window along with it.
    requestAnimationFrame(() => {
      const active = aside.querySelector('.cgx-side-link.active');
      if (!active) return;
      const pad = 24;
      const top = active.offsetTop - aside.clientHeight / 2 + active.offsetHeight / 2;
      if (active.offsetTop < aside.scrollTop + pad || active.offsetTop + active.offsetHeight > aside.scrollTop + aside.clientHeight - pad) {
        aside.scrollTop = Math.max(0, top);
      }
    });
    return aside;
  }

  // Radiation trefoil (the mark from CG's logo) as an inline SVG; colored via
  // currentColor so CSS decides. innerHTML because el() can't create SVG-ns nodes.
  function radMark(cls) {
    const wrap = el('span', { class: 'cgx-rad' + (cls ? ' ' + cls : '') });
    wrap.innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor">' +
      '<circle cx="50" cy="50" r="11"/>' +
      '<path d="M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z"/>' +
      '<path d="M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z" transform="rotate(120 50 50)"/>' +
      '<path d="M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z" transform="rotate(240 50 50)"/>' +
      '</g></svg>';
    return wrap;
  }

  // Envelope for the PM chip — the ✉ glyph it replaces rendered tiny and
  // inconsistently (it's emoji-presentation on some platforms, text on others).
  function mailMark(unread) {
    const wrap = el('span', { class: 'cgx-mail' + (unread ? ' unread' : '') });
    wrap.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>' +
      '<path d="M3 7l8.1 5.6a1.6 1.6 0 0 0 1.8 0L21 7"/>' +
      '</svg>';
    return wrap;
  }

  // Scheme picker. Swapping themes means re-emitting the whole stylesheet
  // (the values are baked in, not layered), so it just stores and reloads.
  function themeMenu() {
    const current = themeName();
    const menu = el('details', { class: 'cgx-theme-menu' });
    menu.append(
      el('summary', { class: 'cgx-stat', title: `Colour scheme — ${THEMES[current].label}` }, '◐'),
      el(
        'div',
        { class: 'cgx-theme-list' },
        Object.entries(THEMES).map(([key, t]) =>
          el(
            'button',
            {
              class: 'cgx-theme-opt' + (key === current ? ' on' : ''),
              type: 'button',
              onclick: () => {
                store.set('theme', key);
                location.reload();
              },
            },
            el('span', { class: 'sw', style: `background: ${t.panel}; border-color: ${t.accent}` }),
            t.label
          )
        )
      )
    );
    // Click-away close, so the list doesn't linger once you've moved on.
    document.addEventListener('click', (e) => {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    return menu;
  }

  // The topbar wraps to a second row on narrow windows; the sidebar's sticky
  // offset and max-height are derived from its real height rather than a
  // guess, so nothing ends up parked below the fold.
  function armTopbarHeight(root, topbar) {
    // offsetHeight, not getBoundingClientRect(): the root's zoom: 1.1 scales
    // the rect but not offsetHeight, and `top:`/`calc()` want unzoomed px.
    const sync = () => root.style.setProperty('--topbar-h', topbar.offsetHeight + 'px');
    sync();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sync).observe(topbar);
    else addEventListener('resize', sync);
  }

  function renderShell(doc, pageContent) {
    const user = parseUserBar(doc);
    rememberHelpLinks(doc);
    const navOpen = store.get('sidebarOpen', true);
    const root = el(
      'div',
      { id: 'cg-redux-root', 'data-cgx-version': '0.23.8', class: navOpen ? null : 'nav-closed' },
      el(
        'header',
        { class: 'cgx-topbar' },
        el(
          'button',
          {
            class: 'cgx-btn icon ghost cgx-nav-toggle',
            type: 'button',
            title: 'Toggle sidebar',
            onclick: () => {
              const closed = root.classList.toggle('nav-closed');
              store.set('sidebarOpen', !closed);
            },
          },
          '☰'
        ),
        el('a', { class: 'cgx-brand', href: '/' }, radMark(), 'CINEMA', el('span', {}, 'GEDDON')),
        el(
          'div',
          { class: 'cgx-user' },
          !user
            ? null
            : [
                el(
                  'a',
                  { class: 'cgx-stat', href: user.profile, title: user.donor || null },
                  el('span', { class: 'cgx-user-name' }, user.name + (user.donor ? ' ♥' : '')),
                  user.klass ? el('span', { class: 'cgx-user-class' }, user.klass) : null
                ),
                user.ratio
                  ? el(
                      'span',
                      { class: 'cgx-stat ' + (parseFloat(user.ratio) >= 1 ? 'good' : 'bad'), title: 'Ratio' },
                      el('span', { class: 'lbl' }, 'ratio'),
                      el('span', { class: 'val' }, user.ratio)
                    )
                  : null,
                user.up
                  ? el(
                      'span',
                      { class: 'cgx-stat', title: 'Uploaded / downloaded' },
                      el('span', { class: 'up' }, '▲'),
                      el('span', { class: 'val' }, user.up),
                      el('span', { class: 'down' }, '▼'),
                      el('span', { class: 'val' }, user.down)
                    )
                  : null,
                user.seeding || user.leeching
                  ? el(
                      'span',
                      { class: 'cgx-stat', title: 'Seeding / leeching' },
                      el('span', { class: 'up' }, '⇈'),
                      el('span', { class: 'val' }, user.seeding || '0'),
                      el('span', { class: 'down' }, '⇊'),
                      el('span', { class: 'val' }, user.leeching || '0')
                    )
                  : null,
                user.credits
                  ? el(
                      'a',
                      { class: 'cgx-stat', href: user.creditsHref, title: 'Credits' },
                      el('span', { class: 'lbl' }, 'credits'),
                      el('span', { class: 'val' }, user.credits)
                    )
                  : null,
                user.pm
                  ? el(
                      'a',
                      { class: 'cgx-stat cgx-pm', href: user.pmHref || '/message.php', title: 'Private messages' },
                      mailMark(Number(user.pmNew) > 0),
                      el('span', { class: 'val' }, user.pm),
                      Number(user.pmNew) > 0 ? el('span', { class: 'cgx-pm-badge' }, user.pmNew + ' new') : null
                    )
                  : null,
                // Scheme picker sits with the pills; logout stays the last item.
                themeMenu(),
                el('a', { href: user.logoutHref, class: 'cgx-logout' }, 'logout'),
              ],
          // The picker belongs to the reader, not the session, so logged-out
          // pages (login/welcome) still get one.
          user ? null : themeMenu()
        )
      ),
      el('div', { class: 'cgx-body' }, buildSidebar(doc), el('main', { class: 'cgx-main' }, pageContent))
    );

    injectStyles();
    doc.body.appendChild(root);
    armTopbarHeight(root, root.querySelector('.cgx-topbar'));
    armImageSpinners(root);
    armImgurProxy(root);
    armExternalLinks(root);
    armSpoilers(root); // catch-all for clones that skipped legacyEmbed (idempotent — armed links lose their href)
  }

  // Off-site links open in a new tab. Click delegation catches anchors added
  // at any point (embeds, async refills) without watching the whole tree;
  // non-http protocols (stremio://) are left alone — target=_blank on those
  // would spawn a blank tab beside the app prompt.
  function armExternalLinks(root) {
    root.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      try {
        const u = new URL(a.href, location.href);
        if (/^https?:$/.test(u.protocol) && u.origin !== location.origin) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
      } catch {}
    });
  }

  // imgur is ISP-blocked in the UK; imgup.uk relays i.imgur.com images from
  // Germany (the useful core of the imgur_unblock_via_imgup_uk extension —
  // its toggle/stats/declarativeNetRequest plumbing isn't needed here).
  function imgurProxyUrl(url) {
    if (!url || url.includes('imgup.uk') || !/(^|\/\/)i\.imgur\.com\//i.test(url)) return url;
    const abs = url.replace(/^\/\//, 'https://').replace(/^http:\/\//i, 'https://');
    return 'https://imgup.uk/proxy/?url=' + encodeURIComponent(abs);
  }

  // One observer on the root rewrites every imgur <img> any renderer ever
  // adds (embeds, avatars, posters, modals). Rewritten imgs mutate src again,
  // but the second pass is a no-op — imgurProxyUrl skips imgup.uk URLs.
  function armImgurProxy(root) {
    const fix = (img) => {
      const src = img.getAttribute('src') || '';
      const prox = imgurProxyUrl(src);
      if (prox !== src) {
        // Chrome's lazy-loader wedges when src is swapped while the original
        // (ISP-blocked, stalled) request hangs — force eager for these.
        img.removeAttribute('loading');
        img.src = prox;
      }
    };
    root.querySelectorAll('img').forEach(fix);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes') {
          if (m.target.tagName === 'IMG') fix(m.target);
        } else {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'IMG') fix(n);
            else if (n.querySelectorAll) n.querySelectorAll('img').forEach(fix);
          });
        }
      }
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
  }

  // Every image that has to travel — covers, screenshots, avatars, embeds —
  // sits on a spinning trefoil until it lands. Deliberately NOT a wrapper
  // element: the placeholder is a background on the <img> itself, so no
  // renderer's flex/grid/table layout gets an extra node shoved into it. The
  // rotation is SMIL inside the data-URI SVG (CSS can't animate a background),
  // and the mark is tinted per scheme via --spinner in injectStyles.
  const SKIP_SPINNER = /\/pic\/|^data:|\.gif(\?|$)/i; // legacy furniture: smilies, flags, icons, rank art
  function armImageSpinners(root) {
    const done = (img) => img.classList.remove('cgx-imgloading');
    const arm = (img) => {
      if (img.classList.contains('cgx-imgloading') || img.dataset.cgxSpun) return;
      const src = img.getAttribute('src') || '';
      if (!src || SKIP_SPINNER.test(src)) return;
      // These two carry their own, larger, centred spinner already.
      if (img.closest('.cgx-posterbox, .cgx-modal')) return;
      img.dataset.cgxSpun = '1';
      if (img.complete && img.naturalWidth) return;
      img.classList.add('cgx-imgloading');
      img.addEventListener('load', () => done(img), { once: true });
      img.addEventListener('error', () => done(img), { once: true });
    };
    root.querySelectorAll('img').forEach(arm);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes') {
          if (m.target.tagName === 'IMG') {
            delete m.target.dataset.cgxSpun;
            arm(m.target);
          }
        } else {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'IMG') arm(n);
            else if (n.querySelectorAll) n.querySelectorAll('img').forEach(arm);
          });
        }
      }
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
  }

  function torrentCard(t, { compact = false, onCategory = null } = {}) {
    const catImg = el('img', { class: 'cgx-cat', src: t.catIcon, alt: t.category, title: t.category });
    return el(
      'article',
      { class: 'cgx-card' + (compact ? ' compact' : '') + (t.snatchedByUser ? ' snatched' : '') },
      onCategory && t.category
        ? el(
            'a',
            {
              class: 'cgx-cat-link',
              href: '#',
              title: `Show all ${t.category}`,
              onclick: (e) => {
                e.preventDefault();
                onCategory(t.category);
              },
            },
            catImg
          )
        : catImg,
      el(
        'div',
        { class: 'cgx-card-body' },
        el(
          'div',
          { class: 'cgx-title-row' },
          el('a', { class: 'cgx-title', href: t.href }, t.title),
          t.tags.map((tag) => el('span', { class: 'cgx-tag' }, tag)),
          t.bonus ? el('span', { class: 'cgx-bonus' }, t.bonus) : null
        ),
        t.subtitle ? el('div', { class: 'cgx-sub' }, t.subtitle) : null,
        el(
          'div',
          { class: 'cgx-meta' },
          el('span', {}, `${t.date} ${t.time}`),
          el('span', {}, t.size + (t.files ? ` · ${t.files}` : '')),
          el('span', {}, `by ${t.upper}`),
          t.comments && t.comments !== '0' ? el('span', {}, `💬 ${t.comments}`) : null
        )
      ),
      el(
        'div',
        { class: 'cgx-stats' },
        el('span', { class: 'cgx-seed', title: 'seeders' }, '▲ ' + t.seeders),
        el('span', { class: 'cgx-leech', title: 'leechers' }, '▼ ' + t.leechers),
        el('span', { class: 'cgx-snatch', title: 'snatched' }, '✓ ' + t.snatched)
      ),
      el(
        'div',
        { class: 'cgx-actions' },
        t.download ? el('a', { class: 'cgx-btn icon', href: t.download, title: 'Download .torrent' }, '⬇') : null,
        bookmarkButton(t),
        t.imdb ? el('a', { class: 'cgx-btn icon ghost', href: t.imdb, title: 'Open on IMDB', target: '_blank' }, 'IMDB') : null,
        t.letterboxd
          ? el(
              'a',
              { class: 'cgx-btn icon ghost lb', href: t.letterboxd, title: 'Open on Letterboxd', target: '_blank' },
              el('span', { class: 'lb-dot o' }),
              el('span', { class: 'lb-dot g' }),
              el('span', { class: 'lb-dot b' })
            )
          : null,
        t.cgSearch
          ? el(
              'a',
              { class: 'cgx-btn icon ghost', href: t.cgSearch, title: 'Find other torrents with this IMDB ID' },
              el('span', { class: 'glyph' }, '⌕')
            )
          : null,
        t.forumSearch
          ? el(
              'a',
              { class: 'cgx-btn icon ghost', href: t.forumSearch, title: 'Search forums for this IMDB ID' },
              el('span', { class: 'glyph' }, '⌕'),
              el('span', { class: 'sub' }, 'F')
            )
          : null
      )
    );
  }

  // Toggle a bookmark the way legacy does: its anchors carry an AJAX click
  // handler (bound by anchor id) that adds/removes based on current state.
  // The bare href is an ADD-ONLY no-JS fallback — fetching it never removes —
  // so only use it for rows parsed out of fetched (inert) documents.
  function toggleBookmark(t) {
    if (t.bookmarkEl && t.bookmarkEl.isConnected && t.bookmarkEl.ownerDocument === document) {
      t.bookmarkEl.addEventListener('click', (e) => e.preventDefault(), { once: true });
      t.bookmarkEl.click();
      return Promise.resolve();
    }
    return fetch(t.bookmark, { credentials: 'same-origin' });
  }

  function bookmarkButton(t) {
    if (!t.bookmark) return null;
    let busy = false;
    const btn = el(
      'button',
      {
        class: 'cgx-btn icon bmark' + (t.bookmarked ? ' on' : ''),
        type: 'button',
        title: 'Toggle bookmark',
        onclick: async () => {
          if (busy) return;
          busy = true;
          try {
            await toggleBookmark(t);
            btn.classList.toggle('on');
          } catch (err) {
            console.warn('[cg-redux] bookmark failed', err);
          }
          busy = false;
        },
      },
      '★'
    );
    return btn;
  }

  /* ------------------------- enhancements (CG Mod Tool port) ------------------------- */
  // Native port of the features from https://greasyfork.org/en/scripts/448674-cg-mod-tool
  // (IMDb titler, mark new uploads, duplicate-IMDB-ID check). Disable CG Mod Tool itself
  // when running this script, or both will fetch in the background.

  const FEATURES = { imdbTitler: false, markNewUploads: true, dupeCheck: true };

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('cgx:' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('cgx:' + key, JSON.stringify(value));
      } catch {}
    },
  };

  function isFirstBrowsePage() {
    const params = new URLSearchParams(location.search);
    return [...params.keys()].every((k) => k === 'page') && (!params.get('page') || params.get('page') === '0');
  }

  function gmXhr() {
    if (typeof GM_xmlhttpRequest !== 'undefined') return GM_xmlhttpRequest;
    if (typeof GM !== 'undefined' && GM.xmlHttpRequest) return GM.xmlHttpRequest;
    return null;
  }

  // Title/year/type via IMDb's public suggestion API — plain JSON, no bot
  // challenge (the reference-page approach gets HTTP 202'd by IMDb's WAF).
  function fetchImdbTitle(imdbId, onDone) {
    const xhr = gmXhr();
    const flag = (msg) => document.getElementById('cg-redux-root')?.setAttribute('data-cgx-xhr', msg);
    if (!xhr) {
      flag('unavailable');
      return;
    }
    xhr({
      url: `https://v3.sg.media-imdb.com/suggestion/t/${imdbId}.json`,
      method: 'GET',
      timeout: 15000,
      onerror: () => flag('error:' + imdbId),
      ontimeout: () => flag('timeout:' + imdbId),
      onload(res) {
        if (res.status !== 200) {
          flag('http' + res.status + ':' + imdbId);
          return;
        }
        try {
          const hit = (JSON.parse(res.responseText).d || []).find((d) => d.id === imdbId);
          if (!hit) {
            flag('no-match:' + imdbId);
            return;
          }
          const isTv = /^tv/i.test(hit.qid || '');
          const label = hit.l + (isTv ? ' [TV]' : '') + (hit.y ? ` [${hit.y}]` : '');
          store.set(imdbId, label);
          onDone(label);
        } catch (err) {
          flag('parse-failed:' + imdbId);
          console.warn(`[cg-redux] IMDb suggestion parse failed for ${imdbId}`, err);
        }
      },
    });
  }

  // CG torrents sharing this IMDB ID, from the search-results page. Calls
  // onDone(count, torrents) — count is cached, the parsed rows are not.
  function fetchDupeCount(t, onDone) {
    fetch(t.cgSearch, { credentials: 'same-origin' })
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const tables = [...doc.querySelectorAll('table.torrenttable')];
        const list = tables[tables.length - 1];
        const torrents = list ? [...list.rows].map(parseTorrentRow).filter(Boolean) : [];
        if (torrents.length > 1) store.set('dupes:' + t.imdbId, torrents.length);
        onDone(torrents.length, torrents);
      })
      .catch((err) => console.warn(`[cg-redux] dupe check failed for ${t.imdbId}`, err));
  }

  /* --------------------------- film hero (IMDB-ID search) --------------------------- */

  // Film info panel for browse.php?search=tt… pages. Primary source: the
  // Letterboxd film page (JSON-LD + og:description + cast links) reached via
  // its /imdb/<id>/ redirect — IMDb's own pages bot-wall background requests.
  // Fallback: IMDb's suggestion API. Cached per film.
  function fetchFilmInfo(imdbId, cb) {
    const xhr = gmXhr();
    if (!xhr) return;

    const fallback = () =>
      xhr({
        url: `https://v3.sg.media-imdb.com/suggestion/t/${imdbId}.json`,
        method: 'GET',
        timeout: 15000,
        onload(res) {
          if (res.status !== 200) return;
          try {
            const hit = (JSON.parse(res.responseText).d || []).find((d) => d.id === imdbId);
            if (!hit) return;
            // partial: fallback data — retry the full Letterboxd fetch next visit
            const info = { v: 2, title: hit.l, year: hit.y, poster: hit.i?.imageUrl, cast: hit.s ? hit.s.split(', ') : [], partial: true };
            store.set('film:' + imdbId, info);
            cb(info);
          } catch {}
        },
      });

    xhr({
      url: `https://letterboxd.com/imdb/${imdbId}/`,
      method: 'GET',
      timeout: 20000,
      onerror: fallback,
      ontimeout: fallback,
      onload(res) {
        if (res.status !== 200) return fallback();
        try {
          const page = new DOMParser().parseFromString(res.responseText, 'text/html');
          const ldText = page.querySelector('script[type="application/ld+json"]')?.textContent || '';
          const data = JSON.parse((ldText.match(/\{[\s\S]*\}/) || ['{}'])[0]);
          const info = {
            v: 2,
            title: data.name,
            year: ((page.title || '').match(/\((\d{4})\)/) || [])[1] || '',
            poster: data.image,
            backdrop: page.querySelector('[data-backdrop]')?.getAttribute('data-backdrop') || '',
            rating: data.aggregateRating?.ratingValue,
            directors: (data.director || []).map((d) => d.name),
            genres: data.genre || [],
            countries: (data.countryOfOrigin || []).map((c) => c.name),
            cast: [...new Set([...page.querySelectorAll('a[href^="/actor/"]')].map((a) => txt(a)))].slice(0, 8),
            synopsis: page.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
            url: data.url,
          };
          if (!info.title) return fallback();
          store.set('film:' + imdbId, info);
          cb(info);
        } catch (err) {
          console.warn('[cg-redux] letterboxd parse failed', err);
          fallback();
        }
      },
    });
  }

  function openPosterModal(src, alt) {
    // LB poster URLs encode their crop size — ask for a bigger one, fall back
    // to the original if that rendition doesn't exist.
    const big = src.replace(/-\d+-\d+-\d+-\d+-crop/, '-0-1000-0-1500-crop');
    const img = el('img', { class: 'cgx-modal-img', src: big, alt });
    // Spinning trefoil until the full-size rendition arrives (same loader as
    // the poster boxes); on double failure it stops so the modal isn't stuck.
    const shown = () => overlay.classList.add('loaded');
    img.addEventListener('load', shown);
    img.addEventListener('error', () => {
      if (img.src !== src) img.src = src;
      else shown();
    });
    const onKey = (e) => e.key === 'Escape' && close();
    const overlay = el('div', { class: 'cgx-modal', onclick: () => close() }, radMark('spin'), img);
    if (img.complete && img.naturalWidth) shown();
    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    };
    document.addEventListener('keydown', onKey);
    document.getElementById('cg-redux-root')?.appendChild(overlay);
  }

  // Director/cast names as CG searches — blunt name-text search against
  // titles+descriptions (descr=1), but it's what old CG offers.
  const nameSearchLink = (name) =>
    el(
      'a',
      {
        class: 'cgx-name-link',
        href: '/browse.php?search=' + encodeURIComponent(name).replace(/%20/g, '+') + '&proj=0&descr=1',
        title: `Search CG for "${name}"`,
      },
      name
    );
  const nameList = (names) => names.flatMap((n, i) => (i ? [', ', nameSearchLink(n)] : [nameSearchLink(n)]));

  function fillFilmHero(hero, info, imdbId) {
    if (info.backdrop) {
      hero.classList.add('has-backdrop');
      hero.style.backgroundImage =
        `linear-gradient(to right, rgba(30,28,25,0.96) 0%, rgba(30,28,25,0.9) 45%, rgba(30,28,25,0.65) 100%), url("${info.backdrop}")`;
    }

    // Details pages pass a torrent context ({ titleWrap, titleRow, download }):
    // the torrent title block replaces the film title (year/rating fold into
    // its title row) and the Download button leads the links row.
    const ctx = hero._cgxTorrent;
    const year = info.year ? el('span', { class: 'cgx-hero-year cgx-fill' }, String(info.year)) : null;
    const rating = info.rating
      ? el('span', { class: 'cgx-hero-rating cgx-fill', title: 'Letterboxd rating' }, '★ ' + Number(info.rating).toFixed(2))
      : null;
    let head;
    if (ctx) {
      ctx.titleRow.querySelectorAll('.cgx-fill').forEach((n) => n.remove()); // refill-safe
      // Year comes from the torrent's own tag (rendered next to the title by
      // renderDetails); the LB rating slots in right after it, keeping film
      // facts by the title and away from the action pills.
      if (rating) (ctx.titleRow.querySelector('.cgx-hero-year') || ctx.titleRow.querySelector('h2')).after(rating);
      head = ctx.titleWrap;
    } else {
      head = el('div', { class: 'cgx-hero-title' }, el('h2', {}, info.title || imdbId), year, rating);
    }

    hero.replaceChildren(
      el(
        'div',
        { class: 'cgx-hero-inner' },
        info.poster ? posterBox(info.poster, info.title || imdbId) : null,
        el(
          'div',
          { class: 'cgx-hero-body' },
          head,
          (info.directors || []).length
            ? el('div', { class: 'cgx-hero-line' }, el('span', { class: 'lbl' }, 'Directed by '), nameList(info.directors))
            : null,
          [...(info.genres || []), ...(info.countries || [])].length
            ? el('div', { class: 'cgx-hero-line muted' }, [...(info.genres || []), ...(info.countries || [])].join(' · '))
            : null,
          (info.cast || []).length ? el('div', { class: 'cgx-hero-line' }, el('span', { class: 'lbl' }, 'Cast: '), nameList(info.cast)) : null,
          info.synopsis ? el('p', { class: 'cgx-hero-synopsis' }, info.synopsis) : null,
          el(
            'div',
            { class: 'cgx-hero-links' },
            ctx?.download || null,
            el('a', { class: 'cgx-btn ghost', href: `https://www.imdb.com/title/${imdbId}/`, target: '_blank' }, 'IMDB'),
            el('a', { class: 'cgx-btn ghost', href: info.url || `https://letterboxd.com/imdb/${imdbId}/`, target: '_blank' }, 'Letterboxd'),
            // The useful cores of the "IMDb to Stremio" and "Debrid Media
            // Manager" userscripts — each is just a URL keyed on the IMDb id.
            el('a', { class: 'cgx-btn ghost', href: `stremio:///detail/movie/${imdbId}`, title: 'Open in the Stremio app' }, 'Stremio'),
            el('a', { class: 'cgx-btn ghost', href: `https://x.debridmediamanager.com/${imdbId}`, target: '_blank', title: 'Search on Debrid Media Manager' }, 'DMM')
          )
        )
      )
    );
  }

  // Poster with a spinning-trefoil placeholder until the image arrives.
  function posterBox(src, alt) {
    const img = el('img', {
      class: 'cgx-hero-poster',
      src,
      alt,
      title: 'Click to enlarge',
      onclick: () => openPosterModal(src, alt),
    });
    const box = el('div', { class: 'cgx-posterbox' }, radMark('spin'), img);
    if (img.complete && img.naturalWidth) box.classList.add('loaded');
    else {
      img.addEventListener('load', () => box.classList.add('loaded'));
      img.addEventListener('error', () => box.remove());
    }
    return box;
  }

  // torrentCtx (optional, details pages): { titleWrap, titleRow, download } —
  // the torrent title block heads the card body and survives async refills.
  function buildFilmHero(imdbId, torrentCtx) {
    const hero = el('section', { class: 'cgx-hero' });
    if (torrentCtx) hero._cgxTorrent = torrentCtx;
    hero.append(
      el(
        'div',
        { class: 'cgx-hero-inner' },
        el(
          'div',
          { class: 'cgx-hero-body' },
          torrentCtx ? torrentCtx.titleWrap : null,
          el('div', { class: 'cgx-hero-loading' }, radMark('spin'), 'Loading film info…'),
          torrentCtx?.download ? el('div', { class: 'cgx-hero-links' }, torrentCtx.download) : null
        )
      )
    );
    const cached = store.get('film:' + imdbId, null);
    if (cached) fillFilmHero(hero, cached, imdbId);
    // No cache, partial fallback data, or a pre-backdrop cache shape: (re)fetch.
    if (!cached || cached.partial || cached.v !== 2) fetchFilmInfo(imdbId, (info) => fillFilmHero(hero, info, imdbId));
    return hero;
  }

  function applyEnhancements(cardRefs) {
    if (FEATURES.markNewUploads && isFirstBrowsePage()) {
      const last = store.get('lastUpload', 0);
      let max = last;
      for (const { t, card } of cardRefs) {
        if (!t.id || t.id <= last) continue;
        card.querySelector('.cgx-title-row').append(el('span', { class: 'cgx-badge new' }, 'NEW'));
        if (t.id > max) max = t.id;
      }
      if (max > last) store.set('lastUpload', max);
    }

    if (FEATURES.imdbTitler) {
      let delay = 0;
      for (const { t, card } of cardRefs) {
        if (!t.imdbId) continue;
        const slot = el('div', { class: 'cgx-imdb-title' });
        card.querySelector('.cgx-title-row').after(slot);
        const cached = store.get(t.imdbId, null);
        if (cached) slot.textContent = cached;
        else setTimeout(() => fetchImdbTitle(t.imdbId, (label) => (slot.textContent = label)), 1000 * delay++);
      }
    }

    if (FEATURES.dupeCheck) {
      let delay = 0;
      for (const { t, card } of cardRefs) {
        if (!t.imdbId || !t.cgSearch) continue;
        const badge = el('a', { class: 'cgx-badge dupes', href: t.cgSearch, title: 'Other CG torrents with this IMDB ID' });
        const apply = (n) => {
          badge.textContent = n > 1 ? `${n} on CG` : 'only copy';
          badge.classList.add(n > 1 ? 'many' : 'one');
        };
        card.querySelector('.cgx-title-row').append(badge);
        const cached = store.get('dupes:' + t.imdbId, null);
        if (cached != null) apply(cached);
        else setTimeout(() => fetchDupeCount(t, apply), 600 * delay++);
      }
    }
  }

  function renderBrowse(doc) {
    const data = parseBrowse(doc);
    const searchVal = (new URLSearchParams(location.search).get('search') || '').trim();
    const filmId = /^tt\d+$/i.test(searchVal) ? searchVal.toLowerCase() : null;

    const searchInput = el('input', {
      class: 'cgx-search',
      type: 'search',
      placeholder: 'Search torrents…',
      value: data.searchForm?.elements.search.value || '',
    });
    const recents = store.get('recentSearches', []);
    const submitSearch = () => {
      if (!data.searchForm) return;
      const v = searchInput.value.trim();
      if (v) store.set('recentSearches', [v, ...recents.filter((r) => r !== v)].slice(0, 8));
      data.searchForm.elements.search.value = searchInput.value;
      data.searchForm.submit();
    };
    searchInput.addEventListener('keydown', (e) => e.key === 'Enter' && submitSearch());

    // Click a card's category icon → filter the list to that category alone
    // (checks the matching legacy checkbox, clears the rest + search, submits).
    const filterByCategory = (name) => {
      const cats = data.filters.filter((f) => f.group === 'category');
      const target = cats.find((f) => f.label.toLowerCase() === name.toLowerCase());
      if (!target) return;
      cats.forEach((f) => (f.box.checked = f === target));
      if (data.searchForm) data.searchForm.elements.search.value = '';
      (data.searchForm || data.filterForm)?.submit();
    };

    const cardRefs = [];
    const makeCard = (t, opts) => {
      const card = torrentCard(t, { onCategory: filterByCategory, ...opts });
      cardRefs.push({ t, card });
      return card;
    };

    // "Featured torrents give a 50% bonus." → "50% bonus" pill; falls back to
    // the sentence minus the countdown part if the phrasing ever changes.
    const bonusPill = (d) => {
      if (!d.featuredNote) return null;
      const bonus =
        (d.featuredNote.match(/\d+%\s*bonus/i) || [])[0] ||
        d.featuredNote.replace(/next update.*$/i, '').trim();
      return bonus ? el('span', { class: 'cgx-bonus', title: d.featuredNote }, bonus) : null;
    };

    const buildFeaturedSection = (d) => {
      let countdown = null;
      if (d.featuredEta != null) {
        countdown = el('span', { class: 'cgx-countdown', title: d.featuredNote || null });
        const deadline = Date.now() + d.featuredEta * 1000;
        const fmt = () => {
          const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
          if (!s) return 'refreshing…';
          const d = Math.floor(s / 86400);
          const h = Math.floor((s % 86400) / 3600);
          const m = Math.floor((s % 3600) / 60);
          return (
            'next update in ' +
            (d ? d + 'd ' : '') +
            (d || h ? h + 'h ' : '') +
            (d || h || m ? m + 'm ' : '') +
            (s % 60) + 's'
          );
        };
        countdown.textContent = fmt();
        setInterval(() => { countdown.textContent = fmt(); }, 1000);
      }
      return el(
        'details',
        {
          class: 'cgx-featured',
          open: store.get('featuredOpen', true) ? '' : null,
          ontoggle: (e) => store.set('featuredOpen', e.target.open),
        },
        el('summary', {}, el('h2', {}, 'Featured'), bonusPill(d), countdown),
        el('div', { class: 'cgx-featured-body' }, d.featured.map((t) => makeCard(t, { compact: true })))
      );
    };

    const makeChip = ({ box, label }) => {
      const chip = el(
        'button',
        {
          class: 'cgx-chip' + (box.checked ? ' on' : ''),
          type: 'button',
          onclick: () => {
            box.checked = !box.checked;
            chip.classList.toggle('on', box.checked);
          },
        },
        label
      );
      return chip;
    };
    const chipRow = (title, list) =>
      list.length
        ? el(
            'div',
            { class: 'cgx-chip-row' },
            el('span', { class: 'cgx-chip-label' }, title),
            el('div', { class: 'cgx-chip-set' }, list.map(makeChip))
          )
        : null;
    const catRow = chipRow('Category', data.filters.filter((f) => f.group === 'category'));
    const showRow = chipRow('Show only', data.filters.filter((f) => f.group === 'show'));
    const descrFilter = data.filters.find((f) => f.group === 'search');
    const descrRow = descrFilter ? chipRow('Search options', [{ ...descrFilter, label: 'Also search descriptions' }]) : null;

    // Cmd-K-style dropdown under the search bar: recent searches + all the
    // filter groups live in a panel that opens on focus.
    let recentSection = null;
    if (recents.length) {
      recentSection = el(
        'div',
        { class: 'cgx-chip-row' },
        el(
          'div',
          { class: 'cgx-sp-title' },
          el('span', { class: 'cgx-chip-label' }, 'Recent searches'),
          el(
            'button',
            {
              class: 'cgx-sp-clear',
              type: 'button',
              onclick: () => {
                store.set('recentSearches', []);
                recentSection.remove();
              },
            },
            'clear'
          )
        ),
        recents.map((r) =>
          el(
            'button',
            {
              class: 'cgx-sp-recent',
              type: 'button',
              onclick: () => {
                searchInput.value = r;
                submitSearch();
              },
            },
            el('span', { class: 'ic' }, '↺'),
            r
          )
        )
      );
    }

    const panel = el(
      'div',
      { class: 'cgx-search-panel' },
      recentSection,
      catRow,
      showRow,
      descrRow,
      el(
        'div',
        { class: 'cgx-sp-foot' },
        el('span', {}, el('kbd', { class: 'cgx-kbd' }, 'enter'), ' search'),
        el('span', {}, el('kbd', { class: 'cgx-kbd' }, 'esc'), ' close'),
        el('span', {}, el('kbd', { class: 'cgx-kbd' }, navigator.platform.includes('Mac') ? '⌘K' : 'ctrl K'), ' focus')
      )
    );
    const searchWrap = el('div', { class: 'cgx-searchwrap' }, searchInput, panel);

    // Filters hidden in the panel still deserve a visible signal.
    const activeCount = data.filters.filter((f) => f.group !== 'search' && f.box.checked).length;
    if (activeCount) {
      searchWrap.insertBefore(
        el(
          'button',
          { class: 'cgx-filter-count', type: 'button', onclick: () => searchInput.focus() },
          `${activeCount} ${activeCount === 1 ? 'filter' : 'filters'}`
        ),
        panel
      );
      searchInput.classList.add('has-count');
    }

    const openPanel = () => searchWrap.classList.add('open');
    const closePanel = () => searchWrap.classList.remove('open');
    searchInput.addEventListener('focus', openPanel);
    searchInput.addEventListener('click', openPanel);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePanel();
        searchInput.blur();
      }
    });
    document.addEventListener('mousedown', (e) => {
      if (!searchWrap.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        openPanel();
      }
    });

    // Active sort comes from the page URL (orderby=…&dir=…); with no orderby
    // the legacy default is newest first, i.e. Added descending.
    const q = new URLSearchParams(location.search);
    const curBy = q.get('orderby');
    const curDir = (q.get('dir') || 'DESC').toUpperCase();
    const sortBar = data.sorts.length
      ? el(
          'div',
          { class: 'cgx-sortbar' },
          el('span', { class: 'cgx-chip-label' }, 'Sort by'),
          data.sorts.map((s) => {
            let by = null;
            try {
              by = new URL(s.href, location.href).searchParams.get('orderby');
            } catch {}
            const on = curBy ? by === curBy : s.label === 'Added';
            return el(
              'a',
              { class: 'cgx-chip' + (on ? ' on' : ''), href: s.href },
              s.label + (on ? (curDir === 'ASC' ? ' ▲' : ' ▼') : '')
            );
          })
        )
      : null;

    const content = el(
      'div',
      {},
      el(
        'div',
        { class: 'cgx-toolbar' },
        searchWrap,
        el('button', { class: 'cgx-btn primary', type: 'button', onclick: submitSearch }, 'Search')
      ),
      filmId ? buildFilmHero(filmId) : null,
      data.featured.length ? buildFeaturedSection(data) : null,
      sortBar,
      el('section', { class: 'cgx-list' }, data.torrents.map((t) => makeCard(t))),
      data.pages.length
        ? el(
            'nav',
            { class: 'cgx-pages' },
            data.pages.map((p) => el('a', { class: 'cgx-page', href: p.href }, p.label))
          )
        : null
    );

    renderShell(doc, content);
    applyEnhancements(cardRefs);
  }

  /* ------------------------------ user details page ------------------------------ */

  function parseUser(doc) {
    const name = (doc.title.match(/details for (.+)$/i) || [])[1] || '';
    const rows = [...doc.querySelectorAll('tr')].filter((r) => r.cells.length === 2 && txt(r.cells[0]));
    const fields = [];
    const sections = [];
    let avatar = null;
    let flag = null;
    let displayName = name;
    for (const r of rows) {
      const label = txt(r.cells[0]);
      const val = r.cells[1];
      if (!label || label.length > 40) continue;
      if (label.toLowerCase() === name.toLowerCase()) {
        // The legacy header row: [username | country flag]. Keep the flag
        // for the hero title and the properly-cased username (doc.title
        // lowercases it).
        displayName = label;
        const f = val.querySelector('img');
        if (f) flag = { src: f.getAttribute('src'), title: f.title || f.alt || '' };
        continue;
      }
      const table = val.querySelector('table');
      if (table && table.rows[0] && table.rows[0].textContent.includes('Type')) {
        sections.push({ title: label.replace(/\[.*\]$/, '').trim(), table });
      } else if (/^avatar$/i.test(label)) {
        avatar = val.querySelector('img')?.src || null;
      } else if (!table || /^info$/i.test(label)) {
        // Info may legitimately contain a BBCode table — keep it as a field.
        fields.push({ label, val });
      }
    }
    return { name: displayName, avatar, fields, sections, flag };
  }

  // Rebuild a legacy value cell's content with our own elements (links, icons,
  // line breaks, text) so no legacy styling leaks through.
  function adoptValue(cell) {
    const kids = [];
    for (const n of cell.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) kids.push(n.textContent);
      else if (n.nodeName === 'A') {
        // Keep EVERY img in the anchor — the "Favourites rcvd." heart is a
        // segmented favstack_start/mid/end sprite run, not a single image.
        const imgs = [...n.querySelectorAll('img')];
        kids.push(
          el(
            'a',
            { href: n.href, title: n.title || imgs[0]?.title || imgs[0]?.alt || null },
            imgs.length
              ? imgs.map((img) => el('img', { src: img.src, alt: img.alt || '', class: 'cgx-inline-img' }))
              : txt(n) || n.href
          )
        );
      }
      else if (n.nodeName === 'IMG') kids.push(el('img', { src: n.src, alt: n.alt || '', title: n.title || '', class: 'cgx-inline-img' }));
      else if (n.nodeName === 'BR') kids.push(el('br'));
      else if (txt(n)) kids.push(txt(n) + ' ');
    }
    return kids;
  }

  function userTorrentSection({ title, table }) {
    const headers = [...table.rows[0].cells].map((c) => txt(c));
    const body = el('tbody');
    for (const r of [...table.rows].slice(1)) {
      if (!r.cells.length) continue;
      const tr = el('tr');
      for (const cell of r.cells) {
        const td = el('td');
        const link = cell.querySelector('a[href*="details.php"]');
        const img = cell.querySelector('img');
        if (link) {
          td.append(el('a', { class: 'cgx-tbl-title', href: link.href }, txt(link)));
          const extra = txt(cell).replace(txt(link), '').trim();
          if (extra) td.append(el('div', { class: 'cgx-tbl-sub' }, extra.slice(0, 140)));
        } else if (img && !txt(cell)) {
          td.append(el('img', { class: 'cgx-tbl-icon', src: img.src, alt: img.alt || img.title || '', title: img.title || '' }));
        } else {
          td.textContent = txt(cell);
        }
        tr.append(td);
      }
      body.append(tr);
    }
    return rememberOpen(
      el(
        'details',
        { class: 'cgx-user-section' },
        el('summary', {}, title),
        el(
          'div',
          { class: 'cgx-tbl-wrap' },
          el('table', { class: 'cgx-tbl' }, el('thead', {}, el('tr', {}, headers.map((h) => el('th', {}, h)))), body)
        )
      ),
      title // sections default to collapsed until you say otherwise
    );
  }

  function renderUser(doc) {
    const u = parseUser(doc);
    const content = el(
      'div',
      {},
      el(
        'section',
        { class: 'cgx-hero cgx-user-hero' },
        // Stacked: avatar above the name, tile grid below at full panel width
        // (a side-by-side avatar left a tall dead column under it).
        u.avatar
          ? el('img', {
              class: 'cgx-hero-poster',
              src: u.avatar,
              alt: u.name,
              title: 'Click to enlarge',
              onclick: () => openPosterModal(u.avatar, u.name),
            })
          : null,
        el(
          'div',
          { class: 'cgx-hero-title' },
          el('h2', {}, u.name),
          u.flag ? el('img', { class: 'cgx-user-flag', src: u.flag.src, alt: u.flag.title, title: u.flag.title }) : null
        ),
        // The "(add to friends) - (add to blocks) - (send PM) - (send cigar)"
        // links from the legacy header, as ghost buttons (absent on own page).
        (() => {
          const acts = [...doc.querySelectorAll('a')].filter((a) =>
            /^(add to friends|add to blocks|send pm|send cigar)$/i.test(txt(a))
          );
          return acts.length
            ? el(
                'div',
                { class: 'cgx-user-actions' },
                acts.map((a) => el('a', { class: 'cgx-btn ghost sm', href: a.href }, txt(a)))
              )
            : null;
        })(),
        // Same info-tile cards as the torrent details page; long or
        // multi-line values span the full row. Cigar shelves collapse to a
        // single row with a toggle beside the label.
        el(
          'div',
          { class: 'cgx-info-tiles cgx-user-tiles' },
          u.fields.map(({ label, val }) => {
            // Cigars are smilie <img>s, so gauge size by image count, and
            // drop the toggle after layout if one row already fits them all.
            const cigars = /cigar/i.test(label) && val.querySelectorAll('img').length > 6;
            // Info is server-rendered BBCode (formatting, images, [hide]
            // spoilers) — embed the real markup at full width instead of
            // flattening it through adoptValue.
            const info = /^info$/i.test(label);
            const num = info
              ? el('div', { class: 'num cgx-user-info' }, legacyEmbed(val))
              : el('div', { class: 'num' + (cigars ? ' cgx-cigar-clamp' : '') }, ...adoptValue(val));
            let toggle = null;
            if (cigars) {
              toggle = el('button', { class: 'cgx-cigar-toggle', type: 'button', title: 'Show all' }, '▸');
              toggle.addEventListener('click', () => {
                const open = num.classList.toggle('open');
                toggle.textContent = open ? '▾' : '▸';
                toggle.title = open ? 'Collapse' : 'Show all';
              });
              // The cigar imgs carry no size attributes, so overflow can only
              // be judged after they load — poll briefly and drop the toggle
              // if the single nowrap row turns out to fit the lot.
              let tries = 0;
              const probe = setInterval(() => {
                const imgs = [...num.querySelectorAll('img')];
                if (num.isConnected && imgs.every((i) => i.complete)) {
                  clearInterval(probe);
                  if (num.scrollWidth <= num.clientWidth + 2) toggle.remove();
                } else if (++tries > 40) clearInterval(probe);
              }, 250);
            }
            return el(
              'div',
              { class: 'cgx-stat-tile' + (info || cigars || txt(val).length > 60 || val.querySelector('br') ? ' full' : '') },
              num,
              el('div', { class: 'lbl' }, label, toggle)
            );
          })
        )
      ),
      u.sections.map(userTorrentSection)
    );
    renderShell(doc, content);
  }

  /* ------------------------------ torrent details page ------------------------------ */

  // [hide] BBCode renders as <a href="javascript:klappe_news('ID')"> +
  // <div id="kID" style="display:none">. In a clone that href still resolves
  // the ORIGINAL (hidden) div — duplicate id, earlier in document order — so
  // the toggle looks dead. Re-wire it to the clone's own div.
  function armSpoilers(scope) {
    // The site emits "javascript: klappe_news('ID')" — note the space.
    scope.querySelectorAll('a[href^="javascript:"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!/klappe_news/.test(href)) return;
      const id = (href.match(/['"]([^'"]+)['"]/) || [])[1];
      const body = id && scope.querySelector(`[id="k${id}"]`);
      if (!body) return;
      body.removeAttribute('id');
      a.removeAttribute('href');
      a.className = 'cgx-btn ghost sm cgx-spoiler-btn';
      a.textContent = 'Show';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const open = body.style.display === 'none';
        body.style.display = open ? '' : 'none';
        a.textContent = open ? 'Hide' : 'Show';
      });
    });
  }

  // Deep-clone a legacy content block (description, mediainfo, comments…) into a
  // styled wrapper. Large images become click-to-zoom.
  function legacyEmbed(node) {
    const wrap = el('div', { class: 'cgx-embed' });
    wrap.append(node.cloneNode(true));
    armSpoilers(wrap);
    wrap.querySelectorAll('img').forEach((img) => {
      // Legacy BBCode thumbs expand inline via an onclick attribute (which
      // survives cloning). Kill that behavior — they keep their thumbnail
      // width and get the same zoom modal as every other image.
      const legacyToggle = /this\.width/.test(img.getAttribute('onclick') || '');
      if (legacyToggle) img.removeAttribute('onclick');
      if (!legacyToggle && !/\.(jpe?g|png|webp)/i.test(img.getAttribute('src') || '')) return;
      // Only meaningfully large images get the zoom treatment — icons,
      // smilies, flags and other furniture stay plain.
      const arm = () => {
        if (img.naturalWidth < 120 || img.naturalHeight < 120) return;
        img.classList.add('cgx-zoomable');
        img.addEventListener('click', () => openPosterModal(img.src, img.alt || ''));
      };
      img.complete && img.naturalWidth ? arm() : img.addEventListener('load', arm, { once: true });
    });
    return wrap;
  }

  // Make a <details> remember whether it was open. The key is the page's path
  // plus the section's own label with digits stripped, so "Comments (14)" and
  // "Comments (203+)" are the same panel — and a panel's state carries from one
  // torrent/user/thread to the next, which is what you actually want out of
  // "always show me the mediainfo".
  function rememberOpen(details, label, fallbackOpen = false) {
    const key = 'open:' + location.pathname + '|' + String(label).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    // 'force' = the page context demands it open this once (e.g. you followed a
    // link to comment page 3) — still recorded from here on.
    const saved = store.get(key, null);
    if (fallbackOpen === 'force' || (saved == null ? fallbackOpen : saved)) details.setAttribute('open', '');
    else details.removeAttribute('open');
    details.addEventListener('toggle', () => store.set(key, details.open));
    return details;
  }

  function collapsible(title, body, open = false) {
    return rememberOpen(
      el('details', { class: 'cgx-user-section' }, el('summary', {}, title), el('div', { class: 'cgx-section-body' }, body)),
      title,
      open
    );
  }

  function parseDetails(doc) {
    const cells = {};
    const labelLinks = {}; // e.g. the "[See full list]" links beside Num files / Peers
    for (const r of doc.querySelectorAll('tr')) {
      if (r.cells.length !== 2) continue;
      const label = txt(r.cells[0]).replace(/\[[^\]]*\]/g, '').trim();
      if (!label || label.length > 34) continue;
      const hasContent = txt(r.cells[1]) || r.cells[1].querySelector('img, table, a, input');
      if (!cells[label] && hasContent) {
        cells[label] = r.cells[1];
        const ll = r.cells[0].querySelector('a[href]');
        if (ll) labelLinks[label] = ll.href;
      }
    }

    const heading =
      [...doc.querySelectorAll('td.colhead, h1, h2')]
        .map(txt)
        .find((t) => t.length > 8 && !/community|torrents|support|personal|search/i.test(t)) ||
      (doc.title.match(/details for "(.+)"/i) || [])[1] ||
      '';
    const tagMatch = heading.match(/^(.*?)\s*(\[.+)$/);

    const imdbCell = cells['IMDB'];
    const imdbId =
      (((imdbCell?.querySelector('a')?.href || '') + ' ' + txt(imdbCell)).match(/tt\d+/) || [])[0] || null;

    // Bonus torrents show the spinning coin in the heading colhead cell,
    // amount in its alt ("40% Bonus") — same marker as browse rows.
    const coin = doc.querySelector('td.colhead img[src*="golden"]');
    const bonus = coin
      ? ((coin.getAttribute('alt') || coin.getAttribute('title') || '').trim() || 'bonus').toLowerCase()
      : null;

    // Comments: each is a table holding td.comment, preceded by a `p.sub` header
    // line — "#1569340 by Username (Class) at 2018-08-20 11:58:56 GMT".
    const comments = [...new Set([...doc.querySelectorAll('td.comment')].map((cell) => cell.closest('table')))]
      .filter(Boolean)
      .map((table) => {
        let sub = table.previousElementSibling;
        for (let i = 0; sub && i < 3 && !sub.matches('p.sub, .sub'); i++) sub = sub.previousElementSibling;
        const subText = txt(sub);
        const userA = sub?.querySelector('a[href*="userdetails"]');
        return {
          num: (subText.match(/#(\d+)/) || [])[1] || '',
          user: txt(userA),
          userA,
          userHref: userA?.href,
          klass: (subText.match(/\(([^)]+)\)/) || [])[1] || '',
          date: (subText.match(/at\s+(.+?GMT)/) || [])[1] || '',
          // Legacy naming is reversed from what you'd expect: td.comment is the
          // avatar column, td.text holds the comment body.
          avatar: table.querySelector('td.comment img')?.src,
          bodyCell: table.querySelector('td.text') || table.querySelector('td.comment'),
        };
      });

    // Comment pagination (>20 comments): the only page= links on details pages.
    const seenPage = new Set();
    const commentPages = [...doc.querySelectorAll('a[href*="page="]')]
      .map((a) => ({ label: txt(a).replace(/[<>]/g, '').trim(), href: a.href }))
      .filter((p) => p.label && !seenPage.has(p.label) && seenPage.add(p.label));

    // "Also got": the legacy carousel's rows share the browse-row structure, so
    // parse them like browse torrents (dedupe — the carousel clones slides).
    const alsoGotCell = cells['People who got this also got ...'];
    const seenIds = new Set();
    const alsoGot = alsoGotCell
      ? [...alsoGotCell.querySelectorAll('tr')]
          .map(parseTorrentRow)
          .filter(Boolean)
          .filter((t) => !seenIds.has(t.id) && seenIds.add(t.id))
      : [];

    return {
      name: tagMatch ? tagMatch[1] : heading,
      tags: tagMatch ? (tagMatch[2].match(/\[([^\]]+)\]/g) || []).map((t) => t.slice(1, -1)) : [],
      download: cells['Download']?.querySelector('a[href*="download.php"]')?.href,
      downloadName: txt(cells['Download']?.querySelector('a[href*="download.php"]')),
      // Small bookmark button beside the download filename; the icon tells
      // the current state (bookmarks-add.gif vs the delete variant).
      bookmark: cells['Download']?.querySelector('a[href*="bookmark"]')?.href,
      bookmarkEl: cells['Download']?.querySelector('a[href*="bookmark"]'),
      bookmarked: /remove|del/i.test(
        (cells['Download']?.querySelector('a[href*="bookmark"] img')?.getAttribute('src') || '') +
          (cells['Download']?.querySelector('a[href*="bookmark"]')?.getAttribute('href') || '')
      ),
      labelLinks,
      added: txt(cells['Added']),
      imdbId,
      bonus,
      cells,
      comments,
      commentPages,
      alsoGot,
    };
  }

  // Fetch the "?filelist=1" page and lift out the File list rows (a "File
  // list" row, then Path|Size header + one row per file, until the next
  // known info label).
  const DETAIL_ROW_LABELS = new Set([
    'Type', 'Size', 'Added', 'Views', 'Hits', 'Upped by', 'Last seeder', 'Num files', 'Peers',
    'Bookmarked by', 'Favourited by', 'Snatched', 'I have this', 'Info hash', 'Tagline', 'Download', 'IMDB',
  ]);

  function fetchFileList(href, cb) {
    fetch(href, { credentials: 'same-origin' })
      .then((r) => r.text())
      .then((html) => {
        const fdoc = new DOMParser().parseFromString(html, 'text/html');
        const rows = [...fdoc.querySelectorAll('tr')];
        const start = rows.findIndex((r) => r.cells.length === 2 && /^file list/i.test(txt(r.cells[0]).trim()));
        if (start < 0) return cb(null);
        const out = [];
        for (let i = start + 1; i < rows.length; i++) {
          const r = rows[i];
          if (r.cells.length !== 2) break;
          if (DETAIL_ROW_LABELS.has(txt(r.cells[0]).replace(/\[[^\]]*\]/g, '').trim())) break;
          out.push([txt(r.cells[0]).trim(), txt(r.cells[1]).trim()]);
        }
        if (!out.length) return cb(null);
        const header = /^path$/i.test(out[0][0]) ? out.shift() : ['File', 'Size'];
        cb(
          el(
            'div',
            { class: 'cgx-tbl-wrap' },
            el(
              'table',
              { class: 'cgx-tbl' },
              el('thead', {}, el('tr', {}, header.map((h) => el('th', {}, h)))),
              el('tbody', {}, out.map((f) => el('tr', {}, f.map((c) => el('td', {}, c)))))
            )
          )
        );
      })
      .catch(() => cb(null));
  }

  // The peer list is AJAX-loaded by legacy JS: a hidden #peerlist_full_row +
  // #show_peerlist link on the page; clicking fills #peerlist_cell with
  // seeder/leecher counts in <b> and a table (User, Connectable, …). Users
  // are anonymized plain text ("Member X"); the Cigar and PM columns are
  // POST mini-forms — rebuild those as working buttons.
  function buildPeerTable(peerCell) {
    const table = peerCell.querySelector('table');
    if (!table) return null;
    const container = el('div', {});
    const counts = [...peerCell.querySelectorAll('b')].map(txt).filter((t) => /seeder|leecher/i.test(t));
    if (counts.length) container.append(el('div', { class: 'cgx-peer-counts' }, [...new Set(counts)].map(smartPlurals).join(' · ')));

    const headers = [...table.rows[0].cells].map((c) => txt(c).trim());
    const body = el('tbody');
    for (const r of [...table.rows].slice(1)) {
      if (!r.cells.length) continue;
      const tr = el('tr');
      for (const c of r.cells) {
        const form = c.querySelector('form');
        if (form) {
          const action = form.getAttribute('action') || '';
          const fields = [...form.querySelectorAll('input[type="hidden"]')].map((i) => [i.name, i.value]);
          const label = form.querySelector('input[type="submit"]')?.value || 'Send';
          tr.append(
            el(
              'td',
              {},
              el(
                'button',
                {
                  class: 'cgx-btn',
                  type: 'button',
                  onclick: () => {
                    const f = el('form', { method: 'post', action });
                    fields.forEach(([n, v]) => f.append(el('input', { type: 'hidden', name: n, value: v })));
                    document.body.append(f);
                    f.submit();
                  },
                },
                label
              )
            )
          );
        } else tr.append(el('td', {}, txt(c).trim()));
      }
      body.append(tr);
    }
    container.append(
      el(
        'div',
        { class: 'cgx-tbl-wrap' },
        el('table', { class: 'cgx-tbl' }, el('thead', {}, el('tr', {}, headers.map((h) => el('th', {}, h)))), body)
      )
    );
    return container;
  }

  function loadPeerList(_href, cb) {
    const show = document.getElementById('show_peerlist');
    const cell = document.getElementById('peerlist_cell');
    if (!show || !cell) return cb(null);
    if (cell.querySelector('table')) return cb(buildPeerTable(cell));
    // Fire the legacy AJAX loader; block the href navigation fallback.
    show.addEventListener('click', (e) => e.preventDefault(), { once: true });
    show.click();
    let tries = 0;
    const poll = setInterval(() => {
      if (cell.querySelector('table')) {
        clearInterval(poll);
        cb(buildPeerTable(cell));
      } else if (++tries > 40) {
        clearInterval(poll);
        cb(null);
      }
    }, 250);
  }

  function commentCard(c) {
    return el(
      'article',
      { class: 'cgx-comment' },
      el(
        'div',
        { class: 'cgx-comment-head' },
        c.avatar
          ? el('img', { class: 'cgx-comment-avatar', src: c.avatar, alt: c.user })
          : el('div', { class: 'cgx-comment-avatar fallback' }, (c.user || '?')[0].toUpperCase()),
        el(
          'div',
          { class: 'cgx-comment-who' },
          c.userA
            ? userLink(c.userA, 'cgx-comment-user')
            : el('a', { class: 'cgx-comment-user', href: c.userHref }, c.user || 'unknown'),
          c.klass ? el('span', { class: 'cgx-comment-class' }, c.klass) : null
        ),
        el('span', { class: 'cgx-comment-date' }, c.date + (c.num ? ` · #${c.num}` : ''))
      ),
      el('div', { class: 'cgx-comment-body' }, legacyEmbed(c.bodyCell))
    );
  }

  // details.php has no comment box of its own — it only links out to
  // comment.php. Pull that page's real form in here on demand (rather than
  // reconstructing its fields and hoping) so you can reply without leaving
  // the torrent.
  function commentComposerPanel(doc) {
    const tid = new URLSearchParams(location.search).get('id');
    const link = [...doc.querySelectorAll('a[href*="comment.php"]')].find((a) =>
      /action=add|add.*comment/i.test((a.getAttribute('href') || '') + ' ' + txt(a))
    );
    const href = link?.href || (tid ? `${location.origin}/comment.php?action=add&tid=${tid}` : null);
    if (!href) return null;

    const body = el('div', { class: 'cgx-section-body' });
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      body.append(el('div', { class: 'cgx-hero-loading' }, radMark('spin'), 'Loading the comment box…'));
      fetchDoc(href, (d) => {
        const form = d && [...d.forms].find((f) => f.querySelector('textarea'));
        body.textContent = '';
        if (!form) {
          body.append(
            el('p', { class: 'cgx-hint' }, "Couldn't load the comment box here — "),
            el('a', { href }, 'open it on its own page')
          );
          return;
        }
        const adopted = document.importNode(form, true);
        // The fetched document has no base URL, so resolve the action against
        // the page we pulled it from before the form is submitted from here.
        adopted.action = new URL(form.getAttribute('action') || href, href).href;
        adopted.classList.add('cgx-repform', 'cgx-reply');
        body.append(adopted);
        armFormEditors(adopted);
      });
    };
    const panel = rememberOpen(
      el('details', { class: 'cgx-user-section' }, el('summary', {}, 'Add a comment'), body),
      'add-comment'
    );
    panel.addEventListener('toggle', () => panel.open && load());
    if (panel.open) load();
    return panel;
  }

  function renderDetails(doc) {
    const d = parseDetails(doc);

    // Same green "N on CG" dupe badge as the browse cards, reusing its cache.
    // Clicking it toggles an inline panel of the other copies (lazily fetched
    // from the same search page); middle-click still opens the search itself.
    let dupeBadge = null;
    let dupePanel = null;
    if (FEATURES.dupeCheck && d.imdbId) {
      const t = { imdbId: d.imdbId, cgSearch: '/browse.php?search=' + d.imdbId };
      const currentId = Number(new URLSearchParams(location.search).get('id') || 0);
      dupePanel = el('section', { class: 'cgx-panel cgx-dupes-panel', hidden: '' });
      let dupesLoaded = false;
      dupeBadge = el('a', {
        class: 'cgx-badge dupes',
        href: t.cgSearch,
        title: 'Other CG torrents with this IMDB ID',
        onclick: (e) => {
          e.preventDefault();
          if (dupePanel.hidden && !dupesLoaded) {
            dupesLoaded = true;
            dupePanel.append(el('div', { class: 'cgx-hero-loading' }, radMark('spin'), 'Loading CG copies…'));
            fetchDupeCount(t, (n, torrents) => {
              const others = torrents.filter((x) => x.id !== currentId);
              dupePanel.textContent = '';
              dupePanel.append(
                el('h3', {}, `Other copies on CG (${others.length})`),
                others.length
                  ? el('div', { class: 'cgx-list' }, others.map((x) => torrentCard(x)))
                  : el('div', { class: 'cgx-empty' }, 'This is the only copy on CG.')
              );
            });
          }
          dupePanel.hidden = !dupePanel.hidden;
        },
      });
      const apply = (n) => {
        dupeBadge.textContent = n > 1 ? `${n} on CG` : 'only copy';
        dupeBadge.classList.add(n > 1 ? 'many' : 'one');
      };
      const cached = store.get('dupes:' + d.imdbId, null);
      if (cached != null) apply(cached);
      else fetchDupeCount(t, apply);
    }

    const INFO_LABELS = [
      'Type', 'Size', 'Views', 'Hits', 'Upped by', 'Last seeder',
      'Num files', 'Peers', 'Bookmarked by', 'Favourited by', 'Snatched', 'I have this', 'Info hash',
    ];
    // Small tiles first, full-width tiles (expanders, I have this, Info hash)
    // grouped below them.
    const tiles = [];
    const fullTiles = [];
    for (const label of INFO_LABELS) {
      const cell = d.cells[label];
      if (!cell) continue;
      // "I have this" is a live legacy form (checkbox + submit) — adoptValue
      // would strip the inputs, so proxy them instead.
      if (label === 'I have this') {
        const legacyBox = cell.querySelector('input[type="checkbox"]');
        if (legacyBox) {
          const ourBox = el('input', { type: 'checkbox' });
          ourBox.checked = legacyBox.checked;
          fullTiles.push(
            el(
              'div',
              { class: 'cgx-stat-tile full' },
              el(
                'div',
                { class: 'cgx-ihave' },
                ourBox,
                el(
                  'button',
                  {
                    class: 'cgx-btn',
                    type: 'button',
                    onclick: () => {
                      legacyBox.checked = ourBox.checked;
                      legacyBox.form?.submit();
                    },
                  },
                  'Save'
                ),
                // e.g. "Tick this if you have the file to reseed; untick if
                // you don't. (unsnatch cost: 630 credits)"
                el('span', { class: 'cgx-ihave-note' }, txt(cell))
              ),
              el('div', { class: 'lbl' }, label)
            )
          );
          continue;
        }
      }
      if (label === 'Size') {
        tiles.push(
          el(
            'div',
            { class: 'cgx-stat-tile' },
            el('div', { class: 'num' }, txt(cell).replace(/\s*\([^)]*bytes\)/i, '').trim()),
            el('div', { class: 'lbl' }, label)
          )
        );
        continue;
      }
      if (label === 'Last seeder') {
        tiles.push(
          el(
            'div',
            { class: 'cgx-stat-tile' },
            el('div', { class: 'num' }, txt(cell).replace(/^\s*last activity\s*/i, '').trim()),
            el('div', { class: 'lbl' }, label)
          )
        );
        continue;
      }
      // Num files / Peers: full-width tiles that toggle the legacy full list
      // (fetched lazily from the "[See full list]" href) below the value.
      if ((label === 'Num files' || label === 'Peers') && d.labelLinks[label]) {
        const fetcher = label === 'Num files' ? fetchFileList : loadPeerList;
        const value =
          label === 'Peers'
            ? smartPeers(txt(cell))
            : txt(cell).trim().replace(/(\d+)\s*files?\b/i, (m, n) => plural(n, 'file'));
        const body = el('div', { class: 'cgx-tile-expand', hidden: '' });
        let loaded = false;
        const tile = el(
          'div',
          {
            class: 'cgx-stat-tile full cgx-tile-toggle',
            onclick: () => {
              if (body.hidden && !loaded) {
                loaded = true;
                body.append(el('div', { class: 'cgx-hero-loading' }, radMark('spin'), 'Loading full list…'));
                fetcher(d.labelLinks[label], (result) => {
                  body.textContent = '';
                  body.append(result || el('div', { class: 'cgx-empty' }, "Old CG couldn't produce this list (its full-list page errors out)."));
                });
              }
              body.hidden = !body.hidden;
              tile.classList.toggle('open', !body.hidden);
            },
          },
          el('div', { class: 'num' }, value),
          el('div', { class: 'lbl' }, label, el('span', { class: 'cgx-tile-caret' }, ' ▸')),
          body
        );
        fullTiles.push(tile);
        continue;
      }
      const isHash = label === 'Info hash';
      (isHash ? fullTiles : tiles).push(
        el(
          'div',
          { class: 'cgx-stat-tile' + (isHash ? ' full' : '') },
          el('div', { class: 'num' + (isHash ? ' mono' : '') }, ...adoptValue(cell)),
          el('div', { class: 'lbl' }, label)
        )
      );
    }
    tiles.push(...fullTiles);

    // Torrent title block — heads the merged film card when we have an IMDB
    // id, or sits in its own panel otherwise. The year moves out of the rip
    // tag ("1936/BRRIP/…" → "BRRIP/…") to sit beside the title.
    let year = null;
    const tags = d.tags.map((t) => {
      const m = t.match(/^((?:19|20)\d\d(?:-\d\d(?:\d\d)?)?)\/(.+)$/);
      if (m) {
        year = year || m[1];
        return m[2];
      }
      return t;
    });

    let bmBusy = false;
    const bookmarkPill = d.bookmark
      ? el(
          'button',
          {
            class: 'cgx-bmark-pill' + (d.bookmarked ? ' on' : ''),
            type: 'button',
            title: 'Toggle bookmark',
            onclick: async (e) => {
              const pill = e.currentTarget;
              if (bmBusy) return;
              bmBusy = true;
              try {
                await toggleBookmark(d);
                pill.classList.toggle('on');
                pill.textContent = pill.classList.contains('on') ? '★ bookmarked' : '☆ bookmark';
              } catch (err) {
                console.warn('[cg-redux] bookmark failed', err);
              }
              bmBusy = false;
            },
          },
          d.bookmarked ? '★ bookmarked' : '☆ bookmark'
        )
      : null;

    const titleRow = el(
      'div',
      { class: 'cgx-hero-title' },
      el('h2', {}, d.name),
      year ? el('span', { class: 'cgx-hero-year' }, year) : null,
      tags.map((t) => el('span', { class: 'cgx-tag' }, t)),
      d.bonus ? el('span', { class: 'cgx-bonus' }, d.bonus) : null,
      dupeBadge,
      bookmarkPill
    );
    const titleWrap = el(
      'div',
      { class: 'cgx-detail-title-wrap' },
      titleRow,
      d.downloadName ? el('div', { class: 'cgx-detail-file' }, d.downloadName) : null,
      d.added ? el('div', { class: 'cgx-detail-added' }, 'Uploaded ' + d.added) : null,
      d.cells['Tagline'] ? el('div', { class: 'cgx-detail-tagline' }, txt(d.cells['Tagline'])) : null
    );
    const downloadBtn = d.download ? el('a', { class: 'cgx-btn primary', href: d.download }, '⬇ Download .torrent') : null;

    const content = el(
      'div',
      {},
      d.imdbId
        ? buildFilmHero(d.imdbId, { titleWrap, titleRow, download: downloadBtn })
        : el('section', { class: 'cgx-panel cgx-detail-head' }, titleWrap, downloadBtn),
      dupePanel,
      d.cells['Description']
        ? el('section', { class: 'cgx-panel' }, el('h3', {}, 'Description'), legacyEmbed(d.cells['Description']))
        : null,
      tiles.length
        ? el(
            'details',
            {
              class: 'cgx-panel cgx-tinfo',
              open: store.get('torrentInfoOpen', true) ? '' : null,
              ontoggle: (e) => store.set('torrentInfoOpen', e.target.open),
            },
            el('summary', {}, el('h3', {}, 'Torrent info')),
            el('div', { class: 'cgx-info-tiles' }, tiles)
          )
        : null,
      d.cells['mediainfo'] ? collapsible('Mediainfo', legacyEmbed(d.cells['mediainfo'])) : null,
      d.cells['Other torrents'] ? collapsible('Other torrents', legacyEmbed(d.cells['Other torrents'])) : null,
      d.alsoGot.length
        ? collapsible(
            `People who got this also got… (${d.alsoGot.length})`,
            el(
              'div',
              { class: 'cgx-tbl-wrap' },
              el(
                'table',
                { class: 'cgx-tbl' },
                el('thead', {}, el('tr', {}, ['Type', 'Name', 'Size', 'Snatched', 'Seed', 'Leech'].map((h) => el('th', {}, h)))),
                el(
                  'tbody',
                  {},
                  d.alsoGot.map((t) =>
                    el(
                      'tr',
                      {},
                      el('td', {}, el('img', { class: 'cgx-tbl-icon', src: t.catIcon, alt: t.category, title: t.category })),
                      el(
                        'td',
                        {},
                        el('a', { class: 'cgx-tbl-title' + (t.snatchedByUser ? ' snatched' : ''), href: t.href }, t.title),
                        t.tags.length ? el('div', { class: 'cgx-tbl-sub' }, t.tags.join(' · ')) : null
                      ),
                      el('td', {}, t.size),
                      el('td', {}, t.snatched),
                      el('td', {}, t.seeders),
                      el('td', {}, t.leechers)
                    )
                  )
                )
              )
            )
          )
        : null,
      d.comments.length
        ? collapsible(
            `Comments (${d.comments.length}${d.commentPages.length ? '+' : ''})`,
            el(
              'div',
              {},
              d.comments.map(commentCard),
              d.commentPages.length
                ? el('nav', { class: 'cgx-pages' }, d.commentPages.map((p) => el('a', { class: 'cgx-page', href: p.href }, p.label)))
                : null
            ),
            // Arriving via a comment-page link: open the section so you land on comments.
            new URLSearchParams(location.search).has('page') ? 'force' : false
          )
        : null,
      commentComposerPanel(doc)
    );
    renderShell(doc, content);
  }

  /* ------------------------------- landing page ------------------------------- */

  // Index sections all live in one single-column table: a td.colhead header
  // row, then a content row. News posts repeat A(title) "by" A(user) "at date"
  // DIV(body) as flat siblings; the poll nests P>B(question) + a results table
  // of [label | bar | pct] rows; stats/featured are two plain tables.
  function parseIndex(doc) {
    const secCell = (re) => {
      const head = [...doc.querySelectorAll('td.colhead')].find((h) => re.test(txt(h).trim()));
      return head ? head.closest('tr').nextElementSibling?.cells?.[0] : null;
    };

    const news = [];
    const newsCell = secCell(/^recent news$/i);
    if (newsCell) {
      let cur = null;
      for (const n of newsCell.childNodes) {
        if (n.nodeType === 1 && n.tagName === 'A') {
          if (!cur || cur.body) {
            if (cur) news.push(cur);
            cur = { title: txt(n), titleHref: n.href };
          } else {
            cur.user = txt(n);
            cur.userHref = n.href;
          }
        } else if (n.nodeType === 3 && cur && !cur.body) {
          const m = n.textContent.match(/at\s+([\d][\d\s:-]*)/);
          if (m) cur.date = m[1].trim();
        } else if (n.nodeType === 1 && n.tagName === 'DIV' && cur && !cur.body) {
          cur.body = n;
        }
      }
      if (cur) news.push(cur);
    }

    let poll = null;
    const pollCell = secCell(/^poll$/i);
    if (pollCell) {
      const question = txt(pollCell.querySelector('b'));
      if (pollCell.querySelector('input[type="radio"]')) {
        // Not voted yet: keep the live legacy form so voting still works.
        poll = { question, legacy: pollCell };
      } else {
        const results = pollCell.querySelector('td.text table');
        poll = {
          question,
          options: results
            ? [...results.rows]
                .map((r) => ({ label: txt(r.cells[0]), pct: parseFloat(txt(r.cells[2])) || 0 }))
                .filter((o) => o.label)
            : [],
          votes: ((pollCell.textContent || '').match(/Votes:\s*([\d,]+)/) || [])[1] || '',
          prevHref: [...pollCell.querySelectorAll('a')].find((a) => /previous polls/i.test(txt(a)))?.href,
        };
      }
    }

    let stats = [];
    let featured = [];
    const statsCell = secCell(/featured torrents/i);
    if (statsCell) {
      const [statsTbl, featTbl] = statsCell.querySelectorAll(':scope > table');
      stats = statsTbl
        ? [...statsTbl.rows]
            .map((r) => ({ label: txt(r.cells[0]), value: txt(r.cells[1]) }))
            .filter((s) => s.label && s.value)
        : [];
      featured = featTbl
        ? [...featTbl.rows]
            .map((r) => {
              const a = r.cells[1]?.querySelector('a');
              const img = r.cells[0]?.querySelector('img');
              return a ? { title: txt(a), href: a.href, icon: img?.src, cat: img?.title || img?.alt || '' } : null;
            })
            .filter(Boolean)
        : [];
    }

    return { news, poll, stats, featured, disclaimer: txt(secCell(/^disclaimer$/i)) };
  }

  function renderIndex(doc) {
    const d = parseIndex(doc);

    const newsItem = (p) =>
      el(
        'article',
        { class: 'cgx-news-item' },
        el('div', { class: 'cgx-news-marker' }, radMark()),
        el(
          'div',
          { class: 'cgx-news-head' },
          el('h4', {}, p.title),
          el(
            'span',
            { class: 'cgx-news-meta' },
            'by ',
            p.userHref ? el('a', { href: p.userHref }, p.user) : p.user || '?',
            p.date ? ' · ' + p.date : ''
          )
        ),
        p.body ? el('div', { class: 'cgx-news-body' }, legacyEmbed(p.body)) : null
      );

    let pollSection = null;
    if (d.poll && d.poll.legacy) {
      pollSection = el('section', { class: 'cgx-panel' }, el('h3', {}, 'Poll'), legacyEmbed(d.poll.legacy));
    } else if (d.poll) {
      pollSection = el(
        'section',
        { class: 'cgx-panel cgx-poll' },
        el('h3', {}, 'Poll'),
        el('p', { class: 'cgx-poll-q' }, d.poll.question),
        d.poll.options.map((o, i) =>
          el(
            'div',
            { class: 'cgx-poll-opt' },
            el('div', { class: 'cgx-poll-labels' }, el('span', {}, o.label), el('span', { class: 'pct' }, o.pct + '%')),
            el(
              'div',
              { class: 'cgx-poll-track' },
              el('div', { class: 'cgx-poll-bar', 'data-pct': o.pct, style: `transition-delay: ${i * 90}ms` })
            )
          )
        ),
        el(
          'div',
          { class: 'cgx-poll-foot' },
          el('span', {}, d.poll.votes ? `Votes: ${d.poll.votes}` : ''),
          d.poll.prevHref ? el('a', { href: d.poll.prevHref }, 'Previous polls') : null
        )
      );
    }

    const content = el(
      'div',
      {},
      el(
        'div',
        { class: 'cgx-index-grid' },
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Recent News'),
          d.news.length ? el('div', { class: 'cgx-news' }, d.news.map(newsItem)) : el('div', { class: 'cgx-empty' }, 'No news is good news.')
        ),
        el(
          'div',
          { class: 'cgx-index-side' },
          pollSection,
          d.stats.length
            ? el(
                'section',
                { class: 'cgx-panel' },
                el('h3', {}, 'Site stats'),
                el(
                  'div',
                  { class: 'cgx-stats-grid' },
                  d.stats.map((s) => el('div', { class: 'cgx-stat-tile' }, el('div', { class: 'num' }, s.value), el('div', { class: 'lbl' }, s.label)))
                )
              )
            : null,
          d.featured.length
            ? el(
                'section',
                { class: 'cgx-panel' },
                el('h3', {}, 'Featured'),
                el(
                  'div',
                  { class: 'cgx-feat-mini' },
                  d.featured.map((f) =>
                    el('a', { class: 'cgx-feat-link', href: f.href }, f.icon ? el('img', { src: f.icon, alt: f.cat, title: f.cat }) : null, f.title)
                  )
                )
              )
            : null
        )
      ),
      d.disclaimer ? el('p', { class: 'cgx-disclaimer' }, d.disclaimer) : null
    );

    renderShell(doc, content);

    // Grow the poll bars in after first paint.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.querySelectorAll('.cgx-poll-bar').forEach((b) => (b.style.width = b.dataset.pct + '%'));
      })
    );
  }

  /* ------------------------------- credits page ------------------------------- */

  function parseCredits(doc) {
    // Heading is an <h2> ("You have N credits available to spend."); items are
    // 2-cell label/value rows in a nested table — sweep and dedupe by label.
    const head = [...doc.querySelectorAll('h1, h2, td.colhead')].find((h) => /credits available/i.test(txt(h)));
    const seen = new Set();
    const items = [...doc.querySelectorAll('tr')]
      .filter((r) => r.cells.length === 2)
      .map((r) => ({ label: txt(r.cells[0]).replace(/\s+/g, ' ').trim(), cell: r.cells[1] }))
      .filter((i) => i.label.length > 3 && i.label.length < 45 && txt(i.cell).trim())
      .filter((i) => !seen.has(i.label) && seen.add(i.label));
    return { available: ((txt(head) || '').match(/([\d,]+)\s*credits/i) || [])[1] || '', items };
  }

  function renderCredits(doc) {
    const d = parseCredits(doc);

    const itemTile = (it) => {
      const link = it.cell.querySelector('a');
      // Items this account can still buy may carry live form controls — keep
      // them functional rather than rebuilding.
      const hasControls = it.cell.querySelector('input:not([type="hidden"]), select, textarea, button');
      let value;
      if (hasControls) value = el('div', { class: 'val' }, legacyEmbed(it.cell));
      else if (link) {
        const note = txt(it.cell).replace(txt(link), '').replace(/\s+/g, ' ').trim();
        value = el(
          'div',
          { class: 'val' },
          el('a', { class: 'cgx-btn primary', href: link.href }, txt(link) || 'Go'),
          note ? el('span', { class: 'cgx-credit-note' }, note) : null
        );
      } else value = el('div', { class: 'num' }, txt(it.cell).trim());
      return el('div', { class: 'cgx-stat-tile cgx-credit-tile' }, value, el('div', { class: 'lbl' }, it.label));
    };

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Credits'),
          el(
            'div',
            { class: 'cgx-stat-tile big cgx-credit-hero' },
            el('div', { class: 'num' }, d.available),
            el('div', { class: 'lbl' }, 'credits available to spend')
          ),
          el('div', { class: 'cgx-info-tiles' }, d.items.map(itemTile))
        )
      )
    );
  }

  /* ------------------------------- small pages ------------------------------- */

  function statTile(num, lbl, cls = '') {
    return el(
      'div',
      { class: 'cgx-stat-tile' + (cls ? ' ' + cls : '') },
      el('div', { class: 'num' }, num),
      el('div', { class: 'lbl' }, lbl)
    );
  }

  const leafTables = (doc) =>
    [...doc.querySelectorAll('table')].filter((t) => t.rows.length > 1 && !t.querySelector('table'));

  // viewrequests.php — currently just an "offline" notice; keep a legacy
  // fallback so the page still works if requests ever come back.
  function renderRequests(doc) {
    const notice = [...doc.querySelectorAll('h1, h2, p')].find((n) => /requests are offline/i.test(txt(n)));
    let body;
    if (notice) {
      body = el(
        'section',
        { class: 'cgx-panel cgx-empty' },
        radMark('big'),
        el('h2', {}, 'Requests are taking a break'),
        el('p', {}, txt(notice).trim())
      );
    } else {
      const head = [...doc.querySelectorAll('td.colhead, h1, h2')].find((h) => /request/i.test(txt(h)));
      const table = head && head.closest('table');
      body = el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Requests'),
        table ? legacyEmbed(table) : el('p', {}, 'Could not parse the requests page.')
      );
    }
    renderShell(doc, el('div', {}, body));
  }

  /* randomtrailer.php */

  function renderTrailer(doc) {
    const iframe = doc.querySelector('iframe, embed, object');
    const cell = iframe && iframe.closest('td');
    const count = cell ? (txt(cell).match(/([\d,]+)\s+trailers available/i) || [])[1] : '';
    const titleLink = cell && cell.querySelector('a[href*="details.php"]');
    const broken = cell && [...cell.querySelectorAll('a')].find((a) => /no worky/i.test(txt(a)));

    const m = titleLink ? txt(titleLink).match(/^(.*?)\s*\[([^\]]+)\]$/) : null;
    let frame = null;
    if (iframe) {
      frame = iframe.cloneNode(true);
      frame.removeAttribute('width');
      frame.removeAttribute('height');
    }

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-trailer-head' },
            el(
              'div',
              {},
              titleLink
                ? el('a', { class: 'cgx-trailer-title', href: titleLink.href }, m ? m[1] : txt(titleLink))
                : el('span', { class: 'cgx-trailer-title' }, 'Random trailer'),
              m ? el('span', { class: 'cgx-tag' }, m[2]) : null
            ),
            el(
              'div',
              { class: 'cgx-trailer-actions' },
              el('a', { class: 'cgx-btn primary', href: '/randomtrailer.php' }, '↻ Another trailer'),
              broken ? el('a', { class: 'cgx-btn ghost', href: broken.href, title: 'Report a broken embed' }, txt(broken)) : null
            )
          ),
          frame
            ? el('div', { class: 'cgx-trailer-box' }, frame)
            : el('p', {}, 'No trailer embed found on this page.'),
          count ? el('p', { class: 'cgx-trailer-count' }, `${count} trailers available`) : null
        )
      )
    );
  }

  /* featurama.php — bid credits toward the torrents you want featured */

  function parseFeaturama(doc) {
    const tt = doc.querySelector('table.torrenttable');
    const rows = tt
      ? [...tt.rows]
          .slice(1)
          .map((r) => {
            const link = r.cells[1] && r.cells[1].querySelector('a[href*="details.php"]');
            if (!link) return null;
            const img = r.cells[0].querySelector('img');
            return {
              title: txt(link),
              href: link.href,
              category: img?.title || img?.alt || '',
              catIcon: img?.src,
              seeds: txt(r.cells[2]),
              credits: txt(r.cells[3]),
              input: r.querySelector('input[type="text"]'),
              submit: r.querySelector('input[type="submit"], button'),
            };
          })
          .filter(Boolean)
      : [];
    const votedLink = [...doc.querySelectorAll('a')].find((a) => /voted for/i.test(txt(a)));
    const seenPage = new Set();
    const pages = [...doc.querySelectorAll('a[href*="page="]')]
      .filter((a) => a.getAttribute('href')?.includes('featurama'))
      .map((a) => ({ label: txt(a).trim(), href: a.href }))
      .filter((p) => p.label && !seenPage.has(p.label) && seenPage.add(p.label));
    return { rows, votedLink, pages };
  }

  function renderFeaturama(doc) {
    const d = parseFeaturama(doc);

    const voteControls = (r) => {
      const inp = el('input', { class: 'cgx-vote-input', type: 'number', min: '1', placeholder: 'credits' });
      const btn = el(
        'button',
        {
          class: 'cgx-btn',
          type: 'button',
          onclick: () => {
            if (!r.input || !r.submit || !inp.value) return;
            r.input.value = inp.value;
            r.submit.click();
          },
        },
        'Vote'
      );
      inp.addEventListener('keydown', (e) => e.key === 'Enter' && btn.click());
      return el('div', { class: 'cgx-vote' }, inp, btn);
    };

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-panel-head' },
            el('h3', {}, 'Featurama'),
            d.votedLink ? el('a', { class: 'cgx-btn ghost', href: d.votedLink.href }, txt(d.votedLink).replace(/[[\]]/g, '')) : null
          ),
          el('p', { class: 'cgx-hint' }, 'Spend credits to vote torrents into the featured slots — highest totals win.'),
          el(
            'div',
            { class: 'cgx-tbl-wrap' },
            el(
              'table',
              { class: 'cgx-tbl' },
              el('thead', {}, el('tr', {}, ['Type', 'Name', 'Seeds', 'Credits voted', ''].map((h) => el('th', {}, h)))),
              el(
                'tbody',
                {},
                d.rows.map((r) =>
                  el(
                    'tr',
                    {},
                    el('td', {}, r.catIcon ? el('img', { class: 'cgx-tbl-icon', src: r.catIcon, alt: r.category, title: r.category }) : null),
                    el('td', {}, el('a', { class: 'cgx-tbl-title', href: r.href }, r.title)),
                    el('td', {}, r.seeds),
                    el('td', {}, r.credits),
                    el('td', {}, voteControls(r))
                  )
                )
              )
            )
          ),
          d.pages.length
            ? el('nav', { class: 'cgx-pages' }, d.pages.map((p) => el('a', { class: 'cgx-page', href: p.href }, p.label)))
            : null
        )
      )
    );
  }

  /* competitions.php */

  function renderCompetitions(doc) {
    const t = leafTables(doc).find((x) => /entries/i.test(txt(x.rows[0])) && /winner/i.test(txt(x.rows[0])));
    const comps = t
      ? [...t.rows].slice(1).map((r) => {
          const c = r.cells;
          const a = (cell) => cell && cell.querySelector('a');
          return {
            name: txt(c[0]).trim(),
            entries: txt(c[1]),
            entriesHref: a(c[1])?.href,
            contenders: txt(c[2]),
            contendersHref: a(c[2])?.href,
            start: (txt(c[3]) || '').trim().split(' ')[0],
            end: (txt(c[4]) || '').trim().split(' ')[0],
            forum: a(c[5])?.href,
            winner: txt(c[6] || null).trim(),
            winnerHref: a(c[6])?.href,
          };
        })
      : [];

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Upload competitions'),
          comps.length
            ? el(
                'div',
                { class: 'cgx-tbl-wrap' },
                el(
                  'table',
                  { class: 'cgx-tbl' },
                  el('thead', {}, el('tr', {}, ['Name', 'Entries', 'Contenders', 'Ran', 'Winner'].map((h) => el('th', {}, h)))),
                  el(
                    'tbody',
                    {},
                    comps.map((c) =>
                      el(
                        'tr',
                        {},
                        el(
                          'td',
                          {},
                          el('span', { class: 'cgx-tbl-title' }, c.name),
                          c.forum ? el('div', { class: 'cgx-tbl-sub' }, el('a', { href: c.forum }, 'Forum thread')) : null
                        ),
                        el('td', {}, c.entriesHref ? el('a', { href: c.entriesHref }, c.entries) : c.entries),
                        el('td', {}, c.contendersHref ? el('a', { href: c.contendersHref }, c.contenders) : c.contenders),
                        el('td', {}, `${c.start} → ${c.end}`),
                        el('td', {}, c.winnerHref ? el('a', { href: c.winnerHref }, c.winner) : c.winner || '—')
                      )
                    )
                  )
                )
              )
            : el('p', {}, 'No competitions found.')
        )
      )
    );
  }

  /* stats.php */

  function renderStats(doc) {
    const rows = [...doc.querySelectorAll('tr')].filter((r) => r.cells.length === 2 && !r.querySelector('table'));
    const stats = [];
    const months = [];
    for (const r of rows) {
      const label = txt(r.cells[0]).trim();
      const val = txt(r.cells[1]).trim();
      if (!label || !val) continue;
      if (/^\d{4}-\d{2}$/.test(label)) months.push({ month: label, users: parseInt(val.replace(/,/g, ''), 10) || 0 });
      else if (!/^month$/i.test(label) && label.length < 45) stats.push({ label, val });
    }
    const maxUsers = Math.max(1, ...months.map((m) => m.users));

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Site stats'),
          el('div', { class: 'cgx-info-tiles' }, stats.map((s) => statTile(s.val, s.label)))
        ),
        months.length
          ? collapsible(
              `Registrations by month (${months.length} months)`,
              el(
                'div',
                { class: 'cgx-bars' },
                months.map((m) =>
                  el(
                    'div',
                    { class: 'cgx-bar-row' },
                    el('span', {}, m.month),
                    el('div', { class: 'track' }, el('div', { class: 'bar', style: `width: ${(m.users / maxUsers) * 100}%` })),
                    el('span', { class: 'n' }, String(m.users))
                  )
                )
              ),
              true
            )
          : null
      )
    );
  }

  /* ranks.php */

  function renderRanks(doc) {
    const t = leafTables(doc).find((x) => /points/i.test(txt(x.rows[0])));
    const tiers = t
      ? [...t.rows].slice(1).map((r) => ({
          range: txt(r.cells[0]).trim(),
          name: txt(r.cells[1]).trim(),
          icon: r.cells[1].querySelector('img')?.src || null,
        }))
      : [];
    const paras = [...doc.querySelectorAll('p')].map((p) => txt(p).replace(/\s+/g, ' ').trim()).filter(Boolean);
    const m = (paras.find((s) => /your rank:/i.test(s)) || '').match(/your rank:\s*(.+?)\s*\(([\d,]+)\)/i);
    const rankName = m ? m[1] : '';
    const points = m ? parseInt(m[2].replace(/,/g, ''), 10) : null;
    const notes = paras.filter((s) => !/your rank:/i.test(s));

    const current = tiers.find((tier) => tier.name === rankName);
    // "2000 - 3999" → progress through the current bracket
    let progress = null;
    if (current && points != null) {
      const [lo, hi] = (current.range.match(/([\d,]+)\s*-\s*([\d,]+)/) || [])
        .slice(1)
        .map((n) => parseInt(n.replace(/,/g, ''), 10));
      if (lo != null && hi != null && hi > lo) progress = Math.min(100, ((points - lo) / (hi - lo)) * 100);
    }

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Your rank'),
          el(
            'div',
            { class: 'cgx-rank-hero' },
            current && current.icon ? el('img', { src: current.icon, alt: rankName }) : null,
            el(
              'div',
              { class: 'cgx-rank-hero-info' },
              el('div', { class: 'cgx-rank-name' }, rankName || 'Unranked'),
              points != null ? el('div', { class: 'cgx-rank-points' }, `${points.toLocaleString()} rank points`) : null,
              progress != null
                ? el('div', { class: 'cgx-rank-track' }, el('div', { class: 'cgx-rank-bar', style: `width: ${progress}%` }))
                : null
            )
          ),
          notes.map((n) => el('p', { class: 'cgx-hint' }, n))
        ),
        tiers.length
          ? el(
              'section',
              { class: 'cgx-panel' },
              el('h3', {}, 'The ladder'),
              tiers.map((tier) =>
                el(
                  'div',
                  { class: 'cgx-rank-row' + (tier === current ? ' on' : '') },
                  tier.icon ? el('img', { src: tier.icon, alt: '' }) : el('span', { class: 'cgx-rank-mystery' }, '?'),
                  el('span', {}, tier.name),
                  el('span', { class: 'range' }, tier.range)
                )
              )
            )
          : null
      )
    );
  }

  /* chat.php — IRC. Legacy is an intro line + irc:// links + a mibbit web
     client link; we embed mibbit on demand rather than auto-loading it. */

  function renderIrc(doc) {
    const intro = [...doc.querySelectorAll('div, p, td')].find(
      (n) => /irc channel is located/i.test(txt(n)) && !n.querySelector('div, p')
    );
    const region = intro ? intro.parentElement : doc.body;
    const anchors = [...region.querySelectorAll('a')];
    const chan = anchors.find((a) => txt(a).trim().startsWith('#'));
    const server = anchors.find((a) => (a.getAttribute('href') || '').startsWith('irc') && !txt(a).trim().startsWith('#'));

    // The legacy page's web client was mibbit, which shut down — Kiwi IRC is
    // its recommended replacement and loads happily in a frame.
    const chanName = chan ? txt(chan).trim() : '#cinemageddon';
    const serverHost = server ? txt(server).trim() : 'irc.cinemageddon.net';
    const webChat = `https://kiwiirc.com/nextclient/#irc://${serverHost}:6667/${chanName}`;

    const chatBox = el('div', { class: 'cgx-irc-box' });
    const launch = el(
      'button',
      {
        class: 'cgx-btn primary',
        type: 'button',
        onclick: () => {
          if (chatBox.classList.contains('open')) return;
          chatBox.appendChild(el('iframe', { class: 'cgx-irc-frame', src: webChat }));
          chatBox.classList.add('open');
          launch.textContent = '● Web chat running below';
          launch.setAttribute('disabled', '');
        },
      },
      '▶ Launch web chat'
    );

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'IRC'),
          el(
            'div',
            { class: 'cgx-info-tiles' },
            statTile(chan ? el('a', { href: chan.href }, txt(chan).trim()) : '#cinemageddon', 'channel'),
            statTile(
              server ? el('a', { href: server.href }, txt(server).trim()) : 'irc.cinemageddon.net',
              'server'
            )
          ),
          el(
            'p',
            { class: 'cgx-hint' },
            `The channel is ${chanName} on ${serverHost}. Use the web chat below (Kiwi IRC — the old mibbit client shut down) or a desktop client such as mIRC.`
          ),
          el(
            'div',
            { class: 'cgx-irc-actions' },
            launch,
            chan ? el('a', { class: 'cgx-btn', href: chan.href }, 'Open in IRC app') : null,
            el('a', { class: 'cgx-btn ghost', href: webChat, target: '_blank' }, 'Kiwi IRC in a new tab')
          ),
          chatBox
        )
      )
    );
  }

  /* --------------------------------- login page ------------------------------ */
  // Standalone shell (no sidebar/topbar — we're logged out). The REAL legacy
  // form is reparented, not cloned or proxied: submission, the returnto
  // hidden field, and browser password autofill all keep working, and the
  // script never touches credentials.

  function renderLogin(doc) {
    const form = [...doc.forms].find((f) => f.querySelector('input[type="password"]'));
    if (!form) throw new Error('no login form found');

    const bodyText = txt(doc.body);
    const notLoggedIn = /not logged in!/i.test(bodyText);
    const noticeEl = [...doc.querySelectorAll('td, div, p')].find(
      (n) => /^NOTICE:/i.test(txt(n).trim()) && !n.querySelector('td, div, p')
    );
    const findA = (re) => [...doc.querySelectorAll('a')].find((a) => re.test(txt(a).trim()));
    const signupA = findA(/^sign ?up$/i);
    const recoveryA = findA(/^password recovery$/i);
    const clearA = findA(/^here$/i);
    const ircA = findA(/^on irc$/i);

    form.classList.add('cgx-login-form');
    // The "you need cookies" note lives inside the form — our footer already
    // says it, so drop the duplicate (element or bare text node).
    [...form.childNodes].forEach((n) => {
      if (/cookies enabled/i.test(n.textContent || '')) n.remove();
    });

    const root = el(
      'div',
      { id: 'cg-redux-root', 'data-cgx-version': '0.23.8', class: 'cgx-login-page' },
      el(
        'div',
        { class: 'cgx-login-wrap' },
        el('div', { class: 'cgx-brand' }, radMark(), 'CINEMA', el('span', {}, 'GEDDON')),
        notLoggedIn
          ? el('div', { class: 'cgx-login-alert' }, 'That page needs an account — log in and you’ll be sent straight back.')
          : null,
        el(
          'div',
          { class: 'cgx-panel cgx-login-card' },
          noticeEl ? el('div', { class: 'cgx-login-notice' }, txt(noticeEl).replace(/^NOTICE:\s*/i, '')) : null,
          form,
          el(
            'div',
            { class: 'cgx-login-links' },
            signupA ? el('span', {}, 'No account? ', el('a', { href: signupA.href }, 'Sign up')) : null,
            recoveryA ? el('span', {}, 'Forgotten password? ', el('a', { href: recoveryA.href }, 'Recovery')) : null
          )
        ),
        el(
          'p',
          { class: 'cgx-login-help' },
          'Cookies must be enabled. Trouble logging in? Clear your cookies',
          clearA ? [' or ', el('a', { href: clearA.href }, 'reset your session')] : null,
          ircA ? [' — still stuck? Ask ', el('a', { href: ircA.href }, 'on IRC')] : null,
          '.'
        )
      )
    );

    injectStyles();
    doc.body.appendChild(root);
  }

  /* ------------------------- logged-out welcome + signup ---------------------- */

  function renderWelcome(doc) {
    const paras = [...doc.querySelectorAll('p')]
      .map((p) => txt(p))
      .filter((t) => t && !/you are logged out/i.test(t));
    const discBody = [...doc.querySelectorAll('td')].find(
      (c) => /none of the files shown here/i.test(txt(c)) && !c.querySelector('td')
    );
    const findA = (re) => [...doc.querySelectorAll('a')].find((a) => re.test(txt(a).trim()));
    const loginA = findA(/^login$/i);
    const signupA = findA(/^signup$/i);

    const root = el(
      'div',
      { id: 'cg-redux-root', 'data-cgx-version': '0.23.8', class: 'cgx-login-page' },
      el(
        'div',
        { class: 'cgx-login-wrap wide' },
        el('div', { class: 'cgx-brand' }, radMark(), 'CINEMA', el('span', {}, 'GEDDON')),
        el(
          'div',
          { class: 'cgx-panel cgx-welcome-card' },
          el('h2', {}, 'Cinemawhat now?'),
          paras.map((t) => el('p', {}, t)),
          el(
            'div',
            { class: 'cgx-welcome-actions' },
            loginA ? el('a', { class: 'cgx-btn primary', href: loginA.href }, 'Log in') : null,
            signupA ? el('a', { class: 'cgx-btn', href: signupA.href }, 'Sign up') : null
          )
        ),
        discBody ? el('p', { class: 'cgx-login-help' }, txt(discBody)) : null
      )
    );
    injectStyles();
    doc.body.appendChild(root);
  }

  function renderSignup(doc) {
    // Signups are invite-only these days — but if the form ever comes back,
    // reparent it like the login form so autofill keeps working.
    const form = [...doc.forms].find((f) => f.querySelector('input[type="password"]'));
    let card;
    if (form) {
      form.classList.add('cgx-login-form');
      card = el('div', { class: 'cgx-panel cgx-login-card' }, form);
    } else {
      const msg =
        (txt(doc.body).match(/(?:arr matey)?[^.]*no moar open signups[^.]*\.\s*[^.]*\./i) || [])[0] ||
        'Signups are currently closed — you need an invite from a registered user.';
      card = el(
        'div',
        { class: 'cgx-panel cgx-empty' },
        radMark('big'),
        el('h2', {}, 'Signups are invite-only'),
        el('p', {}, msg.trim())
      );
    }
    const root = el(
      'div',
      { id: 'cg-redux-root', 'data-cgx-version': '0.23.8', class: 'cgx-login-page' },
      el(
        'div',
        { class: 'cgx-login-wrap' },
        el('div', { class: 'cgx-brand' }, radMark(), 'CINEMA', el('span', {}, 'GEDDON')),
        card,
        el('p', { class: 'cgx-login-help' }, el('a', { href: '/login.php' }, 'Back to login'))
      )
    );
    injectStyles();
    doc.body.appendChild(root);
  }

  /* ------------------------------ nav-page sweep ------------------------------ */

  function pagerNav(doc) {
    return pagerFrom(pagerCandidates(doc));
  }

  const pagerCandidates = (doc) =>
    [...doc.querySelectorAll('a[href*="page="]')].filter((a) => /^[\d\s\-,]+$|prev|next|<<|>>/i.test(txt(a).trim()));

  // The legacy pager emits EVERY page as a link (463 chips on long threads),
  // marks the current page as a bare <font>, and repeats the whole block
  // top + bottom. Scope to the densest container, then window the numbers.
  function pagerFrom(cands) {
    if (!cands.length) return null;
    // Group by block ancestor, not parentElement — viewforum wraps every pager
    // link in its own <b>, which would shatter the pager into 1-link groups.
    const block = (a) => a.closest('p, td, div, center') || a.parentElement;
    const byBlock = new Map();
    cands.forEach((a) => byBlock.set(block(a), (byBlock.get(block(a)) || 0) + 1));
    const container = [...byBlock.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const nums = new Map(); // page number → href
    const other = [];
    let prev = null;
    let next = null;
    for (const a of cands.filter((x) => container.contains(x))) {
      const label = txt(a).replace(/[<>]/g, '').trim();
      if (/^prev$/i.test(label)) prev = a.href;
      else if (/^next$/i.test(label)) next = a.href;
      else if (/^\d+$/.test(label)) nums.set(+label, a.href);
      else other.push({ label, href: a.href });
    }
    // Current page: the pager's only non-link pure number (a bare <font>/<b>).
    const current = [...container.querySelectorAll('font, b, strong, span')]
      .filter((x) => !x.querySelector('a') && !x.closest('a') && /^\d+$/.test(txt(x)))
      .map((x) => +txt(x))[0];
    const chip = (label, href) => el('a', { class: 'cgx-page', href }, label);
    const items = [];
    if (nums.size) {
      const last = Math.max(...nums.keys(), current || 0);
      const want = new Set([1, 2, last - 1, last]);
      for (let i = (current || 0) - 2; i <= (current || 0) + 2; i++) want.add(i);
      let shown = 0;
      for (let n = 1; n <= last; n++) {
        if (!want.has(n)) continue;
        const node =
          n === current
            ? el('span', { class: 'cgx-page active' }, String(n))
            : nums.has(n)
              ? chip(String(n), nums.get(n))
              : null;
        if (!node) continue;
        if (shown && n > shown + 1) items.push(el('span', { class: 'cgx-pagedots' }, '…'));
        items.push(node);
        shown = n;
      }
    } else {
      other.forEach((p) => items.push(chip(p.label, p.href)));
    }
    if (!items.length && !prev && !next) return null;
    return el(
      'nav',
      { class: 'cgx-pages' },
      prev ? chip('‹ Prev', prev) : null,
      items,
      next ? chip('Next ›', next) : null
    );
  }

  /* users.php — user search + listing */

  function renderUsers(doc) {
    const form = [...doc.forms].find(
      (f) => !(f.getAttribute('action') || '').includes('browse') && f.querySelector('input[type="text"]')
    );
    let toolbar = null;
    if (form) {
      const legacyQ = form.querySelector('input[type="text"]');
      const q = el('input', { class: 'cgx-search', type: 'search', placeholder: 'Search users…', value: legacyQ.value || '' });
      const go = () => {
        legacyQ.value = q.value;
        form.submit();
      };
      q.addEventListener('keydown', (e) => e.key === 'Enter' && go());
      const sel = form.querySelector('select');
      toolbar = el(
        'div',
        { class: 'cgx-toolbar' },
        q,
        sel ? proxySelect(sel) : null,
        el('button', { class: 'cgx-btn primary', type: 'button', onclick: go }, 'Search')
      );
    }

    const t = leafTables(doc).find((x) => /user ?name/i.test(txt(x.rows[0])));
    const heads = t ? [...t.rows[0].cells].map((c) => txt(c).trim()) : [];
    const rows = t ? [...t.rows].slice(1) : [];

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Users'),
          toolbar,
          el(
            'div',
            { class: 'cgx-tbl-wrap' },
            el(
              'table',
              { class: 'cgx-tbl' },
              el('thead', {}, el('tr', {}, heads.map((h) => el('th', {}, h)))),
              el(
                'tbody',
                {},
                rows.map((r) =>
                  el(
                    'tr',
                    {},
                    [...r.cells].map((c, i) => {
                      const a = c.querySelector('a');
                      const img = c.querySelector('img');
                      if (a && (a.getAttribute('href') || '').includes('userdetails'))
                        return el('td', {}, userLink(a, i === 0 ? 'cgx-tbl-title' : 'cgx-plain'));
                      if (a) return el('td', {}, el('a', { class: i === 0 ? 'cgx-tbl-title' : null, href: a.href }, txt(a)));
                      if (img && !txt(c)) {
                        const m = img.cloneNode();
                        return el('td', { title: img.title || img.alt || '' }, m);
                      }
                      return el('td', {}, txt(c));
                    })
                  )
                )
              )
            )
          ),
          pagerNav(doc)
        )
      )
    );
  }

  /* staff.php — the command chain, top brass first. Names keep their legacy
     class colors: the anchor's inner markup (font/span coloring) is cloned
     verbatim rather than flattened to text. */

  function renderStaff(doc) {
    const t = leafTables(doc).find((x) => x.querySelector('a[href*="userdetails"]'));
    const groups = [];
    if (t)
      for (const r of t.rows) {
        const label = [...r.cells].map((c) => txt(c).trim()).find((s) => /:$/.test(s));
        if (label) groups.push({ label: label.replace(/:$/, ''), members: [] });
        const as = [...r.querySelectorAll('a[href*="userdetails"]')];
        if (as.length) {
          if (!groups.length) groups.push({ label: 'Staff', members: [] });
          groups[groups.length - 1].members.push(
            ...as.map((a) => {
              const name = el('a', { class: 'cgx-staff-name', href: a.href });
              [...a.childNodes].forEach((n) => name.append(n.cloneNode(true)));
              return name;
            })
          );
        }
      }

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel cgx-staff' },
          el('div', { class: 'cgx-staff-head' }, radMark(), el('h2', {}, 'The chain of command')),
          groups
            .filter((g) => g.members.length)
            .map((g, i) =>
              el(
                'div',
                { class: 'cgx-staff-tier' + (i === 0 ? ' top' : '') },
                el('div', { class: 'tier-label' }, g.label),
                el('div', { class: 'tier-members' }, g.members)
              )
            )
        )
      )
    );
  }

  /* log.php — the site log */

  function renderSiteLog(doc) {
    const form = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('log'));
    let toolbar = null;
    if (form) {
      const legacyQ = form.querySelector('input[type="text"]');
      const q = el('input', { class: 'cgx-search', type: 'search', placeholder: 'Search the site log…', value: legacyQ?.value || '' });
      const go = () => {
        if (legacyQ) legacyQ.value = q.value;
        form.submit();
      };
      q.addEventListener('keydown', (e) => e.key === 'Enter' && go());
      const chips = [...form.querySelectorAll('input[type="checkbox"]')].map((box) => {
        const chip = el(
          'button',
          {
            class: 'cgx-chip' + (box.checked ? ' on' : ''),
            type: 'button',
            onclick: () => {
              box.checked = !box.checked;
              chip.classList.toggle('on', box.checked);
            },
          },
          txt(box.nextElementSibling) || txt(box.parentElement).slice(0, 30) || box.name
        );
        return chip;
      });
      toolbar = el('div', { class: 'cgx-toolbar' }, q, chips, el('button', { class: 'cgx-btn primary', type: 'button', onclick: go }, 'Search'));
    }

    const t = leafTables(doc).find((x) => /date/i.test(txt(x.rows[0])) && /event/i.test(txt(x.rows[0])));
    const cloneCell = (c) => {
      const td = el('td', {});
      [...c.childNodes].forEach((n) => td.append(n.cloneNode(true)));
      return td;
    };
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Site log'),
          toolbar,
          t
            ? el(
                'div',
                { class: 'cgx-tbl-wrap' },
                el(
                  'table',
                  { class: 'cgx-tbl' },
                  el('thead', {}, el('tr', {}, [...t.rows[0].cells].map((c) => el('th', {}, txt(c))))),
                  el('tbody', {}, [...t.rows].slice(1).map((r) => el('tr', {}, [...r.cells].map(cloneCell))))
                )
              )
            : el('p', {}, 'No log entries found.'),
          pagerNav(doc)
        )
      )
    );
  }

  /* helpdesk.php — request form */

  function renderHelpdesk(doc) {
    const form = [...doc.forms].find((f) => f.querySelector('textarea'));
    const holder = form && form.closest('table');
    const hints = holder
      ? [...holder.querySelectorAll('td')]
          .filter((c) => !c.contains(form) && !c.querySelector('table') && txt(c).trim().length > 20)
          .map((c) => txt(c).trim())
      : [];
    if (form) form.classList.add('cgx-repform');
    armFormEditors(form);
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Helpdesk'),
          hints.map((h) => el('p', { class: 'cgx-hint' }, h)),
          form || el('p', {}, 'No helpdesk form found on this page.')
        )
      )
    );
  }

  /* bookmarks.php */

  function renderBookmarks(doc) {
    const t = leafTables(doc).find((x) => /delete/i.test(txt(x.rows[0])));
    const delForm =
      [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('delbookmark')) || (t && t.closest('form'));
    const heads = t ? [...t.rows[0].cells].map((c) => txt(c).trim()) : [];
    const idx = (re) => heads.findIndex((h) => re.test(h));
    const iName = idx(/name/i);
    const iAdded = idx(/added/i);
    const iSize = idx(/size/i);
    const iUp = idx(/upped/i);
    const marks = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const c = r.cells;
            const link = iName >= 0 && c[iName] && c[iName].querySelector('a');
            if (!link) return null;
            const img = c[0].querySelector('img');
            return {
              title: txt(link),
              href: link.href,
              cat: img?.title || img?.alt || '',
              catIcon: img?.src,
              added: iAdded >= 0 && c[iAdded] ? lines(c[iAdded]).join(' ') : '',
              size: iSize >= 0 && c[iSize] ? lines(c[iSize]).join(' · ') : '',
              upped: iUp >= 0 && c[iUp] ? txt(c[iUp]) : '',
              box: r.querySelector('input[type="checkbox"][name^="delbookmark"]'),
            };
          })
          .filter(Boolean)
      : [];

    const removeBtn = (b) =>
      b.box && delForm
        ? el(
            'button',
            {
              class: 'cgx-btn ghost sm',
              type: 'button',
              onclick: () => {
                delForm.querySelectorAll('input[name^="delbookmark"]').forEach((x) => (x.checked = false));
                b.box.checked = true;
                delForm.submit();
              },
            },
            'Remove'
          )
        : null;

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, `Bookmarks (${marks.length})`),
          marks.length
            ? el(
                'div',
                { class: 'cgx-tbl-wrap' },
                el(
                  'table',
                  { class: 'cgx-tbl' },
                  el('thead', {}, el('tr', {}, ['Type', 'Name', 'Added', 'Size', 'Upped by', ''].map((h) => el('th', {}, h)))),
                  el(
                    'tbody',
                    {},
                    marks.map((b) =>
                      el(
                        'tr',
                        {},
                        el('td', {}, b.catIcon ? el('img', { class: 'cgx-tbl-icon', src: b.catIcon, alt: b.cat, title: b.cat }) : null),
                        el('td', {}, el('a', { class: 'cgx-tbl-title', href: b.href }, b.title)),
                        el('td', {}, b.added),
                        el('td', {}, b.size),
                        el('td', {}, b.upped),
                        el('td', {}, removeBtn(b))
                      )
                    )
                  )
                )
              )
            : el('p', { class: 'cgx-hint' }, 'No bookmarks yet — hit the ★ on any torrent.'),
          pagerNav(doc)
        )
      )
    );
  }

  /* friends.php — friends + blocked lists */

  function renderFriends(doc) {
    // One nested table per user inside the section's cell: outer row =
    // [avatar cell | info table]; info holds the colored name anchor plus any
    // status icons (star2/star3 donor, disabled.gif), "last seen on
    // <absolute>(<relative>)" text, and the Remove / Send PM links.
    const sectionRows = (labelRe) => {
      const head = [...doc.querySelectorAll('td.colhead, h1, h2, b')].find((h) => labelRe.test(txt(h).trim()));
      if (!head) return [];
      // Friends: the header's own cell holds one nested table per user.
      // Blocked: entries sit in SIBLING ROWS of the header's table ("[D] Name"
      // lines, no avatar) — widen to the table when the cell has no users.
      let holder = head.closest('td') || head.parentElement;
      if (!holder.querySelector('a[href*="userdetails"]')) holder = head.closest('table') || holder;
      return [...new Set([...holder.querySelectorAll('a[href*="userdetails"]')].map((a) => a.closest('tr')))]
        .filter(Boolean)
        .map((row) => {
          const a = row.querySelector('a[href*="userdetails"]');
          const seen = txt(row).match(/last seen on\s+([\d\- :]+?)\s*\(([^)]*)\)/i);
          const avatarImg = row.closest('table')?.closest('tr')?.cells[0]?.querySelector('img');
          const avatarSrc = avatarImg?.getAttribute('src') || '';
          return {
            a,
            avatar: avatarSrc && !/star|disabled/.test(avatarSrc) ? avatarSrc : null,
            seenAbs: seen ? seen[1].trim() : '',
            seenRel: seen ? seen[2].trim() : '',
            remove: row.querySelector('a[href*="friends.php"]')?.href,
            pm: row.querySelector('a[href*="sendmessage"]')?.href,
          };
        });
    };
    const rowEl = (f) =>
      el(
        'div',
        { class: 'cgx-friend-row' },
        el(
          'div',
          { class: 'cgx-friend-ava' },
          f.avatar ? el('img', { src: f.avatar, alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }) : null
        ),
        el(
          'div',
          { class: 'cgx-friend-info' },
          el('div', { class: 'cgx-friend-name' }, userLink(f.a, 'cgx-friend-link')),
          f.seenRel
            ? el('div', { class: 'meta', title: 'Last seen ' + (f.seenAbs || f.seenRel) }, f.seenRel)
            : null
        ),
        el('span', { class: 'spacer' }),
        f.pm ? el('a', { class: 'cgx-btn ghost sm', href: f.pm }, 'PM') : null,
        f.remove ? el('a', { class: 'cgx-btn ghost sm', href: f.remove }, 'Remove') : null
      );
    const friends = sectionRows(/^friends list/i);
    const blocked = sectionRows(/^blocked users/i);
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, `Friends (${friends.length})`),
          friends.length
            ? el('div', { class: 'cgx-friend-grid' }, friends.map(rowEl))
            : el('p', { class: 'cgx-hint' }, 'No friends added yet.')
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, `Blocked users (${blocked.length})`),
          blocked.length
            ? el('div', { class: 'cgx-friend-grid' }, blocked.map(rowEl))
            : el('p', { class: 'cgx-hint' }, 'Nobody blocked. How harmonious.')
        )
      )
    );
  }

  /* myreseeds.php — seeds wanted */

  function renderReseeds(doc) {
    const head = [...doc.querySelectorAll('td.colhead, h1, h2')].find((h) => /seeds wanted/i.test(txt(h)));
    const table = head && head.closest('table');
    const bodyCell =
      table && [...table.querySelectorAll('td')].find((c) => c !== head && !c.querySelector('td') && txt(c).trim().length > 10);
    const text = bodyCell ? txt(bodyCell).trim() : '';
    const empty = /nothing found/i.test(text);
    const explain = text.replace(/nothing found!?/i, '').trim();
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Seeds wanted'),
          explain ? el('p', { class: 'cgx-hint' }, explain) : null,
          empty
            ? el('div', { class: 'cgx-empty' }, radMark('big'), el('h2', {}, 'Nothing needs you right now'), el('p', {}, 'No snatched or uploaded torrents are waiting on a reseed.'))
            : bodyCell
              ? legacyEmbed(bodyCell)
              : null
        )
      )
    );
  }

  /* polls.php — previous polls archive */

  function renderPolls(doc) {
    const tables = leafTables(doc).filter((t) => /\d+%/.test(txt(t)) && [...t.rows].some((r) => r.cells.length >= 2));
    const polls = tables
      .map((t) => {
        let q = '';
        let n = t;
        while (n && n !== doc.body && !q) {
          let p = n.previousElementSibling;
          while (p && !q) {
            const s = txt(p).trim();
            if (s && !p.querySelector('table')) q = s;
            p = p.previousElementSibling;
          }
          n = q ? n : n.parentElement;
        }
        const options = [...t.rows]
          .map((r) => {
            const cells = [...r.cells];
            const pct = (txt(cells[cells.length - 1]).match(/(\d+(?:\.\d+)?)%/) || [])[1];
            return pct != null ? { label: txt(cells[0]).trim(), pct: parseFloat(pct) } : null;
          })
          .filter(Boolean);
        return { q: q.slice(0, 250), options };
      })
      .filter((p) => p.options.length);

    renderShell(
      doc,
      el(
        'div',
        {},
        el('h2', { class: 'cgx-page-title' }, `Previous polls (${polls.length})`),
        polls.map((p) =>
          el(
            'section',
            { class: 'cgx-panel cgx-poll' },
            el('p', { class: 'cgx-poll-q' }, p.q),
            p.options.map((o) =>
              el(
                'div',
                { class: 'cgx-poll-opt' },
                el('div', { class: 'cgx-poll-labels' }, el('span', {}, o.label), el('span', { class: 'pct' }, o.pct + '%')),
                el('div', { class: 'cgx-poll-track' }, el('div', { class: 'cgx-poll-bar', style: `width: ${o.pct}%` }))
              )
            )
          )
        )
      )
    );
  }

  /* help/index.php — help contents directory */

  function renderHelp(doc) {
    // Rows alternate with empty spacer rows — keep only the 2-cell ones.
    const t = leafTables(doc).find(
      (x) => [...x.rows].filter((r) => r.cells.length === 2 && r.querySelector('a')).length >= 3
    );
    const items = t
      ? [...t.rows]
          .filter((r) => r.cells.length === 2)
          .map((r) => {
            const a = r.cells[0].querySelector('a');
            return a ? { title: txt(a), href: a.href, desc: txt(r.cells[1]).trim() } : null;
          })
          .filter(Boolean)
      : [];
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Help contents'),
          items.length
            ? el(
                'div',
                { class: 'cgx-cat-grid' },
                items.map((i) =>
                  el('a', { class: 'cgx-cat-card', href: i.href }, el('div', { class: 'name' }, i.title), el('div', { class: 'desc' }, i.desc))
                )
              )
            : el('p', {}, 'No help topics found.')
        )
      )
    );
  }

  /* /help/*.php + testconnect.php — static help articles (and the port
     checker's form). Article tables are 1-col: a short title row, then body
     rows. The site's cheeky page titles make good headers, so keep them. */

  function renderHelpArticle(doc) {
    // Articles are anchored by td.colhead section titles; the body (including
    // nested tables) lives in the same — innermost — table. closest() gives
    // that inner table, never the page layout table.
    const SKIP = /^(Community|Torrents|Support|Personal|Search)$/i;
    const heads = [...doc.querySelectorAll('td.colhead, h1')].filter((h) => txt(h).trim() && !SKIP.test(txt(h).trim()));
    const seenT = new Set();
    const panels = [];
    for (const h of heads) {
      const table = h.closest('table');
      if (!table || seenT.has(table)) continue;
      seenT.add(table);
      const clone = table.cloneNode(true);
      clone.querySelectorAll('td.colhead, h1').forEach((x) => x.closest('tr')?.remove());
      // Any live form is reparented separately below — drop its inert copy.
      clone.querySelectorAll('form, input, select, textarea, button').forEach((n) => n.remove());
      panels.push(el('section', { class: 'cgx-panel cgx-article' }, el('h3', {}, txt(h).trim()), legacyEmbed(clone)));
    }

    // The port checker (and any future helper) ships a real form — reparent it.
    const form = [...doc.forms].find((f) => !(f.getAttribute('action') || '').includes('browse'));
    if (form) {
      form.classList.add('cgx-repform');
      panels.push(el('section', { class: 'cgx-panel' }, form));
    }

    const isHelp = location.pathname.startsWith('/help/') || location.pathname === '/testconnect.php';
    const pageTitle =
      (doc.title.split('//')[1] || '').trim() || txt(panels[0]?.querySelector('h3')) || 'Help';
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-article-top' },
          isHelp ? el('a', { class: 'cgx-chip', href: '/help/index.php' }, '‹ Help contents') : null,
          el('h2', { class: 'cgx-page-title' }, pageTitle)
        ),
        panels.length ? panels : el('section', { class: 'cgx-panel' }, el('p', {}, 'Nothing readable found on this page.'))
      )
    );
  }

  /* cocks/subscriptions.php */

  function renderCocksSubs(doc) {
    const outer = doc.querySelector('td.outer') || doc.body;
    const t = leafTables(doc).find((x) => /page/i.test(txt(x.rows[0])) && /owner/i.test(txt(x.rows[0])));
    const subs = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const a = r.cells[0] && r.cells[0].querySelector('a');
            if (!a) return null;
            return {
              title: txt(a),
              href: a.href,
              owner: txt(r.cells[1]).trim(),
              updated: txt(r.cells[2]).trim(),
              viewed: txt(r.cells[3]).trim(),
            };
          })
          .filter(Boolean)
      : [];
    renderShell(
      doc,
      el(
        'div',
        {},
        cocksNavChips(outer),
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, `COCKS subscriptions (${subs.length})`),
          subs.length
            ? el(
                'div',
                { class: 'cgx-cat-grid' },
                subs.map((s) =>
                  el(
                    'a',
                    { class: 'cgx-cat-card', href: s.href },
                    el('div', { class: 'name' }, s.title, s.updated > s.viewed ? el('span', { class: 'cgx-badge new' }, 'updated') : null),
                    el('div', { class: 'meta' }, [s.owner ? `by ${s.owner}` : '', s.updated ? `updated ${s.updated.split(' ')[0]}` : ''].filter(Boolean).join(' · '))
                  )
                )
              )
            : el('p', { class: 'cgx-hint' }, 'No subscriptions yet — hit Subscribe on any COCKS page.')
        )
      )
    );
  }

  /* upload.php + my.php — the real legacy forms, reparented and restyled */

  function renderUpload(doc) {
    const form = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('takeupload'));
    if (!form) throw new Error('no upload form');
    form.classList.add('cgx-repform', 'cgx-upform');
    const ctl = form.elements;

    // A control's hint is whatever markup shares its table cell — cloned with
    // the controls stripped out, so the live control can be moved separately
    // and the legacy <font>/<b> styling survives.
    const noteFor = (name) => {
      const cell = ctl[name]?.closest('td');
      if (!cell) return null;
      const c = cell.cloneNode(true);
      c.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      if (!txt(c)) return null;
      const note = el('div', { class: 'cgx-upnote' });
      [...c.childNodes].forEach((n) => note.append(n));
      while (note.firstChild && note.firstChild.nodeName === 'BR') note.firstChild.remove();
      while (note.lastChild && note.lastChild.nodeName === 'BR') note.lastChild.remove();
      return note;
    };
    // Standalone advisory rows (no controls in them) become callouts.
    const callout = (re) => {
      const row = [...form.querySelectorAll('tr')].find(
        (r) => r.cells.length === 2 && !r.querySelector('input, select, textarea') && re.test(txt(r.cells[1]))
      );
      if (!row) return null;
      const d = el('div', { class: 'cgx-upcallout' });
      [...row.cells[1].childNodes].forEach((n) => d.append(n));
      return d;
    };

    const notes = {};
    ['name', 'tagline', 'year', 'imdb', 'noenglish', 'fmt', 'source', 'hd', 'country', 'type', 'trailer', 'descr'].forEach(
      (n) => (notes[n] = noteFor(n))
    );
    const notaBene = callout(/select 'other'/i);
    const gemsNote = callout(/hidden gems/i);
    // The bdrips advisory is a bare span in the description cell, outside the
    // nested table that holds the legacy BBCode buttons + textarea (which is
    // why noteFor('descr') — keyed on the textarea's own td — can't see it).
    const descrSpan = [...form.querySelectorAll('td > span')].find((s) => /bdrips/i.test(txt(s)));
    const descrNote = descrSpan ? el('div', { class: 'cgx-upnote' }, descrSpan) : null;

    const field = (label, control, note, cls) =>
      el('div', { class: 'cgx-upfield' + (cls ? ' ' + cls : '') }, label ? el('label', {}, label) : null, control, note);

    // File picker as a drop zone: the real (hidden) input sits inside the
    // label, so clicking opens the picker and drag-drop assigns .files.
    const fileInput = ctl.file;
    const dropName = el('span', { class: 'cgx-drop-name' }, 'No file selected');
    const drop = el(
      'label',
      { class: 'cgx-dropzone' },
      radMark(),
      el('span', { class: 'cgx-drop-text' }, el('strong', {}, 'Choose a .torrent file'), ' — or drag it here'),
      dropName,
      fileInput
    );
    const showName = () => {
      dropName.textContent = fileInput.files[0]?.name || 'No file selected';
      drop.classList.toggle('has-file', !!fileInput.files[0]);
    };
    fileInput.addEventListener('change', showName);
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        showName();
      }
    });

    const submitBtn = form.querySelector('input[type="submit"]');
    // The gutted legacy markup (two stacked tables + a loose hidden input)
    // stays in the form, display:none — hidden inputs like MAX_FILE_SIZE
    // still submit.
    [...form.children].forEach((n) => n.classList.add('cgx-up-legacy'));

    form.append(
      el('section', { class: 'cgx-panel' }, el('h3', {}, 'Torrent file'), drop),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Film details'),
        el(
          'div',
          { class: 'cgx-upgrid' },
          field('Movie name', ctl.name, notes.name, 'full'),
          el(
            'div',
            { class: 'cgx-upfield full' },
            el('div', { class: 'cgx-uprow' }, field('Year', ctl.year, notes.year), field('IMDB title', ctl.imdb, notes.imdb))
          ),
          el(
            'div',
            { class: 'cgx-upfield full' },
            el('label', { class: 'cgx-upcheck' }, ctl.noenglish, el('strong', {}, 'No English'), notes.noenglish)
          ),
          field('Country', ctl.country, notes.country),
          field('Category', ctl.type, notes.type),
          gemsNote ? el('div', { class: 'cgx-upfield full' }, gemsNote) : null,
          field('Comment', ctl.tagline, notes.tagline, 'full'),
          field('Trailer', ctl.trailer, notes.trailer, 'full')
        )
      ),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Release'),
        notaBene,
        el(
          'div',
          { class: 'cgx-upgrid cols3' },
          field('Format', ctl.fmt, notes.fmt),
          field('Source', ctl.source, notes.source),
          field('High-def', ctl.hd, notes.hd)
        )
      ),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Description'),
        notes.descr || descrNote,
        bbToolbar(ctl.descr),
        ctl.descr,
        previewPanel(ctl.descr)
      ),
      el('section', { class: 'cgx-panel' }, el('h3', {}, 'Mediainfo'), ctl.mediainfo),
      el('div', { class: 'cgx-upfoot' }, submitBtn)
    );

    renderShell(
      doc,
      el(
        'div',
        {},
        el('div', { class: 'cgx-panel-head cgx-forums-top' }, el('h2', { class: 'cgx-page-title' }, 'Upload a torrent')),
        form
      )
    );
  }

  function renderEditProfile(doc) {
    const form = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('takeprofedit'));
    if (!form) throw new Error('no profile form');
    form.classList.add('cgx-repform', 'cgx-upform');
    const ctl = form.elements;

    // Single control + its label; whatever else shares the cell (hint text,
    // links) tags along as a note. Missing controls yield null so the layout
    // degrades gracefully if the server page changes.
    const fieldFor = (name, label, cls) => {
      const c = form.querySelector(`[name="${name}"]`);
      if (!c) return null;
      const cell = c.closest('td');
      const f = el('div', { class: 'cgx-upfield' + (cls ? ' ' + cls : '') }, el('label', {}, label), c);
      if (cell) {
        const rest = el('div', { class: 'cgx-upnote' });
        [...cell.childNodes].forEach((n) => rest.append(n));
        if (txt(rest)) f.append(rest);
      }
      return f;
    };
    // Whole-cell move for radio groups and multi-checkbox rows, where the
    // option labels are loose text nodes between the inputs.
    const cellField = (name, label) => {
      const first = form.querySelector(`[name="${name}"]`);
      if (!first) return null;
      const box = el('div', { class: 'cgx-myradios' });
      [...first.closest('td').childNodes].forEach((n) => box.append(n));
      return el('div', { class: 'cgx-upfield' }, el('label', {}, label), box);
    };
    const check = (name, label) => {
      const c = form.querySelector(`input[name="${name}"]`);
      if (!c) return null;
      const cell = c.closest('td');
      const wrap = el('label', { class: 'cgx-upcheck' }, c, el('strong', {}, label));
      if (cell) {
        const rest = el('span', { class: 'cgx-upnote' });
        [...cell.childNodes].forEach((n) => rest.append(n));
        if (txt(rest)) wrap.append(rest);
      }
      return wrap;
    };
    const rowByLabel = (re) => [...form.querySelectorAll('tr')].find((r) => r.cells?.length >= 2 && re.test(txt(r.cells[0])));

    // Default-categories checkboxes live in a nested table, one label cell
    // beside each box — rebuilt as a flat chip grid.
    const catsRow = rowByLabel(/default categories/i);
    const catsField = catsRow
      ? el(
          'div',
          { class: 'cgx-upfield full' },
          el('label', {}, 'Default categories'),
          el(
            'div',
            { class: 'cgx-checkgrid cats' },
            [...catsRow.querySelectorAll('input[type="checkbox"]')].map((cb) => {
              // Each nested cell holds its own "[x] Label" pair, so the cell's
              // text (checkboxes contribute none) IS the category name.
              const name = txt(cb.closest('td'));
              return el('label', { class: 'cgx-upcheck' }, cb, name);
            })
          )
        )
      : null;

    const parkRow = rowByLabel(/park account/i);
    let parkNote = null;
    if (parkRow) {
      parkNote = el('div', { class: 'cgx-upnote' });
      [...parkRow.cells[1].childNodes].forEach((n) => parkNote.append(n));
    }
    const favRow = rowByLabel(/favourite torrent/i);
    let favField = null;
    if (favRow && txt(favRow.cells[1])) {
      const c = el('div', { class: 'cgx-upnote' });
      [...favRow.cells[1].childNodes].forEach((n) => c.append(n));
      favField = el('div', { class: 'cgx-upfield full' }, el('label', {}, 'Favourite torrent'), c);
    }

    const submitBtn = form.querySelector('input[type="submit"]');
    [...form.children].forEach((n) => n.classList.add('cgx-up-legacy'));

    form.append(
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Account'),
        el(
          'div',
          { class: 'cgx-upgrid' },
          fieldFor('email', 'Email address', 'full'),
          fieldFor('chpassword', 'New password'),
          fieldFor('passagain', 'Repeat new password'),
          ctl.resetpasskey ? el('div', { class: 'cgx-upfield full' }, check('resetpasskey', 'Reset passkey')) : null,
          parkNote ? el('div', { class: 'cgx-upfield full' }, parkNote) : null
        )
      ),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Profile'),
        el(
          'div',
          { class: 'cgx-upgrid' },
          fieldFor('avatar', 'Avatar URL', 'full'),
          fieldFor('title', 'Custom title'),
          fieldFor('country', 'Country'),
          ctl.info
            ? el('div', { class: 'cgx-upfield full' }, el('label', {}, 'Profile info'), bbToolbar(ctl.info), ctl.info, previewPanel(ctl.info))
            : null
        )
      ),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Browsing'),
        el(
          'div',
          { class: 'cgx-upgrid' },
          catsField,
          fieldFor('torrentsperpage', 'Torrents per page'),
          fieldFor('stylesheet', 'Stylesheet'),
          favField,
          el(
            'div',
            { class: 'cgx-upfield full cgx-checkgrid' },
            check('shownoenglish', 'Show non-English torrents'),
            check('showbumped', 'Show bumped torrents'),
            check('showembedvideos', 'Show embedded videos'),
            check('miontop', 'Mediainfo first'),
            check('notifyreplace', 'Torrent replacement notify')
          )
        )
      ),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Forums'),
        el(
          'div',
          { class: 'cgx-upgrid' },
          ctl.signature
            ? el('div', { class: 'cgx-upfield full' }, el('label', {}, 'Forum signature'), bbToolbar(ctl.signature), ctl.signature, previewPanel(ctl.signature))
            : null,
          fieldFor('topicsperpage', 'Topics per page'),
          fieldFor('postsperpage', 'Posts per page'),
          el(
            'div',
            { class: 'cgx-upfield full cgx-checkgrid' },
            check('avatars', 'View avatars'),
            check('signatures', 'View signatures')
          )
        )
      ),
      el(
        'section',
        { class: 'cgx-panel' },
        el('h3', {}, 'Messages & privacy'),
        el(
          'div',
          { class: 'cgx-upgrid' },
          cellField('acceptpms', 'Accept PMs from'),
          cellField('downloadsvisible', 'Snatchlist visible'),
          cellField('pmnotif', 'Email notification'),
          el(
            'div',
            { class: 'cgx-upfield full cgx-checkgrid' },
            check('deletepms', 'Delete PMs'),
            check('savepms', 'Save PMs'),
            check('reqcommentpm', 'Request comment PM'),
            check('uploadcommentpm', 'Upload comment PM'),
            check('imagepm', 'Images in PMs')
          )
        )
      ),
      el('div', { class: 'cgx-upfoot' }, submitBtn)
    );

    renderShell(
      doc,
      el(
        'div',
        {},
        el('div', { class: 'cgx-panel-head cgx-forums-top' }, el('h2', { class: 'cgx-page-title' }, 'Edit profile')),
        form
      )
    );
  }

  /* ------------------------- snatches / comments / cigars / tags -------------- */

  // viewsnatches.php?id=<torrent> — who snatched a torrent.
  function renderSnatches(doc) {
    const t = leafTables(doc).find((x) => /Username/.test(txt(x.rows[0])) && /Share Ratio/i.test(txt(x.rows[0])));
    if (!t) throw new Error('no snatch table');
    const title =
      [...doc.querySelectorAll('h1, td.colhead')].map((h) => txt(h)).find((s) => /snatch details for/i.test(s)) ||
      'Snatch details';
    const heads = [...t.rows[0].cells].map((c) => txt(c).trim());
    const cloneCell = (c) => {
      const td = el('td', {});
      [...c.childNodes].forEach((n) => td.append(n.cloneNode(true)));
      return td;
    };
    renderShell(
      doc,
      el(
        'div',
        {},
        el('h2', { class: 'cgx-page-title' }, title.replace(/\s+/g, ' ')),
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-tbl-wrap' },
            el(
              'table',
              { class: 'cgx-tbl' },
              el('thead', {}, el('tr', {}, heads.map((h) => el('th', {}, h)))),
              el(
                'tbody',
                {},
                [...t.rows].slice(1).map((r) =>
                  el(
                    'tr',
                    {},
                    [...r.cells].map((c, i) => {
                      if (i === 0) {
                        const a = c.querySelector('a');
                        return el('td', {}, a ? userLink(a, 'cgx-tbl-title') : txt(c));
                      }
                      const pmForm = c.querySelector('form[action*="sendmessage"]');
                      if (pmForm)
                        return el('td', {}, el('button', { class: 'cgx-btn ghost sm', type: 'button', onclick: () => pmForm.submit() }, 'PM'));
                      return cloneCell(c);
                    })
                  )
                )
              )
            )
          ),
          pagerNav(doc)
        )
      )
    );
  }

  // comment.php — full comment composer + recent comments preview.
  function renderCommentComposer(doc) {
    const form = [...doc.forms].find((f) => f.querySelector('textarea'));
    if (!form) throw new Error('no comment form');
    form.classList.add('cgx-repform', 'cgx-reply');
    armFormEditors(form);
    const headTxt =
      [...doc.querySelectorAll('h1, td.colhead')].map((h) => txt(h)).find((s) => /add a comment/i.test(s)) || 'Add a comment';
    const tid = form.elements.tid?.value;

    const previews = [...new Set([...doc.querySelectorAll('td.comment')].map((c) => c.closest('table')))]
      .filter(Boolean)
      .map((table) => {
        let sub = table.previousElementSibling;
        for (let i = 0; sub && i < 3 && !sub.matches('p.sub, .sub'); i++) sub = sub.previousElementSibling;
        const userA = sub && sub.querySelector('a[href*="userdetails"]');
        return {
          userA,
          date: (txt(sub).match(/at\s+(.+?GMT)/) || [])[1] || '',
          bodyCell: table.querySelector('td.text') || table.querySelector('td.comment'),
        };
      });

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, headTxt.replace(/\s+/g, ' ')),
          tid ? el('a', { class: 'cgx-btn ghost', href: `/details.php?id=${tid}` }, '‹ Back to torrent') : null
        ),
        el('section', { class: 'cgx-panel' }, form),
        previews.length ? el('h3', { class: 'cgx-page-title cgx-lastposts' }, 'Recent comments') : null,
        previews.map((p) =>
          el(
            'article',
            { class: 'cgx-post' },
            el(
              'div',
              { class: 'cgx-post-main' },
              el(
                'div',
                { class: 'cgx-post-head' },
                p.userA ? userLink(p.userA, 'cgx-post-user') : el('span', {}, 'unknown'),
                el('span', { class: 'spacer' }),
                p.date ? el('span', { class: 'cgx-post-date' }, p.date) : null
              ),
              el('div', { class: 'cgx-post-body' }, legacyEmbed(p.bodyCell))
            )
          )
        )
      )
    );
  }

  // cigars.php — send a cigar (credits gift).
  function renderCigars(doc) {
    const form = [...doc.forms].find((f) => f.elements.receiver && f.elements.reason);
    if (!form) throw new Error('no cigar form');
    const head = [...doc.querySelectorAll('td.colhead')].find((h) => /cigar/i.test(txt(h)));
    const holder = head && head.closest('table');
    const explain =
      holder &&
      [...holder.querySelectorAll('td')].find((c) => c !== head && !c.contains(form) && !c.querySelector('table') && txt(c).length > 40);
    form.classList.add('cgx-repform');
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, '🚬 Send a cigar'),
          explain ? el('p', { class: 'cgx-hint' }, txt(explain)) : null,
          form
        )
      )
    );
  }

  // tags.php — BB code reference. One 4x2 table per tag:
  // Description / Syntax / Example / Result.
  // Last resort for the reference pages: lift the biggest block of content out
  // of the legacy table nest and show it in a styled panel. Not as good as a
  // parsed layout, but far better than dropping back to the 2004 markup.
  function legacyPage(doc, title) {
    const holder =
      [...doc.querySelectorAll('td.outer, td.embedded, td')]
        .filter((c) => txt(c).length > 120 && !/community|torrents|personal|support/i.test(txt(c).slice(0, 200)))
        .pop() || doc.body;
    const clone = holder.cloneNode(true);
    clone.querySelectorAll('form, input, select, script').forEach((n) => n.remove());
    renderShell(
      doc,
      el(
        'div',
        {},
        el('h2', { class: 'cgx-page-title' }, title),
        el('section', { class: 'cgx-panel cgx-article' }, legacyEmbed(clone))
      )
    );
  }

  // smilies.php — the emoticon reference, as a grid of code + image chips.
  // Clicking one copies the code, which is the only thing anyone comes here for.
  function renderSmilies(doc) {
    const smilies = parseSmilies(doc);
    if (!smilies.length) return legacyPage(doc, 'Smilies');
    const copy = (btn, code) => {
      navigator.clipboard?.writeText(code).then(
        () => {
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 900);
        },
        () => {}
      );
    };
    renderShell(
      doc,
      el(
        'div',
        {},
        el('h2', { class: 'cgx-page-title' }, `Smilies (${smilies.length})`),
        el('p', { class: 'cgx-hint' }, 'Type the code into any post box — or click one here to copy it.'),
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-smilie-grid' },
            smilies.map((sm) => {
              const btn = el(
                'button',
                { class: 'cgx-smilie-card', type: 'button', title: 'Copy ' + sm.code, onclick: () => copy(btn, sm.code) },
                el('img', { src: sm.src, alt: sm.alt }),
                el('code', {}, sm.code)
              );
              return btn;
            })
          )
        )
      )
    );
  }

  function renderTags(doc) {
    const tables = leafTables(doc).filter((t) => /Description:/i.test(txt(t)));
    if (!tables.length) return legacyPage(doc, 'BB codes');
    const cards = tables.map((t) => {
      const get = (label) => {
        const r = [...t.rows].find((x) => x.cells[1] && new RegExp('^' + label, 'i').test(txt(x.cells[0])));
        return r ? r.cells[1] : null;
      };
      const syntax = txt(get('Syntax'));
      return {
        name: (syntax.match(/\[(\w+)[\]=\s]/) || [])[1] || '',
        desc: txt(get('Description')),
        syntax,
        example: txt(get('Example')),
        resultCell: get('Result'),
      };
    });
    renderShell(
      doc,
      el(
        'div',
        {},
        el('h2', { class: 'cgx-page-title' }, `BB codes (${cards.length})`),
        el(
          'div',
          { class: 'cgx-tag-grid' },
          cards.map((c) =>
            el(
              'section',
              { class: 'cgx-panel cgx-tag-card' },
              el('h3', {}, c.name ? `[${c.name}]` : c.syntax.slice(0, 20)),
              el('p', { class: 'cgx-hint' }, c.desc),
              el('code', { class: 'cgx-tag-syntax' }, c.example || c.syntax),
              c.resultCell ? el('div', { class: 'cgx-tag-result' }, legacyEmbed(c.resultCell)) : null
            )
          )
        )
      )
    );
  }

  /* ------------------------------- private messages --------------------------- */

  function renderMessages(doc) {
    const action = new URLSearchParams(location.search).get('action');
    if (action === 'viewmessage') return messageView(doc);
    return messagesList(doc);
  }

  function messagesList(doc) {
    const t = leafTables(doc).find((x) => /Status/.test(txt(x.rows[0])) && /Subject/.test(txt(x.rows[0])));
    const folderForm = [...doc.forms].find(
      (f) => (f.getAttribute('action') || '').includes('messages') && f.querySelector('select') && !f.querySelector('input[type="checkbox"]')
    );
    const bulkForm = [...doc.forms].find((f) => f.querySelector('input[type="checkbox"]'));
    const folderSel = folderForm && folderForm.querySelector('select');
    const folderName = folderSel ? txt(folderSel.selectedOptions[0]) : 'Inbox';

    const msgs = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const c = r.cells;
            const a = c[1] && c[1].querySelector('a');
            if (!a) return null;
            const senderLinks = c[2] ? [...c[2].querySelectorAll('a')] : [];
            return {
              unread: !!c[0].querySelector('img[src*="unread"]'),
              subject: txt(a),
              href: a.href,
              senderA: senderLinks.find((x) => !/add to friends/i.test(txt(x))) || null,
              senderText: txt(c[2]).replace(/\[add to friends\]/i, '').trim(),
              date: txt(c[3]),
              box: r.querySelector('input[type="checkbox"]'),
            };
          })
          .filter(Boolean)
      : [];

    let folderProxy = null;
    if (folderSel) {
      folderProxy = proxySelect(folderSel);
      folderProxy.addEventListener('change', () => folderForm.submit());
    }
    const rowBoxes = [];
    const anyChecked = () => rowBoxes.some((b) => b.ours.checked);
    const submits = bulkForm ? [...bulkForm.querySelectorAll('input[type="submit"]')] : [];
    const delSubmit = submits.find((s) => /delete/i.test(s.value));
    const moveSubmit = submits.find((s) => /move/i.test(s.value));
    const moveSel = bulkForm && bulkForm.querySelector('select');
    const deleteBtn = delSubmit
      ? el('button', { class: 'cgx-btn ghost', type: 'button', onclick: () => anyChecked() && delSubmit.click() }, 'Delete selected')
      : null;
    const moveCtl =
      moveSubmit && moveSel && moveSel.options.length > 1
        ? [proxySelect(moveSel), el('button', { class: 'cgx-btn ghost', type: 'button', onclick: () => anyChecked() && moveSubmit.click() }, 'Move to')]
        : null;
    const selectAll = el('button', {
      class: 'cgx-btn ghost',
      type: 'button',
      onclick: () => {
        const on = !rowBoxes.every((b) => b.ours.checked);
        rowBoxes.forEach((b) => {
          b.ours.checked = on;
          b.ours.dispatchEvent(new Event('change'));
        });
      },
    }, 'Select all');

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, 'Messages', el('span', { class: 'cgx-board-note' }, `${msgs.length} in ${folderName}`)),
          el('div', { class: 'cgx-forums-actions' }, folderProxy, selectAll, moveCtl, deleteBtn)
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          msgs.length
            ? msgs.map((m) => {
                const ours = m.box
                  ? el('input', {
                      type: 'checkbox',
                      class: 'cgx-msg-check',
                      onchange: (e) => (m.box.checked = e.target.checked),
                    })
                  : null;
                if (ours) rowBoxes.push({ ours });
                return el(
                  'div',
                  { class: 'cgx-msg-row' + (m.unread ? ' unread' : '') },
                  el('img', { class: 'cgx-msg-status', src: m.unread ? '/pic/pm-unread.gif' : '/pic/pm-read.gif', alt: '' }),
                  el(
                    'div',
                    { class: 'cgx-msg-main' },
                    el('a', { class: 'cgx-msg-subject', href: m.href }, m.subject),
                    el('div', { class: 'sub' }, 'from ', m.senderA ? userLink(m.senderA) : m.senderText || 'System')
                  ),
                  el('span', { class: 'cgx-msg-date' }, m.date),
                  ours
                );
              })
            : el('div', { class: 'cgx-empty' }, radMark('big'), el('h2', {}, 'No messages'), el('p', {}, 'Nothing in this folder.')),
          pagerNav(doc)
        )
      )
    );
  }

  function messageView(doc) {
    // One table: [From|Date colheads] / [sender|date] / [body] / [Move|actions].
    // Sentbox messages say "To" where inbox ones say "From".
    const head = [...doc.querySelectorAll('td.colhead')].find((h) => /^(from|to)$/i.test(txt(h).trim()));
    const dir = head && /^to$/i.test(txt(head).trim()) ? 'to' : 'from';
    const table = head && head.closest('table');
    if (!table) throw new Error('no message table');
    const rows = [...table.rows];
    const fromCell = rows[1] && rows[1].cells[0];
    const dateTxt = rows[1] && rows[1].cells[1] ? txt(rows[1].cells[1]) : '';
    const fromA = fromCell && fromCell.querySelector('a[href*="userdetails"]');
    const bodyCell = rows.slice(2).map((r) => (r.cells.length === 1 ? r.cells[0] : null)).find(Boolean);
    const subject = (doc.title.match(/pm \((.*)\)/i) || [])[1] || 'Message';

    const actions = [...table.querySelectorAll('a')]
      .filter((a) => /delete|forward|reply/i.test(txt(a)))
      .map((a) => el('a', { class: 'cgx-btn ghost', href: a.href }, txt(a).replace(/[[\]]/g, '').trim()));
    if (fromA && !actions.some((a) => /reply/i.test(a.textContent))) {
      try {
        const uid = new URL(fromA.href).searchParams.get('id');
        if (uid) actions.unshift(el('a', { class: 'cgx-btn primary', href: `/sendmessage.php?receiver=${uid}` }, 'Reply'));
      } catch {}
    }

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, el('a', { href: '/messages.php' }, 'Messages'), ' › ', subject),
          el('div', { class: 'cgx-forums-actions' }, actions)
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-msg-meta' },
            fromA ? el('span', {}, dir + ' ', userLink(fromA)) : fromCell ? el('span', {}, dir + ' ' + txt(fromCell)) : null,
            dateTxt ? el('span', { class: 'cgx-msg-date' }, dateTxt) : null
          ),
          bodyCell ? el('div', { class: 'cgx-post-body' }, legacyEmbed(bodyCell)) : el('p', {}, 'Empty message.')
        )
      )
    );
  }

  function renderSendMessage(doc) {
    const form = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('takemessage'));
    if (!form) throw new Error('no PM form');
    form.classList.add('cgx-repform', 'cgx-reply');
    armFormEditors(form);
    const rid = form.elements.receiver?.value;
    const toA = rid
      ? [...doc.querySelectorAll('a[href*="userdetails"]')].find((a) => new RegExp(`id=${rid}$`).test(a.getAttribute('href') || ''))
      : null;
    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, el('a', { href: '/messages.php' }, 'Messages'), ' › Compose', toA ? [' to ', userLink(toA)] : null)
        ),
        el('section', { class: 'cgx-panel' }, form)
      )
    );
  }

  /* ---------------------------------- forums ---------------------------------- */
  // One legacy route, three views (index / viewforum / viewtopic), dispatched
  // on the action param. Anything else (newtopic composer, search, mod tools)
  // throws → main() falls back to the legacy UI, which still works.

  // Colored usernames matter: clone the anchor's inner markup, never txt() it.
  // Donor stars and disabled markers ride as sibling <img>s straight after the
  // anchor in legacy markup — carry them along (only whitespace may sit
  // between; any other content ends the badge run).
  function userLink(a, cls) {
    if (!a) return null;
    // Default is a plain inline link — NOT 'cgx-user', which is the topbar
    // chip (display:flex) and turns the anchor block-level, dropping any
    // badge image onto its own line.
    const n = el('a', { class: cls || 'cgx-ulink', href: a.href });
    [...a.childNodes].forEach((x) => n.append(x.cloneNode(true)));
    const badges = [];
    for (let sib = a.nextSibling, hops = 0; sib && hops < 4; sib = sib.nextSibling, hops++) {
      if (sib.nodeType === 3 && !sib.textContent.trim()) continue;
      if (sib.nodeType === 1 && sib.tagName === 'IMG' && /star|disabled/.test(sib.getAttribute('src') || '')) {
        badges.push(sib.cloneNode(true));
        continue;
      }
      break;
    }
    return badges.length ? el('span', { class: 'cgx-uname' }, n, badges) : n;
  }

  function renderForums(doc) {
    const action = new URLSearchParams(location.search).get('action');
    if (!action) return forumsIndex(doc);
    if (action === 'viewforum') return forumsForum(doc);
    if (action === 'viewtopic') return forumsTopic(doc);
    if (action === 'viewunread') return forumsUnread(doc);
    if (['reply', 'newtopic', 'edit', 'quotepost', 'editpost'].includes(action)) return forumsCompose(doc);
    throw new Error('unhandled forums action: ' + action);
  }

  function forumsIndex(doc) {
    const t = [...doc.querySelectorAll('table')].find(
      (x) => x.rows.length > 2 && /Forum\s*Topics\s*Posts/i.test(txt(x.rows[0]))
    );
    const forums = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const c = r.cells;
            const a = c[0] && c[0].querySelector('a');
            if (!a || c.length < 4) return null;
            const lastUser = c[3].querySelector('a[href*="userdetails"]');
            const lastLinks = [...c[3].querySelectorAll('a')].filter((x) => x !== lastUser && !x.querySelector('img'));
            const lastTopic = lastLinks.find((x) => txt(x)) || null;
            const status = (r.querySelector('div[class*="locked"]')?.className.match(/(?:un)?lockednew|(?:un)?locked/) || ['unlocked'])[0];
            return {
              status,
              unread: /new/.test(status),
              name: txt(a),
              href: a.href,
              desc: txt(c[0]).replace(txt(a), '').trim(),
              topics: txt(c[1]),
              posts: txt(c[2]),
              lastDate: (txt(c[3]).match(/^[\d-]+\s[\d:]+/) || [])[0] || '',
              lastUser,
              lastTopic,
              jump: lastTopic ? lastTopic.href : null,
            };
          })
          .filter(Boolean)
      : [];

    const statsT = leafTables(doc).find((x) => /forum stats/i.test(txt(x.rows[0])));
    const statLines = statsT
      ? txt(statsT.rows[1])
          .split('»')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const catchup = [...doc.querySelectorAll('a')].find((a) => /catchup/i.test(a.getAttribute('href') || ''));
    const hiddenTile = hiddenUsersMenu(true);

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, 'Forums'),
          catchup ? el('a', { class: 'cgx-btn ghost', href: catchup.href, title: txt(catchup) || null }, '✓ View unread') : null
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          forums.map((f) =>
            el(
              'div',
              { class: 'cgx-forum-row' },
              el(
                'span',
                { class: 'cgx-newmark' + (f.unread ? ' on' : ''), title: f.unread ? 'New posts since your last visit' : 'No new posts' },
                el('img', { src: `/pic/${f.status}.png`, alt: '' })
              ),
              el(
                'div',
                { class: 'cgx-forum-main' },
                el('a', { class: 'cgx-forum-name', href: f.href }, f.name),
                f.desc ? el('div', { class: 'cgx-forum-desc' }, f.desc) : null
              ),
              el(
                'div',
                { class: 'cgx-forum-counts' },
                el('span', {}, el('b', {}, f.topics), ' topics'),
                el('span', {}, el('b', {}, f.posts), ' posts')
              ),
              el(
                'div',
                { class: 'cgx-forum-last' },
                f.jump ? el('a', { href: f.jump }, f.lastDate || 'latest ↩') : el('span', {}, f.lastDate),
                el(
                  'div',
                  { class: 'sub' },
                  f.lastUser ? ['by ', userLink(f.lastUser)] : null,
                  f.lastTopic ? [' in ', el('a', { href: f.lastTopic.href }, txt(f.lastTopic))] : null
                )
              )
            )
          )
        ),
        statLines.length || hiddenTile
          ? el(
              'section',
              { class: 'cgx-panel' },
              el('div', { class: 'cgx-info-tiles' },
                statLines.map((s) => {
                  const m = s.match(/^([\d,]+)\s+(.*)$/);
                  return m ? statTile(m[1], m[2]) : statTile('', s);
                }),
                hiddenTile
              )
            )
          : null
      )
    );
  }

  function forumsForum(doc) {
    const t = [...doc.querySelectorAll('table')].find(
      (x) => x.rows.length > 1 && /Topic\s*Replies\s*Views/i.test(txt(x.rows[0]))
    );
    const heading = [...doc.querySelectorAll('h1')].map((h) => txt(h)).find(Boolean) || 'Forum';
    const newTopic = [...doc.querySelectorAll('a')].find((a) => /newtopic/i.test(a.getAttribute('href') || ''));

    const topics = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const c = r.cells;
            const links = c[0] ? [...c[0].querySelectorAll('a')] : [];
            const a = links.find((x) => txt(x).length > 2);
            if (!a || c.length < 5) return null;
            const label = txt(c[0]);
            const miniPages = links.filter((x) => x !== a && /^\d+$/.test(txt(x)));
            const status = (r.querySelector('div[class*="locked"]')?.className.match(/(?:un)?lockednew|(?:un)?locked/) || ['unlocked'])[0];
            // Legacy's own "New Posts" link — lands on the first unread post.
            const newPosts = links.find((x) => /^new posts$/i.test(txt(x)));
            return {
              title: txt(a),
              href: a.href,
              status,
              unread: /new/.test(status),
              newPosts: newPosts ? newPosts.href : null,
              sticky: /^sticky/i.test(label),
              locked: /locked/i.test(label) || /^locked/.test(status),
              miniPages,
              replies: txt(c[1]),
              views: txt(c[2]),
              authorA: c[3].querySelector('a'),
              lastDate: (txt(c[4]).match(/^[\d-]+\s[\d:]+/) || [])[0] || txt(c[4]),
              lastUser: c[4].querySelector('a[href*="userdetails"]'),
              jump: [...c[4].querySelectorAll('a')].find((x) => x.querySelector('img'))?.href,
            };
          })
          .filter(Boolean)
      : [];

    const pager = t ? pagerNavExcluding(doc, t) : null;

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, el('a', { href: '/forums.php' }, 'Forums'), ' › ', heading),
          newTopic ? el('a', { class: 'cgx-btn primary', href: newTopic.href }, '+ New topic') : null
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          topics.map((tp) =>
            el(
              'div',
              { class: 'cgx-topic-row' + (tp.sticky ? ' sticky' : '') },
              tp.unread
                ? el(
                    'a',
                    {
                      class: 'cgx-newmark on',
                      href: tp.newPosts || tp.href,
                      title: 'Jump to the first unread post',
                    },
                    el('img', { src: `/pic/${tp.status}.png`, alt: '' })
                  )
                : el('span', { class: 'cgx-newmark', title: 'No new posts' }, el('img', { src: `/pic/${tp.status}.png`, alt: '' })),
              el(
                'div',
                { class: 'cgx-topic-main' },
                el(
                  'div',
                  {},
                  tp.sticky ? el('span', { class: 'cgx-flag' }, 'sticky') : null,
                  tp.locked ? el('span', { class: 'cgx-flag lock' }, 'locked') : null,
                  el('a', { class: 'cgx-topic-title', href: tp.href }, tp.title),
                  tp.newPosts ? el('a', { class: 'cgx-newposts-link', href: tp.newPosts }, 'new posts →') : null,
                  tp.miniPages.length
                    ? el(
                        'span',
                        { class: 'cgx-minipages' },
                        (tp.miniPages.length > 4
                          ? [tp.miniPages[0], null, ...tp.miniPages.slice(-2)]
                          : tp.miniPages
                        ).map((p) =>
                          p ? el('a', { class: 'cgx-page mini', href: p.href }, txt(p)) : el('span', { class: 'cgx-minidots' }, '…')
                        )
                      )
                    : null
                ),
                el('div', { class: 'sub' }, 'by ', userLink(tp.authorA))
              ),
              el('div', { class: 'cgx-topic-counts' }, el('span', {}, el('b', {}, tp.replies), ' replies'), el('span', {}, el('b', {}, tp.views), ' views')),
              el(
                'div',
                { class: 'cgx-forum-last' },
                tp.jump ? el('a', { href: tp.jump }, tp.lastDate) : el('span', {}, tp.lastDate),
                tp.lastUser ? el('div', { class: 'sub' }, 'by ', userLink(tp.lastUser)) : null
              )
            )
          )
        ),
        pager
      )
    );
  }

  // ?action=viewunread — every topic with unread posts, across all forums.
  function forumsUnread(doc) {
    const t = [...doc.querySelectorAll('table')].find(
      (x) => x.rows.length > 1 && /^Topic\s*Forum/i.test(txt(x.rows[0]))
    );
    const topics = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const c = r.cells;
            const links = c[0] ? [...c[0].querySelectorAll('a')] : [];
            const a = links.find((x) => txt(x).length > 2 && !/^new posts$/i.test(txt(x)));
            if (!a) return null;
            const np = links.find((x) => /^new posts$/i.test(txt(x)));
            const miniPages = links.filter((x) => x !== a && /^\d+$/.test(txt(x)));
            const forumA = c[1] && c[1].querySelector('a');
            return { title: txt(a), href: a.href, newPosts: np ? np.href : null, miniPages, forumA };
          })
          .filter(Boolean)
      : [];
    const note = [...doc.querySelectorAll('p')].map((p) => txt(p)).find((s) => /items found/i.test(s));
    const catchup = [...doc.querySelectorAll('a')].find((a) => /catchup/i.test(a.getAttribute('href') || ''));

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, el('a', { href: '/forums.php' }, 'Forums'), ' › Unread topics', el('span', { class: 'cgx-board-note' }, `${topics.length}${note && /more than/i.test(note) ? '+' : ''}`)),
          catchup ? el('a', { class: 'cgx-btn ghost', href: catchup.href, title: txt(catchup) || null }, '✓ View unread') : null
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          topics.length
            ? topics.map((tp) =>
                el(
                  'div',
                  { class: 'cgx-topic-row' },
                  el(
                    'a',
                    { class: 'cgx-newmark on', href: tp.newPosts || tp.href, title: 'Jump to the first unread post' },
                    el('img', { src: '/pic/unlockednew.png', alt: '' })
                  ),
                  el(
                    'div',
                    { class: 'cgx-topic-main' },
                    el(
                      'div',
                      {},
                      el('a', { class: 'cgx-topic-title', href: tp.href }, tp.title),
                      tp.newPosts ? el('a', { class: 'cgx-newposts-link', href: tp.newPosts }, 'new posts →') : null,
                      tp.miniPages.length
                        ? el(
                            'span',
                            { class: 'cgx-minipages' },
                            (tp.miniPages.length > 4 ? [tp.miniPages[0], null, ...tp.miniPages.slice(-2)] : tp.miniPages).map((p) =>
                              p ? el('a', { class: 'cgx-page mini', href: p.href }, txt(p)) : el('span', { class: 'cgx-minidots' }, '…')
                            )
                          )
                        : null
                    )
                  ),
                  tp.forumA ? el('a', { class: 'cgx-chip', href: tp.forumA.href }, txt(tp.forumA)) : null
                )
              )
            : el('div', { class: 'cgx-empty' }, radMark('big'), el('h2', {}, 'All caught up'), el('p', {}, 'No unread posts anywhere. Go touch grass.')),
          note ? el('p', { class: 'cgx-hint' }, note) : null
        )
      )
    );
  }

  function pagerNavExcluding(doc, excludeTable) {
    return pagerFrom(pagerCandidates(doc).filter((a) => !excludeTable.contains(a)));
  }

  // Post pairing: each body (td.comment) belongs to the nearest preceding
  // header strip (table.bottom > td.embedded). Shared by topic + compose views.
  function parseForumPosts(doc) {
    const headers = [...doc.querySelectorAll('table.bottom td.embedded')].filter((h) => h.querySelector('a[href*="userdetails"]'));
    return [...doc.querySelectorAll('td.comment')].map((body) => {
      const head = headers.filter((h) => h.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
      const postTable = body.closest('table');
      const avatarCell = postTable?.querySelector('td.avatar');
      const headText = txt(head);
      const headLinks = head ? [...head.querySelectorAll('a')] : [];
      return {
        num: (headText.match(/#(\d+)/) || [])[1] || '',
        permalink: headLinks.find((a) => /^#\d+$/.test(txt(a)))?.href,
        // Quote/edit pages render their post previews without the header strip,
        // so fall back to the profile link inside the post's own table —
        // without an author there is no user id, and hidden users would show
        // up again on exactly the pages you went to in order to reply to them.
        userA: head?.querySelector('a[href*="userdetails"]') || postTable?.querySelector('a[href*="userdetails"]'),
        klass: (headText.match(/\(([^)]+)\)\s+at/) || [])[1] || '',
        date: (headText.match(/at\s+([\d-]+\s[\d:]+)/) || [])[1] || '',
        ago: (headText.match(/\(([^)]*ago)\)/) || [])[1] || '',
        quote: headLinks.find((a) => /quote/i.test(txt(a)))?.href,
        // Only present on the viewer's own posts (and for mods).
        edit: headLinks.find((a) => /^edit$/i.test(txt(a).trim()))?.href,
        avatar: avatarCell?.querySelector('img')?.src,
        stats: avatarCell ? lines(avatarCell).flatMap((s) => s.split(/(?=Posts:)|(?=Ratio:)/).map((x) => x.trim())) : [],
        body,
      };
    });
  }

  // Hidden users (ported from Max's cg_hide_users_in_forum.js): a persistent
  // {userId: name} block list. Posts by listed users collapse to a stub with a
  // per-post reveal; unhiding anywhere reveals the user's posts everywhere.
  const hiddenUsers = {
    all: () => store.get('hiddenUsers', {}),
    has: (id) => !!id && id in hiddenUsers.all(),
    add(id, name) {
      const m = this.all();
      m[id] = name;
      store.set('hiddenUsers', m);
    },
    remove(id) {
      const m = this.all();
      delete m[id];
      store.set('hiddenUsers', m);
    },
  };

  // Numeric user id for a post — from the profile link, or the legacy
  // `td.comment.userNNN` class the original hide-users script keyed on.
  function postUserId(p) {
    const m =
      (p.userA?.href || '').match(/[?&]id=(\d+)/) ||
      (p.body?.className || '').match(/\buser(\d+)\b/) ||
      (p.body?.closest('table')?.className || '').match(/\buser(\d+)\b/);
    return m ? m[1] : null;
  }

  const revealPostsBy = (uid) => document.querySelectorAll(`.cgx-post-hidden[data-uid="${uid}"]`).forEach((s) => s._cgxShow());
  const hidePostsBy = (uid) => document.querySelectorAll(`.cgx-post[data-uid="${uid}"]`).forEach((c) => c._cgxHide());

  function hiddenPostStub(p, uid) {
    const show = () => stub.replaceWith(visiblePostCard(p, uid));
    const stub = el(
      'div',
      { class: 'cgx-post-hidden', 'data-uid': uid },
      el('span', {}, 'Hidden'),
      el('span', { class: 'spacer' }),
      el('button', { class: 'cgx-btn ghost sm', type: 'button', title: 'Reveal this post only', onclick: show }, 'Show'),
      el(
        'button',
        {
          class: 'cgx-btn ghost sm',
          type: 'button',
          title: 'Stop hiding this user',
          onclick: () => {
            hiddenUsers.remove(uid);
            revealPostsBy(uid);
          },
        },
        'Unhide user'
      )
    );
    stub._cgxShow = show;
    return stub;
  }

  // "Hidden users (N)" dropdown — the way to unhide someone whose posts you
  // can no longer find on screen. Renders as a header button by default, or as
  // a stat tile (for the forums-index stats grid) when asTile is set.
  function hiddenUsersMenu(asTile) {
    const entries = Object.entries(hiddenUsers.all());
    if (!entries.length) return null;
    const summary = asTile
      ? el('summary', { class: 'cgx-stat-tile' }, el('div', { class: 'num' }, String(entries.length)), el('div', { class: 'lbl' }, 'Hidden users'))
      : el('summary', { class: 'cgx-btn ghost' }, `Hidden users (${entries.length})`);
    const setCount = (n) => {
      if (asTile) summary.querySelector('.num').textContent = String(n);
      else summary.textContent = `Hidden users (${n})`;
    };
    const menu = el(
      'details',
      { class: 'cgx-hidden-menu' + (asTile ? ' tile' : '') },
      summary,
      el(
        'div',
        { class: 'cgx-hidden-menu-list' },
        entries.map(([id, name]) => {
          const row = el(
            'div',
            { class: 'cgx-hidden-menu-row' },
            el('a', { href: '/userdetails.php?id=' + id }, name || '#' + id),
            el(
              'button',
              {
                class: 'cgx-btn ghost sm',
                type: 'button',
                onclick: () => {
                  hiddenUsers.remove(id);
                  revealPostsBy(id);
                  row.remove();
                  const left = Object.keys(hiddenUsers.all()).length;
                  if (left) setCount(left);
                  else menu.remove();
                },
              },
              'Unhide'
            )
          );
          return row;
        })
      )
    );
    return menu;
  }

  function forumPostCard(p) {
    const uid = postUserId(p);
    return hiddenUsers.has(uid) ? hiddenPostStub(p, uid) : visiblePostCard(p, uid);
  }

  function visiblePostCard(p, uid) {
    // Compose-page previews have no header strip and often no avatar text —
    // collapse whatever's empty rather than rendering hollow chrome.
    const hasSide = p.avatar || p.userA || p.klass || p.stats.length;
    const hasHead = p.date || p.num || p.quote;
    const card = el(
      'article',
      { class: 'cgx-post', 'data-uid': uid },
      hasSide
        ? el(
            'div',
            { class: 'cgx-post-side' },
            p.avatar ? el('img', { class: 'cgx-post-avatar', src: p.avatar, alt: '' }) : null,
            userLink(p.userA, 'cgx-post-user'),
            p.klass ? el('div', { class: 'cgx-post-class' }, p.klass) : null,
            el('div', { class: 'cgx-post-stats' }, p.stats.filter((s) => /posts:|ratio:|\(\d/i.test(s)).map((s) => el('div', {}, s)))
          )
        : null,
      el(
        'div',
        { class: 'cgx-post-main' },
        hasHead
          ? el(
              'div',
              { class: 'cgx-post-head' },
              el('span', { class: 'cgx-post-date' }, p.date, p.ago ? el('span', { class: 'ago' }, ` · ${p.ago}`) : null),
              el('span', { class: 'spacer' }),
              uid
                ? el(
                    'button',
                    {
                      class: 'cgx-btn ghost sm cgx-hide-user',
                      type: 'button',
                      title: `Hide all posts by ${p.userA ? txt(p.userA) : 'this user'}`,
                      onclick: () => {
                        hiddenUsers.add(uid, p.userA ? txt(p.userA) : `user #${uid}`);
                        hidePostsBy(uid);
                      },
                    },
                    'Hide'
                  )
                : null,
              p.edit ? el('a', { class: 'cgx-btn ghost sm', href: p.edit }, 'Edit') : null,
              p.quote ? el('a', { class: 'cgx-btn ghost sm', href: p.quote }, 'Quote') : null,
              p.num ? el('a', { class: 'cgx-post-num', href: p.permalink || '#' }, '#' + p.num) : null
            )
          : null,
        el('div', { class: 'cgx-post-body' }, legacyEmbed(p.body))
      )
    );
    card._cgxHide = () => card.replaceWith(hiddenPostStub(p, uid));
    return card;
  }

  /* ------------------------------ post editor kit ----------------------------- */
  // Everything that turns a legacy <textarea> into an editor lives here, so
  // every box you can type a post into — quick reply, compose, torrent
  // comment, PM, upload description — gets the same kit from one call to
  // armEditor().

  // Same-origin page fetch, parsed. Used to read the site's own smilie and
  // BBCode reference pages rather than hardcoding a list that would drift.
  function fetchDoc(url, cb) {
    fetch(url, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((html) => cb(new DOMParser().parseFromString(html, 'text/html')))
      .catch(() => cb(null));
  }

  // A day's cache in localStorage in front of fetchDoc-based parsers: the
  // smilie set and the BBCode list change roughly never, and both are wanted
  // the moment a toolbar dropdown is first opened.
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  function cachedList(key, url, parse, cb) {
    const hit = store.get('cache:' + key, null);
    if (hit && Date.now() - hit.at < CACHE_TTL && hit.list?.length) return cb(hit.list);
    fetchDoc(url, (doc) => {
      const list = doc ? parse(doc) : [];
      if (list.length) store.set('cache:' + key, { at: Date.now(), list });
      cb(list.length ? list : hit?.list || []);
    });
  }

  // A smilie code is short, unspaced, and always carries punctuation — ":)",
  // ":cool:", ":-D". The punctuation test is what keeps a sidebar cell reading
  // "Browse" beside an icon from being mistaken for one.
  const smilieCode = (s) => {
    const t = (s || '').trim();
    return t && t.length <= 24 && !/\s/.test(t) && /[^\w]/.test(t) ? t : '';
  };

  // The reference pages aren't at a fixed path on every install, so whenever a
  // page shows us a "smilies" or "tags" link, keep its href for later.
  function rememberHelpLinks(doc) {
    for (const a of doc.querySelectorAll('a[href]')) {
      const label = txt(a).toLowerCase();
      if (label === 'smilies' || label === 'tags') store.set('url:' + label, a.href);
    }
  }
  const helpUrl = (name, fallback) => store.get('url:' + name, fallback);

  // smilies.php lays out image + code pairs; which cell holds which varies
  // (live it's code-then-image, so the previous cell comes first), so try the
  // image's own cell, its neighbours, then its alt attribute.
  function parseSmilies(doc) {
    const out = [];
    const seen = new Set();
    for (const img of doc.querySelectorAll('img')) {
      const src = img.getAttribute('src') || '';
      if (!src || /logo|banner|bg\.png/i.test(src)) continue;
      const cell = img.closest('td') || img.parentElement;
      const code =
        smilieCode(txt(cell)) ||
        smilieCode(txt(cell?.previousElementSibling)) ||
        smilieCode(txt(cell?.nextElementSibling)) ||
        smilieCode(img.getAttribute('alt')) ||
        smilieCode(img.getAttribute('title'));
      if (!code || seen.has(code)) continue;
      seen.add(code);
      out.push({ code, src: img.src, alt: img.getAttribute('alt') || code });
    }
    return out;
  }
  const loadSmilies = (cb) => cachedList('smilies', helpUrl('smilies', '/smilies.php'), parseSmilies, cb);

  // tags.php is CG's own BBCode reference — one 4-row table per tag
  // (Description / Syntax / Example / Result). Reading the toolbar's
  // site-specific codes out of it means the buttons are always exactly the
  // codes this site supports: video embeds, mediainfo, user/torrent/thread/
  // imdb/search links, whatever gets added later.
  function parseBbTags(doc) {
    const out = [];
    const seen = new Set();
    for (const t of doc.querySelectorAll('table')) {
      if (t.querySelector('table') || !/description:/i.test(t.textContent || '')) continue;
      const cellFor = (label) =>
        [...t.rows].find((r) => r.cells[1] && new RegExp('^' + label, 'i').test(txt(r.cells[0])))?.cells[1];
      const syntax = txt(cellFor('Syntax'));
      const name = (syntax.match(/^\[(\w+)/) || [])[1];
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, syntax, desc: txt(cellFor('Description')), example: txt(cellFor('Example')) });
    }
    return out;
  }
  const loadBbTags = (cb) => cachedList('bbtags', helpUrl('tags', '/tags.php'), parseBbTags, cb);

  /* --- BBCode → HTML, for the preview panel --- */

  const BB_SIZES = { 1: '0.7em', 2: '0.85em', 3: '1em', 4: '1.2em', 5: '1.5em', 6: '2em', 7: '2.5em' };
  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeUrl = (u) => (/^(https?:|\/|\.{0,2}\/)/i.test(u) ? u : '#');

  // Applied repeatedly until the text stops changing, which is how nesting
  // ([quote] inside [quote], [b] inside [url]) resolves — each pass eats the
  // innermost pair.
  const BB_RULES = [
    [/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>'],
    [/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>'],
    [/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>'],
    [/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>'],
    [/\[center\]([\s\S]*?)\[\/center\]/gi, '<div style="text-align:center">$1</div>'],
    [/\[pre\]([\s\S]*?)\[\/pre\]/gi, '<pre>$1</pre>'],
    [/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<span class="cgx-pv-spoiler">$1</span>'],
    [/\[color=([#\w]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>'],
    [/\[size=([1-7])\]([\s\S]*?)\[\/size\]/gi, (m, n, body) => `<span style="font-size:${BB_SIZES[n]}">${body}</span>`],
    // safeUrl: the text being previewed can be someone else's quoted post, so
    // javascript:/data: URLs are dropped rather than rendered into an anchor.
    [/\[url=([^\]\s]+)\]([\s\S]*?)\[\/url\]/gi, (m, u, body) => `<a href="${safeUrl(u)}">${body}</a>`],
    [/\[url\]([^[\]\s]+)\[\/url\]/gi, (m, u) => `<a href="${safeUrl(u)}">${u}</a>`],
    [/\[img\]([^[\]\s]+)\[\/img\]/gi, (m, u) => `<img src="${safeUrl(u)}">`],
    [/\[thumb=(\d+)\]([^[\]\s]+)\[\/thumb\]/gi, (m, w, u) => `<img src="${safeUrl(u)}" style="max-width:${w}px">`],
    [/\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi, '<p class="sub">$1 wrote:</p><div class="quote">$2</div>'],
    [/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<div class="quote">$1</div>'],
  ];

  function bbToHtml(text, smilies) {
    // Escape first: from here on nothing in the source can introduce markup,
    // so the substitutions below only ever emit tags we wrote ourselves.
    let s = escapeHtml(text);
    for (let pass = 0; pass < 8; pass++) {
      const before = s;
      for (const [re, to] of BB_RULES) s = s.replace(re, to);
      if (s === before) break;
    }
    // Runs of [*] lines become one list.
    s = s.replace(/(?:^|\n)((?:\[\*\][^\n]*\n?)+)/g, (m, block) => {
      const items = block.trim().split(/\n/).map((l) => `<li>${l.replace(/^\[\*\]\s?/, '')}</li>`);
      return `<ul>${items.join('')}</ul>`;
    });
    // Longest code first, so ":cool:" isn't eaten by a ":c" style code.
    for (const sm of [...(smilies || [])].sort((a, b) => b.code.length - a.code.length)) {
      s = s.replace(new RegExp(escapeRe(escapeHtml(sm.code)), 'g'), `<img src="${sm.src}" alt="${escapeHtml(sm.alt)}">`);
    }
    return s.replace(/\n/g, '<br>');
  }

  // BBCode toolbar for the compose textarea — the useful core of WhutBBCode
  // (greasyfork 1024) without its settings/emoticons/update machinery.
  // Wraps the selection and keeps it selected so formatting can be stacked.
  function bbWrap(ta, pre, post) {
    const s = ta.selectionStart ?? 0;
    const e = ta.selectionEnd ?? 0;
    const sel = ta.value.slice(s, e);
    ta.value = ta.value.slice(0, s) + pre + sel + post + ta.value.slice(e);
    const at = s + pre.length;
    ta.focus();
    ta.setSelectionRange(at, at + sel.length);
  }

  // Each selected line becomes a [*] list item; no selection inserts one.
  function bbList(ta) {
    const s = ta.selectionStart ?? 0;
    const e = ta.selectionEnd ?? 0;
    const sel = ta.value.slice(s, e);
    const out = sel
      ? sel.split('\n').map((l) => (l.trim() ? '[*] ' + l.trim() : l)).join('\n')
      : '[*] ';
    ta.value = ta.value.slice(0, s) + out + ta.value.slice(e);
    ta.focus();
    ta.setSelectionRange(s, s + out.length);
  }

  const BB_BUTTONS = [
    { label: 'B', title: 'Bold', key: 'b', pre: '[b]', post: '[/b]' },
    { label: 'I', title: 'Italic', key: 'i', pre: '[i]', post: '[/i]' },
    { label: 'U', title: 'Underline', key: 'u', pre: '[u]', post: '[/u]' },
    { label: 'S', title: 'Strikethrough', key: 's', pre: '[s]', post: '[/s]' },
    null,
    { label: 'Color', title: 'Text colour — edit the value', pre: '[color=#FC9E00]', post: '[/color]' },
    { label: 'Size', title: 'Text size (1–7) — edit the value', pre: '[size=4]', post: '[/size]' },
    { label: 'Center', title: 'Centre text', pre: '[center]', post: '[/center]' },
    null,
    { label: 'Link', title: 'Link — edit the URL', key: 'k', pre: '[url=https://]', post: '[/url]' },
    { label: 'Img', title: 'Image', pre: '[img]', post: '[/img]' },
    { label: 'Thumb', title: 'Image as click-to-expand thumbnail', pre: '[thumb=200]', post: '[/thumb]' },
    null,
    { label: 'Quote', title: 'Quote — [quote=name] credits the author', pre: '[quote]', post: '[/quote]' },
    { label: 'Spoiler', title: 'Spoiler (revealed on hover)', pre: '[spoiler]', post: '[/spoiler]' },
    { label: 'Pre', title: 'Preformatted monospace text', pre: '[pre]', post: '[/pre]' },
    { label: 'List', title: 'Each selected line becomes a list item', list: true },
  ];

  // Only shortcuts the browser actually delivers to the page — Cmd+Q/M/L
  // and friends are reserved by Chrome/macOS and never reach us.

  // Drop text in at the caret without wrapping anything (smilies, whole tag
  // skeletons) and leave the caret after it.
  function bbInsert(ta, text) {
    const s = ta.selectionStart ?? ta.value.length;
    const e = ta.selectionEnd ?? s;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    const at = s + text.length;
    ta.focus();
    ta.setSelectionRange(at, at);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // A toolbar dropdown whose contents are fetched the first time it's opened.
  function lazyMenu(label, title, cls, load, build) {
    let loaded = false;
    const body = el('div', { class: 'cgx-bbmenu-list ' + cls });
    const menu = el(
      'details',
      { class: 'cgx-bbmenu' },
      el('summary', { class: 'cgx-btn ghost sm', title }, label),
      body
    );
    menu.addEventListener('toggle', () => {
      if (!menu.open || loaded) return;
      loaded = true;
      body.append(el('span', { class: 'cgx-bbmenu-note' }, 'Loading…'));
      load((list) => {
        body.textContent = '';
        if (!list.length) body.append(el('span', { class: 'cgx-bbmenu-note' }, 'Nothing to show — the source page could not be read.'));
        else body.append(...build(list, () => (menu.open = false)));
      });
    });
    document.addEventListener('click', (e) => {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    return menu;
  }

  const smilieMenu = (ta) =>
    lazyMenu('☺', 'Smilies', 'smilies', loadSmilies, (list, close) =>
      list.map((sm) =>
        el(
          'button',
          {
            class: 'cgx-smilie',
            type: 'button',
            title: sm.code,
            onclick: () => {
              bbInsert(ta, (/\s$/.test(ta.value.slice(0, ta.selectionStart ?? 0)) ? '' : ' ') + sm.code + ' ');
              close();
            },
          },
          el('img', { src: sm.src, alt: sm.alt })
        )
      )
    );

  // Site-specific codes, straight from tags.php. A tag written as
  // "[x=VALUE]TEXT[/x]" wraps the selection; anything else is inserted whole
  // so the placeholders are there to type over.
  const siteCodeMenu = (ta) =>
    lazyMenu('Site codes ▾', "This site's own BBCodes, read from tags.php", 'codes', loadBbTags, (list, close) =>
      list.map((t) => {
        const pair = t.syntax.match(/^(\[[^\]]+\])([\s\S]*)(\[\/\w+\])$/);
        return el(
          'button',
          {
            class: 'cgx-bbmenu-row',
            type: 'button',
            onclick: () => {
              if (pair && (ta.selectionEnd ?? 0) > (ta.selectionStart ?? 0)) bbWrap(ta, pair[1], pair[3]);
              else bbInsert(ta, t.syntax);
              close();
            },
          },
          el('code', {}, t.syntax || '[' + t.name + ']'),
          t.desc ? el('span', { class: 'desc' }, t.desc) : null
        );
      })
    );

  // Expandable render-as-it-will-look panel under the box. Re-rendered on
  // input while open only — closed, it costs nothing.
  function previewPanel(ta) {
    const body = el('div', { class: 'cgx-embed cgx-preview-body' });
    const panel = el('details', { class: 'cgx-preview' }, el('summary', {}, 'Preview'), body);
    let smilies = [];
    let timer = null;
    const draw = () => {
      body.innerHTML = ta.value.trim() ? bbToHtml(ta.value, smilies) : '';
      if (!ta.value.trim()) body.append(el('span', { class: 'cgx-hint' }, 'Nothing to preview yet.'));
    };
    panel.addEventListener('toggle', () => {
      if (!panel.open) return;
      draw();
      if (!smilies.length) {
        loadSmilies((list) => {
          smilies = list;
          if (panel.open) draw();
        });
      }
    });
    ta.addEventListener('input', () => {
      if (!panel.open) return;
      clearTimeout(timer);
      timer = setTimeout(draw, 200);
    });
    // Keyed on the field name: the profile page has two of these (info and
    // signature) and they should remember their own states, not share one.
    return rememberOpen(panel, 'post-preview-' + (ta.name || ta.id || ''));
  }

  function bbToolbar(ta) {
    const mod = /mac/i.test(navigator.platform) ? '⌘' : 'Ctrl+';
    const apply = (b) => (b.list ? bbList(ta) : bbWrap(ta, b.pre, b.post));
    const byKey = {};
    BB_BUTTONS.forEach((b) => { if (b && b.key) byKey[b.key] = b; });

    ta.addEventListener('keydown', (ev) => {
      if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
      const b = byKey[ev.key.toLowerCase()];
      if (!b) return;
      ev.preventDefault();
      apply(b);
    });

    return el(
      'div',
      { class: 'cgx-bbbar' },
      BB_BUTTONS.map((b) =>
        b
          ? el(
              'button',
              {
                class: 'cgx-btn ghost sm cgx-bb-' + b.label.toLowerCase(),
                type: 'button',
                title: b.title + (b.key ? ` (${mod}${b.key.toUpperCase()})` : ''),
                onclick: () => apply(b),
              },
              b.label
            )
          : el('span', { class: 'cgx-bbbar-div' })
      ),
      el('span', { class: 'cgx-bbbar-div' }),
      smilieMenu(ta),
      siteCodeMenu(ta)
    );
  }

  // The one call every post box makes: toolbar above, preview below. Idempotent,
  // so renderers that already reparented a legacy form can call it freely.
  function armEditor(ta) {
    if (!ta || ta.dataset.cgxArmed) return;
    ta.dataset.cgxArmed = '1';
    ta.parentNode.insertBefore(bbToolbar(ta), ta);
    ta.parentNode.insertBefore(previewPanel(ta), ta.nextSibling);
  }

  // Arm every textarea in a form — legacy compose pages have exactly one, but
  // this keeps callers from having to find it.
  const armFormEditors = (form) => form && form.querySelectorAll('textarea').forEach(armEditor);

  // ?action=reply / newtopic / edit — the compose page: reparented form +
  // the "10 last posts, in reverse order" preview.
  function forumsCompose(doc) {
    const form = [...doc.forms].find((f) => f.querySelector('textarea'));
    if (!form) throw new Error('no compose form');
    form.classList.add('cgx-repform', 'cgx-reply');
    armFormEditors(form);
    const topicid = form.elements.topicid?.value;
    const helpLinks = [...doc.querySelectorAll('a')].filter((a) => /^(tags|smilies)$/i.test(txt(a).trim()));
    const lastHead = [...doc.querySelectorAll('h1, td.colhead')].find((h) => /last posts/i.test(txt(h)));
    const posts = parseForumPosts(doc);

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el(
            'h2',
            { class: 'cgx-page-title' },
            el('a', { href: '/forums.php' }, 'Forums'),
            /edit/i.test(new URLSearchParams(location.search).get('action') || '') ? ' › Edit post' : ' › Compose'
          ),
          el(
            'div',
            { class: 'cgx-forums-actions' },
            // Same menu as the topic view — the quote page hides the same
            // users, so it needs the same way back out.
            hiddenUsersMenu(),
            topicid
              ? el('a', { class: 'cgx-btn ghost', href: `/forums.php?action=viewtopic&topicid=${topicid}` }, '‹ Back to topic')
              : null
          )
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-panel-head' },
            el('h3', {}, 'Compose'),
            helpLinks.length
              ? el('div', { class: 'cgx-forums-actions' }, helpLinks.map((a) => el('a', { class: 'cgx-btn ghost sm', href: a.href, target: '_blank' }, txt(a))))
              : null
          ),
          form
        ),
        posts.length ? el('h3', { class: 'cgx-page-title cgx-lastposts' }, txt(lastHead) || 'Last posts') : null,
        posts.map(forumPostCard),
        threadJump()
      )
    );
  }

  // Floating top/bottom jumps for long threads. Fixed to the viewport rather
  // than tied to the post list, so it stays put while the thread scrolls, and
  // it only appears once there is actually somewhere to jump to.
  function threadJump() {
    const jump = (y) => scrollTo({ top: y, behavior: 'smooth' });
    const nav = el(
      'div',
      { class: 'cgx-jump' },
      el('button', { class: 'cgx-btn icon', type: 'button', title: 'Jump to top', onclick: () => jump(0) }, '▲'),
      el(
        'button',
        { class: 'cgx-btn icon', type: 'button', title: 'Jump to bottom', onclick: () => jump(document.documentElement.scrollHeight) },
        '▼'
      )
    );
    const sync = () => nav.classList.toggle('on', document.documentElement.scrollHeight - innerHeight > 400);
    addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    requestAnimationFrame(sync);
    return nav;
  }

  // Replying redirects to "…&page=last#<postid>", but the browser can answer
  // that from its cache with the copy it already had — the thread comes back
  // without the post that was just made, and only a manual reload fixes it.
  // If the anchor we were sent to isn't on the page, fetch it again (once per
  // post id, so a genuinely missing/deleted post can't loop).
  function refetchIfPostMissing(posts) {
    // Scoped to the "page=last" shape the post-reply redirect uses — a plain
    // permalink into a thread can legitimately land on a page that doesn't
    // hold that post, and reloading there would achieve nothing.
    if (!/[?&]page=last\b/.test(location.search)) return false;
    const wanted = (location.hash.match(/^#(\d+)$/) || [])[1];
    if (!wanted || posts.some((p) => p.num === wanted)) return false;
    const flag = 'cgx:refetched:' + wanted;
    try {
      if (sessionStorage.getItem(flag)) return false;
      sessionStorage.setItem(flag, '1');
    } catch {
      return false;
    }
    location.reload();
    return true;
  }

  function forumsTopic(doc) {
    // Breadcrumb: "Forums > Forum > Topic" heading (links inside are kept).
    const crumbSrc = [...doc.querySelectorAll('h1')].find((h) => txt(h)) || null;
    const crumb = el('h2', { class: 'cgx-page-title cgx-crumb' });
    if (crumbSrc) [...crumbSrc.childNodes].forEach((n) => crumb.append(n.cloneNode(true)));
    else crumb.textContent = 'Topic';

    const posts = parseForumPosts(doc);
    if (refetchIfPostMissing(posts)) return;

    // Tiny hidden+submit forms ("View Unread", "Full Reply") become buttons;
    // the quick-reply form (textarea) is reparented whole.
    const buttons = [...doc.forms]
      .filter((f) => f.elements.length && [...f.elements].every((e) => ['hidden', 'submit'].includes(e.type)))
      .map((f) => {
        const label = f.querySelector('input[type="submit"]')?.value || 'Go';
        const isUnread = /view unread/i.test(label);
        return el(
          'button',
          { class: 'cgx-btn ghost', type: 'button', onclick: () => f.submit(), title: isUnread ? 'All topics with unread posts, across every forum' : null },
          isUnread ? 'Unread topics' : label
        );
      });
    const replyForm = [...doc.forms].find((f) => f.querySelector('textarea'));
    if (replyForm) {
      replyForm.classList.add('cgx-repform');
      armFormEditors(replyForm);
    }

    renderShell(
      doc,
      el(
        'div',
        {},
        el('div', { class: 'cgx-panel-head cgx-forums-top' }, crumb, el('div', { class: 'cgx-forums-actions' }, hiddenUsersMenu(), buttons)),
        posts.map(forumPostCard),
        pagerNav(doc),
        replyForm
          ? el('section', { class: 'cgx-panel cgx-reply' }, el('h3', {}, 'Quick reply'), replyForm)
          : null,
        threadJump()
      )
    );
  }

  /* ------------------------------- COCKS shared ------------------------------ */

  // Styled <select> that mirrors a hidden legacy one.
  function proxySelect(legacy) {
    if (!legacy) return null;
    const s = el('select', { class: 'cgx-select', onchange: () => (legacy.value = s.value) });
    [...legacy.options].forEach((o) => s.append(el('option', { value: o.value }, o.textContent.trim())));
    s.value = legacy.value;
    return s;
  }

  // The [COCKS Home] [All pages] … nav as chips; the current page's chip lights up.
  function cocksNavChips(outer) {
    const cell = [...outer.querySelectorAll('td, center, p, div')].find(
      (n) => /\[COCKS Home\]/.test(txt(n)) && !n.querySelector('table')
    );
    if (!cell) return null;
    return el(
      'div',
      { class: 'cgx-cocks-nav' },
      [...cell.querySelectorAll('a')].map((a) => {
        let on = false;
        try {
          const u = new URL(a.href);
          on = u.pathname === location.pathname && u.search === location.search;
        } catch {}
        return el('a', { class: 'cgx-chip' + (on ? ' on' : ''), href: a.href }, txt(a).replace(/[[\]]/g, '').trim());
      })
    );
  }

  // Page listings (notawiki.php, endoscope results) as rows rather than cards:
  // these are long, mostly-uniform inventories where you scan down one column
  // looking for a title, and the card grid made that harder than the plain
  // table it replaced. The COCKS home page keeps its cards — a handful of
  // categories is exactly what a grid is good at.
  const cocksPageList = (pages) =>
    el(
      'div',
      { class: 'cgx-page-list' },
      pages.map((p) =>
        el(
          'a',
          { class: 'cgx-page-row', href: p.href },
          el(
            'span',
            { class: 'main' },
            el('span', { class: 'name' }, p.title),
            p.desc ? el('span', { class: 'desc' }, p.desc) : null
          ),
          p.type ? el('span', { class: 'type' }, p.type) : null,
          p.curator ? el('span', { class: 'curator' }, p.curator) : null,
          p.edited ? el('span', { class: 'edited' }, p.edited) : null
        )
      )
    );

  // The endoscope.php search form rebuilt with proxies (shared by index + listings).
  function buildCocksSearch(doc) {
    const sForm = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('endoscope'));
    if (!sForm) return null;
    const q = el('input', { class: 'cgx-search', type: 'search', placeholder: 'Search COCKS pages…', value: sForm.elements.q?.value || '' });
    const go = () => {
      if (sForm.elements.q) sForm.elements.q.value = q.value;
      sForm.submit();
    };
    q.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    return el(
      'div',
      { class: 'cgx-cocks-search' },
      q,
      el('label', {}, 'in ', proxySelect(sForm.elements.where)),
      el('label', {}, 'match ', proxySelect(sForm.elements.what)),
      el('label', {}, proxySelect(sForm.elements.searchtype)),
      el('label', {}, 'sort ', proxySelect(sForm.elements.sort)),
      el('button', { class: 'cgx-btn primary', type: 'button', onclick: go }, 'Search')
    );
  }

  /* cocks/index.php — COCKS home: banner, search, category directory, create form */

  function renderCocksIndex(doc) {
    const outer = doc.querySelector('td.outer');
    if (!outer) {
      renderShell(doc, el('section', { class: 'cgx-panel' }, el('h3', {}, 'COCKS'), el('p', {}, 'Could not parse this page.')));
      return;
    }

    const cellWith = (re) =>
      [...outer.querySelectorAll('td, center, p, div')].find((n) => re.test(txt(n)) && !n.querySelector('table'));
    const chipsFrom = (cell, cls) =>
      cell
        ? el(
            'div',
            { class: cls },
            [...cell.querySelectorAll('a')].map((a) => el('a', { class: 'cgx-chip', href: a.href }, txt(a).replace(/[[\]]/g, '').trim()))
          )
        : null;

    const nav = cocksNavChips(outer);
    const quick = chipsFrom(cellWith(/\[Pseudorandom Page\]/), 'cgx-cocks-nav quick');

    const banner = outer.querySelector('img');
    const titleEl = [...outer.querySelectorAll('h1, h2, b')].find((n) => /organised collection/i.test(txt(n)));
    // "Newest Page: X / Most recently edited: Y" is one <b> blob — take its
    // showpage links in order rather than trusting the label markup.
    const freshHost = [...outer.querySelectorAll('b, p, div, td')].find(
      (n) => /newest page:/i.test(txt(n)) && n.querySelector('a[href*="showpage"]') && txt(n).trim().length < 200
    );
    const freshAnchors = freshHost ? [...freshHost.querySelectorAll('a[href*="showpage"]')] : [];
    const freshLink = (label, a) =>
      a ? el('span', { class: 'cgx-cocks-fresh' }, label + ' ', el('a', { href: a.href }, txt(a))) : null;
    const blurb = [...outer.querySelectorAll('td, p, div')].find((n) => !n.querySelector('table, td') && /herein/i.test(txt(n)));
    const aboutA = [...outer.querySelectorAll('a')].find((a) => /about cocks/i.test(txt(a)));

    const searchRow = buildCocksSearch(doc);

    // Category directory — 2-col leaf tables of [link | description]
    const catTables = [...outer.querySelectorAll('table')].filter(
      (t) => !t.querySelector('table') && t.rows.length >= 2 && [...t.rows].every((r) => r.cells.length === 2 && r.cells[0].querySelector('a'))
    );
    const cardGrid = (t) =>
      el(
        'div',
        { class: 'cgx-cat-grid' },
        [...t.rows].map((r) => {
          const a = r.cells[0].querySelector('a');
          return el(
            'a',
            { class: 'cgx-cat-card', href: a.href },
            el('div', { class: 'name' }, txt(a).trim()),
            el('div', { class: 'desc' }, txt(r.cells[1]).replace(/\s+/g, ' ').trim())
          );
        })
      );

    // Create new page — legacy addpage.php form (select + submit)
    const cForm = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('addpage'));
    const howTo = [...outer.querySelectorAll('a')].find((a) => /how do i create/i.test(txt(a)));
    const createRow = cForm
      ? el(
          'div',
          { class: 'cgx-cocks-create' },
          proxySelect(cForm.elements.typeid),
          el('button', { class: 'cgx-btn primary', type: 'button', onclick: () => cForm.submit() }, 'Create page'),
          howTo ? el('a', { class: 'cgx-btn ghost', href: howTo.href }, txt(howTo)) : null
        )
      : null;

    renderShell(
      doc,
      el(
        'div',
        {},
        nav,
        el(
          'section',
          { class: 'cgx-panel cgx-cocks-home' },
          banner ? el('img', { class: 'cgx-cocks-banner', src: banner.src, alt: 'COCKS' }) : null,
          el('h2', { class: 'cgx-cocks-title' }, titleEl ? txt(titleEl).trim() : 'COCKS'),
          blurb ? el('p', { class: 'cgx-hint' }, txt(blurb).replace(/\s+/g, ' ').trim()) : null,
          el(
            'div',
            { class: 'cgx-cocks-freshline' },
            freshLink('Newest page:', freshAnchors[0]),
            freshLink('Recently edited:', freshAnchors[1]),
            aboutA ? el('a', { class: 'cgx-cocks-fresh', href: aboutA.href }, 'About COCKS') : null
          ),
          searchRow,
          quick
        ),
        catTables[0] ? el('section', { class: 'cgx-panel' }, el('h3', {}, 'Page categories'), cardGrid(catTables[0])) : null,
        catTables[1] ? el('section', { class: 'cgx-panel' }, el('h3', {}, 'Possibly of interest'), cardGrid(catTables[1])) : null,
        createRow ? el('section', { class: 'cgx-panel' }, el('h3', {}, 'Create a new page'), createRow) : null
      )
    );
  }

  /* cocks/notawiki.php — the page listings (All pages / Projects / Fan Pages /
     Reviews / Guides / Help and Site Info are all this route with ?type=) */

  /* cocks/endoscope.php — search results: Page|Description|Curator|Page
     Type|Last edit (columns mapped by header, same card grid as notawiki). */
  function renderCocksScope(doc) {
    const outer = doc.querySelector('td.outer') || doc.body;
    // Header cells concatenate with no separators in textContent
    // ("PageDescriptionCurator…"), so match the first cell alone.
    const t = [...outer.querySelectorAll('table')].find(
      (x) => !x.querySelector('table') && x.rows.length > 0 && /^page$/i.test(txt(x.rows[0].cells[0]))
    );
    const headCells = t ? [...t.rows[0].cells].map((c) => txt(c).trim().toLowerCase()) : [];
    const col = (name) => headCells.findIndex((h) => h.startsWith(name));
    const iDesc = col('description');
    const iCur = col('curator');
    const iType = col('page type');
    const iEdit = col('last edit');
    const cellTxt = (c, i) => (i >= 0 && c[i] ? txt(c[i]).replace(/\s+/g, ' ').trim() : '');
    const pages = t
      ? [...t.rows]
          .slice(1)
          .map((r) => {
            const a = r.cells[0] && r.cells[0].querySelector('a');
            if (!a) return null;
            return {
              title: txt(a).trim(),
              href: a.href,
              desc: cellTxt(r.cells, iDesc),
              type: cellTxt(r.cells, iType),
              curator: cellTxt(r.cells, iCur),
              edited: cellTxt(r.cells, iEdit).split(' ')[0],
            };
          })
          .filter(Boolean)
      : [];
    const q = (new URLSearchParams(location.search).get('q') || '').trim();

    renderShell(
      doc,
      el(
        'div',
        {},
        cocksNavChips(outer),
        el(
          'div',
          { class: 'cgx-panel-head cgx-forums-top' },
          el('h2', { class: 'cgx-page-title' }, `Endoscope results${q ? ` for “${q}”` : ''} (${pages.length})`)
        ),
        buildCocksSearch(doc),
        pages.length
          ? el('section', { class: 'cgx-panel' }, cocksPageList(pages))
          : el('section', { class: 'cgx-panel' }, el('p', { class: 'cgx-hint' }, 'Nothing found — the endoscope came back clean.'))
      )
    );
  }

  function renderCocksList(doc) {
    const outer = doc.querySelector('td.outer');
    if (!outer) {
      renderShell(doc, el('section', { class: 'cgx-panel' }, el('h3', {}, 'COCKS'), el('p', {}, 'Could not parse this page.')));
      return;
    }

    const listTable = [...outer.querySelectorAll('table')].find(
      (t) => !t.querySelector('table') && t.rows.length > 1 && /^Title/.test(txt(t.rows[0]).trim())
    );
    const sorts = listTable
      ? [...listTable.rows[0].querySelectorAll('a')].map((a) => ({ label: txt(a).trim(), href: a.href }))
      : [];
    // Column set varies: typed lists are Title|Description|Curator|Last Edit,
    // "All pages" adds a Type column — map by header text, not position.
    const headCells = listTable ? [...listTable.rows[0].cells].map((c) => txt(c).trim().toLowerCase()) : [];
    const col = (name) => headCells.findIndex((h) => h.startsWith(name));
    const iDesc = col('description');
    const iType = col('type');
    const iCur = col('curator');
    const iEdit = col('last edit');
    const cellTxt = (c, i) => (i >= 0 && c[i] ? txt(c[i]).replace(/\s+/g, ' ').trim() : '');
    const pages = listTable
      ? [...listTable.rows]
          .slice(1)
          .map((r) => {
            const c = r.cells;
            const a = c[0] && c[0].querySelector('a');
            if (!a) return null;
            return {
              title: txt(a).trim(),
              href: a.href,
              desc: cellTxt(c, iDesc),
              type: cellTxt(c, iType),
              curator: cellTxt(c, iCur),
              edited: cellTxt(c, iEdit).split(' ')[0],
            };
          })
          .filter(Boolean)
      : [];

    const seenPg = new Set();
    const pageNav = [...outer.querySelectorAll('a[href*="notawiki"]')]
      .filter((a) => /^\s*(\d+\s*-\s*\d+|next|prev|<<|>>)/i.test(txt(a).trim()))
      .map((a) => ({ label: txt(a).replace(/[<>]/g, '').trim(), href: a.href }))
      .filter((p) => p.label && !seenPg.has(p.label) && seenPg.add(p.label));

    const type = new URLSearchParams(location.search).get('type');
    const secName =
      { project: 'Projects', fanpage: 'Fan Pages', review: 'Reviews', guide: 'Guides', sitehelp: 'Help and Site Info' }[type] ||
      'All pages';
    const pseudoA = [...outer.querySelectorAll('a')].find((a) => /pseudorandom/i.test(txt(a)));

    const grid = cocksPageList(pages);

    const filter = el('input', {
      class: 'cgx-search cgx-list-filter',
      type: 'search',
      placeholder: `Filter ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}…`,
    });
    filter.addEventListener('input', () => {
      const v = filter.value.toLowerCase();
      [...grid.children].forEach((card, i) => {
        const hay = `${pages[i].title} ${pages[i].desc} ${pages[i].type} ${pages[i].curator}`.toLowerCase();
        card.style.display = hay.includes(v) ? '' : 'none';
      });
    });

    renderShell(
      doc,
      el(
        'div',
        {},
        cocksNavChips(outer),
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-panel-head' },
            el(
              'h2',
              { class: 'cgx-cocks-title' },
              secName,
              el('span', { class: 'cgx-board-note' }, pageNav.length ? `${pages.length} shown` : `${pages.length} pages`)
            ),
            pseudoA ? el('a', { class: 'cgx-btn ghost', href: pseudoA.href }, '🎲 ' + txt(pseudoA).replace(/[[\]]/g, '').trim()) : null
          ),
          buildCocksSearch(doc)
        ),
        el(
          'section',
          { class: 'cgx-panel' },
          el(
            'div',
            { class: 'cgx-list-tools' },
            filter,
            sorts.length
              ? el(
                  'div',
                  { class: 'cgx-chip-set' },
                  el('span', { class: 'cgx-chip-label' }, 'Sort by'),
                  sorts.map((s) => el('a', { class: 'cgx-chip', href: s.href }, s.label))
                )
              : null
          ),
          grid,
          pageNav.length
            ? el('nav', { class: 'cgx-pages' }, pageNav.map((p) => el('a', { class: 'cgx-page', href: p.href }, p.label)))
            : null
        )
      )
    );
  }

  /* cocks/showpage.php — fan pages. The platform chrome (nav, title, author,
     subscribe, totals, section jumps) is rebuilt natively; the user-authored
     body — arbitrary HTML — is embedded as-is. */

  function renderCocksPage(doc) {
    const outer = doc.querySelector('td.outer');
    const h1 = outer && outer.querySelector('h1');
    if (!outer || !h1) {
      renderShell(doc, el('section', { class: 'cgx-panel' }, el('h3', {}, 'COCKS'), el('p', {}, 'Could not parse this page.')));
      return;
    }

    const navCenter = [...outer.children].find((c) => c.tagName === 'CENTER' && /COCKS Home/i.test(txt(c)));
    const nav = navCenter
      ? [...navCenter.querySelectorAll('a')].map((a) => ({ label: txt(a).replace(/[[\]]/g, '').trim(), href: a.href }))
      : [];
    const subs = (txt(outer).match(/Subscribers:\s*([\d,]+)/) || [])[1] || null;
    const bodyHost = [...outer.children].find((c) => c.contains(h1));
    const isSubLink = (a) => /^\[?\s*(un)?subscribe\s*\]?$/i.test(txt(a).trim());
    const subscribeA = [...bodyHost.querySelectorAll('a')].find(isSubLink);
    const authorA = bodyHost.querySelector('a[href*="userdetails.php"]');

    const clone = bodyHost.cloneNode(true);
    [...clone.querySelectorAll('a')].filter(isSubLink).forEach((a) => a.remove());
    // The legacy page repeats its [COCKS Home] … nav at the bottom of the
    // body — we already render it as chips up top, so drop the copy.
    [...clone.querySelectorAll('a')]
      .filter((a) => /^\[\s*(COCKS Home|All pages|Projects|Fan Pages|Reviews|Guides|Help and Site Info)\s*\]$/i.test(txt(a).trim()))
      .forEach((a) => a.remove());
    clone.querySelector('h1')?.closest('center')?.remove();
    const cAuthor = [...clone.children].find(
      (c) => c.tagName === 'CENTER' && c.querySelector('a[href*="userdetails.php"]') && txt(c).trim().length < 60
    );
    if (cAuthor) cAuthor.remove();

    // Optional page furniture: a "Totals" label/value table → stat tiles,
    // and a "Move to section" anchor list → jump chips.
    let totalsTiles = null;
    const cTotals = [...clone.children].find((c) => c.tagName === 'CENTER' && /^totals/i.test(txt(c).trim()));
    if (cTotals) {
      const rows = [...cTotals.querySelectorAll('tr')].filter((r) => r.cells.length === 2 && txt(r.cells[0]).trim());
      if (rows.length) {
        totalsTiles = el('div', { class: 'cgx-info-tiles' }, rows.map((r) => statTile(txt(r.cells[1]).trim(), txt(r.cells[0]).trim())));
        cTotals.remove();
      }
    }
    let jumpBar = null;
    const cJump = [...clone.children].find((c) => c.tagName === 'CENTER' && /move to section/i.test(txt(c)));
    if (cJump) {
      const links = [...cJump.querySelectorAll('a[href^="#"]')].map((a) => ({ label: txt(a).trim(), frag: a.getAttribute('href') }));
      if (links.length) {
        jumpBar = el(
          'div',
          { class: 'cgx-chip-row' },
          el('span', { class: 'cgx-chip-label' }, 'Jump to section'),
          el('div', { class: 'cgx-chip-set' }, links.map((l) => el('a', { class: 'cgx-chip', href: l.frag }, l.label)))
        );
        cJump.remove();
      }
    }

    // Cover art shrinks to 35×50 thumbnails; the zoom modal from legacyEmbed
    // handles the click-to-expand. "Cover" = any large image sitting in a
    // table row that links to a torrent — standalone banners/art are left alone.
    const bodyEmbed = legacyEmbed(clone);
    bodyEmbed.querySelectorAll('img').forEach((img) => {
      const arm = () => {
        if (img.naturalHeight < 200) return;
        const row = img.closest('tr');
        if (row && row.querySelector('a[href*="details.php"]')) img.classList.add('cgx-cover-thumb');
      };
      img.complete && img.naturalWidth ? arm() : img.addEventListener('load', arm, { once: true });
    });

    const page = el(
      'div',
      {},
      nav.length ? el('div', { class: 'cgx-cocks-nav' }, nav.map((l) => el('a', { class: 'cgx-chip', href: l.href }, l.label))) : null,
      el(
        'section',
        { class: 'cgx-panel' },
        el(
          'div',
          { class: 'cgx-panel-head' },
          el(
            'div',
            {},
            el('h2', { class: 'cgx-cocks-title' }, txt(h1).trim()),
            authorA ? el('div', { class: 'cgx-cocks-by' }, 'by ', el('a', { href: authorA.href }, txt(authorA))) : null
          ),
          el(
            'div',
            { class: 'cgx-cocks-actions' },
            subs ? el('span', { class: 'cgx-subs' }, `${subs} subscribers`) : null,
            subscribeA
              ? el('a', { class: 'cgx-btn primary', href: subscribeA.href }, txt(subscribeA).replace(/[[\]]/g, '').trim())
              : null
          )
        ),
        totalsTiles,
        jumpBar
      ),
      el('section', { class: 'cgx-panel cgx-cocks-body' }, bodyEmbed)
    );

    // Fragment links must resolve inside OUR copy — the browser would
    // otherwise match the identical anchor in the hidden legacy DOM and
    // scroll nowhere.
    page.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const name = decodeURIComponent(a.getAttribute('href').slice(1));
      if (!name) return;
      const target = page.querySelector(`a[name="${CSS.escape(name)}"], [id="${CSS.escape(name)}"]`);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    renderShell(doc, page);
  }

  /* topten.php — six user leaderboards (also serves the Top 100/250 variants) */

  function renderTopTen(doc) {
    const me = parseUserBar(doc)?.name || null;
    const boards = leafTables(doc)
      .filter((t) => /#\s*User\s*Uploaded/i.test(txt(t.rows[0]).replace(/\s+/g, ' ')))
      .map((t) => {
        let n = t;
        while (n && !n.previousElementSibling && n.parentElement) n = n.parentElement;
        const head = n && n.previousElementSibling;
        const raw = head ? txt(head).replace(/\s+/g, ' ').trim() : '';
        const m = raw.match(/^Top\s+\d+\s+(.+?)(?:\s*\((.+?)\))?\s*(?:-\s*\[.*)?$/i);
        const variants = head
          ? [...head.querySelectorAll('a')].map((a) => ({ label: txt(a).trim(), href: a.href }))
          : [];
        const rows = [...t.rows].slice(1).map((r) => {
          const c = r.cells;
          const a = c[1].querySelector('a');
          return {
            rank: txt(c[0]).replace(/\./g, '').trim(),
            name: txt(c[1]).trim(),
            href: a?.href,
            uploaded: txt(c[2]).trim(),
            ulSpeed: txt(c[3]).trim(),
            downloaded: txt(c[4]).trim(),
            dlSpeed: txt(c[5]).trim(),
            ratio: txt(c[6]).trim(),
            joined: (txt(c[7]) || '').trim().split(' ')[0],
          };
        });
        return { title: m ? m[1] : raw || 'Top 10', note: m ? m[2] || '' : '', variants, rows };
      });

    const rankBadge = (rank) => {
      const medal = { 1: 'g', 2: 's', 3: 'b' }[rank] || '';
      return el('span', { class: 'cgx-rank-badge' + (medal ? ' ' + medal : '') }, rank);
    };
    const ratioCell = (v) => {
      const num = parseFloat(v.replace(/,/g, ''));
      const cls = /inf/i.test(v) || num >= 1 ? ' good' : isNaN(num) ? '' : ' bad';
      return el('td', { class: 'cgx-ratio' + cls }, v);
    };

    const boardPanel = (b) =>
      el(
        'section',
        { class: 'cgx-panel cgx-board' },
        el(
          'div',
          { class: 'cgx-panel-head' },
          el('h3', {}, b.title, b.note ? el('span', { class: 'cgx-board-note' }, b.note) : null),
          b.variants.length
            ? el('div', { class: 'cgx-board-links' }, b.variants.map((v) => el('a', { class: 'cgx-btn ghost sm', href: v.href }, v.label)))
            : null
        ),
        el(
          'div',
          { class: 'cgx-tbl-wrap' },
          el(
            'table',
            { class: 'cgx-tbl' },
            el('thead', {}, el('tr', {}, ['#', 'User', 'Uploaded', 'UL speed', 'Downloaded', 'DL speed', 'Ratio', 'Joined'].map((h) => el('th', {}, h)))),
            el(
              'tbody',
              {},
              b.rows.map((r) =>
                el(
                  'tr',
                  { class: me && r.name === me ? 'me' : null },
                  el('td', {}, rankBadge(r.rank)),
                  el('td', {}, r.href ? el('a', { class: 'cgx-tbl-title', href: r.href }, r.name) : r.name),
                  el('td', {}, r.uploaded),
                  el('td', {}, r.ulSpeed),
                  el('td', {}, r.downloaded),
                  el('td', {}, r.dlSpeed),
                  ratioCell(r.ratio),
                  el('td', {}, r.joined)
                )
              )
            )
          )
        )
      );

    renderShell(
      doc,
      boards.length
        ? el('div', {}, boards.map(boardPanel))
        : el('section', { class: 'cgx-panel' }, el('h3', {}, 'Top ten'), el('p', {}, 'No leaderboards found on this page.'))
    );
  }

  /* invite.php */

  function renderInvite(doc) {
    const form = [...doc.forms].find((f) => (f.getAttribute('action') || '').includes('invite'));
    const remaining = (doc.body.textContent.match(/([\d,]+)\s+invites? remaining/i) || [])[1] || '0';
    const t = leafTables(doc).find((x) => /username/i.test(txt(x.rows[0])));
    const invited = t
      ? [...t.rows].slice(1).map((r) => ({
          name: txt(r.cells[0]).trim(),
          href: r.cells[0].querySelector('a')?.href,
          ratio: txt(r.cells[1]).trim(),
          date: txt(r.cells[2]).trim(),
        }))
      : [];

    const emailInput = el('input', { class: 'cgx-search', type: 'email', placeholder: 'friend@example.com' });
    const sendInvite = () => {
      if (!form || !form.elements.email || !emailInput.value) return;
      form.elements.email.value = emailInput.value;
      form.submit();
    };
    emailInput.addEventListener('keydown', (e) => e.key === 'Enter' && sendInvite());

    renderShell(
      doc,
      el(
        'div',
        {},
        el(
          'section',
          { class: 'cgx-panel' },
          el('h3', {}, 'Invites'),
          statTile(remaining, (remaining === '1' ? 'invite' : 'invites') + ' remaining', 'big'),
          form
            ? el(
                'div',
                { class: 'cgx-invite-form' },
                emailInput,
                el('button', { class: 'cgx-btn primary', type: 'button', onclick: sendInvite }, 'Send invite')
              )
            : null
        ),
        invited.length
          ? el(
              'section',
              { class: 'cgx-panel' },
              el('h3', {}, `Invited users (${invited.length})`),
              el(
                'div',
                { class: 'cgx-tbl-wrap' },
                el(
                  'table',
                  { class: 'cgx-tbl' },
                  el('thead', {}, el('tr', {}, ['Username', 'Ratio', 'Invited'].map((h) => el('th', {}, h)))),
                  el(
                    'tbody',
                    {},
                    invited.map((u) =>
                      el(
                        'tr',
                        {},
                        el('td', {}, u.href ? el('a', { class: 'cgx-tbl-title', href: u.href }, u.name) : u.name),
                        el('td', {}, u.ratio),
                        el('td', {}, u.date)
                      )
                    )
                  )
                )
              )
            )
          : null
      )
    );
  }

  /* --------------------------------- styles ---------------------------------- */

  function injectStyles() {
    if (document.getElementById('cg-redux-style')) return;
    const style = document.createElement('style');
    style.id = 'cg-redux-style';
    style.textContent = `
      /* Native widgets + main scrollbar follow the scheme (only injected on redux pages) */
      html { color-scheme: ${theme.scheme}; scrollbar-color: ${theme.sbThumb} ${theme.sbTrack}; }
      body > :not(#cg-redux-root) { display: none !important; }
      #cg-redux-root {
        --bg: ${theme.bg}; --panel: ${theme.panel}; --panel-2: ${theme.panel2};
        --text: ${theme.text}; --muted: ${theme.muted}; --faint: ${theme.faint};
        --accent: ${theme.accent}; --accent-rgb: ${theme.accentRgb}; --accent-2: ${theme.accent2};
        --on-accent: ${theme.onAccent};
        --green: ${theme.green}; --green-rgb: ${theme.greenRgb};
        --red: ${theme.red}; --red-rgb: ${theme.redRgb};
        --line-soft: ${theme.lineSoft}; --line: ${theme.line};
        --line-strong: ${theme.lineStrong}; --line-hard: ${theme.lineHard};
        --hover: ${theme.hover};
        --hair: ${theme.hair}; --hair-strong: ${theme.hairStrong}; --wash: ${theme.wash};
        --sink: ${theme.sink}; --backdrop: ${theme.backdrop};
        --shadow: ${theme.shadow}; --shadow-lg: ${theme.shadowLg};
        --radius: 10px;
        /* Measured from the live topbar (armTopbarHeight) — it grows a row when
           the window is narrow, and the sidebar's sticky offset must follow. */
        --topbar-h: 63px;
        /* The same mark again, pre-tinted and spinning under its own SMIL
           clock — background images can't be animated from CSS, so the
           rotation has to live inside the SVG. Used as the placeholder behind
           every still-loading image. */
        --spinner: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='${theme.accent.replace('#', '%23')}'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 50 50' to='360 50 50' dur='1.6s' repeatCount='indefinite'/%3E%3Ccircle cx='50' cy='50' r='11'/%3E%3Cpath d='M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z'/%3E%3Cpath d='M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z' transform='rotate(120 50 50)'/%3E%3Cpath d='M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z' transform='rotate(240 50 50)'/%3E%3C/g%3E%3C/svg%3E");
        /* Same trefoil as radMark(), as a mask so plain CSS can stamp it anywhere */
        --trefoil: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='black'%3E%3Ccircle cx='50' cy='50' r='11'/%3E%3Cpath d='M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z'/%3E%3Cpath d='M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z' transform='rotate(120 50 50)'/%3E%3Cpath d='M41 34.4 L27 10.2 A46 46 0 0 1 73 10.2 L59 34.4 A18 18 0 0 0 41 34.4 Z' transform='rotate(240 50 50)'/%3E%3C/g%3E%3C/svg%3E");
        position: relative; isolation: isolate; min-height: 100vh; background: var(--bg); color: var(--text);
        font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        zoom: 1.1; /* Max prefers the 110%-browser-zoom sizing */
      }
      /* CG's original 6x6 diagonal-stripe tile (/pic/bg.png), re-tinted per scheme */
      #cg-redux-root::before {
        content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
        background: url('/pic/bg.png'); filter: ${theme.tile};
      }
      #cg-redux-root a { color: var(--accent-2); text-decoration: none; }
      #cg-redux-root a:hover { color: var(--accent); }
      #cg-redux-root ::selection { background: var(--accent); color: var(--on-accent); }
      /* Accent trefoil bullet on panel + sidebar headings (collapsible summaries
         keep their ▸/▾ caret instead — it signals open/closed state) */
      .cgx-panel > h3::before, .cgx-panel-head > h3::before, .cgx-side-section h3::before {
        content: ''; display: inline-block; width: 10px; height: 10px;
        margin-right: 7px; background: var(--accent);
        -webkit-mask: var(--trefoil) center / contain no-repeat;
        mask: var(--trefoil) center / contain no-repeat;
      }

      .cgx-topbar {
        display: flex; align-items: center; gap: 28px; padding: 14px 28px;
        background: var(--panel); border-bottom: 1px solid var(--line-hard); position: sticky; top: 0; z-index: 10;
      }
      .cgx-brand { display: flex; align-items: center; font-weight: 800; letter-spacing: 1px; font-size: 18px; color: var(--text) !important; }
      .cgx-brand span { color: var(--accent); }
      .cgx-rad { color: var(--accent); display: inline-flex; }
      .cgx-brand .cgx-rad { margin-right: 9px; }
      .cgx-rad svg { width: 21px; height: 21px; display: block; }
      .cgx-brand .cgx-rad svg { transition: transform 0.6s ease; }
      .cgx-brand:hover .cgx-rad svg { transform: rotate(120deg); }
      .cgx-nav-toggle { font-size: 16px; }

      .cgx-body { display: flex; align-items: flex-start; }
      .cgx-sidebar {
        width: 232px; flex: none; box-sizing: border-box;
        /* 100vh is inflated by the root's zoom: 1.1, so divide it back out —
           otherwise the sidebar's bottom (and its scrollbar end) sits below the
           viewport and the page has to be scrolled to reach it.
           --topbar-h is measured live: a hardcoded 63px overshoots whenever the
           topbar wraps to two rows (narrow window, long username, big stats),
           which pushed the sidebar's last section — Search — off screen with no
           way to scroll to it. */
        position: sticky; top: var(--topbar-h); max-height: calc(100vh / 1.1 - var(--topbar-h)); overflow-y: auto;
        padding: 20px 16px 30px; border-right: 1px solid var(--line-soft);
        transition: margin-left 0.22s ease, opacity 0.22s ease;
        scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent;
      }
      #cg-redux-root.nav-closed .cgx-sidebar { margin-left: -232px; opacity: 0; pointer-events: none; }
      .cgx-side-section { display: flex; flex-direction: column; gap: 1px; }
      .cgx-side-section + .cgx-side-section { border-top: 1px solid var(--accent); margin-top: 14px; padding-top: 14px; }
      .cgx-side-section h3 {
        font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;
        color: var(--muted); margin: 0 0 5px 10px; font-weight: 700;
      }
      .cgx-side-link { display: block; padding: 3px 10px; border-radius: 6px; color: var(--muted) !important; font-size: 13.5px; }
      .cgx-side-link:hover { color: var(--text) !important; background: var(--panel); }
      .cgx-side-link.active { color: var(--accent) !important; background: var(--panel); font-weight: 600; }
      .cgx-side-search, .cgx-side-select {
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text); padding: 7px 10px; font-size: 13px; margin-bottom: 6px; outline: none;
      }
      .cgx-side-search:focus { border-color: var(--accent); }
      .cgx-user { margin-left: auto; display: flex; align-items: center; gap: 7px; min-width: 0; }
      .cgx-stat {
        display: inline-flex; align-items: center; gap: 5px;
        background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px;
        padding: 3px 10px; font-size: 12px; color: var(--muted) !important; white-space: nowrap;
      }
      a.cgx-stat:hover { border-color: var(--accent); }
      .cgx-stat .lbl { font-size: 11px; }
      .cgx-stat .val { color: var(--text); font-weight: 600; }
      .cgx-stat.good .val { color: var(--green); }
      .cgx-stat.bad .val { color: var(--red); }
      .cgx-stat .up { color: var(--green); font-size: 11px; }
      .cgx-stat .down { color: var(--red); font-size: 11px; }
      .cgx-user-name { color: var(--text); font-weight: 700; }
      .cgx-user-class { color: var(--muted); font-size: 11px; }
      .cgx-pm-badge { background: var(--accent); color: var(--on-accent); border-radius: 999px; padding: 0 7px; font-size: 10.5px; font-weight: 700; }
      .cgx-logout { font-size: 12.5px; }
      .cgx-mail { display: inline-flex; color: var(--muted); }
      .cgx-mail svg { width: 15px; height: 15px; display: block; }
      .cgx-mail.unread { color: var(--accent); }
      a.cgx-pm:hover .cgx-mail { color: var(--accent); }

      .cgx-theme-menu { position: relative; flex: none; }
      .cgx-theme-menu summary { list-style: none; cursor: pointer; }
      .cgx-theme-menu summary::-webkit-details-marker { display: none; }
      /* .cgx-stat pill dimensions; the glyph's line box is pinned to the
         pills' 12px-text line height (18px) so the row stays uniform */
      .cgx-theme-menu summary { font-size: 14px; line-height: 18px; }
      .cgx-theme-menu[open] summary, .cgx-theme-menu summary:hover { color: var(--text) !important; border-color: var(--accent); }
      .cgx-theme-list {
        position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; min-width: 172px;
        display: flex; flex-direction: column; gap: 2px;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 10px;
        padding: 6px; box-shadow: var(--shadow-lg);
      }
      .cgx-theme-opt {
        display: flex; align-items: center; gap: 9px; width: 100%; text-align: left;
        background: none; border: 0; border-radius: 7px; color: var(--text);
        padding: 6px 9px; font: inherit; font-size: 13px; cursor: pointer;
      }
      .cgx-theme-opt:hover { background: var(--hover); }
      .cgx-theme-opt.on { color: var(--accent); font-weight: 600; }
      .cgx-theme-opt .sw { width: 14px; height: 14px; border-radius: 50%; border: 2px solid; flex: none; }

      /* flex:1 + min-width:0 keeps the column at full available width regardless
         of content, so opening/closing wide sections can't reflow the layout;
         anything wider scrolls inside its own wrapper instead. */
      .cgx-main { flex: 1; min-width: 0; max-width: 1100px; margin: 0 auto; padding: 24px 20px 80px; }

      .cgx-toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
      .cgx-search {
        flex: 1; background: var(--panel); border: 1px solid var(--line-strong); border-radius: var(--radius);
        color: var(--text); padding: 10px 14px; font-size: 15px; outline: none;
      }
      .cgx-search:focus { border-color: var(--accent); }

      .cgx-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text) !important; padding: 8px 14px; font-size: 14px; cursor: pointer;
      }
      .cgx-btn:hover { border-color: var(--accent); }
      .cgx-btn.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent) !important; font-weight: 600; }
      .cgx-btn.primary:hover { background: var(--accent-2); }
      .cgx-btn.ghost { background: transparent; }

      .cgx-searchwrap { position: relative; flex: 1; min-width: 0; }
      .cgx-searchwrap .cgx-search { width: 100%; box-sizing: border-box; }
      .cgx-searchwrap .cgx-search.has-count { padding-right: 92px; }
      .cgx-filter-count {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 2;
        background: var(--accent); border: 0; border-radius: 999px; color: var(--on-accent);
        font-size: 11px; font-weight: 600; padding: 3px 10px; cursor: pointer; white-space: nowrap;
      }
      .cgx-search-panel {
        display: none; position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 40;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 12px;
        box-shadow: var(--shadow-lg);
        padding: 6px 16px 12px; max-height: 65vh; overflow-y: auto;
      }
      .cgx-searchwrap.open .cgx-search-panel { display: block; }
      .cgx-searchwrap.open .cgx-search { border-color: var(--accent); }
      .cgx-search-panel .cgx-chip-row { padding: 12px 0; border-top: 1px solid var(--hair); }
      .cgx-search-panel .cgx-chip-row:first-child { border-top: 0; }
      .cgx-sp-title { display: flex; justify-content: space-between; align-items: center; }
      .cgx-sp-clear { background: none; border: 0; color: var(--muted); font-size: 11px; cursor: pointer; padding: 0; }
      .cgx-sp-clear:hover { color: var(--red); }
      .cgx-sp-recent {
        display: flex; align-items: center; gap: 9px; width: 100%; text-align: left;
        background: none; border: 0; border-radius: 8px; color: var(--text);
        padding: 6px 8px; font-size: 13.5px; cursor: pointer;
      }
      .cgx-sp-recent:hover { background: var(--panel-2); }
      .cgx-sp-recent .ic { color: var(--muted); }
      .cgx-sp-foot {
        display: flex; gap: 16px; padding-top: 10px; border-top: 1px solid var(--hair);
        color: var(--muted); font-size: 11.5px;
      }
      .cgx-kbd {
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 4px;
        padding: 0 5px; font-size: 10.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }

      .cgx-chips { display: flex; flex-direction: column; gap: 16px; margin-bottom: 22px; }
      .cgx-chip-row { display: flex; flex-direction: column; gap: 7px; }
      .cgx-chip-set { display: flex; flex-wrap: wrap; gap: 6px; }
      .cgx-chip-label {
        font-size: 11px; font-weight: 600; color: var(--muted);
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .cgx-toolbar .cgx-chip {
        flex: 0 0 auto; align-self: center; white-space: nowrap;
        font-size: 11.5px; padding: 4px 10px;
      }
      .cgx-sortbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; margin: 28px 0 12px; }
      .cgx-sortbar .cgx-chip-label { margin-right: 4px; }
      #cg-redux-root a.cgx-chip { color: var(--muted); }
      #cg-redux-root a.cgx-chip:hover { color: var(--text); border-color: var(--muted); }
      #cg-redux-root a.cgx-chip.on,
      #cg-redux-root a.cgx-chip.on:hover { color: var(--on-accent); border-color: var(--accent); }
      .cgx-cat-link { display: block; border-radius: 6px; }
      .cgx-cat-link:hover .cgx-cat { filter: brightness(1.25); }
      .cgx-chip {
        background: var(--panel); border: 1px solid var(--line-strong); color: var(--muted);
        border-radius: 999px; padding: 4px 12px; font-size: 12.5px; cursor: pointer;
      }
      .cgx-chip:hover { color: var(--text); border-color: var(--muted); }
      .cgx-chip.on { background: var(--accent); border-color: var(--accent); color: var(--on-accent); font-weight: 600; }

      .cgx-hero { background: var(--panel); border: 1px solid var(--line-soft); border-radius: 12px; padding: 18px; margin-bottom: 22px; box-shadow: var(--shadow); }
      .cgx-hero.has-backdrop { background-size: cover; background-position: center 25%; border-color: var(--line); }
      .cgx-hero.has-backdrop .cgx-hero-synopsis { opacity: 1; }
      .cgx-hero-inner { display: flex; gap: 20px; }
      .cgx-hero-poster { width: 150px; border-radius: 8px; flex: none; align-self: flex-start; cursor: zoom-in; }
      .cgx-posterbox {
        position: relative; width: 150px; min-height: 225px; flex: none; align-self: flex-start;
        background: var(--panel-2); border-radius: 8px;
      }
      .cgx-posterbox .cgx-hero-poster { display: block; width: 100%; opacity: 0; transition: opacity 0.25s ease; }
      .cgx-posterbox > .cgx-rad { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
      .cgx-posterbox > .cgx-rad.spin svg { width: 34px; height: 34px; }
      .cgx-posterbox.loaded { min-height: 0; background: none; }
      .cgx-posterbox.loaded .cgx-hero-poster { opacity: 1; }
      .cgx-posterbox.loaded > .cgx-rad { display: none; }
      .cgx-modal {
        position: fixed; inset: 0; z-index: 100; background: var(--backdrop);
        display: flex; align-items: center; justify-content: center; cursor: zoom-out;
        backdrop-filter: blur(2px);
      }
      .cgx-modal-img { max-height: 84vh; max-width: 88vw; border-radius: 10px; box-shadow: var(--shadow-lg); }
      .cgx-modal .cgx-modal-img { opacity: 0; transition: opacity 0.18s ease; }
      .cgx-modal.loaded .cgx-modal-img { opacity: 1; }
      .cgx-modal > .cgx-rad { position: absolute; color: var(--accent); }
      /* .spin in the selector: the generic 16px .cgx-rad.spin rule sits later
         in this sheet and ties a plain .cgx-modal > .cgx-rad svg on
         specificity — same reason .cgx-posterbox spells it out */
      .cgx-modal > .cgx-rad.spin svg { width: 34px; height: 34px; }
      .cgx-modal.loaded > .cgx-rad { display: none; }
      .cgx-hero-body { min-width: 0; flex: 1; }
      .cgx-hero-title { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .cgx-hero-title h2 { margin: 0; font-size: 22px; }
      .cgx-hero-year { color: var(--muted); font-size: 15px; }
      /* Letterboxd-green so it can't be mistaken for the orange bookmark/bonus pills */
      .cgx-hero-rating { color: #00e054; font-weight: 700; font-size: 13px; }
      .cgx-hero-line { margin-top: 6px; font-size: 13.5px; }
      .cgx-hero-line .lbl { color: var(--muted); }
      .cgx-hero-line.muted { color: var(--muted); font-size: 12.5px; }
      .cgx-hero-synopsis { color: var(--text); opacity: 0.9; font-size: 13.5px; margin: 10px 0 0; max-width: 75ch; }
      .cgx-hero-links { margin-top: 12px; display: flex; gap: 8px; }
      .cgx-hero-loading { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
      .cgx-rad.spin svg { width: 16px; height: 16px; animation: cgx-spin 1.6s linear infinite; }
      @keyframes cgx-spin { to { transform: rotate(360deg); } }
      /* In-flight images (armImageSpinners). min-height gives the mark somewhere
         to sit before the image reports its own dimensions; both are dropped the
         moment the class comes off, so nothing is left reserving space. */
      img.cgx-imgloading {
        min-width: 32px; min-height: 32px;
        background: var(--panel-2) var(--spinner) center / 26px no-repeat;
        border-radius: 6px;
      }

      .cgx-profile-grid { display: grid; grid-template-columns: max-content 1fr; gap: 4px 18px; margin: 12px 0 0; font-size: 13.5px; }
      .cgx-profile-grid dt { color: var(--muted); }
      .cgx-profile-grid dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
      .cgx-inline-img { max-height: 16px; vertical-align: middle; }

      .cgx-panel { background: var(--panel); border: 1px solid var(--line-soft); border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; box-shadow: var(--shadow); }
      .cgx-panel h3 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); }
      .cgx-detail-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .cgx-hero .cgx-detail-title-wrap {
        border-bottom: 1px solid var(--hair);
        padding-bottom: 12px; margin-bottom: 12px;
      }
      .cgx-detail-title-wrap { min-width: 0; }
      .cgx-detail-file { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: var(--text); opacity: 0.85; margin-top: 5px; word-break: break-all; }
      .cgx-detail-added { color: var(--muted); font-size: 12px; margin-top: 2px; }
      .cgx-detail-tagline { color: var(--muted); font-size: 13px; font-style: italic; margin-top: 4px; }
      .cgx-ihave { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .cgx-ihave-note { color: var(--muted); font-size: 12px; }
      .cgx-ihave input[type="checkbox"] { accent-color: var(--accent); width: 15px; height: 15px; }
      .cgx-ihave .cgx-btn { padding: 2px 12px; font-size: 12px; }
      .cgx-name-link { color: var(--text) !important; border-bottom: 1px dotted var(--line-strong); }
      .cgx-name-link:hover { color: var(--accent) !important; border-bottom-color: var(--accent); }
      .cgx-badge.dupes { cursor: pointer; }
      .cgx-dupes-panel h3 { margin-top: 0; }
      .cgx-empty { color: var(--muted); font-size: 13px; }

      /* landing page */
      .cgx-index-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
      @media (max-width: 900px) { .cgx-index-grid { grid-template-columns: 1fr; } }
      .cgx-index-side { display: flex; flex-direction: column; gap: 14px; }
      .cgx-index-side .cgx-panel { margin-bottom: 0; }
      .cgx-news { position: relative; padding-left: 30px; }
      .cgx-news::before { content: ''; position: absolute; left: 9px; top: 8px; bottom: 8px; width: 2px; background: var(--line); }
      .cgx-news-item { position: relative; margin-bottom: 26px; }
      .cgx-news-item:last-child { margin-bottom: 4px; }
      .cgx-news-marker { position: absolute; left: -30px; top: 1px; background: var(--panel); padding: 3px 0; }
      .cgx-news-marker svg { width: 17px; height: 17px; }
      .cgx-news-head h4 { display: inline; margin: 0; font-size: 16px; }
      .cgx-news-meta { color: var(--muted); font-size: 12px; margin-left: 8px; }
      .cgx-news-body { margin-top: 6px; font-size: 14px; }
      .cgx-poll-q { font-weight: 600; margin: 0 0 12px; }
      .cgx-poll-opt { margin-bottom: 10px; }
      .cgx-poll-labels { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; margin-bottom: 3px; }
      .cgx-poll-labels .pct { color: var(--muted); flex: none; }
      .cgx-poll-track { height: 8px; background: var(--hover); border-radius: 999px; overflow: hidden; }
      .cgx-poll-bar { height: 100%; width: 0; border-radius: 999px; background: linear-gradient(to right, var(--accent), var(--accent-2)); transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
      .cgx-poll-foot { display: flex; justify-content: space-between; align-items: baseline; color: var(--muted); font-size: 12px; margin-top: 12px; }
      .cgx-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .cgx-stat-tile { background: var(--panel-2); border-radius: 8px; padding: 10px 12px; min-width: 0; }
      .cgx-stats-grid .cgx-stat-tile:first-child { grid-column: span 2; }

      /* wide tile grids (details torrent info, credits) — same tile, fluid columns */
      .cgx-info-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
      .cgx-info-tiles .cgx-stat-tile.full { grid-column: 1 / -1; }
      .cgx-info-tiles .num { font-size: 15px; }
      .cgx-stat-tile .num.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; font-weight: 500; word-break: break-all; }
      .cgx-stat-tile .cgx-ihave { margin-bottom: 4px; }
      .cgx-tile-toggle { cursor: pointer; }
      .cgx-tile-toggle:hover { background: var(--hover); }
      .cgx-tile-caret { color: var(--accent); }
      .cgx-tile-toggle.open .cgx-tile-caret { display: inline-block; transform: rotate(90deg); }
      .cgx-tile-expand { margin-top: 10px; cursor: auto; }
      .cgx-tbl-title.snatched { color: var(--green) !important; }
      .cgx-peer-counts { font-weight: 600; font-size: 13px; margin-bottom: 8px; }
      .cgx-tbl .cgx-btn { padding: 2px 10px; font-size: 12px; white-space: nowrap; }
      .cgx-stat-tile.big .num { font-size: 26px; }
      .cgx-credit-hero { margin-bottom: 10px; }
      .cgx-credit-tile .val { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 5px; }
      .cgx-credit-tile .val .cgx-btn { padding: 3px 14px; font-size: 12.5px; }
      .cgx-credit-tile .val .cgx-embed { padding: 0; }
      .cgx-credit-note { color: var(--muted); font-size: 12px; }
      .cgx-stat-tile .num { font-size: 17px; font-weight: 700; color: var(--accent-2); overflow-wrap: break-word; }
      .cgx-stat-tile .lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }
      .cgx-feat-mini { display: flex; flex-direction: column; gap: 8px; }
      .cgx-feat-link { display: flex; align-items: center; gap: 10px; font-size: 13.5px; min-width: 0; }
      .cgx-feat-link img { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; flex: none; }
      .cgx-disclaimer { color: var(--muted); font-size: 12px; margin-top: 22px; text-align: center; opacity: 0.75; }
      .cgx-detail-head h2 { margin: 0; font-size: 20px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
      .cgx-section-body { padding: 0 16px 14px; overflow-x: auto; }
      .cgx-embed { color: var(--text); font-size: 13.5px; overflow-x: auto; }
      .cgx-embed img { max-width: 100%; height: auto; border-radius: 8px; }
      .cgx-embed img.cgx-zoomable { cursor: zoom-in; }
      .cgx-embed a { color: var(--accent-2); }
      .cgx-embed table, .cgx-embed td, .cgx-embed th { background: transparent !important; border-color: var(--line) !important; color: var(--text); }
      .cgx-embed td { padding: 3px 8px; }

      .cgx-comment { background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px; margin-bottom: 12px; overflow: hidden; box-shadow: var(--shadow); }
      .cgx-comment-head {
        display: flex; align-items: center; gap: 10px; padding: 9px 14px;
        background: var(--sink); border-bottom: 1px solid var(--hair);
      }
      .cgx-comment-avatar {
        width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex: none;
        box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.35);
      }
      .cgx-comment-avatar.fallback { background: var(--panel); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; }
      .cgx-comment-user { font-weight: 700; color: var(--text) !important; }
      .cgx-comment-user:hover { color: var(--accent-2) !important; }
      .cgx-comment-class {
        display: inline-block; background: rgba(var(--accent-rgb), 0.12); color: var(--accent-2);
        border-radius: 999px; padding: 1px 8px; font-size: 11px; margin-left: 8px;
      }
      .cgx-comment-date { margin-left: auto; color: var(--muted); font-size: 12px; white-space: nowrap; }
      .cgx-comment-body { padding: 12px 14px 13px; font-size: 13.5px; }

      .cgx-user-section { margin-bottom: 14px; background: var(--panel); border: 1px solid var(--line-soft); border-radius: 10px; }
      .cgx-user-section > summary { cursor: pointer; padding: 12px 16px; font-weight: 600; list-style: none; }
      .cgx-user-section > summary::-webkit-details-marker { display: none; }
      .cgx-user-section > summary::before { content: '▸ '; color: var(--accent); }
      .cgx-user-section[open] > summary::before { content: '▾ '; }
      .cgx-tbl-wrap { overflow-x: auto; padding: 0 12px 12px; }
      .cgx-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
      .cgx-tbl th { text-align: left; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 10px; border-bottom: 1px solid rgba(var(--accent-rgb), 0.3); }
      .cgx-tbl td { padding: 7px 10px; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
      .cgx-tbl tr:hover td { background: var(--panel-2); }
      .cgx-tbl-title { font-weight: 600; }
      .cgx-tbl-sub { color: var(--muted); font-size: 12px; }
      .cgx-tbl-icon { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; }

      /* small pages */
      .cgx-empty { text-align: center; padding: 48px 24px; }
      .cgx-empty .cgx-rad svg { width: 44px; height: 44px; }
      .cgx-empty h2 { margin: 14px 0 6px; font-size: 20px; }
      .cgx-empty p { color: var(--muted); margin: 0; }
      .cgx-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .cgx-hint { color: var(--muted); font-size: 13px; margin: 4px 0 14px; }

      .cgx-trailer-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
      .cgx-trailer-title { font-size: 19px; font-weight: 700; margin-right: 10px; }
      .cgx-trailer-actions { display: flex; gap: 8px; }
      .cgx-trailer-box { position: relative; aspect-ratio: 16 / 9; background: #000; border-radius: 8px; overflow: hidden; }
      .cgx-trailer-box iframe, .cgx-trailer-box embed, .cgx-trailer-box object {
        position: absolute; inset: 0; width: 100%; height: 100%; border: 0;
      }
      .cgx-trailer-count { color: var(--muted); font-size: 12.5px; margin: 10px 0 0; text-align: right; }

      .cgx-vote { display: flex; gap: 6px; justify-content: flex-end; }
      .cgx-vote-input {
        width: 92px; background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text); padding: 6px 9px; font-size: 13px; outline: none;
      }
      .cgx-vote-input:focus { border-color: var(--accent); }

      .cgx-bars {
        max-height: 420px; overflow-y: auto; padding-right: 6px;
        scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent;
      }
      .cgx-bar-row {
        display: grid; grid-template-columns: 70px 1fr 60px; gap: 10px; align-items: center;
        margin-bottom: 5px; font-size: 12.5px;
      }
      /* No overflow:hidden clip here — under zoom 1.1 the track and bar round
         to different device pixels and the clip shaves the bar in half */
      .cgx-bar-row .track { height: 8px; background: var(--panel-2); border-radius: 999px; }
      .cgx-bar-row .bar { height: 8px; background: var(--accent); border-radius: 999px; }
      .cgx-bar-row .n { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }

      .cgx-rank-hero { display: flex; align-items: center; gap: 18px; margin: 4px 0 12px; }
      .cgx-rank-hero img { max-height: 64px; }
      .cgx-rank-hero-info { flex: 1; min-width: 0; }
      .cgx-rank-name { font-size: 22px; font-weight: 800; }
      .cgx-rank-points { color: var(--muted); font-size: 13px; }
      .cgx-rank-track { height: 8px; background: var(--panel-2); border-radius: 999px; overflow: hidden; margin-top: 10px; max-width: 420px; }
      .cgx-rank-bar { height: 100%; background: var(--accent); border-radius: 999px; }
      .cgx-rank-row { display: flex; align-items: center; gap: 12px; padding: 7px 12px; border: 1px solid transparent; border-radius: 8px; }
      .cgx-rank-row img { width: 30px; height: 30px; object-fit: contain; }
      .cgx-rank-mystery { width: 30px; text-align: center; color: var(--muted); font-weight: 700; }
      .cgx-rank-row .range { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; font-size: 13px; }
      .cgx-rank-row.on { border-color: var(--accent); background: rgba(var(--accent-rgb), 0.07); }

      .cgx-irc-actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
      .cgx-irc-box { display: none; margin-top: 16px; }
      .cgx-irc-box.open { display: block; }
      .cgx-irc-frame { width: 100%; height: 560px; border: 0; border-radius: 8px; background: #000; }
      .cgx-btn[disabled] { opacity: 0.6; cursor: default; pointer-events: none; }

      /* nav-page sweep */
      .cgx-page-title { margin: 0 0 16px; font-size: 20px; }
      .cgx-page-title::after {
        content: ''; display: block; width: 34px; height: 3px; border-radius: 2px;
        background: var(--accent); margin-top: 7px;
      }
      .cgx-article-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
      .cgx-article-top .cgx-page-title { margin: 0; }
      .cgx-article .cgx-embed { line-height: 1.65; }
      .cgx-article .cgx-embed p { margin: 0 0 12px; }
      .cgx-article .cgx-embed table { border-collapse: collapse; margin: 12px 0; }
      .cgx-article .cgx-embed table td { border: 1px solid var(--line); padding: 5px 12px; background: none; }
      .cgx-staff-head { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 0 4px; }
      .cgx-staff-head h2 { margin: 0; font-size: 20px; }
      .cgx-staff-head .cgx-rad svg { width: 26px; height: 26px; }
      .cgx-staff-tier { text-align: center; padding: 18px 0 14px; border-top: 1px solid var(--hair); }
      .cgx-staff-tier:nth-child(2) { border-top: 0; }
      .cgx-staff-tier .tier-label {
        font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em;
        color: var(--muted); margin-bottom: 10px;
      }
      .cgx-staff-name {
        display: inline-flex; align-items: center; padding: 7px 16px; margin: 3px;
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 999px;
        font-weight: 700; font-size: 14px;
      }
      .cgx-staff-name:hover { border-color: var(--accent); }
      .cgx-staff-tier.top .cgx-staff-name { font-size: 17px; padding: 10px 24px; border-color: rgba(var(--accent-rgb), 0.4); }
      /* user page hero: stacked avatar → name → full-width tile grid */
      .cgx-user-hero .cgx-hero-poster { display: block; }
      .cgx-user-hero .cgx-hero-title { margin: 12px 0 4px; }
      .cgx-user-hero .cgx-user-tiles { margin-top: 10px; }
      /* Info tile holds BBCode prose, not a stat — body text, left aligned */
      .cgx-stat-tile .num.cgx-user-info { font-size: 13.5px; font-weight: 400; color: var(--text); text-align: left; line-height: 1.55; }
      .cgx-user-info .cgx-embed td { padding: 0; }
      .cgx-spoiler-btn { margin: 4px 0; }
      .cgx-spoiler-btn + div { margin-top: 6px; }
      .cgx-user-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .cgx-user-flag { height: 17px; border-radius: 2px; align-self: center; }
      .cgx-cigar-clamp {
        overflow: hidden; white-space: nowrap;
        /* fade the row's tail instead of hard-cropping the last gift icon in half */
        -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent);
        mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent);
      }
      .cgx-cigar-clamp.open { white-space: normal; -webkit-mask-image: none; mask-image: none; }
      .cgx-cigar-toggle {
        background: none; border: 1px solid var(--line-strong); border-radius: 6px; color: var(--muted);
        cursor: pointer; font-size: 10px; line-height: 1; padding: 2px 7px; margin-left: 8px; vertical-align: 1px;
      }
      .cgx-cigar-toggle:hover { color: var(--text); border-color: var(--accent); }
      .cgx-friend-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 10px; }
      .cgx-friend-row {
        display: flex; align-items: center; gap: 12px; padding: 10px 12px;
        border-radius: var(--radius); background: var(--panel-2); border: 1px solid var(--line);
        min-width: 0;
      }
      .cgx-friend-row:hover { border-color: var(--accent); }
      .cgx-friend-info { min-width: 0; }
      .cgx-friend-info .meta { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cgx-friend-row .meta { color: var(--muted); font-size: 12.5px; }
      .cgx-friend-row .spacer { flex: 1; }
      .cgx-friend-ava {
        width: 44px; height: 44px; border-radius: 50%; overflow: hidden; flex: none;
        background: var(--panel-2); border: 1px solid var(--line);
      }
      .cgx-friend-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .cgx-friend-name { display: flex; align-items: center; gap: 6px; font-weight: 600; }
      .cgx-friend-name img { max-height: 14px; width: auto; }
      .cgx-friend-link:hover { text-decoration: underline; }
      /* username + donor/disabled badge run (built by userLink) */
      .cgx-uname { white-space: nowrap; }
      .cgx-uname img { max-height: 13px; width: auto; vertical-align: -1px; margin-left: 3px; }
      /* Forum post sidebar: the block-level name link would push the badge
         onto its own line — flow it inline, and let long names wrap */
      .cgx-uname .cgx-post-user { display: inline; }
      .cgx-post-side .cgx-uname { display: block; white-space: normal; overflow-wrap: anywhere; }
      .cgx-repform table { border-collapse: collapse; max-width: 100%; }
      .cgx-repform td {
        background: none !important; border: 0 !important; padding: 8px 9px;
        font-size: 13.5px; color: var(--text);
      }
      .cgx-repform td.rowhead, .cgx-repform td:first-child { color: var(--muted); }
      .cgx-repform table, .cgx-repform tr { background: none !important; }
      .cgx-repform input:not([type]), .cgx-repform input[type="text"], .cgx-repform input[type="password"], .cgx-repform input[type="email"],
      .cgx-repform select, .cgx-repform textarea, .cgx-repform input[type="file"] {
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text); padding: 8px 10px; font-size: 13.5px; outline: none; max-width: 100%;
      }
      .cgx-repform textarea { width: 100%; min-height: 110px; box-sizing: border-box; }
      .cgx-repform input:focus, .cgx-repform select:focus, .cgx-repform textarea:focus { border-color: var(--accent); }
      .cgx-repform input[type="submit"] {
        background: var(--accent); border: 0; border-radius: 8px; color: var(--on-accent);
        font-weight: 700; font-size: 14px; padding: 9px 22px; cursor: pointer;
      }
      .cgx-repform input[type="submit"]:hover { background: var(--accent-2); }
      .cgx-repform input[type="button"], .cgx-repform button {
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text); padding: 7px 14px; font-size: 13px; cursor: pointer;
      }
      .cgx-repform input[type="checkbox"], .cgx-repform input[type="radio"] { accent-color: var(--accent); }

      /* upload page */
      .cgx-upform .cgx-up-legacy { display: none; }
      .cgx-upgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
      .cgx-upgrid.cols3 { grid-template-columns: 1fr 1fr 1fr; }
      .cgx-upfield { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
      .cgx-upfield.full { grid-column: 1 / -1; }
      .cgx-upfield > label:not(.cgx-upcheck) {
        font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px;
        color: var(--muted); font-weight: 700;
      }
      .cgx-upfield input[type="text"], .cgx-upfield select { width: 100%; box-sizing: border-box; }
      .cgx-uprow { display: flex; gap: 16px; }
      .cgx-uprow .cgx-upfield:first-child { flex: 0 0 110px; }
      .cgx-uprow .cgx-upfield:last-child { flex: 1; }
      .cgx-upnote { color: var(--muted); font-size: 12.5px; line-height: 1.45; }
      .cgx-upcallout {
        border-left: 3px solid var(--accent); background: rgba(var(--accent-rgb), 0.07);
        padding: 9px 13px; border-radius: 0 8px 8px 0; font-size: 13px; margin-bottom: 12px;
      }
      .cgx-upcallout table, .cgx-upcallout td, .cgx-upcallout big {
        border: 0 !important; background: none !important; padding: 0 !important;
      }
      .cgx-upcallout big { font-size: inherit; }
      .cgx-upcheck { display: flex; align-items: center; gap: 9px; font-size: 13.5px; cursor: pointer; }
      .cgx-dropzone {
        display: flex; align-items: center; gap: 12px; padding: 20px 22px; cursor: pointer;
        border: 2px dashed var(--line-strong); border-radius: var(--radius); transition: border-color 0.15s ease;
      }
      .cgx-dropzone:hover, .cgx-dropzone.drag { border-color: var(--accent); }
      .cgx-dropzone.has-file { border-style: solid; border-color: var(--green); }
      .cgx-dropzone input[type="file"] { display: none; }
      .cgx-drop-text { font-size: 14px; color: var(--muted); }
      .cgx-drop-text strong { color: var(--text); }
      .cgx-drop-name { margin-left: auto; color: var(--muted); font-size: 13px; }
      .cgx-dropzone.has-file .cgx-drop-name { color: var(--green); font-weight: 600; }
      .cgx-upform textarea { width: 100%; box-sizing: border-box; }
      .cgx-upform textarea[name="descr"] { min-height: 280px; }
      .cgx-upform textarea[name="mediainfo"] { min-height: 140px; }
      .cgx-upfoot { margin: 4px 0 24px; }
      .cgx-upfoot input[type="submit"] { padding: 11px 30px; font-size: 15px; }
      /* profile edit (shares the cgx-up* kit) */
      /* Radio groups keep their legacy inline flow — the option labels are
         loose text nodes, so flex would split radio from label */
      .cgx-myradios { font-size: 13.5px; line-height: 2; }
      .cgx-myradios input { margin-right: 4px; vertical-align: -2px; }
      .cgx-checkgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px 16px; }
      .cgx-checkgrid .cgx-upcheck { align-items: flex-start; }
      .cgx-checkgrid .cgx-upcheck input { margin-top: 3px; }
      .cgx-checkgrid .cgx-upcheck strong { flex: none; }
      .cgx-checkgrid .cgx-upcheck .cgx-upnote { flex: 1; min-width: 0; }
      .cgx-checkgrid.cats { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 5px 12px; }
      .cgx-upform textarea[name="signature"] { min-height: 110px; }
      .cgx-upform textarea[name="info"] { min-height: 200px; }

      /* forums */
      .cgx-forums-top { margin-bottom: 16px; }
      .cgx-forums-top .cgx-page-title { margin: 0; }
      .cgx-forums-actions { display: flex; gap: 8px; }
      .cgx-crumb a { color: var(--muted); }
      .cgx-crumb a:hover { color: var(--text); }
      .cgx-forum-row, .cgx-topic-row {
        display: flex; align-items: center; gap: 18px; padding: 12px 12px;
        border-top: 1px solid var(--hair);
      }
      .cgx-forum-row:first-child, .cgx-topic-row:first-child { border-top: 0; }
      .cgx-forum-row:hover, .cgx-topic-row:hover { background: var(--wash); }
      .cgx-forum-main, .cgx-topic-main { flex: 1; min-width: 0; }
      .cgx-forum-name { font-weight: 700; font-size: 15.5px; }
      .cgx-forum-desc { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
      .cgx-forum-counts, .cgx-topic-counts {
        display: flex; flex-direction: column; gap: 2px; flex: none; width: 90px;
        color: var(--muted); font-size: 12px; text-align: right;
      }
      .cgx-forum-counts b, .cgx-topic-counts b { color: var(--text); font-variant-numeric: tabular-nums; }
      .cgx-forum-last { flex: none; width: 220px; font-size: 12.5px; }
      .cgx-forum-last .sub, .cgx-forum-main .sub, .cgx-topic-main .sub { color: var(--muted); font-size: 12px; margin-top: 2px; }
      .cgx-topic-title { font-weight: 600; }
      .cgx-topic-row.sticky { background: rgba(var(--accent-rgb), 0.04); }
      .cgx-flag {
        display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
        background: var(--accent); color: var(--on-accent); border-radius: 4px; padding: 1px 6px; margin-right: 8px; vertical-align: 2px;
      }
      .cgx-flag.lock { background: var(--red); }
      .cgx-minipages { margin-left: 8px; }
      .cgx-page.mini { padding: 0 6px; font-size: 11px; margin-left: 2px; }
      .cgx-minipages { white-space: nowrap; }
      .cgx-minidots { color: var(--muted); margin: 0 4px; font-size: 11px; }
      .cgx-newmark { display: inline-flex; flex: none; }
      .cgx-newmark img { width: 22px; height: 22px; display: block; }
      a.cgx-newmark.on:hover img { filter: brightness(1.25); }
      .cgx-btn .cgx-rad { color: inherit; }
      .cgx-btn .cgx-rad svg { width: 13px; height: 13px; }
      .cgx-post { display: flex; gap: 0; background: var(--panel); border: 1px solid var(--line-soft); border-radius: 12px; margin-bottom: 14px; overflow: hidden; box-shadow: var(--shadow); }
      .cgx-post-side {
        flex: none; width: 158px; padding: 16px 14px; text-align: center;
        background: var(--panel-2); border-right: 1px solid var(--sink);
      }
      .cgx-post-avatar { max-width: 120px; border-radius: 8px; margin-bottom: 8px; }
      .cgx-post-user { display: block; font-weight: 700; font-size: 14.5px; overflow-wrap: anywhere; }
      .cgx-post-class { color: var(--muted); font-size: 11.5px; margin-top: 1px; }
      .cgx-post-stats { color: var(--muted); font-size: 11px; margin-top: 8px; line-height: 1.5; }
      .cgx-post-main { flex: 1; min-width: 0; padding: 12px 18px 16px; }
      .cgx-post-head { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 1px solid var(--hair); }
      .cgx-post-date { color: var(--muted); font-size: 12.5px; }
      .cgx-post-date .ago { opacity: 0.7; }
      .cgx-post-head .spacer { flex: 1; }
      .cgx-post-num { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
      .cgx-post-body { line-height: 1.6; overflow-x: auto; }
      .cgx-post-hidden {
        display: flex; align-items: center; gap: 10px; padding: 8px 14px; margin-bottom: 14px;
        background: var(--panel); border: 1px dashed var(--line-strong); border-radius: 12px;
        color: var(--muted); font-size: 12.5px;
      }
      .cgx-post-hidden .spacer { flex: 1; }
      .cgx-post-hidden .cgx-btn { color: var(--faint) !important; border-color: transparent; font-size: 12px; }
      .cgx-post-hidden .cgx-btn:hover { color: var(--muted) !important; border-color: var(--line-strong); }
      .cgx-hide-user { opacity: 0; transition: opacity 0.15s ease; }
      .cgx-post:hover .cgx-hide-user, .cgx-hide-user:focus-visible { opacity: 1; }
      .cgx-hidden-menu { position: relative; }
      .cgx-hidden-menu summary { list-style: none; cursor: pointer; }
      .cgx-hidden-menu summary::-webkit-details-marker { display: none; }
      .cgx-hidden-menu-list {
        position: absolute; right: 0; top: calc(100% + 6px); z-index: 20; min-width: 230px;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 10px; padding: 6px;
        box-shadow: var(--shadow-lg);
      }
      .cgx-hidden-menu-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 4px 4px 8px; }
      .cgx-hidden-menu.tile summary { display: block; }
      .cgx-hidden-menu.tile summary:hover { background: var(--hover); }
      /* the tile lives at the bottom of the page — open the list upward */
      .cgx-hidden-menu.tile .cgx-hidden-menu-list { top: auto; bottom: calc(100% + 6px); right: auto; left: 0; }
      /* BBCode quotes: <p.sub>X wrote:</p><div.quote>…</div>, nestable */
      .cgx-embed p.sub { margin: 12px 0 0; font-size: 12px; font-weight: 600; color: var(--muted); }
      #cg-redux-root .cgx-embed .quote {
        border: 0; border-left: 3px solid var(--accent); background: rgba(var(--accent-rgb), 0.05);
        border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 4px 0 14px;
      }
      #cg-redux-root .cgx-embed .quote .quote { border-left-color: var(--line-strong); background: var(--wash); }
      .cgx-embed .quote p.sub:first-child { margin-top: 0; }
      .cgx-reply textarea { width: 100%; min-height: 130px; }
      section.cgx-reply input[type="submit"] { display: block; margin-top: 10px; }
      .cgx-bbbar { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; margin: 2px 0 6px; }
      .cgx-bbbar .cgx-btn { min-width: 30px; padding: 3px 8px; color: var(--muted) !important; }
      .cgx-bbbar .cgx-btn:hover { color: var(--text) !important; border-color: var(--accent); }
      .cgx-bbbar-div { width: 1px; height: 16px; background: var(--line-strong); margin: 0 5px; }
      .cgx-bb-b { font-weight: 700; }
      .cgx-bb-i { font-style: italic; }
      .cgx-bb-u { text-decoration: underline; }
      .cgx-bb-s { text-decoration: line-through; }
      /* toolbar dropdowns (smilies, site codes) */
      .cgx-bbmenu { position: relative; display: inline-block; }
      .cgx-bbmenu summary { list-style: none; color: var(--muted) !important; }
      .cgx-bbmenu summary::-webkit-details-marker { display: none; }
      .cgx-bbmenu[open] summary, .cgx-bbmenu summary:hover { color: var(--text) !important; border-color: var(--accent); }
      .cgx-bbmenu-list {
        position: absolute; left: 0; top: calc(100% + 6px); z-index: 25;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 10px;
        padding: 8px; box-shadow: var(--shadow-lg); max-height: 320px; overflow-y: auto;
        scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent;
      }
      .cgx-bbmenu-list.smilies { display: grid; grid-template-columns: repeat(8, 30px); gap: 2px; }
      .cgx-bbmenu-list.codes { display: flex; flex-direction: column; gap: 1px; width: 340px; }
      .cgx-bbmenu-note { color: var(--muted); font-size: 12px; padding: 2px 4px; white-space: nowrap; }
      .cgx-smilie {
        display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;
        background: none; border: 0; border-radius: 6px; cursor: pointer; padding: 0;
      }
      .cgx-smilie:hover { background: var(--hover); }
      .cgx-smilie img { max-width: 22px; max-height: 22px; }
      .cgx-bbmenu-row {
        display: flex; flex-direction: column; align-items: flex-start; gap: 1px; text-align: left;
        background: none; border: 0; border-radius: 7px; padding: 5px 8px; cursor: pointer; font: inherit;
      }
      .cgx-bbmenu-row:hover { background: var(--hover); }
      .cgx-bbmenu-row code { color: var(--accent-2); font-size: 12px; }
      .cgx-bbmenu-row .desc { color: var(--muted); font-size: 11.5px; line-height: 1.4; }

      /* live BBCode preview under a post box */
      .cgx-preview {
        margin-top: 8px; background: var(--panel-2); border: 1px solid var(--line-soft); border-radius: 8px;
      }
      .cgx-preview > summary {
        cursor: pointer; list-style: none; padding: 7px 12px;
        font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--muted); font-weight: 700;
      }
      .cgx-preview > summary::-webkit-details-marker { display: none; }
      .cgx-preview > summary::before { content: '▸ '; color: var(--accent); }
      .cgx-preview[open] > summary::before { content: '▾ '; }
      .cgx-preview-body { padding: 2px 14px 12px; line-height: 1.6; min-height: 20px; }
      .cgx-preview-body img { max-width: 100%; height: auto; border-radius: 6px; }
      .cgx-preview-body ul { margin: 6px 0; padding-left: 22px; }
      .cgx-preview-body pre { background: var(--panel); border-radius: 6px; padding: 8px 10px; overflow-x: auto; }
      /* matches legacy's hover-to-reveal spoiler behaviour */
      .cgx-pv-spoiler { background: var(--faint); color: transparent; border-radius: 3px; }
      .cgx-pv-spoiler:hover { background: none; color: inherit; }

      /* smilies.php */
      .cgx-smilie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
      .cgx-smilie-card {
        display: flex; align-items: center; gap: 10px; padding: 7px 10px; min-width: 0;
        background: var(--panel-2); border: 1px solid transparent; border-radius: 8px;
        color: var(--text); font: inherit; cursor: pointer; text-align: left;
      }
      .cgx-smilie-card:hover { border-color: var(--accent); }
      .cgx-smilie-card.copied { border-color: var(--green); }
      .cgx-smilie-card.copied code::after { content: ' copied'; color: var(--green); }
      .cgx-smilie-card img { max-width: 24px; max-height: 24px; flex: none; }
      .cgx-smilie-card code { font-size: 12px; color: var(--accent-2); overflow: hidden; text-overflow: ellipsis; }

      /* COCKS page listings */
      .cgx-page-list { display: flex; flex-direction: column; }
      .cgx-page-row {
        display: flex; align-items: baseline; gap: 16px; padding: 9px 10px;
        border-top: 1px solid var(--hair); color: var(--text) !important; min-width: 0;
      }
      .cgx-page-row:first-child { border-top: 0; }
      .cgx-page-row:hover { background: var(--wash); }
      .cgx-page-row .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .cgx-page-row .name { font-weight: 600; color: var(--accent-2); }
      .cgx-page-row:hover .name { color: var(--accent); }
      .cgx-page-row .desc { color: var(--muted); font-size: 12.5px; line-height: 1.45; }
      .cgx-page-row .type, .cgx-page-row .curator, .cgx-page-row .edited {
        flex: none; color: var(--muted); font-size: 12px; white-space: nowrap;
      }
      .cgx-page-row .type { width: 92px; }
      .cgx-page-row .curator { width: 120px; overflow: hidden; text-overflow: ellipsis; }
      .cgx-page-row .edited { width: 84px; text-align: right; font-variant-numeric: tabular-nums; }
      @media (max-width: 720px) {
        .cgx-page-row { flex-wrap: wrap; }
        .cgx-page-row .type, .cgx-page-row .curator, .cgx-page-row .edited { width: auto; }
      }

      /* thread jump arrows */
      .cgx-jump {
        position: fixed; right: 18px; bottom: 22px; z-index: 35;
        display: none; flex-direction: column; gap: 6px;
      }
      .cgx-jump.on { display: flex; }
      .cgx-jump .cgx-btn { background: var(--panel); box-shadow: var(--shadow); opacity: 0.75; }
      .cgx-jump .cgx-btn:hover { opacity: 1; border-color: var(--accent); }

      .cgx-newposts-link { margin-left: 10px; font-size: 11.5px; color: var(--green) !important; font-weight: 600; }
      .cgx-newposts-link:hover { text-decoration: underline; }
      .cgx-lastposts { margin: 22px 0 12px; font-size: 15px; color: var(--muted); }
      .cgx-msg-row {
        display: flex; align-items: center; gap: 14px; padding: 10px 12px;
        border-top: 1px solid var(--hair);
      }
      .cgx-msg-row:first-child { border-top: 0; }
      .cgx-msg-row:hover { background: var(--wash); }
      .cgx-msg-row.unread .cgx-msg-subject { font-weight: 700; }
      .cgx-msg-status { width: 20px; flex: none; }
      .cgx-msg-main { flex: 1; min-width: 0; }
      .cgx-msg-main .sub { color: var(--muted); font-size: 12px; margin-top: 1px; }
      .cgx-msg-main .sub a, .cgx-msg-main .sub a * { display: inline !important; }
      .cgx-msg-date { flex: none; color: var(--muted); font-size: 12.5px; font-variant-numeric: tabular-nums; }
      .cgx-msg-check { accent-color: var(--accent); width: 15px; height: 15px; flex: none; }
      .cgx-tag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
      .cgx-tag-card { margin: 0; }
      .cgx-tag-card h3 { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--accent-2); }
      .cgx-tag-card .cgx-hint { margin: 4px 0 10px; }
      .cgx-tag-syntax {
        display: block; background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        padding: 8px 10px; font-size: 12px; overflow-x: auto; white-space: pre-wrap;
      }
      .cgx-tag-result { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--hair-strong); font-size: 13.5px; }
      .cgx-msg-meta {
        display: flex; gap: 18px; align-items: baseline; padding-bottom: 10px; margin-bottom: 12px;
        border-bottom: 1px solid var(--hair); font-size: 13px;
      }

      /* login */
      .cgx-login-page { display: flex; justify-content: center; padding: 40px 16px; }
      .cgx-login-wrap { display: flex; flex-direction: column; align-items: center; gap: 18px; width: 430px; max-width: 94vw; margin-top: 9vh; }
      .cgx-login-page .cgx-brand { font-size: 27px; }
      .cgx-login-page .cgx-brand .cgx-rad svg { width: 32px; height: 32px; }
      .cgx-login-alert {
        background: rgba(var(--accent-rgb), 0.1); border: 1px solid rgba(var(--accent-rgb), 0.45);
        border-radius: 8px; padding: 10px 16px; font-size: 13px; text-align: center;
      }
      .cgx-login-card { width: 100%; padding: 26px 28px; text-align: center; }
      .cgx-login-notice {
        background: rgba(var(--red-rgb), 0.12); border: 1px solid rgba(var(--red-rgb), 0.4);
        border-radius: 8px; padding: 10px 14px; font-size: 12.5px; line-height: 1.55; margin-bottom: 18px; text-align: left;
      }
      .cgx-login-form table { margin: 0 auto; border-collapse: collapse; }
      .cgx-login-form td { padding: 5px 7px; background: none !important; border: 0 !important; text-align: left; color: var(--muted); font-size: 13px; }
      .cgx-login-form input[type="text"], .cgx-login-form input[type="password"] {
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text); padding: 10px 13px; font-size: 15px; width: 240px; outline: none;
      }
      .cgx-login-form input[type="text"]:focus, .cgx-login-form input[type="password"]:focus { border-color: var(--accent); }
      .cgx-login-form input[type="submit"] {
        display: block; margin: 14px auto 0; background: var(--accent); border: 0; border-radius: 8px;
        color: var(--on-accent); font-weight: 700; font-size: 14px; padding: 10px 28px; cursor: pointer;
      }
      .cgx-login-form input[type="submit"]:hover { background: var(--accent-2); }
      .cgx-login-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 22px; margin-top: 18px; font-size: 13px; color: var(--muted); }
      .cgx-login-help { color: var(--muted); font-size: 12px; text-align: center; max-width: 400px; line-height: 1.6; margin: 0; }
      .cgx-login-wrap.wide { width: 620px; }
      .cgx-login-wrap.wide .cgx-login-help { max-width: 560px; }
      .cgx-welcome-card { width: 100%; padding: 26px 30px; }
      .cgx-welcome-card h2 { margin: 0 0 12px; }
      .cgx-welcome-card p { color: var(--muted); font-size: 14px; line-height: 1.65; margin: 0 0 12px; }
      .cgx-welcome-actions { display: flex; gap: 10px; margin-top: 18px; }

      .cgx-cocks-nav { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 16px; }
      .cgx-cocks-nav.quick { margin: 16px 0 0; }
      .cgx-cocks-home { text-align: center; }
      .cgx-cocks-banner { max-width: 100%; border-radius: 10px; margin-bottom: 14px; }
      .cgx-cocks-home .cgx-hint { max-width: 760px; margin: 8px auto 0; }
      .cgx-cocks-freshline { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin: 12px 0 4px; font-size: 13px; }
      .cgx-cocks-fresh { color: var(--muted); }
      .cgx-cocks-search {
        display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center;
        margin: 16px 0; text-align: left;
      }
      .cgx-cocks-search .cgx-search { flex: 1 1 260px; max-width: 420px; }
      .cgx-cocks-search label { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; }
      .cgx-select {
        background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 8px;
        color: var(--text); padding: 7px 9px; font-size: 13px; outline: none;
      }
      .cgx-select:focus { border-color: var(--accent); }
      .cgx-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
      .cgx-cat-card {
        display: block; background: var(--panel-2); border: 1px solid transparent; border-radius: 8px;
        padding: 12px 14px; color: var(--text) !important;
      }
      .cgx-cat-card:hover { border-color: var(--accent); }
      .cgx-cat-card .name { font-weight: 700; color: var(--accent-2); margin-bottom: 3px; }
      .cgx-cat-card .desc { font-size: 12.5px; color: var(--muted); line-height: 1.45; }
      .cgx-cocks-create { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .cgx-cat-card .meta { margin-top: 7px; font-size: 11.5px; color: var(--muted); }
      .cgx-cat-card .name .cgx-badge { margin-left: 7px; vertical-align: 1px; }
      .cgx-list-tools { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; margin-bottom: 14px; }
      .cgx-list-filter { max-width: 320px; }
      .cgx-list-tools .cgx-chip-set { align-items: center; }
      .cgx-cocks-title { margin: 0; font-size: 22px; }
      .cgx-cocks-by { color: var(--muted); font-size: 13px; margin-top: 2px; }
      .cgx-cocks-actions { display: flex; align-items: center; gap: 12px; }
      .cgx-subs { color: var(--muted); font-size: 12.5px; white-space: nowrap; }
      .cgx-panel > .cgx-info-tiles { margin-top: 14px; }
      .cgx-panel > .cgx-chip-row { margin-top: 14px; }
      .cgx-cocks-body { overflow-x: auto; }
      .cgx-cocks-body .cgx-embed table { max-width: 100%; }
      .cgx-cocks-body img.cgx-cover-thumb { width: 35px; height: 50px; object-fit: cover; border-radius: 3px; }

      .cgx-board { margin-bottom: 16px; }
      .cgx-board-note { font-weight: 400; font-size: 12px; color: var(--muted); margin-left: 8px; }
      .cgx-board-links { display: flex; gap: 6px; }
      .cgx-btn.sm { padding: 4px 10px; font-size: 12px; }
      .cgx-rank-badge {
        display: inline-flex; align-items: center; justify-content: center;
        width: 22px; height: 22px; border-radius: 50%; font-size: 11.5px; font-weight: 700;
        color: var(--muted); background: var(--panel-2);
        /* SF's digit ink renders ~1px above the mathematical center, so bias
           the content box down; border-box keeps the circle at 22px */
        box-sizing: border-box; padding-top: 2px;
      }
      .cgx-rank-badge.g { background: #e8c352; color: #1e1c19; }
      .cgx-rank-badge.s { background: #c0c4cc; color: #1e1c19; }
      .cgx-rank-badge.b { background: #c08a52; color: #1e1c19; }
      .cgx-tbl tr.me td { background: rgba(var(--accent-rgb), 0.08); }
      .cgx-ratio.good { color: var(--green); }
      .cgx-ratio.bad { color: var(--red); }

      .cgx-invite-form { display: flex; gap: 10px; margin-top: 14px; }
      .cgx-invite-form .cgx-search { max-width: 340px; }

      .cgx-tinfo > summary { display: flex; align-items: baseline; gap: 8px; cursor: pointer; list-style: none; }
      .cgx-tinfo > summary::-webkit-details-marker { display: none; }
      .cgx-tinfo > summary::before { content: '▸'; color: var(--accent); font-size: 13px; }
      .cgx-tinfo[open] > summary::before { content: '▾'; }
      .cgx-tinfo > summary h3 { margin: 0; }
      .cgx-tinfo[open] > summary { margin-bottom: 12px; }

      .cgx-featured {
        margin: 18px 0 14px; padding: 14px 16px;
        background: var(--panel); border-radius: 10px; box-shadow: var(--shadow);
        /* accent outline — the featured shelf is the one panel that should
           announce itself against the ordinary browse cards below it */
        border: 1px solid rgba(var(--accent-rgb), 0.55);
      }
      .cgx-featured > summary { display: flex; align-items: baseline; gap: 10px; cursor: pointer; list-style: none; }
      .cgx-featured[open] > summary { margin-bottom: 10px; }
      .cgx-featured > summary::-webkit-details-marker { display: none; }
      .cgx-featured > summary::before { content: '▸'; color: var(--accent); font-size: 13px; }
      .cgx-featured[open] > summary::before { content: '▾'; }
      .cgx-featured h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin: 0; }
      .cgx-featured-body { display: flex; flex-direction: column; gap: 8px; }
      .cgx-countdown { font-size: 12px; color: var(--muted); opacity: 0.8; }
      /* sized to match .cgx-badge.dupes exactly — they sit side by side */
      .cgx-bmark-pill {
        font-size: 10.5px; font-weight: 500; color: var(--muted); background: none; cursor: pointer;
        border: 1px solid var(--line-strong); border-radius: 999px; padding: 1px 7px;
        font-family: inherit; line-height: 1.5; white-space: nowrap;
      }
      .cgx-bmark-pill:hover { color: var(--accent); border-color: var(--accent); }
      .cgx-bmark-pill.on { color: var(--accent); border-color: rgba(var(--accent-rgb), 0.45); }
      .cgx-bonus {
        font-size: 11px; font-weight: 600; color: var(--accent);
        border: 1px solid rgba(var(--accent-rgb), 0.45); border-radius: 999px;
        padding: 1px 8px;
      }
      .cgx-featured .cgx-card { border-left: 3px solid var(--accent); }

      .cgx-list { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
      .cgx-card {
        display: flex; align-items: center; gap: 16px; padding: 12px 16px;
        background: var(--panel); border: 1px solid var(--line-soft); border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .cgx-card:hover { border-color: var(--line-strong); background: var(--panel-2); }
      /* Snatched-by-user (legacy row class torrenttable_usersnatched) — green
         edge + tint, matching old CG's green row highlight. Declared after the
         featured rule so it wins the border-left on featured cards too. */
      .cgx-card.snatched, .cgx-featured .cgx-card.snatched {
        border-left: 3px solid var(--green);
        background: linear-gradient(to right, rgba(var(--green-rgb), 0.08), rgba(var(--green-rgb), 0.02) 55%, transparent), var(--panel);
      }
      .cgx-card.snatched:hover { background: linear-gradient(to right, rgba(var(--green-rgb), 0.08), rgba(var(--green-rgb), 0.02) 55%, transparent), var(--panel-2); }
      .cgx-card.snatched .cgx-title { color: var(--green); }
      .cgx-cat { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex: none; }
      .cgx-card-body { flex: 1; min-width: 0; }
      .cgx-title-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
      .cgx-title { font-weight: 600; font-size: 15.5px; color: var(--text) !important; }
      .cgx-title:hover { color: var(--accent) !important; }
      .cgx-tag {
        background: var(--panel-2); border: 1px solid var(--line-strong); color: var(--muted);
        font-size: 11px; padding: 1px 8px; border-radius: 999px; white-space: nowrap;
      }
      .cgx-sub { color: var(--muted); font-size: 13px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .cgx-meta { display: flex; gap: 14px; color: var(--muted); font-size: 12px; margin-top: 4px; flex-wrap: wrap; }

      .cgx-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 12.5px; flex: none; width: 64px; }
      .cgx-seed { color: var(--green); }
      .cgx-leech { color: var(--red); }
      .cgx-snatch { color: var(--muted); }

      .cgx-actions { display: grid; grid-template-columns: repeat(3, 34px); gap: 6px; flex: none; }
      .cgx-btn.icon { width: 34px; height: 34px; padding: 0; font-size: 12px; }
      .cgx-btn.bmark { color: var(--muted) !important; font-size: 15px; }
      .cgx-btn.bmark.on { color: var(--accent) !important; border-color: var(--accent); }
      .cgx-btn .glyph { font-size: 18px; line-height: 1; }
      .cgx-btn .sub { font-size: 10px; font-weight: 700; margin-left: 1px; }
      .cgx-btn.lb { gap: 0; }
      .lb-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex: none; }
      .lb-dot.g, .lb-dot.b { margin-left: -3px; }
      .lb-dot.o { background: #ff8000; }
      .lb-dot.g { background: #00e054; }
      .lb-dot.b { background: #40bcf4; }

      .cgx-badge { font-size: 10.5px; border-radius: 4px; padding: 1px 7px; font-weight: 700; white-space: nowrap; }
      .cgx-badge.new { background: var(--green); color: var(--on-accent); }
      .cgx-badge.dupes { border: 1px solid var(--line-strong); border-radius: 999px; font-weight: 500; color: var(--muted) !important; }
      .cgx-badge.dupes.many { color: var(--green) !important; border-color: var(--green); }
      .cgx-imdb-title { color: var(--green); font-size: 12.5px; margin-top: 1px; }

      .cgx-pages { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 26px 0; justify-content: center; }
      .cgx-page {
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 8px;
        padding: 6px 12px; font-size: 13px; color: var(--muted) !important;
      }
      .cgx-page:hover { color: var(--text) !important; border-color: var(--accent); }
      span.cgx-page.active {
        background: var(--accent); border-color: var(--accent);
        color: var(--on-accent) !important; font-weight: 700;
      }
      .cgx-pagedots { color: var(--muted); padding: 0 2px; }
    `;
    document.head.appendChild(style);
  }

  /* -------------------------------- bootstrap -------------------------------- */
  // Keep this at the bottom: everything above must be initialized before main() runs.

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();

/* my-work.js — "Save my work" for Optima lesson pages (SAMPLE v2, 2026-10-16).
 * Records what the student does on the page, keeps it on this device, shows it in an "All Your Work" card, and lets the
 * student copy it or save it as a PDF (print window -> "Save as PDF"). Ungraded; nothing is sent anywhere.
 * v2 (David 2026-10-16, merged from the ELA "Learning Journal" pattern): Copy to Clipboard; a warning when the browser
 * will not keep work between visits (Canvas frames can block storage); finished choice questions come back finished;
 * journal sections (textarea.journal-box with data-label, optional data-section); a "leave this page?" warning ONLY when
 * work cannot be saved; backup re-save every 5 seconds.
 * Reads automatically (no per-page id lists): .ow-eval / .ow-reflect choice widgets, .spell-input / .dict-in /
 * .rep-input / textarea.mw-answer / textarea.journal-box boxes, .reveal-btn clicks. The card goes just before the
 * Mark-as-Done banner.
 * v4 (2026-10-19, S2 rollout): works with a course's own Check buttons (.dict-check, .spell-check, .rep-check) instead of
 * adding a second one; reveal locks can be tied to boxes explicitly (data-mw-gate on the Reveal and its boxes;
 * data-mw-open keeps a Reveal open); writing boxes can carry data-model (shown beside the student's writing in the summary).
 */
(function () {
  'use strict';
  // ---- storage: localStorage if it really works, else sessionStorage, else memory ------------------------------
  var mem = {}, store = null, persistent = false;
  function works(s) { try { var k = '__mw_test__'; s.setItem(k, '1'); var ok = s.getItem(k) === '1'; s.removeItem(k); return ok; } catch (e) { return false; } }
  try { if (works(window.localStorage)) { store = window.localStorage; persistent = true; } } catch (e) {}
  if (!store) { try { if (works(window.sessionStorage)) store = window.sessionStorage; } catch (e) {} }
  if (!store) store = { getItem: function (k) { return k in mem ? mem[k] : null; }, setItem: function (k, v) { mem[k] = String(v); } };

  var KEY = 'mywork:' + document.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  var state = load(), restoring = false;
  function load() { try { return JSON.parse(store.getItem(KEY)) || { items: {}, name: '' }; } catch (e) { return { items: {}, name: '' }; } }
  function save() { try { store.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function bare(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe'); }
  function norm(s) { return (s || '').toLowerCase().replace(/[’']/g, "'").replace(/[.!?¿¡,;:«»"]/g, '').replace(/\s+/g, ' ').trim(); }
  function partOf(el) {
    var p = el;
    while (p && p.parentElement && !/PART \d/.test(txt(p).slice(0, 80))) p = p.parentElement;
    var m = p && txt(p).match(/PART \d[^·]*·\s*([^0-9]{3,60}?)(?:\d+ min|$)/);
    return m ? m[1].trim() : '';
  }

  // ---- choice widgets (recorded, and restored as finished) -------------------------------------------------------
  document.querySelectorAll('.optima-widget.ow-eval, .optima-widget.ow-reflect').forEach(function (w, i) {
    var id = 'w' + i, isEval = w.classList.contains('ow-eval');
    var q = txt(w.querySelector('.widget-question'));
    var btns = Array.prototype.slice.call(w.querySelectorAll('.widget-options button'));
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (restoring) return;
        var it = state.items[id] || { kind: isEval ? 'choice' : 'reflect', q: q, part: partOf(w), tries: [] };
        it.tries.push(txt(b));
        if (isEval) {
          var right = w.querySelector('.widget-options button[data-correct="true"]');
          it.answer = txt(right);
          if (it.tries.length === 1) it.correct = b.getAttribute('data-correct') === 'true';
          it.done = it.done || b.getAttribute('data-correct') === 'true';
        }
        state.items[id] = it; save();
      });
    });
    var saved = state.items[id];
    if (saved && saved.tries && saved.tries.length) {         // show it finished again: replay the last choice
      var last = btns.filter(function (b) { return txt(b) === saved.tries[saved.tries.length - 1]; })[0];
      if (last) { restoring = true; try { last.click(); } finally { restoring = false; } }
    }
  });

  // ---- typed answers and journal boxes -----------------------------------------------------------------------------
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input.spell-input, input.dict-in, input.rep-input, textarea.mw-answer, textarea.journal-box'));
  boxes.forEach(function (inp, i) {
    var id = inp.id || ('t' + i);
    var row = inp.closest('.spell-row, .dict-row, .rep-row, .dictrow, .mw-box') || inp.parentElement;
    var journal = inp.classList.contains('journal-box');
    var prompt = journal ? (inp.getAttribute('data-label') || 'Writing') :
      (txt(row.querySelector('.spell-prompt, .dict-num, .rep-cue, .mw-prompt')) || txt(row).slice(0, 80));
    var key = journal ? '' : (inp.getAttribute('data-answer') || (row && row.getAttribute('data-answer')) || '');
    var dw = inp.classList.contains('dict-in') && inp.closest('.optima-widget'), sw = inp.classList.contains('spell-input') && inp.closest('.ow-spell');
    if (dw) { key = key || txt(dw.querySelector('.answer-fr')); prompt = 'Dictation ' + txt(dw.querySelector('.dict-num')); }
    if (sw) { key = key || sw.getAttribute('data-answer') || ''; prompt = txt(sw.querySelector('.widget-question')) || prompt; }
    if (!journal && row.classList.contains('dictrow')) {
      prompt = 'Dictation ' + txt(row.querySelector('.num'));
      key = key || txt(row.querySelector('.reveal-body strong'));
    } else if (!journal && row.tagName === 'LI' && !key) {
      var list = row.parentElement, n = Array.prototype.indexOf.call(list.children, row) + 1;
      var rb = list.parentElement.querySelector('.reveal-body');
      var m = rb && txt(rb).match(new RegExp('(?:^|\\s)' + n + '\\.\\s*([^\\s—–,;(]+)'));
      if (m) key = m[1];
      prompt = n + '. ' + prompt;
    }
    function record() {
      var prev = state.items[id] || {};
      var it = { kind: journal ? 'journal' : 'typed', q: prompt, part: inp.getAttribute('data-section') || partOf(inp), value: inp.value,
                 checks: prev.checks || 0, gotIt: prev.gotIt || false, model: inp.getAttribute('data-model') || undefined };
      if (key) { var alts = key.split(' || '); it.answer = alts[0]; it.correct = alts.some(function (k) { return norm(inp.value) === norm(k); });   // A || B = either is right
        it.accentOnly = !it.correct && alts.some(function (k) { return bare(norm(inp.value)) === bare(norm(k)); }); }   // right but for the accents (still wrong: David 2026-11-02)
      state.items[id] = it; save(); gather(); if (typeof updateLocks === 'function') updateLocks();
    }
    if (state.items[id] && state.items[id].value && !inp.value) inp.value = state.items[id].value;   // restore
    inp.addEventListener('input', record);
    inp.addEventListener('change', record);
    inp._mwRecord = record; inp._mwId = id; inp._mwKey = key; inp._mwJournal = journal;

    // ---- the course's own Check button (French dictation/spelling, Spanish word lists): count tries on it ----------
    var nscope = inp.closest('.rep-block') || sw || dw, nbtn = nscope && nscope.querySelector('.rep-check, .spell-check, .dict-check');
    if (key && nbtn) {
      nbtn.addEventListener('click', function () {
        if (!inp.value.trim()) return;
        record();
        var it = state.items[id];
        if (!it.gotIt) { it.checks = (it.checks || 0) + 1; if (it.correct) it.gotIt = true; }
        save();
        setTimeout(function () {                    // the course's own checker may accept it (e.g. 'Parfait !')
          var ok = nscope.querySelector('.dict-fb.ok');
          if (ok && !state.items[id].gotIt) { state.items[id].gotIt = true; save(); }
          gather(); updateLocks();
        }, 0);
      });
    }
    // ---- Check button: typed answers with a key get two checked tries before the answer can be revealed --------
    else if (key) {
      var chk = document.createElement('button');
      chk.type = 'button'; chk.className = 'mw-check'; chk.textContent = 'Check';
      chk.setAttribute('style', 'font-size:14px;padding:4px 12px;margin:4px 6px;border:0;border-radius:4px;background:#1f5f8b;color:#fff;cursor:pointer;vertical-align:middle');
      var fb = document.createElement('span');
      fb.className = 'mw-check-fb'; fb.setAttribute('style', 'font-size:14px;vertical-align:middle');
      inp.insertAdjacentElement('afterend', fb); inp.insertAdjacentElement('afterend', chk);
      var show = function () {
        var it = state.items[id]; if (!it || !it.checks) { fb.textContent = ''; return; }
        if (it.gotIt) { fb.style.color = '#1e8a3c'; fb.style.fontWeight = '800'; fb.style.fontSize = '16px'; fb.textContent = '✓ Correct!'; }   // green and bold (David 2026-10-26)
        else { fb.style.fontWeight = '400'; fb.style.fontSize = '14px'; fb.style.color = '#b3382c'; var aw = accentWords(inp.value); fb.textContent = it.accentOnly
            ? (aw && /\s/.test(norm(inp.value))   // a sentence: name the words to look at (David 2026-11-10)
               ? (it.checks >= 2 ? '✗ So close — only the accents were off. Look again at: ' + aw + '. You can reveal the answer now.' : '✗ So close — the words are right, but look again at: ' + aw + ' (1 of 2).')
               : (it.checks >= 2 ? '✗ So close — only the accents were off. Don’t forget them! You can reveal the answer now.' : '✗ So close — the words are right, but check your accents! Accents are part of the word (1 of 2).'))
            : (hintFor(inp.value) ? '✗ ' + hintFor(inp.value) + (it.checks >= 2 ? ' You can reveal the answer now.' : ' Try again (1 of 2).')
            : (it.checks >= 2 ? '✗ Not yet — you can reveal the answer now.' : '✗ Not yet — check your spelling and accents, then try again (1 of 2).')
              + (aw && /\s/.test(norm(inp.value)) ? ' Also look again at: ' + aw + '.' : '')); }
      };
      // the student's words that match a word of the key except for accents / ñ, e.g. “dia”, “jardin” (or an accent added in error)
      var accentWords = function (v) {
        var mine = norm(v).split(' '), keys = [];
        key.split(' || ').forEach(function (k) { keys = keys.concat(norm(k).split(' ')); });
        var marks = function (s) { return (s.normalize('NFD').match(/[̀-ͯ]/g) || []).length; };
        var bad = mine.filter(function (w, i) {
          return w && keys.indexOf(w) < 0 && keys.some(function (k) { return bare(k) === bare(w); }) && mine.indexOf(w) === i;
        });
        return bad.map(function (w) {      // say WHICH problem: missing mark, ñ, extra accent, or accent in the wrong place
          var k = keys.filter(function (k) { return bare(k) === bare(w); })[0], why;
          if (/ñ/.test(k) && !/ñ/.test(w)) why = 'needs ñ';
          else if (marks(w) < marks(k)) why = 'needs an accent';
          else if (marks(w) > marks(k)) why = 'has no accent here';
          else why = 'the accent is on the wrong letter';
          return '“' + w + '” (' + why + ')';
        }).join(', ');
      };
      // data-hints = [["regex", "message"], ...] tested in order on the normalised answer (accents stripped);
      // data-hint-else = message for any other wrong answer. Lets a box say WHAT is wrong (David 2026-11-10).
      var hintFor = function (v) {
        var h; try { h = JSON.parse(inp.getAttribute('data-hints') || '[]'); } catch (e) { h = []; }
        var s = bare(norm(v));
        for (var i = 0; i < h.length; i++) { if (new RegExp(h[i][0]).test(s)) return h[i][1]; }
        return inp.getAttribute('data-hint-else') || '';
      };
      chk.addEventListener('click', function () {
        if (!inp.value.trim()) { fb.style.fontWeight = '400'; fb.style.fontSize = '14px'; fb.style.color = '#5b6672'; fb.textContent = 'Type your answer first.'; return; }
        record();
        var it = state.items[id];
        if (!it.gotIt) { it.checks = (it.checks || 0) + 1; if (it.correct) it.gotIt = true; }
        save(); show(); gather(); updateLocks();
      });
      show();
    }
  });

  // ---- locked reveals: a Reveal opens only after the student has tried --------------------------------------------
  // gate = the boxes that belong to the reveal (inside its block, or in the list just before it). Checked boxes need a
  // right answer or 2 checked tries; writing boxes need a written attempt. Reveals with no box stay open as before.
  var gates = [];
  document.querySelectorAll('.reveal-btn').forEach(function (b) {
    if (b.hasAttribute('data-mw-open')) return;
    var gid = b.getAttribute('data-mw-gate'), host = b.parentElement, own;
    if (gid) own = boxes.filter(function (x) { return x.getAttribute('data-mw-gate') === gid; });
    else {
      own = boxes.filter(function (x) { return host.contains(x); });
      if (!own.length && host.previousElementSibling) own = boxes.filter(function (x) { return host.previousElementSibling.contains(x); });
    }
    if (!own.length) return;
    gates.push({ btn: b, boxes: own, label: b.textContent });
    b.setAttribute('data-mw-label', b.textContent);
  });
  function satisfied(x) {
    var it = state.items[x._mwId] || {};
    if (x._mwKey) return !!it.gotIt || (it.checks || 0) >= 2;
    return (x.value || '').trim().length >= 3;
  }
  function updateLocks() {
    gates.forEach(function (g) {
      var ok = g.boxes.every(satisfied);
      g.btn.disabled = !ok;
      g.btn.style.opacity = ok ? '' : '.55';
      g.btn.style.cursor = ok ? '' : 'not-allowed';
      g.btn.textContent = ok ? g.label : (g.boxes.some(function (x) { return x._mwKey; }) ? '🔒 Try it first — Reveal unlocks after 2 tries' : '🔒 Write your answer first');
    });
  }
  updateLocks();
  setInterval(function () { boxes.forEach(function (b) { if (b.value) b._mwRecord(); }); }, 5000);   // backup save

  // ---- reveals -----------------------------------------------------------------------------------------------------
  document.querySelectorAll('.reveal-btn').forEach(function (b, i) {
    b.addEventListener('click', function () { state.revealed = state.revealed || {}; state.revealed['r' + i] = true; save(); });
  });

  // ---- games (e.g. the piñata warm-up) report here: completed or not, best time ------------------------------------
  window.addEventListener('mw-game', function (e) {
    var d = e.detail || {}, g = (state.games = state.games || {})[d.name] || { name: d.name, done: false, best: null, practice: false };
    if (d.done) { if (d.timed) { g.done = true; if (d.seconds != null && (g.best == null || d.seconds < g.best)) g.best = d.seconds; } else g.practice = true; }
    if (d.summary) { g.done = g.done || !!d.done; g.summary = d.summary; }
    g.words = d.words; state.games[d.name] = g; save(); if (typeof gather === 'function') gather();
  });

  // ---- leave warning only when work cannot be kept -------------------------------------------------------------
  window.addEventListener('beforeunload', function (e) {
    if (persistent) return;
    if (boxes.some(function (b) { return b.value.trim(); })) { e.preventDefault(); e.returnValue = ''; }
  });

  // ---- the "All Your Work" card --------------------------------------------------------------------------------------
  var S = 'font-size:17px;font-weight:700;padding:12px 22px;border:0;border-radius:8px;cursor:pointer;margin:4px 8px 4px 0;font-family:inherit;';
  var card = document.createElement('div');
  card.className = 'mw-save';
  card.setAttribute('style', 'margin:28px 0;padding:20px 22px;border:2px solid #1f5f8b;border-left:8px solid #1f5f8b;border-radius:8px;background:#EEF5FB;box-shadow:0 2px 8px rgba(14,28,66,.12);font-family:inherit');
  card.innerHTML =
    (persistent ? '' : '<div style="margin:0 0 12px;padding:10px 12px;background:#fff4cc;border:1px solid #e6c34a;border-radius:6px;font-size:15px;color:#5c4400">&#9888;&#65039; Your browser will not let this page save your work between visits. Copy or download your answers before you leave.</div>') +
    '<div style="font-size:22px;font-weight:700;letter-spacing:.04em;color:#0E1C42;margin-bottom:8px;line-height:1.3">&#128196; ALL YOUR WORK &mdash; REVIEW, COPY, OR DOWNLOAD</div>' +
    '<p style="margin:0 0 14px;font-size:17px;color:#1a2340;line-height:1.5">Everything you did on this page, in one place. If your teacher asks to see your work, download it as a PDF and send it.</p>' +
    '<label style="font-size:17px;font-weight:700;color:#1a2340">Your name: <input type="text" class="mw-name" style="font-size:17px;padding:8px 12px;border:2px solid #1f5f8b;border-radius:6px;min-width:240px;background:#fff"></label>' +
    '<textarea id="gatheredOutput" readonly tabindex="-1" aria-hidden="true" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0"></textarea><div style="height:10px"></div>' +
    '<button type="button" class="mw-copy" style="' + S + 'background:#fff;color:#1f5f8b;border:2px solid #1f5f8b;">&#128203; Copy to Clipboard</button> ' +
    '<button type="button" class="mw-pdf" style="' + S + 'background:#B45309;color:#fff;font-size:19px;padding:14px 28px;box-shadow:0 3px 0 #7c3a06;">&#128196; Download as PDF</button> ' +
    '<span class="mw-msg" style="font-size:16px;font-weight:700;color:#2f6b3a;margin-left:6px"></span>';
  var anchor = document.querySelector('.markdone');
  anchor = anchor && anchor.closest('div[style*="margin"], div');
  (anchor && anchor.parentElement ? anchor.parentElement : document.body).insertBefore(card, anchor || null);
  var nameIn = card.querySelector('.mw-name'), out = card.querySelector('#gatheredOutput'), msg = card.querySelector('.mw-msg');
  nameIn.value = state.name || '';
  nameIn.addEventListener('input', function () { state.name = nameIn.value; save(); gather(); });

  function ordered() {
    return Object.keys(state.items).sort(function (a, b) { return a[0] === b[0] ? +a.replace(/\D/g, '') - +b.replace(/\D/g, '') : (a < b ? -1 : 1); })
      .map(function (k) { return state.items[k]; });
  }
  function title() { return document.title.replace(/\s*[—-]\s*Optima.*$/, ''); }
  function stats() {
    var items = ordered(), ch = items.filter(function (x) { return x.kind === 'choice'; });
    return { items: items, choices: ch, right: ch.filter(function (x) { return x.correct; }).length,
      totalChoices: document.querySelectorAll('.optima-widget.ow-eval').length,
      revealed: Object.keys(state.revealed || {}).length, reveals: document.querySelectorAll('.reveal-btn').length };
  }
  function gameLine(g) {
    if (g.summary) return g.summary;
    return g.done ? 'beat the clock' + (g.best != null ? ' — best time ' + g.best + ' s' : '') + ' (' + g.words + ' words)'
                  : (g.practice ? 'practice round done, clock not yet beaten' : 'not finished');
  }
  function gather() {
    var s = stats(), L = [title(), (state.name || '(name not entered)') + ' · ' + new Date().toLocaleString(), ''];
    L.push('Choice questions: ' + s.right + ' of ' + s.totalChoices + ' right on the first try · Answers revealed: ' + s.revealed + ' of ' + s.reveals, '');
    var groups = {};
    s.items.forEach(function (x) { var g = x.kind === 'journal' ? (x.part || 'My writing') : x.kind === 'choice' ? 'Choice questions' : x.kind === 'reflect' ? 'Check-ins' : 'What I wrote'; (groups[g] = groups[g] || []).push(x); });
    Object.keys(groups).forEach(function (g) {
      L.push('== ' + g.toUpperCase() + ' ==');
      groups[g].forEach(function (x) {
        var mark = x.correct === undefined ? '' : (x.correct ? ' ✓' : ' ✗');
        if (x.kind === 'choice') L.push(x.q, '  First answer: ' + x.tries[0] + mark + (x.correct ? '' : '  (correct: ' + x.answer + ')'));
        else if (x.kind === 'reflect') L.push(x.q, '  ' + x.tries[x.tries.length - 1]);
        else { L.push(x.q, '  ' + (x.value.trim() || '(no answer)') + mark + (x.answer && !x.correct ? '  (expected: ' + x.answer + ')' : '')); if (x.model) L.push('  Model answer: ' + x.model); }
      });
      L.push('');
    });
    var games = Object.keys(state.games || {}).map(function (k) { return state.games[k]; });
    if (games.length) {
      L.push('== GAMES ==');
      games.forEach(function (g) { L.push((g.done ? '✅ ' : '⬜ ') + g.name + ': ' + gameLine(g)); });
      L.push('');
    }
    out.value = L.join('\n');
    return s;
  }
  gather();

  card.querySelector('.mw-copy').addEventListener('click', function () {
    gather();
    function fallback() {
      out.removeAttribute('readonly'); out.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      out.setAttribute('readonly', ''); return ok;
    }
    function done(ok) { msg.style.color = ok ? '#2f6b3a' : '#b3382c'; msg.textContent = ok ? '✅ Copied!' : 'Copy did not work here. Use Download as PDF instead.'; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.value).then(function () { done(true); }, function () { done(fallback()); });
      else done(fallback());
    } catch (e) { done(fallback()); }
  });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  card.querySelector('.mw-pdf').addEventListener('click', function () {
    state.name = nameIn.value; save();
    var s = gather();
    var row = function (cells) { return '<tr>' + cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; };
    var mark = function (x) { return x.correct === undefined ? '' : (x.correct ? '<span class="ok">&#10003;</span>' : '<span class="no">&#10007;</span>'); };
    var typed = s.items.filter(function (x) { return x.kind === 'typed'; });
    var journal = s.items.filter(function (x) { return x.kind === 'journal'; });
    var reflect = s.items.filter(function (x) { return x.kind === 'reflect'; });
    var jgroups = {}; journal.forEach(function (x) { (jgroups[x.part || 'My writing'] = jgroups[x.part || 'My writing'] || []).push(x); });
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>My work — ' + esc(title()) + '</title><style>' +
      'body{font:15px/1.5 Georgia,serif;color:#1a2340;margin:32px auto;max-width:760px;padding:0 20px}h1{font-size:22px;margin:0}' +
      '.meta{color:#5b6672;margin:4px 0 18px}table{border-collapse:collapse;width:100%;margin:8px 0 18px}td,th{border-bottom:1px solid #d9ded9;padding:6px 8px;text-align:left;vertical-align:top}' +
      'th{font:12px system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#5b6672}.ok{color:#2f6b3a;font-weight:bold}.no{color:#b3382c;font-weight:bold}' +
      'h2{font-size:17px;margin:18px 0 4px}.q{font-weight:bold;margin:10px 0 4px}.a{background:#f1f4f7;border-radius:4px;padding:8px 10px;white-space:pre-wrap}' +
      '.m{font:14px system-ui,sans-serif;color:#2f6b3a;margin:4px 0 0 10px}.note{font:13px system-ui,sans-serif;color:#5b6672}.bar{margin:0 0 18px}@media print{.bar{display:none}}</style></head><body>' +
      '<div class="bar"><button onclick="window.print()" style="font-size:15px;padding:6px 14px">Save as PDF / Print</button> <span class="note">In the print window, choose “Save as PDF”.</span></div>' +
      '<h1>' + esc(title()) + '</h1><div class="meta">' + esc(state.name || '(name not entered)') + ' &middot; ' + esc(new Date().toLocaleString()) + '</div>' +
      '<p><strong>Choice questions:</strong> ' + s.right + ' of ' + s.totalChoices + ' right on the first try' +
      (s.choices.length < s.totalChoices ? ' (' + (s.totalChoices - s.choices.length) + ' not answered)' : '') + ' &middot; <strong>Answers revealed:</strong> ' + s.revealed + ' of ' + s.reveals + '</p>' +
      Object.keys(jgroups).map(function (g) { return '<h2>' + esc(g) + '</h2>' + jgroups[g].map(function (x) { return '<div class="q">' + esc(x.q) + '</div><div class="a">' + (esc(x.value.trim()) || '(no answer)') + '</div>' + (x.model ? '<div class="m">Model answer: ' + esc(x.model) + '</div>' : ''); }).join(''); }).join('') +
      (s.choices.length ? '<h2>Choice questions</h2><table><tr><th>Question</th><th>First answer</th><th></th><th>Correct answer</th></tr>' +
        s.choices.map(function (x) { return row([esc(x.q), esc(x.tries[0]), mark(x), esc(x.answer)]); }).join('') + '</table>' : '') +
      (typed.length ? '<h2>What I wrote</h2><table><tr><th>Item</th><th>My answer</th><th></th><th>Expected</th></tr>' +
        typed.map(function (x) { return row([esc(x.q), esc(x.value), mark(x), esc(x.answer || '')]); }).join('') + '</table>' : '') +
      (Object.keys(state.games || {}).length ? '<h2>Games</h2><table>' + Object.keys(state.games).map(function (k) { var g = state.games[k];
        return row([(g.done ? '&#9989; ' : '&#11036; ') + esc(g.name), esc(gameLine(g))]); }).join('') + '</table>' : '') +
      (reflect.length ? '<h2>Check-ins</h2><table>' + reflect.map(function (x) { return row([esc(x.q), esc(x.tries[x.tries.length - 1])]); }).join('') + '</table>' : '') +
      '<p class="note">Saved from the lesson page. Practice on this page is not graded.</p></body></html>';
    var w = window.open('', '_blank');
    if (!w) { msg.style.color = '#b3382c'; msg.textContent = 'Your browser blocked the new window. Allow pop-ups for this page, or use Copy to Clipboard.'; return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 400);
  });
})();

/* Accent buttons in the answer boxes' accent rows (David 2026-10-28: "the buttons like we have in the conjugation widget"
   instead of copy and paste). Click in a box, then a letter: it goes in where you were typing. If no box was clicked yet,
   the letter goes into the first box of the same activity. */
(function () {
  var last = null;
  function isBox(t) { return t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /^(text|search|)$/.test(t.type || ''))); }
  document.addEventListener('focusin', function (e) { if (isBox(e.target)) last = e.target; });
  document.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('.mw-acc button')) e.preventDefault(); });   // keep the cursor in the box
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.mw-acc button'); if (!b) return;
    var t = last;
    if (!t || !document.body.contains(t)) {
      var area = b.closest('.optima-widget, .activity-card, .pl-card, .sg-card, .rep-block, .opt-strip') || b.parentNode.parentNode;
      t = area && area.querySelector('textarea, input[type="text"]');
    }
    if (!t) return;
    var a = t.selectionStart == null ? t.value.length : t.selectionStart, z = t.selectionEnd == null ? a : t.selectionEnd, ch = b.textContent;
    t.value = t.value.slice(0, a) + ch + t.value.slice(z);
    t.focus(); try { t.setSelectionRange(a + ch.length, a + ch.length); } catch (err) {}
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
})();

/* revisa.js: sentence checker for "write this sentence in Spanish" boxes (Spanish 1 S2, 2026-11-09).
   For each <textarea id="..."> listed in a <script type="application/json" class="revisa-data"> block, adds a
   "Check my sentence" button and a feedback panel that:
     1. accepts any of the item's answers (case, spacing and . ! ignored; accents and ñ count),
     2. "accents only" → names the words whose accents are off (strict practice),
     3. otherwise shows the lesson-specific diagnoses whose regex matches (max 3), plus the student's sentence with
        wrong words underlined and a marker where a word is missing (the right word is not given away),
     4. question items: also checks the opening ¿ and closing ?,
     5. after 3 tries points to the item's existing "Reveal answer" button.
   After the first check it re-checks as the student types. Practice only: nothing is graded or sent anywhere.
   Data: {"<textarea id>": {"answers": ["quiero limpiar mi dormitorio", ...], "question": false,
          "rules": [{"re": "\\bquero\\b", "msg": "..."}], "also": [{"re": "...", "msg": "..."}]}}
   rules = mistakes (shown when the sentence is not right); also = notes shown even when it is right. */
(function () {
  'use strict';
  var CSS =
    '.rv-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 6px}' +
    '.rv-btn{background:#1a2340;color:#fff;border:0;border-radius:999px;padding:8px 18px;font:600 15px "Segoe UI",Roboto,Arial,sans-serif;cursor:pointer;box-shadow:inset 0 -2px 0 #c7922c}' +
    '.rv-btn:hover{background:#26335c}.rv-btn:focus-visible{outline:3px solid #2b4c8c;outline-offset:2px}' +
    '.rv-live{font-size:12.5px;color:#5f554a;font-style:italic}' +
    '.rv-fb{max-width:560px;border-radius:8px;padding:10px 14px;margin:2px 0 14px;font:15.5px/1.5 "Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.rv-fb[hidden]{display:none}' +
    '.rv-fb.ok{background:#e6f2e6;border:1px solid #7fb07f}.rv-fb.close{background:#fdf3dc;border:1px solid #d9b35a}.rv-fb.no{background:#fbe8e5;border:1px solid #d99a90}' +
    '.rv-v{font-weight:700;margin-bottom:4px}.rv-fb.ok .rv-v{color:#1d5e20}.rv-fb.close .rv-v{color:#7a5300}.rv-fb.no .rv-v{color:#8f1d12}' +
    '.rv-fb ul{margin:4px 0 0;padding-left:20px}.rv-fb li{margin:3px 0}' +
    '.rv-echo{margin:6px 0 2px;font-size:17px;line-height:1.9}' +
    '.rv-w{padding:0 2px;border-radius:3px}.rv-w.bad{background:#fff;border-bottom:3px solid #c0392b;color:#8f1d12;font-weight:600}' +
    '.rv-w.acc{border-bottom:3px dotted #b07d16;color:#7a5300;font-weight:600}' +
    '.rv-gap{display:inline-block;min-width:34px;border-bottom:3px dashed #c0392b;margin:0 3px;color:#c0392b;font-size:13px;text-align:center}' +
    '.rv-more{margin-top:6px;font-size:14px;color:#5f554a}';

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[’']/g, "'")
      .replace(/[.,!?¿¡;:"«»()]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function bare(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }   // also turns ñ into n
  function words(s) { return s ? s.split(' ') : []; }
  // Word boundary that understands accented letters (JS \b treats í, ñ… as non-letters):
  // every \b in a rule is swapped for this Unicode-aware boundary.
  var UB = '(?:(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}])|(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}]))';
  function rx(s) { return new RegExp(String(s).split('\\b').join(UB), 'iu'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Token alignment (LCS) between the student's words and an answer: which student words fit, where words are missing.
  function align(a, b, eq) {
    var n = a.length, m = b.length, L = [], i, j;
    for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--)
      L[i][j] = eq(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var ops = []; i = 0; j = 0;
    while (i < n && j < m) {
      if (eq(a[i], b[j])) { ops.push({ k: 'same', s: a[i], t: b[j] }); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { ops.push({ k: 'extra', s: a[i] }); i++; }
      else { ops.push({ k: 'miss', t: b[j] }); j++; }
    }
    while (i < n) ops.push({ k: 'extra', s: a[i++] });
    while (j < m) ops.push({ k: 'miss', t: b[j++] });
    return { ops: ops, score: L[0][0] };
  }
  // Pair an extra word with a neighbouring missing word as one "wrong word" (a replacement).
  function merge(ops) {
    var out = [];
    for (var i = 0; i < ops.length; i++) {
      var o = ops[i], nx = ops[i + 1];
      if (nx && ((o.k === 'extra' && nx.k === 'miss') || (o.k === 'miss' && nx.k === 'extra'))) {
        out.push({ k: 'wrong', s: o.k === 'extra' ? o.s : nx.s, t: o.k === 'miss' ? o.t : nx.t }); i++;
      } else out.push(o);
    }
    return out;
  }

  function check(ta, cfg) {
    var raw = ta.value, n = norm(raw), sw = words(n), res = { level: 'no', title: '', items: [], echo: '' };
    if (!n) { res.title = 'Write the sentence in Spanish first.'; return res; }
    var answers = cfg.answers.map(norm), q = cfg.question;
    var qMsg = q && (raw.indexOf('¿') < 0 || raw.indexOf('?') < 0) ? 'A question in Spanish opens with <strong>¿</strong> and closes with <strong>?</strong> (the ¿ button is in the accent bar).' : '';
    var extraNotes = (cfg.also || []).filter(function (r) { return rx(r.re).test(n); }).map(function (r) { return r.msg; });

    // 1. right (accents count)
    if (answers.indexOf(n) >= 0) {
      if (qMsg) { res.level = 'close'; res.title = 'The words are right!'; res.items = [qMsg].concat(extraNotes); return res; }
      res.level = 'ok'; res.title = '✓ ¡Perfecto! That sentence is right.';
      if (!/^[¿¡]?[A-ZÁÉÍÓÚÑ]/.test(raw.trim())) extraNotes.push('Tip: start the sentence with a capital letter.');
      res.items = extraNotes; return res;
    }
    // 2. right except accents / ñ
    var bn = bare(n), hit = -1;
    answers.forEach(function (a, k) { if (hit < 0 && bare(a) === bn) hit = k; });
    if (hit >= 0) {
      var aw = words(answers[hit]), fix = [];
      sw.forEach(function (w, k) { if (w !== aw[k]) fix.push('<strong>' + esc(w) + '</strong> → <strong>' + esc(aw[k]) + '</strong>'); });
      res.level = 'close'; res.title = 'So close: only the accents are off.';
      var why = (cfg.rules || []).filter(function (r) { return rx(r.re).test(n); }).map(function (r) { return r.msg; });
      res.items = ['Check ' + fix.join(', ') + '. Accents are part of the word.'].concat(why.slice(0, 2), qMsg ? [qMsg] : []);
      res.echo = sw.map(function (w, k) { return '<span class="rv-w' + (w !== aw[k] ? ' acc' : '') + '">' + esc(w) + '</span>'; }).join(' ');
      return res;
    }
    // 3. mistakes: lesson-specific diagnoses + word alignment against the closest answer
    var eq = function (x, y) { return x === y; };
    var best = null;
    answers.forEach(function (a) { var r = align(sw, words(a), eq); if (!best || r.score > best.score) best = r; });
    var ops = merge(best.ops);
    var msgs = (cfg.rules || []).filter(function (r) { return rx(r.re).test(n); }).map(function (r) { return r.msg; });
    var seen = {}; msgs = msgs.filter(function (m) { return seen[m] ? false : (seen[m] = 1); }).slice(0, 3);
    var wrongCount = ops.filter(function (o) { return o.k !== 'same'; }).length;
    if (!msgs.length) {
      ops.forEach(function (o) {
        if (msgs.length >= 3) return;
        if (o.k === 'wrong' && bare(o.s) === bare(o.t)) msgs.push('Check the accent on <strong>' + esc(o.s) + '</strong>.');
        else if (o.k === 'wrong') msgs.push('<strong>' + esc(o.s) + '</strong> is not the word you need here. Check the word key.');
        else if (o.k === 'extra') msgs.push('<strong>' + esc(o.s) + '</strong> is not needed in this sentence.');
        else if (o.k === 'miss') msgs.push('A word is missing where the dashed line is.');
      });
    }
    if (qMsg) msgs.push(qMsg);
    res.title = wrongCount <= 1 ? 'Almost: one thing to fix.' : 'Not yet: let’s fix it step by step.';
    res.level = wrongCount <= 1 ? 'close' : 'no';
    res.items = msgs;
    res.echo = ops.map(function (o) {
      if (o.k === 'same') return '<span class="rv-w">' + esc(o.s) + '</span>';
      if (o.k === 'miss') return '<span class="rv-gap" title="A word is missing here">?</span>';
      return '<span class="rv-w bad">' + esc(o.s) + '</span>';
    }).join(' ');
    return res;
  }

  function render(fb, res, tries, revealBtn) {
    fb.hidden = false; fb.className = 'rv-fb ' + res.level;
    var h = '<div class="rv-v">' + res.title + '</div>';
    if (res.echo) h += '<div class="rv-echo">' + res.echo + '</div>';
    if (res.items.length) h += '<ul>' + res.items.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>';
    if (res.level !== 'ok' && tries >= 3 && revealBtn) h += '<div class="rv-more">Still stuck? Use <strong>Reveal answer</strong> below, then write it again from memory.</div>';
    fb.innerHTML = h;
  }

  function init() {
    var blocks = document.querySelectorAll('script.revisa-data');
    if (!blocks.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    [].forEach.call(blocks, function (b) {
      var data; try { data = JSON.parse(b.textContent); } catch (e) { return; }
      Object.keys(data).forEach(function (id) {
        var ta = document.getElementById(id), cfg = data[id];
        if (!ta) return;
        var anchor = ta.nextElementSibling && ta.nextElementSibling.classList.contains('mw-acc') ? ta.nextElementSibling : ta;
        var row = document.createElement('div'); row.className = 'rv-row';
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'rv-btn'; btn.textContent = '✓ Check my sentence';
        var live = document.createElement('span'); live.className = 'rv-live';
        row.appendChild(btn); row.appendChild(live);
        var fb = document.createElement('div'); fb.className = 'rv-fb'; fb.hidden = true; fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite');
        anchor.parentNode.insertBefore(row, anchor.nextSibling);
        row.parentNode.insertBefore(fb, row.nextSibling);
        var reveal = null, el = fb.nextElementSibling;
        for (var k = 0; k < 4 && el; k++, el = el.nextElementSibling) { if (el.classList && el.classList.contains('reveal-btn')) { reveal = el; break; } }
        var tries = 0, armed = false, timer = null;
        function run(count) { if (count) tries++; render(fb, check(ta, cfg), tries, reveal); }
        btn.addEventListener('click', function () { armed = true; live.textContent = 'Keeps checking as you type.'; run(true); });
        ta.addEventListener('input', function () {
          if (!armed) return;
          clearTimeout(timer); timer = setTimeout(function () { run(false); }, 700);
        });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.RevisaCheck = check;   // exposed for testing
})();

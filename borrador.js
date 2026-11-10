/* borrador.js: "Plan your recording" draft box for a Tarea oral (Spanish 1 S2, 2026-11-10; David: students plan
   on the page, never in notes elsewhere, with a word key and a checker — for every module).
   Markup: <div class="borrador" data-borrador='{"id","label","starters":[..],"require":[{"re","min","label","distinct"?}],
            "rules":[{"re","msg"}],"ready"}'>  ...optional <aside class="jt-key"> word key inside... </div>
   - The textarea is a normal my-work "journal-box", so the draft is saved and appears in All Your Work.
   - "Check my plan" ticks each requirement (e.g. two rooms, two stem-changing verbs) and lists the specific slips
     the rules find (quero → quiero, puedemos → podemos…). Regexes run on the lower-cased text, accents kept.
   Practice only: nothing is graded or sent anywhere. */
(function () {
  'use strict';
  var CSS =
    '.bd{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:22px;align-items:start;margin:14px 0 6px}' +
    '.bd-main{background:#FBF6EA;border:1px solid #E3D3A8;border-left:5px solid #C7922C;border-radius:8px;padding:14px 18px}' +
    '.bd-k{font-size:13px;color:#8a6a12;letter-spacing:.3px;margin-bottom:6px;font-weight:700}' +
    '.bd-st{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.bd-st button{font:600 15px "Segoe UI",Arial,sans-serif;background:#fff;color:#1a2340;border:1px solid #c9b58a;border-radius:999px;padding:4px 12px;cursor:pointer}' +
    '.bd-st button:hover{background:#f3e2b3}' +
    '.bd textarea{display:block;width:100%;box-sizing:border-box;min-height:130px;font:17px/1.6 "Segoe UI",Arial,sans-serif;color:#1a2340;border:1px solid #9aa6b2;border-radius:6px;padding:8px 10px;resize:vertical}' +
    '.bd-row{display:flex;align-items:center;gap:10px;margin-top:8px}.bd-btn{background:#1a2340;color:#fff;border:0;border-radius:999px;padding:8px 18px;font:600 15px "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:inset 0 -2px 0 #c7922c}' +
    '.bd-fb{margin-top:10px;font:15.5px/1.5 "Segoe UI",Arial,sans-serif;color:#1a2340}.bd-fb[hidden]{display:none}' +
    '.bd-req{list-style:none;margin:0 0 6px;padding:0}.bd-req li{margin:2px 0}.bd-req .y{color:#1d5e20;font-weight:700}.bd-req .n{color:#8f1d12;font-weight:700}' +
    '.bd-slip{background:#fbe8e5;border:1px solid #d99a90;border-radius:6px;padding:8px 12px;margin:6px 0}.bd-slip ul{margin:4px 0 0;padding-left:20px}' +
    '.bd-ok{background:#e6f2e6;border:1px solid #7fb07f;border-radius:6px;padding:8px 12px;margin:6px 0;color:#1d5e20;font-weight:600}' +
    '.bd .jt-key{position:sticky;top:12px;background:#fbf6e9;border:1px solid #c9b58a;border-top:4px solid #8e1b2c;border-radius:8px;padding:12px 14px;font-size:15px;line-height:1.45;color:#1a2340}' +
    '.bd .jt-key h4{margin:0 0 6px;font-size:15px;color:#8e1b2c;letter-spacing:.3px}.bd .jt-key h5{margin:10px 0 3px;font-size:13px;color:#0e1c42;text-transform:uppercase;letter-spacing:.4px}' +
    '.bd .jt-key ul{margin:0;padding:0;list-style:none}.bd .jt-key li{padding:1px 0}.bd .jt-key li b{color:#0e1c42}' +
    '.bd .jt-key .boot{margin-top:8px;padding:6px 8px;background:#f3e2b3;border-radius:6px;font-size:14px}' +
    '@media (max-width:720px){.bd{grid-template-columns:1fr}.bd .jt-key{position:static}}';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function build(root) {
    var cfg = JSON.parse(root.getAttribute('data-borrador'));
    var key = root.querySelector('aside.jt-key');
    root.classList.add('bd');
    var main = el('div', 'bd-main');
    main.appendChild(el('div', 'bd-k', '&#9998; PLAN YOUR RECORDING &middot; write it here, read it aloud, then record'));
    if (cfg.intro) main.appendChild(el('p', '', cfg.intro));
    var ta = el('textarea', 'journal-box');
    ta.id = 'mw-' + cfg.id; ta.lang = 'es'; ta.spellcheck = false; ta.setAttribute('data-label', cfg.label || 'My Tarea oral plan');
    ta.setAttribute('placeholder', 'Write your sentences here in Spanish.');
    if (cfg.starters && cfg.starters.length) {
      var st = el('div', 'bd-st');
      st.appendChild(el('span', '', '<span style="font-size:14px;color:#5f554a;align-self:center">Starters (click to add):</span>'));
      cfg.starters.forEach(function (s) {
        var b = el('button', '', esc(s)); b.type = 'button';
        b.addEventListener('click', function () {
          var v = ta.value; ta.value = v + (v && !/\s$/.test(v) ? ' ' : '') + s.replace(/…$/, '') + ' ';
          ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
        });
        st.appendChild(b);
      });
      main.appendChild(st);
    }
    main.appendChild(ta);
    var row = el('div', 'bd-row'), btn = el('button', 'bd-btn', 'Check my plan'); btn.type = 'button'; row.appendChild(btn);
    row.appendChild(el('span', '', '<span style="font-size:13px;color:#5f554a;font-style:italic">Practice only &mdash; nothing here is graded.</span>'));
    main.appendChild(row);
    var fb = el('div', 'bd-fb'); fb.hidden = true; fb.setAttribute('aria-live', 'polite'); main.appendChild(fb);
    root.insertBefore(main, root.firstChild);
    if (key) root.appendChild(key);
    var checked = false;
    function check() {
      var t = ' ' + ta.value.toLowerCase().replace(/[.,;:!?¿¡«»"()]/g, ' ').replace(/\s+/g, ' ') + ' ';
      if (!ta.value.trim()) { fb.hidden = false; fb.innerHTML = '<div class="bd-slip">Write your plan first, then check it.</div>'; return; }
      var allMet = true, h = '<ul class="bd-req">';
      (cfg.require || []).forEach(function (r) {
        var m = t.match(new RegExp(r.re, 'g')) || [];
        if (r.distinct) m = m.filter(function (x, i) { return m.indexOf(x) === i; });
        var ok = m.length >= (r.min || 1); if (!ok) allMet = false;
        h += '<li><span class="' + (ok ? 'y">&#10003;' : 'n">&#9675;') + '</span> ' + r.label + (ok ? '' : ' <em>(found ' + m.length + ')</em>') + '</li>';
      });
      h += '</ul>';
      var slips = [];
      (cfg.rules || []).forEach(function (r) { if (new RegExp(r.re).test(t) && slips.indexOf(r.msg) < 0) slips.push(r.msg); });
      if (slips.length) h += '<div class="bd-slip"><strong>Look again:</strong><ul><li>' + slips.join('</li><li>') + '</li></ul></div>';
      else if (allMet) h += '<div class="bd-ok">' + (cfg.ready || 'Ready! Read it aloud twice, then record.') + '</div>';
      fb.hidden = false; fb.innerHTML = h; checked = true;
    }
    btn.addEventListener('click', check);
    ta.addEventListener('input', function () { if (checked) check(); });
  }
  function init() {
    if (!document.getElementById('bd-css')) { var s = document.createElement('style'); s.id = 'bd-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.borrador'), function (r) { if (!r.dataset.bdReady) { r.dataset.bdReady = '1'; build(r); } });
  }
  // load this script at the end of <body>, BEFORE my-work.js: it builds at once so my-work finds the journal box
  init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
})();

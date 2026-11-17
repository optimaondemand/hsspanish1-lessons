/* flujo.js: "¿Qué cambia?", a click-through flow chart (Spanish 1 S2, Lesson 3.03; David 2026-11-16).
   Two separate changes can happen to a verb: a special yo form (salgo, hago, tengo) and the boot stem change
   (quiero, puedes, tienen; nosotros outside the boot). Tener does both. For each verb + subject the student answers
   the chart's questions (Sí / No on the arrows); the path lights up; a wrong turn says why; at the end of the path
   the student picks the right form. Markup: <div class="flujo" data-flujo='{"verbs":{...},"items":[...]}'></div>
   verbs: {"tener": {"yo": "tengo", "boot": "e→ie", "rest": "tienes, tiene, tienen", "nos": "tenemos"}, ...}
   items: [{"v": "tener", "s": "ella", "yo": false, "nos": false, "answer": "tiene", "options": [...], "why": "..."}]
   Practice only; reports to All Your Work with a 'mw-game' event when every verb is done. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CSS =
    '.fj{font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.fj svg{display:block;width:100%;height:auto;max-width:980px;margin:0 auto}' +
    '.fj .q text{font-size:23px;font-weight:700;fill:#1a2340}.fj .q text.sm{font-size:17px;font-weight:600;fill:#5f554a}' +
    '.fj .flow{stroke:#fff3c4;stroke-width:3;fill:none;stroke-dasharray:6 16;stroke-linecap:round;animation:fjflow 1s linear infinite;pointer-events:none}@keyframes fjflow{to{stroke-dashoffset:-44}}' +
    '.fj .arrive{animation:fjpulse 1.1s ease-out}@keyframes fjpulse{0%{stroke-width:3;filter:none}35%{stroke-width:9;filter:url(#fjglow)}100%{stroke-width:3.5;filter:none}}' +
    '.fj .btn{cursor:pointer}.fj .btn rect{fill:#fff;stroke:#8e1b2c;stroke-width:3}.fj .btn text{font-size:22px;font-weight:800;fill:#8e1b2c}' +
    '.fj .btn:hover rect,.fj .btn:focus rect{fill:#8e1b2c}.fj .btn:hover text,.fj .btn:focus text{fill:#fff}.fj .btn:focus{outline:none}' +
    '.fj .btn.off{display:none}.fj .shake{animation:fjshake .4s}@keyframes fjshake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '.fj-fb{min-height:28px;margin:10px auto 0;max-width:860px;font-size:18px;line-height:1.5}.fj-fb.no{color:#8f1d12}.fj-fb.ok{color:#1d5e20;font-weight:600}' +
    '.fj-pick{max-width:860px;margin:10px auto 0;display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:18px}.fj-pick[hidden]{display:none}' +
    '.fj-pick button{font:700 21px "Segoe UI",Arial,sans-serif;background:#fff;color:#1a2340;border:2px solid #c9b58a;border-radius:999px;padding:7px 22px;cursor:pointer}' +
    '.fj-pick button:hover{background:#f7ecd2}.fj-pick button.no{background:#fbe8e5;border-color:#C0392B;color:#8f1d12}.fj-pick button.ok{background:#2A9D5C;border-color:#2A9D5C;color:#fff}' +
    '.fj-bar{max-width:860px;margin:12px auto 0;display:flex;align-items:center;gap:10px}.fj-dots{display:flex;gap:6px}.fj-dots i{width:14px;height:14px;border-radius:50%;background:#d9ccb0}.fj-dots i.done{background:#2A9D5C}.fj-dots i.on{background:#b8892e}' +
    '.fj-next{margin-left:auto;font:600 16px "Segoe UI",Arial,sans-serif;background:#1a2340;color:#fff;border:0;border-radius:999px;padding:8px 20px;cursor:pointer}.fj-next[hidden]{display:none}';
  function svg(tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  // the chart: diamonds (questions) and boxes (results); edges carry the Sí / No buttons
  // the chart: diamonds (questions) and boxes (results); edges carry the Sí / No buttons.
  // Every path runs DOWN the chart (David 2026-11-17): "Is it a boot verb?" sits below both earlier questions,
  // so a yo verb with no special yo form (querer, poder) drops into it instead of crossing sideways.
  var N = {   // x, y = centre; w, h = half-width / half-height of a diamond, or the size of a box
    start: { x: 500, y: 40, kind: 'start' },
    d1: { x: 500, y: 145, w: 175, h: 56, kind: 'q', lines: ['Is the subject yo?'] },
    d2: { x: 230, y: 290, w: 205, h: 80, kind: 'q', lines: ['Does the verb have', 'a special yo form?'], sm: 'hago · salgo · tengo' },
    d3: { x: 500, y: 450, w: 185, h: 68, kind: 'q', lines: ['Is it a boot verb?'], sm: 'querer · poder · tener…' },
    d4: { x: 500, y: 645, w: 175, h: 62, kind: 'q', lines: ['Is the subject', 'nosotros?'] },
    r1: { x: 175, y: 575, w: 290, h: 104, kind: 'r', lines: ['Use the special', 'yo form'], sm: 'salgo · hago · tengo (only yo)', col: '#9a6e14' },
    r2: { x: 500, y: 815, w: 330, h: 86, kind: 'r', lines: ['Change the stem'], sm: 'e→ie · o→ue + the normal ending', col: '#8e1b2c' },
    r3: { x: 860, y: 815, w: 236, h: 96, kind: 'r', lines: ['Regular:', 'keep the stem'], sm: '+ the normal ending', col: '#1d4e8f' }
  };
  var E = [   // from, to, label, the line's points, where the Sí / No button sits
    { id: 'e0', a: 'start', b: 'd1', pts: [[500, 72], [500, 89]] },
    { id: 'd1y', a: 'd1', b: 'd2', lab: 'Sí', pts: [[325, 145], [230, 145], [230, 210]], btn: [262, 145] },
    { id: 'd1n', a: 'd1', b: 'd3', lab: 'No', pts: [[500, 201], [500, 382]], btn: [500, 300] },
    { id: 'd2y', a: 'd2', b: 'r1', lab: 'Sí', pts: [[230, 370], [230, 523]], btn: [230, 470] },
    { id: 'd2n', a: 'd2', b: 'd3', lab: 'No', pts: [[333, 330], [405, 414]], btn: [369, 372] },
    { id: 'd3y', a: 'd3', b: 'd4', lab: 'Sí', pts: [[500, 518], [500, 583]], btn: [500, 550] },
    { id: 'd3n', a: 'd3', b: 'r3', lab: 'No', pts: [[685, 450], [925, 450], [925, 767]], btn: [925, 600] },
    { id: 'd4y', a: 'd4', b: 'r3', lab: 'Sí', pts: [[675, 645], [800, 645], [800, 767]], btn: [800, 712] },
    { id: 'd4n', a: 'd4', b: 'r2', lab: 'No', pts: [[500, 707], [500, 772]], btn: [500, 740] }
  ];

  function Flujo(root) {
    var cfg = JSON.parse(root.getAttribute('data-flujo')), f = this;
    this.cfg = cfg; this.root = root; root.classList.add('fj');
    this.items = cfg.items.slice(); this.i = 0; this.firstTry = 0;
    var s = this.svg = svg('svg', { viewBox: '0 0 1000 870', role: 'img', 'aria-label': 'A flow chart: Is the subject yo? Does the verb have a special yo form? Is it a boot verb? Is the subject nosotros?' }, root);
    svg('defs', {}, s).innerHTML = '<marker id="fjarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8a7a5a"/></marker>' +
      '<marker id="fjarr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="18" markerHeight="18" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e0a82e"/></marker>' +
      '<filter id="fjglow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="910"><feGaussianBlur stdDeviation="4" result="b"/><feFlood flood-color="#ffcf4a" flood-opacity=".85"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    this.lines = {}; this.flows = {}; this.btns = {}; this.nodes = {};
    E.forEach(function (e) { var pts = e.pts.map(function (p) { return p.join(','); }).join(' ');
      f.lines[e.id] = svg('polyline', { points: pts, fill: 'none', stroke: '#c9b58a', 'stroke-width': 3, 'marker-end': 'url(#fjarr)' }, s);
      f.flows[e.id] = svg('polyline', { points: pts, 'class': 'flow', style: 'display:none' }, s); });
    Object.keys(N).forEach(function (k) {
      var n = N[k], g = svg('g', { 'class': n.kind === 'q' ? 'q' : 'q' }, s), shape;
      if (n.kind === 'q') { var w = n.w, h = n.h; shape = svg('polygon', { points: [[n.x, n.y - h], [n.x + w, n.y], [n.x, n.y + h], [n.x - w, n.y]].map(function (p) { return p.join(','); }).join(' '), fill: '#fffdf7', stroke: '#b8892e', 'stroke-width': 2.5 }, g); }
      else if (n.kind === 'r') shape = svg('rect', { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, rx: 14, fill: '#fffdf7', stroke: n.col, 'stroke-width': 3.5 }, g);
      else shape = svg('rect', { x: n.x - 200, y: n.y - 34, width: 400, height: 68, rx: 34, fill: '#1a2340' }, g);
      n.shape = shape;
      if (n.kind === 'start') { n.text = svg('text', { x: n.x, y: n.y + 11, 'text-anchor': 'middle', style: 'font-size:32px;font-weight:800;fill:#fff' }, g); }
      else {
        var LH = 27, lines = n.lines, base = n.y - (lines.length - 1) * LH / 2 - (n.sm ? 11 : 0);
        lines.forEach(function (t, i) { var tx = svg('text', { x: n.x, y: base + i * LH + 8, 'text-anchor': 'middle' }, g); tx.textContent = t; if (n.kind === 'r') tx.setAttribute('fill', n.col); });
        if (n.sm) { var sm = svg('text', { x: n.x, y: base + (lines.length - 1) * LH + 8 + 25, 'text-anchor': 'middle', 'class': 'sm' }, g); sm.textContent = n.sm; }
      }
      f.nodes[k] = g;
    });
    E.forEach(function (e) {
      if (!e.lab) return;
      var g = svg('g', { 'class': 'btn off', tabindex: 0, role: 'button', 'aria-label': e.lab + ' (' + e.a + ')' }, s);
      svg('rect', { x: e.btn[0] - 34, y: e.btn[1] - 20, width: 68, height: 40, rx: 20 }, g);
      var t = svg('text', { x: e.btn[0], y: e.btn[1] + 8, 'text-anchor': 'middle' }, g); t.textContent = e.lab;
      var go = function () { f.choose(e); };
      g.addEventListener('click', go); g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
      f.btns[e.id] = g;
    });
    this.fb = el('div', 'fj-fb'); root.appendChild(this.fb);
    this.pick = el('div', 'fj-pick'); this.pick.hidden = true; root.appendChild(this.pick);
    var bar = el('div', 'fj-bar'); this.dots = el('div', 'fj-dots'); this.next = el('button', 'fj-next', 'Next verb &rarr;'); this.next.type = 'button'; this.next.hidden = true;
    bar.appendChild(this.dots); bar.appendChild(this.next); root.appendChild(bar);
    for (var d = 0; d < this.items.length; d++) this.dots.appendChild(el('i'));
    this.next.addEventListener('click', function () { f.i++; f.show(); });
    this.show();
  }
  var fp = Flujo.prototype;
  fp.route = function (it) {   // the correct edge out of each question for this item
    var v = this.cfg.verbs[it.v];
    return { d1: it.yo ? 'd1y' : 'd1n', d2: v.yo ? 'd2y' : 'd2n', d3: v.boot ? 'd3y' : 'd3n', d4: it.nos ? 'd4y' : 'd4n' };
  };
  fp.show = function () {
    var f = this, it = this.items[this.i];
    [].forEach.call(this.dots.children, function (d, k) { d.className = k < f.i ? 'done' : k === f.i ? 'on' : ''; });
    this.next.hidden = true; this.pick.hidden = true; this.pick.innerHTML = '';
    if (!it) return this.finish();
    this.tries = 0; this.wrongs = 0; this.token = (this.token || 0) + 1;   // timers from the last verb do nothing
    Object.keys(this.lines).forEach(function (k) { var L = f.lines[k]; L.setAttribute('stroke', '#c9b58a'); L.setAttribute('stroke-width', 3); L.setAttribute('marker-end', 'url(#fjarr)'); L.removeAttribute('filter'); L.style.transition = 'none'; L.style.strokeDasharray = ''; L.style.strokeDashoffset = ''; f.flows[k].style.display = 'none'; });
    Object.keys(N).forEach(function (k) { N[k].shape.classList.remove('arrive'); });
    Object.keys(N).forEach(function (k) { N[k].shape.setAttribute('fill', N[k].kind === 'start' ? '#1a2340' : '#fffdf7'); });
    N.start.text.textContent = it.v + '  ·  ' + it.s;
    this.light('e0'); this.at('d1');
    this.fb.className = 'fj-fb'; this.fb.innerHTML = 'Start at the top: <strong>' + it.v + '</strong> with the subject <strong>' + it.s + '</strong>. Answer each question with <strong>Sí</strong> or <strong>No</strong>.';
  };
  fp.light = function (id) {
    var f = this, tok = this.token, L = this.lines[id], F = this.flows[id], len = 400;
    try { len = L.getTotalLength(); } catch (e) {}
    L.setAttribute('stroke', '#e0a82e'); L.setAttribute('stroke-width', 6); L.setAttribute('marker-end', 'url(#fjarr2)'); L.setAttribute('filter', 'url(#fjglow)');
    L.style.transition = 'none'; L.style.strokeDasharray = len + ' ' + len; L.style.strokeDashoffset = len;   // the line draws itself in
    void L.getBoundingClientRect(); L.style.transition = 'stroke-dashoffset .55s ease-out'; L.style.strokeDashoffset = 0;
    setTimeout(function () { if (f.token !== tok) return; L.style.strokeDasharray = ''; F.style.display = ''; }, 560);   // then light keeps flowing along it
  };
  fp.at = function (node) {
    var f = this; this.cur = node;
    Object.keys(this.btns).forEach(function (k) { f.btns[k].setAttribute('class', 'btn off'); });
    var sh = N[node].shape; sh.setAttribute('fill', '#fbefcf');
    var tk = this.token; setTimeout(function () { if (f.token !== tk) return; sh.classList.remove('arrive'); void sh.getBoundingClientRect(); sh.classList.add('arrive'); }, node === 'd1' ? 0 : 450);
    E.forEach(function (e) { if (e.a === node && e.lab) f.btns[e.id].setAttribute('class', 'btn'); });
    if (N[node].kind === 'r') this.leaf(node);
  };
  fp.choose = function (e) {
    if (e.a !== this.cur) return;   // only the question the student is at can be answered
    var it = this.items[this.i], right = this.route(it)[e.a], v = this.cfg.verbs[it.v];
    if (e.id === right) { N[e.a].shape.setAttribute('fill', '#eef6ee'); this.light(e.id); this.fb.className = 'fj-fb'; this.fb.innerHTML = ''; this.at(e.b); return; }
    this.wrongs++;
    var g = this.btns[e.id]; g.classList.remove('shake'); void g.getBBox(); g.classList.add('shake');
    var msg = {
      d1: it.yo ? 'The subject is <strong>yo</strong>.' : 'The subject is <strong>' + it.s + '</strong>, not yo.',
      d2: v.yo ? '<em>' + it.v + '</em> has a special yo form: <strong>' + v.yo + '</strong>.' : '<em>' + it.v + '</em> has no special yo form. (Its yo form comes from the boot or stays regular.)',
      d3: v.boot ? '<em>' + it.v + '</em> is a boot verb (' + v.boot + '): <strong>' + v.rest + '</strong>.' : '<em>' + it.v + '</em> is not a boot verb: <strong>' + v.rest + '</strong> keep the same stem.',
      d4: it.nos ? 'The subject is <strong>nosotros</strong>, and nosotros is outside the boot.' : '<strong>' + it.s + '</strong> is inside the boot. Only nosotros is outside.'
    }[e.a];
    this.fb.className = 'fj-fb no'; this.fb.innerHTML = 'Not that way. ' + msg;
  };
  fp.leaf = function (node) {
    var f = this, it = this.items[this.i];
    this.fb.className = 'fj-fb'; this.fb.innerHTML = '';
    this.pick.hidden = false; this.pick.innerHTML = '<strong style="margin-right:6px">' + it.s + ' &hellip;</strong>';
    shuffle(it.options.slice()).forEach(function (o) {
      var b = el('button', null, o); b.type = 'button';
      b.addEventListener('click', function () {
        if (f.pick.dataset.done) return;
        if (o === it.answer) {
          f.pick.dataset.done = '1'; b.classList.add('ok'); if (!f.wrongs) f.firstTry++;
          f.fb.className = 'fj-fb ok'; f.fb.innerHTML = '&#10003; <strong>' + it.s + ' ' + it.answer + '</strong>. ' + it.why;
          f.next.hidden = false; f.next.innerHTML = f.i < f.items.length - 1 ? 'Next verb &rarr;' : 'Finish &rarr;';
        } else { f.wrongs++; b.classList.add('no'); f.fb.className = 'fj-fb no'; f.fb.innerHTML = 'Not <strong>' + o + '</strong>. Follow your path: the box at the end says what to do.'; }
      });
      f.pick.appendChild(b);
    });
    delete this.pick.dataset.done;
  };
  fp.finish = function () {
    var f = this;
    [].forEach.call(this.dots.children, function (d) { d.className = 'done'; });
    this.fb.className = 'fj-fb ok';
    this.fb.innerHTML = '&iexcl;Muy bien! ' + this.firstTry + ' of ' + this.items.length + ' with no wrong turns. Two separate questions: <strong>Is it yo?</strong> (special yo form) and <strong>Is it inside the boot?</strong> (stem change). <em>Tener</em> says yes to both.';
    var again = el('button', 'fj-next', 'Play again'); again.type = 'button';
    again.addEventListener('click', function () { again.remove(); f.i = 0; f.firstTry = 0; f.items = shuffle(f.items); f.show(); });
    this.next.parentNode.appendChild(again);
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: '¿Qué cambia? (flow chart)', done: true, summary: this.firstTry + ' of ' + this.items.length + ' verbs with no wrong turns' } })); } catch (e) {}
  };

  function boot() {
    if (!document.getElementById('fj-css')) { var s = document.createElement('style'); s.id = 'fj-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.flujo'), function (r) { if (!r.dataset.fjReady) { r.dataset.fjReady = '1'; try { new Flujo(r); } catch (e) { if (window.console) console.error('flujo', e); } } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

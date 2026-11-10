/* marque.js (Spanish 1 copy, 2026-11-10: cfg.lang / yes / bravo / doneTitle configurable): "Annote le texte" for any reading, in steps (David 2026-10-23: replace "on a printout, circle / underline /
   match" tasks with an on-page tool, as in Lesson 1.05). Same look as annotate.js. Each step is its own task: when it is
   finished the page shows the result briefly, then wipes clean for the next step.
   Markup: <div class="marque" data-config='{"id", "title", "paras": [[token, ...], ...], "steps": [step, ...], "legend"?}'></div>
   token = "plain text" | {"t": "En", "keys": ["prep"]} | {"t": "Bretagne", "keys": ["reg"], "to": ["ouest"], "label": "west"}
         | {"t": "ouest", "id": "ouest"} ; any token may carry "hint": {"<step key>": "why this is not one"} or a string.
   step = {"kind": "find", "key": "prep", "mark": "circle" | "underline", "colour": "m" | "f" | "gold", "label", "intro", "wrong"?}
        | {"kind": "link", "key": "reg", "label", "intro", "wrong"?}   (tap a token with that key, then one of its "to" ids)
   Reports to "All Your Work" with a 'mw-game' event when finished. One shared file; no libraries. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', COL = { m: '#2b4c8c', f: '#8c2f39', gold: '#b8892e' };
  var CSS = '\
.mq{--ink:#1d2a44;--gold:#b8892e;--gold-lt:#e9d39a;--cream:#fbf6ea;--rule:#e2d6bb;--muted:#5e5a52;--ok:#2f6b4f;color:var(--ink)}\
.mq-steps{display:flex;flex-direction:column;gap:6px;font-size:17px;line-height:1.4;color:var(--muted);margin:0 0 12px}.mq-steps b{color:var(--ink)}\
.mq-steps span{display:block;padding:5px 12px;border-left:4px solid var(--rule);border-radius:2px}\
.mq-steps span.on{color:var(--ink);font-weight:600;background:#fbf3df;border-left-color:var(--gold)}.mq-steps span.done{color:var(--ok);border-left-color:var(--ok)}\
.mq-steps span.done::after{content:" \\2713";font-weight:700}\
.mq-page{position:relative;background:#fffdf7;border:1px solid var(--rule);outline:1px solid var(--gold-lt);outline-offset:-7px;border-radius:2px;padding:30px 30px 26px;box-shadow:0 6px 16px rgba(60,40,10,.12)}\
.mq-p{font-family:"Cormorant Garamond",Garamond,Georgia,serif;font-size:26px;line-height:2.6;margin:0 0 6px;position:relative;z-index:1}\
.mq-w{cursor:pointer;border-radius:999px;padding:1px 4px;margin:0 -2px;border:2px solid transparent;position:relative;transition:background .15s,border-color .3s}\
.mq-w.apos{margin-right:-7px}.mq-w:hover{background:#f7ecd2}.mq-w:focus-visible{outline:3px solid #2b4c8c;outline-offset:2px}\
.mq-w.sel{border-color:var(--gold);background:#fff4d6;animation:mqpulse 1s ease-in-out infinite}@keyframes mqpulse{50%{box-shadow:0 0 0 4px rgba(184,137,46,.25)}}\
.mq-w.c-m{border-color:#2b4c8c}.mq-w.c-f{border-color:#8c2f39}.mq-w.c-gold{border-color:#b8892e}\
.mq-w.u-m,.mq-w.u-f,.mq-w.u-gold{border-radius:0;border-color:transparent}.mq-w.u-m{border-bottom:3px solid #2b4c8c}.mq-w.u-f{border-bottom:3px solid #8c2f39}.mq-w.u-gold{border-bottom:3px solid #b8892e}\
.mq-w.lk{border-color:#2b4c8c}.mq-w.tgt{border-radius:0;border-bottom:3px solid #8c2f39}\
.mq-w[data-lab]::before{content:attr(data-lab);position:absolute;left:50%;bottom:-1.35em;transform:translateX(-50%);font-family:"Segoe UI",Arial,sans-serif;font-size:11px;font-weight:700;color:#2b4c8c;white-space:nowrap;letter-spacing:.03em;line-height:1.4}\
.mq-wiping .mq-w{border-color:transparent!important}.mq-wiping .mq-w::before{opacity:0;transition:opacity .8s}\
.mq-w.bad{animation:mqshake .4s}@keyframes mqshake{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}\
.mq-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:visible}.mq-arrow{fill:none;stroke-width:2.4;stroke-linecap:round}\
.mq-bar{margin-top:12px;min-height:54px;background:var(--cream);border:1px solid var(--rule);border-left:4px solid var(--gold);border-radius:3px;padding:10px 14px;font-size:16px;line-height:1.5}\
.mq-bar.no{border-left-color:#8c2f39}.mq-bar.ok{border-left-color:var(--ok)}\
.mq-meter{display:flex;gap:4px;margin:10px 0 0}.mq-meter i{flex:1;height:6px;border-radius:3px;background:#e8e1d2}.mq-meter i.on{background:var(--gold)}\
.mq-key{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13.5px;color:var(--muted);margin-top:8px}.mq-key i{display:inline-block;width:22px;height:3px;vertical-align:middle;margin-right:5px;border-radius:2px}\
.mq-done{margin-top:12px;text-align:center}.mq-done h4{font-family:"Cormorant Garamond",Georgia,serif;font-size:28px;font-weight:600;margin:0}\
.mq-reset{font:inherit;font-size:13px;margin-top:8px;background:transparent;border:1px solid var(--gold);color:var(--muted);border-radius:999px;padding:4px 14px;cursor:pointer}\
@media (max-width:600px){.mq-p{font-size:21px;line-height:2.7}.mq-page{padding:24px 14px 18px}}\
@media (prefers-reduced-motion:reduce){.mq-w.sel,.mq-w.bad{animation:none}}';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function sv(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function has(tk, k) { return (tk.keys || []).indexOf(k) >= 0; }

  function Marque(root, cfg) {
    var self = this; this.root = root; this.cfg = cfg; root.classList.add('mq');
    this.stepsEl = el('div', 'mq-steps'); root.appendChild(this.stepsEl);
    this.page = el('div', 'mq-page'); root.appendChild(this.page);
    this.words = []; this.ids = {};
    cfg.paras.forEach(function (para) {
      var p = el('p', 'mq-p'); p.lang = cfg.lang || 'fr';
      para.forEach(function (tk) {
        if (typeof tk === 'string') { p.appendChild(document.createTextNode(tk)); return; }
        var w = el('span', 'mq-w' + (/[’']$/.test(tk.t) ? ' apos' : '')); w.textContent = tk.t; w.tabIndex = 0; w.setAttribute('role', 'button'); w._tk = tk; self.words.push(w);
        if (tk.id) self.ids[tk.id] = w;
        w.addEventListener('click', function () { self.tap(w); });
        w.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.tap(w); } });
        p.appendChild(w);
      });
      self.page.appendChild(p);
    });
    this.svg = sv('svg', { 'class': 'mq-svg', 'aria-hidden': 'true' }, this.page);
    var mk = sv('marker', { id: 'mqHead' + cfg.id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, sv('defs', {}, this.svg));
    sv('path', { d: 'M0,0 L10,5 L0,10 z', fill: COL.m }, mk);
    this.bar = el('div', 'mq-bar'); root.appendChild(this.bar);
    this.meter = el('div', 'mq-meter'); root.appendChild(this.meter);
    if (cfg.legend) root.appendChild(el('div', 'mq-key', cfg.legend));
    this.links = []; this.k = 0; this.sel = null; this.wrong = 0; this.found = [];
    window.addEventListener('resize', function () { self.draw(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.draw(); });
    this.start();
  }
  Marque.prototype.step = function () { return this.cfg.steps[this.k]; };
  Marque.prototype.targets = function () { var st = this.step(); return this.words.filter(function (w) { return has(w._tk, st.key); }); };
  Marque.prototype.say = function (h, c) { this.bar.className = 'mq-bar' + (c ? ' ' + c : ''); this.bar.innerHTML = h; };
  Marque.prototype.start = function () { this.found = []; this.links = []; this.sel = null; this.say(this.step().intro); this.update(); };
  Marque.prototype.update = function () {
    var self = this, k = this.k;
    this.stepsEl.innerHTML = this.cfg.steps.map(function (st, i) {
      var n = self.words.filter(function (w) { return has(w._tk, st.key); }).length, d = i < k ? n : i === k ? (st.kind === 'link' ? self.links.length : self.found.length) : 0;
      return '<span class="' + (i < k ? 'done' : i === k ? 'on' : '') + '">' + (i + 1) + ' &middot; ' + st.label + ': <b>' + d + ' / ' + n + '</b></span>';
    }).join('');
    var n = this.k < this.cfg.steps.length ? this.targets().length : 0, d = this.step() && this.step().kind === 'link' ? this.links.length : this.found.length, h = '';
    for (var i = 0; i < n; i++) h += '<i class="' + (i < d ? 'on' : '') + '"></i>'; this.meter.innerHTML = h;
  };
  Marque.prototype.hint = function (tk, st) { var h = tk.hint; return (h && typeof h === 'object' ? h[st.key] : h) || st.wrong || 'Not that one.'; };
  Marque.prototype.bad = function (w, msg) { this.wrong++; w.classList.remove('bad'); void w.offsetWidth; w.classList.add('bad'); this.say(msg, 'no'); };
  Marque.prototype.tap = function (w) {
    var st = this.step(), tk = w._tk; if (!st) return;
    if (st.kind === 'find') {
      if (has(tk, st.key)) {
        if (this.found.indexOf(w) >= 0) { this.say('<em>' + tk.t + '</em> is already marked. Find the next one.'); return; }
        w.classList.add((st.mark === 'underline' ? 'u-' : 'c-') + (st.colour || 'm')); this.found.push(w);
        var left = this.targets().length - this.found.length;
        this.say((this.cfg.yes || '<strong>Oui&nbsp;!</strong>') + ' ' + (tk.why || '') + ' ' + (left ? left + ' to go.' : ''), 'ok'); this.update();
        if (!left) this.next(); return;
      }
      this.bad(w, this.hint(tk, st)); return;
    }
    // link step: a key token first, then one of its targets
    if (this.sel) {
      var a = this.sel;
      if (w === a) { a.classList.remove('sel'); this.sel = null; this.say(st.intro); return; }
      if (has(tk, st.key) && !w.linked) { a.classList.remove('sel'); this.sel = null; return this.tap(w); }
      if (tk.id && (a._tk.to || []).indexOf(tk.id) >= 0) {
        a.classList.remove('sel'); this.sel = null; a.classList.add('lk'); a.linked = true; w.classList.add('tgt');
        if (a._tk.label) a.setAttribute('data-lab', a._tk.label);
        this.links.push({ a: a, n: w }); this.draw(); this.update();
        var left = this.targets().length - this.links.length;
        this.say((this.cfg.yes || '<strong>Oui&nbsp;!</strong>') + ' <em>' + a._tk.t + '</em> &rarr; <em>' + tk.t + '</em>' + (a._tk.label ? ' (' + a._tk.label + ')' : '') + '. ' + (left ? left + ' to go.' : ''), 'ok');
        if (!left) this.next(); return;
      }
      this.bad(w, st.wrong || 'Not that one. Read the sentence again: which word goes with <em>' + a._tk.t + '</em>?'); return;
    }
    if (has(tk, st.key)) {
      if (w.linked) { this.say('<em>' + tk.t + '</em> is already linked. Pick another one.'); return; }
      w.classList.add('sel'); this.sel = w; this.say('<em>' + tk.t + '</em> is circled. ' + (st.then || 'Now tap the word it goes with.')); return;
    }
    this.bad(w, this.hint(tk, st));
  };
  Marque.prototype.next = function () {
    var self = this; this.k++; if (this.k < this.cfg.steps.length) this.found = []; this.update();
    if (this.k >= this.cfg.steps.length) return this.end();
    if (this.cfg.keep) {   // marks stay on the page so later steps can work by elimination (David 2026-11-10)
      setTimeout(function () {
        if (self.k >= self.cfg.steps.length) return;
        self.start(); self.say(self.step().intro + ' <em>Your marks from the last step stay on the page.</em>');
      }, 1600);
      return;
    }
    setTimeout(function () { self.svg.style.transition = 'opacity .8s'; self.svg.style.opacity = '0'; self.page.classList.add('mq-wiping'); }, 1600);
    setTimeout(function () {
      if (self.k >= self.cfg.steps.length) return;   // the last step was finished during the pause (2026-10-28)
      self.words.forEach(function (w) { w.className = 'mq-w'; w.linked = false; w.removeAttribute('data-lab'); });
      [].slice.call(self.svg.querySelectorAll('.mq-arrow')).forEach(function (p) { p.remove(); });
      self.svg.style.transition = ''; self.svg.style.opacity = ''; self.page.classList.remove('mq-wiping');
      self.start(); self.say('<strong>Step ' + (self.k + 1) + ' &middot; a new task.</strong> The page is clean again. ' + self.step().intro);
    }, 2500);
  };
  Marque.prototype.draw = function () {
    var svg = this.svg, box = this.page.getBoundingClientRect(), id = this.cfg.id;
    [].slice.call(svg.querySelectorAll('.mq-arrow')).forEach(function (p) { p.remove(); });
    this.links.forEach(function (L) {
      var ra = L.a.getBoundingClientRect(), rn = L.n.getBoundingClientRect();
      var x1 = ra.left + ra.width / 2 - box.left, y1 = ra.top - box.top + 2, x2 = rn.left + rn.width / 2 - box.left, y2 = rn.top - box.top + 2;
      var lift = 16 + Math.min(34, Math.abs(x2 - x1) * .12) + (Math.abs(y2 - y1) > 10 ? 10 : 0), cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - lift;
      sv('path', { 'class': 'mq-arrow', d: 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ',' + y2.toFixed(1),
        stroke: COL.m, 'marker-end': 'url(#mqHead' + id + ')' }, svg);
    });
  };
  Marque.prototype.end = function () {
    var self = this;
    this.say((this.cfg.bravo || '<strong>Bravo&nbsp;!</strong>') + ' ' + (this.cfg.doneText || 'Every step is done.'), 'ok');
    var d = el('div', 'mq-done', '<h4>' + (this.cfg.doneTitle || 'Texte annot&eacute;&nbsp;!') + '</h4><div style="font-size:15px;color:#5e5a52">' + (this.wrong === 0 ? 'No slips at all.' : this.wrong + ' wrong tap' + (this.wrong > 1 ? 's' : '') + ' along the way, each one fixed.') + '</div>');
    var r = el('button', 'mq-reset', 'Start again'); r.type = 'button'; r.addEventListener('click', function () { self.reset(); }); d.appendChild(r);
    this.root.appendChild(d); this.doneBox = d;
    var sum = this.cfg.steps.map(function (st) { return st.label; }).join('; ');
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title || 'Annote le texte', done: true, summary: 'Finished every step (' + sum + ')' + (this.wrong ? ', ' + this.wrong + ' wrong taps fixed' : ', no slips') + '.' } })); } catch (e) {}
  };
  Marque.prototype.reset = function () {
    this.k = 0; this.wrong = 0; if (this.doneBox) this.doneBox.remove();
    this.words.forEach(function (w) { w.className = 'mq-w'; w.linked = false; w.removeAttribute('data-lab'); });
    [].slice.call(this.svg.querySelectorAll('.mq-arrow')).forEach(function (p) { p.remove(); }); this.start();
  };
  function init() {
    if (!document.getElementById('mq-css')) { var s = document.createElement('style'); s.id = 'mq-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.marque'), function (root, i) {
      if (root.dataset.mqReady) return; root.dataset.mqReady = '1';
      var cfg = JSON.parse(root.getAttribute('data-config')); cfg.id = cfg.id || ('m' + i); new Marque(root, cfg);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

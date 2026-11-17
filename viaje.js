/* viaje.js — "El viaje": the in-lesson voyage map for Spanish 1 S2 (Optima Academy Online).
 * One engine for every module. Data per lesson in <script type="application/json" class="viaje-data">
 * inside <div class="viaje">. Geography = window.VIAJE_GEO (viaje-geo.js, Natural Earth, public domain).
 * Two scenes: the ATLAS (antique-style map of the Spanish-speaking world) and an optional PLAN
 * (a simple street plan of the city in the module's reading) for direction tasks.
 * All art is drawn here in code. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C = { ink: '#2b1d10', sepia: '#6b4a24', red: '#9b1b1b', gold: '#b8862b', sea: '#e8dcc0', land: '#efe3c5',
            tgt: '#e2c47e', here: '#c9962f', water: '#46607a', green: '#2e6b33', blue: '#1f3f78' };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, html, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function merc(lon, lat) {
    var y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
    return [lon, -y];
  }
  function bbox(d) {
    var n = d.match(/-?\d+(?:\.\d+)?/g).map(Number), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < n.length; i += 2) {
      if (n[i] < x0) x0 = n[i]; if (n[i] > x1) x1 = n[i];
      if (n[i + 1] < y0) y0 = n[i + 1]; if (n[i + 1] > y1) y1 = n[i + 1];
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tween(ms, step, done) {
    if (reduce || window.VJ_TEST) { step(1); if (done) done(); return; }
    var t0 = null, fin = false;
    function finish() { if (fin) return; fin = true; step(1); if (done) done(); }
    function f(t) {
      if (fin) return;
      if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (k < 1) { step(e); requestAnimationFrame(f); } else finish();
    }
    requestAnimationFrame(f);
    // animation frames pause in background tabs: a timer makes sure every animation still finishes
    setTimeout(finish, ms + 250);
  }
  function play(src) {
    if (!src) return;
    try { var a = new Audio(src); a.play(); } catch (e) {}
  }
  function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim(); }

  /* ------------------------------------------------------------------ CSS */
  var CSS = [
    '.vj{font-family:"Segoe UI",system-ui,sans-serif;color:#1a2340;border:2px solid #b8862b;border-radius:6px;background:#f7f0de;margin:18px 0;box-shadow:0 2px 0 #e3d3a6;overflow:hidden}',
    '.vj-head{display:flex;align-items:center;gap:14px;padding:10px 16px;background:linear-gradient(#fbf5e4,#f1e5c4);border-bottom:2px solid #b8862b}',
    '.vj-cart{font-family:"IM Fell English SC",Garamond,Georgia,serif;font-size:28px;color:#9b1b1b;line-height:1.05}',
    '.vj-cart small{display:block;font-family:"IM Fell English",Georgia,serif;font-style:italic;font-size:16px;color:#5b4a33}',
    '.vj-log{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}',
    '.vj-seal{width:46px;height:46px;border-radius:50%;border:2px dashed #b9a57a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;line-height:1.05;color:#8a7a5a;text-align:center;background:#fbf6e8}',
    '.vj-seal b{font-family:"IM Fell English SC",Georgia,serif;font-size:13px;font-weight:400}',
    '.vj-seal.done{border:2px solid #9b1b1b;color:#9b1b1b;background:radial-gradient(#fbeee0,#f3d9c2);transform:rotate(-8deg)}',
    '.vj-seal.now{border-color:#b8862b;color:#7a5a12;border-style:solid}',
    '.vj-body{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:0}',
    '@media (max-width:900px){.vj-body{grid-template-columns:1fr}}',
    '.vj-stage{position:relative;background:#e8dcc0;min-height:300px}',
    '.vj-stage svg{display:block;width:100%;height:auto;max-height:640px;user-select:none}',
    '.vj-stage .tgt{cursor:pointer;transition:fill .2s}',
    '.vj-stage .tgt:focus{outline:none}.vj-stage .tgt:not(.on):hover,.vj-stage .tgt:not(.on):focus-visible{fill:#f0d48a}',
    '.vj-tip{position:absolute;pointer-events:none;background:#2b1d10;color:#fbf5e4;font-size:14px;padding:3px 8px;border-radius:4px;display:none;white-space:nowrap}',
    '.vj-panel{padding:16px 18px;border-left:2px solid #d9c592;background:#fbf7ea;display:flex;flex-direction:column;gap:10px}',
    '@media (max-width:900px){.vj-panel{border-left:0;border-top:2px solid #d9c592}}',
    '.vj-stepno{font-size:13px;font-weight:700;letter-spacing:.06em;color:#9b1b1b;text-transform:uppercase}',
    '.vj-prompt{font-size:18px;line-height:1.45;color:#1a2340}',
    '.vj-es{font-family:"IM Fell English",Georgia,serif;font-size:22px;color:#2b1d10;line-height:1.35}',
    '.vj-es .gap{display:inline-block;min-width:70px;border-bottom:2px solid #9b1b1b;text-align:center;color:#9b1b1b}',
    '.vj-en{font-size:15px;color:#4a5570;font-style:italic}',
    '.vj-opts{display:flex;flex-wrap:wrap;gap:8px}',
    '.vj-btn{font:600 16px "Segoe UI",system-ui,sans-serif;border:2px solid #b8862b;background:#fff8e6;color:#2b1d10;border-radius:6px;padding:8px 14px;cursor:pointer}',
    '.vj-btn:hover{background:#f6e6b8}',
    '.vj-btn.primary{background:#9b1b1b;border-color:#7a1414;color:#fff}',
    '.vj-btn.primary:hover{background:#b02222}',
    '.vj-btn.small{font-size:14px;padding:5px 10px}',
    '.vj-btn[disabled]{opacity:.45;cursor:default}',
    '.vj-tile{font:600 16px "Segoe UI",system-ui,sans-serif;border:2px solid #1f3f78;background:#eef2fb;color:#1f3f78;border-radius:18px;padding:6px 12px;cursor:pointer}',
    '.vj-tile:hover{background:#dce5f8}',
    '.vj-said{min-height:46px;border:2px dashed #b9a57a;border-radius:6px;padding:8px 10px;background:#fff;font-family:"IM Fell English",Georgia,serif;font-size:20px;color:#2b1d10}',
    '.vj-fb{font-size:16px;line-height:1.45;border-radius:6px;padding:8px 12px;display:none}',
    '.vj-fb.ok{display:block;background:#e7f3e3;border:2px solid #2e6b33;color:#1d4a22}',
    '.vj-fb.no{display:block;background:#fbeaea;border:2px solid #9b1b1b;color:#6d1212}',
    '.vj-fb.info{display:block;background:#eef2fb;border:2px solid #1f3f78;color:#1a2340}',
    '.vj-fb b.ck{color:#2e6b33;font-size:20px}',
    '.vj-nav{margin-top:auto;display:flex;gap:8px;align-items:center}',
    '.vj-say{border:0;background:none;cursor:pointer;font-size:20px;padding:0 4px;vertical-align:middle}',
    '.vj-credit{font-size:12px;color:#6b5a3a;padding:6px 16px;border-top:1px solid #e3d3a6;background:#f7f0de}',
    '.vj-done{font-family:"IM Fell English",Georgia,serif;font-size:20px;color:#9b1b1b}'
  ].join('\n');
  function addCSS() {
    if (document.getElementById('vj-css')) return;
    var s = document.createElement('style'); s.id = 'vj-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ------------------------------------------------------------- art */
  function defs(svg) {
    var d = el('defs', {}, svg);
    var f = el('filter', { id: 'vj-paper', x: 0, y: 0, width: '100%', height: '100%' }, d);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '.9', numOctaves: 3, seed: 7, result: 'n' }, f);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 .42  0 0 0 0 .3  0 0 0 0 .15  0 0 0 .22 0' }, f);
    var g = el('radialGradient', { id: 'vj-vign', cx: '50%', cy: '50%', r: '75%' }, d);
    el('stop', { offset: '60%', 'stop-color': '#000', 'stop-opacity': 0 }, g);
    el('stop', { offset: '100%', 'stop-color': '#5b3a12', 'stop-opacity': .28 }, g);
    var p = el('pattern', { id: 'vj-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, d);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#9b1b1b', 'stroke-width': 1.4, 'stroke-opacity': .35 }, p);
    return d;
  }
  // compass rose (own drawing): 16 points, fleur-de-lis replaced by a cross for north
  function compass(g, cx, cy, r) {
    var c = el('g', { transform: 'translate(' + cx + ',' + cy + ')', 'pointer-events': 'none' }, g);
    el('circle', { r: r * 1.08, fill: 'none', stroke: C.sepia, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, c);
    el('circle', { r: r * 0.98, fill: 'none', stroke: C.sepia, 'stroke-width': .6, 'vector-effect': 'non-scaling-stroke' }, c);
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8, len = i % 4 === 0 ? r : i % 2 === 0 ? r * .66 : r * .45, wd = i % 4 === 0 ? r * .14 : r * .09;
      var tip = [Math.sin(a) * len, -Math.cos(a) * len], l = [Math.sin(a - Math.PI / 2) * wd, -Math.cos(a - Math.PI / 2) * wd],
          rt = [-l[0], -l[1]];
      el('path', { d: 'M0,0L' + l + 'L' + tip + 'Z', fill: i % 4 === 0 ? C.red : C.gold, stroke: C.ink, 'stroke-width': .5, 'vector-effect': 'non-scaling-stroke' }, c);
      el('path', { d: 'M0,0L' + rt + 'L' + tip + 'Z', fill: i % 4 === 0 ? '#fbf1d8' : '#fbf1d8', stroke: C.ink, 'stroke-width': .5, 'vector-effect': 'non-scaling-stroke' }, c);
    }
    el('circle', { r: r * .07, fill: C.gold, stroke: C.ink, 'stroke-width': .5, 'vector-effect': 'non-scaling-stroke' }, c);
    var n = el('text', { y: -r * 1.2, 'text-anchor': 'middle', 'font-size': r * .3, fill: C.red, 'font-family': 'IM Fell English SC, Georgia, serif' }, c);
    n.textContent = 'N';
    return c;
  }
  // galleon (own drawing), drawn at unit size ~ 10 wide, origin at waterline centre
  function galleon(g, s) {
    var sh = el('g', { 'pointer-events': 'none' }, g);
    var k = el('g', { transform: 'scale(' + s + ')' }, sh);
    var o = { stroke: C.ink, 'stroke-width': .6, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' };
    el('path', Object.assign({ d: 'M-5.2,-1.6 L5.6,-1.8 L4.4,0.4 Q0,1.1 -4.2,0.4 Z', fill: '#7a4a22' }, o), k);    // hull
    el('path', Object.assign({ d: 'M3.6,-1.8 L5.8,-3.0 L5.9,-1.8 Z', fill: '#7a4a22' }, o), k);                      // stern castle
    el('path', Object.assign({ d: 'M-5.2,-1.6 L-7.0,-2.6', fill: 'none' }, o), k);                                     // bowsprit
    el('path', { d: 'M-4.6,-0.9 L4.8,-1.1', stroke: '#e0b04a', 'stroke-width': .8, 'vector-effect': 'non-scaling-stroke' }, k);
    [[-2.6, 6.2], [0.6, 7.4], [3.4, 5.2]].forEach(function (m) {
      el('path', Object.assign({ d: 'M' + m[0] + ',-1.7 L' + m[0] + ',' + (-1.7 - m[1]), fill: 'none' }, o), k);
      var top = -1.7 - m[1];
      el('path', Object.assign({ d: 'M' + (m[0] - 1.5) + ',' + (top + 1.2) + ' Q' + (m[0] + 0.4) + ',' + (top + 2.4) + ' ' + (m[0] + 1.5) + ',' + (top + 1.2) +
        ' L' + (m[0] + 1.7) + ',' + (top + 3.6) + ' Q' + (m[0] + 0.3) + ',' + (top + 4.6) + ' ' + (m[0] - 1.3) + ',' + (top + 3.6) + ' Z', fill: '#fbf3dc' }, o), k);
      el('path', Object.assign({ d: 'M' + (m[0] - 1.2) + ',' + (top + 4.2) + ' Q' + (m[0] + 0.4) + ',' + (top + 5.4) + ' ' + (m[0] + 1.8) + ',' + (top + 4.2) +
        ' L' + (m[0] + 1.9) + ',' + (top + 6.0) + ' Q' + (m[0] + 0.4) + ',' + (top + 6.8) + ' ' + (m[0] - 1.1) + ',' + (top + 6.0) + ' Z', fill: '#fbf3dc' }, o), k);
    });
    // red cross of Burgundy on the main sail
    el('path', { d: 'M-0.4,-5.2 L1.6,-3.4 M1.6,-5.2 L-0.4,-3.4', stroke: C.red, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }, k);
    el('path', { d: 'M0.6,-9.1 L2.6,-8.6 L0.6,-8.1 Z', fill: C.red }, k); // pennant
    return sh;
  }

  /* ------------------------------------------------------------- engine */
  function Viaje(root) {
    var data = JSON.parse(root.querySelector('script.viaje-data').textContent);
    var GEO = window.VIAJE_GEO;
    this.data = data; this.GEO = GEO; this.root = root;
    root.classList.add('vj');
    var head = h('div', 'vj-head', null, root);
    h('div', 'vj-cart', (data.title || 'El viaje') + '<small>' + (data.subtitle || '') + '</small>', head);
    var log = h('div', 'vj-log', null, head);
    (data.stops || []).forEach(function (s) {
      var c = h('div', 'vj-seal' + (s.m < data.module ? ' done' : s.m === data.module ? ' now' : ''), '<b>M' + s.m + '</b>' + s.short, log);
      c.title = 'Módulo ' + s.m + ': ' + s.city;
      if (s.m === data.module) this.nowSeal = c;
    }, this);
    var body = h('div', 'vj-body', null, root);
    this.stage = h('div', 'vj-stage', null, body);
    this.tip = h('div', 'vj-tip', null, this.stage);
    this.panel = h('div', 'vj-panel', null, body);
    if (data.credit) h('div', 'vj-credit', data.credit, root);
    this.buildAtlas();
    this.i = 0;
    this.show();
  }

  Viaje.prototype.buildAtlas = function () {
    var self = this, G = this.GEO, d = this.data;
    var svg = this.svg = el('svg', { viewBox: G.viewBox.join(' '), role: 'img', 'aria-label': 'Map of the Spanish-speaking world' }, this.stage);
    this.vb = G.viewBox.slice();
    svg.style.aspectRatio = G.viewBox[2] + ' / ' + G.viewBox[3];   // zooms letterbox; the map never changes height
    defs(svg);
    el('rect', { x: G.viewBox[0] - 50, y: G.viewBox[1] - 50, width: G.viewBox[2] + 100, height: G.viewBox[3] + 100, fill: C.sea }, svg);
    // rhumb lines from the compass
    var cc = merc(-28, -38), rh = el('g', { 'pointer-events': 'none' }, svg);
    for (var i = 0; i < 32; i++) {
      var a = i * Math.PI / 16;
      el('line', { x1: cc[0], y1: cc[1], x2: cc[0] + Math.sin(a) * 260, y2: cc[1] - Math.cos(a) * 260,
        stroke: i % 4 === 0 ? C.sepia : C.gold, 'stroke-width': .5, 'stroke-opacity': i % 4 === 0 ? .35 : .22, 'vector-effect': 'non-scaling-stroke' }, rh);
    }
    // water-lining: the whole coastline stroked several times (engraved look)
    var all = G.context.map(function (c) { return c.d; }).join('') + Object.keys(G.countries).map(function (k) { return G.countries[k].d; }).join('');
    var wl = el('g', { 'pointer-events': 'none' }, svg);
    // alternating water / sea strokes leave three crisp engraved lines around every coast
    [[15, C.water, .16], [13.6, C.sea, 1], [9.5, C.water, .24], [8.1, C.sea, 1], [4.4, C.water, .38], [3, C.sea, 1]].forEach(function (w) {
      el('path', { d: all, fill: 'none', stroke: w[1], 'stroke-width': w[0], 'stroke-opacity': w[2], 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, wl);
    });
    var ctx = el('g', {}, svg);
    G.context.forEach(function (c) {
      var p = el('path', { d: c.d, fill: C.land, stroke: C.sepia, 'stroke-width': .6, 'stroke-opacity': .45, 'vector-effect': 'non-scaling-stroke' }, ctx);
      p.addEventListener('mousemove', function (e) { self.tipAt(e, c.name); });
      p.addEventListener('mouseleave', function () { self.tip.style.display = 'none'; });
      p.addEventListener('click', function () { self.onCountry(c.iso, c.name); });
    });
    G.lakes.forEach(function (dd) { el('path', { d: dd, fill: '#cfd9dc', stroke: C.water, 'stroke-width': .5, 'stroke-opacity': .5, 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none' }, svg); });
    this.paths = {};
    var tg = el('g', {}, svg);
    Object.keys(G.countries).forEach(function (iso) {
      var c = G.countries[iso];
      var p = el('path', { d: c.d, 'class': 'tgt', fill: C.tgt, stroke: C.sepia, 'stroke-width': 1.1, 'vector-effect': 'non-scaling-stroke', tabindex: 0, role: 'button', 'aria-label': c.name }, tg);
      p.addEventListener('mousemove', function (e) { self.tipAt(e, c.name); });
      p.addEventListener('mouseleave', function () { self.tip.style.display = 'none'; });
      p.addEventListener('click', function () { self.onCountry(iso, c.name); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.onCountry(iso, c.name); } });
      self.paths[iso] = p;
      c.bb = bbox(c.d);
    });
    // small countries get a ring so they can be found and clicked
    Object.keys(G.countries).forEach(function (iso) {
      var b = G.countries[iso].bb;
      if (Math.max(b.w, b.h) < 2.2) {
        var r = el('circle', { cx: b.cx, cy: b.cy, r: 1.5, fill: 'none', stroke: C.red, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke', 'class': 'tgt', 'fill-opacity': 0 }, tg);
        r.setAttribute('fill', 'transparent');
        r.addEventListener('click', function () { self.onCountry(iso, G.countries[iso].name); });
        r.addEventListener('mousemove', function (e) { self.tipAt(e, G.countries[iso].name); });
        r.addEventListener('mouseleave', function () { self.tip.style.display = 'none'; });
      }
    });
    // labels for the oceans
    var lab = el('g', { 'pointer-events': 'none', 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', fill: C.sepia }, svg);
    [['Océano Pacífico', -112, -12, 3.6], ['Océano Atlántico', -38, 12, 3.6], ['Mar Caribe', -76.5, 14.6, 1.7], ['Golfo de México', -91.5, 25.3, 1.6]].forEach(function (o) {
      var p = merc(o[1], o[2]);
      var t = el('text', { x: p[0], y: p[1], 'font-size': o[3], 'text-anchor': 'middle', 'letter-spacing': o[3] * .12 }, lab);
      t.textContent = o[0]; t._fs = o[3];
      self.labels = (self.labels || []).concat([t]);
    });
    compass(svg, cc[0], cc[1], 9);
    this.routeG = el('g', { 'pointer-events': 'none' }, svg);
    this.pinG = el('g', {}, svg);
    // the voyage so far: earlier legs drawn as faint dotted lines
    (d.stops || []).forEach(function (s, ix) {
      if (s.m > d.module || !s.leg) return;
      var pts = s.leg.map(function (q) { return merc(q[0], q[1]); });
      if (s.m === d.module && s.overland) {   // last hop is over land: drawn separately, after the ship docks
        var lp = pts.slice(-2);
        self.landPath = el('path', { d: 'M' + lp.map(function (q) { return q.join(','); }).join(' L'), fill: 'none', stroke: C.red, 'stroke-width': 2,
          'stroke-dasharray': '2 4', 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' }, self.routeG);
        self.landPath.style.display = 'none';
        pts = pts.slice(0, -1);
      }
      var pd = 'M' + pts.map(function (q) { return q.join(','); }).join(' L');
      var line = el('path', { d: pd, fill: 'none', stroke: s.m === d.module ? C.red : C.sepia, 'stroke-width': s.m === d.module ? 2 : 1.3,
        'stroke-dasharray': s.m === d.module ? '6 5' : '3 4', 'stroke-opacity': s.m === d.module ? .9 : .55, 'vector-effect': 'non-scaling-stroke' }, self.routeG);
      if (s.m === d.module) { self.legPath = line; line.style.display = 'none'; }
    });
    (d.stops || []).forEach(function (s) {
      if (s.m >= d.module || !s.ll) return;
      var p = merc(s.ll[0], s.ll[1]);
      var dot = el('circle', { cx: p[0], cy: p[1], r: .7, fill: C.red, stroke: '#fff', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, self.routeG);
      self.stopDots = (self.stopDots || []).concat([dot]);
    });
    // the port where the ship docks (stop.port = {"name": "Acapulco", "ll"?: [lon, lat]}; default = the leg's last sea point),
    // shown once the ship arrives (David 2026-11-17)
    var meP = (d.stops || []).filter(function (s) { return s.m === d.module; })[0];
    if (meP && meP.port && meP.leg) {
      var sea = meP.overland ? meP.leg[meP.leg.length - 2] : meP.leg[meP.leg.length - 1];
      var pp = merc((meP.port.ll || sea)[0], (meP.port.ll || sea)[1]);
      this.portG = el('g', { 'pointer-events': 'none' }, this.routeG); this.portG.style.display = 'none';
      var pdot = el('circle', { cx: pp[0], cy: pp[1], r: .7, fill: '#fff', stroke: C.red, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, this.portG);
      this.stopDots = (this.stopDots || []).concat([pdot]);
      var left = meP.port.side === 'left';
      var pt2 = el('text', { x: pp[0] + (left ? -1.8 : 1.8), y: pp[1] + .5, 'text-anchor': left ? 'end' : 'start', 'font-size': 2.6, 'font-weight': 700, 'font-style': 'italic',
        fill: C.ink, stroke: '#fbf6ea', 'stroke-width': 3, 'paint-order': 'stroke', 'vector-effect': 'non-scaling-stroke', 'font-family': 'IM Fell English, Georgia, serif' }, this.portG);
      pt2.textContent = meP.port.name; pt2._fs = 3.6; pt2._min = .25;
      this.labels = (this.labels || []).concat([pt2]);
    }
    // ship: starts at the first point of this module's leg
    var me = (d.stops || []).filter(function (s) { return s.m === d.module; })[0];
    this.me = me;
    this.ship = galleon(svg, 0.6);
    var st = me && me.leg ? merc(me.leg[0][0], me.leg[0][1]) : merc(-80, 0);
    this.k = 1; this.placeShip(st[0], st[1], false);
    this.overlay = el('g', {}, svg);
  };

  Viaje.prototype.tipAt = function (e, name) {
    if (this.noTip) return;
    var r = this.stage.getBoundingClientRect();
    this.tip.textContent = name;
    this.tip.style.left = (e.clientX - r.left + 12) + 'px';
    this.tip.style.top = (e.clientY - r.top - 30) + 'px';
    this.tip.style.display = 'block';
  };

  Viaje.prototype.setVB = function (vb) {
    this.vb = vb; this.svg.setAttribute('viewBox', vb.join(' '));
    var k = this.k = vb[2] / this.GEO.viewBox[2];      // keep ship + labels the same size on screen
    (this.labels || []).forEach(function (t) { t.setAttribute('font-size', t._fs * Math.max(k, t._min == null ? .45 : t._min)); });
    (this.stopDots || []).forEach(function (c) { c.setAttribute('r', .7 * Math.max(k, .08)); });
    if (this.shipAt) this.placeShip(this.shipAt[0], this.shipAt[1], this.shipFlip);
  };
  Viaje.prototype.placeShip = function (x, y, flip) {
    this.shipAt = [x, y]; this.shipFlip = flip;
    this.ship.setAttribute('transform', 'translate(' + x + ',' + y + ') scale(' + (flip ? -(this.k || 1) : (this.k || 1)) + ',' + (this.k || 1) + ')');
  };
  Viaje.prototype.zoomTo = function (vb, ms, done) {
    var a = this.vb.slice(), self = this;
    tween(ms || 1400, function (k) { self.setVB(a.map(function (v, i) { return v + (vb[i] - v) * k; })); }, done);
  };
  Viaje.prototype.sail = function (done) {
    var self = this, path = this.legPath;
    if (!path) { if (done) done(); return; }
    path.style.display = '';
    var L = path.getTotalLength();
    path.setAttribute('stroke-dashoffset', 0);
    tween(3600, function (k) {
      var p = path.getPointAtLength(L * k), q = path.getPointAtLength(Math.min(L, L * k + .5));
      self.placeShip(p.x, p.y, q.x < p.x);
    }, function () { if (self.portG) self.portG.style.display = ''; if (done) done(); });
  };

  /* ------------------------------------------------------------- steps */
  Viaje.prototype.show = function () {
    var self = this, s = this.data.steps[this.i], P = this.panel;
    P.innerHTML = '';
    this.mode = null; this.noTip = false;
    h('div', 'vj-stepno', 'Step ' + (this.i + 1) + ' of ' + this.data.steps.length + (s.label ? ' · ' + s.label : ''), P);
    if (s.prompt) h('div', 'vj-prompt', s.prompt, P);
    this.fb = h('div', 'vj-fb', null, P);
    this.nav = h('div', 'vj-nav', null, P);
    this.next = h('button', 'vj-btn primary', s.nextLabel || 'Next →', this.nav);
    this.next.disabled = true;
    this.next.addEventListener('click', function () { self.go(); });
    (s.lines || []).forEach(function (ln) { self.parallel(ln); });
    var fn = this['step_' + s.type];
    if (fn) fn.call(this, s, P);
  };
  // a line of latitude (e.g. el ecuador), drawn once and kept
  Viaje.prototype.parallel = function (ln) {
    this.drawn = this.drawn || {};
    if (this.drawn['lat' + ln.lat]) return;
    this.drawn['lat' + ln.lat] = 1;
    var a = merc(-200, ln.lat), b = merc(80, ln.lat), g = el('g', { 'pointer-events': 'none' }, this.overlay);
    el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.red, 'stroke-width': 1.6, 'stroke-dasharray': '8 5', 'vector-effect': 'non-scaling-stroke' }, g);
    if (ln.label) {
      var q = merc(ln.at || -86, ln.lat);
      var t = el('text', { x: q[0], y: q[1] - .15, 'font-size': 1.6, 'font-family': 'IM Fell English, Georgia, serif', 'font-style': 'italic', 'font-weight': 700, fill: C.red, stroke: '#f3e9cf', 'stroke-width': .3, 'paint-order': 'stroke' }, g);
      t.textContent = ln.label; t._fs = 1.6; t._min = .25;
      this.labels = (this.labels || []).concat([t]);
      t.setAttribute('font-size', 1.6 * Math.max(this.k || 1, .25));
    }
  };
  Viaje.prototype.go = function () {
    if (this.i < this.data.steps.length - 1) { this.i++; this.show(); }
  };
  Viaje.prototype.say = function (fbClass, html) {
    this.fb.className = 'vj-fb ' + fbClass; this.fb.innerHTML = html;
  };
  Viaje.prototype.done = function (html) {
    this.say('ok', '<b class="ck">✓</b> ' + html);
    this.next.disabled = false;
  };
  function insertBefore(P, node, ref) { P.insertBefore(node, ref); return node; }
  Viaje.prototype.esLine = function (s, P) {
    var w = document.createElement('div'); w.className = 'vj-es';
    w.innerHTML = s.es + (s.clip ? ' <button class="vj-say" title="Listen" aria-label="Listen">🔊</button>' : '');
    insertBefore(P, w, this.fb);
    if (s.clip) w.querySelector('.vj-say').addEventListener('click', function () { play(s.clip); });
    if (s.en) { var e = document.createElement('div'); e.className = 'vj-en'; e.innerHTML = s.en; insertBefore(P, e, this.fb); }
    return w;
  };

  // intro: the ship sails this module's leg
  Viaje.prototype.step_sail = function (s, P) {
    var self = this;
    if (s.es) this.esLine(s, P);
    var b = document.createElement('button'); b.className = 'vj-btn'; b.textContent = s.button || '⛵ Set sail';
    insertBefore(P, b, this.fb);
    b.addEventListener('click', function () {
      b.disabled = true;
      if (s.zoom) self.zoomTo(s.zoom, 1200);
      self.sail(function () { self.done(s.ok); });
    });
  };

  // find a country on the atlas
  Viaje.prototype.step_find = function (s, P) {
    var self = this;
    if (s.es) this.esLine(s, P);
    this.mode = { kind: 'find', iso: s.iso, tries: 0, s: s };
    if (s.zoom) this.zoomTo(s.zoom, 900);
  };
  function compassWord(dx, dy) {
    var ns = dy < -1.5 ? 'north' : dy > 1.5 ? 'south' : '', ew = dx < -1.5 ? 'west' : dx > 1.5 ? 'east' : '';
    return (ns + (ns && ew ? '-' : '') + ew) || 'right next to it';
  }
  Viaje.prototype.onCountry = function (iso, name) {
    var m = this.mode;
    if (m && m.kind === 'meet') { if (!m.ok && iso === m.s.iso) m.meet(); return; }
    if (!m || m.kind !== 'find' || m.ok) return;
    var G = this.GEO, want = G.countries[m.iso];
    if (iso === m.iso) {
      m.ok = true;
      this.paths[iso].setAttribute('fill', C.here); this.paths[iso].classList.add('on');
      this.paths[iso].setAttribute('stroke', C.red);
      this.done(m.s.ok);
      return;
    }
    m.tries++;
    var hint = '';
    var from = G.countries[iso] ? G.countries[iso].bb : null;
    if (from && want.bb) hint = ' ' + want.name + ' is <b>' + compassWord(want.bb.cx - from.cx, want.bb.cy - from.cy) + '</b> of there.';
    else if (!G.countries[iso]) hint = ' Spanish is not the official language there.';
    if (m.tries >= 3) {
      var p = this.paths[m.iso];
      p.setAttribute('fill', '#f3d27a'); p.classList.add('on');
      hint += ' It is glowing on the map now.';
    }
    this.say('no', 'That is <b>' + name + '</b>.' + hint);
  };

  // map units per screen pixel for a viewBox (the map letterboxes, so the larger ratio wins)
  Viaje.prototype.perPx = function (vb) {
    var W = this.svg.clientWidth || 680, H = this.svg.clientHeight || W * this.GEO.viewBox[3] / this.GEO.viewBox[2];
    return Math.max(vb[2] / W, vb[3] / H);
  };

  // meet a new place: it is shown (name + capital) BEFORE anything is asked about it; the student clicks it to read about it
  Viaje.prototype.step_meet = function (s, P) {
    var self = this, G = this.GEO;
    if (s.es) this.esLine(s, P);
    if (s.zoom) this.zoomTo(s.zoom, 1000);
    this.pinG.innerHTML = '';
    var u = this.perPx(s.zoom || this.vb) * 10;   // u = 10 screen px
    var lab = function (x, y, txt, fs, anchor, col) {
      var t = el('text', { x: x, y: y, 'font-size': fs, 'text-anchor': anchor || 'middle', 'font-weight': 700, fill: col || C.ink,
        'font-family': 'IM Fell English, Georgia, serif', stroke: '#f3e9cf', 'stroke-width': .45 * u, 'paint-order': 'stroke', 'pointer-events': 'none' }, self.pinG);
      t.textContent = txt; return t;
    };
    var m = this.mode = { kind: 'meet', s: s };
    m.meet = function () {
      if (m.ok) return; m.ok = true;
      if (s.iso) { self.paths[s.iso].setAttribute('fill', C.here); self.paths[s.iso].setAttribute('stroke', C.red); self.paths[s.iso].classList.add('on'); }
      self.done(s.ok);
    };
    if (s.iso) {
      var c = G.countries[s.iso];
      self.paths[s.iso].setAttribute('fill', '#f2a97e'); self.paths[s.iso].classList.add('on');
      self.paths[s.iso].setAttribute('stroke', C.red);
      var lp = s.labelAt ? merc(s.labelAt[0], s.labelAt[1]) : [c.bb.cx, c.bb.cy];
      lab(lp[0], lp[1], c.name, 2.4 * u, 'middle', C.red);
    }
    if (s.pin) {
      var q = merc(s.pin.ll[0], s.pin.ll[1]), left = s.pin.side === 'left';
      var g = el('g', { 'class': 'tgt', tabindex: 0, role: 'button', 'aria-label': s.pin.name, style: 'cursor:pointer' }, self.pinG);
      el('circle', { cx: q[0], cy: q[1], r: 1.2 * u, fill: 'transparent' }, g);
      el('path', { d: starPath(q[0], q[1], 1.3 * u, .55 * u), fill: C.red, stroke: '#fff', 'stroke-width': .8, 'vector-effect': 'non-scaling-stroke' }, g);
      lab(q[0] + (left ? -1.6 : 1.6) * u, q[1] + .6 * u, s.pin.name, 1.8 * u, left ? 'end' : 'start');
      g.addEventListener('click', function () { m.meet(); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.meet(); } });
    }
  };

  // pick one of several pins (e.g. the capital)
  Viaje.prototype.step_pins = function (s, P) {
    var self = this;
    if (s.es) this.esLine(s, P);
    if (s.zoom) this.zoomTo(s.zoom, 1000);
    this.pinG.innerHTML = '';
    var tries = 0, solved = false;
    s.pins.forEach(function (pin) {
      var p = merc(pin.ll[0], pin.ll[1]);
      var g = el('g', { 'class': 'tgt', tabindex: 0, role: 'button', 'aria-label': pin.name, style: 'cursor:pointer' }, self.pinG);
      var u = self.perPx(s.zoom || self.vb) * 7;   // size pins to the view they are shown in (u = 7 screen px)
      el('circle', { cx: p[0], cy: p[1], r: .9 * u, fill: '#fff8e6', stroke: C.red, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, g);
      el('circle', { cx: p[0], cy: p[1], r: .35 * u, fill: C.red }, g);
      var left = pin.side === 'left';
      var t = el('text', { x: p[0] + (left ? -1.4 : 1.4) * u, y: p[1] + .8 * u, 'text-anchor': left ? 'end' : 'start', 'font-size': 2.5 * u, 'font-weight': 700, fill: C.ink, 'font-family': 'IM Fell English, Georgia, serif', stroke: '#f3e9cf', 'stroke-width': .6 * u, 'paint-order': 'stroke' }, g);
      t.textContent = pin.name;
      function pick() {
        if (solved) return;
        if (pin.ok) {
          solved = true;
          g.querySelector('circle').setAttribute('fill', C.gold);
          var star = el('path', { d: starPath(p[0], p[1], 1.6 * u, .7 * u), fill: C.red, stroke: '#fff', 'stroke-width': .8, 'vector-effect': 'non-scaling-stroke' }, self.pinG);
          if (self.landPath) self.landPath.style.display = '';   // now walk inland from the port
          self.done(s.ok);
          if (s.okClip) play(s.okClip);
        } else {
          tries++;
          self.say('no', pin.why || ('No: that is ' + pin.name + '.'));
        }
      }
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  };
  function starPath(cx, cy, R, r) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr).toFixed(2);
    }
    return d + 'Z';
  }

  // choose a word for a gap
  Viaje.prototype.step_choose = function (s, P) {
    var self = this;
    var line = this.esLine({ es: s.es.replace('___', '<span class="gap">?</span>'), en: s.en }, P);
    var opts = document.createElement('div'); opts.className = 'vj-opts'; insertBefore(P, opts, this.fb);
    var solved = false;
    s.options.forEach(function (o) {
      var b = h('button', 'vj-btn', o, opts);
      b.addEventListener('click', function () {
        if (solved) return;
        if (norm(o) === norm(s.answer)) {
          solved = true;
          line.querySelector('.gap').textContent = o;
          line.querySelector('.gap').style.color = C.green;
          self.done(s.ok || '');
          if (s.clip) play(s.clip);
        } else {
          self.say('no', (s.why && s.why[o]) || 'Not quite. Look at the map again.');
        }
      });
    });
  };

  /* ---------------------------------------------------------- the plan */
  // plan data: {cols, rows, plaza:[x,y,w,h], places:[{id, noun, name, cell:[x,y], door:[x,y], icon}], start:{at:[x,y], face:'N'}, lights:[[x,y]]}
  var DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }, RIGHT = { N: 'E', E: 'S', S: 'W', W: 'N' }, LEFT = { N: 'W', W: 'S', S: 'E', E: 'N' };
  Viaje.prototype.buildPlan = function () {
    if (this.plan) return;
    var self = this, pd = this.data.plan, U = 72, M = 30;
    var W = pd.cols * U + M * 2, H = pd.rows * U + M + 46;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': pd.aria || 'Street plan' });
    this.planSvg = svg; this.U = U; this.M = M;
    var dd = defs(svg);
    var ph = el('pattern', { id: 'vj-phatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, dd);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: '#9b3b2b', 'stroke-width': 1, 'stroke-opacity': .32 }, ph);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#f1e6cb' }, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#vj-paper)' }, svg);
    el('rect', { x: 6, y: 6, width: W - 12, height: H - 12, fill: 'none', stroke: C.sepia, 'stroke-width': 3 }, svg);
    el('rect', { x: 11, y: 11, width: W - 22, height: H - 22, fill: 'none', stroke: C.sepia, 'stroke-width': 1 }, svg);
    var X = function (x) { return M + x * U; }, Y = function (y) { return M + y * U; };
    this.X = X; this.Y = Y;
    var inPlaza = function (cx, cy) { var p = pd.plaza; return cx >= p[0] && cx < p[0] + p[2] && cy >= p[1] && cy < p[1] + p[3]; };
    var placeAt = {};
    pd.places.forEach(function (p) { placeAt[p.cell.join(',')] = p; });
    var gap = 8;
    for (var cy = 0; cy < pd.rows; cy++) for (var cx = 0; cx < pd.cols; cx++) {
      if (inPlaza(cx, cy)) continue;
      var pl = placeAt[cx + ',' + cy];
      el('rect', { x: X(cx) + gap, y: Y(cy) + gap, width: U - 2 * gap, height: U - 2 * gap, rx: 2,
        fill: pl ? '#e7c98c' : '#e3c6a8', stroke: '#8a4a2a', 'stroke-width': 1.3 }, svg);
      if (!pl) el('rect', { x: X(cx) + gap, y: Y(cy) + gap, width: U - 2 * gap, height: U - 2 * gap, fill: 'url(#vj-phatch)' }, svg);
    }
    // the plaza: open square with a fountain, the cathedral on its north side
    var pz = pd.plaza;
    el('rect', { x: X(pz[0]) + gap, y: Y(pz[1]) + gap, width: pz[2] * U - 2 * gap, height: pz[3] * U - 2 * gap, fill: '#f4ead2', stroke: C.red, 'stroke-width': 2 }, svg);
    var fx = X(pz[0]) + pz[2] * U / 2, fy = Y(pz[1]) + pz[3] * U / 2;
    // with a name under the label, everything moves up and the name sits on two lines inside the square (David 2026-11-17)
    var named = !!pd.plazaName, pzW = pz[2] * U - 2 * gap - 8;
    el('circle', { cx: fx, cy: fy - (named ? 32 : 6), r: 9, fill: '#cfd9dc', stroke: C.water, 'stroke-width': 1.5 }, svg);
    var pt = el('text', { x: fx, y: fy + (named ? 2 : 30), 'text-anchor': 'middle', 'font-size': 27, 'font-family': 'IM Fell English, Georgia, serif', fill: C.red }, svg);
    pt.textContent = pd.plazaLabel || 'la plaza';
    if (named) {
      var parts = pd.plazaName.indexOf(' (') > 0 ? [pd.plazaName.slice(0, pd.plazaName.indexOf(' (')), pd.plazaName.slice(pd.plazaName.indexOf(' (') + 2).replace(/\)\s*$/, '')] : [pd.plazaName];   // "el Zócalo (la Plaza Mayor)" -> "el Zócalo" / "la Plaza Mayor"
      var ctx = null; try { ctx = document.createElement('canvas').getContext('2d'); ctx.font = '700 17px Georgia, serif'; } catch (e) {}
      var fs = 17;   // one size for both lines, small enough that the widest fits inside the square (measured with the real font)
      parts.forEach(function (line) { var w = ctx ? ctx.measureText(line).width : line.length * 9; if (w > pzW) fs = Math.min(fs, 17 * pzW / w); });
      parts.forEach(function (line, k) {
        var pn = el('text', { x: fx, y: fy + 26 + k * (fs + 3), 'text-anchor': 'middle', 'font-size': fs.toFixed(1), 'font-weight': 700, 'font-family': 'Georgia, serif', fill: C.ink }, svg);
        pn.textContent = line;
      });
    }
    (pd.landmarks || []).forEach(function (lm) {
      var t = el('text', { x: X(lm.cell[0]) + U / 2, y: Y(lm.cell[1]) + U / 2 + (lm.name2 ? -3 : 6), 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, 'font-style': 'italic', 'font-family': 'IM Fell English, Georgia, serif', fill: C.ink }, svg);
      t.textContent = lm.name;
      if (lm.name2) { var t2 = el('text', { x: X(lm.cell[0]) + U / 2, y: Y(lm.cell[1]) + U / 2 + 15, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, 'font-style': 'italic', 'font-family': 'IM Fell English, Georgia, serif', fill: C.ink }, svg); t2.textContent = lm.name2; }
    });
    // street names along the edges (optional)
    (pd.streets || []).forEach(function (st) {
      var t;
      if (st.row != null) t = el('text', { x: X(st.from != null ? st.from : 0) + 4, y: Y(st.row) - 2, 'font-size': 9.5, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: C.sepia }, svg);
      else { t = el('text', { x: 0, y: 0, 'font-size': 9.5, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: C.sepia, transform: 'translate(' + (X(st.col) - 2) + ',' + (Y(st.from != null ? st.from : 0) + 4) + ') rotate(90)' }, svg); }
      t.textContent = st.name;
    });
    // traffic lights at some corners
    (pd.lights || []).forEach(function (l) {
      var g = el('g', { transform: 'translate(' + (X(l[0]) + 7) + ',' + (Y(l[1]) - 17) + ')' }, svg);
      el('rect', { x: -3.5, y: 0, width: 7, height: 15, rx: 2, fill: '#2b2b2b' }, g);
      el('circle', { cx: 0, cy: 3.3, r: 2, fill: '#d33' }, g); el('circle', { cx: 0, cy: 7.5, r: 2, fill: '#e9b300' }, g); el('circle', { cx: 0, cy: 11.7, r: 2, fill: '#2a2' }, g);
    });
    // places
    this.placeEls = {};
    pd.places.forEach(function (p) {
      var g = el('g', { 'class': 'tgt', tabindex: 0, role: 'button', 'aria-label': p.noun + ' (' + p.name + ')', style: 'cursor:pointer' }, svg);
      var bx = X(p.cell[0]) + gap, by = Y(p.cell[1]) + gap, bw = U - 2 * gap;
      var r = el('rect', { x: bx, y: by, width: bw, height: bw, rx: 3, fill: '#f3dc9e', stroke: C.red, 'stroke-width': 2 }, g);
      var ic = el('text', { x: bx + bw / 2, y: by + 28, 'text-anchor': 'middle', 'font-size': 26 }, g); ic.textContent = p.icon || '';
      var t = el('text', { x: bx + bw / 2, y: by + 52, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, stroke: '#f3dc9e', 'stroke-width': 4, 'paint-order': 'stroke', 'font-family': 'Segoe UI, sans-serif', fill: C.ink }, g);
      t.textContent = p.noun;
      g.addEventListener('click', function () { self.onPlace(p); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.onPlace(p); } });
      g.addEventListener('mousemove', function (e) { self.tipAt(e, p.noun + ' · ' + p.name); });
      g.addEventListener('mouseleave', function () { self.tip.style.display = 'none'; });
      self.placeEls[p.id] = r;
      if (p.far) {
        var ax = bx + bw, ay = by + bw, d = p.far;   // arrow pointing off the plan
        el('path', { d: 'M' + (ax - 4) + ',' + (ay - 4) + ' l' + d[0] + ',' + d[1], stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '6 4', fill: 'none' }, g);
        var ft = el('text', { x: ax + d[0] - 4, y: ay + d[1] + 14, 'text-anchor': 'end', 'font-size': 18, 'font-style': 'italic', 'font-weight': 700, fill: C.red, 'font-family': 'Georgia, serif' }, g);
        ft.textContent = p.farLabel || 'lejos';
      }
    });
    // compass rose + scale note
    compass(svg, W - 120, H - 24, 14);
    if (pd.note) { var nt = el('text', { x: 22, y: H - 16, 'font-size': 17, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: C.sepia }, svg); nt.textContent = pd.note; }
    this.trail = el('path', { d: '', fill: 'none', stroke: C.red, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '1 8', opacity: .9 }, svg);
    // Fernanda: a small walker figure with a facing arrow
    var f = this.walker = el('g', {}, svg);
    this.arrow = el('path', { d: 'M0,-26 L8,-15 L-8,-15 Z', fill: C.red }, f);
    el('circle', { r: 13, fill: C.blue, stroke: '#fff', 'stroke-width': 3 }, f);
    var ft = el('text', { y: 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#fff', 'font-family': 'Segoe UI, sans-serif' }, f);
    ft.textContent = 'F';
    this.plan = pd;
  };
  Viaje.prototype.placeWalker = function (at, face) {
    this.pos = at.slice(); this.face = face;
    var ang = { N: 0, E: 90, S: 180, W: 270 }[face];
    this.walker.setAttribute('transform', 'translate(' + this.X(at[0]) + ',' + this.Y(at[1]) + ')');
    this.arrow.setAttribute('transform', 'rotate(' + ang + ')');
  };
  Viaje.prototype.resetWalk = function () {
    var st = this.curStart || this.plan.start;
    this.placeWalker(st.at, st.face);
    this.trailPts = [st.at.slice()];
    this.trail.setAttribute('d', '');
    for (var k in this.placeEls) this.placeEls[k].setAttribute('fill', '#f3dc9e');
  };
  Viaje.prototype.drawTrail = function () {
    var X = this.X, Y = this.Y;
    this.trail.setAttribute('d', 'M' + this.trailPts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' L'));
  };
  // one move: ['go', n] | ['right'] | ['left']. Returns false if it leaves the plan.
  Viaje.prototype.move = function (mv, ms, done) {
    var self = this;
    if (mv[0] === 'right' || mv[0] === 'left') {
      var from = { N: 0, E: 90, S: 180, W: 270 }[this.face];
      this.face = (mv[0] === 'right' ? RIGHT : LEFT)[this.face];
      var to = from + (mv[0] === 'right' ? 90 : -90);
      tween(ms || 350, function (k) { self.arrow.setAttribute('transform', 'rotate(' + (from + (to - from) * k) + ')'); }, done);
      return true;
    }
    var d = DIRS[this.face], a = this.pos.slice(), b = [a[0] + d[0] * mv[1], a[1] + d[1] * mv[1]];
    if (b[0] < 0 || b[1] < 0 || b[0] > this.plan.cols || b[1] > this.plan.rows) return false;
    this.pos = b;
    this.trailPts.push(b.slice());
    tween((ms || 450) * mv[1], function (k) {
      var x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
      self.walker.setAttribute('transform', 'translate(' + self.X(x) + ',' + self.Y(y) + ')');
    }, function () { self.drawTrail(); if (done) done(); });
    return true;
  };
  Viaje.prototype.runMoves = function (mvs, done) {
    var self = this, i = 0;
    (function nx() { if (i >= mvs.length) { if (done) done(); return; } self.move(mvs[i++], null, nx); })();
  };
  // Fernanda has reached a place when she stands on any corner of its block (prefer the wanted one)
  function corners(p) { var c = p.cell; return [[c[0], c[1]], [c[0] + 1, c[1]], [c[0], c[1] + 1], [c[0] + 1, c[1] + 1]]; }
  Viaje.prototype.placeAtDoor = function (pos, want) {
    var out = null;
    this.plan.places.forEach(function (p) {
      corners(p).forEach(function (k) { if (k[0] === pos[0] && k[1] === pos[1] && (!out || p.id === want)) out = p; });
    });
    return out;
  };
  Viaje.prototype.showPlan = function (done) {
    var self = this;
    this.buildPlan();
    if (this.planSvg.parentNode) { if (done) done(); return; }
    this.planSvg.style.opacity = 0;
    this.planSvg.style.position = 'absolute'; this.planSvg.style.inset = '0';
    this.stage.appendChild(this.planSvg);
    tween(900, function (k) { self.planSvg.style.opacity = k; self.svg.style.opacity = 1 - k * .9; }, function () {
      self.svg.style.display = 'none';
      self.planSvg.style.position = ''; self.planSvg.style.inset = '';
      self.resetWalk();
      if (done) done();
    });
  };

  // zoom from the atlas into the city plan
  Viaje.prototype.step_enter = function (s, P) {
    var self = this;
    if (s.es) this.esLine(s, P);
    var b = document.createElement('button'); b.className = 'vj-btn'; b.textContent = s.button || 'Enter the city';
    insertBefore(P, b, this.fb);
    b.addEventListener('click', function () {
      b.disabled = true;
      self.zoomTo(s.zoom, 1500, function () { self.showPlan(function () { self.done(s.ok); }); });
    });
  };

  // read/listen to a route, then click where Fernanda ends up
  Viaje.prototype.step_follow = function (s, P) {
    var self = this;
    this.showPlan();
    this.curStart = s.start || this.plan.start;
    if (this.planSvg.parentNode && this.walker) this.resetWalk();
    this.esLine(s, P);
    this.mode = { kind: 'follow', s: s, tries: 0 };
  };
  Viaje.prototype.onPlace = function (p) {
    var m = this.mode, self = this;
    if (!m || m.ok) return;
    if (m.kind === 'follow') {
      if (p.id === m.s.answer) {
        m.ok = true;
        this.resetWalk();
        this.runMoves(m.s.moves, function () {
          self.placeEls[p.id].setAttribute('fill', '#bfe0b4');
          self.done(m.s.ok);
          if (m.s.okClip) play(m.s.okClip);
        });
      } else {
        m.tries++;
        this.say('no', (m.s.why && m.s.why[p.id]) || 'Not there. Read the route again, one piece at a time.');
        if (m.tries >= 2) {
          this.resetWalk();
          this.say('info', 'Watch Fernanda walk it. ' + ((m.s.why && m.s.why[p.id]) || ''));
          this.runMoves(m.s.moves, function () { self.say('info', 'She is at the red square now. Click it.'); self.placeEls[m.s.answer].setAttribute('fill', '#f6c3a8'); });
        }
      }
    } else if (m.kind === 'pick') {
      if (p.id === m.s.answer) { m.ok = true; self.placeEls[p.id].setAttribute('fill', '#bfe0b4'); self.done(m.s.ok); }
      else self.say('no', (m.s.why && m.s.why[p.id]) || 'Not that one.');
    }
  };

  // choose with the plan in view (cerca / lejos)
  Viaje.prototype.step_planChoose = function (s, P) {
    var self = this;
    this.showPlan(function () {
      self.resetWalk();
      (s.mark || []).forEach(function (id) { self.placeEls[id].setAttribute('fill', '#f6c3a8'); });
    });
    this.step_choose(s, P);
  };

  // build a route from tiles; Fernanda walks each tile as it is added
  Viaje.prototype.step_build = function (s, P) {
    var self = this;
    this.showPlan();
    this.curStart = s.start || this.plan.start;
    if (this.walker && this.planSvg.parentNode) this.resetWalk();
    if (s.es) this.esLine(s, P);
    var said = document.createElement('div'); said.className = 'vj-said'; insertBefore(P, said, this.fb);
    var tiles = document.createElement('div'); tiles.className = 'vj-opts'; insertBefore(P, tiles, this.fb);
    var ctr = document.createElement('div'); ctr.className = 'vj-opts'; insertBefore(P, ctr, this.fb);
    var undo = h('button', 'vj-btn small', '↶ Undo', ctr), again = h('button', 'vj-btn small', 'Start over', ctr);
    var seq = [], busy = false, solved = false;
    var opening = s.opening || '';
    function render() {
      said.innerHTML = opening + ' ' + seq.map(function (t) { return t.es; }).join(' ');
    }
    function replay(cb) {
      self.resetWalk();
      var mv = []; seq.forEach(function (t) { mv = mv.concat(t.moves); });
      // replay instantly
      mv.forEach(function (m) { self.move(m, 1); });
      setTimeout(cb || function () {}, 30);
    }
    render();
    s.tiles.forEach(function (t) {
      var b = h('button', 'vj-tile', t.es, tiles);
      b.title = t.en || '';
      b.addEventListener('click', function () {
        if (busy || solved) return;
        // test the move first
        var save = { pos: self.pos.slice(), face: self.face }, ok = true;
        var d = DIRS[self.face];
        t.moves.forEach(function (m) {
          if (m[0] === 'go') { var nx = save.pos[0] + DIRS[save.face][0] * m[1], ny = save.pos[1] + DIRS[save.face][1] * m[1]; if (nx < 0 || ny < 0 || nx > self.plan.cols || ny > self.plan.rows) ok = false; save.pos = [nx, ny]; }
          else save.face = (m[0] === 'right' ? RIGHT : LEFT)[save.face];
        });
        if (!ok) { self.say('no', 'There is no street that way: Fernanda would walk off the plan. Try another piece.'); return; }
        busy = true; seq.push(t); render();
        self.runMoves(t.moves, function () {
          busy = false;
          var at = self.placeAtDoor(self.pos, s.answer);
          if (at && at.id === s.answer) {
            solved = true;
            self.placeEls[at.id].setAttribute('fill', '#bfe0b4');
            said.innerHTML = opening + ' ' + seq.map(function (x) { return x.es; }).join(' ') + ' <b>' + s.arrive + '</b>';
            self.done(s.ok);
          } else if (at) {
            self.say('info', 'Fernanda is at the corner of <b>' + at.noun + '</b>. That is not where she wants to go. Undo or keep going.');
          } else {
            self.fb.className = 'vj-fb';
          }
        });
      });
    });
    undo.addEventListener('click', function () { if (busy || solved || !seq.length) return; seq.pop(); render(); replay(); self.fb.className = 'vj-fb'; });
    again.addEventListener('click', function () { if (busy || solved) return; seq = []; render(); self.resetWalk(); self.fb.className = 'vj-fb'; });
  };

  // the end: stamp the seal for this module
  Viaje.prototype.step_end = function (s, P) {
    if (s.es) this.esLine(s, P);
    this.next.style.display = 'none';
    if (this.nowSeal) { this.nowSeal.classList.remove('now'); this.nowSeal.classList.add('done'); }
    this.say('ok', '<span class="vj-done">' + (s.ok || '¡Buen viaje!') + '</span>');
    var self = this, b = h('button', 'vj-btn small', 'Play again', this.nav);
    b.addEventListener('click', function () {
      // rebuild from scratch
      var r = self.root, dataScript = r.querySelector('script.viaje-data');
      r.innerHTML = ''; r.appendChild(dataScript); new Viaje(r);
    });
  };

  function boot() {
    addCSS();
    var all = document.querySelectorAll('.viaje');
    for (var i = 0; i < all.length; i++) {
      if (all[i].dataset.vjReady) continue;
      all[i].dataset.vjReady = '1';
      try { new Viaje(all[i]); } catch (e) { if (window.console) console.error('viaje', e); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

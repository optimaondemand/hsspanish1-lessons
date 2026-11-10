/* llama.js: "La llama y la casa", a pixel-art room tour (Spanish 1 S2, Lesson 2.01; David 2026-11-10).
   A llama in an Andean blanket walks room by room through a Chilean house and asks "¿Qué cuarto es?". The student
   picks one of three room words; right = the llama is happy and the word is spoken, wrong = "No, no es…" + a hint,
   try again. Same 640x360 screen as molinos.js / cuento.js; all art original, drawn in code.
   Markup: <div class="llama-game" data-llama='{"id","title","audioBase","rooms":[{"key","es","en","clip","hint"}]}'></div>
   Practice only; reports to All Your Work with a 'mw-game' event when the tour is finished. */
(function () {
  'use strict';
  var W = 320, H = 180, S = 2, OUT = '#1b140d';
  var CSS =
    '.ll{max-width:1000px;margin:0 auto 6px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.ll-stage{position:relative;border:4px solid #5a3b1c;outline:2px solid #b8892e;outline-offset:2px;background:#000;line-height:0;overflow:hidden;border-radius:2px}' +
    '.ll-cv{display:block;width:100%;height:auto;image-rendering:pixelated}' +
    '.ll-start{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(20,12,6,.35);cursor:pointer;border:0;padding:0;width:100%}' +
    '.ll-start[hidden]{display:none}' +
    '.ll-start>span{display:inline-flex;align-items:center;gap:14px;line-height:1.2;background:#8e1b2c;color:#fff;font:700 22px "Segoe UI",Arial,sans-serif;padding:14px 28px 14px 16px;border-radius:999px;box-shadow:0 0 0 4px #fff,0 0 0 7px #b8892e,0 8px 18px rgba(0,0,0,.4)}' +
    '.ll-start i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:#fff;color:#8e1b2c;font-size:22px}' +
    '.ll-start small{display:block;font-weight:400;font-size:15px;opacity:.9}.ll-start:hover>span{background:#6f1422}' +
    '.ll-panel{background:#fffdf7;border:1px solid #ddcba4;border-top:0;padding:14px 18px 12px}' +
    '.ll-q{font:700 22px "Segoe UI",Arial,sans-serif;color:#1a2340;margin:0 0 10px}.ll-q small{font-weight:400;font-size:15px;color:#5f554a;margin-left:8px}' +
    '.ll-opts{display:flex;flex-wrap:wrap;gap:10px}.ll-opt{font:700 19px "Segoe UI",Arial,sans-serif;background:#fff;color:#1a2340;border:2px solid #c9b58a;border-radius:999px;padding:9px 22px;cursor:pointer}' +
    '.ll-opt:hover{background:#f7ecd2}.ll-opt.ok{background:#2A9D5C;border-color:#2A9D5C;color:#fff}.ll-opt.no{background:#fbe8e5;border-color:#C0392B;color:#8f1d12}' +
    '.ll-opt:disabled{cursor:default}.ll-fb{min-height:26px;margin-top:10px;font:16px/1.5 "Segoe UI",Arial,sans-serif}.ll-fb.ok{color:#1d5e20;font-weight:600}.ll-fb.no{color:#8f1d12}' +
    '.ll-bar{display:flex;align-items:center;gap:10px;background:#f4ecd8;border:1px solid #ddcba4;border-top:0;padding:8px 12px}' +
    '.ll-dots{display:flex;gap:6px}.ll-dots i{width:14px;height:14px;border-radius:50%;background:#d9ccb0}.ll-dots i.done{background:#2A9D5C}.ll-dots i.on{background:#b8892e}' +
    '.ll-next{margin-left:auto;font:600 15px "Segoe UI",Arial,sans-serif;background:#1a2340;color:#fff;border:0;border-radius:999px;padding:7px 18px;cursor:pointer}.ll-next[hidden]{display:none}';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  // ---- painter
  function Pt(c) { this.c = c; }
  Pt.prototype.r = function (x, y, w, h, col) { this.c.fillStyle = col; this.c.fillRect(Math.round(x * S), Math.round(y * S), Math.round(w * S), Math.round(h * S)); };
  Pt.prototype.o = function (x, y, r, col) { var c = this.c; c.beginPath(); c.arc(x * S, y * S, r * S, 0, 7); c.fillStyle = col; c.fill(); };
  Pt.prototype.p = function (pts, col, line) { var c = this.c; c.beginPath(); c.moveTo(pts[0][0] * S, pts[0][1] * S); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * S, pts[i][1] * S); c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1] * S; c.stroke(); } };
  Pt.prototype.l = function (a, b, x, y, col, w) { var c = this.c; c.beginPath(); c.moveTo(a * S, b * S); c.lineTo(x * S, y * S); c.strokeStyle = col; c.lineWidth = (w || 1) * S; c.lineCap = 'round'; c.stroke(); };
  Pt.prototype.t = function (s, x, y, size, col, w) { var c = this.c; c.font = (w || 800) + ' ' + size * S + 'px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x * S, y * S); };
  Pt.prototype.a = function (al, fn) { var c = this.c; c.save(); c.globalAlpha = Math.max(0, Math.min(1, al)); fn(); c.restore(); };
  function room(P, wall, floor) { P.r(0, 0, W, 132, wall); P.r(0, 132, W, 48, floor); for (var i = 0; i < 20; i++) P.r(i * 16, 132, 0.6, 48, 'rgba(0,0,0,.12)'); P.r(0, 150, W, 0.6, 'rgba(0,0,0,.12)'); P.r(0, 128, W, 4, '#8a5a2b'); }
  function tiles(P, y) { for (var i = 0; i < 40; i++) { P.r(i * 8, y, 8, 8, i % 2 ? '#2b5aa0' : '#eef3fb'); P.o(i * 8 + 4, y + 4, 1.5, i % 2 ? '#eef3fb' : '#2b5aa0'); } }
  function win(P, x, y, w, h) { P.r(x - 2, y - 2, w + 4, h + 4, '#55331a'); P.r(x, y, w, h, '#a9d6f0'); P.r(x, y + h * .6, w, h * .4, '#7d8da3'); P.p([[x, y + h * .6], [x + w * .3, y + h * .3], [x + w * .55, y + h * .55], [x + w * .8, y + h * .25], [x + w, y + h * .5], [x + w, y + h * .6]], '#f4f7fb'); P.r(x + w / 2 - .5, y, 1, h, '#55331a'); }
  // ---- the rooms (drawn to the right of the llama)
  var ROOMS = {
    cocina: function (P, T) { room(P, '#f3e9d2', '#c58a5a'); tiles(P, 96); win(P, 150, 24, 50, 38);
      P.r(206, 70, 54, 58, '#2b2b2b'); P.r(208, 72, 50, 8, '#3d3d3d'); P.r(212, 92, 42, 30, '#1d1d1d'); P.o(220, 70, 6, '#6b6b6b'); P.r(214, 62, 12, 8, '#8a8a8a'); P.o(244, 70, 5, '#6b6b6b'); P.r(239, 64, 10, 6, '#b5452c');
      for (var s = 0; s < 3; s++) { var k = (T * 14 + s * 6) % 18; P.a(.6 - k / 30, function () { P.o(220 + Math.sin(T * 3 + s) * 2, 58 - k, 2.5, '#fff'); }); }
      P.r(270, 30, 46, 3, '#8a5a2b'); for (var p = 0; p < 3; p++) P.o(278 + p * 14, 26, 5, p % 2 ? '#2b5aa0' : '#f2c14e'); },
    dormitorio: function (P, T) { room(P, '#e9dff3', '#a77e5c'); win(P, 150, 24, 44, 40);
      P.r(176, 100, 4, 50, '#55331a'); P.r(294, 112, 4, 38, '#55331a'); P.r(178, 124, 118, 14, '#7a4a24'); P.r(182, 110, 26, 14, '#ffffff'); P.r(204, 112, 92, 14, '#c0392b'); P.r(204, 112, 92, 3, '#962a1f');
      P.r(300, 116, 18, 30, '#7a4a24'); P.r(304, 104, 10, 12, '#f2c14e'); P.o(309, 102, 6, 'rgba(255,230,140,.6)');
      for (var z = 0; z < 2; z++) { var ph = (T * .6 + z / 2) % 1; P.a(1 - ph, function () { P.t('z', 214 + ph * 16, 98 - ph * 30, 7 + ph * 5, '#6b4a80'); }); } },
    bano: function (P, T) { room(P, '#e6f1f6', '#b7c4cc'); for (var y = 60; y < 128; y += 8) for (var x = 140; x < 320; x += 8) P.r(x, y, 7.4, 7.4, (x + y) % 16 ? '#dbe9f0' : '#cfe0ea');
      P.r(150, 104, 90, 26, '#ffffff'); P.r(150, 104, 90, 3, '#d9e2e8'); P.r(152, 130, 6, 10, '#c9d3d9'); P.r(232, 130, 6, 10, '#c9d3d9'); P.l(230, 104, 230, 84, '#8a8a8a', 1.4); P.o(226, 84, 3, '#8a8a8a');
      for (var b = 0; b < 4; b++) { var ph = (T * .5 + b / 4) % 1; P.a(1 - ph, function () { P.o(165 + b * 18, 100 - ph * 30, 2 + b % 2, 'rgba(255,255,255,.9)'); }); }
      P.r(262, 92, 34, 8, '#ffffff'); P.r(274, 100, 10, 28, '#ffffff'); P.r(264, 50, 30, 36, '#9fc7de'); P.r(262, 48, 34, 2, '#8a8a8a'); P.r(300, 70, 14, 30, '#4f8fbf'); },
    sala: function (P, T) { room(P, '#f1e2c2', '#9c6b44'); P.r(150, 34, 54, 40, '#b8892e'); P.r(154, 38, 46, 32, '#5f8fb5'); P.p([[154, 70], [170, 52], [182, 62], [200, 46], [200, 70]], '#3f7d3a');
      P.r(160, 136, 150, 14, '#8e1b2c'); P.r(166, 98, 120, 30, '#2f6b4f'); P.r(166, 88, 120, 14, '#3f7d5f'); P.r(160, 94, 10, 34, '#2f6b4f'); P.r(282, 94, 10, 34, '#2f6b4f');
      P.r(304, 62, 3, 66, '#55331a'); P.p([[296, 46], [314, 46], [310, 62], [300, 62]], '#f2c14e', [OUT, .6]); P.o(305, 54, 10, 'rgba(255,225,130,' + (0.25 + 0.1 * Math.sin(T * 3)) + ')'); },
    comedor: function (P, T) { room(P, '#efe2c6', '#a8774f'); P.l(230, 0, 230, 26, '#55331a', 1); P.o(230, 30, 9, '#b8892e'); for (var c = -1; c <= 1; c++) P.o(230 + c * 8, 36, 2.2, '#ffe08a');
      P.r(160, 112, 150, 6, '#7a4a24'); P.r(166, 118, 4, 26, '#55331a'); P.r(300, 118, 4, 26, '#55331a');
      for (var k = 0; k < 4; k++) { var x = 172 + k * 36; P.r(x, 92, 3, 50, '#55331a'); P.r(x, 120, 14, 3, '#55331a'); P.o(x + 16, 108, 5, '#fff'); P.o(x + 16, 108, 2.5, '#e8a33d'); }
      P.r(222, 100, 6, 10, '#c0392b'); P.o(225, 98, 2, '#ffd34d'); },
    jardin: function (P, T) { var c = P.c, g = c.createLinearGradient(0, 0, 0, 130 * S); g.addColorStop(0, '#5fa8d8'); g.addColorStop(1, '#cfe8f5'); c.fillStyle = g; c.fillRect(0, 0, W * S, 130 * S);
      P.p([[0, 112], [0, 86], [40, 70], [80, 88], [130, 62], [180, 84], [230, 66], [280, 86], [320, 72], [320, 112]], '#7d8da3'); P.r(0, 112, W, 68, '#6aa84f'); P.r(0, 150, W, 30, '#5b9443');
      P.r(286, 72, 8, 50, '#6b4423'); P.o(290, 62, 18, '#3f7d3a'); P.r(210, 118, 34, 10, '#cfc6b4'); P.r(218, 104, 18, 16, '#d9d1bf');
      for (var d = 0; d < 5; d++) { var ph = (T * 1.6 + d / 5) % 1; P.o(227 + Math.cos(d) * 8 * ph, 100 - 12 * Math.sin(ph * Math.PI), 1.2, '#9fd3f0'); }
      for (var f = 0; f < 12; f++) { var fx = 150 + f * 14, fy = 150 + (f % 2) * 10; P.l(fx, fy, fx, fy - 10, '#3f7d3a', 1); P.o(fx, fy - 10, 3, ['#e05a6a', '#f2c14e', '#fff', '#c86bd0'][f % 4]); } },
    escalera: function (P, T) { room(P, '#efe4cc', '#a8774f');
      for (var i = 0; i < 8; i++) { var x = 160 + i * 18, y = 132 - i * 13; P.r(x, y, 160 - i * 18, 13, i % 2 ? '#8a5a2b' : '#7a4a24'); P.r(x, y, 160 - i * 18, 2, '#a8774f'); }
      P.l(164, 112, 300, 8, '#55331a', 2); for (var k = 0; k < 8; k++) P.l(170 + k * 18, 108 - k * 13, 170 + k * 18, 126 - k * 13, '#55331a', 1.2);
      P.r(290, 4, 30, 6, '#55331a'); P.t('↑', 200, 40 + Math.sin(T * 3) * 3, 14, '#8e1b2c'); }
  };
  // ---- the llama (cream, long neck, blanket in Andean stripes, pompoms on the ears)
  function llama(P, x, y, T, mood, walk) {
    var leg = walk ? Math.sin(T * 12) * 3 : 0, bob = walk ? Math.abs(Math.sin(T * 12)) * 1.5 : (mood === 'happy' ? Math.abs(Math.sin(T * 10)) * 4 : 0);
    var shake = mood === 'no' ? Math.sin(T * 30) * 2 : 0, c = P.c; c.save(); c.translate(0, -bob * S);
    var cream = '#f4ead6', shade = '#ddd0b4';
    [[x - 16, leg], [x - 8, -leg], [x + 8, leg], [x + 16, -leg]].forEach(function (L) { P.r(L[0] - 2.5, y - 26, 5, 24 + L[1] * 0, OUT); P.r(L[0] - 1.5, y - 25, 3, 23, shade); P.r(L[0] - 2.5 + L[1] * .3, y - 3, 5, 3, '#5a3b1c'); });
    P.o(x, y - 34, 24, OUT); P.r(x - 23, y - 46, 46, 22, OUT); P.o(x, y - 34, 22.6, cream); P.r(x - 22, y - 45, 44, 20, cream);
    var bands = ['#c0392b', '#f2c14e', '#2b5aa0', '#2f7d5b', '#c86bd0'];
    for (var b = 0; b < 5; b++) P.r(x - 14 + b * 6, y - 52, 6, 22, bands[b]); P.r(x - 15, y - 52, 31, 1.5, OUT); P.r(x - 15, y - 31, 31, 1.5, OUT);
    for (var tt = 0; tt < 6; tt++) P.r(x - 14 + tt * 5.5, y - 30, 2, 4, bands[tt % 5]);
    P.r(x + 18 + shake * .5, y - 88, 12, 50, OUT); P.r(x + 19 + shake * .5, y - 87, 10, 48, cream);
    var hx = x + 24 + shake, hy = y - 92;
    P.r(hx - 9, hy - 8, 22, 16, OUT); P.r(hx - 8, hy - 7, 20, 14, cream); P.r(hx + 8, hy - 2, 7, 9, OUT); P.r(hx + 8, hy - 1, 6, 7, shade);
    P.r(hx - 7, hy - 16, 4, 10, OUT); P.r(hx - 6, hy - 15, 2, 8, cream); P.r(hx + 1, hy - 16, 4, 10, OUT); P.r(hx + 2, hy - 15, 2, 8, cream);
    P.o(hx - 5, hy - 17, 2.6, '#c0392b'); P.o(hx + 3, hy - 17, 2.6, '#2b5aa0');
    var blink = (Math.floor(T * 10) % 31) === 0;
    if (mood === 'happy') { P.l(hx, hy - 1, hx + 3, hy - 3, OUT, 1); P.l(hx + 3, hy - 3, hx + 6, hy - 1, OUT, 1); }
    else if (blink) P.r(hx + 1, hy - 2, 4, .8, OUT); else { P.r(hx + 2, hy - 3, 2.4, 3, OUT); P.r(hx + 2.6, hy - 2.6, .8, .8, '#fff'); }
    P.r(hx + 12, hy + 4, 2, 1, OUT); if (mood === 'happy') P.r(hx + 8, hy + 6, 5, 1.2, '#8e1b2c');
    P.r(x - 26, y - 44, 6, 6, OUT); P.r(x - 25, y - 43, 4, 4, cream);
    c.restore();
  }
  function bubble(P, x, y, txt, a) {
    P.a(a, function () { var w = txt.length * 5.6 + 16; P.r(x - 1, y - 1, w + 2, 20, OUT); P.r(x, y, w, 18, '#fff'); P.p([[x + 8, y + 18], [x + 16, y + 18], [x + 4, y + 26]], '#fff', [OUT, .8]); P.r(x + 6, y + 17, 12, 2, '#fff'); P.t(txt, x + w / 2, y + 9.5, 9.5, '#1a2340', 800); });
  }
  // ---- the game
  function Game(root, cfg) {
    var self = this; this.cfg = cfg; this.base = cfg.audioBase || '../../audio/'; root._ll = this;
    root.classList.add('ll');
    var st = el('div', 'll-stage'); root.appendChild(st);
    this.cv = el('canvas', 'll-cv'); this.cv.width = W * S; this.cv.height = H * S; this.cv.setAttribute('role', 'img'); this.cv.setAttribute('aria-label', 'A llama walks through the rooms of a house'); st.appendChild(this.cv);
    this.P = new Pt(this.cv.getContext('2d'));
    this.start = el('button', 'll-start', '<span><i aria-hidden="true">&#9654;</i><span>Tour the house with the llama<small>Pasea con la llama</small></span></span>'); this.start.type = 'button'; st.appendChild(this.start);
    var pn = el('div', 'll-panel'); root.appendChild(pn);
    this.q = el('div', 'll-q', '&iquest;Qu&eacute; cuarto es? <small>(cuarto = room)</small>'); pn.appendChild(this.q);
    this.opts = el('div', 'll-opts'); pn.appendChild(this.opts);
    this.fb = el('div', 'll-fb'); this.fb.setAttribute('aria-live', 'polite'); pn.appendChild(this.fb);
    var bar = el('div', 'll-bar'); root.appendChild(bar);
    this.dots = el('div', 'll-dots'); bar.appendChild(this.dots);
    this.next = el('button', 'll-next', 'Next room &#9654;'); this.next.type = 'button'; this.next.hidden = true; bar.appendChild(this.next);
    this.audio = new Audio(); this.order = []; this.i = -1; this.mood = ''; this.walk = 0; this.wrong = 0; this.firstTry = 0;
    this.start.addEventListener('click', function () { self.start.hidden = true; self.begin(); });
    this.next.addEventListener('click', function () { self.go(self.i + 1); });
    this.opts.innerHTML = '<span style="font-size:15px;color:#5f554a">Press <strong>Tour the house with the llama</strong> to begin.</span>';
    this.loop();
  }
  Game.prototype.say = function (clip) { try { this.audio.pause(); this.audio.src = this.base + clip; var p = this.audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} };
  Game.prototype.begin = function () {
    var self = this; this.order = shuffle(this.cfg.rooms.slice()); this.wrong = 0; this.firstTry = 0;
    this.dots.innerHTML = ''; this.order.forEach(function () { self.dots.appendChild(el('i')); });
    this.go(0);
  };
  Game.prototype.go = function (i) {
    var self = this; this.i = i; this.next.hidden = true; this.fb.textContent = ''; this.fb.className = 'll-fb'; this.mood = ''; this.tries = 0;
    if (i >= this.order.length) return this.end();
    [].forEach.call(this.dots.children, function (d, k) { d.className = k < i ? 'done' : (k === i ? 'on' : ''); });
    var r = this.order[i], others = shuffle(this.cfg.rooms.filter(function (x) { return x.key !== r.key; })).slice(0, 2);
    this.walkStart = performance.now(); this.opts.innerHTML = '';
    shuffle([r].concat(others)).forEach(function (o) {
      var b = el('button', 'll-opt', o.es); b.type = 'button'; b.disabled = true;
      b.addEventListener('click', function () { self.pick(o, b); }); self.opts.appendChild(b);
    });
    setTimeout(function () { [].forEach.call(self.opts.children, function (b) { b.disabled = false; }); self.say(self.cfg.askClip); }, 900);
  };
  Game.prototype.pick = function (o, b) {
    var self = this, r = this.order[this.i]; this.tries++;
    if (o.key === r.key) {
      b.classList.add('ok'); [].forEach.call(this.opts.children, function (x) { x.disabled = true; });
      if (this.tries === 1) this.firstTry++;
      this.mood = 'happy'; this.moodAt = performance.now();
      this.fb.className = 'll-fb ok'; this.fb.innerHTML = '&iexcl;S&iacute;! Es <strong>' + r.es + '</strong> (' + r.en + ').';
      this.say(r.clip); this.next.hidden = false; this.next.innerHTML = this.i === this.order.length - 1 ? 'Finish the tour &#9654;' : 'Next room &#9654;';
      this.next.focus();
    } else {
      b.classList.add('no'); b.disabled = true; this.wrong++; this.mood = 'no'; this.moodAt = performance.now();
      this.fb.className = 'll-fb no'; this.fb.innerHTML = 'No, no es <strong>' + o.es + '</strong>. ' + (r.hint || 'Look again at the room.');
      this.say(this.cfg.noClip);
    }
  };
  Game.prototype.end = function () {
    var n = this.order.length; [].forEach.call(this.dots.children, function (d) { d.className = 'done'; });
    this.mood = 'happy'; this.moodAt = performance.now(); this.endShown = true;
    this.q.innerHTML = '&iexcl;Muy bien!'; this.opts.innerHTML = '';
    this.fb.className = 'll-fb ok'; this.fb.innerHTML = 'You toured all ' + n + ' rooms. Right on the first try: ' + this.firstTry + ' of ' + n + '.';
    var again = el('button', 'll-opt', 'Tour again'); again.type = 'button'; var self = this;
    again.addEventListener('click', function () { self.endShown = false; self.q.innerHTML = '&iquest;Qu&eacute; cuarto es? <small>(cuarto = room)</small>'; self.begin(); }); this.opts.appendChild(again);
    this.next.hidden = true; this.say(this.cfg.yesClip);
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title || 'La llama y la casa', done: true, summary: 'Toured all ' + n + ' rooms; ' + this.firstTry + ' right on the first try' } })); } catch (e) {}
  };
  Game.prototype.loop = function () {
    var self = this;
    requestAnimationFrame(function () {
      var P = self.P, T = performance.now() / 1000, c = P.c; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W * S, H * S);
      var r = self.i >= 0 && self.i < self.order.length ? self.order[self.i] : null;
      if (!r && self.endShown) r = self.order[self.order.length - 1];
      (ROOMS[r ? r.key : 'sala'])(P, T);
      var wt = r && !self.endShown ? Math.min(1, (performance.now() - self.walkStart) / 900) : 1;
      var lx = 20 + 60 * wt, walking = wt < 1;
      var mood = self.mood && performance.now() - self.moodAt < (self.mood === 'no' ? 600 : 100000) ? self.mood : '';
      llama(P, lx, 166, T, mood, walking);
      if (r && !walking && !self.endShown && self.mood !== 'happy') bubble(P, lx + 40, 20, '¿Qué cuarto es?', 1);
      if (self.mood === 'happy' && r && !self.endShown) bubble(P, lx + 40, 20, '¡Sí! ' + r.es.charAt(0).toUpperCase() + r.es.slice(1), 1);
      if (self.endShown) bubble(P, lx + 40, 20, '¡Muy bien!', 1);
      if (!r && !self.endShown) { P.t('La llama y la casa', 160, 22, 15, '#fff', 900); }
      self.loop();
    });
  };
  function init() {
    if (!document.getElementById('ll-css')) { var s = document.createElement('style'); s.id = 'll-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.llama-game'), function (r) { if (!r.dataset.llReady) { r.dataset.llReady = '1'; new Game(r, JSON.parse(r.getAttribute('data-llama'))); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

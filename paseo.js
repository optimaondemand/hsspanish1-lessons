/* paseo.js v2: "Un paseo por la ciudad", a first-person walk through a colonial town (Spanish 1 S2, Lesson 3.01).
   David 2026-11-16: a WASD adventure (walk the streets, turn left and right, minimap in the bottom right) to find and
   identify the module's places. v2 (same day, David's review): roomier town (streets 2 cells wide, a big open plaza with
   the trees round its edge), every place clearly different (height, colour, shape), taller buildings seen over lower
   ones, higher resolution with cobbles, paving, sidewalks and haze; "Press E to select building"; an opening card in
   an antique Spanish hand: "Bienvenido a la ciudad" + "Demos un paseo para encontrar todos los lugares."
   W/S (or ↑/↓) walk, A/D (or ←/→) turn, E (or Space, or a click on the view) selects. On-screen buttons do the same.
   Rounds: 1 · Lee y escucha (word shown + spoken)  2 · Solo escucha (spoken)  3 · Los recados (English errand).
   Buildings carry NO Spanish signs. el centro = the streets round the plaza; la plaza = the open square; la calle = any
   street outside the plaza. A place found gets its Spanish name on the minimap. All art is original, drawn in code.
   Markup: <div class="paseo-game" data-paseo='{"id","title","audioBase","perRound":[9,5,5],
            "places":[{"key","es","en","clip","hint","errand","item"}]}'></div>
   Practice only; reports to All Your Work with a 'mw-game' event when the walk is finished. */
(function () {
  'use strict';
  var VW = 960, VH = 540, FOV = 1.2, CAMH = .5, REACH = 3.2, HOR = VH / 2;
  var FW = 480, FH = 135;   // the street surface is cast at half resolution, then scaled
  // ------------------------------------------------------------------ the town: 22 x 22 cells. '.' street, 'p' plaza, '#' building
  var N = 22, MAP = [];
  (function () {
    var band = function (i) { return i === 0 || i === N - 1 ? 'w' : (i >= 3 && i <= 5) || (i >= 16 && i <= 18) ? 'b' : (i >= 8 && i <= 13) ? 'c' : 's'; };
    for (var y = 0; y < N; y++) { var row = ''; for (var x = 0; x < N; x++) { var bx = band(x), by = band(y);
      row += bx === 'w' || by === 'w' ? '#' : bx === 's' || by === 's' ? '.' : bx === 'c' && by === 'c' ? 'p' : '#'; } MAP.push(row); }
  })();
  function solid(x, y) { return x < 0 || y < 0 || x >= N || y >= N || MAP[y][x] === '#'; }
  function isPlaza(x, y) { return MAP[y] && MAP[y][x] === 'p'; }
  function inCentro(x, y) { return x >= 6 && x <= 15 && y >= 6 && y <= 15; }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  // building fronts: first cell, along x or y, n cells, the side the street is on, texture
  var FRONTS = [
    { at: [8, 5], along: 'x', n: 6, s: 'S', t: 'catedral' },
    { at: [8, 16], along: 'x', n: 6, s: 'N', t: 'museo' },
    { at: [5, 8], along: 'y', n: 3, s: 'E', t: 'banco' },
    { at: [16, 11], along: 'y', n: 3, s: 'W', t: 'hospital' },
    { at: [5, 3], along: 'y', n: 3, s: 'E', t: 'tienda' },
    { at: [16, 5], along: 'x', n: 3, s: 'S', t: 'restaurante' },
    { at: [3, 16], along: 'x', n: 3, s: 'N', t: 'mercado' }];
  var FRONT = {};
  FRONTS.forEach(function (f) {
    for (var i = 0; i < f.n; i++) {
      var cx = f.at[0] + (f.along === 'x' ? i : 0), cy = f.at[1] + (f.along === 'y' ? i : 0);
      var k = (f.s === 'S' || f.s === 'W') ? i : f.n - 1 - i;   // slice of the texture, left to right as seen from the street
      FRONT[cx + ',' + cy + f.s] = { t: f.t, k: k };
    }
  });
  var PLACE_TEX = { banco: 1, tienda: 1, restaurante: 1, museo: 1, mercado: 1, hospital: 1 };
  var HEIGHT = { catedral: 2.9, museo: 1.85, banco: 1.75, hospital: 1.7, tienda: 1.5, restaurante: 1.35, mercado: 1.5 };
  var HOUSES = [ // colour, height, door, balconies, flowers
    { c: ['#e8cfa3', '#d6b886'], h: 1.15, d: ['#7a4a26', '#4f2e16'], b: 1 }, { c: ['#d98c6e', '#c27456'], h: 1.4, d: ['#3f6d8f', '#2a4d68'], b: 1, f: 1 },
    { c: ['#bcd6c0', '#9dbfa3'], h: 1.0, d: ['#7a4a26', '#4f2e16'], b: 0, f: 1 }, { c: ['#f3e3b5', '#dcc796'], h: 1.3, d: ['#5a7a3a', '#3e5a26'], b: 1 },
    { c: ['#c9a3c8', '#b088af'], h: 1.1, d: ['#7a4a26', '#4f2e16'], b: 0 }, { c: ['#f0c27a', '#d9a65a'], h: 1.25, d: ['#8e1b2c', '#6f1422'], b: 1, f: 1 }];
  function texOf(cx, cy, side) {
    var f = FRONT[cx + ',' + cy + side];
    return f || { t: 'house' + Math.floor(rnd(cx * 31 + cy * 17 + side.charCodeAt(0) * 7) * HOUSES.length), k: 0 };
  }
  var SPRITES = [{ x: 11, y: 11, t: 'fuente' }];
  [[8.5, 8.5], [9.7, 8.4], [8.4, 9.7], [13.5, 8.5], [12.3, 8.4], [13.6, 9.7], [8.5, 13.5], [9.7, 13.6], [8.4, 12.3], [13.5, 13.5], [12.3, 13.6], [13.6, 12.3]].forEach(function (p) { SPRITES.push({ x: p[0], y: p[1], t: 'arbol' }); });
  [[1.3, 6.5], [1.3, 15.5], [20.7, 6.5], [20.7, 15.5], [6.5, 1.3], [15.5, 1.3], [6.5, 20.7], [15.5, 20.7], [6.3, 9], [15.7, 13], [9, 6.3], [13, 15.7], [1.3, 11], [20.7, 11], [11, 1.3], [11, 20.7]].forEach(function (p) { SPRITES.push({ x: p[0], y: p[1], t: 'farol' }); });
  [[9.4, 15.35, 'estatua', .32], [12.6, 15.35, 'estatua2', .32], [16.6, 6.75, 'mesa'], [17.75, 6.8, 'mesa'], [18.85, 6.75, 'mesa'], [3.35, 2.3, 'guia'], [9.2, 10.6, 'gente1'], [12.6, 9.4, 'gente2'], [4.5, 6.6, 'gente3'], [17.4, 14.7, 'gente1'], [6.7, 17.5, 'gente2']].forEach(function (p) { SPRITES.push({ x: p[0], y: p[1], t: p[2], r: p[3] }); });

  var CSS =
    '.ps{max-width:1000px;margin:0 auto 6px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.ps-stage{position:relative;border:4px solid #5a3b1c;outline:2px solid #b8892e;outline-offset:2px;background:#000;line-height:0;overflow:hidden;border-radius:2px}' +
    '.ps-stage:focus{outline-color:#8e1b2c}.ps-cv{display:block;width:100%;height:auto;cursor:crosshair}' +
    '.ps-intro{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(30,18,8,.5);line-height:1.3}' +
    '.ps-intro[hidden],.ps-paused[hidden]{display:none}' +
    '.ps-card{width:min(80%,660px);text-align:center;padding:24px 34px 22px;border-radius:6px;background:#f6ecd2 url("../../img/siglo/paper.jpg");box-shadow:0 0 0 3px #b8892e,0 0 0 8px #f6ecd2,0 0 0 10px #8e1b2c,0 14px 40px rgba(0,0,0,.5);color:#2a1f16}' +
    '.ps-script{font-family:"Pinyon Script","IM Fell English",Georgia,serif;font-size:64px;line-height:1.1;color:#8e1b2c;margin:0;font-weight:400}' +
    '.ps-orn{color:#b8892e;font-size:18px;letter-spacing:.5em;margin:2px 0 10px}' +
    '.ps-es{font-family:"IM Fell English",Georgia,serif;font-size:28px;color:#2a1f16;margin:0}' +
    '.ps-en{font-family:"IM Fell English",Georgia,serif;font-style:italic;font-size:20px;color:#5f554a;margin:4px 0 14px}' +
    '.ps-how{font:15px/1.6 "Segoe UI",Arial,sans-serif;color:#3a2f24;margin:0 0 16px}.ps-how kbd,.ps-keys kbd{font:700 13px "Segoe UI",Arial,sans-serif;border:1px solid #b9a77f;border-bottom-width:2px;border-radius:4px;padding:0 5px;background:#fff}' +
    '.ps-go{font:700 20px "Segoe UI",Arial,sans-serif;background:#8e1b2c;color:#fff;border:0;border-radius:999px;padding:12px 30px;cursor:pointer;box-shadow:0 0 0 3px #fff,0 0 0 5px #b8892e}.ps-go:hover{background:#6f1422}' +
    '.ps-paused{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(20,12,6,.45);cursor:pointer;border:0;width:100%}' +
    '.ps-paused>span{background:#8e1b2c;color:#fff;font:700 20px "Segoe UI",Arial,sans-serif;padding:12px 26px;border-radius:999px;box-shadow:0 0 0 4px #fff,0 0 0 7px #b8892e;line-height:1.3}.ps-paused small{display:block;font-weight:400;font-size:14px}' +
    '.ps-pad{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#f4ecd8;border:1px solid #ddcba4;border-top:0;padding:8px 12px}' +
    '.ps-pad button{font:700 16px "Segoe UI",Arial,sans-serif;background:#fff;color:#1a2340;border:2px solid #c9b58a;border-radius:8px;padding:6px 12px;cursor:pointer;min-width:44px;user-select:none;touch-action:none}' +
    '.ps-pad button:hover{background:#f7ecd2}.ps-pad .go{background:#8e1b2c;color:#fff;border-color:#8e1b2c}.ps-pad .go:hover{background:#6f1422}' +
    '.ps-keys{font-size:14px;color:#5f554a;margin-left:auto}' +
    '.ps-panel{background:#fffdf7;border:1px solid #ddcba4;border-top:0;padding:14px 18px 12px;line-height:1.4}' +
    '.ps-round{font:700 13px "Segoe UI",Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8e1b2c;margin-bottom:6px}' +
    '.ps-q{display:flex;align-items:center;flex-wrap:wrap;gap:12px;font:700 26px "Segoe UI",Arial,sans-serif;color:#1a2340;min-height:44px}' +
    '.ps-q small{font-weight:400;font-size:17px;color:#5f554a}.ps-q .en{font-weight:600;font-size:21px}' +
    '.ps-say{width:44px;height:44px;border-radius:50%;border:2px solid #b8892e;background:#1d4e8f;color:#fff;font-size:20px;cursor:pointer;line-height:1;flex:none}.ps-say:hover{background:#163b6c}' +
    '.ps-fb{min-height:26px;margin-top:8px;font:17px/1.5 "Segoe UI",Arial,sans-serif}.ps-fb.ok{color:#1d5e20;font-weight:600}.ps-fb.no{color:#8f1d12}' +
    '.ps-bar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;background:#f4ecd8;border:1px solid #ddcba4;border-top:0;padding:8px 12px}' +
    '.ps-dots{display:flex;gap:6px}.ps-dots i{width:14px;height:14px;border-radius:50%;background:#d9ccb0}.ps-dots i.done{background:#2A9D5C}.ps-dots i.on{background:#b8892e}' +
    '.ps-basket{display:flex;align-items:center;gap:4px;font-size:22px;min-height:30px}.ps-basket b{font:600 14px "Segoe UI",Arial,sans-serif;color:#5f554a;margin-right:4px}' +
    '.ps-next{margin-left:auto;font:600 15px "Segoe UI",Arial,sans-serif;background:#1a2340;color:#fff;border:0;border-radius:999px;padding:8px 20px;cursor:pointer}.ps-next[hidden]{display:none}' +
    '.ps-end ul{margin:6px 0 0 1.2em;padding:0}' +
    '.ps-win{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(30,18,8,.35);overflow:hidden;line-height:1.1;cursor:pointer}.ps-win[hidden]{display:none}' +
    '.ps-win .ps-script{font-size:96px;color:#fff;text-shadow:0 3px 0 #8e1b2c,0 6px 18px rgba(0,0,0,.6)}.ps-win small{font:italic 24px "IM Fell English",Georgia,serif;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7);margin-top:4px}' +
    '.ps-conf{position:absolute;top:-20px;width:12px;height:16px;animation:psfall linear forwards}@keyframes psfall{to{transform:translateY(640px) rotate(540deg)}}' +
    '.ps-bubble{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);max-width:80%;background:#fffdf7;border:3px solid #b8892e;border-radius:18px;padding:10px 20px;box-shadow:0 6px 18px rgba(0,0,0,.35);line-height:1.3;text-align:center}' +
    '.ps-bubble[hidden]{display:none}.ps-bubble b{display:block;font:700 24px "Segoe UI",Arial,sans-serif;color:#8e1b2c}.ps-bubble i{display:block;font:italic 16px "Segoe UI",Arial,sans-serif;color:#5f554a}';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function txt(h) { var t = document.createElement('textarea'); t.innerHTML = h; return t.value; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  // ------------------------------------------------------------------ texture painter
  function Pt(c) { this.c = c; }
  var pr = Pt.prototype;
  pr.fill = function (col, x0, y0, x1, y1) { if (typeof col === 'string') return col; var g = this.c.createLinearGradient(x0, y0, x1, y1); col.forEach(function (c, i) { g.addColorStop(i / (col.length - 1), c); }); return g; };
  pr.rect = function (x, y, w, h, col, line, r) { var c = this.c; c.beginPath(); if (r && c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); if (col) { c.fillStyle = this.fill(col, x, y, x, y + h); c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1]; c.stroke(); } };
  pr.ell = function (x, y, rx, ry, col, line) { var c = this.c; c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, 7); if (col) { c.fillStyle = this.fill(col, x, y - ry, x, y + ry); c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1]; c.stroke(); } };
  pr.poly = function (pts, col, line) { var c = this.c; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); if (col) { var ys = pts.map(function (q) { return q[1]; }); c.fillStyle = this.fill(col, 0, Math.min.apply(null, ys), 0, Math.max.apply(null, ys) + .01); c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1]; c.lineJoin = 'round'; c.stroke(); } };
  pr.line = function (a, b, x, y, col, w) { var c = this.c; c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.strokeStyle = col; c.lineWidth = w || 1; c.lineCap = 'round'; c.stroke(); };
  pr.curve = function (p, col, w) { var c = this.c; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[2], p[3], p[4], p[5]); c.strokeStyle = col; c.lineWidth = w || 1; c.lineCap = 'round'; c.stroke(); };
  pr.arch = function (x, y, w, h, col, line) { var c = this.c, r = w / 2; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y); c.arc(x + r, y, r, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); if (col) { c.fillStyle = this.fill(col, x, y - r, x, y + h); c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1]; c.stroke(); } };
  pr.text = function (s, x, y, size, col, w) { var c = this.c; c.font = (w || 800) + ' ' + size + 'px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); };

  var TW = 128;   // one cell of facade = 128 design px wide; a facade h cells high = 128*h design px tall
  function plaster(P, w, H, col, seed) {
    P.rect(0, 0, w, H, col);
    for (var i = 0; i < w / 3; i++) P.ell(rnd(seed + i) * w, rnd(seed * 3 + i) * H, 3 + rnd(i + seed) * 7, 1.6, 'rgba(80,50,25,.055)');
    P.rect(0, H - 16, w, 16, ['rgba(60,35,15,0)', 'rgba(60,35,15,.22)']);
  }
  function eaves(P, w, y) {
    P.rect(0, y, w, 10, ['#b5553a', '#8e3f2a']);
    for (var x = 0; x < w; x += 7) { P.ell(x + 3.5, y + 10, 3.6, 2.6, ['#c8664a', '#93412b']); P.line(x, y, x, y + 10, 'rgba(60,20,10,.35)', .7); }
    P.rect(0, y + 12, w, 4, ['#e9dcc0', '#bfa983']);
  }
  function cornice(P, w, y) { P.rect(-2, y, w + 4, 6, ['#efe4c9', '#c4b08a']); P.line(0, y + 6, w, y + 6, 'rgba(70,45,20,.4)', 1); }
  function win(P, x, y, w, h, shutters) {
    P.rect(x - 4, y - 5, w + 8, h + 10, ['#f1e6cc', '#cdbb94'], ['rgba(70,45,20,.45)', 1], 1);
    P.rect(x, y, w, h, ['#3b4a57', '#1f2b35']); P.rect(x + 2, y + 2, w - 4, h * .38, 'rgba(180,210,230,.22)');
    for (var k = 1; k < 4; k++) P.line(x + k * w / 4, y, x + k * w / 4, y + h, '#141414', 1.3);
    P.line(x, y + h / 2, x + w, y + h / 2, '#141414', 1.2);
    if (shutters) { P.rect(x - 11, y - 2, 8, h + 4, shutters); P.rect(x + w + 3, y - 2, 8, h + 4, shutters); for (var s = 0; s < h; s += 5) { P.line(x - 10, y + s, x - 4, y + s, 'rgba(0,0,0,.2)', .7); P.line(x + w + 4, y + s, x + w + 10, y + s, 'rgba(0,0,0,.2)', .7); } }
  }
  function balc(P, x, y, w) { P.rect(x - 6, y, w + 12, 5, ['#6b6b6b', '#3a3a3a']); P.line(x - 6, y - 17, x + w + 6, y - 17, '#2a2a2a', 1.6); for (var k = 0; k <= w + 8; k += 4) P.line(x - 4 + k, y - 17, x - 4 + k, y, '#2a2a2a', .9); for (var j = 0; j < w + 8; j += 8) P.curve([x - 4 + j, y - 8, x + j, y - 14, x + 4 + j, y - 8], '#2a2a2a', .8); }
  function flowers(P, x, y, w) { P.rect(x, y, w, 6, ['#a0522d', '#7a3d22']); for (var i = 0; i < w / 5; i++) { P.ell(x + 3 + i * 5, y - 1, 3.4, 3, '#3f8f4a'); P.ell(x + 3 + i * 5 + (i % 2), y - 3, 1.8, 1.8, ['#e05a6a', '#f2c14e', '#c0392b', '#f4f4f4'][i % 4]); } }
  function door(P, x, y, w, h, col) {
    P.arch(x - 5, y + 3, w + 10, h - 3, ['#efe3c8', '#c9b892'], ['rgba(70,45,20,.45)', 1]);
    P.arch(x, y + 5, w, h - 5, col || ['#7a4a26', '#4f2e16']);
    P.line(x + w / 2, y + 5 - w / 2 + 2, x + w / 2, y + h, 'rgba(0,0,0,.35)', 1.3);
    for (var k = 1; k < 5; k++) P.line(x + 2, y + 5 + k * (h - 5) / 5, x + w - 2, y + 5 + k * (h - 5) / 5, 'rgba(0,0,0,.16)', 1);
    P.ell(x + w / 2 - 4, y + h * .62, 1.6, 1.6, '#d4a640'); P.ell(x + w / 2 + 4, y + h * .62, 1.6, 1.6, '#d4a640');
  }
  function lantern(P, x, y) { P.line(x, y, x + 10, y, '#2a2a2a', 1.6); P.line(x + 10, y, x + 10, y + 4, '#2a2a2a', 1); P.poly([[x + 6, y + 4], [x + 14, y + 4], [x + 13, y + 15], [x + 7, y + 15]], ['#ffe9a8', '#e8b85a'], ['#2a2a2a', 1.2]); P.poly([[x + 5, y + 4], [x + 10, y], [x + 15, y + 4]], '#2a2a2a'); }
  function sign(P, x, y, draw, wide) { var w = wide || 30; P.line(x, y, x + w + 6, y, '#2a2a2a', 2); P.curve([x, y + 12, x + 8, y, x + 22, y], '#2a2a2a', 1.3); P.line(x + 10, y, x + 10, y + 6, '#2a2a2a', 1); P.line(x + w + 4, y, x + w + 4, y + 6, '#2a2a2a', 1); P.rect(x + 6, y + 6, w, w * .8, ['#f6ecd2', '#dcc79a'], ['#5a3b1c', 1.6], 3); draw(x + 6 + w / 2, y + 6 + w * .4); }
  function person(P, x, y, o) {
    var s = o.s || 1, sk = o.skin || '#c98d5c';
    P.ell(x, y, 10 * s, 2.4 * s, 'rgba(40,25,10,.25)');
    P.line(x - 2.2 * s, y - 19 * s, x - 2.4 * s, y, o.bottom || '#3a3a5a', 3.4 * s); P.line(x + 2.2 * s, y - 19 * s, x + 2.4 * s, y, o.bottom || '#3a3a5a', 3.4 * s);
    if (o.skirt) P.poly([[x - 5.5 * s, y - 23 * s], [x + 5.5 * s, y - 23 * s], [x + 10 * s, y - 2 * s], [x - 10 * s, y - 2 * s]], o.skirt);
    P.rect(x - 5.6 * s, y - 38 * s, 11.2 * s, 18 * s, o.top || '#b04a3a', null, 3.4 * s);
    if (o.wave) { P.line(x + 5 * s, y - 36 * s, x + 9.5 * s, y - 45 * s, o.top || '#b04a3a', 2.8 * s); P.line(x + 9.5 * s, y - 45 * s, x + 11 * s, y - 52 * s, o.top || '#b04a3a', 2.6 * s); P.ell(x + 11.3 * s, y - 54 * s, 1.7 * s, 2 * s, sk); }
    else { P.line(x + 5.2 * s, y - 36 * s, x + 7.4 * s, y - 23 * s, o.top || '#b04a3a', 2.8 * s); if (o.face) P.ell(x + 7.6 * s, y - 22 * s, 1.5 * s, 1.7 * s, sk); }
    P.line(x - 5.2 * s, y - 36 * s, x - 7.4 * s, y - 23 * s, o.top || '#b04a3a', 2.8 * s); if (o.face) P.ell(x - 7.6 * s, y - 22 * s, 1.5 * s, 1.7 * s, sk);
    P.rect(x - 1.7 * s, y - 41 * s, 3.4 * s, 4 * s, sk); P.ell(x, y - 45.5 * s, 5 * s, 5.5 * s, sk);
    if (o.face) {   // a friendly face: hair, open eyes, small brows, a smile, rosy cheeks
      P.ell(x, y - 49.5 * s, 5.2 * s, 2.4 * s, o.hair || '#3b2414'); P.ell(x - 4.6 * s, y - 46 * s, 1 * s, 2 * s, o.hair || '#3b2414'); P.ell(x + 4.6 * s, y - 46 * s, 1 * s, 2 * s, o.hair || '#3b2414');
      [-1.9, 1.9].forEach(function (e) { P.ell(x + e * s, y - 46 * s, .95 * s, 1.05 * s, '#ffffff'); P.ell(x + e * s, y - 45.8 * s, .55 * s, .65 * s, '#2a1a10'); P.curve([x + (e - .9) * s, y - 47.8 * s, x + e * s, y - 48.4 * s, x + (e + .9) * s, y - 47.8 * s], '#3b2414', .45 * s); });
      P.ell(x - 3 * s, y - 43.6 * s, 1.1 * s, .7 * s, 'rgba(220,90,80,.35)'); P.ell(x + 3 * s, y - 43.6 * s, 1.1 * s, .7 * s, 'rgba(220,90,80,.35)');
      P.curve([x - 1.8 * s, y - 43 * s, x, y - 41.6 * s, x + 1.8 * s, y - 43 * s], '#8a3a2a', .55 * s);
    }
    if (o.hat) { P.ell(x, y - 49 * s, 10 * s, 2.2 * s, o.hat); P.rect(x - 4.4 * s, y - 55 * s, 8.8 * s, 6.5 * s, o.hat, null, 2.2 * s); if (o.face) P.rect(x - 4.4 * s, y - 51.6 * s, 8.8 * s, 1.2 * s, '#8e1b2c'); } else if (!o.face) P.ell(x, y - 48.5 * s, 5.4 * s, 3.2 * s, o.hair || '#2b1d12');
  }

  // a carved marble statue on a molded pedestal: a robed classical figure holding up a laurel wreath, lit from the left
  function marble(P, x, base, s, flip) {
    var c = P.c; c.save(); c.translate(x, base); if (flip) c.scale(-1, 1); c.scale(s, s);
    function hg(x0, x1, stops) { var g = c.createLinearGradient(x0, 0, x1, 0); stops.forEach(function (st) { g.addColorStop(st[0], st[1]); }); return g; }
    var M = [[0, '#fdfcf8'], [.45, '#ebe6db'], [.8, '#c9c1b2'], [1, '#a59d8e']];   // marble, light on the left
    function path(pts, fill, stroke) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) { var q = pts[i]; if (q.length === 4) c.quadraticCurveTo(q[0], q[1], q[2], q[3]); else c.lineTo(q[0], q[1]); } c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = .6; c.stroke(); } }
    function fold(a, b, d, e, f, g, col, w) { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(d, e, f, g); c.strokeStyle = col; c.lineWidth = w || .8; c.lineCap = 'round'; c.stroke(); }
    // pedestal: cornice, die with a recessed panel, base moulding, all with side light
    path([[-17, 0], [17, 0], [17, -6], [-17, -6]], hg(-17, 17, M), 'rgba(90,80,60,.5)');
    path([[-15, -6], [15, -6], [15, -9], [-15, -9]], hg(-15, 15, M));
    path([[-12, -9], [12, -9], [12, -40], [-12, -40]], hg(-12, 12, M), 'rgba(90,80,60,.5)');
    path([[-8, -14], [8, -14], [8, -35], [-8, -35]], 'rgba(120,110,90,.18)'); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = .6; c.strokeRect(-8, -35, 16, 21);
    path([[-15, -40], [15, -40], [15, -43], [-15, -43]], hg(-15, 15, M));
    path([[-17, -43], [17, -43], [16, -47], [-16, -47]], hg(-17, 17, M), 'rgba(90,80,60,.5)');
    c.translate(0, -47);   // the figure stands on the pedestal top
    c.fillStyle = 'rgba(80,70,55,.25)'; c.beginPath(); c.ellipse(0, 0, 13, 2, 0, 0, 7); c.fill();
    // long robe (chiton) flaring to the feet, weight on the right leg (contrapposto)
    path([[-7, -46], [7, -46], [9, -30, 10, -14], [12, -4, 13, 0], [-12, 0], [-11, -6, -10, -14], [-9, -30, -7, -46]], hg(-12, 13, M));
    for (var k = -9; k <= 10; k += 3.2) fold(k * .55, -40, k * .9, -20, k, -1, 'rgba(120,110,95,.45)', .9);
    for (var k2 = -8; k2 <= 9; k2 += 3.2) fold(k2 * .55 + 1.2, -40, k2 * .9 + 1.1, -20, k2 + 1.2, -1, 'rgba(255,255,255,.55)', .6);
    // a mantle draped from the left shoulder across the hips
    path([[-7, -46], [-2, -46], [6, -30, 11, -22], [9, -18], [0, -24, -9, -26], [-8, -36, -7, -46]], hg(-9, 11, [[0, '#ffffff'], [.5, '#e4ded2'], [1, '#b3ab9c']]), 'rgba(110,100,85,.4)');
    fold(-6, -38, 1, -30, 9, -21, 'rgba(120,110,95,.5)', .8); fold(-6, -33, 0, -27, 7, -21, 'rgba(255,255,255,.6)', .6);
    // the right arm hangs down holding the mantle; the left arm is raised with a laurel wreath
    path([[6, -45], [9, -44], [10, -34, 9, -26], [7, -26], [7.5, -34, 6, -45]], hg(6, 10, M));
    c.fillStyle = hg(6, 10, M); c.beginPath(); c.ellipse(8, -25, 1.8, 2.2, 0, 0, 7); c.fill();
    path([[-6, -45], [-9, -44], [-12, -52, -13, -60], [-11, -61], [-9.5, -53, -6, -45]], hg(-13, -6, M));
    c.fillStyle = hg(-14, -10, M); c.beginPath(); c.ellipse(-12.4, -62, 1.8, 2, 0, 0, 7); c.fill();
    c.strokeStyle = hg(-17, -8, M); c.lineWidth = 1.4; c.beginPath(); c.ellipse(-12.4, -66, 4.4, 3.4, 0, 0, 7); c.stroke();
    for (var l = 0; l < 10; l++) { var a = l / 10 * 6.28; c.fillStyle = l % 2 ? '#d9d3c6' : '#f4f1ea'; c.beginPath(); c.ellipse(-12.4 + Math.cos(a) * 4.4, -66 + Math.sin(a) * 3.4, 1.4, .7, a, 0, 7); c.fill(); }
    // neck and head (blank marble eyes), hair gathered in a bun, a soft shadow under the chin
    path([[-1.6, -46], [1.6, -46], [1.6, -50], [-1.6, -50]], hg(-1.6, 1.6, M));
    c.fillStyle = hg(-4.4, 4.4, M); c.beginPath(); c.ellipse(0, -54, 3.8, 4.6, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(110,100,85,.3)'; c.beginPath(); c.ellipse(.6, -50, 3, 1.1, 0, 0, 7); c.fill();
    c.fillStyle = hg(-4.6, 4.6, [[0, '#f6f3ec'], [1, '#b8b0a2']]); c.beginPath(); c.ellipse(0, -57, 4.2, 2.8, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(1.2, -59.4, 2.6, 2.2, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(120,110,95,.5)'; c.lineWidth = .4; [-1.5, 1.5].forEach(function (e) { c.beginPath(); c.moveTo(e - .8, -54.6); c.quadraticCurveTo(e, -55.3, e + .8, -54.6); c.stroke(); });
    c.beginPath(); c.moveTo(0, -54); c.lineTo(.5, -52.3); c.stroke(); c.beginPath(); c.moveTo(-.9, -51.4); c.quadraticCurveTo(0, -51, .9, -51.4); c.stroke();
    c.restore();
  }

  var TEX = {
    house: function (P, H, v) {
      var o = HOUSES[v], w = TW; plaster(P, w, H, o.c, v * 13 + 5); eaves(P, w, 0);
      var up = H > 140, wy = 34;
      if (up) { if (o.b) { balc(P, 24, wy + 42, 26); balc(P, 78, wy + 42, 26); } win(P, 26, wy, 22, 30, v % 2 ? ['#2e6b4f', '#1f4d38'] : null); win(P, 80, wy, 22, 30, v % 2 ? ['#2e6b4f', '#1f4d38'] : null); cornice(P, w, wy + 46); if (o.f) flowers(P, 22, wy + 34, 30); }
      var dy = H - 74; door(P, 46, dy, 36, 72, o.d);
      win(P, 14, dy + 20, 16, 26);
      if (!o.f) win(P, 98, dy + 20, 16, 26); else { P.rect(96, dy + 36, 22, 30, ['#c26a3a', '#8e4a26'], null, 3); P.ell(107, dy + 30, 14, 10, '#3f8f4a'); P.ell(103, dy + 27, 2.4, 2.4, '#e05a6a'); P.ell(111, dy + 31, 2.4, 2.4, '#f2c14e'); }
      lantern(P, 30, dy - 10);
    },
    banco: function (P, H) {   // 3 cells: red tezontle stone, a white stone portico with four columns, a gold coin
      var w = TW * 3; plaster(P, w, H, ['#a54a3a', '#7e3529'], 77); cornice(P, w, 0);
      for (var r = 0; r < H / 9; r++) for (var c = 0; c < w / 16 + 1; c++) P.rect(c * 16 + (r % 2) * 8, 8 + r * 9, 16, 9, null, ['rgba(40,15,10,.18)', .8]);
      for (var k = 0; k < 6; k++) win(P, 18 + k * 64, 30, 22, 30);
      P.poly([[86, 104], [192, 64], [298, 104]], ['#f4ede0', '#cfc3a6'], ['rgba(70,45,20,.45)', 1.2]);
      P.rect(80, 104, 224, 10, ['#ece4d0', '#c9bd9f']);
      P.ell(192, 88, 13, 13, ['#f6dc8a', '#c99a2e'], ['#8a6a1a', 1.4]); P.text('$', 192, 89, 17, '#7a5a10', 900);
      for (var k2 = 0; k2 < 4; k2++) { var cx = 100 + k2 * 61.3; P.rect(cx - 8, 114, 16, H - 146, ['#f7f1e3', '#d3c7aa'], ['rgba(70,45,20,.4)', .9]); for (var f = -4; f <= 4; f += 4) P.line(cx + f, 118, cx + f, H - 34, 'rgba(90,70,40,.22)', .8); P.rect(cx - 11, 112, 22, 6, '#e3d9bf'); P.rect(cx - 11, H - 34, 22, 6, '#e3d9bf'); }
      P.rect(74, H - 28, 236, 8, ['#e3d9bf', '#bfb18e']); P.rect(66, H - 20, 252, 9, ['#d9cdb0', '#b5a582']); P.rect(58, H - 11, 268, 11, ['#cfc2a2', '#a8986f']);
      door(P, 172, H - 120, 40, 90, ['#3d2a18', '#22160b']);
      win(P, 130, H - 100, 18, 40); win(P, 236, H - 100, 18, 40);
      person(P, 50, H - 2, { top: '#2b2b3a', bottom: '#2b2b3a', skin: '#e0b38c', hat: '#1a1a1a', s: 1.2 });
    },
    tienda: function (P, H) {   // 3 cells: blue-and-white tiles (like the Casa de los Azulejos), two big shop windows
      var w = TW * 3; P.rect(0, 0, w, H, '#f4f7fb'); cornice(P, w, 0);
      for (var ty = 8; ty < H - 6; ty += 10) for (var tx = 0; tx < w; tx += 10) { P.rect(tx + .5, ty + .5, 9, 9, (tx + ty) % 20 ? '#f4f7fb' : '#dce8f4'); P.ell(tx + 5, ty + 5, 2.6, 2.6, '#2f5f99'); P.ell(tx + 5, ty + 5, 1, 1, '#f4f7fb'); }
      for (var k = 0; k < 3; k++) { balc(P, 30 + k * 128, 80, 52); win(P, 40 + k * 128, 34, 32, 40); }
      [[16, '#a83a4a'], [228, '#1d4e8f']].forEach(function (sw, i) {
        var x = sw[0]; P.rect(x, H - 100, 140, 96, ['#5a3b1c', '#3d2610'], null, 3); P.rect(x + 5, H - 95, 130, 86, ['#fff8e6', '#f0dfb8']);
        for (var a = 0; a < 7; a++) P.poly([[x + a * 20, H - 112], [x + a * 20 + 20, H - 112], [x + a * 20 + 22, H - 98], [x + a * 20 + 2, H - 98]], a % 2 ? sw[1] : '#fbf6ea');
        if (!i) { P.ell(x + 30, H - 40, 18, 4.4, '#3b2a1a'); P.rect(x + 20, H - 62, 20, 22, ['#4a3420', '#2e2012'], null, 4); P.rect(x + 20, H - 50, 20, 4, '#c0392b'); P.ell(x + 74, H - 46, 16, 4, '#d9b45a'); P.rect(x + 66, H - 64, 16, 18, ['#e8c878', '#c8a050'], null, 4); P.ell(x + 112, H - 52, 12, 3.4, '#1a1a1a'); P.rect(x + 104, H - 68, 16, 16, ['#2a2a2a', '#111'], null, 3); P.rect(x + 104, H - 58, 16, 3, '#b8892e'); }
        else { [[30, '#d35a7a'], [70, '#2e7d6a'], [110, '#e8a33d']].forEach(function (d) { P.poly([[x + d[0] - 9, H - 80], [x + d[0] + 9, H - 80], [x + d[0] + 16, H - 22], [x + d[0] - 16, H - 22]], [d[1], '#5a3b2a']); P.ell(x + d[0], H - 84, 6, 6, '#e0c09a'); }); }
        P.rect(x + 5, H - 14, 130, 4, '#c9b58a');
      });
      door(P, 172, H - 72, 40, 70, ['#3f7d5f', '#2a5a43']);
    },
    restaurante: function (P, H) {   // 3 cells: ochre, a long striped awning, tables with parasols, a plate sign
      var w = TW * 3; plaster(P, w, H, ['#f2c46a', '#d9a647'], 53); eaves(P, w, 0);
      for (var k = 0; k < 3; k++) { balc(P, 34 + k * 128, 74, 40); win(P, 44 + k * 128, 30, 26, 32, ['#8e1b2c', '#6f1422']); flowers(P, 38 + k * 128, 66, 38); }
      for (var a = 0; a < 16; a++) P.poly([[a * 24, 92], [a * 24 + 24, 92], [a * 24 + 28, 114], [a * 24 + 4, 114]], a % 2 ? '#c0392b' : '#fbf6ea');
      for (var b = 0; b < 16; b++) P.ell(b * 24 + 16, 114, 12, 4, b % 2 ? '#c0392b' : '#fbf6ea');
      door(P, 170, H - 96, 44, 94, ['#7a3a1e', '#4f2412']); win(P, 60, H - 84, 30, 40); win(P, 296, H - 84, 30, 40);
      for (var s = 0; s < 14; s++) P.ell(14 + s * 27, 124 + Math.sin(s) * 3, 2.6, 3.2, ['#fff3b0', '#f2c14e']);   // a string of lights
      person(P, 250, H - 2, { top: '#ffffff', bottom: '#1a1a1a', skin: '#c98d5c', s: 1.15 }); P.ell(261, H - 54, 11, 2.6, '#cfcfcf'); P.ell(259, H - 57, 4.4, 2.6, '#c0632b');
    },
    hospital: function (P, H) {   // 3 cells: white, a blue band, a big blue H, an arched porch, a nurse
      var w = TW * 3; plaster(P, w, H, ['#fbfaf6', '#e7e2d6'], 91); cornice(P, w, 0);
      P.rect(0, 10, w, 12, ['#3a78c2', '#1d4e8f']);
      for (var c = 0; c < 6; c++) { win(P, 22 + c * 62, 38, 26, 34); P.rect(24 + c * 62, 58, 22, 7, '#f4f4f4'); P.rect(24 + c * 62, 54, 7, 5, '#ffffff', null, 1); }
      P.rect(0, 84, w, 6, ['#d9d2c0', '#b9b09c']);
      P.rect(168, 90, 48, 46, '#ffffff', ['#2e7d32', 3], 6); P.rect(186, 95, 12, 36, ['#3cae5a', '#23803c']); P.rect(174, 107, 36, 12, ['#3cae5a', '#23803c']);
      for (var a = 0; a < 5; a++) P.arch(26 + a * 72, H - 54, 42, 52, a === 2 ? ['#4f86c6', '#2f5f99'] : ['#3b4a57', '#22303b'], ['#efe3c8', 4]);
      person(P, 116, H - 2, { top: '#ffffff', skirt: ['#ffffff', '#e2e2e2'], skin: '#e0b38c', hat: '#ffffff', s: 1.15 });
      P.rect(270, H - 30, 46, 5, '#8a8a8a'); P.line(274, H - 25, 274, H - 4, '#6b6b6b', 2); P.line(312, H - 25, 312, H - 4, '#6b6b6b', 2);
    },
    mercado: function (P, H) {   // 3 cells: an open arcade, six bays, each with its own goods
      var w = TW * 3; plaster(P, w, H, ['#d9a68a', '#c08a6c'], 61); eaves(P, w, 0);
      for (var p = 0; p < 24; p++) { var px = 6 + p * 16; P.line(px - 8, 26, px + 8, 26, '#5a3b1c', .8); P.poly([[px - 7, 26], [px + 7, 26], [px + 7, 40], [px, 44], [px - 7, 40]], ['#e05a6a', '#f2c14e', '#2e7d6a', '#1d4e8f', '#c0392b', '#8e4a7a'][p % 6]); }
      var cols = [['#c0392b', '#fbf6ea'], ['#1d4e8f', '#fbf6ea'], ['#d48a1d', '#fbf6ea'], ['#2e7d32', '#fbf6ea'], ['#8e1b2c', '#fbf6ea'], ['#1d6a6a', '#fbf6ea']];
      var T0 = H - 46;   // table top
      function crate(x, y, w2, h2) { P.rect(x, y, w2, h2, ['#c8a06a', '#9a7442'], ['#6b4a26', .8], 1); P.line(x, y + h2 / 2, x + w2, y + h2 / 2, 'rgba(80,50,20,.5)', .7); }
      function watermelon(x, y) { P.ell(x, y, 10, 7, ['#3f8f3a', '#22602a'], ['#1d4d22', .6]); for (var k = -2; k <= 2; k++) P.curve([x + k * 3.4, y - 6.6, x + k * 4.2, y, x + k * 3.4, y + 6.6], '#9fd17a', 1.2); }
      function slice(x, y) { P.poly([[x - 9, y], [x + 9, y], [x, y - 12]], '#e8463c'); P.line(x - 9, y, x + 9, y, '#3f8f3a', 2.4); P.line(x - 8, y - .8, x + 8, y - .8, '#f4f0c8', 1); for (var k = 0; k < 5; k++) P.ell(x - 4 + k * 2, y - 4 - (k % 2) * 3, .7, 1.1, '#1a1a1a'); }
      function banana(x, y) { for (var k = 0; k < 5; k++) P.curve([x - 4 + k * 2, y - 12, x - 9 + k * 2.6, y - 2, x - 1 + k * 2.4, y + 6], '#f2d034', 2.6); P.rect(x - 1, y - 14, 3, 4, '#6b8a2a'); }
      function pineapple(x, y) { P.ell(x, y, 5.5, 8, ['#e8a33d', '#b8731d'], ['#8a5a1a', .6]); for (var k = -2; k <= 2; k++) { P.line(x - 5, y + k * 3, x + 5, y + k * 3 + 3, 'rgba(110,70,20,.6)', .6); P.line(x + 5, y + k * 3, x - 5, y + k * 3 + 3, 'rgba(110,70,20,.6)', .6); } for (var l = -2; l <= 2; l++) P.poly([[x, y - 7], [x + l * 2.6, y - 17 + Math.abs(l) * 2], [x + l * .8, y - 7]], '#3f8f3a'); }
      function tomato(x, y) { P.ell(x, y, 3.6, 3.2, ['#f05a3c', '#c0392b']); P.poly([[x - 1.6, y - 3], [x, y - 4.4], [x + 1.6, y - 3], [x, y - 2.2]], '#2e7d32'); }
      function avocado(x, y) { P.ell(x, y + 1, 3.4, 4.2, ['#3f5a2a', '#25381a']); P.ell(x, y - 2, 2.4, 2.6, ['#3f5a2a', '#25381a']); }
      function corn(x, y) { P.ell(x, y, 3, 9, ['#f6d65a', '#d9a62a']); for (var k = -6; k <= 6; k += 2.4) P.line(x - 2.4, y + k, x + 2.4, y + k, 'rgba(150,100,20,.5)', .5); P.poly([[x - 3, y + 6], [x - 7, y - 8], [x - 1, y + 2]], '#8fb85a'); P.poly([[x + 3, y + 6], [x + 7, y - 8], [x + 1, y + 2]], '#7aa84a'); }
      function pot(x, y, s2) { s2 = s2 || 1; P.poly([[x - 7 * s2, y - 12 * s2], [x + 7 * s2, y - 12 * s2], [x + 10 * s2, y - 4 * s2], [x + 6 * s2, y], [x - 6 * s2, y], [x - 10 * s2, y - 4 * s2]], ['#c8663a', '#8e3f22']); P.rect(x - 8 * s2, y - 14 * s2, 16 * s2, 3 * s2, '#a8522c', null, 1); P.line(x - 8 * s2, y - 6 * s2, x + 8 * s2, y - 6 * s2, '#f2d9a8', 1); }
      function basket(x, y) { P.poly([[x - 9, y - 9], [x + 9, y - 9], [x + 7, y], [x - 7, y]], ['#d9b07a', '#a87d48'], ['#7a5a2a', .6]); for (var k = -7; k <= 7; k += 3) P.line(x + k, y - 9, x + k * .8, y, 'rgba(110,80,40,.6)', .6); P.curve([x - 8, y - 9, x, y - 20, x + 8, y - 9], '#8e6a3a', 1.4); }
      function orange(x, y) { P.ell(x, y, 3.2, 3.2, ['#f7a23a', '#d97a10']); P.ell(x + .8, y - 2.6, .9, .6, '#3f8f3a'); }
      function flower(x, y, c) { P.line(x, y, x, y + 12, '#3f8f3a', 1); P.ell(x, y, 3.4, 3.4, c); P.ell(x, y, 1.2, 1.2, '#f2c14e'); }
      for (var a = 0; a < 6; a++) {
        var bx = 6 + a * 63, cx = bx + 28;
        P.arch(bx, 70, 56, H - 74, ['#4a3020', '#2e1c10'], ['#efe3c8', 4]);
        for (var k = 0; k < 7; k++) P.rect(bx + k * 8, 96, 8, 14, k % 2 ? cols[a][0] : cols[a][1]);
        for (var f = 0; f < 7; f++) P.ell(bx + 4 + f * 8, 110, 4, 2.8, f % 2 ? cols[a][0] : cols[a][1]);
        if (a === 3) person(P, cx, H - 6, { top: '#f2f2f2', bottom: '#5a4a3a', skin: '#b5754a', hat: '#d9b45a', s: 1.4, face: 1 });   // the vendor, behind the counter
        P.rect(bx + 2, T0, 52, 5, ['#9a6a3b', '#6b4423']); P.rect(bx + 4, T0 + 5, 48, H - T0 - 7, ['#b8875c', '#8e5d36']);
        P.line(bx + 4, T0 + 18, bx + 52, T0 + 18, 'rgba(60,35,15,.35)', .8);
        if (a === 0) { watermelon(cx - 12, T0 - 6); watermelon(cx + 10, T0 - 6); watermelon(cx - 1, T0 - 15); slice(cx + 16, T0 + 14); slice(cx - 14, T0 + 14); }
        else if (a === 1) { for (var b2 = 0; b2 < 3; b2++) banana(bx + 12 + b2 * 15, 128); pineapple(cx - 13, T0 - 8); pineapple(cx, T0 - 8); pineapple(cx + 13, T0 - 8); }
        else if (a === 2) { crate(bx + 6, T0 - 12, 20, 12); crate(bx + 30, T0 - 12, 20, 12); for (var r = 0; r < 3; r++) for (var c = 0; c <= 2 - r; c++) { tomato(bx + 10 + c * 6 + r * 3, T0 - 15 - r * 5); avocado(bx + 34 + c * 6 + r * 3, T0 - 15 - r * 5.5); } for (var lm = 0; lm < 5; lm++) P.ell(bx + 12 + lm * 8, T0 + 12, 3, 2.6, ['#9fd14a', '#6ea82a']); }
        else if (a === 3) { for (var rs = 0; rs < 2; rs++) { P.line(bx + 14 + rs * 28, 112, bx + 14 + rs * 28, 142, '#6b4a26', .8); for (var ch = 0; ch < 6; ch++) P.poly([[bx + 14 + rs * 28 - 3, 116 + ch * 4.4], [bx + 14 + rs * 28 + 3, 116 + ch * 4.4], [bx + 14 + rs * 28 + (ch % 2 ? 4 : -4), 123 + ch * 4.4]], ['#d9342a', '#9e1b14']); } for (var cn = 0; cn < 5; cn++) if (cn !== 2) corn(bx + 8 + cn * 10, T0 - 9); }
        else if (a === 4) { pot(cx - 14, T0); pot(cx + 2, T0, 1.2); pot(cx + 18, T0, .8); basket(cx - 6, T0 + 30); basket(cx + 14, T0 + 30); }
        else { basket(cx - 10, T0); for (var o = 0; o < 6; o++) orange(cx - 15 + o * 2 + (o % 3) * 3, T0 - 10 - Math.floor(o / 3) * 4); P.rect(cx + 6, T0 - 14, 14, 14, ['#6a8fb5', '#3e6a95'], null, 2); [['#e05a6a', -2], ['#f2c14e', 3], ['#f4f4f4', 8], ['#c0392b', 13]].forEach(function (fl, i2) { flower(cx + 7 + i2 * 3.4, T0 - 24 - (i2 % 2) * 3, fl[0]); }); }
      }
      person(P, 282, H - 2, { top: '#8e4a7a', skirt: ['#3f5a9a', '#2d4278'], skin: '#c98d5c', s: 1.1 });
    },
    museo: function (P, H) {   // 6 cells: a white temple front with eight columns and a painting banner
      var w = TW * 6; P.rect(0, 0, w, H, ['#f1ebdd', '#d6cbb0']);
      P.poly([[20, 120], [384, 30], [748, 120]], ['#f7f2e6', '#d9cfb6'], ['rgba(70,45,20,.45)', 1.6]);
      P.poly([[110, 114], [384, 46], [658, 114]], 'rgba(120,100,70,.16)');
      for (var f = 0; f < 9; f++) { P.curve([200 + f * 42, 92, 221 + f * 42, 108, 242 + f * 42, 92], '#8a7a5a', 2.4); P.ell(200 + f * 42, 92, 4, 4, '#b8a77f'); }   // a carved garland
      P.rect(12, 116, w - 24, 26, ['#ece4d0', '#c9bd9f'], ['rgba(70,45,20,.35)', 1]);   // the frieze, with a carved inscription
      (function () { var c = P.c; c.save(); c.font = '700 19px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        if ('letterSpacing' in c) c.letterSpacing = '6px';
        c.fillStyle = 'rgba(255,255,255,.7)'; c.fillText('MUSEO DE BELLAS ARTES', 385, 130.5); c.fillStyle = '#5a4630'; c.fillText('MUSEO DE BELLAS ARTES', 384, 129.5); c.restore(); })();
      for (var k = 0; k < 8; k++) { var cx = 70 + k * 89.7; P.rect(cx - 13, 142, 26, H - 184, ['#fbf8f0', '#ddd3bb'], ['rgba(70,45,20,.4)', 1]); for (var g = -8; g <= 8; g += 4) P.line(cx + g, 148, cx + g, H - 46, 'rgba(90,70,40,.2)', .9); P.rect(cx - 17, 140, 34, 6, '#e3d9bf'); P.rect(cx - 17, H - 44, 34, 8, '#e3d9bf'); }
      for (var st = 0; st < 4; st++) P.rect(0, H - 36 + st * 9, w, 9, ['#e9e0c8', '#c3b593']);
      // two painting banners hang between the columns; the great door stands on the top step, under the inscription
      [204, 563].forEach(function (bx) { P.rect(bx - 24, 150, 48, 66, ['#8e1b2c', '#6f1422']); P.poly([[bx - 24, 216], [bx, 206], [bx + 24, 216], [bx + 24, 222], [bx - 24, 222]], '#8e1b2c');
        P.rect(bx - 16, 158, 32, 26, ['#d4a640', '#9a7420']); P.rect(bx - 12, 162, 24, 18, ['#7fb0d6', '#c7dfee']); P.poly([[bx - 12, 180], [bx - 5, 170], [bx, 175], [bx + 5, 168], [bx + 12, 180]], '#4f8f43'); P.ell(bx + 8, 166, 2.4, 2.4, '#ffe28a'); });
      door(P, 360, 166, 48, H - 36 - 166, ['#3d2a18', '#22160b']);
      person(P, 250, H - 2, { top: '#3f5a9a', bottom: '#2a2a3a', skin: '#e0b38c', s: 1.15 }); person(P, 520, H - 2, { top: '#c0392b', skirt: ['#2d4278', '#1d2f5a'], skin: '#c98d5c', s: 1.1 });
    },
    catedral: function (P, H) {   // 6 cells, very tall: twin bell towers with domes, a great dome, a carved central door
      var w = TW * 6, body = H * .42;
      [[0, 1], [w - 44, -1]].forEach(function (s2) { var x = s2[0]; P.rect(x, H * .52, 44, H * .48, ['#e9dcc0', '#cdb994'], ['rgba(70,45,20,.4)', 1]); P.rect(x - 2, H * .52, 48, 8, ['#efe4c9', '#c4b08a']); P.arch(x + 12, H * .52 + 40, 20, 34, '#3a2a1c', ['#efe4c9', 3]); P.rect(x, H - 18, 44, 18, ['#e3d9bf', '#bfb18e']); });
      P.rect(150, body, w - 300, H - body, ['#efe4cc', '#d1c09b'], ['rgba(70,45,20,.4)', 1.2]);
      P.poly([[150, body], [384, body - 60], [618, body]], ['#efe4cc', '#d6c6a3'], ['rgba(70,45,20,.4)', 1.2]);
      P.ell(384, body - 50, 70, 64, ['#e8cf86', '#b8963f'], ['rgba(90,60,20,.4)', 1]); P.rect(374, body - 140, 20, 30, '#e8cf86'); P.line(384, body - 140, 384, body - 168, '#5a4a2a', 3); P.line(374, body - 158, 394, body - 158, '#5a4a2a', 3);
      for (var r = 0; r < 4; r++) P.line(384 - 70 + r * 46, body - 50, 384, body - 112, 'rgba(120,80,20,.25)', 1.2);
      [40, 618].forEach(function (x) {
        var tw = 110;
        P.rect(x, H * .14, tw, H - H * .14, ['#f2e9d5', '#d3c3a0'], ['rgba(70,45,20,.4)', 1.2]);
        for (var lv = 0; lv < 3; lv++) { var ly = H * .14 + lv * H * .16; P.rect(x - 6, ly, tw + 12, 8, ['#efe4c9', '#c4b08a']); P.arch(x + 34, ly + 28, 42, 52, '#3a2a1c', ['#efe4c9', 4]); }
        P.ell(x + tw / 2, H * .14, 46, 40, ['#e8cf86', '#b8963f']); P.rect(x + tw / 2 - 6, H * .14 - 62, 12, 26, '#e8cf86'); P.line(x + tw / 2, H * .14 - 62, x + tw / 2, H * .14 - 90, '#5a4a2a', 3); P.line(x + tw / 2 - 9, H * .14 - 80, x + tw / 2 + 9, H * .14 - 80, '#5a4a2a', 3);
      });
      P.rect(150, body + 30, w - 300, 10, ['#efe4c9', '#c4b08a']);
      for (var c = 0; c < 4; c++) P.rect(300 + c * 56 - 8, body + 60, 16, H - body - 100, ['#f7f1e3', '#d3c7aa'], ['rgba(70,45,20,.35)', .8]);
      P.ell(384, body + 80, 24, 24, ['#a8c8e8', '#4d74a0'], ['#efe4c9', 5]);
      P.arch(344, H - 170, 80, 168, ['#5a3b1c', '#3a2510'], ['#efe4c9', 8]);
      for (var k = 0; k < 2; k++) win(P, 200 + k * 344, body + 90, 26, 44);
      P.rect(130, H - 18, w - 260, 18, ['#e3d9bf', '#bfb18e']);
    }
  };
  var SPR = {   // billboards, 128 x 128 design px, standing on the bottom edge
    fuente: function (P) { P.ell(64, 118, 60, 10, ['#cfc3a6', '#a8986f'], ['rgba(70,45,20,.45)', 1.4]); P.ell(64, 116, 52, 7, ['#8ec9ea', '#5fa8d3']); P.rect(59, 50, 10, 66, ['#efe6cf', '#c4b48e']); P.ell(64, 50, 22, 5, ['#efe6cf', '#c4b48e']); P.ell(64, 48, 17, 3.6, '#8ec9ea'); P.rect(61, 26, 6, 22, ['#efe6cf', '#c4b48e']); P.ell(64, 26, 9, 3, ['#efe6cf', '#c4b48e']); for (var d = 0; d < 10; d++) { var a = d / 10 * 6.28; P.curve([64, 22, 64 + Math.cos(a) * 16, 12, 64 + Math.cos(a) * 26, 46], 'rgba(200,232,248,.85)', 1.8); P.curve([64, 46, 64 + Math.cos(a) * 30, 40, 64 + Math.cos(a) * 46, 112], 'rgba(200,232,248,.7)', 1.6); } },
    arbol: function (P) { P.ell(64, 125, 26, 4, 'rgba(40,25,10,.25)'); P.rect(60, 70, 8, 56, ['#7a5230', '#55361d']); [[0, -70, 34], [-24, -56, 26], [24, -56, 26], [-12, -88, 22], [14, -86, 22]].forEach(function (b, i) { P.ell(64 + b[0], 128 + b[1], b[2], b[2] * .85, i % 2 ? ['#5d9b4b', '#3b7034'] : ['#6aa84f', '#40793a']); }); for (var k = 0; k < 14; k++) P.ell(40 + rnd(k) * 48, 34 + rnd(k + 9) * 40, 2.4, 2.4, rnd(k + 3) > .5 ? '#e05a8a' : '#f4f4f4'); },
    farol: function (P) { P.rect(61, 30, 6, 98, ['#3a3a3a', '#1a1a1a']); P.rect(56, 120, 16, 8, '#2a2a2a'); P.poly([[54, 30], [74, 30], [72, 8], [56, 8]], ['#ffe9a8', '#e8b85a'], ['#1a1a1a', 2]); P.poly([[50, 9], [64, 0], [78, 9]], '#1a1a1a'); },
    mesa: function (P) {   // a café table with a checked cloth, two chairs and a parasol
      P.ell(64, 126, 34, 4, 'rgba(40,25,10,.22)');
      P.line(64, 22, 64, 124, '#4a3420', 2.6);
      P.poly([[18, 34], [64, 10], [110, 34]], ['#c0392b', '#7a1e14']); P.ell(64, 34, 46, 5, '#c0392b'); for (var k = -40; k <= 40; k += 16) P.line(64, 12, 64 + k, 34, 'rgba(255,255,255,.35)', 1);
      [[30, 1], [98, -1]].forEach(function (ch) { var x = ch[0]; P.rect(x - 7, 92, 14, 4, '#7a5230'); P.line(x - 6, 96, x - 7, 124, '#5a3a1e', 2); P.line(x + 6, 96, x + 7, 124, '#5a3a1e', 2); P.line(x + ch[1] * 6, 92, x + ch[1] * 6, 66, '#5a3a1e', 2.2); P.line(x + ch[1] * 6, 70, x + ch[1] * 2, 70, '#5a3a1e', 1.6); });
      P.line(56, 92, 52, 124, '#4a3420', 2); P.line(72, 92, 76, 124, '#4a3420', 2);
      P.poly([[36, 80], [92, 80], [96, 94], [32, 94]], '#fbf6ea', ['#c0392b', 1.2]); for (var c = 0; c < 8; c++) P.line(38 + c * 7, 80, 35 + c * 8, 94, 'rgba(192,57,43,.55)', 1.4);
      P.ell(52, 79, 8, 2.4, '#ffffff', ['#9a9a9a', .7]); P.ell(76, 79, 8, 2.4, '#ffffff', ['#9a9a9a', .7]); P.ell(52, 77, 4, 1.8, '#c0632b'); P.ell(76, 77, 4, 1.8, '#7dbb48'); P.rect(63, 70, 3, 9, 'rgba(170,215,235,.9)');
    },
    gente1: function (P) { person(P, 64, 126, { top: '#c0392b', skirt: ['#2d4278', '#1d2f5a'], skin: '#c98d5c', s: 2.2, face: 1 }); },
    gente2: function (P) { person(P, 64, 126, { top: '#e8c25a', bottom: '#4a3a2a', skin: '#b5754a', hat: '#d9b45a', s: 2.2, face: 1 }); },
    gente3: function (P) { person(P, 64, 126, { top: '#2e6b4f', bottom: '#2a2a3a', skin: '#e0b38c', s: 2.2, face: 1 }); },
    estatua: function (P) { marble(P, 64, 127, 1.04, false); },
    estatua2: function (P) { marble(P, 64, 127, 1.04, true); },
    guia: function (P) { person(P, 64, 126, { top: '#1d4e8f', bottom: '#3a2a1a', skin: '#c98d5c', hat: '#d9b45a', hair: '#3b2414', s: 2.2, wave: 1, face: 1 }); P.rect(52.5, 75, 23, 3, '#c0392b'); }
  };
  var BLADE = {   // pictures on the signs that hang out over the street (seen from both sides)
    banco: function (P, x, y) { for (var i = 0; i < 5; i++) P.ell(x, y + 14 - i * 6.5, 17, 5, ['#f6dc8a', '#b8892e'], ['#7a5a10', 1]); },
    tienda: function (P, x, y) { P.ell(x, y + 12, 24, 6, '#3b2a1a'); P.rect(x - 14, y - 14, 28, 26, ['#4a3420', '#2e2012'], null, 6); P.rect(x - 14, y + 2, 28, 5, '#c0392b'); },
    restaurante: function (P, x, y) { P.ell(x, y, 15, 15, '#ffffff', ['#6a6a6a', 2]); P.ell(x, y, 9, 9, null, ['#b0b0b0', 1.2]); P.line(x - 24, y - 15, x - 24, y + 17, '#3a3a3a', 3.4); for (var q = -1; q <= 1; q++) P.line(x - 24 + q * 3, y - 16, x - 24 + q * 3, y - 6, '#3a3a3a', 1.4); P.line(x + 24, y - 2, x + 24, y + 17, '#3a3a3a', 3.4); P.rect(x + 22, y - 16, 5, 15, '#7a7a7a'); },
    hospital: function (P, x, y) { P.rect(x - 22, y - 22, 44, 44, '#ffffff', ['#2e7d32', 3], 5); P.rect(x - 6, y - 18, 12, 36, ['#3cae5a', '#23803c']); P.rect(x - 18, y - 6, 36, 12, ['#3cae5a', '#23803c']); },
    mercado: function (P, x, y) { P.poly([[x - 22, y - 2], [x + 22, y - 2], [x + 17, y + 18], [x - 17, y + 18]], ['#d9b07a', '#a87d48'], ['#7a5a2a', 1]); [['#e74c3c', -12, -6], ['#f39c12', 0, -9], ['#7dbb48', 11, -6], ['#f4d03f', -5, -14], ['#8e44ad', 6, -15]].forEach(function (f) { P.ell(x + f[1], y + f[2], 7, 7, f[0]); }); P.curve([x - 18, y - 2, x, y - 34, x + 18, y - 2], '#8e6a3a', 2.4); }
  };
  // a sign = a thin panel standing out from a wall: anchor on the wall face, unit direction into the street
  var SIGNS = [
    { t: 'banco', x: 6, y: 10.55, dx: 1, dy: 0 }, { t: 'tienda', x: 6, y: 5.55, dx: 1, dy: 0 },
    { t: 'restaurante', x: 18.55, y: 6, dx: 0, dy: 1 }, { t: 'mercado', x: 3.45, y: 16, dx: 0, dy: -1 },
    { t: 'hospital', x: 16, y: 11.45, dx: -1, dy: 0 }];
  var SIGN_LEN = .62, SIGN_Z = [.92, 1.42];
  var SPR_H = { estatua: 1.45, estatua2: 1.45, mesa: .78, fuente: .95, arbol: 1.6, farol: 1.25, gente1: .85, gente2: .85, gente3: .85, guia: .9 };
  function buildTextures() {
    var T = {}, R = 2;
    function make(key, cells, h, fn, arg, res) {
      var r = res || R, Hd = Math.round(TW * h), c = canvas(TW * cells * r, Hd * r), x = c.getContext('2d'); x.scale(r, r); fn(new Pt(x), Hd, arg);
      // the first opaque row of each column, so shading never darkens the sky between towers
      var d = x.getImageData(0, 0, c.width, c.height).data, top = new Uint16Array(c.width);
      for (var col = 0; col < c.width; col++) { var y = 0; while (y < c.height && d[(y * c.width + col) * 4 + 3] < 20) y++; top[col] = y; }
      T[key] = { img: c, h: h, top: top, cells: cells };
    }
    HOUSES.forEach(function (o, v) { make('house' + v, 1, o.h, TEX.house, v); });
    ['banco', 'tienda', 'restaurante', 'hospital', 'mercado'].forEach(function (k) { make(k, 3, HEIGHT[k], TEX[k]); });
    make('museo', 6, HEIGHT.museo, TEX.museo, null, 3); make('catedral', 6, HEIGHT.catedral, TEX.catedral);
    Object.keys(BLADE).forEach(function (k) {
      var c = canvas(124 * R, 100 * R), x = c.getContext('2d'), P2 = new Pt(x); x.scale(R, R);
      P2.rect(0, 4, 124, 5, ['#4a4a4a', '#1a1a1a'], null, 2); P2.curve([2, 30, 4, 8, 26, 8], '#1a1a1a', 3); P2.curve([2, 30, 14, 26, 18, 16], '#1a1a1a', 2);
      P2.line(36, 9, 36, 18, '#1a1a1a', 1.6); P2.line(112, 9, 112, 18, '#1a1a1a', 1.6);
      P2.rect(26, 18, 96, 78, ['#f6ecd2', '#dcc79a'], ['#5a3b1c', 3], 5); P2.rect(31, 23, 86, 68, null, ['#b8892e', 1.4], 3);
      BLADE[k](P2, 74, 57); T['sign_' + k] = c;
    });
    Object.keys(SPR).forEach(function (k) { var r = /^estatua/.test(k) ? 3 : R, c = canvas(128 * r, 128 * r), x = c.getContext('2d'); x.scale(r, r); SPR[k](new Pt(x)); T[k] = { img: c }; });
    var sky = canvas(2400, 300), P = new Pt(sky.getContext('2d'));   // a panorama that wraps all the way round
    P.rect(0, 0, 2400, 300, ['#5fa3d9', '#a9d1ec', '#e9e4d6']);
    [[260, 120], [900, 100], [1500, 112], [2050, 92]].forEach(function (m) { var x = m[0], hg = m[1]; P.poly([[x - 260, 300], [x - 24, 300 - hg * 1.9], [x + 24, 300 - hg * 1.9], [x + 280, 300]], ['#8b9bb2', '#6f8098']); P.poly([[x - 64, 300 - hg * 1.6], [x - 24, 300 - hg * 1.9], [x + 24, 300 - hg * 1.9], [x + 66, 300 - hg * 1.56], [x + 22, 300 - hg * 1.66], [x - 18, 300 - hg * 1.5]], '#f6f9fc'); });
    for (var hh = 0; hh < 2400; hh += 120) P.ell(hh + 60, 300, 110, 38 + rnd(hh) * 22, ['#8aa58a', '#6e8a6e']);
    for (var cl = 0; cl < 12; cl++) { var cx = cl * 205 + 60, cy = 40 + (cl % 3) * 26; P.ell(cx, cy, 60, 13, 'rgba(255,255,255,.85)'); P.ell(cx + 34, cy - 8, 38, 13, 'rgba(255,255,255,.85)'); P.ell(cx - 30, cy + 2, 30, 9, 'rgba(255,255,255,.7)'); }
    T.sky = sky;
    return T;
  }

  // ------------------------------------------------------------------ the game
  function Game(root) {
    var cfg = JSON.parse(root.getAttribute('data-paseo')), g = this;
    this.cfg = cfg; this.base = cfg.audioBase || '../../audio/'; root._ps = this;
    this.places = {}; cfg.places.forEach(function (p) { g.places[p.key] = p; });
    root.classList.add('ps');
    var stage = this.stage = el('div', 'ps-stage'); stage.tabIndex = 0;
    var cv = this.cv = el('canvas', 'ps-cv'); cv.width = VW; cv.height = VH;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'A first-person view of a street in a colonial town, with a minimap in the bottom right corner.');
    stage.appendChild(cv);
    this.intro = el('div', 'ps-intro', '<div class="ps-card"><div class="ps-script">Bienvenido a la ciudad</div><div class="ps-orn">&#10070; &#10070; &#10070;</div>' +
      '<p class="ps-es">Demos un paseo para encontrar todos los lugares.</p><p class="ps-en">(Let&rsquo;s take a stroll to find all the places.)</p>' +
      '<p class="ps-how"><kbd>W</kbd> <kbd>S</kbd> walk &middot; <kbd>A</kbd> <kbd>D</kbd> turn left and right &middot; <kbd>E</kbd> select a building<br>The map in the corner shows where you are. Turn your sound on.</p>' +
      '<button type="button" class="ps-go">&#9654; Empezar &middot; Start</button></div>');
    this.pausedBtn = el('button', 'ps-paused', '<span>&#9654; Click here to keep walking<small>The keys work while the street view is selected</small></span>'); this.pausedBtn.type = 'button'; this.pausedBtn.hidden = true;
    this.bubble = el('div', 'ps-bubble'); this.bubble.hidden = true; this.bubble.setAttribute('aria-live', 'polite');
    stage.appendChild(this.bubble); stage.appendChild(this.intro); stage.appendChild(this.pausedBtn); root.appendChild(stage);
    var pad = el('div', 'ps-pad'); this.held = {};
    [['fwd', '&#9650; Walk'], ['back', '&#9660; Back'], ['left', '&#10226; Turn left'], ['right', 'Turn right &#10227;'], ['act', 'Select building (E)']].forEach(function (b) {
      var bt = el('button', b[0] === 'act' ? 'go' : '', b[1]); bt.type = 'button';
      if (b[0] === 'act') bt.addEventListener('click', function () { g.act(); g.stage.focus(); });
      else { var on = function (e) { e.preventDefault(); g.held[b[0]] = true; }, off = function () { g.held[b[0]] = false; };
        bt.addEventListener('pointerdown', on); bt.addEventListener('pointerup', off); bt.addEventListener('pointerleave', off); bt.addEventListener('pointercancel', off); }
      pad.appendChild(bt);
    });
    pad.appendChild(el('span', 'ps-keys', '<kbd>W</kbd> <kbd>S</kbd> walk &middot; <kbd>A</kbd> <kbd>D</kbd> turn &middot; <kbd>E</kbd> select'));
    root.appendChild(pad);
    var panel = el('div', 'ps-panel'); this.roundEl = el('div', 'ps-round'); this.qEl = el('div', 'ps-q'); this.fbEl = el('div', 'ps-fb');
    panel.appendChild(this.roundEl); panel.appendChild(this.qEl); panel.appendChild(this.fbEl); root.appendChild(panel);
    var bar = el('div', 'ps-bar'); this.dots = el('div', 'ps-dots'); this.basket = el('div', 'ps-basket', '<b>Your basket:</b>');
    this.next = el('button', 'ps-next', 'Next round &rarr;'); this.next.type = 'button'; this.next.hidden = true;
    bar.appendChild(this.dots); bar.appendChild(this.basket); bar.appendChild(this.next); root.appendChild(bar);
    this.ctx = cv.getContext('2d'); this.T = buildTextures(); this.zbuf = new Float32Array(VW);
    this.floor = canvas(FW, FH); this.fctx = this.floor.getContext('2d'); this.fimg = this.fctx.createImageData(FW, FH); this.f32 = new Uint32Array(this.fimg.data.buffer);
    this.reset(); this.t = 0; this.player = new Audio(); this.keys = {};
    this.intro.querySelector('.ps-go').addEventListener('click', function () { g.intro.hidden = true; g.begin(); });
    this.pausedBtn.addEventListener('click', function () { g.pausedBtn.hidden = true; g.stage.focus(); });
    var KEYS = { KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
    stage.addEventListener('keydown', function (e) {
      if (!g.round) return;
      if (KEYS[e.code]) { g.keys[KEYS[e.code]] = true; e.preventDefault(); }
      else if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) { g.act(); e.preventDefault(); }
    });
    stage.addEventListener('keyup', function (e) { if (KEYS[e.code]) g.keys[KEYS[e.code]] = false; });
    stage.addEventListener('blur', function () { g.keys = {}; if (g.round && !g.finished) setTimeout(function () { if (!root.contains(document.activeElement)) g.pausedBtn.hidden = false; }, 150); });
    stage.addEventListener('focus', function () { g.pausedBtn.hidden = true; });
    cv.addEventListener('click', function () { if (g.round) { g.stage.focus(); g.act(); } });
    this.next.addEventListener('click', function () { g.next.hidden = true; g.startRound(g.round + 1); g.stage.focus(); });
    this.loop();
  }
  var gp = Game.prototype;
  gp.reset = function () { this.px = 2; this.py = 2; this.pa = .62; this.found = {}; };
  gp.play = function (clip) { try { this.player.pause(); this.player.src = this.base + clip; this.player.currentTime = 0; var p = this.player.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} };
  gp.ding = function (ok) {
    try { var A = this.ac || (this.ac = new (window.AudioContext || window.webkitAudioContext)()), t = A.currentTime;
      (ok ? [660, 880, 1320] : [220, 180]).forEach(function (f, i) { var o = A.createOscillator(), gn = A.createGain(); o.type = ok ? 'triangle' : 'sine'; o.frequency.value = f; gn.gain.setValueAtTime(0, t + i * .09); gn.gain.linearRampToValueAtTime(.12, t + i * .09 + .02); gn.gain.exponentialRampToValueAtTime(.001, t + i * .09 + .3); o.connect(gn); gn.connect(A.destination); o.start(t + i * .09); o.stop(t + i * .09 + .35); }); } catch (e) {}
  };
  gp.say = function (line, ms) {   // a townsperson speaks: a bubble over the street + the clip
    var g = this; if (!line) return;
    this.bubble.innerHTML = '&#128075; <b>' + line.es + '</b><i>(' + line.en + ')</i>'; this.bubble.hidden = false;
    if (line.clip) this.play(line.clip);
    clearTimeout(this.bubbleT); this.bubbleT = setTimeout(function () { g.bubble.hidden = true; }, ms || 2600);
  };
  gp.begin = function () {
    var g = this; this.firstTry = 0; this.total = 0; this.finished = false; this.round = null; this.stage.focus();
    if (this.cfg.hello) { this.say(this.cfg.hello, 3000); setTimeout(function () { g.startRound(1); }, 2800); } else this.startRound(1);
  };
  gp.startRound = function (n) {
    var per = (this.cfg.perRound || [9, 5, 5])[n - 1] || 9;
    this.round = n; this.queue = shuffle(this.cfg.places.map(function (p) { return p.key; })).slice(0, per).map(function (k) { return { key: k }; });
    this.done = 0; this.n = this.queue.length;
    this.roundEl.innerHTML = ['', 'Round 1 of 3 &middot; Lee y escucha (read and listen)', 'Round 2 of 3 &middot; Solo escucha (listen only)', 'Round 3 of 3 &middot; Los recados (errands)'][n];
    this.basket.innerHTML = '<b>Your basket:</b>'; this.dots.innerHTML = ''; for (var i = 0; i < this.n; i++) this.dots.appendChild(el('i'));
    this.ask();
  };
  gp.ask = function () {
    var it = this.queue[0], p = this.places[it.key], g = this;
    this.want = it.key; this.review = !!it.review; this.tries = 0; this.busy = false;
    [].forEach.call(this.dots.children, function (d, i) { d.className = i < g.done ? 'done' : i === g.done ? 'on' : ''; });
    this.fbEl.className = 'ps-fb'; this.fbEl.innerHTML = '';
    if (this.round === 1) this.qEl.innerHTML = '<span>&iquest;D&oacute;nde est&aacute; ' + p.es + '?</span>';
    else if (this.round === 2) this.qEl.innerHTML = '<small>Listen. Where is it? Walk there and press E.</small>';
    else this.qEl.innerHTML = '<span class="en">' + p.errand + '</span>';
    if (this.round < 3) { var b = el('button', 'ps-say', '&#128266;'); b.type = 'button'; b.setAttribute('aria-label', 'Listen again'); b.addEventListener('click', function () { g.play(p.ask || p.clip); g.stage.focus(); }); this.qEl.insertBefore(b, this.qEl.firstChild); this.play(p.ask || p.clip); }
  };
  gp.looking = function () {
    var hs = this.cast(this.pa), h = hs[hs.length - 1];   // the nearest face
    var fx = 11 - this.px, fy = 11 - this.py, fd = Math.sqrt(fx * fx + fy * fy);
    var fa = Math.atan2(fy, fx) - this.pa; while (fa > Math.PI) fa -= 2 * Math.PI; while (fa < -Math.PI) fa += 2 * Math.PI;
    if (fd < REACH + .8 && Math.abs(fa) < .3 && (!h || fd < h.d)) return { kind: 'fuente' };
    if (h && h.d <= REACH) { var t = h.f.t; return PLACE_TEX[t] ? { kind: 'place', key: t } : { kind: t === 'catedral' ? 'catedral' : 'house' }; }
    return { kind: 'open' };
  };
  gp.act = function () {
    if (!this.round || this.busy || this.finished) return;
    var L = this.looking(), want = this.want, ok = false, msg = '', cx = Math.floor(this.px), cy = Math.floor(this.py), P = this.places;
    if (want === 'centro') ok = inCentro(cx, cy);
    else if (want === 'plaza') ok = isPlaza(cx, cy) || L.kind === 'fuente';
    else if (want === 'calle') ok = L.kind === 'open' && !isPlaza(cx, cy);
    else ok = L.kind === 'place' && L.key === want;
    if (ok) return this.success();
    if (L.kind === 'place') msg = 'No, that is <strong>' + P[L.key].es + '</strong> (' + P[L.key].en + '). ';
    else if (L.kind === 'house') msg = 'No, that is just <strong>una casa</strong> (a house). ';
    else if (L.kind === 'catedral') msg = 'No, that is the cathedral. ';
    else if (L.kind === 'fuente') msg = 'That is the fountain in <strong>' + P.plaza.es + '</strong>. ';
    else if (want !== 'centro' && want !== 'calle') msg = 'Walk up to the building and face it, then press E. ';
    else msg = 'Not here. ';
    this.tries++; this.ding(false);
    if (this.tries === 1 && !this.review) this.queue.splice(Math.min(3, this.queue.length), 0, { key: want, review: true });
    this.fbEl.className = 'ps-fb no'; this.fbEl.innerHTML = msg + P[want].hint;
  };
  gp.success = function () {
    var g = this, p = this.places[this.want];
    this.busy = true; if (!this.review) { this.total++; if (!this.tries) this.firstTry++; }
    this.ding(true); if (p.greet) this.say(p.greet); else this.play(p.clip); this.found[this.want] = true;
    this.fbEl.className = 'ps-fb ok'; this.fbEl.innerHTML = '&#10003; <strong>' + p.es + '</strong> = ' + p.en + '.' + (this.review ? ' <span style="font-weight:400;color:#5f554a">(This one came back for review.)</span>' : '');
    if (this.round === 3) this.qEl.innerHTML = '<span class="en">' + p.errand + '</span> &rarr; <span>' + p.es + '</span>';
    this.queue.shift(); if (!this.review) { this.basket.appendChild(el('span', null, p.item)); this.done++; }
    setTimeout(function () { if (!g.queue.length) g.endRound(); else g.ask(); }, 2400);
  };
  gp.celebrate = function () {
    var g = this, w = this.win || (this.win = el('div', 'ps-win'));
    w.innerHTML = '<div class="ps-script">&iexcl;Felicidades!</div><small>(Congratulations! You found every place.)</small>';
    var cols = ['#c0392b', '#f2c14e', '#2e7d32', '#1d4e8f', '#8e4a7a', '#e05a6a', '#ffffff'];
    for (var i = 0; i < 70; i++) { var c = el('i', 'ps-conf'); c.style.left = (Math.random() * 100) + '%'; c.style.background = cols[i % cols.length]; c.style.animationDuration = (2.4 + Math.random() * 2.4) + 's'; c.style.animationDelay = (Math.random() * 1.6) + 's'; c.style.clipPath = i % 2 ? 'polygon(0 0,100% 0,100% 80%,50% 100%,0 80%)' : 'none'; w.appendChild(c); }
    w.hidden = false; this.stage.insertBefore(w, this.bubble);
    w.onclick = function () { w.hidden = true; };
    setTimeout(function () { w.hidden = true; }, 7000);
    this.say(this.cfg.cheer || { es: '&iexcl;Felicidades!', en: 'Congratulations!' }, 4000);
  };
  gp.endRound = function () {
    var g = this; [].forEach.call(this.dots.children, function (d) { d.className = 'done'; });
    if (this.round < 3) {
      this.qEl.innerHTML = '<span>&iexcl;Felicidades!</span> <small>(Congratulations!) Round ' + this.round + ' is done.</small>';
      this.say(this.cfg.cheer || { es: '&iexcl;Felicidades!', en: 'Congratulations!' }, 3200);
      this.fbEl.className = 'ps-fb ok'; this.fbEl.innerHTML = this.round === 1 ? 'Next: you will only <em>hear</em> each place.' : 'Next: errands in English. Find the place for each one.';
      this.next.hidden = false; this.busy = true;
    } else {
      this.finished = true; this.celebrate();
      this.qEl.innerHTML = '<span>&iexcl;Felicidades!</span> <small>(Congratulations!) &iexcl;Qu&eacute; buen paseo!</small>';
      var list = this.cfg.places.map(function (p) { return '<li><strong>' + p.es + '</strong> = ' + p.en + '</li>'; }).join('');
      this.fbEl.className = 'ps-fb ps-end'; this.fbEl.innerHTML = 'You finished all three rounds: ' + this.firstTry + ' of ' + this.total + ' places right on the first try. The nine places:<ul>' + list + '</ul>';
      var again = el('button', 'ps-next', 'Play again'); again.type = 'button';
      again.addEventListener('click', function () { again.remove(); if (g.win) g.win.hidden = true; g.reset(); g.begin(); });
      this.next.parentNode.appendChild(again);
      try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title || 'Un paseo por la ciudad', done: true, summary: 'Walked all three rounds; ' + this.firstTry + ' of ' + this.total + ' right on the first try' } })); } catch (e) {}
    }
  };

  // ------------------------------------------------------------------ movement + rendering
  gp.move = function (dt) {
    var k = this.keys, h = this.held, sp = 3.2 * dt, tr = 2.0 * dt;
    if (k.left || h.left) this.pa -= tr; if (k.right || h.right) this.pa += tr;
    var f = (k.fwd || h.fwd ? 1 : 0) - (k.back || h.back ? 1 : 0);
    if (f) {
      var nx = this.px + Math.cos(this.pa) * sp * f, ny = this.py + Math.sin(this.pa) * sp * f, r = .3;
      var free = function (x, y) { if (solid(Math.floor(x - r), Math.floor(y - r)) || solid(Math.floor(x + r), Math.floor(y - r)) || solid(Math.floor(x - r), Math.floor(y + r)) || solid(Math.floor(x + r), Math.floor(y + r))) return false; var dx = x - 11, dy = y - 11; if (dx * dx + dy * dy <= .75) return false; for (var q = 0; q < SPRITES.length; q++) { var sp = SPRITES[q]; if (sp.r) { var ex = x - sp.x, ey = y - sp.y; if (ex * ex + ey * ey < (sp.r + .2) * (sp.r + .2)) return false; } } return true; };
      if (free(nx, this.py)) this.px = nx; if (free(this.px, ny)) this.py = ny;
    }
  };
  // every building face along a ray (near first while walking), returned far first; a face lower than a nearer one is
  // hidden behind it and dropped; the walk stops at the town edge or at the cathedral, which hides everything behind it
  gp.cast = function (ang) {
    var dx = Math.cos(ang), dy = Math.sin(ang), mx = Math.floor(this.px), my = Math.floor(this.py);
    var ddx = Math.abs(1 / dx), ddy = Math.abs(1 / dy), sx, sy, tx, ty, hits = [], inside = false, maxh = 0;
    if (dx < 0) { sx = -1; tx = (this.px - mx) * ddx; } else { sx = 1; tx = (mx + 1 - this.px) * ddx; }
    if (dy < 0) { sy = -1; ty = (this.py - my) * ddy; } else { sy = 1; ty = (my + 1 - this.py) * ddy; }
    for (var i = 0; i < 70; i++) {
      var vert; if (tx < ty) { tx += ddx; mx += sx; vert = true; } else { ty += ddy; my += sy; vert = false; }
      var s = solid(mx, my);
      if (s && !inside) {
        var d = vert ? tx - ddx : ty - ddy, hit = vert ? this.py + d * dy : this.px + d * dx; hit -= Math.floor(hit);
        var side = vert ? (sx > 0 ? 'W' : 'E') : (sy > 0 ? 'N' : 'S');
        if (side === 'E' || side === 'N') hit = 1 - hit;
        var f = texOf(mx, my, side), tex = this.T[f.t];
        if (tex.h > maxh) { hits.push({ d: d, u: (f.k + hit) / tex.cells, f: f, tex: tex, vert: vert }); maxh = tex.h; }
        if (tex.h >= 2.9 || mx <= 0 || my <= 0 || mx >= N - 1 || my >= N - 1) break;
      }
      inside = s;
    }
    return hits.reverse();
  };
  gp.drawFloor = function () {
    var dirx = Math.cos(this.pa), diry = Math.sin(this.pa), pl = Math.tan(FOV / 2), plx = -diry * pl, ply = dirx * pl;
    var proj = (VW / 2) / pl, f32 = this.f32, px = this.px, py = this.py;
    for (var fy = 0; fy < FH; fy++) {
      var p = (fy + .5) * (VH - HOR) / FH, dist = CAMH * proj / p;
      var fog = Math.min(.75, Math.pow(dist / 20, 1.1)), sx = px + dist * (dirx - plx), sy = py + dist * (diry - ply), ex = px + dist * (dirx + plx), ey = py + dist * (diry + ply);
      var stx = (ex - sx) / FW, sty = (ey - sy) / FW, wx = sx, wy = sy, row = fy * FW;
      for (var fx = 0; fx < FW; fx++, wx += stx, wy += sty) {
        var cx = Math.floor(wx), cy = Math.floor(wy), ux = wx - cx, uy = wy - cy, r, g, b;
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) { r = 150; g = 140; b = 120; }
        else if (MAP[cy].charCodeAt(cx) === 112) {   // the plaza: big pale slabs and a red ring round the fountain
          var dd = Math.sqrt((wx - 11) * (wx - 11) + (wy - 11) * (wy - 11));
          if (dd < 2.2 && dd > 1.9) { r = 170; g = 120; b = 90; }
          else { var a = wx * 1.5, c = wy * 1.5, fa = a - Math.floor(a), fc = c - Math.floor(c), v = (rnd(Math.floor(a) * 7 + Math.floor(c) * 13) * 18) | 0;
            if (fa < .05 || fc < .05) { r = 160; g = 146; b = 120; } else { r = 213 + v; g = 199 + v; b = 169 + v; } }
        } else {
          var walk = (ux < .2 && solid(cx - 1, cy)) || (ux > .8 && solid(cx + 1, cy)) || (uy < .2 && solid(cx, cy - 1)) || (uy > .8 && solid(cx, cy + 1));
          if (walk) { var e2 = wx * 2 + wy * 2, fe = e2 - Math.floor(e2); if (fe < .06) { r = 150; g = 138; b = 112; } else { r = 214; g = 200; b = 168; } }
          else { var rowc = Math.floor(wy * 5), q = wx * 5 + (rowc & 1) * .5, fq = q - Math.floor(q), fr = wy * 5 - rowc, w2 = (rnd(Math.floor(q) * 3 + rowc * 11) * 26) | 0;
            if (fq < .12 || fr < .14) { r = 112; g = 98; b = 76; } else { var sh = 1 - Math.abs(fq - .56) * .35; r = (155 + w2) * sh; g = (139 + w2) * sh; b = (111 + w2) * sh; } }
        }
        r = r + (214 - r) * fog; g = g + (210 - g) * fog; b = b + (200 - b) * fog;
        f32[row + fx] = 0xff000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
      }
    }
    this.fctx.putImageData(this.fimg, 0, 0);
    this.ctx.drawImage(this.floor, 0, 0, FW, FH, 0, HOR, VW, VH - HOR);
  };
  gp.draw = function () {
    var c = this.ctx, T = this.T, g = this, pl = Math.tan(FOV / 2), proj = (VW / 2) / pl;
    var sw = T.sky.width, part = sw * FOV / (2 * Math.PI), scl = VW / part, left = (this.pa - FOV / 2) / (2 * Math.PI) * sw; left = (left % sw + sw) % sw;
    c.drawImage(T.sky, 0, 0, sw, 300, -left * scl, 0, sw * scl, HOR + 2); c.drawImage(T.sky, 0, 0, sw, 300, (sw - left) * scl, 0, sw * scl, HOR + 2);
    this.drawFloor();
    for (var x = 0; x < VW; x += 2) {   // walls: 2 px per ray, far faces first so taller buildings show over lower ones
      var ang = this.pa + Math.atan((x + 1 - VW / 2) / proj), hs = this.cast(ang), near = 1e9;
      for (var i = 0; i < hs.length; i++) {
        var h = hs[i], dist = Math.max(.05, h.d * Math.cos(ang - this.pa));
        var lh = proj / dist, top = HOR - (h.tex.h - CAMH) * lh, bot = HOR + CAMH * lh, im = h.tex.img;
        var tx = Math.min(im.width - 1, Math.max(0, Math.floor(h.u * im.width)));
        c.drawImage(im, tx, 0, 1, im.height, x, top, 2, bot - top);
        var shade = (h.vert ? 0 : .1) + Math.min(.3, dist / 34), fog = Math.min(.6, Math.pow(dist / 22, 1.2)), oy = top + (bot - top) * h.tex.top[tx] / im.height;
        if (oy < bot) { c.fillStyle = 'rgba(50,35,20,' + shade + ')'; c.fillRect(x, oy, 2, bot - oy); c.fillStyle = 'rgba(214,210,200,' + fog + ')'; c.fillRect(x, oy, 2, bot - oy); }
        near = dist;
      }
      this.zbuf[x] = this.zbuf[x + 1] = near;
      var rx = Math.cos(ang), ry = Math.sin(ang), best = null;
      for (var k = 0; k < SIGNS.length; k++) {   // signs that hang out over the street
        var sg = SIGNS[k], ex = sg.dx * SIGN_LEN, ey = sg.dy * SIGN_LEN, den = rx * ey - ry * ex; if (Math.abs(den) < 1e-6) continue;
        var ax = sg.x - this.px, ay = sg.y - this.py, t = (ax * ey - ay * ex) / den, u = (ax * ry - ay * rx) / den;
        if (t > .05 && u >= 0 && u <= 1) { var dd = t * Math.cos(ang - this.pa); if (dd < near && (!best || dd < best.d)) best = { d: dd, u: u, t: sg.t }; }
      }
      if (best) {
        var simg = T['sign_' + best.t], slh = proj / best.d, sTop = HOR - (SIGN_Z[1] - CAMH) * slh, sBot = HOR - (SIGN_Z[0] - CAMH) * slh;
        c.drawImage(simg, Math.min(simg.width - 1, Math.floor(best.u * simg.width)), 0, 1, simg.height, x, sTop, 2, sBot - sTop);
        var sf = Math.min(.6, Math.pow(best.d / 22, 1.2)); if (sf > .02) { c.fillStyle = 'rgba(214,210,200,' + sf + ')'; c.fillRect(x, sTop, 2, sBot - sTop); }
      }
    }
    var sp = SPRITES.map(function (s) { var dx = s.x - g.px, dy = s.y - g.py; return { s: s, d: Math.sqrt(dx * dx + dy * dy), a: Math.atan2(dy, dx) - g.pa }; }).sort(function (a, b) { return b.d - a.d; });
    sp.forEach(function (q) {
      var a = q.a; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
      if (Math.abs(a) > FOV) return;
      var dist = q.d * Math.cos(a); if (dist < .25) return;
      var sx = VW / 2 + Math.tan(a) * proj, size = proj / dist * SPR_H[q.s.t], img = T[q.s.t].img;
      var x0 = Math.floor(sx - size / 2), y1 = HOR + CAMH * proj / dist, y0 = y1 - size;
      for (var x = Math.max(0, x0 - (x0 & 1)); x < Math.min(VW, x0 + size); x += 2) { if (g.zbuf[x] < dist) continue; var u = Math.floor((x - x0) / size * img.width); if (u < 0 || u >= img.width) continue; c.drawImage(img, u, 0, 1, img.height, x, y0, 2, size); }
    });
    var L = this.round && !this.finished ? this.looking() : null, bld = L && (L.kind === 'place' || L.kind === 'house' || L.kind === 'catedral'), fu = L && L.kind === 'fuente';
    c.strokeStyle = bld || fu ? '#ffd76a' : 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(VW / 2, VH / 2, bld || fu ? 13 : 8, 0, 7); c.stroke();
    if ((bld || fu) && !this.busy) {
      var msg = bld ? 'Press E to select building' : 'Press E to select', tw;
      c.font = '700 22px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center'; tw = c.measureText(msg).width + 30;
      c.fillStyle = 'rgba(20,12,6,.66)'; if (c.roundRect) { c.beginPath(); c.roundRect(VW / 2 - tw / 2, VH / 2 + 26, tw, 36, 18); c.fill(); } else c.fillRect(VW / 2 - tw / 2, VH / 2 + 26, tw, 36);
      c.fillStyle = '#fff'; c.fillText(msg, VW / 2, VH / 2 + 51);
    }
    this.minimap();
  };
  gp.minimap = function () {
    var c = this.ctx, s = 8, M = N * s, W0 = VW - M - 18, H0 = VH - M - 18, g = this;
    c.fillStyle = 'rgba(253,248,236,.93)'; c.fillRect(W0 - 8, H0 - 8, M + 16, M + 16); c.strokeStyle = '#b8892e'; c.lineWidth = 3; c.strokeRect(W0 - 8, H0 - 8, M + 16, M + 16);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { var m = MAP[y][x]; c.fillStyle = m === '#' ? '#b08d6e' : m === 'p' ? '#ead9a8' : '#f4ecdb'; c.fillRect(W0 + x * s, H0 + y * s, s, s); }
    c.fillStyle = '#5fa8d3'; c.beginPath(); c.arc(W0 + 11 * s, H0 + 11 * s, 4, 0, 7); c.fill();
    c.font = '700 12px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center';
    var SPOT = { centro: [11, 7], plaza: [11, 12.7], calle: [11, 20] };
    FRONTS.forEach(function (f) { if (PLACE_TEX[f.t]) SPOT[f.t] = [f.at[0] + (f.along === 'x' ? f.n / 2 : .5), f.at[1] + (f.along === 'y' ? f.n / 2 : .5)]; });
    Object.keys(this.found).forEach(function (k) {
      var sp = SPOT[k]; if (!sp) return; var label = txt(g.places[k].es), tw = c.measureText(label).width + 8;
      c.fillStyle = 'rgba(142,27,44,.93)'; c.fillRect(W0 + sp[0] * s - tw / 2, H0 + sp[1] * s - 8, tw, 15);
      c.fillStyle = '#fff'; c.fillText(label, W0 + sp[0] * s, H0 + sp[1] * s + 4);
    });
    var px = W0 + this.px * s, py = H0 + this.py * s, a = this.pa;
    c.fillStyle = '#c0392b'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath();
    c.moveTo(px + Math.cos(a) * 11, py + Math.sin(a) * 11); c.lineTo(px + Math.cos(a + 2.5) * 8, py + Math.sin(a + 2.5) * 8); c.lineTo(px + Math.cos(a - 2.5) * 8, py + Math.sin(a - 2.5) * 8); c.closePath(); c.fill(); c.stroke();
  };
  gp.loop = function () {
    var g = this, last = null;
    function frame(ts) { var dt = last == null ? 0 : Math.min(.05, (ts - last) / 1000); last = ts; g.t += dt; if (g.round && !g.finished) g.move(dt); g.draw(); requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  };

  function boot() {
    if (!document.getElementById('ps-css')) {
      var s = document.createElement('style'); s.id = 'ps-css'; s.textContent = CSS; document.head.appendChild(s);
      var f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=IM+Fell+English:ital@0;1&display=swap'; document.head.appendChild(f);
    }
    [].forEach.call(document.querySelectorAll('.paseo-game'), function (r) { if (!r.dataset.psReady) { r.dataset.psReady = '1'; try { new Game(r); } catch (e) { if (window.console) console.error('paseo', e); } } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

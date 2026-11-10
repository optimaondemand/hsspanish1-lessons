/* llama.js: "La llama y la casa", an illustrated room tour (Spanish 1 S2, Lesson 2.01; David 2026-11-10).
   A llama in an Andean blanket walks room by room through a Chilean house and asks "¿Qué cuarto es?". The student
   picks one of three room words; right = the llama is happy and the word is spoken, wrong = "No, no es…" + a hint,
   try again. v2 (same day): smooth, shaded illustration (gradients, soft shadows, wood grain, tile grout) at full
   canvas resolution instead of blocky pixels; every room has the furniture that makes it unmistakable.
   All art is original and drawn in code.
   Markup: <div class="llama-game" data-llama='{"id","title","audioBase","askClip","yesClip","noClip",
            "rooms":[{"key","es","en","clip","hint"}]}'></div>
   Practice only; reports to All Your Work with a 'mw-game' event when the tour is finished. */
(function () {
  'use strict';
  var W = 320, H = 180, S = 3, OUT = '#3a2a1c', FLOOR_Y = 138;
  var CSS =
    '.ll{max-width:1000px;margin:0 auto 6px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.ll-stage{position:relative;border:4px solid #5a3b1c;outline:2px solid #b8892e;outline-offset:2px;background:#000;line-height:0;overflow:hidden;border-radius:2px}' +
    '.ll-cv{display:block;width:100%;height:auto}' +
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

  // ------------------------------------------------------------------ painter (smooth vector drawing in grid units)
  function Pt(c) { this.c = c; }
  var pr = Pt.prototype;
  pr.fill = function (col, x0, y0, x1, y1) {   // colour or vertical/linear gradient [c0, c1]
    if (typeof col === 'string') return col;
    var g = this.c.createLinearGradient(x0 * S, y0 * S, (x1 == null ? x0 : x1) * S, (y1 == null ? y0 + 10 : y1) * S);
    col.forEach(function (c, i) { g.addColorStop(i / (col.length - 1), c); }); return g;
  };
  pr.rect = function (x, y, w, h, col, line, r) {
    var c = this.c; c.beginPath();
    if (r) { c.roundRect ? c.roundRect(x * S, y * S, w * S, h * S, r * S) : c.rect(x * S, y * S, w * S, h * S); } else c.rect(x * S, y * S, w * S, h * S);
    if (col) { c.fillStyle = this.fill(col, x, y, x, y + h); c.fill(); }
    if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1] * S; c.stroke(); }
  };
  pr.ell = function (x, y, rx, ry, col, line) { var c = this.c; c.beginPath(); c.ellipse(x * S, y * S, rx * S, ry * S, 0, 0, 7); if (col) { c.fillStyle = this.fill(col, x, y - ry, x, y + ry); c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1] * S; c.stroke(); } };
  pr.poly = function (pts, col, line) { var c = this.c; c.beginPath(); c.moveTo(pts[0][0] * S, pts[0][1] * S); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * S, pts[i][1] * S); c.closePath(); if (col) { var ys = pts.map(function (q) { return q[1]; }), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys); c.fillStyle = typeof col === 'string' ? col : this.fill(col, pts[0][0], y0, pts[0][0], y1 > y0 ? y1 : y0 + 1); c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1] * S; c.lineJoin = 'round'; c.stroke(); } };
  pr.line = function (a, b, x, y, col, w) { var c = this.c; c.beginPath(); c.moveTo(a * S, b * S); c.lineTo(x * S, y * S); c.strokeStyle = col; c.lineWidth = (w || 1) * S; c.lineCap = 'round'; c.stroke(); };
  pr.curve = function (pts, col, w) { var c = this.c; c.beginPath(); c.moveTo(pts[0] * S, pts[1] * S); c.quadraticCurveTo(pts[2] * S, pts[3] * S, pts[4] * S, pts[5] * S); c.strokeStyle = col; c.lineWidth = (w || 1) * S; c.lineCap = 'round'; c.stroke(); };
  pr.text = function (s, x, y, size, col, w) { var c = this.c; c.font = (w || 800) + ' ' + size * S + 'px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x * S, y * S); };
  pr.alpha = function (a, fn) { var c = this.c; c.save(); c.globalAlpha = Math.max(0, Math.min(1, a)); fn(); c.restore(); };
  pr.shadow = function (x, y, rx) { this.ell(x, y, rx, rx * 0.16, 'rgba(40,25,10,.22)'); };

  // ------------------------------------------------------------------ shared room parts
  function walls(P, top, bot) { P.rect(0, 0, W, FLOOR_Y, [top, bot]); }
  function woodFloor(P, a, b) {
    P.rect(0, FLOOR_Y, W, H - FLOOR_Y, [a, b]);
    for (var r = 0; r < 4; r++) {
      var y = FLOOR_Y + 2 + r * 10.5; P.line(0, y, W, y, 'rgba(60,35,15,.25)', .4);
      for (var k = 0; k < 6; k++) { var x = ((r * 37 + k * 61) % 330) - 5; P.line(x, y, x, y + 10.5, 'rgba(60,35,15,.25)', .4); P.curve([x + 6, y + 5, x + 16, y + 3.5, x + 28, y + 5.5], 'rgba(60,35,15,.12)', .35); }
    }
  }
  function tileFloor(P, a, b) { P.rect(0, FLOOR_Y, W, H - FLOOR_Y, a); for (var y = FLOOR_Y; y < H; y += 9) for (var x = 0; x < W; x += 9) P.rect(x + .3, y + .3, 8.4, 8.4, ((x + y) / 9) % 2 ? a : b); }
  function baseboard(P, col) { P.rect(0, FLOOR_Y - 5, W, 5, [col, '#5a3b1c']); P.line(0, FLOOR_Y - 5, W, FLOOR_Y - 5, 'rgba(255,255,255,.35)', .4); }
  function wainscot(P, y, col) { P.rect(0, y, W, FLOOR_Y - y, col); P.line(0, y, W, y, '#6b4a2a', .8); for (var x = 8; x < W; x += 26) P.rect(x, y + 5, 20, FLOOR_Y - y - 12, null, ['rgba(80,50,25,.3)', .5], 1); }
  function windowView(P, x, y, w, h, curtain) {
    P.rect(x - 3, y - 3, w + 6, h + 6, ['#8a5a2b', '#6b4423'], null, 1);
    P.rect(x, y, w, h, ['#8ec9ea', '#d8eef8']);
    P.poly([[x, y + h], [x, y + h * .62], [x + w * .2, y + h * .42], [x + w * .45, y + h * .62], [x + w * .7, y + h * .36], [x + w, y + h * .58], [x + w, y + h]], ['#8696ad', '#6d7d94']);
    P.poly([[x + w * .13, y + h * .5], [x + w * .2, y + h * .42], [x + w * .28, y + h * .5]], '#f6f9fc'); P.poly([[x + w * .62, y + h * .45], [x + w * .7, y + h * .36], [x + w * .78, y + h * .45]], '#f6f9fc');
    P.rect(x, y + h * .86, w, h * .14, '#6aa84f');
    P.line(x + w / 2, y, x + w / 2, y + h, '#8a5a2b', 1.4); P.line(x, y + h / 2, x + w, y + h / 2, '#8a5a2b', 1.4);
    P.rect(x - 5, y + h + 2, w + 10, 3, ['#9a6a3b', '#6b4423'], null, .8);
    if (curtain) { [[x - 9, 1], [x + w + 1, -1]].forEach(function (cdef) { var cx = cdef[0]; P.poly([[cx, y - 6], [cx + 8, y - 6], [cx + 8 - cdef[1] * 2, y + h + 6], [cx, y + h + 6]], [curtain, '#7a1e2e']); for (var f = 1; f < 4; f++) P.line(cx + f * 2, y - 5, cx + f * 2 - cdef[1], y + h + 5, 'rgba(0,0,0,.15)', .5); }); P.rect(x - 11, y - 8, w + 22, 2.4, '#6b4423', null, 1); }
  }
  function frame(P, x, y, w, h) { P.rect(x - 2.5, y - 2.5, w + 5, h + 5, ['#d4a640', '#9a7420'], ['#6b4f15', .5], .6); P.rect(x, y, w, h, ['#7fb0d6', '#c7dfee']); P.poly([[x, y + h], [x + w * .35, y + h * .45], [x + w * .6, y + h * .7], [x + w * .8, y + h * .5], [x + w, y + h * .75], [x + w, y + h]], '#4f8f43'); P.ell(x + w * .78, y + h * .25, 3, 3, '#ffe28a'); }
  function plant(P, x, y, s) {   // leaves on stems that grow out of the soil
    s = s || 1; P.shadow(x, y, 7 * s);
    var top = y - 12 * s;
    for (var i = 0; i < 7; i++) { var a = -2.6 + i * .35, lx = x + Math.cos(a) * 9 * s, ly = y - 14 * s + Math.sin(a) * 10 * s;
      P.curve([x + (i - 3) * .6 * s, top + 1, x + (lx - x) * .3, top - 4 * s, lx, ly], '#2f6a34', .7 * s); }
    for (var k = 0; k < 7; k++) { var b = -2.6 + k * .35; P.ell(x + Math.cos(b) * 9 * s, y - 14 * s + Math.sin(b) * 10 * s, 5 * s, 2.2 * s, k % 2 ? '#3f8f4a' : '#2f7a3c'); }
    P.poly([[x - 6 * s, top], [x + 6 * s, top], [x + 4.5 * s, y], [x - 4.5 * s, y]], ['#c26a3a', '#8e4a26'], ['#6b3a1c', .4]);
    P.rect(x - 6.6 * s, top - 1.6 * s, 13.2 * s, 2.6 * s, ['#d27a48', '#a85a30'], null, .6); P.ell(x, top - .4 * s, 5.4 * s, 1 * s, '#5a3b1c');
  }

  // ------------------------------------------------------------------ the rooms
  var ROOMS = {
    cocina: function (P, T) {
      walls(P, '#fbf1dc', '#f1e2c2'); tileFloor(P, '#d9c5a0', '#c7b089');
      for (var y = 62; y < 96; y += 6) for (var x = 132; x < W; x += 6) P.rect(x + .3, y + .3, 5.4, 5.4, ((x + y) / 6) % 2 ? '#eef4fb' : '#d6e4f3');   // backsplash
      windowView(P, 178, 20, 42, 34);
      P.rect(270, 18, 46, 2.4, ['#9a6a3b', '#6b4423']);                                                     // shelf with jars
      [['#e8a33d', 274], ['#c0392b', 285], ['#3f7d5f', 296], ['#f2c14e', 307]].forEach(function (j) { P.rect(j[1], 9, 7, 9, [j[0], '#7a4a24'], ['rgba(0,0,0,.3)', .3], 1.5); P.rect(j[1] - .5, 7.5, 8, 2, '#8a8a8a', null, .6); });
      for (var k = 0; k < 3; k++) { P.line(140 + k * 12, 24, 140 + k * 12, 34, '#55331a', .8); P.ell(140 + k * 12, 40, 5 - k * .6, 5 - k * .6, ['#c9864a', '#8e5a2a'], ['#6b3a1c', .5]); P.rect(139 + k * 12, 30, 2, 6, '#55331a'); }   // copper pans
      // fridge
      P.shadow(146, FLOOR_Y, 16); P.rect(132, 44, 28, FLOOR_Y - 44, ['#fdfdfd', '#dfe4e8'], ['#9aa6b2', .6], 3); P.line(132, 76, 160, 76, '#b7c1ca', .7); P.rect(155, 52, 2, 16, '#9aa6b2', null, 1); P.rect(155, 84, 2, 22, '#9aa6b2', null, 1);
      P.ell(140, 58, 2, 2, '#e05a6a'); P.ell(146, 60, 2, 2, '#2b5aa0');
      // counter with cabinets, sink, stove
      P.shadow(240, FLOOR_Y, 80); P.rect(164, 98, 156, FLOOR_Y - 98, ['#a8774f', '#7a4f2e']);
      for (var d = 0; d < 6; d++) { var dx = 167 + d * 25.5; P.rect(dx, 104, 22, 30, ['#b8875c', '#8e5d36'], ['rgba(60,35,15,.45)', .5], 1); P.rect(dx + 9, 110, 4, 1.6, '#e0c27a', null, .8); }
      P.rect(162, 94, 160, 5, ['#e7e1d6', '#bdb5a6'], ['#9a9184', .4], 1);                                   // worktop
      P.rect(186, 95, 26, 4, '#9fb3c2', null, 1); P.curve([199, 95, 199, 84, 207, 86], '#9aa6b2', 1.4);          // sink + tap
      P.rect(258, 98, 46, 40, ['#3b3b3b', '#1f1f1f'], ['#111', .5], 1.5); P.rect(263, 106, 36, 22, ['#585858', '#2a2a2a'], ['#111', .5], 1); P.rect(266, 110, 30, 12, 'rgba(255,170,80,.25)', null, .8);
      for (var b = 0; b < 4; b++) P.ell(266 + b * 10, 101, 2, 1.4, '#cfcfcf');                              // knobs
      P.rect(258, 92, 46, 2.5, '#2b2b2b');
      P.rect(264, 82, 16, 10, ['#9aa6b2', '#6b7782'], ['#555', .4], 1.5); P.rect(262, 81, 20, 2, '#6b7782', null, 1);   // pot
      for (var s = 0; s < 3; s++) { var q = (T * 12 + s * 6) % 18; P.alpha(.55 - q / 34, function () { P.ell(272 + Math.sin(T * 3 + s) * 2, 78 - q, 3 + q * .12, 2.4 + q * .1, '#ffffff'); }); }
      P.ell(234, 92, 9, 3, ['#f3efe6', '#cfc7b8']); P.ell(230, 89, 3, 3, '#e05a3a'); P.ell(236, 88, 3, 3, '#f2c14e'); P.ell(239, 90, 2.6, 2.6, '#6aa84f');   // fruit bowl
      P.rect(214, 90, 14, 4, ['#d9b07a', '#b08550'], null, 1);                                                  // cutting board
    },
    dormitorio: function (P, T) {
      walls(P, '#efe6f6', '#e2d5ee'); woodFloor(P, '#b8875c', '#9a6a40'); baseboard(P, '#e8dcc8');
      windowView(P, 150, 20, 40, 38, '#a83a4a'); frame(P, 260, 30, 30, 22);
      P.ell(240, FLOOR_Y + 4, 70, 6, 'rgba(120,60,90,.25)');                                                    // rug
      P.shadow(232, FLOOR_Y, 66);
      P.rect(170, 80, 6, 58, ['#8a5a2b', '#5a3b1c'], null, 1.5); P.rect(296, 98, 6, 40, ['#8a5a2b', '#5a3b1c'], null, 1.5);
      P.rect(172, 112, 128, 12, ['#9a6a3b', '#6b4423'], null, 1);                                              // frame
      P.rect(176, 98, 122, 16, ['#fafafa', '#e6e6e6'], null, 2);                                               // mattress
      P.rect(178, 94, 28, 12, ['#ffffff', '#e8e8f0'], ['#d0d0dc', .5], 4);                                     // pillow
      P.poly([[200, 96], [298, 96], [300, 116], [198, 116]], ['#c0392b', '#8e2a20']); for (var q = 0; q < 6; q++) P.line(210 + q * 14, 97, 206 + q * 14, 115, 'rgba(255,255,255,.18)', .7);
      P.rect(306, 104, 14, 34, ['#9a6a3b', '#6b4423'], null, 1); P.rect(309, 92, 8, 12, ['#f6d77a', '#e0b54a'], null, 2); P.ell(313, 92, 10, 7, 'rgba(255,226,140,.35)');
      for (var z = 0; z < 2; z++) { var ph = (T * .6 + z / 2) % 1; P.alpha(1 - ph, function () { P.text('z', 212 + ph * 16, 86 - ph * 30, 7 + ph * 5, '#6b4a80'); }); }
    },
    bano: function (P, T) {
      walls(P, '#e9f3f8', '#dbe9f1');
      for (var y = 0; y < FLOOR_Y; y += 8) for (var x = 0; x < W; x += 8) P.rect(x + .35, y + .35, 7.3, 7.3, y > 70 ? (((x + y) / 8) % 2 ? '#cfe3ee' : '#bcd6e6') : '#e6f1f7');   // tiles, whole wall
      P.rect(0, 70, W, 1.6, '#2b6ca0'); tileFloor(P, '#d7dde2', '#c3cbd2');
      // bathtub + shower curtain
      P.shadow(186, FLOOR_Y, 40); P.rect(146, 102, 84, 30, ['#ffffff', '#dfe7ec'], ['#b7c4cc', .6], 8); P.rect(150, 102, 76, 4, '#cfe0ea', null, 2);
      P.rect(152, 132, 6, 6, '#c9a64a', null, 1); P.rect(218, 132, 6, 6, '#c9a64a', null, 1);
      P.line(146, 30, 230, 30, '#8a8a8a', 1.2); P.poly([[150, 30], [176, 30], [172, 104], [150, 104]], ['#9fd0e6', '#6aaecb']); for (var f = 0; f < 5; f++) P.line(153 + f * 5, 31, 152 + f * 4.4, 103, 'rgba(255,255,255,.35)', .6);
      P.curve([224, 102, 224, 46, 214, 46], '#9aa6b2', 1.4); P.ell(212, 48, 3, 2, '#9aa6b2');
      for (var b = 0; b < 4; b++) { var ph = (T * .5 + b / 4) % 1; P.alpha(1 - ph, function () { P.ell(186 + b * 9, 99 - ph * 24, 2.2 + b % 2, 2.2 + b % 2, 'rgba(255,255,255,.95)', ['rgba(150,190,210,.6)', .3]); }); }
      P.ell(206, 99, 3.2, 2.6, '#f2c14e'); P.ell(209, 96.5, 1.8, 1.8, '#f2c14e'); P.poly([[210.5, 96.5], [213, 97], [210.5, 97.8]], '#e8892e');   // duck
      // toilet
      P.shadow(258, FLOOR_Y, 14); P.rect(250, 78, 18, 24, ['#ffffff', '#e1e8ec'], ['#b7c4cc', .6], 2.5); P.rect(252, 80, 14, 3, '#cfdce4', null, 1); P.rect(256, 76, 6, 2, '#9aa6b2', null, 1);
      P.ell(259, 106, 13, 5, ['#ffffff', '#e1e8ec'], ['#b7c4cc', .6]); P.poly([[249, 106], [269, 106], [264, 132], [254, 132]], ['#f7fafb', '#d9e2e8'], ['#b7c4cc', .6]); P.ell(259, 104.5, 10, 2.6, '#d6e2ea');
      // sink + mirror + towel
      P.rect(286, 34, 26, 30, ['#cfe6f2', '#9cc3d8'], ['#8aa0ae', 1], 3); P.line(291, 40, 298, 52, 'rgba(255,255,255,.6)', 1);
      P.shadow(299, FLOOR_Y, 8); P.rect(296, 92, 6, 46, ['#ffffff', '#dfe7ec'], ['#b7c4cc', .5], 1); P.ell(299, 90, 14, 5, ['#ffffff', '#dfe7ec'], ['#b7c4cc', .6]); P.curve([299, 86, 299, 80, 304, 81], '#9aa6b2', 1.2);
      P.line(276, 70, 276, 92, '#9aa6b2', .8); P.rect(273, 72, 9, 20, ['#e05a6a', '#b0344a'], null, 1.5);
      P.ell(200, FLOOR_Y + 6, 20, 3.5, '#4f8fbf');                                                              // bath mat
    },
    sala: function (P, T) {
      walls(P, '#f6e8cb', '#ecd8b0'); woodFloor(P, '#a87448', '#8a5a33'); baseboard(P, '#e8dcc8');
      frame(P, 150, 26, 34, 24);
      // bookshelf, against the right wall
      P.shadow(305, FLOOR_Y, 12); P.rect(292, 56, 26, FLOOR_Y - 56, ['#8a5a2b', '#5a3b1c'], ['#4a2f18', .4], 1);
      for (var s = 0; s < 4; s++) { var y = 60 + s * 19; P.rect(294, y + 16, 22, 1.8, '#4a2f18'); for (var b = 0; b < 5; b++) P.rect(295 + b * 4.2, y + 3 + (b % 2) * 2, 3.4, 13 - (b % 2) * 2, ['#c0392b', '#2b5aa0', '#f2c14e', '#3f7d5f', '#8e44ad'][(b + s) % 5]); }
      // TV standing on its cabinet
      P.shadow(250, FLOOR_Y, 24); P.rect(228, 110, 44, 28, ['#8a5a2b', '#5a3b1c'], ['#4a2f18', .4], 1.5);
      P.rect(231, 116, 18, 18, null, ['rgba(255,255,255,.25)', .5], 1); P.rect(251, 116, 18, 18, null, ['rgba(255,255,255,.25)', .5], 1); P.ell(247, 125, .8, .8, '#e0c27a'); P.ell(253, 125, .8, .8, '#e0c27a');
      P.rect(240, 106, 20, 4, '#1a1a1a', null, 1); P.rect(247, 102, 6, 5, '#1a1a1a');          // TV foot on the cabinet top
      P.rect(230, 76, 40, 27, ['#222', '#0d0d0d'], ['#000', .6], 1.5); var glow = 0.6 + 0.2 * Math.sin(T * 2.4);
      P.rect(232, 78, 36, 23, ['rgba(110,180,230,' + glow + ')', 'rgba(40,90,140,' + glow + ')']); P.poly([[232, 101], [240, 91], [248, 97], [258, 87], [268, 95], [268, 101]], 'rgba(100,170,90,.8)'); P.ell(261, 83, 2.4, 2.4, 'rgba(255,230,140,.9)');
      // sofa, facing the TV
      P.shadow(170, FLOOR_Y + 1, 32);
      P.rect(142, 98, 58, 22, ['#3f8a68', '#2a6a4e'], ['#1f4f3a', .5], 5); P.rect(144, 110, 54, 19, ['#4a9a76', '#2f7356'], ['#1f4f3a', .5], 4);
      P.rect(137, 104, 10, 28, ['#3f8a68', '#2a6a4e'], ['#1f4f3a', .5], 4); P.rect(195, 104, 10, 28, ['#3f8a68', '#2a6a4e'], ['#1f4f3a', .5], 4);
      P.rect(150, 102, 15, 11, ['#f2c14e', '#d9a32e'], null, 3); P.rect(177, 102, 15, 11, ['#e05a6a', '#b8404e'], null, 3);
      P.rect(146, 129, 3, 9, '#4a2f18'); P.rect(193, 129, 3, 9, '#4a2f18');
      // rug + coffee table with a book and a cup, in front
      P.ell(206, FLOOR_Y + 10, 58, 6.5, ['#b8404e', '#8e1b2c']); P.ell(206, FLOOR_Y + 10, 50, 4.8, null, ['rgba(242,193,78,.7)', .6]);
      P.shadow(206, FLOOR_Y + 14, 22); P.rect(186, 138, 40, 4, ['#b8875c', '#8a5a33'], ['#5a3b1c', .4], 1.5); P.rect(189, 142, 3, 9, '#6b4423'); P.rect(220, 142, 3, 9, '#6b4423');
      P.rect(192, 134.5, 12, 3.5, '#2b5aa0', null, .6); P.rect(193, 133.5, 10, 1.4, '#fbf3dc'); P.rect(211, 133, 5, 5, ['#ffffff', '#dcdcdc'], null, 1); P.curve([216, 134, 218.5, 135.5, 216, 137], '#cfcfcf', .7);
      for (var st = 0; st < 2; st++) { var q = (T * 6 + st * 4) % 8; P.alpha(.5 - q / 16, function () { P.ell(213.5, 131 - q, 1.4, 1.2, '#fff'); }); }
      plant(P, 282, FLOOR_Y, 1);
    },
    comedor: function (P, T) {
      walls(P, '#f3e4c6', '#e6d2ac'); wainscot(P, 92, '#d9c09a'); woodFloor(P, '#a87448', '#8a5a33'); baseboard(P, '#7a4f2e');
      windowView(P, 148, 18, 34, 36, '#8e1b2c'); frame(P, 284, 26, 26, 20);
      // chandelier
      P.line(232, 0, 232, 18, '#6b4f15', .8); P.ell(232, 22, 14, 3.5, ['#e0b54a', '#9a7420']); for (var c = -2; c <= 2; c++) { P.rect(232 + c * 6 - .8, 14, 1.6, 6, '#fbf3dc'); P.alpha(.7 + .3 * Math.sin(T * 8 + c), function () { P.ell(232 + c * 6, 12.5, 1.1, 1.8, '#ffb43a'); }); }
      P.ell(232, 18, 26, 10, 'rgba(255,214,120,.16)');
      // chair backs (behind the table), then the table, then the front chair legs
      var X = [190, 216, 248, 274];
      X.forEach(function (x) { P.rect(x - 7, 82, 14, 2.4, ['#8a5a2b', '#5a3b1c'], null, 1); P.rect(x - 7, 82, 2.4, 30, '#6b4423'); P.rect(x + 4.6, 82, 2.4, 30, '#6b4423'); for (var s2 = 0; s2 < 3; s2++) P.rect(x - 4 + s2 * 3.4, 85, 1.6, 22, '#7a4f2e'); });
      P.shadow(232, FLOOR_Y, 66);
      P.rect(170, 106, 124, 6, ['#a8774f', '#7a4f2e'], ['#5a3b1c', .5], 1.5); P.rect(168, 103.5, 128, 4, ['#fbf3dc', '#e8dcc0'], null, 1);   // table + runner cloth
      P.rect(176, 112, 4, 26, ['#7a4f2e', '#5a3b1c']); P.rect(284, 112, 4, 26, ['#7a4f2e', '#5a3b1c']);
      X.forEach(function (x) { P.ell(x, 102.5, 7, 1.8, ['#ffffff', '#dcdcdc'], ['#bdbdbd', .3]); P.ell(x, 102, 3.4, .9, '#e8a33d'); P.rect(x + 8, 96, 2.4, 6.5, 'rgba(200,225,240,.85)', ['#9aa6b2', .3], .6); });
      P.rect(229, 94, 3, 9, '#fbf3dc'); P.rect(235, 94, 3, 9, '#fbf3dc'); P.alpha(.8 + .2 * Math.sin(T * 9), function () { P.ell(230.5, 92.5, 1, 1.8, '#ffb43a'); P.ell(236.5, 92.5, 1, 1.8, '#ffb43a'); });
      [[160, -1], [304, 1]].forEach(function (cd) {                                                           // end chairs in profile
        var x = cd[0], f = cd[1]; P.rect(x - 7, 112, 14, 2.6, ['#8a5a2b', '#5a3b1c'], null, 1); P.rect(x - 6, 114, 2.2, 24, '#6b4423'); P.rect(x + 3.8, 114, 2.2, 24, '#6b4423');
        P.rect(f < 0 ? x - 7 : x + 4.6, 88, 2.4, 25, '#6b4423'); for (var s3 = 0; s3 < 3; s3++) P.rect(f < 0 ? x - 7 : x + 3.6, 92 + s3 * 6, 4.4, 1.8, '#7a4f2e');
      });
    },
    jardin: function (P, T) {
      P.rect(0, 0, W, 120, ['#6fb3e0', '#d9eef8']);
      P.ell(70, 22, 18, 6, 'rgba(255,255,255,.85)'); P.ell(84, 19, 12, 6, 'rgba(255,255,255,.85)'); P.ell(232, 30, 22, 6, 'rgba(255,255,255,.75)');
      P.poly([[0, 108], [0, 78], [34, 60], [62, 74], [104, 48], [146, 70], [186, 52], [228, 72], [272, 50], [320, 70], [320, 108]], ['#8f9fb5', '#6d7d94']);
      [[104, 48], [186, 52], [272, 50]].forEach(function (m) { P.poly([[m[0], m[1]], [m[0] - 10, m[1] + 9], [m[0] - 3, m[1] + 6], [m[0] + 3, m[1] + 9], [m[0] + 10, m[1] + 8]], '#f6f9fc'); });
      P.rect(0, 104, W, H - 104, ['#7cbf5a', '#4f9a3a']);
      for (var g2 = 0; g2 < 60; g2++) { var gx = (g2 * 53) % 320, gy = 112 + (g2 * 29) % 64; P.line(gx, gy, gx - 1, gy - 3, '#3f8a30', .5); P.line(gx + 1, gy, gx + 2, gy - 3.4, '#3f8a30', .5); }
      for (var fx = 128; fx < 320; fx += 12) { P.rect(fx, 104, 2.4, 14, ['#fbf3dc', '#d8ccb0']); P.poly([[fx, 104], [fx + 1.2, 101.5], [fx + 2.4, 104]], '#fbf3dc'); }   // white fence
      P.rect(128, 107, 192, 1.6, '#e8dcc0'); P.rect(128, 113, 192, 1.6, '#e8dcc0');
      // tree with layered leaves and lemons
      P.shadow(292, 140, 20); P.poly([[288, 140], [296, 140], [295, 100], [289, 100]], ['#8a5a2b', '#5a3b1c']);
      [[292, 76, 22, '#2f7a3c'], [278, 88, 14, '#3f8f4a'], [306, 88, 14, '#3f8f4a'], [292, 92, 16, '#4f9a4f']].forEach(function (l) { P.ell(l[0], l[1], l[2], l[2] * .85, l[3]); });
      [[284, 80], [300, 74], [296, 92], [280, 92], [306, 86]].forEach(function (q) { P.ell(q[0], q[1], 2.2, 2.6, '#f2d23e', ['#c9a62a', .3]); });
      // fountain
      P.shadow(220, 140, 24); P.ell(220, 132, 22, 5, ['#d9d1bf', '#b9b09c'], ['#9a9080', .4]); P.ell(220, 130.5, 18, 3.2, '#8fc6e0');
      P.rect(216, 106, 8, 24, ['#e2dccc', '#bdb5a2']); P.ell(220, 106, 9, 2.6, ['#e2dccc', '#bdb5a2']);
      for (var d = 0; d < 8; d++) { var ph = (T * 1.4 + d / 8) % 1, ang = -1.2 + d * .34; P.ell(220 + Math.sin(ang) * 14 * ph, 104 - 14 * Math.sin(ph * Math.PI), 1.1, 1.5, 'rgba(160,210,235,.9)'); }
      // flowers: tulips, daisies and roses with leaves
      for (var k = 0; k < 13; k++) {
        var x = 134 + k * 14.5 + (k % 3) * 2, y = 160 + (k % 2) * 10, type = k % 3; P.c.save(); P.c.translate(x * S, y * S); P.c.scale(1.5, 1.5); P.c.translate(-x * S, -y * S);
        P.line(x, y, x, y - 14, '#2f7a3c', .9); P.poly([[x, y - 5], [x - 5, y - 9], [x - 1, y - 4]], '#3f8f4a'); P.poly([[x, y - 8], [x + 5, y - 12], [x + 1, y - 7]], '#3f8f4a');
        if (type === 0) { P.poly([[x - 3.2, y - 14], [x - 3.2, y - 19.5], [x - 1.4, y - 17], [x, y - 20.5], [x + 1.4, y - 17], [x + 3.2, y - 19.5], [x + 3.2, y - 14]], ['#ff6b7a', '#c0304a'], ['#8e1b2c', .3]); }
        else if (type === 1) { for (var p2 = 0; p2 < 8; p2++) { var a2 = p2 * Math.PI / 4; P.ell(x + Math.cos(a2) * 3, y - 17 + Math.sin(a2) * 3, 1.9, 1.9, '#ffffff', ['#d8d0c0', .25]); } P.ell(x, y - 17, 1.8, 1.8, '#f2b72e'); }
        else { P.ell(x, y - 17, 3.6, 3.4, ['#e8507a', '#a82050']); P.curve([x - 2, y - 17, x, y - 20, x + 2, y - 17], '#7a1838', .5); P.curve([x - 2.6, y - 16, x, y - 13, x + 2.6, y - 16], '#7a1838', .5); }
        P.c.restore();
      }
      for (var bf = 0; bf < 2; bf++) { var bx = 170 + bf * 80 + Math.sin(T * 1.6 + bf) * 24, by = 92 + Math.sin(T * 4 + bf * 2) * 6, w2 = 2 + Math.abs(Math.sin(T * 14 + bf)) * 3; P.ell(bx - w2, by, w2, 3, bf ? '#f29b38' : '#6aa0e8'); P.ell(bx + w2, by, w2, 3, bf ? '#f29b38' : '#6aa0e8'); P.rect(bx - .5, by - 2, 1, 4, '#3a2a1c'); }
    },
    escalera: function (P, T) {
      walls(P, '#f3e8d2', '#e6d6b6'); woodFloor(P, '#a87448', '#8a5a33'); baseboard(P, '#e8dcc8'); frame(P, 160, 30, 28, 20);
      P.poly([[150, FLOOR_Y], [318, 8], [320, 8], [320, FLOOR_Y]], 'rgba(120,80,40,.12)');
      for (var i = 0; i < 9; i++) { var x = 158 + i * 18, y = FLOOR_Y - 14 - i * 14; P.rect(x, y, W - x, 14, ['#b8875c', '#8a5a33'], ['rgba(60,35,15,.4)', .4]); P.rect(x - 1.5, y, W - x + 1.5, 3, ['#d4a878', '#a87448'], null, .8); }
      P.line(160, FLOOR_Y - 30, 318, 4, '#5a3b1c', 2.4); P.line(160, FLOOR_Y - 30, 160, FLOOR_Y - 8, '#5a3b1c', 2.4);
      for (var k = 0; k < 9; k++) P.line(168 + k * 18, FLOOR_Y - 34 - k * 14, 168 + k * 18, FLOOR_Y - 16 - k * 14, '#6b4423', 1.1);
      P.ell(160, FLOOR_Y - 31, 2.6, 2.6, '#8a5a2b'); plant(P, 140, FLOOR_Y, .9);
      P.alpha(.7 + .3 * Math.sin(T * 3), function () { P.text('↑', 214, 44 + Math.sin(T * 3) * 3, 16, '#8e1b2c'); });
    }
  };

  // ------------------------------------------------------------------ the llama (smooth, shaded, Andean blanket)
  function llama(P, x, y, T, mood, walk) {
    var leg = walk ? Math.sin(T * 11) : 0, bob = walk ? Math.abs(Math.sin(T * 11)) * 1.3 : (mood === 'happy' ? Math.abs(Math.sin(T * 9)) * 4 : 0);
    var shake = mood === 'no' ? Math.sin(T * 32) * 2.2 : 0, c = P.c;
    P.shadow(x + 4, y, 26); c.save(); c.translate(0, -bob * S);
    var cream = ['#fbf4e6', '#e9dcc2'], line = ['#9a8462', .6];
    [[x - 15, leg], [x - 6, -leg], [x + 11, leg], [x + 20, -leg]].forEach(function (L, i) {           // legs
      var lx = L[0] + L[1] * 2.2; P.rect(lx - 2.6, y - 30, 5.2, 28, i % 2 ? ['#efe4ce', '#d8c8a8'] : cream, line, 2.4); P.rect(lx - 3, y - 4, 6, 4, '#5a3b1c', null, 1.4);
    });
    P.ell(x + 2, y - 40, 27, 15, cream, line);                                                          // body
    for (var f = 0; f < 9; f++) P.curve([x - 20 + f * 5, y - 30, x - 18 + f * 5, y - 28, x - 16 + f * 5, y - 30.5], 'rgba(150,120,80,.35)', .5);   // fur at the belly
    P.curve([x - 23, y - 44, x - 30, y - 44, x - 27, y - 36], '#e9dcc2', 3.4);                          // tail
    var bands = ['#c0392b', '#f2c14e', '#2b5aa0', '#2f7d5b', '#c86bd0', '#e8892e'];
    P.c.save(); P.c.beginPath(); P.c.ellipse((x + 2) * S, (y - 40) * S, 27 * S, 15 * S, 0, 0, 7); P.c.clip();
    for (var b = 0; b < 6; b++) P.rect(x - 15 + b * 5.6, y - 56, 5.6, 22, bands[b]);
    for (var zz = 0; zz < 6; zz++) P.poly([[x - 15 + zz * 5.6, y - 45], [x - 12.2 + zz * 5.6, y - 48], [x - 9.4 + zz * 5.6, y - 45], [x - 12.2 + zz * 5.6, y - 42]], 'rgba(255,255,255,.55)');
    P.c.restore();
    P.rect(x - 16, y - 34.5, 34, 1.4, '#5a3b1c'); for (var tt = 0; tt < 7; tt++) P.rect(x - 15 + tt * 5, y - 33.5, 1.6, 4, bands[tt % 6], null, .6);
    P.poly([[x + 20, y - 46], [x + 30, y - 48], [x + 33, y - 88], [x + 23, y - 88]], cream, line);       // neck
    for (var n = 0; n < 6; n++) P.curve([x + 23 + n * .4, y - 52 - n * 6, x + 26 + n * .4, y - 54 - n * 6, x + 29 + n * .4, y - 52 - n * 6], 'rgba(150,120,80,.3)', .45);
    var hx = x + 29 + shake, hy = y - 92;
    P.poly([[hx - 7, hy - 4], [hx - 10, hy - 15], [hx - 2, hy - 7]], cream, line); P.poly([[hx + 2, hy - 7], [hx + 4, hy - 17], [hx + 8, hy - 6]], cream, line);   // ears
    P.poly([[hx - 7.6, hy - 6], [hx - 9, hy - 12.5], [hx - 4, hy - 7.5]], '#f3c9c0'); P.poly([[hx + 3.4, hy - 7.5], [hx + 4.4, hy - 14], [hx + 6.8, hy - 7]], '#f3c9c0');
    P.ell(hx - 9.6, hy - 15.6, 2.8, 2.8, ['#ff7b7b', '#d0404a']); P.ell(hx + 4.2, hy - 17.6, 2.8, 2.8, ['#6b9ff5', '#2b5aa0']);   // pompoms
    P.ell(hx + 1, hy, 11, 9.5, cream, line);                                                                  // round head
    for (var tf = 0; tf < 5; tf++) P.ell(hx - 3 + tf * 2.2, hy - 9 + Math.abs(tf - 2) * .7, 2.2, 2, '#fffaf0');   // fluffy topknot
    P.ell(hx + 8.5, hy + 3.5, 6, 4.6, ['#fffaf0', '#efe3cc'], line);                                          // soft snout
    P.poly([[hx + 9.4, hy + 1.6], [hx + 12, hy + 1.6], [hx + 10.7, hy + 3.2]], '#7a5a4a');                   // little nose
    var blink = (Math.floor(T * 10) % 37) === 0;
    if (mood === 'happy') { P.curve([hx - 1, hy - 1, hx + 2, hy - 4.5, hx + 5, hy - 1], '#3a2a1c', 1.1); }
    else if (blink) { P.curve([hx - 1, hy - 2, hx + 2, hy - .5, hx + 5, hy - 2], '#3a2a1c', .9); }
    else {
      P.ell(hx + 2, hy - 2, 3.3, 3.9, '#2a1d14');                                                            // big shiny eye
      P.ell(hx + 3.1, hy - 3.6, 1.3, 1.3, '#ffffff'); P.ell(hx + 1, hy - .6, .6, .6, '#ffffff');
      P.line(hx - .6, hy - 5.4, hx - 1.8, hy - 6.6, '#3a2a1c', .5); P.line(hx + 1.4, hy - 5.9, hx + 1, hy - 7.4, '#3a2a1c', .5);   // lashes
    }
    P.ell(hx + 2.6, hy + 4.2, 2.6, 1.6, 'rgba(255,140,150,.55)');                                             // rosy cheek
    P.curve([hx + 7.6, hy + 5.4, hx + 9.6, hy + (mood === 'happy' ? 8.4 : 7), hx + 11.6, hy + 5.4], '#7a4a3a', .8);   // smile
    c.restore();
  }
  function bubble(P, x, y, txt) {
    var c = P.c; c.font = '800 ' + 9.5 * S + 'px "Segoe UI",Arial,sans-serif'; var w = c.measureText(txt).width / S + 16;
    P.rect(x, y, w, 19, '#ffffff', ['#3a2a1c', .8], 6); P.poly([[x + 8, y + 18.5], [x + 17, y + 18.5], [x + 4, y + 27]], '#ffffff', ['#3a2a1c', .8]); P.rect(x + 7, y + 16.5, 11, 3, '#ffffff');
    P.text(txt, x + w / 2, y + 10, 9.5, '#1a2340', 800);
  }

  // ------------------------------------------------------------------ the game
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
    this.audio = new Audio(); this.order = []; this.i = -1; this.mood = ''; this.firstTry = 0;
    this.start.addEventListener('click', function () { self.start.hidden = true; self.begin(); });
    this.next.addEventListener('click', function () { self.go(self.i + 1); });
    this.opts.innerHTML = '<span style="font-size:15px;color:#5f554a">Press <strong>Tour the house with the llama</strong> to begin.</span>';
    this.loop();
  }
  Game.prototype.say = function (clip) { try { this.audio.pause(); this.audio.src = this.base + clip; var p = this.audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} };
  Game.prototype.begin = function () { var self = this; this.order = shuffle(this.cfg.rooms.slice()); this.firstTry = 0; this.dots.innerHTML = ''; this.order.forEach(function () { self.dots.appendChild(el('i')); }); this.go(0); };
  Game.prototype.go = function (i) {
    var self = this; this.i = i; this.next.hidden = true; this.fb.textContent = ''; this.fb.className = 'll-fb'; this.mood = ''; this.tries = 0;
    if (i >= this.order.length) return this.end();
    [].forEach.call(this.dots.children, function (d, k) { d.className = k < i ? 'done' : (k === i ? 'on' : ''); });
    var r = this.order[i], others = shuffle(this.cfg.rooms.filter(function (x) { return x.key !== r.key; })).slice(0, 2);
    this.walkStart = performance.now(); this.opts.innerHTML = '';
    shuffle([r].concat(others)).forEach(function (o) { var b = el('button', 'll-opt', o.es); b.type = 'button'; b.disabled = true; b.addEventListener('click', function () { self.pick(o, b); }); self.opts.appendChild(b); });
    setTimeout(function () { [].forEach.call(self.opts.children, function (b) { b.disabled = false; }); self.say(self.cfg.askClip); }, 900);
  };
  Game.prototype.pick = function (o, b) {
    var r = this.order[this.i]; this.tries++;
    if (o.key === r.key) {
      b.classList.add('ok'); [].forEach.call(this.opts.children, function (x) { x.disabled = true; });
      if (this.tries === 1) this.firstTry++;
      this.mood = 'happy'; this.moodAt = performance.now();
      this.fb.className = 'll-fb ok'; this.fb.innerHTML = '&iexcl;S&iacute;! Es <strong>' + r.es + '</strong> (' + r.en + ').';
      this.say(r.clip); this.next.hidden = false; this.next.innerHTML = this.i === this.order.length - 1 ? 'Finish the tour &#9654;' : 'Next room &#9654;'; this.next.focus();
    } else {
      b.classList.add('no'); b.disabled = true; this.mood = 'no'; this.moodAt = performance.now();
      this.fb.className = 'll-fb no'; this.fb.innerHTML = 'No, no es <strong>' + o.es + '</strong>. ' + (r.hint || 'Look again at the room.');
      this.say(this.cfg.noClip);
    }
  };
  Game.prototype.end = function () {
    var n = this.order.length, self = this; [].forEach.call(this.dots.children, function (d) { d.className = 'done'; });
    this.mood = 'happy'; this.moodAt = performance.now(); this.endShown = true;
    this.q.innerHTML = '&iexcl;Muy bien!'; this.opts.innerHTML = '';
    this.fb.className = 'll-fb ok'; this.fb.innerHTML = 'You toured all ' + n + ' rooms. Right on the first try: ' + this.firstTry + ' of ' + n + '.';
    var again = el('button', 'll-opt', 'Tour again'); again.type = 'button';
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
      var wt = r && !self.endShown ? Math.min(1, (performance.now() - self.walkStart) / 900) : 1, lx = 24 + 52 * wt, walking = wt < 1;
      var mood = self.mood && performance.now() - self.moodAt < (self.mood === 'no' ? 600 : 1e6) ? self.mood : '';
      llama(P, lx, 168, T, mood, walking);
      if (r && !walking && !self.endShown && self.mood !== 'happy') bubble(P, lx + 42, 16, '¿Qué cuarto es?');
      if (self.mood === 'happy' && r && !self.endShown) bubble(P, lx + 42, 16, '¡Sí! ' + r.es.charAt(0).toUpperCase() + r.es.slice(1));
      if (self.endShown) bubble(P, lx + 42, 16, '¡Muy bien!');
      if (!r && !self.endShown) { P.rect(92, 6, 136, 22, 'rgba(255,253,247,.9)', ['#b8892e', .8], 4); P.text('La llama y la casa', 160, 17.5, 12, '#8e1b2c', 900); }
      self.loop();
    });
  };
  function init() {
    if (!document.getElementById('ll-css')) { var s = document.createElement('style'); s.id = 'll-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.llama-game'), function (r) { if (!r.dataset.llReady) { r.dataset.llReady = '1'; new Game(r, JSON.parse(r.getAttribute('data-llama'))); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

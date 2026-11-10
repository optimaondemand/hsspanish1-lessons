/* cuento.js: an animated pixel-art story told by the recorded narration (Spanish 1 S2, Lesson 2.05, 2026-11-10).
   Same screen as molinos.js (640x360 drawn on a 320x180 grid at half-unit precision). All art is original and drawn
   in code. The scenes follow the narration clock: each word of the caption lights up as it is spoken (timings from
   the speech service), and each scene acts out what the sentence says.
   - First viewing: Spanish caption only. After the story has been heard once, a "Show English" switch appears (replay).
   - Click a caption word to hear just that word. Back / Next jump by sentence; "Again" replays the sentence.
   - When the page's verb hunt (marque.js) is finished, the caption colours its verbs the hunt's way (red / blue / gold).
   Markup: <div class="cuento" data-cuento='{"id","title","audio","sentences":[{"es","en","words":[[w,t0,t1],..]}],
            "colors":{"word":"boot|reg|keep"}, "beats":[[t,"scene"],...]}'></div>
   Reports "watched" to All Your Work with a 'mw-game' event. No libraries. */
(function () {
  'use strict';
  var W = 320, H = 180, S = 2;
  var OUT = '#1b140d';
  var CSS =
    '.cu{max-width:1000px;margin:0 auto 6px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.cu-stage{position:relative;border:4px solid #5a3b1c;outline:2px solid #b8892e;outline-offset:2px;background:#000;line-height:0;overflow:hidden;border-radius:2px}' +
    '.cu-cv{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges}' +
    '.cu-start{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(20,12,6,.35);cursor:pointer;border:0;padding:0;width:100%}' +
    '.cu-start>span{display:inline-flex;align-items:center;gap:14px;line-height:1.2;background:#8e1b2c;color:#fff;font:700 22px "Segoe UI",Arial,sans-serif;padding:14px 28px 14px 16px;border-radius:999px;box-shadow:0 0 0 4px #fff,0 0 0 7px #b8892e,0 8px 18px rgba(0,0,0,.4)}' +
    '.cu-start i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:#fff;color:#8e1b2c;font-size:22px}' +
    '.cu-start small{display:block;font-weight:400;font-size:15px;opacity:.9}' +
    '.cu-start[hidden]{display:none}.cu-start:hover>span{background:#6f1422}.cu-start:focus-visible{outline:4px solid #2b4c8c;outline-offset:-8px}' +
    '.cu-cap{background:#fffdf7;border:1px solid #ddcba4;border-top:0;padding:14px 18px 10px;min-height:64px;line-height:1.5}' +
    '.cu-es{font:600 24px "Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.cu-w{cursor:pointer;border-radius:4px;padding:0 2px;transition:background .12s,color .12s}.cu-w:hover{background:#f3e2b3}' +
    '.cu-w.now{background:#1d4e8f;color:#fff}.cu-w.past{color:#1a2340}.cu-w.fut{color:#8a8070}' +
    '.cu-w.boot{color:#8c2f39;font-weight:800;text-decoration:underline 3px #8c2f39}.cu-w.reg{color:#2b4c8c;font-weight:800;text-decoration:underline 3px #2b4c8c}' +
    '.cu-w.keep{color:#8a5a00;font-weight:800;text-decoration:underline 3px #b8892e}.cu-w.now.boot,.cu-w.now.reg,.cu-w.now.keep{color:#fff}' +
    '.cu-en{font:italic 18px "Segoe UI",Arial,sans-serif;color:#1a2340;margin-top:4px}.cu-en[hidden]{display:none}' +
    '.cu-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:#f4ecd8;border:1px solid #ddcba4;border-top:0;padding:8px 12px}' +
    '.cu-b{font:600 15px "Segoe UI",Arial,sans-serif;background:#1a2340;color:#fff;border:0;border-radius:999px;padding:7px 16px;cursor:pointer}' +
    '.cu-b:hover{background:#26335c}.cu-b:disabled{opacity:.4;cursor:default}.cu-b.alt{background:#fff;color:#1a2340;box-shadow:inset 0 0 0 2px #1a2340}' +
    '.cu-b:focus-visible{outline:3px solid #b8892e;outline-offset:2px}.cu-b[hidden]{display:none}' +
    '.cu-dots{display:flex;gap:6px;margin-left:auto}.cu-dots i{width:14px;height:14px;border-radius:50%;background:#d9ccb0;cursor:pointer}.cu-dots i.on{background:#8e1b2c}.cu-dots i.seen{background:#b8892e}' +
    '.cu-key{font-size:14px;color:#5f554a;padding:6px 2px 0}.cu-key[hidden]{display:none}' +
    '@media (max-width:640px){.cu-es{font-size:19px}.cu-start span{font-size:17px}}';

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }
  function since(T, t0, d) { return clamp((T - t0) / (d || 1), 0, 1); }

  // ---------------------------------------------------------------- drawing helpers (grid units, half-unit precision)
  function Painter(ctx) { this.c = ctx; }
  Painter.prototype.r = function (x, y, w, h, col) { this.c.fillStyle = col; this.c.fillRect(Math.round(x * S), Math.round(y * S), Math.round(w * S), Math.round(h * S)); };
  Painter.prototype.p = function (pts, col, line) {
    var c = this.c; c.beginPath(); c.moveTo(pts[0][0] * S, pts[0][1] * S);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * S, pts[i][1] * S);
    c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (line) { c.strokeStyle = line[0]; c.lineWidth = line[1] * S; c.stroke(); }
  };
  Painter.prototype.o = function (x, y, rad, col) { var c = this.c; c.beginPath(); c.arc(x * S, y * S, rad * S, 0, Math.PI * 2); c.fillStyle = col; c.fill(); };
  Painter.prototype.l = function (x1, y1, x2, y2, col, w) { var c = this.c; c.beginPath(); c.moveTo(x1 * S, y1 * S); c.lineTo(x2 * S, y2 * S); c.strokeStyle = col; c.lineWidth = (w || 1) * S; c.lineCap = 'round'; c.stroke(); };
  Painter.prototype.t = function (txt, x, y, size, col, align, weight, stroke) {
    var c = this.c; c.font = (weight || 800) + ' ' + size * S + 'px "Segoe UI",Arial,sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle';
    if (stroke) { c.lineWidth = stroke * S; c.strokeStyle = OUT; c.lineJoin = 'round'; c.strokeText(txt, x * S, y * S); }
    c.fillStyle = col; c.fillText(txt, x * S, y * S);
  };
  Painter.prototype.sky = function (top, bot, h) { var c = this.c, g = c.createLinearGradient(0, 0, 0, (h || H) * S); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W * S, (h || H) * S); };
  Painter.prototype.alpha = function (a, fn) { var c = this.c; c.save(); c.globalAlpha = clamp(a, 0, 1); fn(); c.restore(); };
  Painter.prototype.heart = function (x, y, s, col) {
    var c = this.c; c.save(); c.translate(x * S, y * S); c.scale(s * S / 10, s * S / 10); c.beginPath();
    c.moveTo(0, 3); c.bezierCurveTo(-1, 1, -5, -1, -5, -4); c.bezierCurveTo(-5, -7, -1, -8, 0, -5); c.bezierCurveTo(1, -8, 5, -7, 5, -4); c.bezierCurveTo(5, -1, 1, 1, 0, 3);
    c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 0.8; c.strokeStyle = OUT; c.stroke(); c.restore();
  };
  Painter.prototype.tag = function (txt, x, y, a, col) {   // a small hanging sign with a Spanish word on it
    var self = this; this.alpha(a, function () {
      var w = txt.length * 4.2 + 10;
      self.r(x - w / 2 - 1, y - 7, w + 2, 14, OUT); self.r(x - w / 2, y - 6, w, 12, col || '#fbf3dc'); self.t(txt, x, y + 0.5, 7.5, '#1a2340', 'center', 800);
    });
  };

  // ---------------------------------------------------------------- people
  var SKIN = '#c98e66', SKIN_D = '#a8714f', HAIR = '#2a1810';
  var CAT = { top: '#c0392b', top2: '#962a1f', legs: '#2f4b7c', braid: true, hair: HAIR };
  var SIS = { top: '#2f7d5b', top2: '#22604a', legs: '#4a3b6b', braid: false, hair: '#3a2014', bun: true };
  var MOM = { top: '#d4892e', top2: '#a9681c', legs: '#5a3b2a', braid: false, hair: '#3a2014', long: true, skirt: true, tall: 4 };
  var DAD = { top: '#3b5f8a', top2: '#2b476a', legs: '#3a3a44', braid: false, hair: '#22140c', short: true, tall: 6 };
  // pose: 'stand' | 'wave' | 'point' | 'up' | 'broom' | 'duster' | 'open'; ph = animation phase (seconds)
  function person(P, x, y, o, pose, ph, flip) {
    var c = P.c, k = o.k || 1.45; c.save();
    c.translate(x * S, y * S); c.scale(k, k); c.translate(-x * S, -y * S);   // figures drawn 1.45x so the actions read clearly
    if (flip) { c.translate(x * S * 2, 0); c.scale(-1, 1); }
    var tall = o.tall || 0, top = y - 44 - tall, blink = (Math.floor(ph * 10) % 37) === 0;
    // legs + shoes
    P.r(x - 4.5, y - 15, 9, 15, OUT); P.r(x - 3.5, y - 15, 3, 13.5, o.legs); P.r(x + 0.5, y - 15, 3, 13.5, o.legs);
    P.r(x - 4.5, y - 2, 4.5, 2, '#1d140e'); P.r(x + 0.5, y - 2, 4.5, 2, '#1d140e');
    // body (+ skirt)
    P.r(x - 7, top + 15, 14, 16 + tall, OUT); P.r(x - 6, top + 16, 12, 14.5 + tall, o.top); P.r(x + 3, top + 16, 3, 14.5 + tall, o.top2);
    if (o.skirt) P.p([[x - 6, y - 16], [x + 6, y - 16], [x + 8, y - 8], [x - 8, y - 8]], o.top, [OUT, 0.8]);
    // arms
    var sh = [x - 6, top + 18], sh2 = [x + 6, top + 18];
    P.l(sh[0], sh[1], x - 8, top + 29, OUT, 3.4); P.l(sh[0], sh[1], x - 8, top + 29, o.top, 2.2); P.o(x - 8, top + 29.5, 1.6, SKIN);
    var hx, hy, sw = Math.sin(ph * 9);
    if (pose === 'wave') { hx = x + 13 + sw * 2.5; hy = top + 6; }
    else if (pose === 'point') { hx = x + 17; hy = top + 18; }
    else if (pose === 'up') { hx = x + 12 + sw * 1.5; hy = top + 10 + Math.abs(sw) * 3; }
    else if (pose === 'open') { hx = x + 14; hy = top + 12; P.l(sh[0], sh[1], x - 14, top + 12, OUT, 3.4); P.l(sh[0], sh[1], x - 14, top + 12, o.top, 2.2); P.o(x - 14, top + 12, 1.6, SKIN); }
    else if (pose === 'broom' || pose === 'duster') { hx = x + 10 + sw * 3; hy = top + 24; }
    else { hx = x + 8; hy = top + 29; }
    P.l(sh2[0], sh2[1], hx, hy, OUT, 3.4); P.l(sh2[0], sh2[1], hx, hy, o.top, 2.2);
    if (pose === 'broom') {   // broom held across, sweeping
      P.l(hx - 2, hy - 12, hx + 6 + sw * 2, y - 2, '#8a5a2b', 1.6);
      P.p([[hx + 3 + sw * 2, y - 6], [hx + 10 + sw * 2, y - 6], [hx + 12 + sw * 2, y], [hx + 1 + sw * 2, y]], '#d9b45a', [OUT, 0.6]);
    }
    if (pose === 'duster') {  // feather duster swinging high
      var dx = hx + 6 + sw * 4, dy = hy - 10;
      P.l(hx, hy, dx, dy, '#5a3b1c', 1.4); P.o(dx, dy - 2, 3.5, '#e0b0c8'); P.o(dx - 2, dy - 4, 2.5, '#f0c8dc'); P.o(dx + 2, dy - 4, 2.5, '#c890ac');
    }
    P.o(hx, hy, 1.7, SKIN);
    // head
    var hxL = x - 6, hyT = top;
    if (o.long) P.r(x - 8, top + 2, 16, 18, o.hair);
    P.r(hxL - 1, hyT - 1, 14, 15, OUT); P.r(hxL, hyT, 12, 13, SKIN); P.r(hxL, hyT + 11, 12, 2, SKIN_D);
    P.r(hxL, hyT, 12, 4, o.hair); P.r(hxL, hyT, 2, 8, o.hair); P.r(hxL + 10, hyT, 2, 7, o.hair);
    if (o.short) { P.r(hxL, hyT, 12, 3, o.hair); P.r(hxL + 1, hyT + 9, 10, 1, SKIN); }
    if (o.bun) { P.o(x, hyT - 2, 3.2, o.hair); }
    if (o.braid) {   // the dark braid over her shoulder
      for (var i = 0; i < 6; i++) P.r(x + 5 + (i % 2), hyT + 9 + i * 3, 3, 3.2, i % 2 ? '#3a2216' : o.hair);
      P.r(x + 5.5, hyT + 27, 2.5, 1.5, '#c0392b');
    }
    if (blink) { P.r(x - 3.5, hyT + 6.5, 2, 0.6, OUT); P.r(x + 1.5, hyT + 6.5, 2, 0.6, OUT); }
    else { P.r(x - 3.5, hyT + 5.5, 1.6, 2, OUT); P.r(x + 1.5, hyT + 5.5, 1.6, 2, OUT); }
    P.r(x - 5, hyT + 8.5, 2, 1.2, '#e39a86'); P.r(x + 3, hyT + 8.5, 2, 1.2, '#e39a86');
    P.r(x - 1.5, hyT + 10, 3, 0.9, '#7a2b20');
    c.restore();
  }
  function nameplate(P, txt, x, y, a) { P.tag(txt, x, y, a, '#fff6d6'); }

  // ---------------------------------------------------------------- shared scenery
  function andes(P, base) {
    P.p([[0, base], [0, base - 26], [22, base - 40], [40, base - 30], [62, base - 52], [86, base - 34], [110, base - 48], [134, base - 28], [158, base - 56],
         [184, base - 36], [206, base - 50], [232, base - 30], [256, base - 46], [282, base - 32], [304, base - 44], [320, base - 34], [320, base]], '#7d8da3');
    P.p([[0, base], [0, base - 14], [30, base - 24], [70, base - 16], [120, base - 26], [170, base - 14], [220, base - 24], [270, base - 15], [320, base - 22], [320, base]], '#62728a');
    [[62, 52], [110, 48], [158, 56], [206, 50], [256, 46], [304, 44], [22, 40]].forEach(function (m) {
      P.p([[m[0], base - m[1]], [m[0] - 9, base - m[1] + 11], [m[0] - 3, base - m[1] + 8], [m[0] + 2, base - m[1] + 12], [m[0] + 8, base - m[1] + 9]], '#f4f7fb');
    });
  }
  function house(P, x, y, glow) {   // a whitewashed colonial house with a red tile roof; x = left, y = ground
    if (glow) P.alpha(glow, function () { P.o(x + 70, y - 40, 70, 'rgba(255,214,120,.35)'); });
    P.r(x - 1, y - 64, 142, 64, OUT); P.r(x, y - 63, 140, 63, '#f1e6cf'); P.r(x, y - 8, 140, 8, '#dccbab');
    P.p([[x - 10, y - 62], [x + 150, y - 62], [x + 128, y - 86], [x + 12, y - 86]], '#b5452c', [OUT, 1]);
    for (var i = 0; i < 6; i++) P.l(x - 7 + i * 3.6, y - 62 - i * 4, x + 147 - i * 3.6, y - 62 - i * 4, '#8a3220', 1);
    P.r(x + 61, y - 40, 18, 40, OUT); P.r(x + 62, y - 39, 16, 39, '#7a4a24'); P.r(x + 69.5, y - 39, 1, 39, '#55331a'); P.o(x + 75, y - 20, 1, '#e9c46a');
    [[x + 16], [x + 102]].forEach(function (w) {
      var wx = w[0]; P.r(wx - 1, y - 49, 24, 22, OUT); P.r(wx, y - 48, 22, 20, '#bfe0f0'); P.r(wx + 10.5, y - 48, 1, 20, '#55331a'); P.r(wx, y - 38.5, 22, 1, '#55331a');
      P.r(wx - 7, y - 49, 6, 22, '#3f7d3a'); P.r(wx + 23, y - 49, 6, 22, '#3f7d3a'); P.r(wx - 2, y - 27, 26, 3, '#8a5a2b');
      P.o(wx + 4, y - 29, 2.2, '#e05a6a'); P.o(wx + 11, y - 29.5, 2.2, '#f2c14e'); P.o(wx + 18, y - 29, 2.2, '#e05a6a');
    });
  }
  function room(P, wall, floor) {
    P.r(0, 0, W, 132, wall); P.r(0, 132, W, 48, floor);
    for (var i = 0; i < 20; i++) P.r(i * 16, 132, 0.6, 48, 'rgba(0,0,0,.12)');
    P.r(0, 150, W, 0.6, 'rgba(0,0,0,.12)'); P.r(0, 128, W, 4, '#8a5a2b');
  }
  function azulejo(P, y) { for (var i = 0; i < 40; i++) { P.r(i * 8, y, 8, 8, i % 2 ? '#2b5aa0' : '#eef3fb'); P.o(i * 8 + 4, y + 4, 1.6, i % 2 ? '#eef3fb' : '#2b5aa0'); } }
  function windowFrame(P, x, y, w, h, skyTop, skyBot, inner) {
    P.r(x - 2, y - 2, w + 4, h + 4, '#55331a');
    var c = P.c, g = c.createLinearGradient(0, y * S, 0, (y + h) * S); g.addColorStop(0, skyTop); g.addColorStop(1, skyBot);
    c.fillStyle = g; c.fillRect(x * S, y * S, w * S, h * S);
    if (inner) { c.save(); c.beginPath(); c.rect(x * S, y * S, w * S, h * S); c.clip(); inner(); c.restore(); }
    P.r(x + w / 2 - 0.5, y, 1, h, '#55331a'); P.r(x, y + h / 2 - 0.5, w, 1, '#55331a');
  }
  function bed(P, x, y, blanket, smooth, sleeper) {   // x = left, y = floor
    P.r(x - 1, y - 30, 4, 30, '#55331a'); P.r(x + 75, y - 22, 4, 22, '#55331a');
    P.r(x, y - 14, 78, 8, '#7a4a24');
    P.r(x + 3, y - 22, 16, 8, '#ffffff'); P.r(x + 3, y - 22, 16, 1, '#ddd');
    if (sleeper) sleeper();
    var top = y - 18 + (1 - smooth) * 0;
    var pts = [[x + (sleeper ? 14 : 20), y - 14]];
    for (var i = 0; i <= 8; i++) { var bx = x + (sleeper ? 14 : 20) + i * ((sleeper ? 64 : 58) / 8); pts.push([bx, top - (1 - smooth) * ((i % 2) ? 5 : 1) - (sleeper && i > 0 && i < 5 ? 4 : 0)]); }
    pts.push([x + 78, y - 14]); P.p(pts, blanket, [OUT, 0.8]);
    P.r(x + (sleeper ? 14 : 20), y - 9, sleeper ? 64 : 58, 3, blanket);
  }

  // ---------------------------------------------------------------- the map of South America (lon/lat -> grid)
  function mx(lon) { return 70 + (lon + 82) * 2.15; } function my(lat) { return 6 + (13 - lat) * 2.45; }
  var SA = [[-77, 8.5], [-72, 12], [-63, 10.7], [-60, 8.5], [-52, 5], [-50, 0], [-44, -2.5], [-35, -5.5], [-39, -13], [-41, -22], [-48, -26], [-53, -34],
    [-57, -36.5], [-62, -39], [-65, -42], [-67.5, -46.5], [-69, -51], [-68.5, -54.8], [-72, -53.8], [-74.5, -51], [-75.5, -46], [-73.5, -42], [-73.7, -37],
    [-71.6, -33], [-71.4, -30], [-70.3, -23], [-70.3, -18.3], [-75, -15], [-77, -12], [-80, -7], [-81.3, -4.5], [-80, -1], [-78.8, 1.5], [-77.5, 4]];
  var CL = [[-70.3, -17.5], [-69.4, -17.6], [-68.4, -22], [-68.3, -25], [-69.4, -28], [-70, -31], [-70, -34], [-71, -38], [-71.7, -42], [-71.6, -46],
    [-72.3, -50], [-68.6, -52.3], [-68.6, -54.9], [-72, -53.8], [-74.5, -51], [-75.5, -46], [-73.5, -42], [-73.7, -37], [-71.6, -33], [-71.4, -30], [-70.3, -23]];
  function proj(a) { return a.map(function (q) { return [mx(q[0]), my(q[1])]; }); }

  // ---------------------------------------------------------------- scenes (T = narration time, lt = time in this scene)
  var SCENES = {
    map: function (P, T, lt) {
      P.sky('#3f7fbf', '#6aa6dc');
      for (var i = 0; i < 14; i++) P.r(((i * 47 + T * 6) % 340) - 10, 20 + i * 11, 8, 0.8, 'rgba(255,255,255,.35)');
      P.p(proj(SA), '#d9c79a', [OUT, 1]);
      var flash = T > 2.4 ? 0.55 + 0.45 * Math.sin((T - 2.4) * 8) : 0;
      P.p(proj(CL), '#c0392b', [OUT, 0.8]);
      if (flash) P.p(proj(CL), null, ['rgba(255,230,120,' + flash.toFixed(2) + ')', 2.2]);
      var sx = mx(-70.67), sy = my(-33.45), d = since(T, 1.67, 0.45), b = d < 1 ? -40 * (1 - ease(d)) : Math.sin(Math.min(1, (T - 2.12) * 3) * Math.PI) * -3;
      if (T > 1.6) {
        P.l(sx, sy + b, sx, sy - 9 + b, OUT, 1.2); P.o(sx, sy - 11 + b, 4, '#f2c14e'); P.o(sx, sy - 11 + b, 1.6, '#8e1b2c');
        P.tag('Santiago', sx - 30, sy - 4, since(T, 1.9, 0.3));
      }
      P.alpha(since(T, 2.43, 0.3), function () { P.t('CHILE', mx(-80), my(-44), 15, '#fff', 'center', 900, 3); P.l(mx(-79), my(-41), mx(-72.5), my(-38), '#fff', 1.2); });
      var cx = 262, enter = ease(since(T, 0, 0.5));
      person(P, cx + (1 - enter) * 80, 166, CAT, T > 0.55 ? 'wave' : 'stand', T, true);
      nameplate(P, 'Catalina', cx, 92, since(T, 0.59, 0.3));
    },
    house: function (P, T, lt) {
      P.sky('#5fa8d8', '#bfe0f0', 130); andes(P, 120); P.r(0, 120, W, 60, '#6aa84f'); P.r(0, 150, W, 30, '#5b9443');
      for (var i = 0; i < 30; i++) P.r((i * 37) % 320, 125 + (i * 13) % 50, 2, 1.5, '#4f8a3b');
      house(P, 120, 150);
      person(P, 72, 166, CAT, 'point', T);
      P.tag('mi casa', 190, 46, since(T, 3.95, 0.3));
    },
    kitchen: function (P, T, lt) {
      room(P, '#f3e9d2', '#c58a5a'); azulejo(P, 96);
      windowFrame(P, 128, 22, 52, 40, '#5fa8d8', '#bfe0f0', function () { andes(P, 64); });
      P.r(24, 70, 50, 58, '#2b2b2b'); P.r(26, 72, 46, 8, '#3d3d3d'); P.r(30, 92, 38, 28, '#1d1d1d'); P.r(32, 94, 34, 24, '#3a2a20');
      P.o(40, 70, 6, '#6b6b6b'); P.r(34, 62, 12, 8, '#8a8a8a'); P.o(60, 70, 5, '#6b6b6b'); P.r(55, 64, 10, 6, '#b5452c');
      for (var s = 0; s < 3; s++) { var sy = 58 - ((T * 14 + s * 6) % 18); P.alpha(0.6 - ((T * 14 + s * 6) % 18) / 30, function () { P.o(40 + Math.sin(T * 3 + s) * 2, sy, 2.5, '#ffffff'); }); }
      P.r(196, 30, 100, 3, '#8a5a2b'); for (var p = 0; p < 5; p++) P.o(206 + p * 19, 26, 5, p % 2 ? '#2b5aa0' : '#f2c14e');
      for (var k = 0; k < 4; k++) { P.l(204 + k * 22, 40, 204 + k * 22, 48, '#55331a', 0.8); P.o(204 + k * 22, 52, 4.5, '#8a8a8a'); }
      P.r(150, 120, 150, 6, '#7a4a24'); P.r(154, 126, 4, 22, '#55331a'); P.r(292, 126, 4, 22, '#55331a');
      for (var ch = 0; ch < 5; ch++) { P.r(160 + ch * 28, 104, 3, 44, '#55331a'); P.r(160 + ch * 28, 130, 14, 3, '#55331a'); }
      P.o(190, 116, 5, '#fff'); P.o(230, 116, 5, '#fff'); P.o(270, 116, 5, '#fff'); P.o(210, 112, 4, '#e8a33d');
      person(P, 104, 166, CAT, 'up', T);
      P.tag('la cocina', 220, 82, since(T, 4.79, 0.3));
      var g = since(T, 5.27, 0.4);
      if (g > 0) P.alpha(g, function () {
        var w = 140 + 150 * ease(g);
        P.l(160 - w / 2, 160, 160 + w / 2, 160, '#8e1b2c', 2);
        P.p([[160 - w / 2 - 4, 160], [160 - w / 2 + 4, 155], [160 - w / 2 + 4, 165]], '#8e1b2c'); P.p([[160 + w / 2 + 4, 160], [160 + w / 2 - 4, 155], [160 + w / 2 - 4, 165]], '#8e1b2c');
        P.t('grande', 160, 172, 9 + 3 * Math.sin(Math.min(1, g) * Math.PI), '#fff', 'center', 900, 2.4);
      });
    },
    doors: function (P, T, lt) {
      room(P, '#efe2c6', '#b98457'); azulejo(P, 110);
      var times = [5.95, 6.25, 6.55];
      for (var i = 0; i < 3; i++) {
        var dx = 80 + i * 80, on = since(T, times[i], 0.35);
        P.r(dx - 2, 38, 44, 92, OUT); P.r(dx, 40, 40, 88, '#3a2a20');
        P.alpha(on, function () {   // lit room behind: a little bed
          P.r(dx, 40, 40, 88, '#ffe6a8'); P.r(dx + 6, 104, 28, 6, '#ffffff'); P.r(dx + 4, 108, 32, 10, ['#2b5aa0', '#c0392b', '#3f7d3a'][i]); P.r(dx + 4, 118, 3, 10, '#55331a'); P.r(dx + 33, 118, 3, 10, '#55331a');
        });
        var open = ease(on);
        P.p([[dx, 40], [dx + 40 - 30 * open, 40 + 4 * open], [dx + 40 - 30 * open, 128 - 4 * open], [dx, 128]], '#7a4a24', [OUT, 0.8]);
        P.o(dx + 34 - 26 * open, 86, 1.2, '#e9c46a');
        P.r(dx + 12, 24, 16, 12, OUT); P.r(dx + 13, 25, 14, 10, on > 0 ? '#f2c14e' : '#dccbab');
        P.t(String(i + 1), dx + 20, 30.5, 8, '#1a2340', 'center', 900);
        if (on > 0 && on < 1) P.t(['uno', 'dos', 'tres'][i], dx + 20, 16 - 6 * on, 9, '#fff', 'center', 900, 2.4);
      }
      person(P, 40, 166, CAT, 'point', T);
      P.tag('tres dormitorios', 240, 150, since(T, 6.23, 0.3));
    },
    garden: function (P, T, lt) {
      P.sky('#5fa8d8', '#cfe8f5', 130); andes(P, 112); P.r(0, 112, W, 68, '#6aa84f'); P.r(0, 150, W, 30, '#5b9443');
      P.r(30, 70, 8, 52, '#6b4423'); P.o(34, 62, 20, '#3f7d3a'); P.o(22, 70, 12, '#4f8f43'); P.o(46, 70, 12, '#4f8f43');
      [[26, 60], [40, 56], [32, 72], [46, 66]].forEach(function (q) { P.o(q[0], q[1], 2.2, '#f2c14e'); });
      P.r(140, 120, 40, 10, '#cfc6b4'); P.r(150, 104, 20, 18, '#d9d1bf'); P.r(156, 96, 8, 10, '#cfc6b4');
      for (var d = 0; d < 6; d++) { var ph = (T * 1.6 + d / 6) % 1; P.o(160 + Math.cos(d) * 10 * ph, 96 - 14 * Math.sin(ph * Math.PI), 1.2, '#9fd3f0'); }
      var bloom = ease(since(T, 7.19, 0.9));
      for (var f = 0; f < 18; f++) {
        var fx = 70 + f * 13 + (f % 3) * 2, fy = 146 + (f % 2) * 10, hgt = 4 + 8 * bloom;
        P.l(fx, fy, fx, fy - hgt, '#3f7d3a', 1); P.o(fx, fy - hgt, 1 + 2.6 * bloom, ['#e05a6a', '#f2c14e', '#ffffff', '#c86bd0'][f % 4]); P.o(fx, fy - hgt, 0.9 * bloom, '#8a5a00');
      }
      var bx = 200 + Math.sin(T * 2) * 30, by = 80 + Math.sin(T * 5) * 6;
      P.p([[bx, by], [bx - 4, by - 3 - Math.abs(Math.sin(T * 12)) * 2], [bx - 4, by + 3]], '#f29b38'); P.p([[bx, by], [bx + 4, by - 3 - Math.abs(Math.sin(T * 12)) * 2], [bx + 4, by + 3]], '#f29b38');
      person(P, 270, 166, CAT, 'open', T, true);
      P.tag('el jardín', 160, 40, since(T, 7.19, 0.3));
      var sp = since(T, 7.51, 0.6); if (sp > 0 && sp < 1) for (var s = 0; s < 8; s++) P.alpha(1 - sp, function () { P.t('✦', 160 + Math.cos(s * .8) * 60 * sp, 120 + Math.sin(s * .8) * 30 * sp, 8, '#fff6a0', 'center', 400); });
      P.tag('bonito', 160, 56, since(T, 7.51, 0.3), '#ffe0e6');
    },
    bedroom: function (P, T, lt) {
      room(P, '#f6e2d2', '#b98457');
      var rise = ease(since(T, 8.8, 1.4));
      windowFrame(P, 22, 22, 56, 46, rise > 0.5 ? '#6fb3e0' : '#f2a65a', '#ffe3a8', function () { P.o(50, 70 - 30 * rise, 9, '#ffd34d'); andes(P, 72); });
      P.tag('todas las mañanas', 50, 82, since(T, 8.79, 0.3));
      P.r(212, 40, 70, 3, '#8a5a2b'); P.r(212, 70, 70, 3, '#8a5a2b');
      var tidy = since(T, 9.85, 1.0), books = ['#2b5aa0', '#3f7d3a', '#c0392b'];
      for (var b = 0; b < 3; b++) {
        var k = ease(clamp(tidy * 3 - b, 0, 1)), fx = 120 + b * 14, fy = 150, tx = 222 + b * 8, ty = 56;
        var x = fx + (tx - fx) * k, y = fy + (ty - fy) * k - Math.sin(k * Math.PI) * 30;
        P.r(x - 0.5, y - 0.5, 7, 15, OUT); P.r(x, y, 6, 14, books[b]); P.r(x, y + 3, 6, 1, '#fbf3dc');
      }
      P.r(250, 46, 6, 24, '#c86bd0'); P.r(258, 50, 6, 20, '#f2c14e');
      P.c.save(); P.c.translate(160 * S, 150 * S); P.c.scale(1.35, 1.35); P.c.translate(-160 * S, -150 * S);
      bed(P, 120, 150, '#e05a6a', ease(since(T, 9.79, 1.1)));
      P.c.restore();
      person(P, 82, 166, CAT, tidy > 0 && tidy < 1 ? 'up' : 'stand', T);
      P.tag('ordeno mi habitación', 200, 96, since(T, 9.79, 0.3));
    },
    help: function (P, T, lt) {
      room(P, '#f3e9d2', '#c58a5a'); azulejo(P, 96);
      P.r(230, 60, 60, 68, '#7a4a24'); P.r(234, 64, 52, 30, '#bfe0f0'); P.r(234, 98, 52, 28, '#8a5a2b');
      var grab = since(T, 11.23, 0.3);
      if (grab < 1) { P.l(196, 82, 204, 146, '#8a5a2b', 1.6); P.p([[199, 138], [209, 138], [211, 148], [197, 148]], '#d9b45a', [OUT, 0.6]); }
      var bub = since(T, 10.99, 0.3);
      P.alpha(bub, function () {
        P.o(150, 108, 2, '#fff'); P.o(156, 98, 3, '#fff');
        P.r(150, 30, 80, 56, OUT); P.r(151, 31, 78, 54, '#ffffff');
        P.c.save(); P.c.beginPath(); P.c.rect(151 * S, 31 * S, 78 * S, 54 * S); P.c.clip();
        P.c.translate(151 * S, 31 * S); P.c.scale(0.45, 0.45); P.c.translate(-60 * S, -40 * S);
        house(P, 90, 150); P.heart(160, 70, 3, '#e05a6a');
        P.c.restore();
      });
      if (grab >= 1) { for (var d = 0; d < 4; d++) { var ph = (T * 2 + d / 4) % 1; P.alpha(1 - ph, function () { P.o(150 + d * 6 + ph * 10, 160 - ph * 8, 2 + ph * 3, '#d8c8a8'); }); } }
      person(P, 120, 166, CAT, grab >= 1 ? 'broom' : 'point', T);
      P.tag('quiero ayudar', 190, 20, since(T, 10.99, 0.3));
    },
    sleep: function (P, T, lt) {
      room(P, '#c9c3d8', '#8f7a64');
      P.r(30, 24, 50, 44, '#5a3b6b'); P.r(30, 24, 25, 44, '#6b4a80'); P.r(28, 22, 54, 3, '#8a5a2b');
      var cx = 230, cy = 46; P.o(cx, cy, 16, OUT); P.o(cx, cy, 14.5, '#fbf3dc');
      var spin = T < 13.59 ? 0 : (T - 13.59) * 9; P.l(cx, cy, cx + Math.sin(spin) * 11, cy - Math.cos(spin) * 11, OUT, 1.2); P.l(cx, cy, cx + Math.sin(spin / 12) * 7, cy - Math.cos(spin / 12) * 7, OUT, 1.6);
      P.c.save(); P.c.translate(150 * S, 150 * S); P.c.scale(1.6, 1.6); P.c.translate(-150 * S, -150 * S);
      bed(P, 110, 150, '#4f6fb0', 1, function () {   // the sister asleep
        P.r(112, 128, 14, 12, OUT); P.r(113, 129, 12, 10, SKIN); P.r(113, 129, 12, 3, SIS.hair); P.o(119, 127, 3, SIS.hair);
        P.r(115, 135, 3, 0.6, OUT); P.r(120, 135, 3, 0.6, OUT);
      });
      P.c.restore();
      for (var z = 0; z < 3; z++) { var ph = (T * 0.7 + z / 3) % 1; P.alpha(1 - ph, function () { P.t('Z', 110 + ph * 30 + z * 4, 108 - ph * 50, 8 + ph * 8 + (T > 14.03 ? 4 : 0), '#ffffff', 'center', 900, 2); }); }
      P.tag('mi hermana', 60, 100, since(T, 13.19, 0.3));
      P.tag('prefiere dormir', 230, 90, since(T, 13.59, 0.3));
    },
    clean: function (P, T, lt) {
      room(P, '#eedfc0', '#9c6b44');
      P.r(40, 30, 60, 44, '#b8892e'); P.r(44, 34, 52, 36, '#5f8fb5'); P.p([[44, 70], [62, 50], [74, 60], [96, 44], [96, 70]], '#3f7d3a');
      P.r(60, 128, 200, 20, '#8e1b2c'); P.r(66, 132, 188, 12, '#a8323f');
      P.r(150, 96, 110, 34, '#2f6b4f'); P.r(150, 86, 110, 14, '#3f7d5f'); P.r(144, 92, 10, 38, '#2f6b4f'); P.r(256, 92, 10, 38, '#2f6b4f');
      P.r(286, 60, 3, 68, '#55331a'); P.p([[278, 44], [298, 44], [292, 60], [284, 60]], '#f2c14e', [OUT, 0.6]);
      var dust = 1 - since(T, 15.47, 0.8);
      for (var d = 0; d < 6; d++) P.alpha(dust * 0.8, function () { P.o(170 + d * 15 + Math.sin(T * 4 + d) * 3, 84 - (d % 2) * 6, 4, '#bfb2a0'); });
      var sp = since(T, 15.47, 0.6);
      if (sp > 0) for (var s = 0; s < 6; s++) P.alpha(0.5 + 0.5 * Math.sin(T * 6 + s), function () { P.t('✦', 160 + s * 18, 80 - (s % 2) * 8, 8, '#fff6a0', 'center', 400, 1); });
      person(P, 116, 166, SIS, 'duster', T);
      P.tag('después', 230, 24, since(T, 15.03, 0.3));
      P.tag('limpia la sala', 230, 40, since(T, 15.47, 0.3));
    },
    love: function (P, T, lt) {
      P.sky('#f0905a', '#ffd9a0', 130); andes(P, 120); P.r(0, 120, W, 60, '#6aa84f'); P.r(0, 150, W, 30, '#5b9443');
      house(P, 90, 150, 0.6 + 0.4 * Math.sin(T * 3));
      person(P, 58, 166, DAD, 'stand', T + 3); person(P, 88, 166, MOM, 'stand', T + 7);
      person(P, 234, 166, SIS, 'wave', T + 1, true); person(P, 264, 166, CAT, 'wave', T, true);
      var h = since(T, 17.71, 1.0);
      if (h > 0) { var pulse = 1 + 0.08 * Math.sin(T * 7); P.heart(160, 50 - 12 * ease(h), (8 + 18 * ease(h)) * pulse, '#e0304a'); }
      for (var k = 0; k < 6; k++) { var ph = (T * 0.5 + k / 6) % 1; if (T > 17.9) P.alpha(1 - ph, function () { P.heart(40 + k * 48, 120 - ph * 70, 2.2, '#ff6f86'); }); }
      P.tag('nosotros', 160, 14, since(T, 17.07, 0.3));
      P.tag('queremos mucho nuestra casa', 160, 172, since(T, 17.71, 0.3), '#ffe0e6');
    },
    title: function (P, T) {
      P.sky('#5fa8d8', '#bfe0f0', 130); andes(P, 120); P.r(0, 120, W, 60, '#6aa84f'); P.r(0, 150, W, 30, '#5b9443');
      house(P, 90, 150); person(P, 258, 166, CAT, 'wave', T, true);
      P.t('La casa de Catalina', 160, 22, 15, '#fff', 'center', 900, 3.2);
    }
  };

  // ---------------------------------------------------------------- the player
  function Cuento(root, cfg) {
    var self = this; this.cfg = cfg; this.root = root; root.classList.add('cu'); root._cu = this;
    this.beats = cfg.beats; this.sent = cfg.sentences; this.colors = cfg.colors || {};
    var stage = el('div', 'cu-stage'); root.appendChild(stage);
    this.cv = el('canvas', 'cu-cv'); this.cv.width = W * S; this.cv.height = H * S; this.cv.setAttribute('role', 'img');
    this.cv.setAttribute('aria-label', 'Animated story: ' + (cfg.title || '')); stage.appendChild(this.cv);
    this.P = new Painter(this.cv.getContext('2d'));
    this.startBtn = el('button', 'cu-start', '<span><i aria-hidden="true">&#9654;</i><span>Watch Catalina&rsquo;s story<small>Mira y escucha</small></span></span>');
    this.startBtn.type = 'button'; stage.appendChild(this.startBtn);
    this.startBtn.addEventListener('click', function () { self.play(0); });
    var cap = el('div', 'cu-cap'); root.appendChild(cap);
    this.es = el('div', 'cu-es'); this.es.lang = 'es'; cap.appendChild(this.es);
    this.en = el('div', 'cu-en'); this.en.hidden = true; cap.appendChild(this.en);
    var bar = el('div', 'cu-bar'); root.appendChild(bar);
    this.bPlay = this.btn(bar, '&#9654; Play', function () { self.toggle(); });
    this.bBack = this.btn(bar, '&#9664; Back', function () { self.jump(self.cur - 1); }, true);
    this.bAgain = this.btn(bar, '&#10227; Again', function () { self.jump(self.cur); }, true);
    this.bNext = this.btn(bar, 'Next &#9654;', function () { self.jump(self.cur + 1); }, true);
    this.bEn = this.btn(bar, 'Show English', function () { self.showEn = !self.showEn; self.bEn.textContent = self.showEn ? 'Hide English' : 'Show English'; self.caption(true); }, true);
    this.bEn.hidden = true;
    this.bRate = this.btn(bar, 'Speed: slower', function () { self.rate = self.rate < 1 ? 1 : (cfg.rate || 0.8); self.audio.playbackRate = self.rate; self.bRate.textContent = self.rate < 1 ? 'Speed: slower' : 'Speed: normal'; }, true);
    this.dots = el('div', 'cu-dots'); bar.appendChild(this.dots);
    this.sent.forEach(function (s, i) { var d = el('i'); d.title = 'Sentence ' + (i + 1); d.addEventListener('click', function () { self.jump(i); }); self.dots.appendChild(d); });
    this.key = el('div', 'cu-key', '<b style="color:#8c2f39">red</b> = stem changes &middot; <b style="color:#2b4c8c">blue</b> = regular verb &middot; <b style="color:#8a5a00">gold</b> = boot verb, no change here');
    this.key.hidden = true; root.appendChild(this.key);
    this.audio = new Audio(cfg.audio); this.audio.preload = 'auto';
    this.rate = cfg.rate || 0.8;   // a little slower than the recording; scenes and words follow the clip's own clock, so they stay in sync
    try { this.audio.preservesPitch = true; } catch (e) {}
    this.audio.addEventListener('ended', function () { self.finished(); });
    this.cur = 0; this.wordEnd = null; this.heard = false; this.showEn = false; this.coloured = false; this.seen = {};
    try { this.heard = localStorage.getItem('cuento-heard-' + cfg.id) === '1'; } catch (e) {}
    if (this.heard) this.bEn.hidden = false;
    window.addEventListener('mw-game', function (e) {   // the verb hunt on this page is finished: colour the verbs
      var d = e.detail || {}; if (d.done && /caza de verbos/i.test(d.name || '')) { self.coloured = true; self.key.hidden = false; self.caption(true); }
    });
    this.caption(true); this.frame();
  }
  Cuento.prototype.btn = function (bar, h, fn, alt) { var b = el('button', 'cu-b' + (alt ? ' alt' : ''), h); b.type = 'button'; b.addEventListener('click', fn); bar.appendChild(b); return b; };
  Cuento.prototype.time = function () { return this.audio.currentTime || 0; };
  Cuento.prototype.sentAt = function (T) { var i = 0; for (var k = 0; k < this.sent.length; k++) if (T >= this.sent[k].words[0][1] - 0.3) i = k; return i; };
  Cuento.prototype.sceneAt = function (T) { var b = this.beats[0]; for (var k = 0; k < this.beats.length; k++) if (T >= this.beats[k][0]) b = this.beats[k]; return b; };
  Cuento.prototype.play = function (from) {
    var self = this; this.startBtn.hidden = true; this.wordEnd = null;
    if (from != null) this.audio.currentTime = from;
    this.audio.playbackRate = this.rate;
    var p = this.audio.play(); if (p && p.catch) p.catch(function () {});
    this.bPlay.innerHTML = '&#10074;&#10074; Pause';
    if (!this.raf) this.loop();
  };
  Cuento.prototype.pause = function () { this.audio.pause(); this.bPlay.innerHTML = '&#9654; Play'; };
  Cuento.prototype.toggle = function () { if (this.audio.paused) this.play(this.audio.ended ? 0 : null); else this.pause(); };
  Cuento.prototype.jump = function (i) { i = clamp(i, 0, this.sent.length - 1); this.cur = i; this.play(Math.max(0, this.sent[i].words[0][1] - 0.35)); };
  Cuento.prototype.word = function (w) { this.startBtn.hidden = true; this.audio.currentTime = Math.max(0, w[1] - 0.04); this.wordEnd = w[2] + 0.05; this.audio.playbackRate = this.rate; var p = this.audio.play(); if (p && p.catch) p.catch(function () {}); this.bPlay.innerHTML = '&#9654; Play'; if (!this.raf) this.loop(); };
  Cuento.prototype.finished = function () {
    this.pause(); this.bPlay.innerHTML = '&#10227; Watch again';
    if (!this.heard) {
      this.heard = true; this.bEn.hidden = false;
      try { localStorage.setItem('cuento-heard-' + this.cfg.id, '1'); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title || 'Story', done: true, summary: 'Watched the whole story with the narration' } })); } catch (e) {}
    }
  };
  Cuento.prototype.loop = function () {
    var self = this;
    this.raf = requestAnimationFrame(function () {
      self.raf = null; var T = self.time();
      if (self.wordEnd != null && T >= self.wordEnd) { self.audio.pause(); self.wordEnd = null; }
      self.frame();
      if (!self.audio.paused) self.loop();
    });
  };
  Cuento.prototype.caption = function (force) {
    var T = this.time(), i = this.started() ? this.sentAt(T) : 0, s = this.sent[i], self = this;
    if (force || i !== this.capI) {
      this.capI = i; this.cur = i; this.es.innerHTML = '';
      s.words.forEach(function (w) {
        var sp = el('span', 'cu-w'); sp.textContent = w[0]; sp._w = w;
        var key = w[0].toLowerCase().replace(/[^a-záéíóúñü]/g, '');
        if (self.coloured && self.colors[key]) sp.classList.add(self.colors[key]);
        sp.addEventListener('click', function () { self.word(w); });
        self.es.appendChild(sp); self.es.appendChild(document.createTextNode(' '));
      });
      this.en.textContent = s.en; this.en.hidden = !(this.heard && this.showEn);
      [].forEach.call(this.dots.children, function (d, k) { d.className = k === i ? 'on' : (self.seen[k] ? 'seen' : ''); });
    }
    this.seen[i] = true;
    [].forEach.call(this.es.querySelectorAll('.cu-w'), function (sp) {
      var w = sp._w, st = !self.started() ? 'past' : T >= w[1] && T < w[2] + 0.08 ? 'now' : T >= w[2] ? 'past' : 'fut';
      sp.classList.remove('now', 'past', 'fut'); sp.classList.add(st);
    });
    this.bBack.disabled = i === 0; this.bNext.disabled = i === this.sent.length - 1;
  };
  Cuento.prototype.started = function () { return this.startBtn.hidden; };
  Cuento.prototype.frame = function () {
    var T = this.time(), P = this.P, c = P.c;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W * S, H * S);
    if (!this.started()) { SCENES.title(P, performance.now() / 1000); this.caption(); var self = this; if (!this.idle) this.idle = setInterval(function () { if (!self.started()) self.frame(); else { clearInterval(self.idle); } }, 120); return; }
    var b = this.sceneAt(T);
    SCENES[b[1]](P, T, T - b[0]);
    var f = T - b[0]; if (f < 0.25) P.alpha(1 - f / 0.25, function () { P.r(0, 0, W, H, '#000'); });
    this.caption();
  };
  function init() {
    if (!document.getElementById('cu-css')) { var s = document.createElement('style'); s.id = 'cu-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.cuento'), function (root) {
      if (root.dataset.cuReady) return; root.dataset.cuReady = '1';
      new Cuento(root, JSON.parse(root.getAttribute('data-cuento')));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

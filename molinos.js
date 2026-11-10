/* molinos.js: "Los molinos de viento", a pixel-art verb game (Spanish 1 S2, Lesson 2.03 opener; 2026-11-09).
   Original art drawn in code (no assets from any existing game). Music: Cantiga de Santa María 100, "Santa María,
   strela do día" (13th c., public domain), synthesised in code; see the music section for the source and arrangement.
   Don Quijote faces a shape on the plain of La Mancha carrying a banner with a verb form.
   Wrong form = a windmill in disguise: TURN AWAY earns the next, shinier piece of armour, shown large in the centre
   with a trumpet fanfare, then flown onto him; CHARGE = the sails throw him (the tragic mistake).
   Right form = a real giant: CHARGE and it falls crying "¡Nooo! ¡He perdido!"; TURN AWAY = it laughs + a hint.
   Missed items come back two shapes later. Ungraded practice.
   Markup: <div class="molinos" data-molinos='{"items":[{"who","form","inf","ok","fix","why"}]}'></div>
   Optional cfg: audioBase (default "../../audio/"), giantClip (default "game/molinos-he-perdido.mp3").
   Canvas: 640x360 device pixels drawn on a 320x180 design grid at half-unit precision (finer detail, same layout). */
(function () {
  'use strict';
  var W = 320, H = 180, SCALE = 2;
  var ARMOR = [
    { key: 'helmet', en: 'Helmet', es: 'el yelmo' },
    { key: 'breast', en: 'Breastplate', es: 'la coraza' },
    { key: 'shield', en: 'Shield', es: 'el escudo' },
    { key: 'gaunt', en: 'Gauntlets', es: 'los guanteletes' },
    { key: 'lance', en: 'Lance', es: 'la lanza' },
    { key: 'sword', en: 'Sword', es: 'la espada' }
  ];
  var METAL = { helmet: '#9aa3ab', breast: '#b9c2cb', shield: '#cdd5dd', gaunt: '#dde4ea', lance: '#eef3f7', sword: '#f8fbfd' };
  var OUT = '#1b140d';
  var CSS =
    '.mq{max-width:1000px;margin:0 auto;color:#1a2340;font-family:"Segoe UI",Roboto,Arial,sans-serif}' +
    '.mq-hud{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;background:#20140c;border:3px solid #5a3b1c;border-bottom:0;padding:6px 10px;color:#f3e2b3}' +
    '.mq-slots{display:flex;gap:5px;flex-wrap:wrap}.mq-slot{font:600 12.5px "Segoe UI",Arial,sans-serif;padding:3px 7px;border:2px solid #5a4a36;color:#7d6b55;background:#2b1d12;border-radius:3px}' +
    '.mq-slot.on{border-color:#e9c46a;color:#20140c;background:linear-gradient(#fff6d6,#e9c46a);box-shadow:0 0 6px #e9c46a}' +
    '.mq-count{font:700 13px "Segoe UI",Arial,sans-serif}' +
    '.mq-stage{position:relative;border:3px solid #5a3b1c;background:#000;line-height:0;overflow:hidden}' +
    '.mq-cv{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges}' +
    '.mq-banner{position:absolute;right:3%;top:5%;line-height:1.15;text-align:center;background:#fbf3dc;border:4px solid #20140c;box-shadow:4px 4px 0 #20140c;padding:8px 14px;min-width:150px}' +
    '.mq-banner .who{display:block;font:600 15px "Segoe UI",Arial,sans-serif;color:#5f554a}' +
    '.mq-banner .form{display:block;font:800 30px "Segoe UI",Arial,sans-serif;color:#1a2340;letter-spacing:.5px}' +
    '.mq-banner .inf{display:block;font:italic 600 14px "Segoe UI",Arial,sans-serif;color:#8a5a00}' +
    '.mq-say{position:absolute;right:3%;top:20%;line-height:1.2;background:#fff;border:4px solid #20140c;border-radius:14px;padding:8px 14px;text-align:center;box-shadow:4px 4px 0 #20140c}' +
    '.mq-say b{display:block;font:900 24px "Segoe UI",Arial,sans-serif;color:#8f1d12}.mq-say span{font:italic 600 13px "Segoe UI",Arial,sans-serif;color:#5f554a}' +
    '.mq-say:after{content:"";position:absolute;left:40%;bottom:-14px;border:10px solid transparent;border-top-color:#20140c;border-bottom:0}' +
    '.mq-award{position:absolute;left:0;right:0;bottom:7%;text-align:center;line-height:1.15;pointer-events:none}' +
    '.mq-award .k{display:inline-block;font:800 15px "Segoe UI",Arial,sans-serif;letter-spacing:2px;color:#20140c;background:#e9c46a;border:3px solid #20140c;padding:3px 12px}' +
    '.mq-award .n{display:block;margin-top:6px;font:900 clamp(26px,4.5vw,44px) Georgia,serif;color:#fff6d6;text-shadow:3px 3px 0 #20140c,-2px -2px 0 #20140c,2px -2px 0 #20140c,-2px 2px 0 #20140c}' +
    '.mq-award .e{display:block;font:italic 700 clamp(16px,2.6vw,24px) Georgia,serif;color:#ffe9a8;text-shadow:2px 2px 0 #20140c}' +
    '.mq-banner[hidden],.mq-title[hidden],.mq-say[hidden],.mq-award[hidden]{display:none}' +
    '.mq-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(18,12,8,.55);line-height:1.3;text-align:center;padding:12px}' +
    '.mq-title h3{margin:0;font:800 clamp(22px,4vw,40px) Georgia,serif;color:#fff6d6;text-shadow:3px 3px 0 #20140c;letter-spacing:1px}' +
    '.mq-title p{margin:0;color:#fff6d6;font:600 16px "Segoe UI",Arial,sans-serif;text-shadow:2px 2px 0 #20140c}' +
    '.mq-go{font:800 20px "Segoe UI",Arial,sans-serif;background:#b3261e;color:#fff;border:4px solid #20140c;box-shadow:4px 4px 0 #20140c;padding:10px 26px;cursor:pointer}' +
    '.mq-go:hover{background:#cf3a2f}.mq-go:focus-visible,.mq-btn:focus-visible,.mq-small:focus-visible{outline:3px solid #2b4c8c;outline-offset:3px}' +
    '.mq-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;background:#20140c;border:3px solid #5a3b1c;border-top:0;padding:10px}' +
    '.mq-btn{font:800 18px "Segoe UI",Arial,sans-serif;border:4px solid #0f0a06;box-shadow:4px 4px 0 #0f0a06;padding:10px 20px;cursor:pointer;min-width:220px}' +
    '.mq-btn.charge{background:#b3261e;color:#fff}.mq-btn.turn{background:#e9d9b0;color:#20140c}' +
    '.mq-btn:disabled{opacity:.45;cursor:default;box-shadow:2px 2px 0 #0f0a06}' +
    '.mq-small{font:600 13px "Segoe UI",Arial,sans-serif;background:#3a2716;color:#f3e2b3;border:2px solid #5a3b1c;padding:5px 10px;cursor:pointer}' +
    '.mq-keys{color:#cdb88a;font:12.5px "Segoe UI",Arial,sans-serif;width:100%;text-align:center}' +
    '.mq-fb{min-height:64px;margin:10px 0 0;padding:12px 16px;border:3px solid #20140c;background:#fbf3dc;font:16.5px/1.5 "Segoe UI",Arial,sans-serif;color:#1a2340}' +
    '.mq-fb b.sp{color:#8a1f14}.mq-fb .good{color:#1d5e20;font-weight:700}.mq-fb .bad{color:#8f1d12;font-weight:700}' +
    '.mq-sum ul{margin:6px 0 0;padding-left:20px}';

  // ======================= sound =======================
  var AC = null, MASTER = null, sfxOn = true, musicOn = true, music = null, voice = null;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); MASTER = AC.createDynamicsCompressor(); MASTER.connect(AC.destination); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume(); return AC;
  }
  function env(g, t, a, peak, d, rel) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + Math.max(a, d - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
  function osc(type, f, t, d, peak, dest, opts) {
    var a = ac(); if (!a) return; opts = opts || {};
    var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, t + d);
    if (opts.detune) o.detune.value = opts.detune;
    env(g, t, opts.attack || 0.01, peak, d, opts.release || d * 0.4); o.connect(g); g.connect(dest || MASTER); o.start(t); o.stop(t + d + 0.05);
  }
  function noiseBurst(t, d, peak, ftype, freq, dest) {
    var a = ac(); if (!a) return; var b = a.createBuffer(1, Math.ceil(a.sampleRate * d), a.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = ftype || 'lowpass'; f.frequency.value = freq || 800;
    env(g, t, 0.005, peak, d, d * 0.8); s.connect(f); f.connect(g); g.connect(dest || MASTER); s.start(t);
  }
  // brass: detuned saws through an opening low-pass (a trumpet)
  function brass(f, t, d, peak) {
    var a = ac(); if (!a) return; var lp = a.createBiquadFilter(), g = a.createGain();
    lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(3200, t + 0.06); lp.frequency.linearRampToValueAtTime(1800, t + d);
    env(g, t, 0.02, peak, d, 0.12); lp.connect(g); g.connect(MASTER);
    [-7, 0, 7].forEach(function (dt) { var o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + d + 0.05); });
  }
  function timpani(t, f) { osc('sine', f || 98, t, 0.6, 0.35, null, { glide: (f || 98) * 0.8, attack: 0.005 }); noiseBurst(t, 0.08, 0.15, 'lowpass', 400); }
  function cymbal(t) { noiseBurst(t, 1.2, 0.09, 'highpass', 6000); }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var SFX = {
    blip: function (t) { osc('square', 880, t, 0.06, 0.05); },
    gallop: function (t) { for (var i = 0; i < 7; i++) noiseBurst(t + i * 0.1, 0.05, 0.18, 'lowpass', 350 + (i % 2) * 150); },
    crash: function (t) { noiseBurst(t, 0.6, 0.35, 'lowpass', 1200); osc('square', 110, t, 0.4, 0.08, null, { glide: 55 }); timpani(t + 0.12, 73); },
    victory: function (t) { [67, 72, 76, 79].forEach(function (m, i) { brass(hz(m), t + i * 0.09, 0.14, 0.07); }); timpani(t, 98); },
    laugh: function (t) { [52, 50, 52, 50].forEach(function (m, i) { osc('sawtooth', hz(m), t + i * 0.13, 0.1, 0.05); }); },
    fanfare: function (t) {                    // trumpet call: triplet pick-up, held tonic, rising arpeggio, drum roll + cymbal
      var seq = [[67, 0, 0.12], [67, 0.13, 0.12], [67, 0.26, 0.12], [72, 0.4, 0.5], [67, 0.95, 0.16], [72, 1.12, 0.16], [76, 1.29, 0.16], [79, 1.46, 0.9]];
      seq.forEach(function (n) { brass(hz(n[0]), t + n[1], n[2], 0.085); brass(hz(n[0] - 12), t + n[1], n[2], 0.04); });
      for (var i = 0; i < 6; i++) timpani(t + 0.4 + i * 0.07, 98);
      timpani(t + 1.46, 98); timpani(t + 1.46, 73); cymbal(t + 1.46);
    },
    equip: function (t) { osc('triangle', 1568, t, 0.25, 0.08); osc('triangle', 2093, t + 0.07, 0.35, 0.07); },
    end: function (t) { [60, 64, 67, 72, 67, 72, 76, 79].forEach(function (m, i) { brass(hz(m), t + i * 0.13, i === 7 ? 1 : 0.16, 0.08); }); timpani(t, 98); cymbal(t + 0.91); }
  };
  function sfx(n) { var a = ac(); if (sfxOn && a && SFX[n]) SFX[n](a.currentTime + 0.01); }
  function playVoice(src) {
    if (!sfxOn || !src) return; try { if (voice) voice.pause(); voice = new Audio(src); voice.play().catch(function () {}); } catch (e) {}
  }

  // ---- music: Cantiga 100, "Santa María, strela do día" (Alfonso X, 13th century; public domain).
  // Pitches read from the Escorial musicians' codex [E] (MS b.I.2, ff. 110r-110v; facsimile pbm.com/~lindahl/cantigas/
  // facsimiles/E/217 + 218), every staff checked note by note; A. Casson's Cantigas de Santa Maria for Singers consulted
  // for doubtful readings (C clef on line 2 / F clef on the middle line). The manuscript does not fix the rhythm: the 6/8 rhythm (long notes = 2-3
  // eighths, short = 1) and the arrangement (shawm, voice a fifth below, drone, tabor, bells) are this course's own.
  // [midi, eighths]; D Dorian. Form: refrain - stanza (two paired lines, twice) - volta (= refrain tune) - refrain.
  var REFRAIN = [[69, 2], [67, 1], [65, 2], [64, 1], [64, 3],                         // San-ta Ma-rí-a,
                 [65, 2], [67, 1], [69, 3], [62, 3], [62, 3],                         // Stre-la do dí-a,
                 [69, 2], [67, 1], [65, 2], [64, 1], [62, 3],                         // mós-tra-nos ví-a
                 [64, 2], [65, 1], [64, 2], [62, 1], [60, 3], [62, 3], [62, 6]];      // pe-ra Déus e nos guí-a.
  var VERSE = [[67, 2], [69, 1], [71, 2], [71, 1], [72, 2], [71, 1], [69, 2], [71, 1], [67, 3], [67, 3],   // Ca ve-er fa-ze-los e-rra-dos
               [67, 2], [69, 1], [71, 2], [71, 1], [72, 2], [71, 1], [69, 2], [67, 1], [69, 3], [69, 3],   // que per-der fo-ran per pe-ca-dos
               [71, 2], [72, 1], [74, 2], [71, 1], [72, 2], [74, 1], [72, 3], [69, 2], [71, 1], [71, 3], [71, 6], // en-ten-der de que mui cul-pa-dos son;
               [71, 2], [71, 1], [71, 2], [72, 1], [71, 2], [69, 1], [71, 2], [67, 1], [67, 6]];  // mais per ti son per-dõ-a-dos
  var TUNE = REFRAIN.concat(VERSE, REFRAIN, REFRAIN);
  var EIGHTH = 60 / (68 * 3);               // dotted quarter = 68
  function startMusic() {
    var a = ac(); if (!a || music) return;
    var bus = a.createGain(); bus.gain.value = 0.9; bus.connect(MASTER);
    // drone (hurdy-gurdy): D3 + A3 + D4, slow swell
    var drone = a.createGain(); drone.gain.value = 0.0001; drone.gain.linearRampToValueAtTime(0.035, a.currentTime + 2); drone.connect(bus);
    var dlp = a.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 900; dlp.connect(drone);
    var drones = [50, 57, 62].map(function (m, i) { var o = a.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = hz(m); o.detune.value = (i - 1) * 4; o.connect(dlp); o.start(); return o; });
    var vib = a.createOscillator(), vibg = a.createGain(); vib.frequency.value = 5.2; vibg.gain.value = 14; vib.connect(vibg); vib.start();
    var state = { idx: 0, next: a.currentTime + 0.2, beat: 0 };
    function shawm(m, t, d, peak) {                      // reedy lead: two saws, band-pass, vibrato
      var bp = a.createBiquadFilter(), g = a.createGain(); bp.type = 'bandpass'; bp.frequency.value = hz(m) * 2.2; bp.Q.value = 0.9;
      env(g, t, 0.03, peak, d, Math.min(0.12, d * 0.4)); bp.connect(g); g.connect(bus);
      [-6, 6].forEach(function (dt) { var o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt; vibg.connect(o.detune); o.connect(bp); o.start(t); o.stop(t + d + 0.05); });
    }
    function tabor(t, accent) { noiseBurst(t, 0.12, accent ? 0.22 : 0.1, 'lowpass', accent ? 280 : 900, bus); if (accent) osc('sine', 110, t, 0.15, 0.12, bus, { glide: 70 }); }
    function bell(t, m) { osc('sine', hz(m), t, 1.4, 0.05, bus, { attack: 0.002 }); osc('sine', hz(m) * 2.76, t, 0.6, 0.02, bus, { attack: 0.002 }); }
    var timer = setInterval(function () {
      while (state.next < a.currentTime + 0.25) {
        var i = state.idx % TUNE.length, n = TUNE[i], t = state.next, d = n[1] * EIGHTH;
        var inRefrain = i < REFRAIN.length || i >= 2 * REFRAIN.length + VERSE.length;   // the volta is played by the lead alone
        shawm(n[0], t, d * 0.95, 0.07);
        if (inRefrain) shawm(n[0] - 7, t, d * 0.95, 0.035);   // second voice a fifth below
        var pos = state.beat % 6;
        for (var k = 0; k < n[1]; k++) { var p = (pos + k) % 6; if (p === 0) tabor(t + k * EIGHTH, true); else if (p === 3) tabor(t + k * EIGHTH, false); }
        if (i === 0 || i === REFRAIN.length || i === REFRAIN.length + VERSE.length || i === 2 * REFRAIN.length + VERSE.length) bell(t, 74);
        state.beat += n[1]; state.next += d; state.idx++;
      }
    }, 60);
    music = { stop: function () {
      clearInterval(timer); var now = a.currentTime;
      drone.gain.cancelScheduledValues(now); drone.gain.setValueAtTime(drone.gain.value, now); drone.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      bus.gain.setValueAtTime(bus.gain.value, now); bus.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      setTimeout(function () { drones.forEach(function (o) { try { o.stop(); } catch (e) {} }); try { vib.stop(); } catch (e) {} bus.disconnect(); }, 600);
    } };
  }
  function stopMusic() { if (music) { music.stop(); music = null; } }

  // ======================= drawing =======================
  // R draws on the 320x180 design grid at half-unit precision (= one device pixel of the 640x360 canvas).
  function snap(v) { return Math.round(v * 2) / 2; }
  var OUTLINE = false;   // when true, R draws a dark outline pass (each rect grown by half a unit)
  function R(c, x, y, w, h, col) {
    if (OUTLINE) { c.fillStyle = OUT; c.fillRect(snap(x) - 0.5, snap(y) - 0.5, snap(w) + 1, snap(h) + 1); return; }
    c.fillStyle = col; c.fillRect(snap(x), snap(y), snap(w), snap(h));
  }
  function line(c, x0, y0, x1, y1, col, th) {
    th = th || 1; var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2);
    for (var i = 0; i <= n; i++) { var t = n ? i / n : 0; R(c, x0 + (x1 - x0) * t - th / 2, y0 + (y1 - y0) * t - th / 2, th, th, col); }
  }
  function outlined(fn) { OUTLINE = true; fn(); OUTLINE = false; fn(); }

  function drawSky(c, t) {
    var top = [74, 150, 214], bot = [196, 228, 246];
    for (var i = 0; i < 28; i++) { var k = i / 27; R(c, 0, i * 2.5, W, 2.5, 'rgb(' + top.map(function (v, j) { return Math.round(v + (bot[j] - v) * k); }).join(',') + ')'); }
    for (var r = 14; r > 6; r -= 2) { c.fillStyle = 'rgba(255,230,140,' + (0.06 + (14 - r) * 0.03) + ')'; c.beginPath(); c.arc(276, 22, r, 0, 6.3); c.fill(); }
    R(c, 270, 16, 12, 12, '#ffdf6e'); R(c, 268, 18, 16, 8, '#ffdf6e'); R(c, 272, 14, 8, 16, '#ffdf6e'); R(c, 272, 17, 4, 3, '#fff4c0');
    [[40, 18, 1], [150, 10, 0.8], [220, 30, 1.2]].forEach(function (cl, k) {
      var x = ((cl[0] + t * (0.004 + k * 0.002)) % (W + 60)) - 30, s = cl[2];
      R(c, x, cl[1], 28 * s, 6, '#ffffff'); R(c, x + 6 * s, cl[1] - 4, 15 * s, 5, '#ffffff'); R(c, x + 14 * s, cl[1] - 2, 9 * s, 3, '#ffffff');
      R(c, x + 2, cl[1] + 5, 24 * s, 1.5, '#d9e9f5'); R(c, x + 4, cl[1] + 6.5, 18 * s, 1, '#c6dcee');
    });
  }
  function drawLand(c, t) {
    R(c, 0, 64, W, 10, '#9cae6a');
    for (var x = 0; x < W; x += 9) R(c, x, 62 + Math.round(Math.sin(x * 0.15) * 1.5), 6, 3, '#8fa35f');
    for (var x2 = 0; x2 < W; x2 += 3) R(c, x2, 72, 1.5, 0.5, '#7f9353');
    [[30, 54], [70, 56], [110, 55]].forEach(function (p, k) {   // distant windmills, sails turning slowly
      R(c, p[0], p[1], 4, 9, '#f2efe6'); R(c, p[0] + 3, p[1], 1, 9, '#d6d0c0'); R(c, p[0] - 1, p[1] - 2, 6, 2.5, '#4a3b2c');
      var a = t / 900 + k; for (var s = 0; s < 4; s++) { var aa = a + s * 1.5708; line(c, p[0] + 2, p[1] - 1, p[0] + 2 + Math.cos(aa) * 6, p[1] - 1 + Math.sin(aa) * 6, '#5a4a38', 0.5); }
    });
    R(c, 0, 74, W, H - 74, '#d7b35a');
    for (var y = 74; y < H; y += 2) { var shade = y < 110 ? '#cda852' : '#c79f48'; for (var x3 = ((y / 2) % 2) * 2; x3 < W; x3 += 4) R(c, x3, y, 1, 0.5, shade); }
    for (var y2 = 80; y2 < H; y2 += 7) R(c, 0, y2, W, 0.5, 'rgba(160,120,40,.35)');
    for (var yy = 112; yy < H; yy += 1) {   // the road, with darker edges and wheel ruts
      var w = 30 + (yy - 112) * 1.6, cx = 230 - (yy - 112) * 1.9;
      R(c, cx - w / 2, yy, w, 1, '#ead6a2'); R(c, cx - w / 2, yy, 1, 1, '#c9b07a'); R(c, cx + w / 2 - 1, yy, 1, 1, '#c9b07a');
      if (yy % 3 === 0) { R(c, cx - w * 0.22, yy, 0.5, 1, '#d8c08a'); R(c, cx + w * 0.22, yy, 0.5, 1, '#d8c08a'); }
    }
    [[18, 98], [130, 92], [300, 150], [176, 160], [60, 120], [290, 100]].forEach(function (b) {
      R(c, b[0], b[1], 9, 4, '#6f8540'); R(c, b[0] + 1, b[1] - 2, 6, 2, '#86a04f'); R(c, b[0] + 2, b[1] - 3, 2, 1, '#9bb563'); R(c, b[0], b[1] + 4, 9, 0.5, 'rgba(60,40,10,.35)');
    });
  }

  function drawWindmill(c, cx, by, ang, mode) {
    var dark = mode === 'mystery';
    var wall = dark ? '#2a2233' : '#f3f0e7', shade = dark ? '#1f1927' : '#d8d1c1', edge = dark ? '#120e18' : '#3b3328';
    var top = by - 44;
    c.fillStyle = 'rgba(70,50,20,.25)'; c.fillRect(cx - 14, by - 1, 34, 3);
    for (var y = top; y < by; y += 0.5) {
      var k = (y - top) / 44, w = 18 + k * 8;
      R(c, cx - w / 2, y, w, 0.5, wall); R(c, cx + w / 2 - 3.5, y, 3.5, 0.5, shade); R(c, cx - w / 2 - 0.5, y, 0.5, 0.5, edge); R(c, cx + w / 2, y, 0.5, 0.5, edge);
      if (!dark && Math.round(y * 2) % 13 === 0) R(c, cx - w / 2 + 2, y, w - 6, 0.5, '#e4ded0');
    }
    for (var j = 0; j < 12; j += 0.5) { var rw = 4 + j * 1.8; R(c, cx - rw / 2, top - 12 + j, rw, 0.5, dark ? '#0f0b14' : (j % 2 < 1 ? '#4a3b2c' : '#54432f')); }
    R(c, cx - 12.5, top - 0.5, 25, 1.5, dark ? '#0f0b14' : '#3b3328');
    if (!dark) {
      R(c, cx - 3.5, by - 11, 7, 11, '#3b3328'); R(c, cx - 3, by - 10.5, 6, 10.5, '#6b4f36'); R(c, cx - 0.25, by - 10.5, 0.5, 10.5, '#4a3626'); R(c, cx + 1.5, by - 5.5, 1, 1, '#d9b45a');
      [[top + 12, 4, 5], [top + 24, 3, 4]].forEach(function (wnd) { R(c, cx - wnd[1] / 2 - 0.5, wnd[0] - 0.5, wnd[1] + 1, wnd[2] + 1, '#8a7a62'); R(c, cx - wnd[1] / 2, wnd[0], wnd[1], wnd[2], '#2b241c'); R(c, cx - 0.25, wnd[0], 0.5, wnd[2], '#8a7a62'); });
    } else {
      R(c, cx - 7, top + 7, 5, 2.5, '#ff4b3e'); R(c, cx + 2, top + 7, 5, 2.5, '#ff4b3e'); R(c, cx - 6, top + 7.5, 1.5, 1, '#ffd2a0'); R(c, cx + 3, top + 7.5, 1.5, 1, '#ffd2a0');
      R(c, cx - 5, top + 15, 10, 1, '#120e18'); R(c, cx - 4, top + 16, 1, 1, '#120e18'); R(c, cx + 3, top + 16, 1, 1, '#120e18');
    }
    var hx = cx, hy = top + 2;
    for (var s = 0; s < 4; s++) {
      var a = ang + s * Math.PI / 2, px = -Math.sin(a), py = Math.cos(a);
      line(c, hx, hy, hx + Math.cos(a) * 39, hy + Math.sin(a) * 39, dark ? '#0f0b14' : '#4a3626', 1.5);
      for (var d = 8; d <= 38; d += 0.5) {
        var bx = hx + Math.cos(a) * d, byy = hy + Math.sin(a) * d;
        for (var o = 1.5; o <= 6.5; o += 0.5) {
          var lattice = (d % 4 === 0) || o >= 6.5 || o <= 1.5;
          R(c, bx + px * o, byy + py * o, 0.5, 0.5, dark ? (lattice ? '#120e18' : '#3a2f47') : (lattice ? '#7a5a38' : '#f1e6c8'));
        }
      }
    }
    R(c, hx - 2.5, hy - 2.5, 5, 5, dark ? '#0f0b14' : '#3b3328'); R(c, hx - 1, hy - 1, 2, 2, dark ? '#3a2f47' : '#8a7a62');
  }

  function drawGiant(c, cx, by, tilt) {
    c.save(); c.translate(cx, by); c.rotate(tilt || 0); c.translate(-cx, -by);
    var skin = '#c98e62', skd = '#a87048', tunic = '#7a5c3a', tud = '#5f472b', dk = '#3b2a1c';
    outlined(function () {
      R(c, cx - 9, by - 17, 6, 17, dk); R(c, cx + 3, by - 17, 6, 17, dk); R(c, cx - 10, by - 2, 8, 2, '#2a1d12'); R(c, cx + 2, by - 2, 8, 2, '#2a1d12');
      R(c, cx - 13, by - 41, 26, 26, tunic); R(c, cx + 7, by - 41, 6, 26, tud); R(c, cx - 13, by - 23, 26, 3, '#4a3520'); R(c, cx - 2, by - 23, 4, 3, '#d9b45a');
      R(c, cx - 19, by - 39, 6, 21, skin); R(c, cx + 13, by - 39, 6, 21, skin); R(c, cx + 16, by - 39, 3, 21, skd);
      R(c, cx - 7, by - 55, 14, 15, skin); R(c, cx + 4, by - 55, 3, 15, skd); R(c, cx - 7.5, by - 45, 15, 7, '#5a3d24'); R(c, cx - 8, by - 58, 16, 4, '#5a3d24');
      R(c, cx + 16, by - 54, 4, 19, '#6e4a2a'); R(c, cx + 14, by - 58, 8, 6, '#6e4a2a');
    });
    R(c, cx - 5, by - 51, 3, 2, '#1a1a1a'); R(c, cx + 2, by - 51, 3, 2, '#1a1a1a'); R(c, cx - 4.5, by - 51, 1, 1, '#fff'); R(c, cx + 2.5, by - 51, 1, 1, '#fff');
    R(c, cx - 3, by - 44, 6, 1, '#3a2414'); R(c, cx - 6, by - 53, 4, 0.5, '#3a2414'); R(c, cx + 2, by - 53, 4, 0.5, '#3a2414');
    [[-11, -38], [-9, -33], [-11, -28], [10, -36], [8, -31]].forEach(function (p) { R(c, cx + p[0], by + p[1], 1.5, 0.5, tud); });
    c.restore();
  }

  function drawSancho(c, x0, y0, t) {
    c.save(); c.translate(x0, y0); c.scale(1.5, 1.5);
    var bob = Math.floor(t / 300) % 2 * 0.5;
    outlined(function () {
      R(c, -9, -9, 16, 6, '#8d8d8d'); R(c, 5, -13, 4, 6, '#8d8d8d'); R(c, 7, -16.5, 1.5, 4, '#6f6f6f'); R(c, 8.5, -16, 1.5, 3.5, '#6f6f6f'); R(c, 8, -10, 3, 3, '#9c9c9c');
      [-8, -4, 2, 5].forEach(function (lx) { R(c, lx, -3, 2, 3, '#6f6f6f'); }); R(c, -11, -8, 2, 5, '#6f6f6f');
      R(c, -4, -18 - bob, 8, 9, '#9c6b3c'); R(c, -3, -23 - bob, 6, 5, '#e2b48c'); R(c, -5.5, -25 - bob, 11, 2, '#d9b45a'); R(c, -3, -27 - bob, 6, 2, '#d9b45a');
    });
    R(c, -9, -6, 16, 1, '#7a7a7a'); R(c, 9.5, -9, 1, 1, '#222'); R(c, 1, -21.5 - bob, 1, 1, '#222'); R(c, -1, -19.5 - bob, 3, 0.5, '#9a5a3a'); R(c, -4, -12 - bob, 8, 1, '#6e4a2a');
    c.restore();
  }

  function quijoteBody(c, st, A, f) {
    var horse = '#a8937b', hdk = '#7a6852', hlt = '#c2ae95', mane = '#3a2f25';
    R(c, -13, -17, 21, 7, horse); R(c, -12, -17, 19, 1.5, hlt); R(c, -13, -11, 21, 1, hdk); R(c, -10, -16, 1, 5, hdk); R(c, -7, -16, 1, 5, hdk);   // ribs: a thin old horse
    var legs = st.gallop ? (f ? [[-12, -1.5], [-8, 1], [2, -1], [6, 1.5]] : [[-12, 1], [-8, -1.5], [2, 1.5], [6, -1]]) : [[-12, 0], [-8, 0], [2, 0], [6, 0]];
    legs.forEach(function (l) { R(c, l[0] + l[1] * 0.5, -10, 2, 9, hdk); R(c, l[0] + l[1], -2, 2.5, 2, '#2a2219'); });
    R(c, 6, -22, 4, 8, horse); R(c, 8, -25, 8, 5, horse); R(c, 13, -21, 3, 1.5, hdk); R(c, 9, -27.5, 1.5, 2.5, hdk); R(c, 11, -27, 1.5, 2, hdk);
    R(c, 5, -23, 2, 8, mane); R(c, 7, -25, 2, 2, mane); R(c, -16, -17, 3, 9, mane); R(c, -16.5, -9, 2, 2, mane);
    R(c, -6, -18, 9, 2, '#6b2a1e'); R(c, -4, -16, 1.5, 4, '#b08a3a');   // saddle + stirrup
    R(c, -4, -15, 3, 6, A.gaunt ? METAL.gaunt : '#3a2a1a');
    R(c, -5, -27, 7, 12, A.breast ? METAL.breast : '#6b5b3e');
    R(c, 1, -25, 4, 2, A.breast ? METAL.breast : '#6b5b3e');
    R(c, 4, -25, 2, 3, A.gaunt ? METAL.gaunt : '#e2b48c');
    R(c, -3, -32, 5, 5, '#e2b48c'); R(c, -3, -29, 5, 3, '#dcdcdc');
    if (A.helmet) { R(c, -4, -35.5, 7, 4.5, METAL.helmet); R(c, -2.5, -40, 2, 5, '#b3261e'); R(c, -1.5, -42, 2, 2.5, '#d13b2f'); }
    else R(c, -4, -34, 6, 2, '#cfcfcf');
    if (A.lance) line(c, 5, -24, 31, -29, METAL.lance, 1); else line(c, 5, -24, 18, -27, '#8a6a45', 1);
    if (A.shield) R(c, -10, -26, 6, 9, METAL.shield);
    if (A.sword) { R(c, -6.5, -15, 1.5, 7, METAL.sword); R(c, -8, -16, 4.5, 1, '#f2c14e'); }
  }
  function drawQuijote(c, x, y, t, st) {
    c.save(); c.translate(x, y); if (st.rot) c.rotate(st.rot); c.scale(st.face * 1.5, 1.5);
    var f = st.gallop ? Math.floor(t / 90) % 2 : Math.floor(t / 400) % 2, A = st.armor;
    outlined(function () { quijoteBody(c, st, A, f); });
    R(c, 11, -24, 1, 1, '#111'); R(c, 0, -31, 1, 1, '#111'); R(c, -2, -27.5, 3, 0.5, '#bdbdbd');
    if (A.breast) { R(c, -5, -27, 1, 12, '#ffffff'); R(c, -2, -25, 0.5, 8, '#8e979f'); R(c, -5, -20, 7, 0.5, '#8e979f'); }
    if (A.helmet) { R(c, -4, -35.5, 7, 1, '#ffffff'); R(c, -1, -33, 4, 0.5, '#5a646d'); }
    if (A.shield) { R(c, -10, -26, 6, 1, '#ffffff'); R(c, -7.5, -25, 1, 7, '#b3261e'); R(c, -9.5, -22.5, 5, 1, '#b3261e'); }
    if (A.lance) { R(c, 29, -30, 3.5, 2, '#ffffff'); R(c, 7, -25, 2, 1.5, '#6b4a2a'); }
    if (A.sword) R(c, -7, -17, 1.5, 1, '#f2c14e');
    if (A.gaunt) { R(c, 4, -25, 2, 0.5, '#ffffff'); R(c, -4, -15, 3, 0.5, '#ffffff'); }
    if (st.newest) {
      var g = Math.floor(t / 110) % 7, gp = { helmet: [-1, -36], breast: [-3, -22], shield: [-7, -21], gaunt: [5, -24], lance: [27, -29], sword: [-6, -12] }[st.newest];
      if (gp && g < 4) { R(c, gp[0], gp[1] - g, 1, 1, '#fff'); R(c, gp[0] - 1.5 + g, gp[1], 1, 1, '#fff'); R(c, gp[0] - 0.5, gp[1] - 0.5, 0.5, 0.5, '#fffbe0'); }
    }
    c.restore();
  }

  // large armour icons for the award ceremony (about 24x24 units, centred on 0,0)
  function drawPiece(c, key, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    var m = METAL[key], hi = '#ffffff', lo = '#7d8790';
    outlined(function () {
      if (key === 'helmet') { R(c, -2, -15, 4, 6, '#b3261e'); R(c, -1, -18, 5, 4, '#d13b2f'); R(c, -4, -10, 8, 2, m); R(c, -6, -8, 12, 2, m); R(c, -8, -6, 16, 12, m); R(c, -10, 4, 20, 3, m); }
      if (key === 'breast') { R(c, -9, -10, 18, 20, m); R(c, -11, -10, 4, 6, m); R(c, 7, -10, 4, 6, m); }
      if (key === 'shield') { R(c, -9, -11, 18, 15, m); R(c, -7, 4, 14, 4, m); R(c, -4, 8, 8, 3, m); }
      if (key === 'gaunt') { R(c, -11, -6, 8, 12, m); R(c, 3, -6, 8, 12, m); R(c, -12, -8, 10, 3, m); R(c, 2, -8, 10, 3, m); }
      if (key === 'lance') { line(c, -12, 10, 11, -10, m, 2.5); R(c, 9, -13, 4, 4, m); R(c, -6, 3, 4, 3, '#6b4a2a'); }
      if (key === 'sword') { R(c, -1.5, -13, 3, 18, m); R(c, -7, 4, 14, 2.5, '#f2c14e'); R(c, -1.5, 6, 3, 5, '#6b4a2a'); R(c, -2.5, 11, 5, 3, '#f2c14e'); }
    });
    if (key === 'helmet') { R(c, -3, -10, 4, 1, hi); R(c, -5, -8, 3, 1, hi); R(c, -8, -6, 2, 10, hi); R(c, -6, 0, 12, 1, '#3b434a'); R(c, -6, 2, 12, 0.5, '#3b434a'); }
    if (key === 'breast') { R(c, -9, -10, 2, 20, hi); R(c, -0.5, -8, 1, 16, lo); R(c, -7, 2, 14, 1, lo); }
    if (key === 'shield') { R(c, -9, -11, 18, 1.5, hi); R(c, -1.5, -10, 3, 18, '#b3261e'); R(c, -8, -5, 16, 3, '#b3261e'); }
    if (key === 'gaunt') { R(c, -11, -6, 2, 12, hi); R(c, 3, -6, 2, 12, hi); [-2, 1, 4].forEach(function (yy) { R(c, -10, yy, 6, 0.5, lo); R(c, 4, yy, 6, 0.5, lo); }); }
    if (key === 'lance') { line(c, -11, 9, 10, -9, hi, 0.75); R(c, 10, -12, 2, 1, hi); }
    if (key === 'sword') { R(c, -1.5, -13, 1, 17, hi); R(c, -7, 4, 14, 0.75, '#fff2b0'); }
    c.restore();
  }
  function rays(c, cx, cy, t, alpha) {
    c.save(); c.translate(cx, cy); c.rotate(t / 1400);
    for (var i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.fillStyle = i % 2 ? 'rgba(255,214,102,' + alpha * 0.55 + ')' : 'rgba(255,246,214,' + alpha * 0.35 + ')'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -150); c.lineTo(7, -150); c.closePath(); c.fill(); }
    c.restore();
  }
  function sparkles(c, cx, cy, t, alpha) {
    for (var i = 0; i < 10; i++) { var a = i * 0.628 + t / 900, r = 34 + 6 * Math.sin(t / 160 + i); if ((Math.floor(t / 120) + i) % 3) { c.globalAlpha = alpha; R(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 1.5, 1.5, '#fff6d6'); c.globalAlpha = 1; } }
  }
  function stars(c, x, y, t) { for (var i = 0; i < 4; i++) { var a = t / 200 + i * 1.57; R(c, x + Math.cos(a) * 9, y + Math.sin(a) * 2.5, 2, 2, '#ffe066'); R(c, x + Math.cos(a) * 9 + 0.5, y + Math.sin(a) * 2.5 + 0.5, 1, 1, '#fff'); } }
  function dust(c, x, y, k) { for (var i = 0; i < 6; i++) R(c, x - 10 + i * 4 + k, y - (i % 2) * 2 - k / 3, 3.5, 2, 'rgba(240,226,190,.75)'); }

  // ======================= the game =======================
  function Game(root, cfg) {
    var self = this; this.cfg = cfg; this.root = root;
    root.classList.add('mq');
    root.innerHTML =
      '<div class="mq-hud"><div class="mq-slots" aria-label="Armour earned"></div><div class="mq-count"></div>' +
      '<div><button type="button" class="mq-small" data-k="music">&#9835; Music: on</button> <button type="button" class="mq-small" data-k="sfx">&#128266; Sound: on</button></div></div>' +
      '<div class="mq-stage"><canvas class="mq-cv" width="' + W * SCALE + '" height="' + H * SCALE + '" role="img" aria-label="Don Quijote on Rocinante and Sancho Panza on the plain of La Mancha, facing a windmill"></canvas>' +
      '<div class="mq-banner" hidden><span class="who"></span><span class="form" lang="es"></span><span class="inf"></span></div>' +
      '<div class="mq-say" hidden><b lang="es"></b><span></span></div>' +
      '<div class="mq-award" hidden aria-live="polite"><span class="k">&iexcl;NUEVA PIEZA! &middot; NEW PIECE</span><span class="n"></span><span class="e" lang="es"></span></div>' +
      '<div class="mq-title"><h3>Los molinos de viento</h3><p>Giant or windmill? Read the banner before you charge.</p><button type="button" class="mq-go">&#9654; Start &middot; Empezar</button></div></div>' +
      '<div class="mq-bar"><button type="button" class="mq-btn turn" disabled>&#8617; Turn away</button><button type="button" class="mq-btn charge" disabled>&#9876; &iexcl;Al ataque! &middot; Charge</button>' +
      '<div class="mq-keys">Keys: &larr; turn away &middot; &rarr; or Space charge</div></div>' +
      '<div class="mq-fb" role="status" aria-live="polite">Press <strong>Start</strong>. Sancho will warn you: <b class="sp">&iquest;Gigante o molino?</b> (Giant or windmill?)</div>';
    this.cv = root.querySelector('canvas'); this.c = this.cv.getContext('2d'); this.c.imageSmoothingEnabled = false;
    this.banner = root.querySelector('.mq-banner'); this.say = root.querySelector('.mq-say'); this.award = root.querySelector('.mq-award');
    this.fb = root.querySelector('.mq-fb'); this.title = root.querySelector('.mq-title');
    this.bTurn = root.querySelector('.mq-btn.turn'); this.bCharge = root.querySelector('.mq-btn.charge');
    this.slots = root.querySelector('.mq-slots'); this.count = root.querySelector('.mq-count');
    ARMOR.forEach(function (a) { var s = document.createElement('span'); s.className = 'mq-slot'; s.textContent = a.en; s.title = a.en + ' · ' + a.es; self.slots.appendChild(s); });
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.giantClip = (cfg.audioBase || '../../audio/') + (cfg.giantClip || 'game/molinos-he-perdido.mp3');
    root.querySelector('.mq-go').addEventListener('click', function () { self.start(); });
    this.bTurn.addEventListener('click', function () { self.choose('turn'); });
    this.bCharge.addEventListener('click', function () { self.choose('charge'); });
    root.querySelector('[data-k="music"]').addEventListener('click', function (e) { musicOn = !musicOn; e.currentTarget.innerHTML = '&#9835; Music: ' + (musicOn ? 'on' : 'off'); if (musicOn) startMusic(); else stopMusic(); });
    root.querySelector('[data-k="sfx"]').addEventListener('click', function (e) { sfxOn = !sfxOn; e.currentTarget.innerHTML = (sfxOn ? '&#128266; Sound: on' : '&#128263; Sound: off'); if (!sfxOn && voice) voice.pause(); });
    root.addEventListener('keydown', function (e) {
      if (self.state !== 'ask') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); self.choose('turn'); }
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); self.choose('charge'); }
    });
    root.tabIndex = -1;
    this.reset(); this.visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (!self.visible) stopMusic(); else if (musicOn && self.started) startMusic(); }).observe(root);
    var loop = function (ts) { if (self.visible) self.draw(ts); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  Game.prototype.reset = function () {
    var items = this.cfg.items.map(function (it, i) { return Object.assign({ id: i }, it); });
    for (var i = items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = items[i]; items[i] = items[j]; items[j] = t; }
    var firstWrong = items.findIndex(function (x) { return !x.ok; }); if (firstWrong > 0) items.unshift(items.splice(firstWrong, 1)[0]);
    for (var k = 2; k < items.length; k++) if (items[k].ok === items[k - 1].ok && items[k].ok === items[k - 2].ok) { var m = items.findIndex(function (x, n) { return n > k && x.ok !== items[k].ok; }); if (m > 0) { var tmp = items[k]; items[k] = items[m]; items[m] = tmp; } }
    this.queue = items; this.armor = {}; this.newest = null; this.nArmor = 0; this.firstTry = 0; this.missed = []; this.seenIds = {};
    this.state = 'title'; this.qx = 80; this.qy = 158; this.face = 1; this.rot = 0; this.anim = null; this.mode = 'mystery'; this.tilt = 0; this.awardFx = null; this.dazed = 0; this.flash = 0;
    this.say.hidden = true; this.award.hidden = true; this.renderSlots(); this.count.textContent = '';
  };
  Game.prototype.renderSlots = function () { var self = this; [].forEach.call(this.slots.children, function (s, i) { s.className = 'mq-slot' + (self.armor[ARMOR[i].key] ? ' on' : ''); }); };
  Game.prototype.start = function () { ac(); sfx('blip'); this.started = true; if (musicOn) startMusic(); this.title.hidden = true; this.next(); try { this.root.focus({ preventScroll: true }); } catch (e) {} };
  Game.prototype.next = function () {
    if (!this.queue.length) return this.finish();
    this.cur = this.queue.shift(); this.mode = 'mystery'; this.tilt = 0; this.state = 'ask'; this.qx = 80; this.qy = 158; this.face = 1; this.rot = 0; this.say.hidden = true;
    var b = this.banner; b.hidden = false; b.querySelector('.who').textContent = this.cur.who; b.querySelector('.form').textContent = this.cur.form; b.querySelector('.inf').textContent = '(' + this.cur.inf + ')';
    this.bTurn.disabled = this.bCharge.disabled = false;
    this.count.textContent = 'Shapes left on the plain: ' + (this.queue.length + 1);
    this.fb.innerHTML = '<b class="sp">Sancho:</b> &iquest;Gigante o molino? Look closely, se&ntilde;or! Is <strong lang="es">' + this.cur.who + ' ' + this.cur.form + '</strong> the right form of <em lang="es">' + this.cur.inf + '</em>?';
  };
  Game.prototype.showSay = function (es, en) { this.say.querySelector('b').textContent = es; this.say.querySelector('span').textContent = en; this.say.hidden = false; };
  Game.prototype.choose = function (act) {
    if (this.state !== 'ask') return;
    var it = this.cur, self = this, first = !this.seenIds[it.id]; this.seenIds[it.id] = 1;
    this.bTurn.disabled = this.bCharge.disabled = true; this.state = 'anim'; sfx('blip');
    var right = (act === 'turn' && !it.ok) || (act === 'charge' && it.ok);
    if (right && first) this.firstTry++;
    if (!right) { this.missed.push(it); this.queue.splice(Math.min(2, this.queue.length), 0, Object.assign({}, it)); }
    var full = '<strong lang="es">' + it.who + ' ' + it.form + '</strong>', Rm = this.reduced;
    if (act === 'charge') {
      sfx('gallop');
      this.animate(Rm ? 200 : 750, function (k) { self.qx = 80 + 110 * k; self.gallop = true; }, function () {
        self.gallop = false;
        if (!it.ok) {
          self.mode = 'mill'; sfx('crash'); self.flash = 1; self.banner.hidden = true;
          self.fb.innerHTML = '<span class="bad">&iexcl;Ay! It was only a windmill.</span> ' + full + ' is wrong: the right form is <strong lang="es">' + it.who + ' ' + it.fix + '</strong>. ' + it.why + ' <em>It will come back for a second look.</em>';
          self.animate(Rm ? 200 : 950, function (k) { self.qx = 190 - 110 * k; self.qy = 158 - Math.sin(k * Math.PI) * 36; self.rot = Rm ? 0 : -k * Math.PI * 2; }, function () {
            self.qy = 158; self.rot = 0; self.dazed = 1;
            self.animate(900, null, function () { self.dazed = 0; self.after(); });
          });
        } else {
          self.mode = 'giant'; self.banner.hidden = true; sfx('victory'); playVoice(self.giantClip);
          self.showSay('¡Nooooo! ¡He perdido!', '(“Nooo! I have lost!”)');
          self.fb.innerHTML = '<span class="good">&iexcl;Victoria!</span> ' + full + ' is right, so this was a real giant, and down it goes. ' + it.why;
          self.animate(Rm ? 200 : 1400, function (k) { self.tilt = Math.min(1, k * 1.25) * 1.4; }, function () {
            self.animate(900, null, function () {
              self.say.hidden = true; self.face = -1;
              self.animate(500, function (k) { self.qx = 190 - 110 * k; self.gallop = true; }, function () { self.gallop = false; self.face = 1; self.after(); });
            });
          });
        }
      });
    } else {
      this.face = -1;
      this.animate(Rm ? 200 : 600, function (k) { self.qx = 80 - 45 * k; self.gallop = true; }, function () {
        self.gallop = false;
        if (!it.ok) {
          self.mode = 'mill'; self.banner.hidden = true;
          var piece = self.nArmor < ARMOR.length ? ARMOR[self.nArmor] : null;
          var text = '<span class="good">Wise!</span> Sancho was right: only a windmill. ' + full + ' is wrong; the right form is <strong lang="es">' + it.who + ' ' + it.fix + '</strong>. ' + it.why;
          self.fb.innerHTML = text;
          if (piece) {
            self.face = 1;   // he turns to receive the prize
            self.ceremony(piece, function () {
              self.fb.innerHTML = text + '<br>Don Quijote puts on a shinier piece of armour: <strong>' + piece.en + '</strong> <span lang="es">(' + piece.es + ')</span>.';
              self.ride_back();
            });
          } else { sfx('victory'); self.fb.innerHTML = text + ' His armour is already complete, so it gets a new shine.'; self.ride_back(); }
        } else {
          self.mode = 'giant'; self.banner.hidden = true; sfx('laugh'); self.showSay('¡Ja, ja, ja!', '(“Ha, ha, ha!”)');
          self.fb.innerHTML = '<span class="bad">The giant laughs.</span> ' + full + ' was right, so this was a real giant worth charging. ' + it.why + ' <em>It will come back.</em>';
          self.animate(1300, null, function () { self.say.hidden = true; self.ride_back(); });
        }
      });
    }
  };
  // Award ceremony: the piece appears large in the centre with rays and a trumpet fanfare, then flies onto Don Quijote.
  Game.prototype.ceremony = function (piece, done) {
    var self = this, Rm = this.reduced; this.state = 'award';
    this.award.querySelector('.n').textContent = piece.en; this.award.querySelector('.e').textContent = piece.es; this.award.hidden = false;
    sfx('fanfare');
    var fx = this.awardFx = { key: piece.key, x: W / 2, y: 74, s: 0, alpha: 1 };
    this.animate(Rm ? 150 : 450, function (k) { var e = 1 - Math.pow(1 - k, 3); fx.s = 3.2 * e + Math.sin(k * Math.PI) * 0.5; }, function () {
      self.animate(Rm ? 900 : 1900, function () { fx.s = 3.2; }, function () {
        self.award.hidden = true;
        var off = { helmet: [-1, -36], breast: [-2, -21], shield: [-7, -21], gaunt: [5, -24], lance: [22, -27], sword: [-6, -12] }[piece.key];
        var tx = self.qx + off[0] * 1.5 * self.face, ty = self.qy + off[1] * 1.5;
        self.animate(Rm ? 150 : 650, function (k) {
          var e = k * k; fx.x = W / 2 + (tx - W / 2) * e; fx.y = 74 + (ty - 74) * e - Math.sin(k * Math.PI) * 20; fx.s = 3.2 - 2.6 * e; fx.alpha = 1 - k;
        }, function () {
          self.awardFx = null; self.armor[piece.key] = true; self.newest = piece.key; self.nArmor++; self.renderSlots(); sfx('equip'); self.flash = 0.6;
          done();
        });
      });
    });
  };
  Game.prototype.ride_back = function () {
    var self = this;
    this.animate(600, null, function () { self.face = 1; self.animate(500, function (k) { self.qx = 35 + 45 * k; self.gallop = true; }, function () { self.gallop = false; self.after(); }); });
  };
  Game.prototype.after = function () {
    var self = this; this.state = 'pause';
    var cont = document.createElement('button'); cont.type = 'button'; cont.className = 'mq-small'; cont.style.marginTop = '8px'; cont.style.display = 'block';
    cont.textContent = this.queue.length ? 'Next shape →' : 'See my armour →';
    this.fb.appendChild(cont); try { cont.focus({ preventScroll: true }); } catch (e) {}
    cont.addEventListener('click', function () { sfx('blip'); self.next(); try { self.root.focus({ preventScroll: true }); } catch (e) {} });
  };
  Game.prototype.animate = function (dur, step, done) { this.anim = { t0: performance.now(), dur: dur, step: step, done: done }; };
  Game.prototype.finish = function () {
    var self = this; this.state = 'end'; this.banner.hidden = true; this.mode = 'none'; sfx('end'); this.count.textContent = 'The plain is clear!';
    var seen = {}, miss = this.missed.filter(function (m) { if (seen[m.form]) return false; seen[m.form] = 1; return true; });
    this.fb.innerHTML = '<div class="mq-sum"><span class="good">&iexcl;Armadura completa!</span> Don Quijote rides on in full, shining armour.' +
      '<div>Right on the first try: <strong>' + this.firstTry + ' of ' + this.cfg.items.length + '</strong>.</div>' +
      (miss.length ? '<div>Worth another look:</div><ul>' + miss.map(function (m) { return '<li><span lang="es">' + m.who + ' <strong>' + m.form + '</strong></span> &rarr; ' + (m.ok ? 'was already right' : '<span lang="es">' + m.who + ' <strong>' + m.fix + '</strong></span>') + '</li>'; }).join('') + '</ul>' : '<div>No mistakes: a true knight of the verbs.</div>') +
      '<button type="button" class="mq-small" style="margin-top:8px">&#8635; Play again</button></div>';
    this.fb.querySelector('button').addEventListener('click', function () { self.reset(); self.title.hidden = true; self.next(); });
    this.newest = 'sword';
  };
  Game.prototype.draw = function (ts) {
    var c = this.c, t = ts || 0;
    if (this.anim) { var a = this.anim, k = Math.min(1, (t - a.t0) / a.dur); if (a.step) a.step(k); if (k >= 1 && this.anim === a) { this.anim = null; if (a.done) a.done(); } }
    c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawSky(c, t); drawLand(c, t);
    var ang = t / (this.mode === 'mill' ? 500 : 1400);
    if (this.mode === 'mystery') drawWindmill(c, 245 + (this.reduced ? 0 : Math.round(Math.sin(t / 260) * 2) / 2), 128, ang, 'mystery');
    else if (this.mode === 'mill') drawWindmill(c, 245, 128, ang, 'mill');
    else if (this.mode === 'giant') { drawGiant(c, 245, 128, this.tilt); if (this.tilt > 1.2) stars(c, 290, 120, t); }
    drawSancho(c, Math.max(18, this.qx - 46), 156, t);
    drawQuijote(c, this.qx, this.qy, t, { face: this.face, gallop: !!this.gallop, armor: this.armor, newest: this.newest, rot: this.rot });
    if (this.gallop) dust(c, this.qx - 20 * this.face, 159, (t / 60) % 4);
    if (this.dazed) stars(c, this.qx - 1, this.qy - 58, t);
    if (this.awardFx) {
      var f = this.awardFx;
      c.fillStyle = 'rgba(20,12,4,' + (0.5 * f.alpha) + ')'; c.fillRect(0, 0, W, H);
      rays(c, f.x, f.y, t, f.alpha); sparkles(c, f.x, f.y, t, f.alpha);
      c.globalAlpha = Math.max(0.3, f.alpha); drawPiece(c, f.key, f.x, f.y, Math.max(0.6, f.s)); c.globalAlpha = 1;
    }
    if (this.flash) { c.fillStyle = 'rgba(255,255,255,' + (this.flash * 0.5) + ')'; c.fillRect(0, 0, W, H); this.flash = Math.max(0, this.flash - 0.08); }
    if (this.state === 'end') { for (var i = 0; i < 8; i++) { var aa = t / 300 + i * 0.8; R(c, this.qx + Math.cos(aa) * 26, 120 + Math.sin(aa) * 12, 2, 2, '#ffe066'); } }
  };

  function init() {
    var nodes = document.querySelectorAll('.molinos[data-molinos]'); if (!nodes.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    [].forEach.call(nodes, function (n) { try { new Game(n, JSON.parse(n.getAttribute('data-molinos'))); } catch (e) { n.textContent = 'The game could not start.'; if (window.console) console.error(e); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

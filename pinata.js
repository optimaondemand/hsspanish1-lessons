/* pinata.js — "¡Rompe la piñata!" vocabulary warm-up for Optima lesson pages (SAMPLE, 2026-10-16).
 * Hit the piñata three times, candies fall out wrapped in Spanish words, match each to its English meaning.
 * Round 1 = practice (no clock); then "contra el reloj" (60 s). Success -> confetti. Ungraded.
 * Words come from <div class="pinata-game" data-words='[{"es","en","audio"}]'> — only words taught BEFORE this lesson.
 * Tap-to-match (tap candy, then basket) works everywhere; drag also works with a mouse or finger. Keyboard: Tab + Enter.
 * Reports {name, done, timed, seconds} to my-work.js through a "mw-game" event (shown in the All Your Work summary).
 * Our own drawing (inline SVG + CSS): a burro piñata in fringed tissue-paper stripes (David 2026-10-16: "more like a piñata"). No images, no libraries.
 */
(function () {
  'use strict';
  var root = document.querySelector('.pinata-game');
  if (!root) return;
  var POOL = [], seen = {};
  try { JSON.parse(root.getAttribute('data-words')).forEach(function (w) { if (!seen[w.es]) { seen[w.es] = 1; POOL.push(w); } }); } catch (e) { return; }
  var N = Math.min(+root.getAttribute('data-count') || 6, POOL.length), SECONDS = +root.getAttribute('data-seconds') || 60;
  var AUDIO = root.getAttribute('data-audio-base') || '../../audio/';
  var CHEER = null;                                       // spoken cheers; the standalone demo packs them in data-cheers
  try { CHEER = JSON.parse(root.getAttribute('data-cheers')); } catch (e) {}
  CHEER = CHEER || { dale: AUDIO + 'game/dale.mp3', dale3: AUDIO + 'game/dale-dale-dale.mp3' };
  var actx = null;
  function thwack(big) {                                // a wooden 'thwack', made in the page (no sound file)
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, len = Math.floor(actx.sampleRate * 0.12), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      var n = actx.createBufferSource(); n.buffer = buf;
      var bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = big ? 900 : 1300; bp.Q.value = 0.9;
      var g1 = actx.createGain(); g1.gain.value = big ? 0.9 : 0.6;
      n.connect(bp); bp.connect(g1); g1.connect(actx.destination); n.start(t);
      var o = actx.createOscillator(), g2 = actx.createGain();
      o.frequency.setValueAtTime(big ? 140 : 190, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      g2.gain.setValueAtTime(big ? 0.9 : 0.6, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g2); g2.connect(actx.destination); o.start(t); o.stop(t + 0.25);
    } catch (e) {}
  }
  function fanfare() {                                  // 'ta-ta-ta-taaa!': a brassy mariachi-style flourish, made in the page
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = actx.currentTime + 0.05, out = actx.createGain(); out.gain.value = 0.32; out.connect(actx.destination);
      var notes = [[392, 0, 0.12], [523.25, 0.14, 0.12], [659.25, 0.28, 0.12], [783.99, 0.42, 0.75]];   // G4 C5 E5 G5
      notes.forEach(function (n) {
        var f = n[0], t = t0 + n[1], d = n[2];
        var lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
        lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.linearRampToValueAtTime(f * 6, t + 0.05); lp.frequency.linearRampToValueAtTime(f * 3, t + d);
        var env = actx.createGain();
        env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(1, t + 0.03);
        env.gain.setValueAtTime(1, t + d - 0.04); env.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.12);
        lp.connect(env); env.connect(out);
        [-6, 0, 7].forEach(function (cents) {               // three slightly detuned saws = a little brass section
          var o = actx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
          if (d > 0.5) {                                     // vibrato on the long last note
            var lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 6; lg.gain.value = 9;
            lfo.connect(lg); lg.connect(o.detune); lfo.start(t + 0.2); lfo.stop(t + d + 0.15);
          }
          o.connect(lp); o.start(t); o.stop(t + d + 0.15);
        });
      });
    } catch (e) {}
  }
  function buzz(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }   // Android; iPhone ignores
  function say(src) { try { var a = new Audio(src); a.volume = 1; a.play().catch(function () {}); } catch (e) {} }
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['#e8424f', '#f4a52a', '#2bb3a3', '#7b5cd6', '#f06cb4', '#3c8de0'];

  // ---- styles (scoped) ---------------------------------------------------------------------------------------------
  var css = document.createElement('style');
  css.textContent =
    '.pinata-game{position:relative;overflow:hidden;font-family:inherit;color:#1a2340}' +
    '.pg-stage{position:relative;height:285px;transition:height .6s ease;display:flex;justify-content:center;align-items:flex-start;user-select:none}' +
    '.pg-rope{position:absolute;top:0;left:50%;width:3px;height:0;z-index:1;background:#8a6a43;transform:translateX(-50%)}' +
    '.pg-hang{position:absolute;top:0;left:50%;transform-origin:50% 0;margin-left:-115px;cursor:pointer;background:none;border:0;padding:0}' +
    '.pg-hang:focus-visible{outline:3px solid #1f5f8b;outline-offset:4px;border-radius:12px}' +
    '.pg-swing{animation:pgSwing 2.6s ease-in-out infinite}' +
    '@keyframes pgSwing{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}' +
    '.pg-hit{animation:pgHit .35s ease-out}' +
    '@keyframes pgHit{0%{transform:rotate(0) scale(1)}30%{transform:rotate(-16deg) scale(.95)}70%{transform:rotate(10deg) scale(1.02)}100%{transform:rotate(0) scale(1)}}' +
    '.pg-stick{position:absolute;top:120px;left:50%;margin-left:100px;width:120px;height:14px;border-radius:7px;background:linear-gradient(#b07a3c,#7a4f22);transform-origin:100% 50%;transform:rotate(35deg);opacity:0;pointer-events:none}' +
    '.pg-stick.pg-whack{animation:pgWhack .3s ease-out}' +
    '@keyframes pgWhack{0%{opacity:1;transform:rotate(60deg)}50%{opacity:1;transform:rotate(-8deg)}100%{opacity:0;transform:rotate(30deg)}}' +
    '.pg-hint{position:absolute;bottom:6px;width:100%;text-align:center;font-size:15px;color:#5b6672}' +
    '.pg-bar{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:space-between;margin:4px 0 8px;font-size:14px}' +
    '.pg-clock{flex:1 1 160px;height:10px;background:#e3e8ee;border-radius:5px;overflow:hidden;max-width:320px}' +
    '.pg-clock i{display:block;height:100%;width:100%;background:#2bb3a3;transition:width .25s linear}' +
    '.pg-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:54px;margin:6px 0 12px}' +
    '.pg-candy{display:inline-flex;align-items:center;border:0;background:none;padding:0;cursor:grab;touch-action:none;font:inherit}' +
    '.pg-candy .pg-wrap{width:14px;height:26px}' +
    '.pg-candy .pg-body{padding:8px 14px;border-radius:18px;color:#fff;font-weight:700;font-size:16px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.15);white-space:nowrap}' +
    '.pg-candy.pg-sel .pg-body,.pg-candy:focus-visible .pg-body{outline:3px solid #1a2340;outline-offset:2px}' +
    '.pg-candy.pg-sel{transform:translateY(-4px)}' +
    '.pg-candy.pg-no{animation:pgNo .4s}' +
    '@keyframes pgNo{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}' +
    '.pg-baskets{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}' +
    '.pg-baskets.pg-four{grid-template-columns:repeat(4,minmax(0,1fr))}' +
    '@media (max-width:560px){.pg-baskets.pg-four{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
    '.pg-basket{min-height:58px;border:2px dashed #b9a27a;border-radius:10px 10px 22px 22px;background:#fbf6ec;padding:6px 8px;font:inherit;font-size:15px;color:#1a2340;cursor:pointer;text-align:center}' +
    '.pg-basket:focus-visible{outline:3px solid #1f5f8b}' +
    '.pg-basket.pg-full{border-style:solid;border-color:#2f6b3a;background:#eaf5ea;cursor:default}' +
    '.pg-basket .pg-got{display:block;font-weight:700;color:#2f6b3a;margin-top:2px}' +
    '.pg-msg{text-align:center;font-size:18px;font-weight:700;margin:10px 0 4px;min-height:1.4em}' +
    '.pg-btns{text-align:center}' +
    '.pg-btn{font:inherit;font-size:15px;padding:8px 16px;border:0;border-radius:6px;background:#1f5f8b;color:#fff;cursor:pointer;margin:4px}' +
    '.pg-conf{position:absolute;inset:0;pointer-events:none}' +
    '.pinata-game.pg-shake{animation:pgShake .35s}' +
    '@keyframes pgShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-7px,3px)}40%{transform:translate(6px,-4px)}60%{transform:translate(-5px,2px)}80%{transform:translate(4px,-1px)}}' +
    '.pg-pow{position:absolute;z-index:4;pointer-events:none;text-align:center;transform:translate(-50%,-50%);animation:pgPow .9s ease-out forwards}' +
    '.pg-pow b{display:block;font:900 40px/1 "Arial Black",Impact,system-ui,sans-serif;color:#ffd166;-webkit-text-stroke:3px #1a2340;paint-order:stroke fill;letter-spacing:1px;text-shadow:3px 3px 0 #e8424f}' +
    '.pg-pow i{display:block;font:700 13px/1.2 system-ui,sans-serif;font-style:normal;color:#1a2340;background:#fff;border-radius:8px;padding:1px 6px;margin-top:4px}' +
    '@keyframes pgPow{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-14deg)}25%{opacity:1;transform:translate(-50%,-60%) scale(1.15) rotate(-6deg)}70%{opacity:1;transform:translate(-50%,-70%) scale(1) rotate(-4deg)}100%{opacity:0;transform:translate(-50%,-95%) scale(.95) rotate(-4deg)}}' +
    '@media (prefers-reduced-motion:reduce){.pg-swing,.pg-hit,.pg-stick.pg-whack,.pg-candy.pg-no,.pinata-game.pg-shake{animation:none}.pg-pow{animation:pgFade 1s forwards}}' +
    '@keyframes pgFade{0%,70%{opacity:1}100%{opacity:0}}';
  document.head.appendChild(css);

  // ---- the piñata drawing (a classic seven-point star piñata) --------------------------------------------------------
  function pinataSVG() {
    // A classic burro piñata in fringed tissue paper. viewBox 220 x 205; the rope ties on at the middle of the back (x=110).
    var band = '', i, y, cols = ['#f06cb4', '#ffd166', '#2bb3a3', '#7b5cd6', '#f4a52a', '#e8424f'];
    for (i = 0; i < cols.length; i++) {                     // one 20-px tile of six fringed bands, repeated over the body
      y = i * 9;
      band += '<path d="M0,' + y + 'H20V' + (y + 9) + 'L18,' + (y + 12) + 'L16,' + (y + 9) + 'L14,' + (y + 12) + 'L12,' + (y + 9) + 'L10,' + (y + 12) +
        'L8,' + (y + 9) + 'L6,' + (y + 12) + 'L4,' + (y + 9) + 'L2,' + (y + 12) + 'L0,' + (y + 9) + 'Z" fill="' + cols[i] + '"/>';
    }
    var fr = 'url(#pgFringe)', edge = 'stroke="#ffffff" stroke-width="1.5"';
    var leg = function (x, s) { return '<rect x="' + x + '" y="128" width="15" height="44" rx="4" fill="' + fr + '" ' + edge + ' transform="rotate(' + s + ' ' + (x + 7) + ' 128)"/>' +
      '<rect x="' + (x - 1) + '" y="166" width="17" height="9" rx="3" fill="#5a3e2b" transform="rotate(' + s + ' ' + (x + 7) + ' 128)"/>'; };
    var tail = '';
    ['#e8424f', '#ffd166', '#2bb3a3', '#7b5cd6', '#f06cb4'].forEach(function (c, k) {
      tail += '<path d="M54,' + (88 + k * 2) + ' C' + (34 - k * 3) + ',' + (96 + k * 5) + ' ' + (40 - k * 4) + ',' + (124 + k * 4) + ' ' + (24 - k * 3) + ',' + (138 + k * 6) + '" fill="none" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>';
    });
    var mane = '';
    for (i = 0; i < 6; i++) mane += '<polygon points="' + (150 + i * 6) + ',' + (78 - i * 9) + ' ' + (143 + i * 6) + ',' + (66 - i * 9) + ' ' + (157 + i * 6) + ',' + (70 - i * 9) + '" fill="' + cols[(i + 2) % cols.length] + '"/>';
    return '<svg width="230" height="229" viewBox="0 -14 220 219" aria-hidden="true">' +
      '<defs><pattern id="pgFringe" width="20" height="54" patternUnits="userSpaceOnUse">' + band + '</pattern></defs>' +
      tail +
      leg(64, 6) + leg(84, -4) + leg(132, 5) + leg(152, -6) +                               // four legs with hooves
      '<rect x="50" y="72" width="124" height="64" rx="30" fill="' + fr + '" ' + edge + '/>' +   // body
      '<path d="M150,88 L166,40 L190,44 L178,96 Z" fill="' + fr + '" ' + edge + '/>' +           // neck
      mane +
      '<ellipse cx="182" cy="40" rx="25" ry="17" fill="' + fr + '" ' + edge + ' transform="rotate(-12 182 40)"/>' +   // head
      '<path d="M166,27 L153,-11 L178,22 Z" fill="#ffd166" ' + edge + '/><path d="M165,22 L157,-3 L172,20 Z" fill="#f06cb4"/>' +   // ears
      '<path d="M181,25 L188,-13 L196,26 Z" fill="#2bb3a3" ' + edge + '/><path d="M184,21 L188,-5 L192,22 Z" fill="#f06cb4"/>' +
      '<ellipse cx="203" cy="47" rx="13" ry="11" fill="#fbe3c4" stroke="#ffffff" stroke-width="1.5"/>' +             // snout
      '<circle cx="207" cy="45" r="2" fill="#5a3e2b"/><circle cx="201" cy="51" r="1.6" fill="#5a3e2b"/>' +
      '<circle cx="181" cy="35" r="4.2" fill="#ffffff"/><circle cx="182" cy="35.5" r="2.6" fill="#1a2340"/>' +       // eye
      '<path d="M96,72 Q110,64 124,72" fill="none" stroke="#e8424f" stroke-width="4" stroke-linecap="round"/>' +      // saddle ribbon
      '<line x1="110" y1="-14" x2="110" y2="66" stroke="#8a6a43" stroke-width="3"/><circle cx="110" cy="68" r="5" fill="#8a6a43"/>' +                                                                // rope knot
      '</svg>';
  }

  // ---- build the widget ----------------------------------------------------------------------------------------------
  root.innerHTML =
    '<div class="pg-bar"><span class="pg-round"></span><span class="pg-clock" hidden><i></i></span><span class="pg-score"></span></div>' +
    '<div class="pg-stage"><div class="pg-rope"></div>' +
    '<button type="button" class="pg-hang pg-swing" aria-label="Hit the piñata">' + pinataSVG() + '</button>' +
    '<div class="pg-stick"></div><div class="pg-hint"></div></div>' +
    '<div class="pg-tray" aria-label="Candies (Spanish words)"></div>' +
    '<div class="pg-baskets' + (N % 4 === 0 ? ' pg-four' : '') + '" aria-label="Baskets (English meanings)"></div>' +
    '<div class="pg-msg" aria-live="polite"></div><div class="pg-btns"></div>' +
    '<canvas class="pg-conf"></canvas>';
  var $ = function (s) { return root.querySelector(s); };
  var stage = $('.pg-stage'), hang = $('.pg-hang'), stick = $('.pg-stick'), hint = $('.pg-hint'), tray = $('.pg-tray'),
      baskets = $('.pg-baskets'), msg = $('.pg-msg'), btns = $('.pg-btns'), clock = $('.pg-clock'), bar = $('.pg-clock i'),
      roundEl = $('.pg-round'), scoreEl = $('.pg-score'), conf = $('.pg-conf');

  var round = 0, hits = 0, words = [], matched = 0, selected = null, timer = null, startT = 0, timed = false, over = false;

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function play(w) { if (!w.audio) return; try { var a = new Audio(AUDIO + w.audio); a.play().catch(function () {}); } catch (e) {} }

  function newRound() {
    round += 1; timed = round > 1; hits = 0; matched = 0; selected = null; over = false;
    words = shuffle(POOL).slice(0, N);
    tray.innerHTML = ''; tray.style.display = ''; baskets.innerHTML = ''; msg.textContent = ''; btns.innerHTML = ''; stopClock();
    roundEl.innerHTML = timed ? '&#9201; <strong>Contra el reloj</strong> &middot; ' + SECONDS + ' seconds' : '&#127881; <strong>Práctica</strong> &middot; no clock';
    scoreEl.textContent = '';
    clock.hidden = !timed; bar.style.width = '100%';
    hang.style.visibility = 'visible'; hang.disabled = false; stage.style.height = ''; root.querySelector('.pg-rope').style.visibility = ''; hang.className = 'pg-hang' + (calm ? '' : ' pg-swing');
    hint.textContent = 'Tap the piñata three times to break it!';
  }

  function pow(x, y, word, gloss) {                     // comic '¡DALE!' where the stick lands
    var el = document.createElement('div'); el.className = 'pg-pow';
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.innerHTML = '<b>' + word + '</b><i>' + gloss + '</i>';
    stage.appendChild(el); setTimeout(function () { el.remove(); }, 1000);
  }
  function scraps(x, y, n) {                            // a few tissue-paper scraps flutter off each hit
    if (calm) return;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.style.cssText = 'position:absolute;width:9px;height:12px;left:' + x + 'px;top:' + y + 'px;background:' + COLORS[(i + hits) % COLORS.length] + ';border-radius:2px;pointer-events:none;z-index:3';
      stage.appendChild(p);
      var dx = (Math.random() - .5) * 140, an = p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + (90 + Math.random() * 80) + 'px) rotate(' + (Math.random() * 540 - 270) + 'deg)', opacity: 0 }],
        { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.25,.6,.45,1)' });
      an.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }
  hang.addEventListener('click', function (ev) {
    if (hang.disabled) return;
    hits += 1;
    var sr = stage.getBoundingClientRect(), hr = hang.getBoundingClientRect();
    var px = ev && ev.clientX ? ev.clientX - sr.left : hr.left - sr.left + hr.width / 2;
    var py = ev && ev.clientY ? ev.clientY - sr.top : hr.top - sr.top + hr.height / 2;
    pow(Math.max(70, Math.min(sr.width - 70, px)), Math.max(40, py - 20), '¡DALE!', '(Hit it!)');   // one ¡Dale! per hit (David 2026-10-16)
    say(CHEER.dale);
    thwack(hits >= 3);
    buzz(hits < 3 ? 45 : [70, 40, 70]);
    scraps(px, py, hits < 3 ? 5 : 8);
    if (!calm) { root.classList.remove('pg-shake'); void root.offsetWidth; root.classList.add('pg-shake'); }
    if (!calm) {
      stick.classList.remove('pg-whack'); void stick.offsetWidth; stick.classList.add('pg-whack');
      hang.classList.remove('pg-swing', 'pg-hit'); void hang.offsetWidth; hang.classList.add('pg-hit');
      hang.addEventListener('animationend', function back() { hang.removeEventListener('animationend', back); if (!hang.disabled) { hang.classList.remove('pg-hit'); hang.classList.add('pg-swing'); } });
    }
    hint.textContent = hits < 3 ? 'Hit ' + hits + ' of 3 — ¡otra vez! (again!)' : '¡Se rompió! (It broke!)';
    if (hits >= 3) burst();
  });

  function burst() {
    hang.disabled = true;
    var r = stage.getBoundingClientRect(), h = hang.getBoundingClientRect();
    var cx = h.left - r.left + h.width / 2, cy = h.top - r.top + h.height / 2;
    var rr = root.getBoundingClientRect();
    confetti(h.left - rr.left + h.width / 2, h.top - rr.top + h.height / 2, 260, 13, 2400);   // confetti pours out
    buzz([90, 50, 160]);
    fanfare();
    if (!calm) for (var i = 0; i < 14; i++) {                       // paper shards fly out
      var p = document.createElement('div');
      p.style.cssText = 'position:absolute;width:14px;height:22px;left:' + cx + 'px;top:' + cy + 'px;background:' + COLORS[i % COLORS.length] + ';border-radius:3px;pointer-events:none';
      stage.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
      var anim = p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 120) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }],
        { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
    hang.style.visibility = 'hidden';
    setTimeout(function () { if (hang.disabled) { stage.style.height = '44px'; root.querySelector('.pg-rope').style.visibility = 'hidden'; } }, calm ? 0 : 900);
    hint.textContent = 'Match each candy to its meaning: tap a candy, then its basket (or drag it).';
    dealCandies(cx, cy);
    shuffle(words).forEach(function (w) {                          // baskets in a different order
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pg-basket'; b.textContent = w.en; b._w = w;
      b.addEventListener('click', function () { if (selected) tryMatch(selected, b); });
      baskets.appendChild(b);
    });
    scoreEl.textContent = '0 of ' + N;
    if (timed) startClock();
  }

  function dealCandies(cx, cy) {
    words.forEach(function (w, i) {
      var c = document.createElement('button');
      var col = COLORS[i % COLORS.length];
      c.type = 'button'; c.className = 'pg-candy'; c._w = w; c.setAttribute('aria-label', w.es + ' (candy)');
      var wrap = function (flip) { return '<svg class="pg-wrap" viewBox="0 0 14 26" aria-hidden="true"><polygon points="' + (flip ? '0,13 14,2 14,24' : '14,13 0,2 0,24') + '" fill="' + col + '" opacity=".75"/></svg>'; };
      c.innerHTML = wrap(false) + '<span class="pg-body" style="background:' + col + '">' + w.es + '</span>' + wrap(true);
      tray.appendChild(c);
      if (!calm) {
        var tr = tray.getBoundingClientRect(), sr = stage.getBoundingClientRect(), cr = c.getBoundingClientRect();
        var dx = (sr.left + cx) - (cr.left + cr.width / 2), dy = (sr.top + cy) - (cr.top + cr.height / 2);
        c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (Math.random() * 80 - 40) + 'deg) scale(.4)', opacity: 0 },
                   { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }],
                  { duration: 650 + i * 90, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      }
      c.addEventListener('click', function () { if (c._dragged) { c._dragged = false; return; } select(c); });
      drag(c);
    });
  }

  function select(c) {
    if (over) return;
    if (selected) selected.classList.remove('pg-sel');
    selected = selected === c ? null : c;
    if (selected) { selected.classList.add('pg-sel'); play(c._w); }
  }

  function tryMatch(c, b) {
    if (over || b.classList.contains('pg-full')) return;
    if (c._w === b._w) {
      b.classList.add('pg-full'); b.innerHTML = b._w.en + '<span class="pg-got">' + c._w.es + ' &#10003;</span>'; b.disabled = true;
      c.remove(); selected = null; matched += 1; scoreEl.textContent = matched + ' of ' + N;
      if (matched === N) { tray.style.display = 'none'; win(); }
    } else {
      c.classList.remove('pg-no', 'pg-sel'); void c.offsetWidth; c.classList.add('pg-no'); selected = null;
      msg.textContent = 'Not that one — try another basket.';
      setTimeout(function () { if (!over && msg.textContent.indexOf('Not that') === 0) msg.textContent = ''; }, 1400);
    }
  }

  function drag(c) {
    var sx, sy, moving = false, ghost = null;
    c.addEventListener('pointerdown', function (e) {
      if (over) return; sx = e.clientX; sy = e.clientY; moving = false;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', function (e) {
      if (sx === undefined) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moving && Math.abs(dx) + Math.abs(dy) > 8) { moving = true; select(c); if (selected !== c) select(c); }
      if (moving) { c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; c.style.zIndex = 5; c.style.position = 'relative'; }
    });
    c.addEventListener('pointerup', function (e) {
      if (sx === undefined) return; sx = undefined;
      if (!moving) return;
      c._dragged = true; c.style.transform = ''; c.style.zIndex = '';
      c.style.visibility = 'hidden'; var under = document.elementFromPoint(e.clientX, e.clientY); c.style.visibility = '';
      var b = under && under.closest && under.closest('.pg-basket');
      if (b && root.contains(b)) tryMatch(c, b);
    });
  }

  function startClock() {
    startT = Date.now();
    timer = setInterval(function () {
      var left = SECONDS - (Date.now() - startT) / 1000;
      bar.style.width = Math.max(0, left / SECONDS * 100) + '%';
      bar.style.background = left < 10 ? '#e8424f' : left < 25 ? '#f4a52a' : '#2bb3a3';
      if (left <= 0) lose();
    }, 200);
  }
  function stopClock() { if (timer) { clearInterval(timer); timer = null; } }

  function report(done, seconds) {
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: '¡Rompe la piñata! (vocabulary warm-up)', done: done, timed: timed, seconds: seconds, words: N } })); } catch (e) {}
  }

  function win() {
    over = true; stopClock();
    var secs = timed ? Math.round((Date.now() - startT) / 1000) : null;
    msg.innerHTML = timed ? '&#127881; ¡Lo lograste! (You did it!) All ' + N + ' words in ' + secs + ' seconds.' : '&#127881; ¡Muy bien! (Very good!) All ' + N + ' words matched.';
    hint.textContent = '';
    btns.innerHTML = '<button type="button" class="pg-btn">' + (timed ? 'Play again &mdash; can you beat ' + secs + ' s?' : '&#9201; Now try it against the clock (' + SECONDS + ' s)') + '</button>';
    btns.firstChild.addEventListener('click', newRound);
    confetti();
    report(true, secs);
  }
  function lose() {
    over = true; stopClock();
    msg.innerHTML = '&#9200; ¡Se acabó el tiempo! (Time\'s up!) You matched ' + matched + ' of ' + N + '.';
    btns.innerHTML = '<button type="button" class="pg-btn">¡Otra vez! (Again!)</button>';
    btns.firstChild.addEventListener('click', function () { round -= 1; newRound(); });   // stay on the timed round
    report(false, null);
  }

  // ---- confetti (our own, no library) ----------------------------------------------------------------------------------
  function confetti(ox, oy, count, power, life) {
    if (calm) return;
    count = count || 160; power = power || 9; life = life || 2600;
    var W = root.clientWidth, H = root.clientHeight, ctx = conf.getContext('2d'), dpr = window.devicePixelRatio || 1;
    conf.width = W * dpr; conf.height = H * dpr; conf.style.width = W + 'px'; conf.style.height = H + 'px'; ctx.scale(dpr, dpr);
    var bits = [], t0 = performance.now();
    var X = ox == null ? W / 2 : ox, Y = oy == null ? H * 0.35 : oy;
    for (var i = 0; i < count; i++) bits.push({ x: X + (Math.random() - .5) * 60, y: Y + (Math.random() - .5) * 30, vx: (Math.random() - .5) * power, vy: -Math.random() * power - 3,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * 0.3, w: 6 + Math.random() * 5, h: 8 + Math.random() * 6, c: COLORS[i % COLORS.length] });
    (function frame(now) {
      var t = now - t0; ctx.clearRect(0, 0, W, H);
      bits.forEach(function (b) { b.vy += 0.22; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.globalAlpha = Math.max(0, 1 - t / life); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore(); });
      if (t < life) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  newRound();
})();

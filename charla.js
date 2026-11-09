/* charla.js — "¿Quién quiere qué?" conversation game for Optima Spanish lesson pages (David 2026-11-06).
 * Three people stand in a room (plus, optionally, someone calling from a doorway). One person speaks at a time; the
 * speech bubble above them has a blank for the verb form. The student types the form and presses Comprobar.
 * WHO IS WHO is shown with rings and tags on the people, never only by the pronoun:
 *   speaking (red)  ·  talking TO = tú / ustedes (green, solid)  ·  talking ABOUT = él, ella / ellos, ellas (gold, dashed)
 *   ·  "we" = the speaker + others = nosotros (blue).
 * A wrong answer gets a hint that walks the boot: who is the subject -> inside or outside the boot -> the form.
 * Data: <div class="charla-game" data-charla='{"people":[...],"lines":[...]}'>   (lines[i].text uses {answer} blanks)
 * Correct lines play their recording and go into the transcript below the room. Ungraded; reports to my-work.js
 * through the same "mw-game" event as pinata.js. Our own drawing (inline SVG + CSS); no images, no libraries.
 */
(function () {
  'use strict';
  var roots = document.querySelectorAll('.charla-game'), UID = 0;
  if (!roots.length) return;

  function svgUrl(x) { return 'data:image/svg+xml,' + encodeURIComponent(x); }
  // azulejo: blue-and-white tile with an ochre centre (our own drawing)
  var TILE = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" fill="#f6f1e3"/>' +
    '<path d="M22 3 L41 22 L22 41 L3 22Z" fill="none" stroke="#2f4f8f" stroke-width="2.6"/><path d="M22 10 L34 22 L22 34 L10 22Z" fill="#dfe7f3"/>' +
    '<circle cx="22" cy="22" r="6.5" fill="#c7922c"/><circle cx="22" cy="22" r="2.6" fill="#2f4f8f"/>' +
    '<path d="M0 0H9L0 9Z M44 0H35L44 9Z M0 44H9L0 35Z M44 44H35L44 35Z" fill="#2f4f8f"/><rect x=".5" y=".5" width="43" height="43" fill="none" stroke="#cfc4ad"/></svg>');
  // ceiling: a carved wooden cornice with beam ends (vigas) and their corbels
  var BEAM = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="40" viewBox="0 0 90 40"><rect width="90" height="14" fill="#4a2e17"/>' +
    '<rect y="14" width="90" height="6" fill="#6b4423"/><path d="M0 4H90M0 9H90" stroke="#3a2412" stroke-width="1"/>' +
    '<path d="M30 20H60V30Q60 38 52 38H38Q30 38 30 30Z" fill="#6b4423"/><path d="M33 22H57V29Q57 34 51 34H39Q33 34 33 29Z" fill="#7d5130"/>' +
    '<path d="M36 26H54" stroke="#4a2e17" stroke-width="1.5"/></svg>');

  var CSS = '' +
    '.ch-wrap{border:1px solid #c9b58a;border-radius:10px;background:#fffdf7;padding:14px 14px 16px;margin:14px 0}' +
    '.ch-title{font-weight:700;color:#0e1c42;font-size:18px;margin:0 0 2px}' +
    '.ch-sub{color:#1a2340;font-size:16.5px;line-height:1.55;margin:0 0 12px}' +
    '.ch-legend{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:15px;color:#0e1c42;margin:0 0 12px}' +
    '.ch-legend span{display:inline-flex;align-items:center;gap:6px}' +
    '.ch-legend i{display:inline-block;width:16px;height:16px;border-radius:50%}' +
    '.ch-room{position:relative;height:470px;border-radius:8px;overflow:hidden;border:1px solid #b9a77f;background:#efe5cf}' +
    '.ch-scene{position:absolute;inset:0;z-index:0}.ch-scene>*{position:absolute;display:block}' +
    '.ch-scene .wall{left:0;right:0;top:0;bottom:112px;background:radial-gradient(ellipse at 28% 45%,#fbf7ec 0,rgba(251,247,236,0) 55%),radial-gradient(ellipse at 72% 35%,#f8f2e3 0,rgba(248,242,227,0) 50%),linear-gradient(#e9dec6,#f1e8d4 40%,#ece2cb)}' +
    '.ch-scene .beams{left:0;right:0;top:0;height:40px;background-image:url("' + BEAM + '");background-repeat:repeat-x;background-size:90px 40px;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}' +
    '.ch-scene .dado{left:0;right:0;bottom:112px;height:44px;background-image:url("' + TILE + '");background-repeat:repeat-x;background-size:44px 44px;border-top:4px solid #b8892e;box-shadow:0 -1px 0 #6b4423}' +
    '.ch-scene .base{left:0;right:0;bottom:106px;height:6px;background:#5a3a1e}' +
    '.ch-scene .floor{left:0;right:0;bottom:0;width:100%;height:106px}' +
    '.ch-scene .rug{left:9%;width:64%;bottom:6px;height:74px}' +
    '.ch-scene .light{left:calc(53% - 60px);bottom:2px;width:150px;height:104px;background:linear-gradient(rgba(255,236,170,.42),rgba(255,236,170,0));clip-path:polygon(28% 0,72% 0,100% 100%,0 100%)}' +
    '.ch-scene .win{left:calc(53% - 50px);top:66px;width:100px;height:150px}' +
    '.ch-scene .pic{left:calc(29% - 38px);top:78px;width:76px;height:100px}' +
    '.ch-scene .chair{left:1.5%;bottom:58px;width:70px;height:124px}' +
    '.ch-scene .door{right:2%;bottom:106px;width:128px;height:206px}' +
    '.ch-scene .sign{font:italic 600 13px/1 Georgia,serif;color:#2f4f8f;background:#f6f1e3;border:2px solid #2f4f8f;border-radius:3px;padding:4px 8px;box-shadow:0 1px 0 rgba(0,0,0,.15);white-space:nowrap}' +
    '.ch-scene .sign.room{left:10px;top:194px}.ch-scene .sign.kit{right:calc(2% + 64px);transform:translateX(50%);top:72px}' +
    '.ch-p{position:absolute;bottom:20px;width:110px;margin-left:-55px;text-align:center;transition:transform .2s;z-index:1}' +
    '.ch-p svg{display:block;margin:0 auto;width:92px;height:184px;overflow:visible}' +
    '.ch-p .nm{display:inline-block;margin-top:0;font-size:13px;font-weight:700;color:#0e1c42;background:#fffdf7;border:1px solid #b9a77f;border-radius:9px;padding:1px 8px}' +
    '.ch-p .tag{position:absolute;left:50%;top:-10px;transform:translate(-50%,-100%);white-space:nowrap;font-size:12px;font-weight:700;border-radius:9px;padding:2px 8px;display:none;z-index:2}' +
    '.ch-p .ring{position:absolute;left:50%;top:-6px;width:74px;height:74px;margin-left:-37px;border-radius:50%;display:none}' +
    '.ch-p.is-spk .ring{display:block;border:4px solid #8e1b2c}.ch-p.is-spk .tag{display:block;background:#8e1b2c;color:#fff}' +
    '.ch-p.is-to .ring{display:block;border:4px solid #1f7a3a}.ch-p.is-to .tag{display:block;background:#1f7a3a;color:#fff}' +
    '.ch-p.is-ab .ring{display:block;border:4px dashed #b07d16}.ch-p.is-ab .tag{display:block;background:#f3e2b3;color:#5a3a1e;border:1px solid #b07d16}' +
    '.ch-p.is-we .ring{display:block;border:4px solid #1b5aa8}.ch-p.is-we .tag{display:block;background:#1b5aa8;color:#fff}' +
    '.ch-p.is-spk{transform:translateY(-4px)}' +
    '.ch-bub{position:absolute;top:22px;max-width:340px;min-width:200px;background:#fff;border:2px solid #0e1c42;border-radius:14px;padding:10px 12px;font-size:17px;line-height:1.5;color:#1a2340;box-shadow:0 2px 0 rgba(0,0,0,.08);z-index:2}' +
    '.ch-bub:after{content:"";position:absolute;bottom:-12px;left:var(--tail,40px);border:12px solid transparent;border-top-color:#0e1c42;border-bottom:0}' +
    '.ch-bub .who{display:block;font-size:12px;font-weight:700;color:#8e1b2c;margin-bottom:2px}' +
    '.ch-blank{display:inline-flex;flex-direction:column;align-items:center;vertical-align:top;margin:0 2px}.ch-verb{font-size:14px;font-style:italic;color:#8e1b2c;line-height:1.2;margin-top:1px}.ch-bub input{font:inherit;width:7.5em;padding:1px 6px;border:2px solid #9aa6b2;border-radius:6px;background:#fbf8ef;color:#0e1c42}' +
    '.ch-bub input.ok{border-color:#1f7a3a;background:#e9f6ec;font-weight:700}' +
    '.ch-bub input.no{border-color:#b3261e;background:#fdecea}' +
    '.ch-en{display:block;margin-top:6px;font-size:14.5px;line-height:1.35;font-style:italic;font-weight:600;color:#2b4c8c}' +
    '.ch-en-t{display:block;font-size:14px;font-style:italic;color:#2b4c8c;margin-top:1px}' +
    '.ch-note{margin-top:10px;padding:9px 12px;border-radius:8px;background:#fff4d6;border:2px solid #c7922c;color:#5a3a1e;font-size:15.5px;line-height:1.5}.ch-note b{color:#8e1b2c}' +
    '.ch-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}' +
    '.ch-ctl button{font:inherit;font-size:15px;border-radius:999px;padding:6px 16px;cursor:pointer;border:2px solid #8e1b2c;background:#8e1b2c;color:#fff}' +
    '.ch-ctl button.sec{background:#fff;color:#8e1b2c}' +
    '.ch-ctl button[disabled]{opacity:.45;cursor:default}' +
    '.ch-ctl .count{margin-left:auto;font-size:14px;color:#1a2340}' +
    '.ch-fb{margin-top:8px;font-size:15px;line-height:1.55;min-height:1.5em}' +
    '.ch-fb.ok{color:#1f6b33;font-weight:700}.ch-fb.no{color:#8a1c14}' +
    '.ch-log{margin:12px 0 0;padding:0;list-style:none;border-top:1px solid #e6dccb}' +
    '.ch-log li{padding:6px 2px;border-bottom:1px solid #f0e8d8;font-size:15px;color:#1a2340}' +
    '.ch-log li b{color:#8e1b2c}' +
    '.ch-log .say{margin-left:6px}' +
    '.ch-end{margin-top:10px;padding:10px 12px;border-radius:8px;background:#e9f6ec;color:#1f6b33;font-weight:700;display:none}' +
    '@media (max-width:640px){.ch-room{height:490px}.ch-bub{max-width:260px;font-size:15px}}';

  // A standing person (viewBox 100 x 200). look: {hair, skin, top, bottom, skirt, apron, collar}
  function person(L) {
    var sk = L.skin || '#e3b48a', top = L.top || '#2f4f8f', bot = L.bottom || '#3a3a4a', hc = L.hairColor || '#2b1a10';
    var shade = 'rgba(0,0,0,.14)', o = '<svg viewBox="0 0 100 200" aria-hidden="true">';
    o += '<ellipse cx="50" cy="195" rx="31" ry="5" fill="rgba(0,0,0,.22)"/>';
    if (L.hair === 'bun') o += '<circle cx="50" cy="11" r="9" fill="' + hc + '"/>';
    if (L.hair === 'long') o += '<path d="M31 30 Q27 66 31 94 L69 94 Q73 66 69 30 Z" fill="' + hc + '"/>';
    // legs + shoes
    if (L.skirt) {
      o += '<rect x="39" y="160" width="8" height="28" rx="3" fill="' + sk + '"/><rect x="53" y="160" width="8" height="28" rx="3" fill="' + sk + '"/>';
      o += '<path d="M31 118 L69 118 L79 168 Q50 174 21 168 Z" fill="' + bot + '"/><path d="M31 118 L69 118 L71 128 L29 128Z" fill="' + shade + '"/>';
    } else {
      o += '<path d="M33 120 L49 120 L48 188 L36 188 Z" fill="' + bot + '"/><path d="M51 120 L67 120 L64 188 L52 188 Z" fill="' + bot + '"/>';
      o += '<path d="M49.5 124 L50.5 124 L50 150Z" fill="' + shade + '"/>';
    }
    o += '<path d="M33 186 Q42 183 50 188 L50 192 L31 192 Q29 188 33 186Z" fill="#2b1d14"/><path d="M67 186 Q58 183 50 188 L50 192 L69 192 Q71 188 67 186Z" fill="#2b1d14"/>';
    // arms (behind the body) + hands
    o += '<path d="M31 76 Q21 98 23 122" stroke="' + top + '" stroke-width="12" fill="none" stroke-linecap="round"/>';
    o += '<path d="M69 76 Q79 98 77 122" stroke="' + top + '" stroke-width="12" fill="none" stroke-linecap="round"/>';
    o += '<circle cx="23" cy="127" r="6" fill="' + sk + '"/><circle cx="77" cy="127" r="6" fill="' + sk + '"/>';
    // neck: runs from under the chin INTO the shoulders, so head and body are one piece
    o += '<path d="M43 46 L57 46 L58 74 L42 74 Z" fill="' + sk + '"/><path d="M43 50 Q50 57 57 50 L57 58 Q50 62 43 58Z" fill="' + shade + '"/>';
    // torso with rounded shoulders; neckline cut so the neck flows into it
    o += '<path d="M29 74 Q33 66 43 66 Q50 72 57 66 Q67 66 71 74 Q75 98 70 124 L30 124 Q25 98 29 74 Z" fill="' + top + '"/>';
    if (L.collar) o += '<path d="M43 66 L50 76 L41 74Z M57 66 L50 76 L59 74Z" fill="#fbf8ef"/>';
    if (!L.skirt) o += '<rect x="30" y="117" width="40" height="5" fill="rgba(0,0,0,.25)"/>';
    if (L.apron) o += '<path d="M38 84 L62 84 L66 162 Q50 166 34 162 Z" fill="#fbf8ef"/><path d="M38 84 L62 84" stroke="#fbf8ef" stroke-width="3"/><path d="M30 104 H70" stroke="#fbf8ef" stroke-width="3"/>';
    o += '<path d="M33 80 Q38 94 36 116" stroke="' + shade + '" stroke-width="2" fill="none"/>';
    // head
    o += '<ellipse cx="32.5" cy="34" rx="3.5" ry="5" fill="' + sk + '"/><ellipse cx="67.5" cy="34" rx="3.5" ry="5" fill="' + sk + '"/>';
    o += '<ellipse cx="50" cy="32" rx="17" ry="19.5" fill="' + sk + '"/>';
    var H = {
      long: 'M33 31 Q31 11 50 11 Q69 11 67 31 Q62 20 52 20 Q42 22 33 31 Z',
      short: 'M33 29 Q32 10 50 10 Q68 10 67 29 Q64 20 57 19 Q49 23 41 19 Q35 21 33 29 Z',
      bun: 'M33 30 Q33 12 50 12 Q67 12 67 30 Q61 21 50 21 Q39 21 33 30 Z',
      curly: ''
    };
    if (L.hair === 'curly') {
      [[36, 20], [43, 14], [51, 12], [59, 14], [65, 21], [33, 28], [67, 28], [47, 18], [56, 18]].forEach(function (c) {
        o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="7" fill="' + hc + '"/>';
      });
    } else o += '<path d="' + (H[L.hair] || H.short) + '" fill="' + hc + '"/>';
    // face
    o += '<path d="M40 29 Q44 26.5 47 28.5 M53 28.5 Q56 26.5 60 29" stroke="' + hc + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    o += '<ellipse cx="43.5" cy="34" rx="2.1" ry="2.6" fill="#1f1a17"/><ellipse cx="56.5" cy="34" rx="2.1" ry="2.6" fill="#1f1a17"/>';
    o += '<circle cx="44.2" cy="33.2" r=".7" fill="#fff"/><circle cx="57.2" cy="33.2" r=".7" fill="#fff"/>';
    o += '<path d="M50 35 Q48.5 40 50.5 41" stroke="rgba(0,0,0,.25)" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    o += '<path d="M44.5 44 Q50 48.5 55.5 44" stroke="#8a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>';
    o += '<circle cx="40" cy="40.5" r="3" fill="rgba(214,96,82,.22)"/><circle cx="60" cy="40.5" r="3" fill="rgba(214,96,82,.22)"/>';
    return o + '</svg>';
  }

  function scene(D, uid) {
    var o = '<div class="ch-scene" aria-hidden="true"><div class="wall"></div><div class="beams"></div><div class="dado"></div><div class="base"></div>';
    // terracotta floor in perspective
    var f = '<svg class="floor" viewBox="0 0 1000 106" preserveAspectRatio="none"><defs><linearGradient id="fl' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c5232"/><stop offset="1" stop-color="#c06c40"/></linearGradient></defs>' +
      '<rect width="1000" height="106" fill="url(#fl' + uid + ')"/>';
    [9, 21, 37, 58, 84].forEach(function (y) { f += '<path d="M0 ' + y + 'H1000" stroke="#7d3f22" stroke-width="1.6" opacity=".7"/>'; });
    for (var x = -600; x <= 1600; x += 80) f += '<path d="M' + (500 + (x - 500) * 0.45) + ' 0 L' + x + ' 106" stroke="#7d3f22" stroke-width="1.4" opacity=".55"/>';
    o += f + '</svg>';
    o += '<div class="light"></div>';
    // rug
    o += '<svg class="rug" viewBox="0 0 600 74" preserveAspectRatio="none"><path d="M70 2 H530 L598 72 H2 Z" fill="#8e1b2c"/>' +
      '<path d="M84 10 H516 L574 64 H26 Z" fill="none" stroke="#c7922c" stroke-width="5"/><path d="M98 18 H502 L546 56 H54 Z" fill="none" stroke="#2f4f8f" stroke-width="2.5"/>' +
      '<path d="M300 24 L330 37 L300 50 L270 37Z M200 26 L222 37 L200 48 L178 37Z M400 26 L422 37 L400 48 L378 37Z" fill="#c7922c"/></svg>';
    // arched window with a reja and a geranium
    o += '<svg class="win" viewBox="0 0 100 150"><defs><linearGradient id="sk' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fcbe6"/><stop offset=".75" stop-color="#e9f2f4"/><stop offset="1" stop-color="#f4ead0"/></linearGradient></defs>' +
      '<path d="M6 146 V46 Q6 4 50 4 Q94 4 94 46 V146 Z" fill="#8a5a2b"/><path d="M14 140 V48 Q14 14 50 14 Q86 14 86 48 V140 Z" fill="url(#sk' + uid + ')"/>' +
      '<path d="M14 120 Q34 104 52 112 Q70 100 86 110 V140 H14Z" fill="#7fa36a"/><path d="M14 128 Q40 118 86 126 V140 H14Z" fill="#5f8a4f"/>' +
      '<g stroke="#2b1d14" stroke-width="3"><path d="M26 18 V140 M38 15 V140 M50 14 V140 M62 15 V140 M74 18 V140 M14 70 H86 M14 108 H86"/></g>' +
      '<path d="M2 138 H98 V146 H2Z" fill="#6b4423"/><path d="M40 126 H60 L57 140 H43Z" fill="#b5652e"/>' +
      '<circle cx="45" cy="121" r="5" fill="#c0392b"/><circle cx="53" cy="118" r="5.5" fill="#d64a3b"/><circle cx="58" cy="123" r="4.5" fill="#b8302a"/><path d="M42 126 Q50 122 60 126" stroke="#3f6b32" stroke-width="3" fill="none"/></svg>';
    // gilt oval portrait
    o += '<svg class="pic" viewBox="0 0 76 100"><path d="M38 0 V8" stroke="#6b4423" stroke-width="1.5"/><ellipse cx="38" cy="54" rx="35" ry="44" fill="#c7922c"/><ellipse cx="38" cy="54" rx="35" ry="44" fill="none" stroke="#8a5a1b" stroke-width="2"/>' +
      '<ellipse cx="38" cy="54" rx="29" ry="38" fill="#e3c06a"/><ellipse cx="38" cy="54" rx="25" ry="34" fill="#3a2a1e"/>' +
      '<path d="M18 86 Q20 64 38 62 Q56 64 58 86Z" fill="#1d2433"/><path d="M28 64 Q38 72 48 64 L46 60 Q38 66 30 60Z" fill="#f4efe2"/>' +
      '<ellipse cx="38" cy="46" rx="8" ry="10" fill="#d9a77c"/><path d="M30 44 Q30 33 38 33 Q46 33 46 44 Q42 38 38 38 Q34 38 30 44Z" fill="#2b1a10"/></svg>';
    // leather chair (silla de fraile)
    o += '<svg class="chair" viewBox="0 0 70 124"><path d="M10 4 H16 V122 H10Z M54 4 H60 V122 H54Z" fill="#5a3a1e"/><path d="M8 2 H62 V8 H8Z" fill="#6b4423"/>' +
      '<path d="M16 10 H54 V54 H16Z" fill="#7a2f1d"/><g fill="#c7922c"><circle cx="18" cy="12" r="1.6"/><circle cx="52" cy="12" r="1.6"/><circle cx="18" cy="52" r="1.6"/><circle cx="52" cy="52" r="1.6"/></g>' +
      '<path d="M4 70 H66 V78 H4Z" fill="#6b4423"/><path d="M8 62 H62 V70 H8Z" fill="#7a2f1d"/><path d="M6 78 H12 V122 H6Z M58 78 H64 V122 H58Z" fill="#5a3a1e"/><path d="M12 102 H58 V107 H12Z" fill="#6b4423"/></svg>';
    // arched doorway into the kitchen
    if (D.door) {
      o += '<svg class="door" viewBox="0 0 128 206"><defs><clipPath id="dc' + uid + '"><path d="M12 206 V64 Q12 12 64 12 Q116 12 116 64 V206Z"/></clipPath>' +
        '<pattern id="kt' + uid + '" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#f4efe2"/><rect width="6" height="6" fill="#3f63a0"/><rect x="6" y="6" width="6" height="6" fill="#3f63a0"/></pattern></defs>' +
        '<path d="M0 206 V62 Q0 0 64 0 Q128 0 128 62 V206Z" fill="#8a5a2b"/>' +
        '<g clip-path="url(#dc' + uid + ')"><rect width="128" height="206" fill="#f1e8d4"/><rect y="118" width="128" height="70" fill="url(#kt' + uid + ')"/>' +
        '<rect y="186" width="128" height="20" fill="#b8653c"/><path d="M14 70 H114 V75 H14Z" fill="#6b4423"/>' +
        '<circle cx="34" cy="86" r="9" fill="#b5652e"/><circle cx="58" cy="88" r="7" fill="#c2763c"/><circle cx="96" cy="86" r="9" fill="#b5652e"/><path d="M34 75 V77 M58 75 V81 M96 75 V77" stroke="#3a2414" stroke-width="2"/>' +
        '<ellipse cx="96" cy="176" rx="40" ry="26" fill="rgba(255,150,60,.25)"/></g>' +
        '<path d="M12 206 V64 Q12 12 64 12 Q116 12 116 64 V206" fill="none" stroke="#5a3a1e" stroke-width="3"/></svg>';
      o += '<span class="sign kit">' + D.door + '</span>';
    }
    if (D.place) o += '<span class="sign room">' + D.place + '</span>';
    return o + '</div>';
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[¿?¡!.,;:"“”]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function bare(s) { return norm(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function play(base, clip) {
    if (!clip) return;
    try { var a = new Audio(base + clip); a.play(); } catch (e) {}
  }

  function setup(root) {
    var D;
    try { D = JSON.parse(root.getAttribute('data-charla')); } catch (e) { return; }
    var AUDIO = root.getAttribute('data-audio-base') || '../../audio/';
    if (!document.getElementById('ch-css')) {
      var st = document.createElement('style'); st.id = 'ch-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var byId = {};
    D.people.forEach(function (p) { byId[p.id] = p; });
    var ROLE_TAG = { spk: '🗣 speaking', to: '👂 talking TO', ab: '👉 talking ABOUT', we: '👥 we' };

    var h = '<div class="ch-wrap">' +
      '<p class="ch-title">' + (D.title || '¿Quién quiere qué?') + '</p>' +
      '<p class="ch-sub">' + (D.how || '') + '</p>' +
      '<div class="ch-legend">' +
      '<span><i style="border:3px solid #8e1b2c"></i>speaking</span>' +
      '<span><i style="border:3px solid #1f7a3a"></i>talking <b>TO</b> &rarr; t&uacute; (one) / ustedes (more than one)</span>' +
      '<span><i style="border:3px dashed #b07d16"></i>talking <b>ABOUT</b> &rarr; &eacute;l, ella / ellos, ellas</span>' +
      '<span><i style="border:3px solid #1b5aa8"></i><b>we</b>: the speaker + others &rarr; nosotros</span>' +
      '</div>' +
      '<div class="ch-room" role="group" aria-label="' + (D.place || 'the room') + '">' + scene(D, ++UID) + '</div>' +
      '<div class="ch-note" role="note" style="display:none"></div>' +
      '<div class="ch-ctl"><button type="button" class="ch-check">Comprobar</button>' +
      '<button type="button" class="sec ch-next" disabled>Siguiente &rarr;</button>' +
      '<button type="button" class="sec ch-again" style="display:none">Otra vez</button>' +
      '<span class="count"></span></div>' +
      '<div class="ch-fb" aria-live="polite"></div>' +
      '<div class="ch-end"></div>' +
      '<ol class="ch-log" aria-label="The conversation so far"></ol></div>';
    root.innerHTML = h;
    var room = root.querySelector('.ch-room'), fb = root.querySelector('.ch-fb'), log = root.querySelector('.ch-log');
    var bCheck = root.querySelector('.ch-check'), bNext = root.querySelector('.ch-next'), bAgain = root.querySelector('.ch-again');
    var count = root.querySelector('.count'), end = root.querySelector('.ch-end');
    var note = root.querySelector('.ch-note');

    var els = {};
    D.people.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'ch-p'; d.style.left = p.x + '%';
      if (p.offstage) { d.style.bottom = '104px'; d.style.left = 'auto'; d.style.right = 'calc(2% + 9px)'; d.style.marginLeft = '0'; d.style.transform = 'scale(.8)'; d.style.transformOrigin = 'bottom center'; }
      d.innerHTML = '<div class="ring"></div><span class="tag"></span>' +
        person(p) +
        '<span class="nm">' + p.name + '</span>';
      room.appendChild(d); els[p.id] = d;
    });
    var bub = document.createElement('div'); bub.className = 'ch-bub'; room.appendChild(bub);

    var i = 0, tries = 0, firstTry = 0, inputs = [];
    function VERB(L) { return L.verb || D.verb || 'querer'; }
    function roles(L) {
      D.people.forEach(function (p) { els[p.id].className = 'ch-p'; els[p.id].querySelector('.tag').textContent = ''; });
      function mark(ids, r) { (ids || []).forEach(function (id) { if (els[id]) { els[id].className = 'ch-p is-' + r; els[id].querySelector('.tag').textContent = ROLE_TAG[r]; } }); }
      mark(L.about, 'ab'); mark(L.to, 'to'); mark(L.we, 'we'); mark([L.who], 'spk');
      if (L.we && L.we.length) els[L.who].querySelector('.tag').textContent = '🗣 speaking · 👥 we';
    }
    function show() {
      var L = D.lines[i]; tries = 0;
      roles(L);
      var parts = L.text.split(/\{([^}]+)\}/), html = '<span class="who">' + byId[L.who].name + ':</span>';
      for (var k = 0; k < parts.length; k++) {
        html += (k % 2) ? '<span class="ch-blank"><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="' + VERB(L) + ', the right form"><span class="ch-verb">(' + VERB(L) + ')</span></span>' : parts[k];
      }
      if (L.en) html += '<span class="ch-en" lang="en">' + L.en + '</span>';
      bub.innerHTML = html;
      inputs = [].slice.call(bub.querySelectorAll('input'));
      var answers = parts.filter(function (x, k) { return k % 2; });
      inputs.forEach(function (inp, k) {
        inp.setAttribute('data-ans', answers[k]);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      });
      if (L.notice) { note.innerHTML = L.notice; note.style.display = ''; } else { note.style.display = 'none'; }
      place();
      bCheck.disabled = false; bNext.disabled = true; fb.textContent = ''; fb.className = 'ch-fb';
      count.textContent = 'Line ' + (i + 1) + ' of ' + D.lines.length;
      try { inputs[0].focus({ preventScroll: true }); } catch (e) {}
    }
    function place(whoId) {
      var sp = byId[whoId || D.lines[i].who], left = sp.offstage ? 100 - 8 : sp.x;
      var w = room.clientWidth || 600, bw = Math.min(340, w - 20), px = left / 100 * w - bw / 2;
      px = Math.max(8, Math.min(w - bw - 8, px));
      bub.style.left = px + 'px'; bub.style.width = bw + 'px';
      bub.style.setProperty('--tail', Math.max(16, Math.min(bw - 36, left / 100 * w - px - 12)) + 'px');
    }
    function check() {
      var L = D.lines[i], allOk = true, wrong = '';
      inputs.forEach(function (inp) {
        var want = inp.getAttribute('data-ans'), got = inp.value;
        if (norm(got) === norm(want)) { inp.className = 'ok'; }
        else { allOk = false; inp.className = 'no'; if (!wrong) wrong = got; }
      });
      tries++;
      if (allOk) {
        if (tries === 1) firstTry++;
        inputs.forEach(function (inp) { inp.disabled = true; });
        fb.className = 'ch-fb ok'; fb.innerHTML = '&iexcl;Correcto! ' + (L.why || '');
        play(AUDIO, L.audio);
        var li = document.createElement('li');
        li.innerHTML = '<b>' + byId[L.who].name + ':</b> ' + L.text.replace(/\{([^}]+)\}/g, '<strong>$1</strong>') +
          (L.audio ? ' <button class="say" type="button" aria-label="Escuchar">&#128266;</button>' : '') +
          (L.en ? '<span class="ch-en-t" lang="en">' + L.en + '</span>' : '');
        var sb = li.querySelector('button'); if (sb) sb.addEventListener('click', function () { play(AUDIO, L.audio); });
        log.appendChild(li);
        bCheck.disabled = true;
        if (i < D.lines.length - 1) { bNext.disabled = false; try { bNext.focus({ preventScroll: true }); } catch (e) {} }
        else finish();
      } else {
        fb.className = 'ch-fb no';
        var note = (L.traps || {})[bare(wrong)];
        fb.innerHTML = 'Not quite. ' + (note || (tries === 1 ? L.hint : (L.hint2 || L.hint)) || 'Look at the rings: who is the subject?');
      }
    }
    function finish() {
      note.style.display = 'none';
      end.style.display = 'block';
      end.innerHTML = '&iexcl;Muy bien! You finished the conversation &mdash; ' + firstTry + ' of ' + D.lines.length + ' lines right on the first try.';
      bAgain.style.display = '';
      D.people.forEach(function (p) { els[p.id].className = 'ch-p'; });
      var ew = D.endWho && byId[D.endWho];
      bub.innerHTML = '<span class="who">' + (ew ? ew.name + ':' : '&iexcl;Fin!') + '</span>' + (D.endLine || '&iexcl;A comer!');
      if (ew) { place(D.endWho); els[D.endWho].className = 'ch-p is-spk'; els[D.endWho].querySelector('.tag').textContent = ROLE_TAG.spk; }
      try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: (D.title || 'Conversation') + ' (' + (D.verb || 'querer') + ')', done: true, firstTry: firstTry, lines: D.lines.length } })); } catch (e) {}
    }
    bCheck.addEventListener('click', check);
    bNext.addEventListener('click', function () { i++; show(); });
    bAgain.addEventListener('click', function () { i = 0; firstTry = 0; log.innerHTML = ''; end.style.display = 'none'; bAgain.style.display = 'none'; show(); });
    window.addEventListener('resize', function () { if (i < D.lines.length && end.style.display !== 'block') place(); });
    show();
  }
  [].forEach.call(roots, setup);
})();

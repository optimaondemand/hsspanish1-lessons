/* rutina.js v1: "Mi día", a stick-figure day for Spanish 1 S2 Módulo 4 (Lesson 4.08).
   David 2026-11-24: a student, drawn as a simple stick figure, wakes up and goes through the day using all the
   module's vocabulary; every time the student says what he or she is doing, a drop-down menu offers the forms and
   only the grammatically correct one is right. Every wrong choice explains what is wrong and why.
   Start: choose chico or chica (only the drawing changes; the student always speaks as yo).
   12 scenes, 6:00 a.m. to bedtime; all 18 words of vocabulario-m04 appear (despertarse, levantarse, ducharse, lavarse,
   cepillarse, peinarse, afeitarse, vestirse, ponerse, sentarse, acostarse, la rutina, el despertador, temprano, tarde,
   primero, antes, después). Every other word is taught before 4.08 (luego S2 M1, mi padre / mi hermana S1 M4,
   el uniforme 4.05, por último 4.02). No color is named in any text.
   Markup: <div class="rutina-game" data-rutina='{"id","title","audioBase"}'></div>
   Scene 1 plays an alarm-clock ring (audio/game/despertador-ring.mp3, made with ffmpeg, no license needed).
   Practice only; reports to All Your Work with a 'mw-game' event when the day is finished. */
(function () {
  'use strict';
  var INK = '#2a1f16';

  // ------------------------------------------------------------------ the day
  // opts: [form, correct?, why]. Every scene's correct sentence has a clip grammar/s2m4-dia-NN.mp3.
  var SCENES = [
    { room: 'cuarto', sky: 'dawn', time: '6:00', place: 'el dormitorio',
      pre: '¡El despertador! Primero,', post: 'temprano.', en: 'The alarm clock! First, I wake up early.',
      opts: [['me despierto', 1, 'Yes: <strong>me despierto</strong>. Yo takes <em>me</em>, and despertarse jumps e&rarr;ie inside the boot.'],
             ['despierto', 0, 'Without <em>me</em>, <em>despierto</em> means you wake <em>someone else</em> up. You are waking yourself: <strong>me despierto</strong>.'],
             ['me desperto', 0, 'Close, but despertarse jumps <strong>e&rarr;ie</strong> with yo: <strong>me desp<u>ie</u>rto</strong>.'],
             ['se despierta', 0, '<em>Se despierta</em> is he or she. You are talking about yourself (yo): <strong>me despierto</strong>.']] },
    { room: 'cuarto', sky: 'dawn', time: '6:05', place: 'el dormitorio',
      pre: 'Después,', post: '.', en: 'Then I get up.',
      opts: [['me levanto', 1, 'Yes: <strong>me levanto</strong>. English says &ldquo;I get up,&rdquo; but Spanish says &ldquo;I raise <em>myself</em>.&rdquo;'],
             ['levanto', 0, '<em>Levanto</em> alone means you lift something (like <em>levanto la mano</em>). Here you lift yourself out of bed: <strong>me levanto</strong>.'],
             ['me levantas', 0, 'The <em>-as</em> ending is for t&uacute;. With yo the verb ends in <em>-o</em>: <strong>me levanto</strong>.'],
             ['nos levantamos', 0, '<em>Nos levantamos</em> is &ldquo;we get up.&rdquo; Only you are getting up now: <strong>me levanto</strong>.']] },
    { room: 'ducha', sky: 'day', time: '6:10', place: 'el baño',
      pre: 'Luego', post: '.', en: 'Next, I shower.',
      opts: [['me ducho', 1, 'Yes: <strong>me ducho</strong>, pronoun <em>me</em> + the yo ending <em>-o</em>.'],
             ['ducho', 0, 'You shower yourself, so Spanish needs the pronoun: <strong>me ducho</strong>.'],
             ['me ducha', 0, 'The <em>-a</em> ending is for &eacute;l or ella. With yo the verb ends in <em>-o</em>: <strong>me ducho</strong>.'],
             ['se ducho', 0, '<em>Se</em> is for &eacute;l, ella, ellos. Yo takes <em>me</em>: <strong>me ducho</strong>.']] },
    { room: 'lavabo', sky: 'day', time: '6:20', place: 'el baño', prop: 'brush',
      pre: 'Me cepillo', post: 'dientes.', en: 'I brush my teeth.',
      opts: [['los', 1, 'Yes: <strong>los dientes</strong>. It is clear they are your own teeth (the <em>me</em> shows it), so Spanish uses the article.'],
             ['mis', 0, 'For parts of the body, Spanish uses <em>el, la, los, las</em> when it is clear whose they are. The <em>me</em> makes it clear: <strong>los dientes</strong>.']] },
    { room: 'lavabo', sky: 'day', time: '6:25', place: 'el baño', prop: 'splash',
      pre: '', post: 'la cara.', en: 'I wash my face.',
      opts: [['Me lavo', 1, 'Yes: <strong>me lavo la cara</strong>. It is your own face, so the action lands on you.'],
             ['Lavo', 0, 'Without <em>me</em>, the washing lands on something else (like <em>lavo la mesa</em>). It is your own face: <strong>me lavo la cara</strong>.'],
             ['Me lava', 0, 'The <em>-a</em> ending is for &eacute;l or ella. With yo: <strong>me lavo</strong>.'],
             ['Te lavas', 0, '<em>Te lavas</em> is t&uacute;, &ldquo;you wash.&rdquo; You are talking about yourself: <strong>me lavo</strong>.']] },
    { room: 'espejo', sky: 'day', time: '6:30', place: 'el baño', who: 'padre',
      pre: 'Mi padre', post: 'en el baño.', en: 'My father shaves in the bathroom.',
      opts: [['se afeita', 1, 'Yes: <strong>se afeita</strong>. Mi padre is &eacute;l, so the pronoun is <em>se</em> and the ending is <em>-a</em>.'],
             ['me afeito', 0, '<em>Me afeito</em> is &ldquo;I shave.&rdquo; You are talking about your father (&eacute;l): <strong>se afeita</strong>.'],
             ['se afeitan', 0, 'The <em>-an</em> ending is for ellos. Mi padre is one person: <strong>se afeita</strong>.'],
             ['afeita', 0, 'Without <em>se</em>, he would be shaving someone else. He shaves himself: <strong>se afeita</strong>.']] },
    { room: 'espejo', sky: 'day', time: '6:35', place: 'el baño', prop: 'comb',
      pre: 'Y yo', post: '.', en: 'And I comb my hair.',
      opts: [['me peino', 1, 'Yes: <strong>me peino</strong>, pronoun <em>me</em> + the yo ending <em>-o</em>.'],
             ['me peina', 0, 'The <em>-a</em> ending is for &eacute;l or ella. With yo: <strong>me peino</strong>.'],
             ['peino', 0, 'Without <em>me</em>, you would be combing someone else&rsquo;s hair. You comb your own: <strong>me peino</strong>.'],
             ['nos peinamos', 0, '<em>Nos peinamos</em> is &ldquo;we comb our hair.&rdquo; The sentence starts <em>y yo</em>: <strong>me peino</strong>.']] },
    { room: 'cuarto', sky: 'day', time: '6:40', place: 'el dormitorio',
      pre: 'Después,', post: '.', en: 'Then I get dressed.',
      opts: [['me visto', 1, 'Yes: <strong>me visto</strong>. Vestirse jumps e&rarr;i inside the boot.'],
             ['me vesto', 0, 'Close, but vestirse jumps <strong>e&rarr;i</strong> with yo: <strong>me v<u>i</u>sto</strong>.'],
             ['me viste', 0, 'The <em>-e</em> ending is for &eacute;l or ella. With yo the verb ends in <em>-o</em>: <strong>me visto</strong>.'],
             ['visto', 0, 'Without <em>me</em>, you would be dressing someone else. You dress yourself: <strong>me visto</strong>.']] },
    { room: 'cuarto', sky: 'day', time: '6:45', place: 'el dormitorio', dressed: 1,
      pre: 'Antes de la escuela,', post: 'el uniforme.', en: 'Before school, I put on the uniform.',
      opts: [['me pongo', 1, 'Yes: <strong>me pongo</strong>. Ponerse is a yo-go verb: <em>pongo</em>, with <em>me</em> because you put it on yourself.'],
             ['me pono', 0, 'Ponerse is a <strong>yo-go</strong> verb, like <em>salgo</em> and <em>hago</em>: <strong>me pongo</strong>.'],
             ['se pone', 0, '<em>Se pone</em> is he or she. You are putting it on yourself: <strong>me pongo</strong>.'],
             ['pongo', 0, '<em>Pongo el uniforme</em> means you put the uniform somewhere. You put it on yourself: <strong>me pongo</strong>.']] },
    { room: 'cocina', sky: 'day', time: '7:00', place: 'la cocina', who: 'familia',
      pre: 'Mi familia y yo', post: 'a la mesa.', en: 'My family and I sit down at the table.',
      opts: [['nos sentamos', 1, 'Yes: <strong>nos sentamos</strong>. &ldquo;My family and I&rdquo; is nosotros, which is outside the boot: no vowel jump.'],
             ['nos sientamos', 0, 'Nosotros is <strong>outside the boot</strong>, so sentarse keeps its e: <strong>nos sentamos</strong>.'],
             ['me siento', 0, '<em>Me siento</em> is only you. &ldquo;My family and I&rdquo; is nosotros: <strong>nos sentamos</strong>.'],
             ['se sientan', 0, '<em>Se sientan</em> is ellos, &ldquo;they.&rdquo; You are part of the group (nosotros): <strong>nos sentamos</strong>.']] },
    { room: 'cuarto', sky: 'night', time: '21:00', place: 'el dormitorio', who: 'hermana',
      pre: 'Por la noche, mi hermana', post: 'temprano.', en: 'At night, my sister goes to bed early.',
      opts: [['se acuesta', 1, 'Yes: <strong>se acuesta</strong>. Mi hermana is ella: pronoun <em>se</em>, and acostarse jumps o&rarr;ue.'],
             ['se acosta', 0, 'Acostarse jumps <strong>o&rarr;ue</strong> with ella: <strong>se ac<u>ue</u>sta</strong>.'],
             ['me acuesto', 0, '<em>Me acuesto</em> is &ldquo;I go to bed.&rdquo; You are talking about your sister (ella): <strong>se acuesta</strong>.'],
             ['se acuestan', 0, 'The <em>-an</em> ending is for ellos. Mi hermana is one person: <strong>se acuesta</strong>.']] },
    { room: 'cuarto', sky: 'night', time: '22:30', place: 'el dormitorio',
      pre: 'Por último, yo', post: 'tarde.', en: 'Last of all, I go to bed late.',
      opts: [['me acuesto', 1, 'Yes: <strong>me acuesto</strong>. Pronoun <em>me</em>, and the o&rarr;ue jump inside the boot.'],
             ['me acosto', 0, 'Acostarse jumps <strong>o&rarr;ue</strong> with yo: <strong>me ac<u>ue</u>sto</strong>.'],
             ['acuesto', 0, 'Without <em>me</em>, you would be putting someone else to bed. You go to bed yourself: <strong>me acuesto</strong>.'],
             ['nos acostamos', 0, '<em>Nos acostamos</em> is &ldquo;we go to bed.&rdquo; The sentence says <em>yo</em>: <strong>me acuesto</strong>.']] }
  ];

  // ------------------------------------------------------------------ drawing
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function L(x1, y1, x2, y2, c, w) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || INK) + '" stroke-width="' + (w || 5) + '" stroke-linecap="round"/>'; }

  // a stick figure, feet at (0,0), about 150 units tall. o: pose stand|sit, hair short|pony|bow|long, must, clothes pj|dressed|uniform,
  // arm down|face|up, prop brush|comb|razor|splash, sleep (eyes closed), foam
  function body(o) {
    var sit = o.pose === 'sit', hy = sit ? -116 : -128, sh = hy + 28, hip = sit ? -48 : -58, g = '';
    var pants = o.clothes === 'pj' ? '#9cc3e6' : o.clothes ? '#3a4a6b' : null;
    // legs (pants underneath the line)
    var legs = sit ? [[0, hip, 30, hip], [30, hip, 30, 0]] : [[0, hip, -15, 0], [0, hip, 15, 0]];
    if (pants) legs.forEach(function (l) { g += L(l[0], l[1], l[2], l[3], pants, 12); });
    legs.forEach(function (l) { g += L(l[0], l[1], l[2], l[3]); });
    // shirt
    if (o.clothes === 'pj') g += '<path d="M-13 ' + (sh + 2) + ' L13 ' + (sh + 2) + ' L11 ' + (hip + 4) + ' L-11 ' + (hip + 4) + 'Z" fill="#9cc3e6" stroke="' + INK + '" stroke-width="2"/>' +
      L(-11, sh + 14, 11, sh + 14, '#ffffff', 2) + L(-11, sh + 26, 11, sh + 26, '#ffffff', 2) + L(-11, sh + 38, 11, sh + 38, '#ffffff', 2);
    if (o.clothes === 'dressed' || o.clothes === 'uniform') g += '<path d="M-13 ' + (sh + 2) + ' L13 ' + (sh + 2) + ' L11 ' + (hip + 4) + ' L-11 ' + (hip + 4) + 'Z" fill="#f6f2e6" stroke="' + INK + '" stroke-width="2"/>';
    if (o.clothes === 'uniform') g += '<path d="M-14 ' + (sh + 2) + ' L-3 ' + (sh + 2) + ' L-4 ' + (hip + 4) + ' L-12 ' + (hip + 4) + 'Z" fill="#24345e"/><path d="M14 ' + (sh + 2) + ' L3 ' + (sh + 2) + ' L4 ' + (hip + 4) + ' L12 ' + (hip + 4) + 'Z" fill="#24345e"/>' +
      '<path d="M-3 ' + (sh + 3) + ' L3 ' + (sh + 3) + ' L1 ' + (sh + 26) + ' L0 ' + (sh + 30) + ' L-1 ' + (sh + 26) + 'Z" fill="#8e1b2c"/>';
    if (!o.clothes) g += '';
    g += L(0, sh, 0, hip);
    // arms
    g += L(0, sh + 6, -26, sh + (o.arm === 'up' ? -46 : 38));
    var arm = o.arm === 'up' ? L(0, sh + 6, 26, sh - 46) : o.arm === 'face' ? L(0, sh + 6, 24, sh - 6) + L(24, sh - 6, 12, hy + 8) : L(0, sh + 6, 26, sh + 38);
    var prop = '';
    if (o.prop === 'brush') prop = '<rect x="2" y="' + (hy + 6) + '" width="26" height="5" rx="2" fill="#4a9a8a" transform="rotate(-12 12 ' + hy + ')"/><rect x="2" y="' + (hy + 1) + '" width="7" height="6" fill="#ffffff" stroke="#999" stroke-width="1"/>';
    if (o.prop === 'comb') prop = '<rect x="-4" y="' + (hy - 24) + '" width="30" height="6" rx="1" fill="#b8892e"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { return L(-1 + i * 5, hy - 18, -1 + i * 5, hy - 13, '#b8892e', 2); }).join('');
    if (o.prop === 'razor') prop = '<rect x="10" y="' + (hy + 2) + '" width="5" height="22" rx="2" fill="#5f6b7a"/><rect x="6" y="' + (hy - 2) + '" width="13" height="5" rx="1" fill="#9aa6b2"/>';
    g += '<g class="' + (o.prop && o.prop !== 'splash' ? 'rt-scrub' : '') + '">' + arm + prop + '</g>';
    // head
    g += '<circle cx="0" cy="' + hy + '" r="17" fill="#fffaf0" stroke="' + INK + '" stroke-width="4"/>';
    if (o.sleep) g += '<path d="M-10 ' + (hy - 2) + ' q4 4 8 0 M2 ' + (hy - 2) + ' q4 4 8 0" fill="none" stroke="' + INK + '" stroke-width="2.5"/>';
    else g += '<circle cx="-6" cy="' + (hy - 3) + '" r="2.6" fill="' + INK + '"/><circle cx="6" cy="' + (hy - 3) + '" r="2.6" fill="' + INK + '"/>';
    g += o.yawn ? '<ellipse cx="0" cy="' + (hy + 8) + '" rx="4" ry="5" fill="' + INK + '"/>' : '<path d="M-6 ' + (hy + 6) + ' q6 5 12 0" fill="none" stroke="' + INK + '" stroke-width="2.5"/>';
    if (o.beard) g += '<path d="M-16 ' + (hy + 1) + ' Q-15 ' + (hy + 22) + ' 0 ' + (hy + 24) + ' Q15 ' + (hy + 22) + ' 16 ' + (hy + 1) + ' Q10 ' + (hy + 13) + ' 0 ' + (hy + 13) + ' Q-10 ' + (hy + 13) + ' -16 ' + (hy + 1) + 'Z" fill="' + INK + '"/>';
    if (o.must) g += '<path d="M-8 ' + (hy + 4) + ' q8 -5 16 0" fill="none" stroke="' + INK + '" stroke-width="3.5"/>';
    // hair
    var top = '<path d="M-17 ' + (hy - 3) + ' q2 -18 17 -18 q15 0 17 18 q-8 -9 -17 -9 q-9 0 -17 9Z" fill="' + INK + '"/>';
    if (o.hair === 'short') g += top;
    if (o.messy) g += L(-6, hy - 20, -10, hy - 29, INK, 3) + L(2, hy - 21, 4, hy - 31, INK, 3) + L(9, hy - 19, 15, hy - 27, INK, 3);
    if (o.hair === 'pony') g += top + '<path d="M14 ' + (hy - 10) + ' q16 4 12 26 q-6 -10 -10 -16Z" fill="' + INK + '"/>';
    if (o.hair === 'long') g += top + '<path d="M-17 ' + (hy - 3) + ' q-4 20 -2 30 l6 0 q-2 -14 0 -26Z M17 ' + (hy - 3) + ' q4 20 2 30 l-6 0 q2 -14 0 -26Z" fill="' + INK + '"/>';
    if (o.hair === 'bow') g += top + '<path d="M4 ' + (hy - 18) + ' l12 -8 l0 14Z M4 ' + (hy - 18) + ' l-12 -8 l0 14Z" fill="#c0392b"/>';
    return g;
  }
  function fig(o, x, y, s, cls, rot) {
    return '<g class="' + (cls || '') + '" transform="translate(' + x + ',' + y + ')' + (rot ? ' rotate(' + rot + ')' : '') + ' scale(' + (s || 1) + ')">' + body(o) + '</g>';
  }

  function sky(k) {
    var c = k === 'night' ? ['#1b2440', '#2c3a63'] : k === 'dawn' ? ['#f6c48a', '#f9e2b8'] : ['#9fd0f0', '#d8eefa'];
    var extra = k === 'night' ? '<circle cx="128" cy="96" r="18" fill="#f6efd0"/><circle cx="136" cy="90" r="16" fill="#1b2440"/>' + [[70, 70], [170, 140], [96, 150], [190, 80]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="#f6efd0"/>'; }).join('')
      : k === 'dawn' ? '<circle cx="130" cy="168" r="26" fill="#f39c4a"/>' : '<circle cx="160" cy="88" r="20" fill="#fbe27a"/>';
    return '<defs><linearGradient id="rtsky-' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<rect x="60" y="50" width="160" height="140" fill="url(#rtsky-' + k + ')"/>' + extra +
      '<rect x="60" y="50" width="160" height="140" fill="none" stroke="#7a5a3a" stroke-width="8"/>' + L(140, 50, 140, 190, '#7a5a3a', 6) + L(60, 120, 220, 120, '#7a5a3a', 6);
  }
  function wall(c, night) {
    return '<rect width="960" height="440" fill="' + c + '"/>' + (night ? '<rect width="960" height="440" fill="#0b1230" opacity=".38"/>' : '') +
      '<rect y="380" width="960" height="60" fill="#c9a77a"/>' + L(0, 380, 960, 380, '#9c7b52', 4);
  }
  function bed(x, w) {
    w = w || 300;
    return '<rect x="' + x + '" y="300" width="' + w + '" height="44" rx="6" fill="#8a5a3a"/><rect x="' + x + '" y="250" width="16" height="130" fill="#6f4429"/><rect x="' + (x + w - 16) + '" y="270" width="16" height="110" fill="#6f4429"/>' +
      '<rect x="' + (x + 12) + '" y="284" width="' + (w - 24) + '" height="22" rx="8" fill="#f6f2e6"/><rect x="' + (x + 20) + '" y="266" width="64" height="26" rx="10" fill="#ffffff" stroke="#d8d0bd"/>';
  }
  function blanket(x, w) { return '<rect x="' + (x + 90) + '" y="276" width="' + ((w || 300) - 104) + '" height="34" rx="10" fill="#c46b5a"/>'; }
  function clock(x, ring) {
    return '<g class="' + (ring ? 'rt-ring' : '') + '"><rect x="' + (x - 34) + '" y="300" width="68" height="80" fill="#7a5a3a"/>' +
      '<circle cx="' + x + '" cy="274" r="22" fill="#fffaf0" stroke="#8e1b2c" stroke-width="5"/><circle cx="' + (x - 16) + '" cy="252" r="8" fill="#8e1b2c"/><circle cx="' + (x + 16) + '" cy="252" r="8" fill="#8e1b2c"/>' +
      L(x, 274, x, 260, INK, 3) + L(x, 274, x + 9, 274, INK, 3) + L(x - 14, 294, x - 18, 300, '#8e1b2c', 4) + L(x + 14, 294, x + 18, 300, '#8e1b2c', 4) +
      (ring ? '<text x="' + (x - 50) + '" y="222" font-size="26" font-weight="700" fill="#8e1b2c" font-family="Georgia,serif">¡Riiing!</text>' + L(x - 34, 250, x - 46, 244, '#8e1b2c', 3) + L(x + 34, 250, x + 46, 244, '#8e1b2c', 3) : '') + '</g>';
  }
  function rack(x, full) {   // a standing clothes rack: feet, pole, hook, hanger; full = the school uniform hangs on it
    var r = L(x - 34, 380, x, 368, '#6f4429', 6) + L(x + 34, 380, x, 368, '#6f4429', 6) + L(x, 368, x, 150, '#6f4429', 7) +
      '<path d="M' + x + ' 150 q0 -16 -12 -16" fill="none" stroke="#6f4429" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M' + x + ' 162 q0 -8 6 -10" fill="none" stroke="#9aa6b2" stroke-width="3"/>' + L(x - 34, 178, x, 162, '#9aa6b2', 4) + L(x + 34, 178, x, 162, '#9aa6b2', 4) + L(x - 34, 178, x + 34, 178, '#9aa6b2', 4);
    if (full) r += '<path d="M' + (x - 30) + ' 288 l-10 0 l-8 76 l22 0 l12 -60 l12 60 l22 0 l-8 -76 l-10 0Z" fill="#3a4a6b" stroke="' + INK + '" stroke-width="2"/>' +   // trousers
      '<path d="M' + (x - 8) + ' 172 l16 0 l0 128 l-16 0Z" fill="#f6f2e6"/><path d="M' + (x - 3) + ' 174 l6 0 l-1 44 l-2 6 l-2 -6Z" fill="#8e1b2c"/>' +   // shirt and tie
      '<path d="M' + (x - 36) + ' 176 l28 -6 l6 60 l-8 66 l-32 0 l-4 -60Z" fill="#24345e" stroke="' + INK + '" stroke-width="2"/><path d="M' + (x + 36) + ' 176 l-28 -6 l-6 60 l8 66 l32 0 l4 -60Z" fill="#24345e" stroke="' + INK + '" stroke-width="2"/>' +   // blazer
      '<circle cx="' + (x - 22) + '" cy="214" r="5" fill="#b8892e"/>';   // crest on the blazer
    return r;
  }
  function zzz(x, y) { return '<g class="rt-zzz"><text x="' + x + '" y="' + y + '" font-size="30" font-weight="700" fill="#5f6b9a" font-family="Georgia,serif">z</text><text x="' + (x + 20) + '" y="' + (y - 24) + '" font-size="24" font-weight="700" fill="#5f6b9a" font-family="Georgia,serif">z</text><text x="' + (x + 36) + '" y="' + (y - 44) + '" font-size="18" font-weight="700" fill="#5f6b9a" font-family="Georgia,serif">z</text></g>'; }
  // tiles fill exactly the box x..x+w, y0..y1 (grout lines inside it, nothing spills onto the floor)
  function tiles(x, w, y0, y1, fill, grout, size) {
    size = size || 40;
    var t = '<rect x="' + x + '" y="' + y0 + '" width="' + w + '" height="' + (y1 - y0) + '" fill="' + fill + '"/>';
    for (var i = x + size; i < x + w; i += size) t += L(i, y0, i, y1, grout, 1.5);
    for (var j = y0 + size; j < y1; j += size) t += L(x, j, x + w, j, grout, 1.5);
    return t;
  }
  function bathroom() {   // painted wall, tiled lower half with a trim, tiled floor
    var f = '<rect width="960" height="440" fill="#e3eef0"/>' + tiles(0, 960, 236, 380, '#f4f8f8', '#c6d6da', 36) + '<rect y="230" width="960" height="8" fill="#9fbcc3"/>' +
      '<rect y="380" width="960" height="60" fill="#eef1f2"/>';
    for (var r = 0; r < 2; r++) for (var c = 0; c < 16; c++) if ((r + c) % 2) f += '<rect x="' + c * 60 + '" y="' + (380 + r * 30) + '" width="60" height="30" fill="#cdd6da"/>';
    return f + L(0, 380, 960, 380, '#9aa6b2', 3);
  }
  function towel(x) {   // a rail on the wall with a towel hanging from it
    return L(x - 44, 196, x + 44, 196, '#8aa4ad', 5) + '<circle cx="' + (x - 46) + '" cy="196" r="5" fill="#8aa4ad"/><circle cx="' + (x + 46) + '" cy="196" r="5" fill="#8aa4ad"/>' +
      '<rect x="' + (x - 32) + '" y="194" width="64" height="96" rx="4" fill="#c46b5a"/><rect x="' + (x - 32) + '" y="266" width="64" height="8" fill="#f6f2e6"/>';
  }
  function curtain(x0, x1) {   // a striped shower curtain hanging from rings, pleated hem
    var c = '', w = (x1 - x0) / 8;
    for (var k = 0; k < 8; k++) c += '<rect x="' + (x0 + k * w) + '" y="62" width="' + (w + 0.5) + '" height="292" fill="' + (k % 2 ? '#cfe3ea' : '#f4f9fa') + '"/>';
    var hem = 'M' + x0 + ' 354'; for (k = 0; k < 8; k++) hem += ' q' + (w / 2) + ' 10 ' + w + ' 0';
    c += '<path d="' + hem + ' l0 6 l-' + (x1 - x0) + ' 0Z" fill="#cfe3ea"/>';
    for (k = 0; k <= 8; k++) c += '<circle cx="' + (x0 + k * w) + '" cy="58" r="5" fill="none" stroke="#7d949b" stroke-width="2.5"/>';
    return c + '<rect x="' + x0 + '" y="62" width="' + (x1 - x0) + '" height="298" fill="none" stroke="#a9c4cc" stroke-width="2"/>';
  }
  function sink(x) {
    return '<rect x="' + (x - 66) + '" y="64" width="132" height="132" rx="10" fill="#bfa27a"/><rect x="' + (x - 58) + '" y="72" width="116" height="116" rx="6" fill="#dff1f7"/><path d="M' + (x - 40) + ' 92 l30 0 M' + (x - 40) + ' 104 l14 0" stroke="#ffffff" stroke-width="6" opacity=".8"/>' +
      '<path d="M' + (x - 72) + ' 248 l144 0 q0 40 -72 40 q-72 0 -72 -40Z" fill="#fbfbf8" stroke="#9aa6b2" stroke-width="3"/><path d="M' + (x - 22) + ' 286 l44 0 l-6 94 l-32 0Z" fill="#fbfbf8" stroke="#9aa6b2" stroke-width="3"/>' +
      '<path d="M' + x + ' 248 l0 -20 l20 0" fill="none" stroke="#8aa4ad" stroke-width="6" stroke-linecap="round"/><circle cx="' + (x - 26) + '" cy="242" r="5" fill="#8aa4ad"/><circle cx="' + (x + 30) + '" cy="242" r="5" fill="#8aa4ad"/>';
  }
  function family(st) {   // the kitchen table, mother, father, sister and the student
    var sitting = st === 'a', p = sitting ? 'sit' : 'stand';
    return '<rect x="300" y="290" width="380" height="16" rx="4" fill="#8a5a3a"/>' + L(320, 306, 320, 380, '#6f4429', 10) + L(660, 306, 660, 380, '#6f4429', 10) +
      '<ellipse cx="380" cy="286" rx="26" ry="6" fill="#ffffff"/><ellipse cx="490" cy="286" rx="26" ry="6" fill="#ffffff"/><ellipse cx="600" cy="286" rx="26" ry="6" fill="#ffffff"/>' +
      (sitting ? '' : '');
  }

  function scene(i, st, me) {   // st: 'b' before the answer, 'a' after
    var S = SCENES[i], a = st === 'a', night = S.sky === 'night', svg = '';
    var hairMe = me === 'chica' ? 'pony' : 'short';
    var meO = function (o) { o.hair = o.hair || hairMe; return o; };
    if (S.room === 'cuarto') {
      svg += wall('#efe2c4', night) + sky(S.sky) + bed(330) + (i === 10 ? '' : rack(880, i < 8 || (i === 8 && !a))) + clock(740, i === 0 && !a);
      if (i === 0) svg += fig(meO({ clothes: 'pj', sleep: !a, arm: a ? 'up' : 'down', yawn: a, messy: 1 }), 512, 280, 1.0, '', -90) + blanket(330);
      if (i === 1) svg += a ? fig(meO({ clothes: 'pj', messy: 1 }), 270, 380, 1.1) : fig(meO({ clothes: 'pj', messy: 1, yawn: 1 }), 512, 280, 1.0, '', -90) + blanket(330);
      if (i === 7) svg += fig(meO({ clothes: a ? 'dressed' : 'pj' }), 270, 380, 1.1) + (a ? '' : '<rect x="540" y="272" width="58" height="14" rx="4" fill="#f6f2e6" stroke="#9aa6b2" stroke-width="2"/><rect x="546" y="260" width="46" height="12" rx="3" fill="#3a4a6b"/>');   // clothes folded on the bed
      if (i === 8) svg += fig(meO({ clothes: a ? 'uniform' : 'dressed' }), 270, 380, 1.1);
      if (i === 10) svg += bed(80, 220) + (a ? fig({ hair: 'bow', clothes: 'pj', sleep: 1 }, 222, 280, 0.72, '', -90) + blanket(80, 220) + zzz(110, 240)
        : fig({ hair: 'bow', clothes: 'pj' }, 250, 380, 0.75)) + fig(meO({ clothes: 'dressed' }), 870, 380, 1.1);
      if (i === 11) svg += a ? fig(meO({ clothes: 'pj', sleep: 1 }), 512, 280, 1.0, '', -90) + blanket(330) + zzz(370, 240) : fig(meO({ clothes: 'pj', yawn: 1 }), 270, 380, 1.1);
    }
    if (S.room === 'ducha') {
      // the stall: tiled walls, a tray with a drain, a soap shelf, the shower head; curtain closed before, drawn back after
      svg += bathroom() + tiles(596, 308, 50, 372, '#d3e7ec', '#b3ccd3', 32) + L(596, 50, 596, 372, '#9fbcc3', 4) + L(904, 50, 904, 372, '#9fbcc3', 4) +
        '<rect x="586" y="364" width="328" height="20" rx="4" fill="#fbfbf8" stroke="#9aa6b2" stroke-width="3"/><ellipse cx="770" cy="368" rx="12" ry="3" fill="#9aa6b2"/>' +
        '<rect x="840" y="210" width="50" height="8" rx="2" fill="#fbfbf8" stroke="#9aa6b2" stroke-width="2"/><rect x="848" y="188" width="14" height="22" rx="3" fill="#4a9a8a"/><rect x="866" y="198" width="18" height="12" rx="4" fill="#f3d27a"/>' +
        '<path d="M770 50 l0 34 l-34 0" fill="none" stroke="#8aa4ad" stroke-width="7" stroke-linecap="round"/><path d="M718 86 l36 0 l-6 14 l-24 0Z" fill="#8aa4ad"/>' +
        towel(500) + '<rect x="620" y="388" width="220" height="16" rx="8" fill="#7fb3a8"/>' + L(586, 54, 914, 54, '#7d949b', 7) +
        (a ? '<g class="rt-water">' + [0, 1, 2, 3, 4, 5, 6].map(function (k) { return L(724 + k * 5, 102, 700 + k * 11, 190, '#5aa9d6', 3); }).join('') + '</g>' + fig(meO({}), 760, 364, 1.1) + curtain(600, 652)
           : fig(meO({ clothes: 'pj', messy: 1 }), 380, 380, 1.1) + curtain(600, 900));
    }
    if (S.room === 'lavabo' || S.room === 'espejo') {
      svg += bathroom() + sink(480) + towel(870) + '<rect x="380" y="392" width="200" height="14" rx="7" fill="#7fb3a8"/>';
      var meX = 610;
      if (i === 3) svg += fig(meO({ clothes: 'pj', arm: a ? 'face' : 'down', prop: a ? 'brush' : null }), meX, 380, 1.1) + (a ? '' : '<rect x="533" y="222" width="5" height="26" rx="2" fill="#4a9a8a" transform="rotate(14 535 240)"/><path d="M526 228 l20 0 l-2 20 l-16 0Z" fill="#f3d27a" stroke="#b8892e" stroke-width="1.5"/>');
      if (i === 4) svg += fig(meO({ clothes: 'pj', arm: a ? 'face' : 'down' }), meX, 380, 1.1) + (a ? '<g class="rt-water">' + [[-30, 0], [-22, -18], [26, -6], [32, 12]].map(function (p) { return '<circle cx="' + (meX + p[0]) + '" cy="' + (380 - 168 + p[1]) + '" r="4" fill="#5aa9d6"/>'; }).join('') + '</g>' : '');
      if (i === 5) svg += fig({ hair: 'short', must: 1, clothes: 'pj', arm: a ? 'face' : 'down', prop: a ? 'razor' : null, beard: !a }, 420, 380, 1.25) + fig(meO({ clothes: 'pj' }), 700, 380, 1.0);
      if (i === 6) svg += fig({ hair: 'short', must: 1, clothes: 'dressed' }, 300, 380, 1.25) + fig(meO({ clothes: 'pj', messy: !a, arm: a ? 'face' : 'down', prop: a ? 'comb' : null }), meX, 380, 1.1);
    }
    if (S.room === 'cocina') {
      svg += wall('#f3e7cf') + sky('day') + '<rect x="740" y="70" width="160" height="120" fill="#d9c4a0" stroke="#9c7b52" stroke-width="4"/>' + L(820, 70, 820, 190, '#9c7b52', 3) + '<rect x="740" y="286" width="160" height="94" fill="#e8e3d6" stroke="#8a8a8a" stroke-width="3"/><rect x="756" y="310" width="128" height="56" rx="4" fill="#3a3a3a"/><ellipse cx="780" cy="286" rx="22" ry="5" fill="#3a3a3a"/><ellipse cx="860" cy="286" rx="22" ry="5" fill="#3a3a3a"/><rect x="842" y="262" width="36" height="22" rx="4" fill="#9aa6b2"/>' + (a ? '' : family(st));
      var p = a ? 'sit' : 'stand', y = 380;
      [[350, { hair: 'long', clothes: 'dressed' }, 1.15], [450, { hair: 'short', must: 1, clothes: 'dressed' }, 1.25], [560, { hair: 'bow', clothes: 'dressed' }, 0.85], [650, meO({ clothes: 'uniform' }), 1.05]].forEach(function (f, k) {
        f[1].pose = p;
        var cx = f[0] - 10, seat = y - 48 * f[2];
        svg += a ? L(cx - 14, seat - 56, cx - 14, y, '#6f4429', 6) + L(cx - 14, seat, cx + 34 * f[2], seat, '#6f4429', 7) + L(cx + 34 * f[2], seat, cx + 34 * f[2], y, '#6f4429', 5) + fig(f[1], cx, y, f[2]) : fig(f[1], [130, 205, 712, 268][k], y, f[2]);
      });
      if (a) svg += family(st);
    }
    return '<svg viewBox="0 0 960 440" role="img" aria-label="Scene ' + (i + 1) + ': ' + esc(S.place) + ', ' + S.time + '">' + svg + '</svg>';
  }

  // ------------------------------------------------------------------ the game
  var CSS = '.rutina-game{font-family:inherit;color:#1a2340;max-width:980px;margin:0 auto}' +
    '.rt-frame{position:relative;border:3px solid #b8892e;border-radius:8px;overflow:hidden;background:#fffdf7}' +
    '.rt-top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 14px;background:#0e1c42;color:#f6efd0;font-size:17px}' +
    '.rt-top .rt-clock{font-family:"Courier New",monospace;font-size:24px;font-weight:700;background:#000;color:#ffcf5a;padding:2px 10px;border-radius:5px;letter-spacing:1px}' +
    '.rt-dots{display:flex;gap:5px}.rt-dots span{width:12px;height:12px;border-radius:50%;background:#46557e;display:inline-block}.rt-dots span.ok{background:#2e9e5b}.rt-dots span.now{background:#ffcf5a}' +
    '.rt-stage{position:relative}.rt-stage svg{display:block;width:100%;height:auto}' +
    '.rt-stage .rt-a{position:absolute;inset:0;opacity:0;transition:opacity .9s}.rt-stage.done .rt-a{opacity:1}.rt-stage.done .rt-b{opacity:0;transition:opacity .9s}' +
    '.rt-bubble{position:relative;margin:14px 16px 6px;background:#ffffff;border:3px solid #1a2340;border-radius:16px;padding:14px 18px;font-size:24px;line-height:1.6}' +
    '.rt-bubble:before{content:"";position:absolute;top:-16px;left:var(--tail,50%);border:13px solid transparent;border-bottom-color:#1a2340;border-top:0}' +
    '.rt-bubble select{font-size:22px;font-family:inherit;padding:3px 6px;margin:0 6px;border:2px solid #b8892e;border-radius:6px;background:#fffbea;color:#1a2340;cursor:pointer;max-width:100%}' +
    '.rt-bubble select.ok{border-color:#2e9e5b;background:#e3f5ea}.rt-bubble select.no{border-color:#c0392b;background:#fdecea}' +
    '.rt-en{font-size:17px;color:#5f554a;margin-top:4px;display:none}.rt-bubble.solved .rt-en{display:block}' +
    '.rt-why{margin:6px 16px 0;padding:10px 14px;border-radius:6px;font-size:18px;line-height:1.5;display:none}.rt-why.show{display:block}' +
    '.rt-why.no{background:#fdecea;border-left:5px solid #c0392b}.rt-why.ok{background:#e3f5ea;border-left:5px solid #2e9e5b}' +
    '.rt-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 16px 14px;flex-wrap:wrap}' +
    '.rt-btn{font-size:18px;font-weight:700;padding:9px 20px;border-radius:8px;border:2px solid #8e1b2c;background:#8e1b2c;color:#fff;cursor:pointer;font-family:inherit}' +
    '.rt-btn.alt{background:#fff;color:#8e1b2c}.rt-btn[disabled]{opacity:.35;cursor:default}' +
    '.rt-say{font-size:18px;border:0;background:#1d4e8f;color:#fff;border-radius:50%;width:40px;height:40px;cursor:pointer;vertical-align:middle;margin-right:6px}' +
    '.rt-top .rt-place{font-size:16px;color:#f6efd0}' +
    '.rt-card{padding:26px 22px;text-align:center}.rt-card h3{font-family:"IM Fell English SC",Garamond,Georgia,serif;font-size:40px;color:#8e1b2c;margin:0 0 6px;font-weight:400}' +
    '.rt-card p{font-size:19px;line-height:1.6;margin:6px auto;max-width:640px}' +
    '.rt-pick{display:flex;justify-content:center;gap:26px;margin:16px 0 6px;flex-wrap:wrap}.rt-pick button{background:#fffbea;border:3px solid #b8892e;border-radius:12px;padding:6px 18px 10px;cursor:pointer;font-size:22px;font-weight:700;color:#1a2340;font-family:inherit}' +
    '.rt-pick button:hover,.rt-pick button:focus{border-color:#8e1b2c;background:#fff3d6}.rt-pick svg{display:block;width:130px;height:170px}' +
    '.rt-list{text-align:left;max-width:640px;margin:12px auto;font-size:19px;line-height:1.9;padding:0;list-style:none}' +
    '.rt-scrub{animation:rtScrub .32s ease-in-out infinite alternate}@keyframes rtScrub{from{transform:translateX(-3px)}to{transform:translateX(4px)}}' +
    '.rt-ring{animation:rtRing .12s linear infinite alternate}@keyframes rtRing{from{transform:translateX(-2px)}to{transform:translateX(2px)}}' +
    '.rt-water{animation:rtWater .5s linear infinite}@keyframes rtWater{from{transform:translateY(-6px);opacity:.6}to{transform:translateY(8px);opacity:1}}' +
    '.rt-zzz{animation:rtZ 1.8s ease-in-out infinite}@keyframes rtZ{0%{transform:translateY(6px);opacity:.3}50%{opacity:1}100%{transform:translateY(-8px);opacity:.3}}' +
    '@media (prefers-reduced-motion:reduce){.rt-scrub,.rt-ring,.rt-water,.rt-zzz{animation:none}}';

  function Game(el) {
    this.el = el;
    try { this.cfg = JSON.parse(el.getAttribute('data-rutina') || '{}'); } catch (e) { this.cfg = {}; }
    this.base = this.cfg.audioBase || '../../audio/';
    this.audio = new Audio();
    this.start();
  }
  var gp = Game.prototype;
  gp.play = function (clip) { try { this.audio.pause(); this.audio.src = this.base + clip; this.audio.currentTime = 0; var p = this.audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} };
  gp.clip = function (i) { return 'grammar/s2m4-dia-' + (i < 9 ? '0' : '') + (i + 1) + '.mp3'; };
  gp.sentence = function (i) { var S = SCENES[i], ok = S.opts.filter(function (o) { return o[1]; })[0][0]; return ((S.pre ? S.pre + ' ' : '') + ok + (S.post === '.' ? '.' : ' ' + S.post)).replace(/^./, function (c) { return c.toUpperCase(); }); };

  gp.start = function () {
    var self = this;
    var pick = function (who) { return '<button type="button" data-who="' + who + '"><svg viewBox="-60 -170 120 180">' + body({ hair: who === 'chica' ? 'pony' : 'short', clothes: 'pj' }) + '</svg>' + (who === 'chica' ? 'una chica' : 'un chico') + '</button>'; };
    this.el.innerHTML = '<div class="rt-frame"><div class="rt-card"><h3>' + esc(this.cfg.title || 'Mi día') + '</h3>' +
      '<p>It is a school day. Live it from the alarm clock to bedtime. Each time you say what you are doing, choose the right form from the menu.</p>' +
      '<p><strong>Who are you today?</strong></p><div class="rt-pick">' + pick('chica') + pick('chico') + '</div></div></div>';
    this.el.querySelectorAll('.rt-pick button').forEach(function (b) { b.addEventListener('click', function () { self.me = b.getAttribute('data-who'); self.i = 0; self.firstTry = 0; self.missed = {}; self.go(); }); });
  };

  gp.go = function () {
    var self = this, i = this.i, S = SCENES[i];
    var dots = SCENES.map(function (s, k) { return '<span class="' + (k < i ? 'ok' : k === i ? 'now' : '') + '"></span>'; }).join('');
    var opts = '<option value="">&mdash; elige &mdash;</option>' + S.opts.map(function (o, k) { return k; }).sort(function () { return Math.random() - 0.5; }).map(function (k) { return '<option value="' + k + '">' + esc(S.opts[k][0]) + '</option>'; }).join('');   // order shuffled each time; value = the option's index
    this.el.innerHTML = '<div class="rt-frame"><div class="rt-top"><span class="rt-place">' + esc(S.place) + ' &middot; escena ' + (i + 1) + ' de ' + SCENES.length + '</span><span class="rt-dots">' + dots + '</span><span class="rt-clock">' + S.time + '</span></div>' +
      '<div class="rt-stage"><div class="rt-b">' + scene(i, 'b', this.me) + '</div><div class="rt-a">' + scene(i, 'a', this.me) + '</div></div>' +
      '<div class="rt-bubble" style="--tail:' + this.tail(i) + '"><button type="button" class="rt-say" aria-label="Escuchar" title="Listen" style="display:none">&#128266;</button>' +
      esc(S.pre) + '<select aria-label="Choose the right form">' + opts + '</select>' + (S.post === '.' ? '' : ' ') + esc(S.post) + '<div class="rt-en">' + esc(S.en) + '</div></div>' +
      '<div class="rt-why"></div><div class="rt-bar"><button type="button" class="rt-btn alt rt-restart">Start over</button><button type="button" class="rt-btn rt-next" disabled>' + (i === SCENES.length - 1 ? 'Finish the day &#9654;' : 'Next &#9654;') + '</button></div></div>';
    var sel = this.el.querySelector('select'), why = this.el.querySelector('.rt-why'), next = this.el.querySelector('.rt-next'), say = this.el.querySelector('.rt-say');
    var tries = 0;
    sel.addEventListener('change', function () {
      if (sel.value === '') return;
      var o = S.opts[+sel.value]; tries++;
      why.innerHTML = o[2]; why.className = 'rt-why show ' + (o[1] ? 'ok' : 'no');
      sel.className = o[1] ? 'ok' : 'no';
      if (o[1]) {
        if (tries === 1) self.firstTry++; else self.missed[i] = 1;
        sel.disabled = true; next.disabled = false; say.style.display = '';
        self.el.querySelector('.rt-stage').classList.add('done');
        self.el.querySelector('.rt-bubble').classList.add('solved');
        self.play(self.clip(i)); next.focus();
      }
    });
    say.addEventListener('click', function () { self.play(self.clip(i)); });
    next.addEventListener('click', function () { self.i++; if (self.i < SCENES.length) self.go(); else self.end(); });
    this.el.querySelector('.rt-restart').addEventListener('click', function () { self.start(); });
    sel.focus({ preventScroll: true });
    if (i === 0) this.play('game/despertador-ring.mp3');   // the alarm clock rings as the day starts (the click on chica / chico lets it play)
  };
  gp.tail = function (i) { var r = SCENES[i].room; return r === 'ducha' ? '72%' : r === 'cocina' ? '64%' : r === 'lavabo' || r === 'espejo' ? (i === 5 ? '42%' : '56%') : i === 10 ? '24%' : '52%'; };

  gp.end = function () {
    var self = this, n = SCENES.length;
    var list = SCENES.map(function (s, k) { return '<li><button type="button" class="rt-say" data-k="' + k + '" aria-label="Escuchar">&#128266;</button> <span style="font-family:Courier New,monospace;color:#5f554a;font-size:16px">' + s.time + '</span> ' + esc(self.sentence(k)) + '</li>'; }).join('');
    this.el.innerHTML = '<div class="rt-frame"><div class="rt-top"><span class="rt-place">Fin del día</span><span class="rt-dots">' + SCENES.map(function () { return '<span class="ok"></span>'; }).join('') + '</span><span class="rt-clock">22:30</span></div>' +
      '<div class="rt-card"><h3>&iexcl;Esta es mi rutina!</h3><button type="button" class="rt-say rt-fin" aria-label="Escuchar">&#128266;</button>' +
      '<p>You lived a whole day in Spanish: <strong>' + this.firstTry + ' of ' + n + '</strong> right on the first try.' + (this.firstTry === n ? ' &iexcl;Perfecto!' : ' Play again and aim for all ' + n + '.') + '</p>' +
      '<ul class="rt-list">' + list + '</ul><div class="rt-bar" style="justify-content:center"><button type="button" class="rt-btn rt-again">Play again</button></div></div></div>';
    this.el.querySelectorAll('.rt-list .rt-say').forEach(function (b) { b.addEventListener('click', function () { self.play(self.clip(+b.getAttribute('data-k'))); }); });
    this.el.querySelector('.rt-fin').addEventListener('click', function () { self.play('grammar/s2m4-dia-fin.mp3'); });
    this.el.querySelector('.rt-again').addEventListener('click', function () { self.start(); });
    this.play('grammar/s2m4-dia-fin.mp3');
    try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: this.cfg.title || 'Mi día', done: true, summary: 'Lived the whole day; ' + this.firstTry + ' of ' + n + ' right on the first try' } })); } catch (e) {}
  };

  function boot() {
    if (!document.getElementById('rutina-css')) { var st = document.createElement('style'); st.id = 'rutina-css'; st.textContent = CSS; document.head.appendChild(st); }
    document.querySelectorAll('.rutina-game').forEach(function (el) { if (!el.__rt) { el.__rt = new Game(el); } });
  }
  window.RUTINA_SENTENCES = function () { return SCENES.map(function (s, k) { return Game.prototype.sentence.call(null, k); }); };
  window.RUTINA_SCENE = scene;   // for the build's contact-sheet check
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* origen.js: "¿De dónde viene?" (Spanish 1 S2, Lesson 3.05; David 2026-11-17: "point to each bold verb" must be
   interactive, so we know the student can trace each conjugated verb back to its infinitive).
   Step 1: the bold verbs in the reading above become clickable; the student clicks one, then the infinitive it comes
   from. A wrong match gets a pointer. Step 2: retell it about Fernanda (ella): pick the ella form, not the yo form.
   Markup: <div class="origen" data-origen='{"verbs":[{"form","inf","hint"}], "retell":[{"pre","post","yo","ella","why"}]}'></div>
   placed in the same card as the reading. Practice only; reports to All Your Work with a 'mw-game' event when done. */
(function () {
  'use strict';
  var CSS =
    '.og{margin:14px 0 0;background:#fbf6ea;border:1px solid #e2d6bb;border-top:3px solid #b8892e;border-radius:6px;padding:16px 18px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1a2340}' +
    '.og h4{margin:0 0 4px;font:700 13px "Segoe UI",Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8e1b2c}' +
    '.og p{margin:0 0 10px;font-size:17px;line-height:1.55}' +
    '.og-v{cursor:pointer;border-radius:5px;padding:0 4px;box-shadow:inset 0 -2px 0 #b8892e;background:#fff4d6;position:relative;outline:none}' +
    '.og-v:hover,.og-v:focus{background:#f6e3b0}.og-v.sel{background:#8e1b2c;color:#fff;box-shadow:none}' +
    '.og-v.ok{background:#e3f2e6;color:#1d5e20;box-shadow:inset 0 -2px 0 #2A9D5C;cursor:default}' +
    '.og-v .og-tag{position:absolute;left:50%;top:100%;transform:translateX(-50%);font:600 12px "Segoe UI",Arial,sans-serif;color:#1d5e20;white-space:nowrap;line-height:1.2}' +
    '.og-passage-on{line-height:2.25 !important}' +
    '.og-infs{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 6px}' +
    '.og-infs button,.og-opts button{font:700 19px "Segoe UI",Arial,sans-serif;background:#fff;color:#1a2340;border:2px solid #c9b58a;border-radius:999px;padding:6px 18px;cursor:pointer}' +
    '.og-infs button:hover,.og-opts button:hover{background:#f7ecd2}.og-infs button.done{background:#2A9D5C;border-color:#2A9D5C;color:#fff;cursor:default}' +
    '.og-opts button.no{background:#fbe8e5;border-color:#C0392B;color:#8f1d12}.og-opts button.ok{background:#2A9D5C;border-color:#2A9D5C;color:#fff}' +
    '.og-fb{min-height:26px;font-size:17px;line-height:1.5;margin:6px 0 0}.og-fb.no{color:#8f1d12}.og-fb.ok{color:#1d5e20;font-weight:600}' +
    '.og-line{font-size:20px;margin:6px 0 8px}.og-blank{display:inline-block;min-width:90px;border-bottom:2px dashed #b8892e;text-align:center;color:#8e1b2c;font-weight:700}' +
    '.og-opts{display:flex;flex-wrap:wrap;gap:10px}.og-dots{display:flex;gap:6px;margin:10px 0 0}.og-dots i{width:13px;height:13px;border-radius:50%;background:#d9ccb0}.og-dots i.done{background:#2A9D5C}.og-dots i.on{background:#b8892e}' +
    '.og-next{margin-top:10px;font:600 16px "Segoe UI",Arial,sans-serif;background:#1a2340;color:#fff;border:0;border-radius:999px;padding:8px 20px;cursor:pointer}.og-next[hidden]{display:none}' +
    '.og .shake{animation:ogshake .4s}@keyframes ogshake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function shake(n) { n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); }

  function Origen(root) {
    var cfg = JSON.parse(root.getAttribute('data-origen')), f = this;
    this.cfg = cfg; this.root = root; root.classList.add('og'); this.sel = null; this.done = 0; this.wrong = 0;
    var card = root.closest('.sg-card') || root.parentNode;
    var byForm = {}; cfg.verbs.forEach(function (v) { byForm[v.form.toLowerCase()] = v; });
    // 1 · the bold verbs in the reading become clickable
    this.vEls = [];
    [].forEach.call(card.querySelectorAll('strong'), function (s) {
      if (root.contains(s)) return;
      var v = byForm[s.textContent.trim().toLowerCase()];
      if (!v || v.el) return;
      v.el = s; s.classList.add('og-v'); s.tabIndex = 0; s.setAttribute('role', 'button');
      s.setAttribute('aria-label', s.textContent + ': choose its infinitive');
      var pick = function () { f.pickVerb(v); };
      s.addEventListener('click', pick); s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      if (s.parentNode && s.parentNode.tagName === 'P') s.parentNode.classList.add('og-passage-on');
      f.vEls.push(v);
    });
    root.appendChild(el('h4', null, '&#11088; &iquest;De d&oacute;nde viene? &middot; Where does each verb come from?'));
    root.appendChild(el('p', null, '<strong>Click a bold verb in the reading</strong>, then click the <strong>infinitive</strong> it comes from. Match all six.'));
    this.infs = el('div', 'og-infs'); root.appendChild(this.infs);
    shuffle(cfg.verbs.slice()).forEach(function (v) {
      var b = el('button', null, v.inf); b.type = 'button'; b.lang = 'es';
      b.addEventListener('click', function () { f.pickInf(v, b); }); v.btn = b; f.infs.appendChild(b);
    });
    this.fb = el('div', 'og-fb'); this.fb.setAttribute('aria-live', 'polite'); root.appendChild(this.fb);
    this.step2 = el('div'); root.appendChild(this.step2);
  }
  var op = Origen.prototype;
  op.pickVerb = function (v) {
    if (v.matched) return;
    this.vEls.forEach(function (x) { if (x.el) x.el.classList.remove('sel'); });
    this.sel = v; v.el.classList.add('sel');
    this.fb.className = 'og-fb'; this.fb.innerHTML = '<em>' + v.form + '</em>: now click the infinitive it comes from.';
  };
  op.pickInf = function (v, b) {
    if (b.classList.contains('done')) return;
    if (!this.sel) { this.fb.className = 'og-fb no'; this.fb.innerHTML = 'First click a bold verb in the reading.'; shake(b); return; }
    var s = this.sel;
    if (v !== s) { this.wrong++; shake(b); this.fb.className = 'og-fb no'; this.fb.innerHTML = 'Not <strong>' + v.inf + '</strong>. ' + s.hint; return; }
    s.matched = true; s.el.classList.remove('sel'); s.el.classList.add('ok'); s.el.removeAttribute('tabindex');
    s.el.appendChild(el('span', 'og-tag', '&larr; ' + s.inf)); b.classList.add('done'); this.sel = null; this.done++;
    this.fb.className = 'og-fb ok'; this.fb.innerHTML = '&#10003; <em>' + s.form + '</em> &larr; <strong>' + s.inf + '</strong>';
    if (this.done === this.cfg.verbs.length) this.retell();
  };
  op.retell = function () {
    var f = this, R = this.cfg.retell, i = 0;
    this.fb.className = 'og-fb ok'; this.fb.innerHTML = '&#10003; All six matched. Every one of them is the special <em>yo</em> form.';
    var box = this.step2;
    box.appendChild(el('h4', null, '<span style="display:block;margin-top:16px">Ahora, Fernanda &middot; Tell it about her</span>'));
    box.appendChild(el('p', null, 'Now the sentences are about Fernanda: <em>ella</em>. Choose the right form for each one.'));
    var line = el('div', 'og-line'), opts = el('div', 'og-opts'), fb = el('div', 'og-fb'), dots = el('div', 'og-dots'), next = el('button', 'og-next', 'Next &rarr;');
    fb.setAttribute('aria-live', 'polite'); next.type = 'button'; next.hidden = true;
    [line, opts, fb, dots, next].forEach(function (n) { box.appendChild(n); });
    R.forEach(function () { dots.appendChild(el('i')); });
    var wrong = 0;
    function show() {
      [].forEach.call(dots.children, function (d, k) { d.className = k < i ? 'done' : k === i ? 'on' : ''; });
      next.hidden = true; fb.className = 'og-fb'; fb.innerHTML = '';
      if (i >= R.length) return finish();
      var r = R[i], done = false;
      line.innerHTML = r.pre + ' <span class="og-blank">___</span> ' + r.post;
      opts.innerHTML = '';
      shuffle([r.yo, r.ella]).forEach(function (o) {
        var b = el('button', null, o); b.type = 'button'; b.lang = 'es';
        b.addEventListener('click', function () {
          if (done) return;
          if (o === r.ella) {
            done = true; b.classList.add('ok'); line.querySelector('.og-blank').textContent = o;
            fb.className = 'og-fb ok'; fb.innerHTML = '&#10003; ' + r.why;
            next.hidden = false; next.innerHTML = i < R.length - 1 ? 'Next &rarr;' : 'Finish &rarr;';
          } else { wrong++; f.wrong++; b.classList.add('no'); shake(b); fb.className = 'og-fb no'; fb.innerHTML = 'Not <strong>' + o + '</strong>: that is the <em>yo</em> form. The special form is only for <em>yo</em>; with <em>ella</em> the verb is regular.'; }
        });
        opts.appendChild(b);
      });
    }
    function finish() {
      line.innerHTML = ''; opts.innerHTML = '';
      fb.className = 'og-fb ok';
      fb.innerHTML = '&iexcl;Muy bien! Six verbs traced to their infinitives, and Fernanda&rsquo;s story retold with <em>ella</em>.' + (f.wrong ? '' : ' No wrong turns at all.');
      try { window.dispatchEvent(new CustomEvent('mw-game', { detail: { name: '¿De dónde viene? (3.05)', done: true, summary: 'six verbs matched, story retold with ella; ' + f.wrong + ' wrong tries along the way' } })); } catch (e) {}
    }
    next.addEventListener('click', function () { i++; show(); });
    show();
  };

  function boot() {
    if (!document.getElementById('og-css')) { var s = document.createElement('style'); s.id = 'og-css'; s.textContent = CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll('.origen'), function (r) { if (!r.dataset.ogReady) { r.dataset.ogReady = '1'; try { new Origen(r); } catch (e) { if (window.console) console.error('origen', e); } } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* clave.js: a clickable WORD KEY beside "A producir" (Spanish 1 S2; David 2026-11-17: no A producir without a word bank
   and a vocab key, as in French vocabkey.js and Spanish 2.04). Markup: inside a <div class="jt-grid"> put the prompts in
   <div class="jt-items"> and the key in <aside class="jt-key">. Every <b> in the key's lists becomes a button: clicking it
   types the Spanish into the writing box the student last used (at the cursor, spaces added as needed). A <b data-w="…">
   types data-w instead of its label (e.g. "querer (ie)" types "querer"). A reference, not an answer. */
(function () {
  'use strict';
  var CSS = '.jt-key b.ck-w{cursor:pointer;color:#1d4e8f;border-bottom:1px dotted #9fb3cc}.jt-key b.ck-w:hover,.jt-key b.ck-w:focus{color:#8e1b2c;border-bottom-color:#8e1b2c;outline:none}' +
    '.jt-key .ck-help{font-size:13px;color:#5f554a;margin:0 0 6px;line-height:1.4}.jt-key .ck-ok{font-size:13px;color:#2f6b4f;min-height:17px;margin-top:6px}';
  var DET = /(?:^|\s)(el|la|los|las|un|una|al|del)\s*$/i;
  function boot() {
    var keys = document.querySelectorAll('aside.jt-key');
    if (!keys.length) return;
    if (!document.getElementById('ck-css')) { var st = document.createElement('style'); st.id = 'ck-css'; st.textContent = CSS; document.head.appendChild(st); }
    [].forEach.call(keys, function (key) {
      if (key.dataset.ckReady) return; key.dataset.ckReady = '1';
      var grid = key.closest('.jt-grid'); if (!grid) return;
      var boxes = [].slice.call(grid.querySelectorAll('textarea'));
      if (!boxes.length) return;
      var last = boxes[0];
      boxes.forEach(function (b) { b.addEventListener('focus', function () { last = b; }); });
      var help = document.createElement('div'); help.className = 'ck-help';
      help.textContent = 'Click a word to type it into the box you are writing in.';
      var h4 = key.querySelector('h4'); if (h4) h4.parentNode.insertBefore(help, h4.nextSibling); else key.insertBefore(help, key.firstChild);
      var ok = document.createElement('div'); ok.className = 'ck-ok'; ok.setAttribute('aria-live', 'polite'); key.appendChild(ok);
      [].forEach.call(key.querySelectorAll('li b'), function (w) {
        w.className = 'ck-w'; w.setAttribute('role', 'button'); w.setAttribute('tabindex', '0'); w.lang = 'es';
        var put = function () {
          var t = (w.getAttribute('data-w') || w.textContent).replace(/\s*\(.*?\)\s*/g, ' ').replace(/…/g, '').trim();
          var s = last.selectionStart != null ? last.selectionStart : last.value.length, en = last.selectionEnd != null ? last.selectionEnd : s;
          var before = last.value.slice(0, s);
          if (DET.test(before)) t = t.replace(/^(el|la|los|las) /i, '');          // "en el" + "el semáforo" -> "en el semáforo"
          var ins = (!before || /\s$/.test(before) ? '' : ' ') + t + ' ';
          last.value = before + ins + last.value.slice(en); last.focus(); last.setSelectionRange(s + ins.length, s + ins.length);
          last.dispatchEvent(new Event('input', { bubbles: true })); ok.textContent = '+ ' + t;
        };
        w.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep the cursor in the box
        w.addEventListener('click', put);
        w.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); put(); } });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

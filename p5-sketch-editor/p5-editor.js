/**
 * p5 Sketch Editor — een minimale, herbruikbare live-editor voor p5.js.
 *
 * Gebruik: plaats ergens op de pagina
 *
 *   <div class="p5-editor">
 *     <script type="text/p5">
 *       function setup() { createCanvas(400, 400); }
 *       function draw()  { background(220); circle(mouseX, mouseY, 40); }
 *     </script>
 *   </div>
 *
 * en laad dit script. Elke .p5-editor wordt automatisch een editor met
 * een code-paneel links en een live preview rechts.
 *
 * Teksten staan in lang/nl.json en lang/en.json; de taalknop (NL/EN) onthoudt
 * de keuze in localStorage. Lukt het laden niet (bv. via file://), dan wordt
 * teruggevallen op de ingebouwde NL-teksten.
 */
(function () {
  'use strict';

  // Welke p5-versie de previews gebruiken. Pas hier één keer aan.
  var P5_CDN = 'https://cdn.jsdelivr.net/npm/p5@2.2.3/lib/p5.min.js';

  // Ingebouwde fallback-teksten (zodat het ook zonder server werkt).
  var FALLBACK = { title: 'p5.js', run: 'Run', reset: 'Reset' };

  // Map van dit script, zodat lang/ relatief klopt los van de host-pagina.
  var SELF = (document.currentScript && document.currentScript.src) || '';
  var BASE = SELF.replace(/[^/]*$/, '');

  function currentLang() {
    var l = localStorage.getItem('p5e-lang') || document.documentElement.lang || 'nl';
    return l === 'en' ? 'en' : 'nl';
  }

  // Laad de teksten van de gekozen taal en roep cb(strings, lang) aan.
  function loadStrings(cb) {
    var lang = currentLang();
    fetch(BASE + 'lang/' + lang + '.json')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (s) { cb(Object.assign({}, FALLBACK, s), lang); })
      .catch(function () { cb(FALLBACK, lang); });
  }

  // Bouw één editor in de gegeven container.
  function createEditor(container, S, lang) {
    var script = container.querySelector('script[type="text/p5"]');
    var code = script ? script.textContent.trim() : (container.dataset.code || '');

    container.innerHTML =
      '<div class="p5e-bar">' +
      '  <span class="p5e-title">' + S.title + '</span>' +
      '  <span class="p5e-actions">' +
      '    <button class="p5e-btn p5e-run" type="button">' + S.run + '</button>' +
      '    <button class="p5e-btn p5e-reset" type="button">' + S.reset + '</button>' +
      '    <span class="p5e-lang">' +
      '      <a href="#" data-lang="nl"' + (lang === 'nl' ? ' class="is-current"' : '') + '>NL</a>' +
      '      <a href="#" data-lang="en"' + (lang === 'en' ? ' class="is-current"' : '') + '>EN</a>' +
      '    </span>' +
      '  </span>' +
      '</div>' +
      '<div class="p5e-split">' +
      '  <textarea class="p5e-code" spellcheck="false"></textarea>' +
      '  <iframe class="p5e-preview" title="p5 preview"></iframe>' +
      '</div>';

    var textarea = container.querySelector('.p5e-code');
    var preview = container.querySelector('.p5e-preview');
    var original = code;
    textarea.value = code;

    // Bouw een complete HTML-pagina met p5 + de code, en toon die in het iframe.
    function run() {
      var sketch = textarea.value;
      preview.srcdoc =
        '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<script src="' + P5_CDN + '"><\/script>' +
        '<style>body{margin:0;overflow:hidden}</style></head><body><script>' +
        'try{\n' + sketch + '\n}catch(e){' +
        'document.body.innerHTML=' +
        '"<pre style=\\"color:#c00;font:13px monospace;padding:12px;white-space:pre-wrap\\">"' +
        '+e+"<\\/pre>";console.error(e);}' +
        '<\/script></body></html>';
    }

    container.querySelector('.p5e-run').addEventListener('click', run);
    container.querySelector('.p5e-reset').addEventListener('click', function () {
      textarea.value = original;
      run();
    });

    // Taalknop: keuze onthouden en de pagina herladen.
    container.querySelectorAll('.p5e-lang a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.setItem('p5e-lang', a.dataset.lang);
        location.reload();
      });
    });

    // Tab in de textarea voegt twee spaties in i.p.v. focus te verplaatsen.
    textarea.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      var s = textarea.selectionStart;
      var end = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, s) + '  ' + textarea.value.slice(end);
      textarea.selectionStart = textarea.selectionEnd = s + 2;
    });

    run(); // Auto-run bij laden.
  }

  function init(S, lang) {
    var list = document.querySelectorAll('.p5-editor:not([data-ready])');
    for (var i = 0; i < list.length; i++) {
      list[i].setAttribute('data-ready', '');
      createEditor(list[i], S, lang);
    }
  }

  loadStrings(function (S, lang) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { init(S, lang); });
    } else {
      init(S, lang);
    }
    window.P5Editor = { init: function () { init(S, lang); } };
  });
})();

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
 * Geen build-stap, geen dependencies. p5.js wordt uit de CDN geladen
 * in een afgeschermde iframe, zodat de sketch de pagina niet kan breken.
 */
(function () {
  'use strict';

  // Welke p5-versie de previews gebruiken. Pas hier één keer aan.
  var P5_CDN = 'https://cdn.jsdelivr.net/npm/p5@2.2.3/lib/p5.min.js';

  // Bouw één editor in de gegeven container.
  function createEditor(container) {
    // Code ophalen: uit <script type="text/p5"> of uit data-code="".
    var script = container.querySelector('script[type="text/p5"]');
    var code = script ? script.textContent.trim() : (container.dataset.code || '');

    container.innerHTML =
      '<div class="p5e-bar">' +
      '  <span class="p5e-title">p5.js</span>' +
      '  <span class="p5e-actions">' +
      '    <button class="p5e-btn p5e-run" type="button">Run</button>' +
      '    <button class="p5e-btn p5e-reset" type="button">Reset</button>' +
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

  // Initialiseer alle .p5-editor containers die nog niet klaar zijn.
  function init() {
    var list = document.querySelectorAll('.p5-editor:not([data-ready])');
    for (var i = 0; i < list.length; i++) {
      list[i].setAttribute('data-ready', '');
      createEditor(list[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Mini publieke API, voor het geval je editors dynamisch toevoegt.
  window.P5Editor = { init: init };
})();

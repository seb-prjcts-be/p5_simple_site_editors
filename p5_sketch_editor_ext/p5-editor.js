/**
 * p5 Sketch Editor — extended.
 *
 * Een live-editor met DRIE bewerkbare bestanden (HTML, CSS, JS) en een
 * gecombineerde preview. Dezelfde look als de basisversie; de code-kant
 * heeft nu tabs i.p.v. één veld.
 *
 * Gebruik: wijs naar drie echte bestanden die naast elkaar staan.
 *
 *   <div class="p5-editor"
 *        data-html="demo/index.html"
 *        data-css="demo/style.css"
 *        data-js="demo/script.js"></div>
 *
 * en laad dit script. De bestanden worden ingeladen (fetch), getoond in
 * de tabs, en samengevoegd tot één pagina in een afgeschermd iframe.
 * Draait op een server (Apache/localhost) — niet via file://.
 */
(function () {
  'use strict';

  var FILES = ['html', 'css', 'js']; // volgorde van de tabs

  function createEditor(container) {
    // Welke bestanden horen bij deze editor?
    var sources = {
      html: container.dataset.html || '',
      css: container.dataset.css || '',
      js: container.dataset.js || ''
    };

    container.innerHTML =
      '<div class="p5e-bar">' +
      '  <span class="p5e-tabs">' +
      '    <button class="p5e-tab is-active" type="button" data-file="html">HTML</button>' +
      '    <button class="p5e-tab" type="button" data-file="css">CSS</button>' +
      '    <button class="p5e-tab" type="button" data-file="js">JS</button>' +
      '  </span>' +
      '  <span class="p5e-actions">' +
      '    <button class="p5e-btn p5e-run" type="button">Run</button>' +
      '    <button class="p5e-btn p5e-reset" type="button">Reset</button>' +
      '  </span>' +
      '</div>' +
      '<div class="p5e-split">' +
      '  <div class="p5e-code-panel">' +
      '    <textarea class="p5e-code is-active" spellcheck="false" data-file="html"></textarea>' +
      '    <textarea class="p5e-code" spellcheck="false" data-file="css"></textarea>' +
      '    <textarea class="p5e-code" spellcheck="false" data-file="js"></textarea>' +
      '  </div>' +
      '  <iframe class="p5e-preview" title="preview"></iframe>' +
      '</div>';

    var preview = container.querySelector('.p5e-preview');
    var areas = {};    // file -> textarea
    var original = {}; // file -> originele inhoud (voor Reset)

    FILES.forEach(function (file) {
      areas[file] = container.querySelector('.p5e-code[data-file="' + file + '"]');
    });

    // Voeg HTML, CSS en JS samen tot één pagina in het iframe.
    function run() {
      preview.srcdoc =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
        areas.css.value +
        '</style></head><body>' +
        areas.html.value +
        '<script>try{\n' + areas.js.value + '\n}catch(e){' +
        'document.body.insertAdjacentHTML("beforeend",' +
        '"<pre style=\\"color:#c00;font:13px monospace;padding:12px;white-space:pre-wrap\\">"' +
        '+e+"<\\/pre>");console.error(e);}<\/script>' +
        '</body></html>';
    }

    // Tabs wisselen.
    container.querySelector('.p5e-tabs').addEventListener('click', function (e) {
      var tab = e.target.closest('.p5e-tab');
      if (!tab) return;
      var file = tab.dataset.file;
      container.querySelectorAll('.p5e-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
      });
      FILES.forEach(function (f) {
        areas[f].classList.toggle('is-active', f === file);
      });
      areas[file].focus();
    });

    container.querySelector('.p5e-run').addEventListener('click', run);
    container.querySelector('.p5e-reset').addEventListener('click', function () {
      FILES.forEach(function (f) { areas[f].value = original[f]; });
      run();
    });

    // Tab in een veld voegt twee spaties in.
    FILES.forEach(function (f) {
      areas[f].addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        var s = this.selectionStart, end = this.selectionEnd;
        this.value = this.value.slice(0, s) + '  ' + this.value.slice(end);
        this.selectionStart = this.selectionEnd = s + 2;
      });
    });

    // Laad de drie bestanden in, vul de velden, en draai.
    Promise.all(FILES.map(function (file) {
      if (!sources[file]) return Promise.resolve('');
      return fetch(sources[file])
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        })
        .catch(function () {
          return '/* kon ' + sources[file] + ' niet laden */';
        });
    })).then(function (contents) {
      FILES.forEach(function (file, i) {
        var text = contents[i].replace(/\s+$/, '');
        areas[file].value = text;
        original[file] = text;
      });
      run();
    });
  }

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

  window.P5Editor = { init: init };
})();

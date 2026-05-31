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
  var MODES = { html: 'htmlmixed', css: 'css', js: 'javascript' };

  // Ingebouwde fallback-teksten (zodat het ook zonder server werkt).
  var FALLBACK = { run: 'Run', reset: 'Reset' };
  var SELF = (document.currentScript && document.currentScript.src) || '';
  var BASE = SELF.replace(/[^/]*$/, '');

  // CodeMirror-instellingen, dicht tegen de originele editor. Valt netjes
  // terug op een gewone textarea als CodeMirror niet geladen is.
  function cmOptions(mode) {
    return {
      mode: mode,
      theme: 'p5e',
      lineNumbers: true,
      lineWrapping: false,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      viewportMargin: Infinity,
      extraKeys: {
        Tab: function (cm) {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('  ', 'end');
        },
        'Shift-Tab': function (cm) { cm.indentSelection('subtract'); }
      }
    };
  }

  function currentLang() {
    var l = localStorage.getItem('p5e-lang') || document.documentElement.lang || 'nl';
    return l === 'en' ? 'en' : 'nl';
  }
  function loadStrings(cb) {
    var lang = currentLang();
    fetch(BASE + 'lang/' + lang + '.json')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (s) { cb(Object.assign({}, FALLBACK, s), lang); })
      .catch(function () { cb(FALLBACK, lang); });
  }

  function createEditor(container, S, lang) {
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
      '    <button class="p5e-btn p5e-run" type="button">' + S.run + '</button>' +
      '    <button class="p5e-btn p5e-reset" type="button">' + S.reset + '</button>' +
      '    <span class="p5e-lang">' +
      '      <a href="#" data-lang="nl"' + (lang === 'nl' ? ' class="is-current"' : '') + '>NL</a>' +
      '      <a href="#" data-lang="en"' + (lang === 'en' ? ' class="is-current"' : '') + '>EN</a>' +
      '    </span>' +
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
    var cms = {};      // file -> CodeMirror instance (of null bij fallback)
    var original = {}; // file -> originele inhoud (voor Reset)

    FILES.forEach(function (file) {
      areas[file] = container.querySelector('.p5e-code[data-file="' + file + '"]');
      // Vervang elke textarea door een CodeMirror-editor (als de lib geladen is).
      cms[file] = window.CodeMirror ? CodeMirror.fromTextArea(areas[file], cmOptions(MODES[file])) : null;
      // Markeer de actieve editor (html) zodat de CSS de juiste toont.
      if (cms[file]) cms[file].getWrapperElement().classList.toggle('is-active', file === 'html');
    });

    function getVal(file) { return cms[file] ? cms[file].getValue() : areas[file].value; }
    function setVal(file, v) { if (cms[file]) cms[file].setValue(v); else areas[file].value = v; }

    // Voeg HTML, CSS en JS samen tot één pagina in het iframe.
    function run() {
      preview.srcdoc =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
        getVal('css') +
        '</style></head><body>' +
        getVal('html') +
        '<script>try{\n' + getVal('js') + '\n}catch(e){' +
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
        var active = f === file;
        if (cms[f]) {
          cms[f].getWrapperElement().classList.toggle('is-active', active);
          // Een verborgen CodeMirror kon zichzelf niet meten → bijwerken bij tonen.
          if (active) cms[f].refresh();
        } else {
          areas[f].classList.toggle('is-active', active);
        }
      });
      if (cms[file]) cms[file].focus(); else areas[file].focus();
    });

    container.querySelector('.p5e-run').addEventListener('click', run);
    container.querySelector('.p5e-reset').addEventListener('click', function () {
      FILES.forEach(function (f) { setVal(f, original[f]); });
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

    // Zonder CodeMirror: Tab in een veld voegt twee spaties in.
    // (Met CodeMirror regelt de editor dit zelf.)
    FILES.forEach(function (f) {
      if (cms[f]) return;
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
        setVal(file, text);
        original[file] = text;
      });
      // De html-tab is actief; werk z'n editor bij na het vullen.
      if (cms.html) cms.html.refresh();
      run();
    });
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

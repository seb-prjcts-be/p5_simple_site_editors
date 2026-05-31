/**
 * p5 Sketch Editor — partial.
 *
 * Toont en laat enkel gemarkeerde BLOKKEN van een sketch bewerken, terwijl de
 * volledige code erachter zit en mee uitgevoerd wordt. Handig voor oefeningen
 * ("pas de grootte van de cirkel aan") zonder de hele code te tonen.
 *
 * Gebruik: zet de volledige code in een <script type="text/p5"> en omsluit het
 * bewerkbare stuk met herkenbare commentaren:
 *
 *   //show Pas de grootte van de cirkel aan
 *   circle(mouseX, mouseY, 60);
 *   //end
 *
 *   - tekst na //show is een optioneel label boven het veld.
 *   - alles tussen //show en //end wordt een bewerkbaar code-veld.
 *
 * De rest van de code blijft verborgen. Bij elke wijziging draait de volledige
 * sketch opnieuw (live).
 */
(function () {
  'use strict';

  var P5_CDN = 'https://cdn.jsdelivr.net/npm/p5@2.2.3/lib/p5.min.js';
  var SHOW = /^\s*\/\/\s*show\b\s*(.*)$/i;
  var END = /^\s*\/\/\s*end\b/i;

  // Ingebouwde fallback-teksten (zodat het ook zonder server werkt).
  var FALLBACK = { title: 'p5.js', reset: 'Reset', note: 'Geen bewerkbaar blok gemarkeerd (//show … //end).' };
  var SELF = (document.currentScript && document.currentScript.src) || '';
  var BASE = SELF.replace(/[^/]*$/, '');

  // CodeMirror-instellingen, dicht tegen de originele editor. De bewerkbare
  // blokken zijn kleine fragmenten, dus géén line-numbers (zoals het origineel).
  // Valt netjes terug op de gewone textarea als CodeMirror niet geladen is.
  function cmOptions() {
    return {
      mode: 'javascript',
      theme: 'p5e',
      lineNumbers: false,
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

  // Strip de gemeenschappelijke inspringing zodat het blok netjes oogt.
  function dedent(lines) {
    var min = Infinity;
    lines.forEach(function (l) {
      if (l.trim() === '') return;
      var lead = l.match(/^[ \t]*/)[0].length;
      if (lead < min) min = lead;
    });
    if (!isFinite(min) || min === 0) return lines.join('\n');
    return lines.map(function (l) { return l.slice(min); }).join('\n');
  }

  function createEditor(container, S, lang) {
    var script = container.querySelector('script[type="text/p5"]');
    var template = script
      ? script.textContent.replace(/^\s*\n/, '').replace(/\s+$/, '')
      : '';

    // Splits in vaste regels en bewerkbare blokken (//show … //end).
    var parts = [];   // {fixedLines:[...]}  of  {field:index}
    var fields = [];  // {label, def, textarea}
    var buf = [], region = null, label = '';

    template.split('\n').forEach(function (line) {
      var ms = line.match(SHOW);
      if (ms && region === null) {
        parts.push({ fixedLines: buf });
        buf = [];
        label = ms[1].trim();
        region = [];
        return;
      }
      if (END.test(line) && region !== null) {
        parts.push({ field: fields.length });
        fields.push({ label: label, def: dedent(region), textarea: null });
        region = null;
        return;
      }
      (region !== null ? region : buf).push(line);
    });
    if (region !== null) {
      parts.push({ field: fields.length });
      fields.push({ label: label, def: dedent(region), textarea: null });
    } else {
      parts.push({ fixedLines: buf });
    }

    container.innerHTML =
      '<div class="p5p">' +
      '  <div class="p5p-bar">' +
      '    <span class="p5p-title">' + S.title + '</span>' +
      '    <span class="p5p-actions">' +
      '      <button class="p5p-reset" type="button">' + S.reset + '</button>' +
      '      <span class="p5e-lang">' +
      '        <a href="#" data-lang="nl"' + (lang === 'nl' ? ' class="is-current"' : '') + '>NL</a>' +
      '        <a href="#" data-lang="en"' + (lang === 'en' ? ' class="is-current"' : '') + '>EN</a>' +
      '      </span>' +
      '    </span>' +
      '  </div>' +
      '  <div class="p5p-split">' +
      '    <div class="p5p-controls"></div>' +
      '    <iframe class="p5p-preview" title="preview"></iframe>' +
      '  </div>' +
      '</div>';

    var controls = container.querySelector('.p5p-controls');
    var preview = container.querySelector('.p5p-preview');

    // Taalknop: keuze onthouden en de pagina herladen.
    container.querySelectorAll('.p5e-lang a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.setItem('p5e-lang', a.dataset.lang);
        location.reload();
      });
    });

    if (!fields.length) {
      controls.innerHTML = '<p class="p5p-note">' + S.note + '</p>';
    }

    var timer = null;
    function scheduleRun() {
      clearTimeout(timer);
      timer = setTimeout(run, 250);
    }

    // Bouw per blok een code-veld op.
    fields.forEach(function (f) {
      var wrap = document.createElement('div');
      wrap.className = 'p5p-field';
      if (f.label) {
        var lab = document.createElement('span');
        lab.className = 'p5p-label';
        lab.textContent = f.label;
        wrap.appendChild(lab);
      }
      var ta = document.createElement('textarea');
      ta.className = 'p5p-code';
      ta.spellcheck = false;
      ta.value = f.def;
      ta.rows = Math.max(1, f.def.split('\n').length);
      f.textarea = ta;
      wrap.appendChild(ta);
      controls.appendChild(wrap);

      // Vervang door een CodeMirror-veld (als de lib geladen is).
      f.cm = window.CodeMirror ? CodeMirror.fromTextArea(ta, cmOptions()) : null;

      if (f.cm) {
        f.cm.on('change', scheduleRun);
      } else {
        ta.addEventListener('input', scheduleRun);
        // Zonder CodeMirror: Tab voegt twee spaties in i.p.v. focus te verplaatsen.
        ta.addEventListener('keydown', function (e) {
          if (e.key !== 'Tab') return;
          e.preventDefault();
          var s = this.selectionStart, end = this.selectionEnd;
          this.value = this.value.slice(0, s) + '  ' + this.value.slice(end);
          this.selectionStart = this.selectionEnd = s + 2;
        });
      }
    });

    // Stel de volledige code samen (blokken terug op hun plaats) en draai die.
    function run() {
      var out = [];
      parts.forEach(function (p) {
        if (p.fixedLines) {
          out.push.apply(out, p.fixedLines);
        } else {
          var f = fields[p.field];
          var val = f.cm ? f.cm.getValue() : f.textarea.value;
          out.push.apply(out, val.split('\n'));
        }
      });
      var code = out.join('\n');
      preview.srcdoc =
        '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<script src="' + P5_CDN + '"><\/script>' +
        '<style>body{margin:0;overflow:hidden}</style></head><body><script>' +
        'try{\n' + code + '\n}catch(e){' +
        'document.body.innerHTML=' +
        '"<pre style=\\"color:#c00;font:13px monospace;padding:12px;white-space:pre-wrap\\">"' +
        '+e+"<\\/pre>";console.error(e);}' +
        '<\/script></body></html>';
    }

    container.querySelector('.p5p-reset').addEventListener('click', function () {
      fields.forEach(function (f) {
        if (f.cm) {
          f.cm.setValue(f.def);
        } else {
          f.textarea.value = f.def;
          f.textarea.rows = Math.max(1, f.def.split('\n').length);
        }
      });
      run();
    });

    run(); // toon meteen het resultaat
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
    window.P5Partial = { init: function () { init(S, lang); } };
  });
})();

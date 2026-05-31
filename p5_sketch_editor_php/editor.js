/**
 * p5 Sketch Editor (PHP) — kleine client-helpers.
 *
 * Het zware werk gebeurt server-side (PHP); dit voegt enkel toe:
 *   - Ctrl/Cmd+S om op te slaan
 *   - knop om de preview te herladen
 *   - Tab in het codeveld voegt twee spaties in
 *   - waarschuwing bij weg-navigeren met niet-opgeslagen wijzigingen
 */
(function () {
  'use strict';

  var form = document.getElementById('ed-form');
  var coder = document.getElementById('coder');
  if (!coder) return;

  // CodeMirror-instellingen: dicht tegen de originele editor (licht, monospace,
  // tab = 2 spaties, roze caret) + syntax highlighting.
  function cmOptions(mode) {
    return {
      mode: mode || null,
      theme: 'p5e',
      lineNumbers: true,
      lineWrapping: false,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      extraKeys: {
        Tab: function (cm) {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('  ', 'end');
        },
        'Shift-Tab': function (cm) { cm.indentSelection('subtract'); }
      }
    };
  }

  // Vervang de textarea door CodeMirror (als de lib geladen is). fromTextArea
  // synct bij form-submit automatisch terug naar de textarea, dus de POST
  // (name="coder") blijft ongewijzigd werken.
  var cm = window.CodeMirror ? CodeMirror.fromTextArea(coder, cmOptions(window.ED_MODE)) : null;
  function edVal() { return cm ? cm.getValue() : coder.value; }

  var saved = edVal(); // inhoud zoals laatst opgeslagen/geladen

  // Vertalingen die PHP heeft meegegeven (window.T); valt terug op een NL-tekst.
  var T = window.T || {};
  function tr(key, fallback, vars) {
    var s = T[key] || fallback;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace('{' + k + '}', vars[k]);
      });
    }
    return s;
  }

  // Herlaad het preview-iframe (forceer een nieuwe load).
  window.reloadPreview = function () {
    var f = document.getElementById('prev');
    if (f) f.src = f.src;
  };

  // Helper: voer een file-actie uit via het formulier.
  // suppress=true onderdrukt de onopgeslagen-waarschuwing (bv. bij Bewaar als,
  // waar de huidige inhoud sowieso meegaat).
  function fileAction(action, newname, suppress) {
    document.getElementById('ed-action').value = action;
    if (newname !== undefined) {
      document.getElementById('ed-newname').value = newname;
    }
    if (suppress) {
      saved = edVal();
    }
    if (cm) cm.save(); // schrijf CodeMirror-inhoud terug naar de textarea
    form.submit();
  }

  // Opslaan: schrijf het actieve bestand weg.
  window.saveNow = function () {
    fileAction('save', undefined, true);
  };

  // --- Sketch-niveau (folders) ------------------------------------------
  // Nieuwe (lege) sketch met starter-bestanden.
  window.newSketch = function () {
    var name = prompt(tr('prompt_sketch_new', 'Nieuwe sketch — naam:'));
    if (!name) return;
    fileAction('newsketch', name, true);
  };

  // Dupliceer de huidige sketch onder een nieuwe naam.
  window.dupSketch = function () {
    var name = prompt(tr('prompt_sketch_dup', 'Dupliceren — naam voor de kopie:'));
    if (!name) return;
    fileAction('saveas', name, true);
  };

  // Hernoem de huidige sketch-folder.
  window.renameSketch = function () {
    var current = (document.querySelector('input[name=dir]') || {}).value || '';
    var name = prompt(tr('prompt_sketch_rename', 'Sketch hernoemen naar:'), current);
    if (!name || name === current) return;
    fileAction('renamesketch', name, true);
  };

  // Verwijder de huidige sketch-folder.
  window.deleteSketch = function () {
    var current = (document.querySelector('input[name=dir]') || {}).value || '';
    if (!confirm(tr('confirm_sketch_delete', 'Sketch "{name}" volledig verwijderen? Alle bestanden erin gaan verloren.', { name: current }))) return;
    fileAction('deletesketch', undefined, true);
  };

  // Nieuw (leeg) bestand in de huidige sketch.
  window.newFile = function () {
    var name = prompt(tr('prompt_file_new', 'Nieuw bestand — naam incl. extensie (bv. data.js):'));
    if (!name) return;
    fileAction('newfile', name, true);
  };

  // Hernoem het actieve bestand.
  window.renameFile = function () {
    var current = (document.querySelector('input[name=file]') || {}).value || '';
    var name = prompt(tr('prompt_file_rename', 'Hernoem bestand naar:'), current);
    if (!name || name === current) return;
    fileAction('rename', name, false); // waarschuw bij onopgeslagen werk
  };

  // Verwijder het actieve bestand.
  window.deleteFile = function () {
    var current = (document.querySelector('input[name=file]') || {}).value || '';
    if (!confirm(tr('confirm_file_delete', 'Bestand "{name}" verwijderen? Dit kan niet ongedaan gemaakt worden.', { name: current }))) return;
    fileAction('delete', undefined, true);
  };

  // Ctrl/Cmd+S = opslaan (i.p.v. de browser-save-dialoog).
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      window.saveNow();
    }
  });

  // Bij klikken op Opslaan: ook als opgeslagen markeren.
  form.addEventListener('submit', function () {
    if (cm) cm.save();
    saved = edVal();
  });

  // Sleepbare scheidingsbalk: pas de breedte van de preview-kolom aan.
  var divider = document.getElementById('ed-divider');
  var main = document.querySelector('.ed-main');
  var right = document.querySelector('.ed-right');
  if (divider && main && right) {
    divider.addEventListener('mousedown', function (e) {
      e.preventDefault();
      document.body.classList.add('ed-resizing');

      function onMove(ev) {
        var rect = main.getBoundingClientRect();
        var w = rect.right - ev.clientX;       // breedte van de rechterkolom
        var min = 220;
        var max = rect.width - 220;            // laat ook de editor minstens 220 over
        right.style.width = Math.max(min, Math.min(max, w)) + 'px';
      }
      function onUp() {
        document.body.classList.remove('ed-resizing');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (cm) cm.refresh(); // editor opnieuw meten na breedte-wijziging
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // Zonder CodeMirror: Tab voegt twee spaties in i.p.v. focus te verplaatsen.
  // (Met CodeMirror regelt de editor dit zelf.)
  if (!cm) {
    coder.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      var s = this.selectionStart, end = this.selectionEnd;
      this.value = this.value.slice(0, s) + '  ' + this.value.slice(end);
      this.selectionStart = this.selectionEnd = s + 2;
    });
  }

  // Waarschuw als je wegnavigeert (bv. ander tabblad) met onopgeslagen werk.
  window.addEventListener('beforeunload', function (e) {
    if (edVal() !== saved) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
})();

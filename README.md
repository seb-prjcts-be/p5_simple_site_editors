# p5 simple site editors

**Live overzicht:** https://seb-prjcts-be.github.io/p5_simple_site_editors/

Een verzameling kleine, herbruikbare p5.js-editors — elk een op zichzelf staand
"building block" dat een stukje technologie uit bestaande sites herbruikbaar maakt.
Van het allersimpelste live-editortje tot een volwaardige PHP-editor die echte
bestanden op schijf bewerkt.

Gemeenschappelijke stijl: zwart-wit minimalisme met één roze accent
(`rgb(255, 0, 125)`), p5.js uit de CDN, geen build-stap.

## De editors

| Map | Type | Beschrijving |
|---|---|---|
| [`p5-sketch-editor`](p5-sketch-editor/) | client-side | De simpelste vorm: één code-veld + live preview, Run/Reset. |
| [`p5-sketch-editor_partial`](p5-sketch-editor_partial/) | client-side | Toont enkel een gemarkeerd blok (`//show … //end`); de rest van de sketch draait verborgen. Voor gerichte oefeningen. |
| [`p5_sketch_editor_ext`](p5_sketch_editor_ext/) | client-side | Drie bewerkbare bestanden (HTML/CSS/JS) via tabs; preview combineert ze (`srcdoc`). |
| [`p5_sketch_editor_php`](p5_sketch_editor_php/) | PHP-backed | All-feature: bewerkt echte bestanden op schijf, multi-file tabs, opslaan, live preview, en Sketch/Bestand-menu's (nieuw, dupliceren, hernoemen, verwijderen). |

## Gebruik

De client-side editors zijn pure HTML/CSS/JS — open `index.html` (via een server
of rechtstreeks, behalve `_ext` dat een server nodig heeft voor `fetch`).

De PHP-editor vereist PHP via een webserver (bv. XAMPP/Apache op `localhost`):

```
http://localhost/.../p5_sketch_editor_php/index.php
```

Elke map heeft een eigen `README.md` met details.

## Vertalen

Alle zichtbare teksten staan als gewone strings in de broncode — geen
vertaalframework nodig. Pas ze gewoon aan:

| Wat | Waar |
|---|---|
| Knop-labels (`Run`, `Reset`) | bovenaan in elk `p5-editor.js`, in de `innerHTML`-string |
| Tab-labels (`HTML`/`CSS`/`JS`) | `p5_sketch_editor_ext/p5-editor.js` |
| Menu-labels (`Sketch`, `Bestand`, `Opslaan`, `Nieuw bestand…`, …) | `p5_sketch_editor_php/index.php`, in de `<div class="ed-menu">`-blokken |
| Pop-up teksten (`prompt` / `confirm`) | de `window.*`-functies in `editor.js` / `p5-editor.js` |
| Foutmeldingen | de `fail(...)`-aanroepen in `p5_sketch_editor_php/index.php` |
| Uitleg / introtekst | de `index.html` van elke editor + deze landingspagina |
| Oefening-labels (partial) | de tekst na `//show` in je eigen sketch |

Voor de partial-editor hoef je niets in de code te wijzigen: het label komt uit
het `//show <label>`-commentaar van de sketch zelf.

## Translation (English)

All visible text lives as plain strings in the source — no i18n framework
needed. Just edit them in place:

| What | Where |
|---|---|
| Button labels (`Run`, `Reset`) | top of each `p5-editor.js`, inside the `innerHTML` string |
| Tab labels (`HTML`/`CSS`/`JS`) | `p5_sketch_editor_ext/p5-editor.js` |
| Menu labels (`Sketch`, `Bestand`, `Opslaan`, …) | `p5_sketch_editor_php/index.php`, in the `<div class="ed-menu">` blocks |
| Pop-up text (`prompt` / `confirm`) | the `window.*` functions in `editor.js` / `p5-editor.js` |
| Error messages | the `fail(...)` calls in `p5_sketch_editor_php/index.php` |
| Intro / help text | each editor's `index.html` + this landing page |
| Exercise labels (partial) | the text after `//show` in your own sketch |

For the partial editor you don't touch the code at all: the label comes from the
`//show <label>` comment in the sketch itself.

# p5 simple site editors

**Live overzicht:** https://seb-prjcts-be.github.io/p5_simple_site_editors/

Een verzameling kleine, herbruikbare p5.js-editors — elk een op zichzelf staand
"building block" dat een stukje technologie uit bestaande sites herbruikbaar maakt.
Van het allersimpelste live-editortje tot een volwaardige PHP-editor die echte
bestanden op schijf bewerkt.

Gemeenschappelijke stijl: zwart-wit minimalisme met één roze accent
(`rgb(255, 0, 125)`), p5.js uit de CDN, geen build-stap.

Alle editors gebruiken **CodeMirror 5** (uit de CDN) voor syntax highlighting,
met het officiële `p5-light`-palet van editor.p5js.org (thema `cm-s-p5e`:
keywords bruin, functies/variabelen blauw, strings groen, getallen zwart,
comments grijs), tab = 2 spaties. Laadt de lib niet, dan valt elke editor terug
op een gewone textarea.

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

Elke editor heeft een **`lang/`-map met `nl.json` en `en.json`** — alle
UI-teksten staan daarin, geen framework nodig. Een **NL/EN-knop** in de balk
schakelt en onthoudt de keuze.

- **Een tekst aanpassen** → wijzig de waarde in `lang/nl.json` (of `en.json`).
- **Een taal toevoegen** → kopieer `nl.json` naar bv. `fr.json`, vertaal de
  waarden. (De ingebouwde knop toont NL/EN; voeg je taal toe aan de knop in de
  editor-JS, of zet `localStorage['p5e-lang'] = 'fr'`.)

| Editor | Taalbestanden | Hoe geladen |
|---|---|---|
| client-side (basis, partial, ext) | `lang/nl.json`, `lang/en.json` | via `fetch`; valt terug op ingebouwde NL-tekst als laden niet lukt (bv. `file://`) |
| PHP | `lang/nl.json`, `lang/en.json` | server-side ingelezen; `?lang=nl/en` + cookie onthoudt de keuze |

Twee dingen vertaal je **niet** via JSON, want ze horen bij de inhoud:
- de tekst van de demo-sketch zelf (`index.html` / `script.js` van een sketch);
- het oefening-label van de partial-editor — dat komt uit het
  `//show <label>`-commentaar in de sketch.

## Translation (English)

Every editor has a **`lang/` folder with `nl.json` and `en.json`** — all UI text
lives there, no framework needed. An **NL/EN switch** in the toolbar toggles and
remembers the choice.

- **Change a string** → edit the value in `lang/nl.json` (or `en.json`).
- **Add a language** → copy `nl.json` to e.g. `fr.json`, translate the values.
  (The built-in switch shows NL/EN; add your language to the switch in the
  editor JS, or set `localStorage['p5e-lang'] = 'fr'`.)

| Editor | Language files | How loaded |
|---|---|---|
| client-side (basis, partial, ext) | `lang/nl.json`, `lang/en.json` | via `fetch`; falls back to built-in NL text if loading fails (e.g. `file://`) |
| PHP | `lang/nl.json`, `lang/en.json` | read server-side; `?lang=nl/en` + cookie remembers the choice |

Two things are **not** translated via JSON, because they are content:
- the demo sketch's own text (`index.html` / `script.js` of a sketch);
- the partial editor's exercise label — that comes from the `//show <label>`
  comment in the sketch.

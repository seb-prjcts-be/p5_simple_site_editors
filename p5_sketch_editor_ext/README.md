# p5 Sketch Editor — extended

Een live-editor met **drie bewerkbare bestanden**: HTML, CSS en JS, elk in een
eigen tab. De preview combineert de drie tot één pagina. Zelfde look-and-feel
als de basisversie (`../p5-sketch-editor/`), maar nu een volwaardige mini-playground.

De startinhoud komt uit **echte losse bestanden** die naast elkaar in de map staan.

## Gebruik

1. Kopieer `p5-editor.css` en `p5-editor.js` naar je pagina en link ze in.
   Zet de **CodeMirror-tags vóór** `p5-editor.js` (optioneel — zonder valt
   elke tab terug op een gewone textarea). Let op: drie modes, één per tab:

   ```html
   <!-- CodeMirror 5 — syntax highlighting (optioneel). -->
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.css">
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/javascript/javascript.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/css/css.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/xml/xml.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/htmlmixed/htmlmixed.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/closebrackets.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/matchbrackets.js"></script>

   <link rel="stylesheet" href="p5-editor.css">
   <script src="p5-editor.js"></script>
   ```

2. Plaats een editor en wijs naar drie bestanden:

   ```html
   <div class="p5-editor"
        data-html="demo/index.html"
        data-css="demo/style.css"
        data-js="demo/script.js"></div>
   ```

De editor laadt de drie bestanden (via `fetch`), toont ze in de tabs en draait
meteen. **Draait op een server** (Apache / localhost) — niet via `file://`,
omdat `fetch` daar geblokkeerd wordt.

## Hoe het werkt

De drie velden worden samengevoegd tot één HTML-pagina:

```
<style> … CSS … </style>
… HTML …
<script> … JS … </script>
```

Die pagina toont een `<iframe srcdoc>`, afgeschermd van de hoofdpagina. p5.js zit
níét hard in de editor: het HTML-bestand laadt de p5-CDN zelf in. Zo blijft de
editor een algemene HTML/CSS/JS-playground — vervang gewoon de demo-bestanden.

## Aanpassen

- **accentkleur**: CSS-variabele `--p5e-accent` op `.p5-editor`.
- **andere sketch**: pas `demo/index.html`, `demo/style.css`, `demo/script.js` aan,
  of wijs met de `data-*`-attributen naar je eigen bestanden.

## Bestanden

| Bestand | Rol |
|---|---|
| `p5-editor.js` | Editor-logica: tabs, fetch, combineren, Run/Reset. |
| `p5-editor.css` | Zelfstandige styling (met tab-balk). |
| `index.html` | Werkende demo. |
| `demo/index.html` | Bewerkbaar HTML-bestand (laadt p5). |
| `demo/style.css` | Bewerkbaar CSS-bestand. |
| `demo/script.js` | Bewerkbaar JS-bestand (de p5-sketch). |

## Verschil met de basisversie

| | basis (`p5-sketch-editor`) | extended (dit) |
|---|---|---|
| bewerkbaar | 1 veld (alleen JS) | 3 velden (HTML, CSS, JS) |
| bron | inline `<script type="text/p5">` | echte losse bestanden |
| p5 laden | automatisch door editor | door het HTML-bestand |

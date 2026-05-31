# p5 Sketch Editor

Een minimale, herbruikbare live-editor voor p5.js. Code links, live preview rechts,
Run + Reset. Geen build-stap — drie bestandjes die je ergens neerzet. Syntax
highlighting komt van CodeMirror 5 (optioneel, via CDN).

Vereenvoudigde versie van de editor uit de p5.js Cursus-site (`#objecten`).

## Gebruik

1. Kopieer `p5-editor.css` en `p5-editor.js` naar je pagina.
2. Link ze in. Zet de **CodeMirror-tags vóór** `p5-editor.js`:

   ```html
   <!-- CodeMirror 5 — syntax highlighting (optioneel). -->
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.css">
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/javascript/javascript.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/closebrackets.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/matchbrackets.js"></script>

   <link rel="stylesheet" href="p5-editor.css">
   <script src="p5-editor.js"></script>
   ```

   Laat je de CodeMirror-tags weg, dan werkt de editor nog steeds — hij valt
   dan terug op een gewone textarea (zonder highlighting).

3. Plaats overal waar je een editor wil:

   ```html
   <div class="p5-editor">
     <script type="text/p5">
       function setup() { createCanvas(400, 400); }
       function draw()  { background(220); circle(mouseX, mouseY, 40); }
     </script>
   </div>
   ```

Elke `.p5-editor` op de pagina wordt automatisch een editor en draait meteen.

## Hoe het werkt

De gebruikerscode wordt in een complete HTML-pagina gegoten (met p5 uit de CDN)
en in een `<iframe srcdoc>` getoond. Het iframe schermt de sketch af van de
hoofdpagina; een fout in de code toont een nette melding i.p.v. alles te breken.

## Aanpassen

- **p5-versie**: één regel bovenaan `p5-editor.js` (`P5_CDN`).
- **accentkleur**: de CSS-variabele `--p5e-accent` op `.p5-editor`.
- **highlight-kleuren**: het thema `cm-s-p5e` onderaan `p5-editor.css`
  (comments grijs, keywords roze, strings/getallen groen).

## Bestanden

| Bestand | Rol |
|---|---|
| `p5-editor.js` | De editor-logica (~90 regels). |
| `p5-editor.css` | Zelfstandige styling. |
| `index.html` | Werkende demo met twee voorbeelden. |

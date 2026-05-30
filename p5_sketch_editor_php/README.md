# p5 Sketch Editor — PHP-backed

Het **fundament** voor een volledige editor: bewerkt **echte bestanden op schijf**,
met multi-file tabs, opslaan en een live preview. Server-side PHP, geen framework,
geen database. Geïnspireerd op de boekentoren-editor, maar ontkoppeld van diens
project-specifieke zaken (manifest, slug, git, nav-shell).

Dit is een **schrijvende** view, dus hij is bewust afgeschermd (zie Security).

## Vereisten

Draait op **PHP via een webserver** (XAMPP/Apache op `localhost`). Open via:

```
http://localhost/building_blocks/p5_sketch_editor_php/index.php
```

Niet via `file://` of een statische server — PHP moet uitgevoerd worden.

## Wat het doet

- **Multi-file**: scant de sketch-map en toont elk bewerkbaar bestand als tab
  (`index.html`, `style.css`, `script.js` eerst, rest alfabetisch).
Twee duidelijk gescheiden niveaus, elk in een eigen menu (Windows-stijl):

- **Bestand-menu** — bewerkingen op de **bestanden binnen de huidige sketch**:
  - *Nieuw bestand…* — maakt een leeg bestand aan in de huidige sketch (extensie-whitelist).
  - *Opslaan* (**Ctrl/Cmd+S**) — schrijft het actieve bestand naar schijf.
  - *Naam wijzigen…* — hernoemt het actieve bestand.
  - *Verwijderen* — verwijdert het actieve bestand (met bevestiging).
- **Sketch-menu** — bewerkingen op de **sketch-folders** zelf:
  - *(kiezer)* — lijst van alle sketches onder `sketches/`; klik om te wisselen
    (de huidige staat roze gemarkeerd).
  - *Nieuwe sketch…* — maakt een nieuwe folder met starter-bestanden
    (`index.html` + `style.css` + `script.js`).
  - *Dupliceren…* — kopieert de hele sketch naar een nieuwe folder, met de
    huidige editor-inhoud; het origineel blijft ongemoeid.
  - *Naam wijzigen…* — hernoemt de sketch-folder.
  - *Verwijderen* — verwijdert de hele sketch-folder (recursief, met bevestiging).
- **Live preview**: toont het écht geserveerde `index.html` in een iframe
  (geen samenvoegen nodig — de bestanden bestaan echt). Knop om te herladen.
- **Verschaalbaar**: sleep de balk tussen editor en preview om de breedte
  van de kolommen aan te passen.
- **Libs/assets**: detecteert externe libraries uit `<script src>` in `index.html`
  en telt niet-code assets.

## Mappenstructuur

```
p5_sketch_editor_php/
├── index.php        ← de editor (laden + opslaan)
├── editor.css       ← styling
├── editor.js        ← Ctrl+S, herlaad-preview, tab-insert, unsaved-waarschuwing
└── sketches/
    └── demo/        ← een echte, bewerkbare sketch
        ├── index.html   (laadt style.css, p5, script.js)
        ├── style.css
        └── script.js
```

Wissel tussen sketches via het **Sketch-menu** (of `?dir=<mapnaam>`). Nieuwe
sketches maak je via *Sketch → Nieuwe sketch…*; ze verschijnen als folder onder
`sketches/`. Als alle sketches verwijderd zijn, toont de editor een lege staat
om er meteen een nieuwe te maken.

## Security (schrijvende view)

- **Loopback-only**: enkel `127.0.0.1` / `::1`.
- **CSRF-token**: vereist bij elke opslag.
- **Path-containment**: de doelmap moet via `realpath` binnen `sketches/` liggen.
- **Bestandsnaam-guards**: geen `..`, `/` of `\`; extensie-whitelist
  (`js, html, css, json, csv, txt, md, glsl, vert, frag`).
- **Sketch-naam**: regex `[a-z0-9][a-z0-9_-]*`; weigert bestaande mappen.

## Bewust (nog) niet

- **Syntax highlighting** — komt als latere laag (CodeMirror, zoals boekentoren).
- **Git-autocommit** — optionele latere laag.

## Verschil met de client-side blokken

| | client-side (`p5_sketch_editor_ext`) | PHP-backed (dit) |
|---|---|---|
| server nodig | nee | ja (PHP) |
| opslaan | nee (alleen in browser) | ja, naar schijf |
| preview | velden samengevoegd (`srcdoc`) | echt geserveerd `index.html` |
| bestanden | via `fetch`, niet bewaard | echte bestanden, bewerkt op schijf |

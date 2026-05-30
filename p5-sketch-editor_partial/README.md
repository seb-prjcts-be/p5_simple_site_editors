# p5 Sketch Editor — partial

Een variant waarbij de leerling **slechts een klein, gemarkeerd stukje** van een
sketch ziet en bewerkt, terwijl de **volledige code erachter zit** en mee
uitgevoerd wordt. Ideaal voor gerichte oefeningen ("pas de grootte van de cirkel
aan") zonder de hele code bloot te geven.

## Gebruik

1. Link de bestanden in:

   ```html
   <link rel="stylesheet" href="p5-editor.css">
   <script src="p5-editor.js"></script>
   ```

2. Zet de **volledige** code in een `<script type="text/p5">` en omsluit het
   bewerkbare blok met `//show` … `//end`:

   ```html
   <div class="p5-editor">
     <script type="text/p5">
   function setup() { createCanvas(400, 400); noStroke(); }
   function draw() {
     background(20);
     fill(255, 0, 125);
     //show Pas de grootte van de cirkel aan
     circle(mouseX, mouseY, 60);
     //end
   }
     </script>
   </div>
   ```

Alles tussen `//show` en `//end` wordt een bewerkbaar code-veld; de rest van de
code blijft verborgen. Bij elke wijziging draait de volledige sketch opnieuw (live).

## Markeer-syntax

| In de code | Resultaat |
|---|---|
| `//show` … `//end` | blok zonder label |
| `//show Pas de grootte aan` … `//end` | blok met label (tekst na `//show`) |

Een blok mag meerdere regels bevatten, en je kunt meerdere `//show … //end`-blokken
in één sketch zetten. De gemeenschappelijke inspringing wordt weggehaald zodat
het blok netjes oogt; de markers zelf verdwijnen uit de uitgevoerde code.

## Hoe het werkt

De template wordt gesplitst in vaste stukken en bewerkbare velden. Bij het
draaien worden de veldwaarden terug op hun plaats gezet en wordt de **complete**
code in een afgeschermd `<iframe srcdoc>` met de p5-CDN uitgevoerd. Een fout
toont een nette melding i.p.v. de pagina te breken.

## Verschil met de basisversie

| | basis (`p5-sketch-editor`) | partial (dit) |
|---|---|---|
| zichtbaar | de volledige code | enkel het `//show … //end`-blok |
| bewerkbaar | alles | enkel de gemarkeerde stukjes |
| update | knop **Run** | live, bij elke wijziging |

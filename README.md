# Reisplanner

Een lokale React/Vite reisplanner met Nederlandse interface. De app start zonder vooraf ingevulde reis, bestemmingen, activiteiten, kosten, documenten of paklijstitems. Na het aanmaken van een reis worden alleen lege reisdagen gegenereerd op basis van de gekozen start- en einddatum.

## Installatie

```bash
npm install
```

## Starten

```bash
npm run dev
```

Open daarna de lokale Vite-url die in de terminal verschijnt.

Voor een productiebuild:

```bash
npm run build
```

## Waar data wordt opgeslagen

- Reisgegevens, bestemmingen, dagplanning, vervoer, budgetposten, paklijstcategorieën, paklijstitems en documentmetadata worden opgeslagen in `localStorage`.
- Geüploade documentbestanden worden lokaal opgeslagen in IndexedDB, database `reisplanner-documenten`.
- Er is geen backend, authenticatie, externe API of kaartenintegratie.

## Export/import

Gebruik `Export JSON` om de huidige reisdata te downloaden. De export bevat ook geüploade documentbestanden als ingesloten data in hetzelfde JSON-bestand.

Gebruik `Import JSON` om een eerdere export terug te zetten. Bij import vraagt de app eerst om bevestiging, omdat bestaande lokale data en documentbestanden worden vervangen.

## Lege startstaat

Bij eerste gebruik toont de app `Nieuwe reis aanmaken`. Daarna kun je zelf onderdelen toevoegen via:

- Planner: bestemmingen, vervoer en dag-tot-dag planning
- Budget: uitgaven, filters, categorieën en budgetoverzicht
- Paklijst: categorieën en items
- Documenten: uploads, metadata, koppelingen, zoeken en filters

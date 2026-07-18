# Reisplanner

Een privacyvriendelijke reisplanner in React, TypeScript en Vite. De app start leeg: je vult zelf de reis, bestemmingen, activiteiten, kosten, documenten en paklijst in.

## Wat je kunt plannen

- Planner met reisoverzicht, route, dagplanning en losse activiteitenideeën
- Bestemmingen, accommodaties en vervoersverbindingen met boekingsstatussen
- Budgetten per categorie, betaalstatus en verdeling tussen reizigers
- Paklijst per categorie en reiziger, inclusief bulk toevoegen en voortgang
- Lokale documentopslag met koppelingen aan dagen, bestemmingen, vervoer en uitgaven
- Volledige back-up en herstel via JSON-export en -import
- Responsive bediening op desktop, tablet en mobiel

## Installatie

Gebruik Node.js 20 of nieuwer en pnpm:

```bash
pnpm install
pnpm dev
```

Open daarna de lokale Vite-url die in de terminal verschijnt.

## Controles en productiebuild

```bash
pnpm typecheck
pnpm build
pnpm preview
```

Vite schrijft de productieversie naar `dist`. De meegeleverde `vercel.json` laat directe en vernieuwde SPA-routes correct terugvallen op `index.html`.

## Waar data wordt opgeslagen

- Reisgegevens en documentmetadata staan lokaal in `localStorage`.
- Geüploade bestanden staan lokaal in IndexedDB, database `reisplanner-documenten`.
- Er is geen backend, account of externe gegevensdienst. Data blijft dus in de gebruikte browser en op het gebruikte apparaat.
- Een andere browser of een ander apparaat ziet de reis pas nadat daar een JSON-back-up is geïmporteerd.

## Export en import

Gebruik **Back-up downloaden** om alle reisgegevens én geüploade bestanden in één JSON-bestand te bewaren. Met **Back-up importeren** zet je die gegevens terug. De app vraagt eerst om bevestiging voordat bestaande lokale data wordt vervangen.

## Lege startstaat

Bij eerste gebruik toont de app **Nieuwe reis aanmaken**. Alleen de dagregels worden op basis van de gekozen start- en einddatum gegenereerd; de inhoud blijft leeg en volledig door de gebruiker invulbaar.

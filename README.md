# Stages scraper

Scraped etappes van een ronde van firstcycling.com en zet deze in het juist YAML formaat in de output directory. Deze etappes kunnen direct in de de [data repository van de Geensnor Tourpoule](https://github.com/geensnor/Geensnor-Tourpoule-Data) gebruikt worden.

## Installatie

```
npm install 
```

## Uitvoeren

Pas in stagesScraper.js de volgende regel aan zodat hij naar de juist ronde verwijst.

```
const url = "https://firstcycling.com/race.php?r=13&y=2023&k=2";
```

Typ in de terminal

```
node stagesScraper.js
```

Alle etappes staan in de output directory

## Alleen etappes

Deze tool haalt alleen de etappes zelf op. Voor renners en uitslagen moet je deze gebruiken: [geensnor.nl/tourtool](https://www.geensnor.nl/tourtool)

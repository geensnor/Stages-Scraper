# Stages scraper

Scraped etappes van een ronde van firstcycling.com en zet deze in het juist YAML formaat in de output directory. Deze etappes kunnen direct in de de [data repository van de Geensnor Tourpoule](https://github.com/geensnor/Geensnor-Tourpoule-Data) gebruikt worden.

## Installatie

```sh
npm install 
```

## Uitvoeren

Voeg de URL van de ronde toe aan het het scrape command. Voor de Giro van 2023 krijg je dan bijvoorbeeld

```sh
npm run scrape "https://firstcycling.com/race.php?r=13&y=2023&k=2"
```

Alle etappes staan in de output directory

## Alleen etappes

Deze tool haalt alleen de etappes zelf op. Voor renners en uitslagen moet je deze gebruiken: [geensnor.nl/tourtool](https://www.geensnor.nl/tourtool)

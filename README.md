# Tourpoule Scraper

Deze repository bevat scrapers om gegevens van [procyclingstats.com](https://www.procyclingstats.com/) te verzamelen voor de Geensnor Tourpoule. Je kunt onafhankelijk van elkaar de etappes en ploegselecties (renners) ophalen. De output wordt in YAML-formaat naar de `output` directory geschreven en sluit aan op de JSON schema's uit de Tourpoule data repository.

## Installatie

```sh
npm install
```

## Configuratie

Voordat je gaat scrapen, moet je `input/tour.yaml` aanpassen met de juiste `scrapeURL`. Deze URL wijst naar de race op procyclingstats.com, bijvoorbeeld:

```yaml
scrapeURL: https://www.procyclingstats.com/race/tour-de-france/2025
```

In `tour.yaml` staan ook de truien (jerseys) en scoring configuratie. De truien worden gebruikt om per etappe de truidragers bij te houden.

## Gebruik

Alle scrapers worden via de CLI gestart. Iedere subcommand schrijft naar een eigen submap binnen `output/`.

### Etappes

```sh
npm run scrape:stages
```

Opties:

- `--output`: relatieve submap in `output/` (standaard: `stages`)

Voor iedere etappe wordt een YAML-bestand conform [`stage.json`](https://github.com/geensnor/Geensnor-Tourpoule-Data/blob/main/schemas/stage.json) aangemaakt. Het type wordt afgeleid van het parcoursicoon; tijdritten krijgen automatisch `time`.

Als een etappe is gefinished, worden automatisch de uitslagen gescraped. Het aantal renners in de uitslag is gelijk aan het aantal scoring items in `tour.yaml`. De status van de etappe wordt dan `finished` in plaats van `notStarted`.

### Renners

```sh
npm run scrape:cyclists
```

Opties:

- `--output`: relatieve submap in `output/` (standaard: `cyclists`)

De tool leest de PCS startlijst en groepeert renners per ploeg volgens [`cyclists.json`](https://raw.githubusercontent.com/geensnor/Geensnor-Tourpoule-Data/refs/heads/main/schemas/cyclists.json). Namen worden netjes in hoofdletters omgezet (voor- én achternaam).

## Output

Alle resultaten verschijnen onder `output/`. Bestaande bestanden in die map worden overschreven. Controleer na het scrapen altijd de gegevens voordat je ze toevoegt aan de Tourpoule data repository.

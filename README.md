# Tourpoule Scraper

Deze repository bevat scrapers om gegevens van [procyclingstats.com](https://www.procyclingstats.com/) te verzamelen voor de Geensnor Tourpoule. Je kunt onafhankelijk van elkaar de etappes, ploegselecties (renners) en basisinformatie over de ronde ophalen. De output wordt in YAML-formaat naar de `output` directory geschreven en sluit aan op de JSON schema's uit de Tourpoule data repository.

## Installatie

```sh
npm install
```

## Gebruik

Alle scrapers worden via de CLI gestart. Iedere subcommand schrijft naar een eigen submap binnen `output/`.

### Etappes

```sh
npm run scrape:stages -- --slug tour-de-france --year 2025
```

Opties:

- `--slug` (**verplicht**): race-slug uit de PCS URL, bijv. `tour-de-france`
- `--year` (**verplicht**): jaartal van de editie
- `--output`: relatieve submap in `output/` (standaard: `stages`)

Voor iedere etappe wordt een YAML-bestand conform [`stage.json`](https://github.com/geensnor/Geensnor-Tourpoule-Data/blob/main/schemas/stage.json) aangemaakt. Het type wordt afgeleid van het parcoursicoon; tijdritten krijgen automatisch `time`.

### Renners

```sh
npm run scrape:cyclists -- --slug tour-de-france --year 2025
```

Opties:

- `--slug` (**verplicht**)
- `--year` (**verplicht**)
- `--output`: relatieve submap in `output/` (standaard: `cyclists`)

De tool leest de PCS startlijst en groepeert renners per ploeg volgens [`cyclists.json`](https://raw.githubusercontent.com/geensnor/Geensnor-Tourpoule-Data/refs/heads/main/schemas/cyclists.json). Namen worden netjes in hoofdletters omgezet (voor- én achternaam).

### Tourgegevens

```sh
npm run scrape:tour -- --slug tour-de-france --year 2025 \
  --status closed \
  --scoring 25,18,12,10,8,6,4,2,1 \
  --final-scoring 150,125,100,80,60,50,40,30,20,10 \
  --jersey-points Gele=25,Bolletjes=10
```

Opties:

- `--slug` (**verplicht**)
- `--year` (**verplicht**)
- `--status`: `open` of `closed` (standaard: `open`)
- `--max-cyclists`: maximum aantal renners per deelnemersteam (standaard: `15`)
- `--scoring`: komma-gescheiden punten of pad naar JSON/YAML met een array
- `--final-scoring`: idem voor eindklassement
- `--jersey-points`: komma-gescheiden lijst `naam=punten` of pad naar JSON/YAML met een object
- `--output`: relatieve submap in `output/` (standaard: `tour`)

Deze command schrijft een `tour.yaml` conform [`tour.json`](https://github.com/geensnor/Geensnor-Tourpoule-Data/blob/main/schemas/tour.json).

## Truien template

Het bestand `jerseyTemplate.yaml` bevat de standaardtruien die in iedere etappe worden opgenomen. Voor de tour-scraper kun je de punten van deze truien overschrijven via `--jersey-points`.

## Output

Alle resultaten verschijnen onder `output/`. Bestaande bestanden in die map worden overschreven. Controleer na het scrapen altijd de gegevens voordat je ze toevoegt aan de Tourpoule data repository.

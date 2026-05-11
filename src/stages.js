const { DateTime } = require("luxon");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");

const {
  fetchHtml,
  ensureDir,
  loadTourConfig,
  loadJerseys,
  mapProfileIconToStageType,
  formatRoute,
  normalizeCyclistName,
  normalizeStageCyclistName,
  writeYamlFile,
} = require("./utils");

async function scrapeStageResults(stageUrl, maxResults) {
  try {
    const $ = await fetchHtml(stageUrl);
    const results = [];

    // PCS heeft meerdere resultaten tabellen (STAGE, GC, POINTS, etc.)
    // We willen alleen de STAGE resultaten tabel
    // Deze staat meestal als eerste, of we kunnen zoeken naar de tabel met "Rnk" header
    // en "Rider" kolom die de stage resultaten bevat

    // Zoek naar de eerste resultaten tabel die stage resultaten bevat
    // De stage resultaten tabel heeft meestal een "Rnk" kolom en "Rider" kolom
    let stageTable = null;

    $("table.results").each((_, table) => {
      const headers = $(table)
        .find("thead th, thead tr th")
        .map((_, th) => $(th).text().trim().toLowerCase())
        .get();

      // Check of dit de stage results tabel is (heeft Rnk en Rider kolommen)
      if (headers.includes("rnk") && headers.includes("rider")) {
        // Check of het niet de GC tabel is (GC tabel heeft ook "gc" kolom)
        if (
          !headers.includes("gc") ||
          headers.indexOf("rnk") < headers.indexOf("gc")
        ) {
          stageTable = $(table);
          return false; // Stop iteratie
        }
      }
    });

    // Fallback: gebruik de eerste results tabel als we geen specifieke vinden
    if (!stageTable || stageTable.length === 0) {
      stageTable = $("table.results").first();
    }

    if (stageTable.length === 0) {
      return null;
    }

    // Zoek naar de resultaten in de gevonden tabel
    stageTable.find("tbody tr").each((_, row) => {
      if (results.length >= maxResults) {
        return false; // Stop iteratie
      }

      // Skip header rijen en lege rijen
      const rnkCell = $(row).find("td").first();
      const rnkText = rnkCell.text().trim();

      // Skip als het geen nummer is (headers, etc)
      if (!rnkText || isNaN(Number(rnkText))) {
        return;
      }

      // Zoek naar renner naam in de ridername kolom
      const riderLink = $(row).find("td.ridername a").first();
      if (riderLink.length === 0) {
        // Fallback: zoek naar eerste link naar /rider/ in de rij
        const firstLink = $(row)
          .find("td a")
          .filter((_, el) => {
            const href = $(el).attr("href");
            return href && href.includes("/rider/");
          })
          .first();

        if (firstLink.length === 0) {
          return;
        }

        const riderNameRaw = firstLink.text().trim();
        if (!riderNameRaw) {
          return;
        }
        const normalized = normalizeStageCyclistName(riderNameRaw);
        if (normalized) {
          results.push(normalized);
        }
        return;
      }

      const riderNameRaw = riderLink.text().trim();
      if (!riderNameRaw) {
        return;
      }

      const normalized = normalizeStageCyclistName(riderNameRaw);
      if (normalized) {
        results.push(normalized);
      }
    });

    return results.length > 0 ? results : null;
  } catch (error) {
    // Als de etappe pagina niet beschikbaar is of geen resultaten heeft
    // eslint-disable-next-line no-console
    console.error(
      `Fout bij scrapen van stage results van ${stageUrl}:`,
      error.message,
    );
    return null;
  }
}

async function scrapeStages({ outputDir = "stages" }) {
  const tourConfig = loadTourConfig();
  const scrapeURL = tourConfig.scrapeURL;

  if (!scrapeURL) {
    throw new Error("scrapeURL ontbreekt in tour.yaml");
  }

  // Haal slug en year uit de URL
  const urlMatch = scrapeURL.match(/race\/([^\/]+)\/(\d+)/);
  if (!urlMatch) {
    throw new Error(`Ongeldige scrapeURL: ${scrapeURL}`);
  }

  const [, slug, year] = urlMatch;
  const stagesUrl = `${scrapeURL}/route/stages`;
  const $ = await fetchHtml(stagesUrl);

  const jerseys = loadJerseys(tourConfig);
  const scoringCount = tourConfig.scoring ? tourConfig.scoring.length : 0;
  const stageOutputDir = ensureDir(outputDir);

  const stageRows = $("table.basic tbody tr").not(".sum");
  if (stageRows.length === 0) {
    throw new Error(`Geen etappes gevonden op ${stagesUrl}`);
  }

  const stages = [];

  // Eerst alle stage basisinformatie verzamelen
  stageRows.each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 6) {
      return;
    }

    const dateCell = $(cells[0]).text().trim();
    const iconClass = $(cells[1]).find("span").attr("class") || "";
    const stageLink = $(cells[2]).find("a");
    const departure = $(cells[3]).text();
    const arrival = $(cells[4]).text();

    if (!stageLink || stageLink.length === 0) {
      return;
    }

    const stageLabel = stageLink.text().trim();
    const numberMatch = stageLabel.match(/Stage\s+(\d+)/i);
    if (!numberMatch) {
      return;
    }

    const stageNumber = Number(numberMatch[1]);
    if (Number.isNaN(stageNumber)) {
      return;
    }

    const dateString = `${dateCell}.${year}`;
    const parsedDate = DateTime.fromFormat(dateString, "dd/LL.yyyy", {
      zone: "utc",
    });
    const formattedDate = parsedDate.isValid
      ? parsedDate.toFormat("yyyy-LL-dd")
      : `${year}-${stageNumber.toString().padStart(2, "0")}-01`;

    const stageType = mapProfileIconToStageType(iconClass, stageLabel);
    const stageHref = stageLink.attr("href");
    let stagePageUrl = null;

    if (stageHref) {
      // Zorg dat de href correct wordt samengesteld
      if (stageHref.startsWith("http")) {
        stagePageUrl = stageHref;
      } else if (stageHref.startsWith("/")) {
        stagePageUrl = `https://www.procyclingstats.com${stageHref}`;
      } else {
        stagePageUrl = `https://www.procyclingstats.com/${stageHref}`;
      }
    }

    stages.push({
      number: stageNumber,
      route: formatRoute(departure, arrival),
      type: stageType,
      date: formattedDate,
      pageUrl: stagePageUrl,
    });
  });

  if (stages.length === 0) {
    throw new Error("Geen etappes verwerkt");
  }

  // Nu voor elke stage de resultaten scrapen indien nodig
  for (const stage of stages) {
    const targetFile = path.resolve(
      stageOutputDir,
      `stage-${stage.number.toString().padStart(2, "0")}.yaml`,
    );

    // Skippen als de etappe al als finished staat met ingevulde resultaten
    if (fs.existsSync(targetFile)) {
      try {
        const existing = yaml.load(fs.readFileSync(targetFile, "utf8"));
        const existingResults =
          existing && (existing.stageResults || existing.stage_results);
        const hasResults =
          Array.isArray(existingResults) && existingResults.length > 0;
        if (existing && existing.status === "finished" && hasResults) {
          // eslint-disable-next-line no-console
          console.log(
            `Etappe ${stage.number} overgeslagen (${stage.date}) - finished`,
          );
          continue;
        }
      } catch (_) {
        // bij parse-fout: gewoon verder scrapen en bestand herstellen
      }
    }

    let stageResults = null;
    let status = "notStarted";

    if (stage.pageUrl && scoringCount > 0) {
      stageResults = await scrapeStageResults(stage.pageUrl, scoringCount);
      if (stageResults && stageResults.length > 0) {
        status = "finished";
      }
    }

    const stageObject = {
      number: stage.number,
      route: stage.route,
      type: stage.type,
      date: stage.date,
      status,
      stageResults,
      jerseyWearers: jerseys.map((name) => ({ jersey: name, cyclist: "" })),
    };

    writeYamlFile(targetFile, stageObject);
    // eslint-disable-next-line no-console
    console.log(
      `Etappe ${stage.number} opgeslagen (${stage.date}) - ${status}`,
    );
  }

  return stages.length;
}

module.exports = { scrapeStages };

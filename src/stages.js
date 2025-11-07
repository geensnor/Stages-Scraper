const { DateTime } = require("luxon");
const path = require("path");

const {
  fetchHtml,
  ensureDir,
  loadJerseys,
  mapProfileIconToStageType,
  formatRoute,
  writeYamlFile,
} = require("./utils");

async function scrapeStages({ slug, year, outputDir = "stages" }) {
  if (!slug || !year) {
    throw new Error("Slug en jaar zijn verplicht voor het scrapen van etappes");
  }

  const yearInt = Number(year);
  if (Number.isNaN(yearInt)) {
    throw new Error(`Ongeldig jaar opgegeven: ${year}`);
  }

  const stagesUrl = `https://www.procyclingstats.com/race/${slug}/${year}/route/stages`;
  const $ = await fetchHtml(stagesUrl);

  const jerseys = loadJerseys();
  const stageOutputDir = ensureDir(outputDir);

  const stageRows = $("table.basic tbody tr").not(".sum");
  if (stageRows.length === 0) {
    throw new Error(`Geen etappes gevonden op ${stagesUrl}`);
  }

  let stageCounter = 0;

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

    const distance = $(cells[5]).text().trim();

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
    const parsedDate = DateTime.fromFormat(dateString, "dd/LL.yyyy", { zone: "utc" });
    const formattedDate = parsedDate.isValid
      ? parsedDate.toFormat("yyyy-LL-dd")
      : `${year}-${stageNumber.toString().padStart(2, "0")}-01`;

    const stageType = mapProfileIconToStageType(iconClass, stageLabel);

    const stageObject = {
      number: stageNumber,
      route: formatRoute(departure, arrival),
      type: stageType,
      date: formattedDate,
      status: "notStarted",
      stageResults: null,
      jerseyWearers: jerseys.map((name) => ({ jersey: name, cyclist: "" })),
      meta: {
        source: stagesUrl,
        distance: distance ? Number(distance) : null,
      },
    };

    const targetFile = path.resolve(
      stageOutputDir,
      `stage-${stageNumber.toString().padStart(2, "0")}.yaml`
    );

    writeYamlFile(targetFile, stageObject);
    stageCounter += 1;
    // eslint-disable-next-line no-console
    console.log(`Etappe ${stageNumber} opgeslagen (${formattedDate})`);
  });

  if (stageCounter === 0) {
    throw new Error("Geen etappes verwerkt");
  }

  return stageCounter;
}

module.exports = { scrapeStages };


const path = require("path");

const { fetchHtml, ensureDir, loadJerseys, writeYamlFile } = require("./utils");

function toInteger(value, fallback) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

async function scrapeTour({
  slug,
  year,
  status = "open",
  maxCyclistsInUserTeam = 15,
  scoring = [],
  finalStandingScoring = [],
  jerseys: jerseyOverrides,
  outputDir = ".",
}) {
  if (!slug || !year) {
    throw new Error("Slug en jaar zijn verplicht voor het scrapen van de tour");
  }

  const url = `https://www.procyclingstats.com/race/${slug}/${year}`;
  const $ = await fetchHtml(`${url}/overview`);

  const title = $("div.page-title h1").text().trim() || `${year} ${slug}`;
  const nameParts = title.split("»").map((part) => part.trim()).filter(Boolean);
  const baseName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : title;
  const name = `${baseName} ${year}`.trim();

  const jerseyTemplate = loadJerseys();
  const jerseyPoints = jerseyOverrides ||
    jerseyTemplate.reduce((acc, jerseyName) => {
      acc[jerseyName] = 0;
      return acc;
    }, {});

  if (!jerseyPoints || Object.keys(jerseyPoints).length === 0) {
    throw new Error(
      "Er moeten minimaal één trui in het jersey template of via overrides worden opgegeven"
    );
  }

  const tourObject = {
    name,
    status,
    maxCyclistsInUserTeam: toInteger(maxCyclistsInUserTeam, 15),
    tourURL: url,
    jerseys: jerseyPoints,
    scoring,
    finalStandingScoring,
  };

  const targetDir = ensureDir(outputDir);
  const targetFile = path.resolve(targetDir, "tour.yaml");
  writeYamlFile(targetFile, tourObject);

  // eslint-disable-next-line no-console
  console.log(`Tour opgeslagen in ${targetFile}`);

  return tourObject;
}

module.exports = { scrapeTour };


const path = require("path");

const {
  fetchHtml,
  ensureDir,
  loadTourConfig,
  normalizeCyclistName,
  writeYamlFile,
} = require("./utils");

function cleanTeamName(rawName) {
  return rawName.replace(/\s*\((WT|PRT|CT)\)\s*$/i, "").trim();
}

async function scrapeCyclists({ outputDir = "" }) {
  const tourConfig = loadTourConfig();
  const scrapeURL = tourConfig.scrapeURL;

  if (!scrapeURL) {
    throw new Error("scrapeURL ontbreekt in tour.yaml");
  }

  const url = `${scrapeURL}/startlist/startlist`;
  const $ = await fetchHtml(url);

  const teams = [];

  $("ul.startlist_v4 > li").each((_, element) => {
    const teamNameRaw = $(element).find("a.team").first().text();
    if (!teamNameRaw) return;

    const teamName = cleanTeamName(teamNameRaw);
    const cyclists = [];

    $(element)
      .find("ul > li")
      .each((__, riderElement) => {
        const riderNameRaw = $(riderElement).find("a").first().text();
        if (!riderNameRaw) return;
        const normalized = normalizeCyclistName(riderNameRaw);
        if (normalized) {
          cyclists.push(normalized);
        }
      });

    if (cyclists.length > 0) {
      teams.push({ teamName, cyclists });
    }
  });

  if (teams.length === 0) {
    throw new Error(`Geen teams gevonden op ${url}`);
  }

  const targetDir = ensureDir(outputDir || ".");
  const targetFile = path.resolve(targetDir, "cyclists.yaml");
  writeYamlFile(targetFile, teams);

  // eslint-disable-next-line no-console
  console.log(`Cyclisten opgeslagen in ${targetFile}`);

  return teams.length;
}

module.exports = { scrapeCyclists };

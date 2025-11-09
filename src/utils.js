const axios = require("axios");
const cheerio = require("cheerio");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const OUTPUT_BASE = path.resolve(__dirname, "../output");
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
};

async function fetchHtml(url) {
  const { data } = await axios.get(url, { headers: DEFAULT_HEADERS });
  return cheerio.load(data);
}

function ensureDir(relativeDir) {
  const dirPath = path.resolve(OUTPUT_BASE, relativeDir);
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function loadTourConfig(
  configPath = path.resolve(__dirname, "../input/tour.yaml")
) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Tour configuratie niet gevonden: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, "utf8");
  const config = yaml.load(raw);
  if (!config || typeof config !== "object") {
    throw new Error(`Ongeldige tour configuratie in ${configPath}`);
  }

  return config;
}

function loadJerseys(tourConfig) {
  if (!tourConfig || !tourConfig.jerseys) {
    return [];
  }

  // Jerseys is nu een object met naam: punten
  return Object.keys(tourConfig.jerseys);
}

function mapProfileIconToStageType(iconClass, stageLabel = "") {
  if (/\b(itt|ttt)\b/i.test(stageLabel)) {
    return "time";
  }

  const match = iconClass.match(/\bp(\d)\b/i);
  if (!match) {
    return "flat";
  }

  const profileCode = match[1];
  switch (profileCode) {
    case "0":
    case "1":
      return "flat";
    case "2":
    case "3":
      return "hills";
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return "climb";
    default:
      return "flat";
  }
}

function formatRoute(departure, arrival) {
  const clean = (value) => value.replace(/\s+/g, " ").trim();
  const parts = [clean(departure), clean(arrival)].filter(Boolean);
  return parts.join(" - ");
}

function titleCase(word) {
  if (!word) return word;
  return word
    .split(/([\-'])/)
    .map((segment) => {
      if (segment === "-" || segment === "'") {
        return segment;
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");
}

function normalizeCyclistName(rawName) {
  const name = rawName.trim();
  if (!name) return name;

  const tokens = name.split(/\s+/);
  const lastNameTokens = [];
  const firstNameTokens = [];

  for (const token of tokens) {
    const hasLower = /[a-z]/.test(token);
    if (firstNameTokens.length === 0 && !hasLower) {
      lastNameTokens.push(token);
    } else {
      firstNameTokens.push(token);
    }
  }

  const formattedFirst = firstNameTokens.map(titleCase);
  const formattedLast = lastNameTokens.map(titleCase);

  if (formattedFirst.length === 0 || formattedLast.length === 0) {
    return tokens.map(titleCase).join(" ");
  }

  return `${formattedFirst.join(" ")} ${formattedLast.join(" ")}`.trim();
}

function writeYamlFile(targetPath, data) {
  const yamlStr = `---\n${yaml.dump(data, { lineWidth: 160 })}`;
  fs.writeFileSync(targetPath, yamlStr, "utf8");
}

module.exports = {
  fetchHtml,
  ensureDir,
  loadTourConfig,
  loadJerseys,
  mapProfileIconToStageType,
  formatRoute,
  normalizeCyclistName,
  writeYamlFile,
};

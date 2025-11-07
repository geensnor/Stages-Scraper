#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const { scrapeStages } = require("./src/stages");
const { scrapeCyclists } = require("./src/cyclists");
const { scrapeTour } = require("./src/tour");

function toCamelCase(kebab) {
  return kebab.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function parseArguments(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      // positional argument already consumed as command
      continue;
    }

    const key = toCamelCase(arg.slice(2));
    const next = args[i + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    i += 1;
  }
  return options;
}

function loadDataFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Bestand niet gevonden: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  if (/\.ya?ml$/i.test(absolutePath)) {
    return yaml.load(content);
  }
  return JSON.parse(content);
}

function parseArrayOption(value) {
  if (!value) return [];
  if (fs.existsSync(path.resolve(process.cwd(), value))) {
    const data = loadDataFile(value);
    if (!Array.isArray(data)) {
      throw new Error(`Verwacht een array in ${value}`);
    }
    return data
      .map((item) => Number(item))
      .filter((item) => !Number.isNaN(item));
  }

  return value
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((num) => !Number.isNaN(num));
}

function parseKeyValueOption(value) {
  if (!value) return null;
  const resolved = path.resolve(process.cwd(), value);
  if (fs.existsSync(resolved)) {
    const data = loadDataFile(resolved);
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      throw new Error(`Verwacht een object in ${resolved}`);
    }
    return data;
  }

  return value.split(",").reduce((acc, pair) => {
    const [key, rawPoints] = pair.split(/[:=]/);
    if (!key || rawPoints == null) {
      return acc;
    }
    const points = Number(rawPoints.trim());
    acc[key.trim()] = Number.isNaN(points) ? 0 : points;
    return acc;
  }, {});
}

function printUsage() {
  // eslint-disable-next-line no-console
  console.log(`Gebruik: node cli.js <command> [--opties]

Beschikbare commands:
  stages   --slug <naam> --year <jaar> [--output <pad>]
  cyclists --slug <naam> --year <jaar> [--output <pad>]
  tour     --slug <naam> --year <jaar> [extra opties]

Extra opties tour:
  --status <open|closed>
  --max-cyclists <aantal>
  --scoring <pad-naar-array-of-komma-gescheiden-waarden>
  --final-scoring <pad-naar-array-of-komma-gescheiden-waarden>
  --jersey-points <pad-naar-object-of-lijst-naam=punten>
  --output <pad>
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
    process.exit(1);
    return;
  }

  const command = args[0];
  const options = parseArguments(args.slice(1));

  const { slug, year, output = command } = options;

  try {
    switch (command) {
      case "stages": {
        if (!slug || !year) throw new Error("--slug en --year zijn verplicht");
        await scrapeStages({ slug, year, outputDir: output });
        break;
      }
      case "cyclists": {
        if (!slug || !year) throw new Error("--slug en --year zijn verplicht");
        await scrapeCyclists({ slug, year, outputDir: output });
        break;
      }
      case "tour": {
        if (!slug || !year) throw new Error("--slug en --year zijn verplicht");
        const tourOptions = {
          slug,
          year,
          status: options.status || "open",
          maxCyclistsInUserTeam: options.maxCyclists
            ? Number(options.maxCyclists)
            : 15,
          scoring: parseArrayOption(options.scoring),
          finalStandingScoring: parseArrayOption(options.finalScoring),
          jerseys: parseKeyValueOption(options.jerseyPoints),
          outputDir: output,
        };
        await scrapeTour(tourOptions);
        break;
      }
      default:
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exit(1);
  }
}

main();

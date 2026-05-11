import { assert, expect, test } from "vitest";
import fs from "fs";
import yaml from "js-yaml";

const files = fs
  .readdirSync("output/stages/")
  .filter((element) => !element.startsWith(".")); //filter hidden files

const cyclistArray = yaml
  .load(fs.readFileSync("output/cyclists/cyclists.yaml", "utf8"))
  .map((obj) => obj.cyclists)
  .reduce((acc, arr) => acc.concat(arr), []);

test("Stagewinners are cyclists in scraped cyclists file", () => {
  files.forEach((file) => {
    const stageData = yaml.load(
      fs.readFileSync("output/stages/" + file, "utf8"),
    );

    if (stageData.stageResults) {
      const missing = stageData.stageResults.filter(
        (name) => !cyclistArray.includes(name),
      );

      assert.deepEqual(
        missing,
        [],
        `Etappe ${stageData.number} (${file}): ontbrekend in cyclists.yaml: ${missing.join(", ")}`,
      );
    }
  });
});

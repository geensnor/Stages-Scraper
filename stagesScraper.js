const axios = require("axios");
const cheerio = require("cheerio");
const { DateTime } = require("luxon");
const yaml = require("js-yaml");
const fs = require("fs");

const url = decodeURIComponent(process.argv[2]); //Get url from prompt

async function scrapeData(url) {
  // Get jerseys from template file
  let jerseys = [];
  let fileJerseys;
  let jerseyObject = "";
  try {
    jerseys = yaml.load(fs.readFileSync("jerseyTemplate.yaml", "utf8"));
    console.log(`Jersey template with ${jerseys.length} jerseys found`);
  } catch (e) {
    console.log("No jersey template found");
  }
  console.log("");

  if (Object.keys(jerseys).length != 0) {
    fileJerseys = jerseys.map((jersey) => {
      //Create jersey section for every stage from jersey template
      jerseyObject = {
        jersey: jersey,
        cyclist: "",
      };
      return jerseyObject;
    });
  } else {
    fileJerseys = ""; //Empty jersey section if there is no jersey template
  }

  let stageNumber = 1;
  let listItems;
  let $;
  let year;
  try {
    const { data } = await axios.get(url);
    $ = cheerio.load(data);
    year = $("[name='keywords']").attr("content").match(/\d+/g)[0]; //Get year from numbers in keywords content
    listItems = $("table.tablesorter tr"); //Select table
  } catch (err) {
    console.error(err);
  }

  listItems.each(function (idx, el) {
    //Loop trough table
    let stageDataRaw = $(el).text();
    if (stageDataRaw === "No data") {
      console.log("No stages found");
    } else {
      let stageDataSplitted = $(stageDataRaw.split("\n"));
      if (
        stageDataSplitted[3].replace(/\t/g, "") != "Date" &&
        stageDataSplitted[4].replace(/\t/g, "") != "-"
      ) {
        //Skip header and resting days

        if (stageDataSplitted[3].trim() == "Team") {
          // There is a team section beneath the stage section. Quit scraping when we enter the team section. We only want stages!
          return false;
        }

        let formattedDate = DateTime.fromFormat(
          `${stageDataSplitted[3].replace(/\t/g, "")}.${year}`,
          "d.LLL.yyyy"
        ).toFormat("y-MM-dd"); //Reformatting date
        let formatedRoute = stageDataSplitted[5]
          .replace(/\t/g, "")
          .replace("-", " - ")
          .trim(); //Reformatting route

        const imgSrc = $(el).find("img").attr("src") || "";
        let type = "";
        if (imgSrc) {
          const matches = imgSrc.match(/\/([^\/]+)\.svg$/);
          if (matches && matches[1]) {
            const iconName = matches[1];
            switch (iconName) {
              case "Flatt":
                type = "flat";
                break;
              case "Smaakupert":
              case "Smaakupert-MF":
                type = "hills";
                break;
              case "Fjell-MF":
                type = "climb";
                break;
              case "Bakketempo":
              case "Tempo":
                type = "time";
                break;
              default:
                type = "unknown";
            }
          }
        }

        let stageObject = {
          number: stageNumber,
          date: formattedDate,
          route: formatedRoute,
          type: type,
          status: "notStarted",
          stageResults: "",
          jerseyWearers: fileJerseys,
          type: type,
        };
        let yamlString = "---\n" + yaml.dump(stageObject);
        console.log(
          "stage " + stageNumber + ": " + formattedDate + " " + formatedRoute
        );
        fs.writeFileSync(
          `output/etappe${stageNumber}.yaml`,
          yamlString,
          "utf8"
        );
        stageNumber++;
      }
    }
  });
  if (stageNumber > 1) console.log("");
  console.log(stageNumber - 1 + " stages written in output directory");
}
scrapeData(url);

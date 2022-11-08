const axios = require("axios");
const cheerio = require("cheerio");
const { DateTime } = require("luxon");
const yaml = require('js-yaml');
const fs = require('fs');

const url = "https://firstcycling.com/race.php?r=765&y=2023&k=2";

async function scrapeData(url) {

    let stageNumber = 1;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const year = $("[name='keywords']").attr("content").match(/\d+/g)[0]; //Get year from numbers in keywords content
        const listItems = $("table.tablesorter tr"); //Select table

        listItems.each(function (idx, el) { //Loop trough table
            let stageDataRaw = $(el).text();
            let stageDataSplitted = $(stageDataRaw.split("\n"));

            if (stageDataSplitted[3].replace(/\t/g, "") != "Date" && stageDataSplitted[4].replace(/\t/g, "") != "-") {//Skip header and resting days

                outputDate = DateTime.fromFormat(`${stageDataSplitted[3].replace(/\t/g, "")}.${year}`, "d.LLL.yyyy").toFormat('y-MM-dd'); //Reformatting date
                let stageObject = {
                    "number": stageNumber,
                    "route": stageDataSplitted[5].replace(/\t/g, "").replace("-", " - "),
                    "date": outputDate,
                    "status": "notStarted",
                    "stageResults": '',
                    "jerseyWearers": ''
                }

                let yamlString = yaml.dump(stageObject);
                fs.writeFileSync(`output/etappe${stageNumber}.yaml`, yamlString, 'utf8');

                stageNumber++;
            }
        });
        console.log(stageNumber + " stages written in output directory");

    } catch (err) {
        console.error(err);
    }
}
scrapeData(url)


import ScraperClient from "src/scraper/scraper.client";
import * as cheerio from "cheerio";
import { FuelPrice, fuelPriceSchema, monthNameSchema } from "./scraper.schema";
import PersistanceService from "../persistance/persistance.service";
import { updateYearPricesSchema } from "src/persistance/persistance.schema";
import { ScraperError } from "./scraper.error";
import GitService from "src/git/git.service";

namespace ScraperService {
  export const runScraper = async () => {
    const linksMap = await getLinks();
    const html2 = await ScraperClient.getHtml(linksMap.get("2025")!);
    const page2 = cheerio.load(html2);
    const table = page2("tbody");

    const rows = table.find("tr").toArray();

    for (let i = 1; i < rows.length; i++) {
      try {
        const element = rows[i];
        const row = page2(element);
        const cells = row.find("td");

        const monthName = page2(cells.eq(0)).text().trim().toLowerCase();
        const month = monthNameSchema.safeParse(monthName);
        if (!month.success) {
          throw new ScraperError(
            `Failed to parse month name: ${monthName} in row ${i}`,
            "partial"
          );
        }
        const rowData: FuelPrice = {
          olmozatlanMotorbenzin: parseFloat(page2(cells.eq(1)).text()) || 0,
          gazolaj: parseFloat(page2(cells.eq(2)).text()) || 0,
          keverek: parseFloat(page2(cells.eq(3)).text()) || 0,
          lpg: parseFloat(page2(cells.eq(4)).text()) || 0,
          cng: parseFloat(page2(cells.eq(5)).text()) || 0,
        };
        const fuelValidation = fuelPriceSchema.safeParse(rowData);
        if (!fuelValidation.success) {
          throw new ScraperError(
            `Failed to parse fuel price: ${JSON.stringify(
              rowData
            )} in row ${i}`,
            "breaking"
          );
        }
        const updateYearPrices = updateYearPricesSchema.safeParse({
          year: 2025,
          month: month.data,
          prices: fuelValidation.data,
        });
        if (!updateYearPrices.success) {
          throw new ScraperError(
            `Failed to parse update year prices: ${updateYearPrices.error.message} in row ${i}`,
            "breaking"
          );
        }

        await PersistanceService.addMonth(updateYearPrices.data);
      } catch (error) {
        if (error instanceof ScraperError) {
          if (error.type === "breaking") {
            throw error;
          }
          console.error(error.message);
        }
      }
    }
    await GitService.syncAndCommitData();
  };

  const getLinks = async () => {
    const html = await ScraperClient.getHtml("/ugyfeliranytu/uzemanyag");
    const page = cheerio.load(html);
    const sections = page(".content-list-elements");
    const linksMap = new Map<string, string>();
    sections.each((_, element) => {
      const section = page(element);
      const date = section.find(".list-date").text();
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const links = section
        .find("a")
        .map((i, element) => page(element).attr("href"))
        .get();
      links.forEach((link) => {
        linksMap.set(year.toString(), link);
      });
    });
    return linksMap;
  };
}
export default ScraperService;

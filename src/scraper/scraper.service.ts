import { getHtml } from "src/client/scraper.client";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import {
  FuelPrice,
  fuelPriceSchema,
  Month,
  monthsSchema,
  yearPricesSchema,
} from "./scraper.schema";

namespace ScraperService {
  export const runScraper = async () => {
    const linksMap = await getLinks();
    const html2 = await getHtml(linksMap.get("2025")!);
    const page2 = cheerio.load(html2);
    const table = page2("tbody");
    const allMonthsData: Month[] = [];
    table.find("tr").each((i, element) => {
      if (i === 0) {
        return;
      }

      const row = page2(element);
      const cells = row.find("td");

      const monthName = page2(cells.eq(0)).text().trim().toLowerCase();
      const rowData: FuelPrice = {
        olmozatlanMotorbenzin: parseFloat(page2(cells.eq(1)).text()) || 0,
        gazolaj: parseFloat(page2(cells.eq(2)).text()) || 0,
        keverek: parseFloat(page2(cells.eq(3)).text()) || 0,
        lpg: parseFloat(page2(cells.eq(4)).text()) || 0,
        cng: parseFloat(page2(cells.eq(5)).text()) || 0,
      };
      const fuelValidation = fuelPriceSchema.safeParse(rowData);
      if (!fuelValidation.success) {
        console.log("fuelValidation", fuelValidation.error);
        throw new Error("Failed to parse data");
      }
      const monthsValidation = monthsSchema.safeParse({
        [monthName]: fuelValidation.data,
      });
      if (!monthsValidation.success) {
        console.log("monthsValidation", monthsValidation.error);
      }
      if (monthsValidation.data) {
        allMonthsData.push(monthsValidation.data);
      }
    });
    const yearPricesValidation = yearPricesSchema.safeParse({
      [2025]: allMonthsData,
    });
    if (!yearPricesValidation.success) {
      console.log("yearPricesValidation", yearPricesValidation.error);
      throw new Error("Failed to parse data");
    }
  };

  const getLinks = async () => {
    const html = await getHtml("/ugyfeliranytu/uzemanyag");
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

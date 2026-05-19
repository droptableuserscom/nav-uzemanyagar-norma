import ScraperClient from "src/scraper/scraper.client";
import * as cheerio from "cheerio";
import {
  FuelPrice,
  fuelPriceSchema,
  monthNameSchema,
  scraperServiceResponseSchema,
} from "./scraper.schema";
import PersistanceService from "../persistance/persistance.service";
import { updateYearPricesSchema } from "src/persistance/persistance.schema";
import { ScraperError } from "./scraper.error";
import GitService from "src/git/git.service";
import { config } from "src/config";

const FUEL_TABLE_BODIES = [
  "table.style9 tbody",
  "article .field-text table tbody",
] as const;

const fuelTableRows = ($: cheerio.CheerioAPI) => {
  for (const selector of FUEL_TABLE_BODIES) {
    const found = $(selector).first().find("tr").toArray();
    if (found.length >= 2) return found;
  }
  return [];
};

namespace ScraperService {
  type FuelPriceKey = keyof FuelPrice;

  const REQUIRED_PRICE_KEYS = [
    "olmozatlanMotorbenzin",
    "gazolaj",
    "keverek",
    "lpg",
    "cng",
  ] as const satisfies readonly FuelPriceKey[];

  const OPTIONAL_PRICE_KEYS = [
    "olmozatlanMotorbenzinSpecial",
    "gazolajSpecial",
  ] as const satisfies readonly FuelPriceKey[];

  const stripAccentMarks = (text: string) =>
    text.normalize("NFD").replace(/\p{Mark}/gu, "");

  const normalizeFuelColumnHeader = (raw: string) =>
    stripAccentMarks(raw.replace(/\s+/g, " ").trim().toLowerCase());

  const mapNormalizedHeaderToFuelKey = (
    columnHeader: string,
  ): FuelPriceKey | null => {
    const hasVedett = columnHeader.includes("vedett");
    const hasPiaci = columnHeader.includes("piaci");
    const hasGazolaj = columnHeader.includes("gazolaj");
    const hasMotorbenzin =
      columnHeader.includes("motorbenzin") ||
      columnHeader.includes("olmozatlan");

    if (hasVedett && hasGazolaj) return "gazolajSpecial";
    if (hasVedett && hasMotorbenzin && !hasGazolaj)
      return "olmozatlanMotorbenzinSpecial";

    if (hasPiaci && hasGazolaj) return "gazolaj";
    if (hasPiaci && hasMotorbenzin) return "olmozatlanMotorbenzin";

    if (columnHeader.includes("keverek")) return "keverek";
    if (columnHeader.includes("lpg")) return "lpg";
    if (columnHeader.includes("cng")) return "cng";

    if (hasGazolaj) return "gazolaj";
    if (hasMotorbenzin) return "olmozatlanMotorbenzin";

    return null;
  };

  const parseFuelCellNumber = (text: string): number | undefined => {
    const trimmed = text.replace(/\s+/g, " ").trim();
    const compact = trimmed.replace(/\s+/g, "").replace(",", ".");

    const absent =
      compact === "" || compact === "-" || compact === "–" || compact === "−";

    if (absent) return undefined;

    const number = parseFloat(compact);
    if (!Number.isFinite(number)) return undefined;
    return number;
  };

  const isOptionalFuelPriceKey = (key: FuelPriceKey): boolean =>
    (OPTIONAL_PRICE_KEYS as readonly FuelPriceKey[]).includes(key);

  const buildFuelColumnMapping = (
    headerTexts: string[],
  ): Map<number, FuelPriceKey> => {
    const mapping = new Map<number, FuelPriceKey>();
    const usedKeys = new Set<FuelPriceKey>();

    for (let colIdx = 1; colIdx < headerTexts.length; colIdx++) {
      const raw = headerTexts[colIdx];
      if (raw === undefined) continue;

      const key = mapNormalizedHeaderToFuelKey(normalizeFuelColumnHeader(raw));
      if (!key) {
        throw new ScraperError(
          `Unknown fuel column header at index ${colIdx}: "${raw.trim()}"`,
          "breaking",
        );
      }
      if (usedKeys.has(key)) {
        throw new ScraperError(
          `Duplicate fuel column mapping for key ${String(key)} at column ${colIdx}`,
          "breaking",
        );
      }
      usedKeys.add(key);
      mapping.set(colIdx, key);
    }

    for (const req of REQUIRED_PRICE_KEYS) {
      if (!usedKeys.has(req)) {
        throw new ScraperError(
          `Missing required fuel column mapped to "${req}". Headers: ${JSON.stringify(headerTexts)}`,
          "breaking",
        );
      }
    }

    return mapping;
  };

  export const runScraper = async () => {
    const linksMap = await crawlLinks();
    let partialErrors: string[] = [];
    for (const [key, value] of linksMap) {
      if (parseInt(key) < config.data.scrapeFrom) {
        continue;
      }
      const isFullYearData = await PersistanceService.isFullYearData(
        parseInt(key),
      );
      if (!isFullYearData) {
        console.log("scraping data for year", key);
        const errors = await scrapeData(value, parseInt(key));
        partialErrors.push(...errors);
      } else {
        console.log("year", key, "is already scraped");
      }
    }
    const isChanged = await GitService.syncAndCommitData();
    if (isChanged) {
      return scraperServiceResponseSchema.parse({
        errors: partialErrors,
        message: "Data has been changed, commit successful",
      });
    } else {
      return scraperServiceResponseSchema.parse({
        errors: partialErrors,
        message: "No changes to commit, commit skipped",
      });
    }
  };

  const scrapeData = async (link: string, year: number) => {
    const html = await ScraperClient.getHtml(link);
    const page = cheerio.load(html);
    const rows = fuelTableRows(page);

    let partialErrors: string[] = [];

    if (rows.length < 2) {
      throw new ScraperError(
        "Fuel price table needs at least a header row and one data row",
        "breaking",
      );
    }

    const headerRow = page(rows[0]);
    const headerCells = headerRow.find("td, th");
    const headerTexts = headerCells.toArray().map((cell) => page(cell).text());

    const columnMapping = buildFuelColumnMapping(headerTexts);

    for (let i = 1; i < rows.length; i++) {
      try {
        const element = rows[i];
        const row = page(element);
        const cells = row.find("td");

        const monthName = page(cells.eq(0)).text().trim().toLowerCase();
        const month = monthNameSchema.safeParse(monthName);
        if (!month.success) {
          throw new ScraperError(
            `Failed to parse month name: ${monthName} in row ${i}`,
            "partial",
          );
        }

        const rowPrices: Partial<Record<FuelPriceKey, number>> = {};

        for (let colIdx = 1; colIdx < headerTexts.length; colIdx++) {
          const key = columnMapping.get(colIdx);
          if (!key) continue;

          const optional = isOptionalFuelPriceKey(key);
          const cellText = page(cells.eq(colIdx)).text();
          const value = parseFuelCellNumber(cellText);

          if (value === undefined && optional) {
            continue;
          }
          if (value === undefined) {
            throw new ScraperError(
              `Invalid or missing numeric value for ${String(key)} in row ${i}: "${cellText.trim()}"`,
              "breaking",
            );
          }
          rowPrices[key] = value;
        }

        const fuelValidation = fuelPriceSchema.safeParse(rowPrices);
        if (!fuelValidation.success) {
          throw new ScraperError(
            `Failed to parse fuel price: ${JSON.stringify(
              rowPrices,
            )} in row ${i}: ${fuelValidation.error.message}`,
            "breaking",
          );
        }
        const updateYearPrices = updateYearPricesSchema.safeParse({
          year,
          month: month.data,
          prices: fuelValidation.data,
        });
        if (!updateYearPrices.success) {
          throw new ScraperError(
            `Failed to parse update year prices: ${updateYearPrices.error.message} in row ${i}`,
            "breaking",
          );
        }

        await PersistanceService.addMonth(updateYearPrices.data);
      } catch (error) {
        if (error instanceof ScraperError && error.type === "partial") {
          console.error(error.message);
          partialErrors.push(error.message);
        } else {
          throw error;
        }
      }
    }
    return partialErrors;
  };

  const crawlLinks = async () => {
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

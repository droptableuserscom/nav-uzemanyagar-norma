import * as fs from "fs";
import * as path from "path";
import {
  fuelPriceSchema,
  monthNames,
  yearFuelPricesSchema,
} from "../scraper/scraper.schema";
import lodash from "lodash";
import { UpdateYearPrices } from "./persistance.schema";
import { NotFoundError } from "./persistance.error";
import { config } from "src/config";

namespace PersistanceService {
  const readFile = async () => {
    try {
      const dataPath = path.resolve(config.data.jsonFilePath);
      const fileContent = fs.readFileSync(dataPath, "utf-8");
      if (!fileContent.trim()) return {};
      const data = JSON.parse(fileContent);
      return data;
    } catch {
      return {};
    }
  };

  export const addMonth = async (data: UpdateYearPrices): Promise<void> => {
    const existingData = await readFile();
    const newData = { [data.year]: { [data.month]: data.prices } };
    const mergedData = lodash.merge(existingData, newData);
    const dataPath = path.resolve(config.data.jsonFilePath);
    await writeFile(dataPath, mergedData);
  };

  const writeFile = async (path: string, data: any) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  };
  export const getPricesByMonth = async (year: number, month: string) => {
    const data = await readFile();
    const prices = lodash.get(data, `${year}.${month}`);
    const { success, data: parsedData } = fuelPriceSchema.safeParse(prices);
    if (!success) {
      throw new NotFoundError(
        `No prices found for this month: ${month} in ${year}`
      );
    }
    return parsedData;
  };

  export const getPricesByYear = async (year: number) => {
    const data = await readFile();
    const prices = lodash.get(data, year);
    const { success, data: parsedData } =
      yearFuelPricesSchema.safeParse(prices);
    if (!success) {
      throw new NotFoundError("No prices found for this year");
    }
    return parsedData;
  };

  export const areJsonFilesEqual = async (data: any) => {
    const fileContent = await readFile();
    const fileContentString = JSON.stringify(fileContent, null, 2);
    const areEqual = lodash.isEqual(
      JSON.parse(fileContentString),
      JSON.parse(data)
    );
    return {
      areEqual,
      fileContent: fileContentString,
    };
  };

  export const isFullYearData = async (year: number) => {
    const data = await readFile();
    const prices = lodash.get(data, year);
    if (!prices) throw new NotFoundError("No data found");
    const isFullYear = Object.keys(prices).length === 12;
    return isFullYear;
  };

  export const getLastScrapedMonth = async () => {
    const data = await readFile();
    const years = Object.keys(data);
    if (years.length === 0) throw new NotFoundError("No data found");
    const lastYear = parseInt(years[years.length - 1]);
    const lastMonth = monthNames[Object.keys(data[lastYear]).length - 1];
    const prices = lodash.get(data, `${lastYear}.${lastMonth}`);
    const { success, data: parsedData } = fuelPriceSchema.safeParse(prices);
    if (!success) throw new NotFoundError("No data found");
    return parsedData;
  };
}

export default PersistanceService;

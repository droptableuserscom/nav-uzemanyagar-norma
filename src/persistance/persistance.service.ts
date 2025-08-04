import * as fs from "fs";
import * as path from "path";
import {
  fuelPriceSchema,
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
    const dataPath = path.resolve(config.data.jsonFilePath);
    const fileContent = fs.readFileSync(dataPath, "utf-8");
    return lodash.isEqual(JSON.parse(fileContent), JSON.parse(data));
  };

  export const isFullYearData = async (year: number) => {
    const data = await readFile();
    const prices = lodash.get(data, year);
    if (!prices) return false;
    const isFullYear = Object.keys(prices).length === 12;
    return isFullYear;
  };
}

export default PersistanceService;

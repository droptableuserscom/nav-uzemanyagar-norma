import * as fs from "fs";
import * as path from "path";
import { YearPrices } from "../scraper/scraper.schema";
import lodash from "lodash";

namespace PersistanceService {
  const readFile = async () => {
    try {
      const dataPath = path.resolve("src/data.json");
      const fileContent = fs.readFileSync(dataPath, "utf-8");
      if (!fileContent.trim()) return {};
      const data = JSON.parse(fileContent);
      return data;
    } catch {
      return {};
    }
  };

  export const addMonth = async (data: YearPrices): Promise<void> => {
    const existingData = await readFile();
    const newData = { [data.year]: { [data.month]: data.prices } };
    const mergedData = lodash.merge(existingData, newData);
    const dataPath = path.resolve("src/data.json");
    await writeFile(dataPath, mergedData);
  };

  const writeFile = async (path: string, data: any) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  };
  export const getPricesByMonth = async (year: string, month: string) => {
    const data = await readFile();
    const prices = lodash.get(data, `${year}.${month}`);
    console.log("prices", prices);
    return prices;
  };

  export const getPricesByYear = async (year: string) => {
    const data = await readFile();
    const prices = lodash.get(data, year);
    console.log("prices", prices);
    return prices;
  };
}

export default PersistanceService;

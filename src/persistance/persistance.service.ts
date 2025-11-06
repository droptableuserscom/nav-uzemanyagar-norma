import {
  fuelPriceSchema,
  monthNames,
  YearFuelPrices,
  yearFuelPricesSchema,
} from "../scraper/scraper.schema";
import { UpdateYearPrices } from "./persistance.schema";
import { NotFoundError } from "./persistance.error";
import { cache } from "./persistance.cache";

namespace PersistanceService {
  export const getAllInBase64 = async () => {
    const data = cache.getAll();
    const jsonString = JSON.stringify(Object.fromEntries(data));
    return Buffer.from(jsonString).toString("base64");
  };
  export const addMonth = async (data: UpdateYearPrices): Promise<void> => {
    const existingData = cache.get(data.year);

    cache.set(data.year, {
      ...existingData,
      [data.month]: data.prices,
    });
  };
  export const getPricesByMonth = async (year: number, month: string) => {
    const data = cache.get(year);
    if (!data) {
      throw new NotFoundError("No data found for this year");
    }
    const prices = data[month];
    const { success, data: parsedData } = fuelPriceSchema.safeParse(prices);
    if (!success) {
      throw new NotFoundError(
        `No prices found for this month: ${month} in ${year}`
      );
    }
    return parsedData;
  };

  export const getPricesByYear = async (year: number) => {
    const prices = cache.get(year);
    const { success, data: parsedData } =
      yearFuelPricesSchema.safeParse(prices);
    if (!success) {
      throw new NotFoundError("No prices found for this year");
    }
    return parsedData;
  };

  export const filesAreEqual = async (data: Map<number, YearFuelPrices>) => {
    const inMemoryData = cache.getAll();
    if (inMemoryData.size !== data.size) return false;
    for (const [year, prices] of inMemoryData) {
      const filePrices = data.get(year);
      if (!filePrices) return false;
      if (Object.keys(prices).length !== Object.keys(filePrices).length)
        return false;
      for (const [month, price] of Object.entries(prices)) {
        const filePrice = filePrices[month];
        if (!filePrice) return false;
        if (
          price.olmozatlanMotorbenzin !== filePrice.olmozatlanMotorbenzin ||
          price.gazolaj !== filePrice.gazolaj ||
          price.keverek !== filePrice.keverek ||
          price.lpg !== filePrice.lpg ||
          price.cng !== filePrice.cng
        )
          return false;
      }
    }
    return true;
  };

  export const isFullYearData = async (year: number) => {
    const data = cache.get(year);
    if (!data) return false;
    const isFullYear = Object.keys(data).length === 12;
    return isFullYear;
  };

  export const getLastScrapedMonth = async () => {
    const data = cache.getAll();
    const years = Array.from(data.keys());
    if (years.length === 0) throw new NotFoundError("No data found");
    const lastYear = years[years.length - 1];
    const lastMonth =
      monthNames[Object.keys(data.get(lastYear) || {}).length - 1];
    const prices = data.get(lastYear)?.[lastMonth];
    const { success, data: parsedData } = fuelPriceSchema.safeParse(prices);
    if (!success) throw new NotFoundError("No data found");
    return parsedData;
  };
}
export default PersistanceService;

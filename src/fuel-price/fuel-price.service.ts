import PersistanceService from "src/persistance/persistance.service";
import { monthNames } from "src/scraper/scraper.schema";

namespace FuelPriceService {
  export const handleFuelPriceRequest = async (ev?: number, honap?: number) => {
    if (ev && honap) {
      const month = monthNames[honap - 1];
      return await PersistanceService.getPricesByMonth(ev, month);
    } else if (ev) {
      return await PersistanceService.getPricesByYear(ev);
    } else if (honap) {
      const month = monthNames[honap - 1];
      return await PersistanceService.getPricesByMonth(
        new Date().getFullYear(),
        month
      );
    }
    return await PersistanceService.getLastScrapedMonth();
  };
}

export default FuelPriceService;

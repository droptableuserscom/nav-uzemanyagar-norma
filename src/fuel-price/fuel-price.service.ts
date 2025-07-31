import PersistanceService from "src/persistance/persistance.service";
import { monthNames } from "src/scraper/scraper.schema";

namespace FuelPriceService {
  export const handleFuelPriceRequest = async (ev?: number, honap?: number) => {
    if (ev && honap) {
      const month = monthNames[honap - 1];
      const prices = await PersistanceService.getPricesByMonth(ev, month);
      return prices;
    } else if (ev) {
      const prices = await PersistanceService.getPricesByYear(ev);
      return prices;
    }
  };
}

export default FuelPriceService;

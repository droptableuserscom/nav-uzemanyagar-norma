import PersistanceService from "src/persistance/persistance.service";
import GitClient from "./git.client";
import {
  YearFuelPrices,
  yearFuelPricesSchema,
} from "src/scraper/scraper.schema";

namespace GitService {
  export const getFile = async () => {
    const { content, sha } = await GitClient.getFile();
    const parsedFile = JSON.parse(content);
    const data = new Map<number, YearFuelPrices>();
    Object.keys(parsedFile).forEach((year: string) => {
      data.set(parseInt(year), yearFuelPricesSchema.parse(parsedFile[year]));
    });
    return { data, sha };
  };

  export const syncAndCommitData = async () => {
    const { data, sha } = await GitService.getFile();
    const areEqual = await PersistanceService.filesAreEqual(data);
    if (!areEqual) {
      await GitClient.updateFile(sha);
      return true;
    } else {
      console.log("No changes to commit.");
      return false;
    }
  };
}

export default GitService;

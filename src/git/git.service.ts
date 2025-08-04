import PersistanceService from "src/persistance/persistance.service";
import GitClient from "./git.client";

namespace GitService {
  export const syncAndCommitData = async () => {
    const data = await GitClient.getFile();
    const areEqual = await PersistanceService.areJsonFilesEqual(data);
    if (!areEqual) {
      await GitClient.updateFile(data);
    } else {
      console.log("No changes to commit.");
      return;
    }
  };
}

export default GitService;

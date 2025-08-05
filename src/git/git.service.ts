import PersistanceService from "src/persistance/persistance.service";
import GitClient from "./git.client";

namespace GitService {
  export const syncAndCommitData = async () => {
    const { content, sha } = await GitClient.getFile();
    const { areEqual, fileContent } =
      await PersistanceService.areJsonFilesEqual(content);
    if (!areEqual) {
      await GitClient.updateFile(fileContent, sha);
      return true;
    } else {
      console.log("No changes to commit.");
      return false;
    }
  };
}

export default GitService;

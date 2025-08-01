import simpleGit, { SimpleGit } from "simple-git";
import { config } from "src/config";
import fs from "fs/promises";
import { isEqual } from "lodash";
import { GitError } from "./git.error";
import PersistanceService from "src/persistance/persistance.service";

interface GitHubConfig {
  token: string;
  username: string;
  remoteUrl: string;
  repoName: string;
}

namespace GitService {
  export const createGitInstance = (
    repoPath: string = process.cwd()
  ): SimpleGit => simpleGit(repoPath);

  const pullDataFile = async () => {
    const git = createGitInstance(config.git.localPath);
    try {
      await git.pull(config.git.remoteName, config.git.branch);

      try {
        return await fs.readFile(
          `${config.git.localPath}/${config.data.jsonFilePath}`,
          "utf-8"
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          console.log("Local data.json not found. Creating a new one.");
        } else {
          console.error("Error reading existing JSON file:", error);
        }
      }
    } catch (error) {
      console.error("Error pulling data file:", error);
      throw new GitError(
        `Failed to pull data file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "pull",
        error instanceof Error ? error : undefined
      );
    }
  };

  const commitAndPushData = async () => {
    const git = createGitInstance(config.git.localPath);

    try {
      const currentBranch = await git.branch();
      const targetBranch = config.git.branch;

      if (currentBranch.current !== targetBranch) {
        console.log(
          `Switching from ${currentBranch.current} to ${targetBranch}...`
        );
        try {
          await git.checkout(targetBranch);
        } catch (error) {
          console.log(
            `Branch ${targetBranch} doesn't exist locally. Creating it...`
          );
          await git.checkout(["-b", targetBranch, `origin/${targetBranch}`]);
        }
      }

      await git.add(config.data.jsonFilePath);
      const commitMessage = "chore: Automated data update via sync script";
      const options = {
        "--author": `"${config.git.authorName} <${config.git.authorEmail}>"`,
      };
      await git.commit(commitMessage, config.data.jsonFilePath, options);
      console.log(`Changes committed to ${targetBranch}.`);

      const pushResult = await git.push(config.git.remoteName, targetBranch);
      console.log(
        `Successfully pushed changes to ${config.git.remoteName}/${targetBranch}.`
      );
    } catch (error) {
      console.error("Error in commitAndPushData:", error);

      let errorType: GitError["type"] = "general";
      if (error instanceof Error) {
        if (error.message.includes("push")) {
          errorType = "push";
        } else if (error.message.includes("commit")) {
          errorType = "commit";
        } else if (error.message.includes("checkout")) {
          errorType = "checkout";
        }
      }

      throw new GitError(
        `Failed to commit and push data: ${
          error instanceof Error ? error.message : String(error)
        }`,
        errorType,
        error instanceof Error ? error : undefined
      );
    }
  };

  export const syncAndCommitData = async () => {
    const localData = await pullDataFile();
    const areEqual = await PersistanceService.areJsonFilesEqual(localData);
    if (!areEqual) {
      await commitAndPushData();
    } else {
      console.log("No changes to commit.");
      return;
    }
  };
}

export default GitService;

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import fs from "fs";
import { config } from "src/config";
import { GitError } from "./git.error";

namespace GitClient {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.git.appId,
      privateKey: fs.readFileSync(config.git.privateKeyPath, "utf8"),
      installationId: config.git.installationId,
    },
  });

  export const getFile = async () => {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: config.git.ownerOrg,
        repo: config.git.targetRepo,
        path: config.data.jsonFilePath,
        ref: config.git.targetBranch,
      });

      if (Array.isArray(data)) {
        throw new Error("Expected single file, got multiple files");
      }

      return Buffer.from(data.content, "base64").toString("utf-8");
    } catch (error: any) {
      if (error.status === 403) {
        throw new GitError(
          `GitHub App permissions error: ${error.message}.`,
          "pull",
          error
        );
      } else if (error.status === 404) {
        throw new GitError(
          `File not found: ${config.data.jsonFilePath} in ${config.git.ownerOrg}/${config.git.targetRepo} on branch ${config.git.targetBranch}`,
          "pull",
          error
        );
      }
      throw new GitError(`Failed to get file: ${error.message}`, "pull", error);
    }
  };

  export const updateFile = async (fileContent: string) => {
    try {
      const base64Content = Buffer.from(fileContent).toString("base64");
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: config.git.ownerOrg,
        repo: config.git.targetRepo,
        path: config.data.jsonFilePath,
        message: "chore: update data.json by crawler",
        committer: {
          name: "Dtu Crawler",
          email: "hello@droptableusers.com",
        },
        content: base64Content,
        branch: config.git.targetBranch,
      });
      console.log("response", response);
    } catch (error: any) {
      if (error.status === 403) {
        throw new GitError(
          `GitHub App permissions error: ${error.message}.`,
          "push",
          error
        );
      }
      throw new GitError(
        `Failed to update file: ${error.message}`,
        "push",
        error
      );
    }
  };
}

export default GitClient;

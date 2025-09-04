import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import fs from "fs";
import { config } from "src/config";
import { GitError } from "./git.error";
import { getFileResponseDto } from "./git.schema";
import { ZodError } from "zod";
import PersistanceService from "src/persistance/persistance.service";

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
        throw new GitError(
          `Expected single file, got multiple files: ${JSON.stringify(data)}`,
          "pull"
        );
      }

      if (data.type !== "file") {
        throw new GitError(`Expected file, got ${data.type}`, "pull");
      }
      return getFileResponseDto.parse({
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        sha: data.sha,
      });
    } catch (error: any) {
      switch (true) {
        case error?.status === 403:
          throw new GitError(
            `GitHub App permissions error: ${error.message}.`,
            "pull",
            error
          );
        case error?.status === 404:
          throw new GitError(
            `File not found: ${config.data.jsonFilePath} in ${config.git.ownerOrg}/${config.git.targetRepo} on branch ${config.git.targetBranch}`,
            "pull",
            error
          );
        case error?.status === 401:
          throw new GitError(
            `GitHub App authentication error: ${error.message}.`,
            "pull",
            error
          );
        case error instanceof ZodError:
          throw new GitError(
            `Invalid file content: ${error.message}`,
            "pull",
            error
          );
        default:
          throw new GitError(
            `Failed to get file: ${error?.message ?? String(error)}`,
            "pull",
            error
          );
      }
    }
  };

  export const updateFile = async (sha: string) => {
    const base64Content = await PersistanceService.getAllInBase64();
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: config.git.ownerOrg,
        repo: config.git.targetRepo,
        path: config.data.jsonFilePath,
        message: "chore: update data.json by crawler",
        committer: {
          name: "Dtu Crawler",
          email: "hello@droptableusers.com",
        },
        sha,
        content: base64Content,
        branch: config.git.targetBranch,
      });
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

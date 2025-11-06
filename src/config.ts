import * as path from "node:path";
import dotenv from "dotenv";
import env from "env-var";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  env: env.get("NODE_ENV").required().asString(),
  git: {
    appId: env.get("GITHUB_APP_ID").required().asString(),
    privateKeyPath: env.get("GIT_PRIVATE_KEY_PATH").required().asString(),
    installationId: env.get("GIT_INSTALLATION_ID").required().asString(),
    ownerOrg: env.get("GIT_OWNER_ORG").required().asString(),
    targetRepo: env.get("GIT_TARGET_REPO").required().asString(),
    targetBranch: env.get("GIT_TARGET_BRANCH").required().asString(),
    commiter: {
      name: env.get("GIT_COMMITTER_NAME").required().asString(),
      email: env.get("GIT_COMMITTER_EMAIL").required().asString(),
    },
    commitMessage: env.get("GIT_COMMIT_MESSAGE").required().asString(),
  },
  data: {
    jsonFilePath: env.get("DATA_JSON_PATH").required().asString(),
    scrapeFrom: env.get("DATA_SCRAPE_FROM").required().asInt(),
  },
  slack: {
    webhookUrl: env.get("SLACK_WEBHOOK_URL").required().asString(),
  },
};

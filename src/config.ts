import * as path from "node:path";
import dotenv from "dotenv";
import env from "env-var";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  git: {
    username: env.get("GIT_USERNAME").required().asString(),
    remoteUrl: env.get("GIT_REMOTE_URL").required().asString(),
    localPath: env.get("GIT_LOCAL_PATH").required().asString(),
    remoteName: env.get("GIT_REMOTE_NAME").required().asString(),
    branch: env.get("GIT_BRANCH").required().asString(),
    authorName: env.get("GIT_AUTHOR_SERVICE_NAME").required().asString(),
    authorEmail: env.get("GIT_AUTHOR_SERVICE_EMAIL").required().asString(),
  },
  data: {
    jsonFilePath: env.get("DATA_JSON_PATH").required().asString(),
  },
};

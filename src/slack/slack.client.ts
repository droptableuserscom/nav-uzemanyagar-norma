import axios from "axios";
import { config } from "../config";
import axiosRetry from "axios-retry";

namespace SlackClient {
  const slackClient = axios.create({
    headers: {
      "Content-Type": "application/json",
    },
  });
  axiosRetry(slackClient, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
  });
  export const sendMessage = async (message: string) => {
    try {
      await slackClient.post(config.slack.webhookUrl, {
        text: message,
      });
      console.log("Slack message sent successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Slack API Error Details:");
        console.error("Status:", error.response?.status);
        console.error("Status Text:", error.response?.statusText);
        console.error("Response Data:", error.response?.data);
        console.error("Request URL:", error.config?.baseURL);
        console.error("Request Method:", error.config?.method);
      }
      return null;
    }
  };
}

export default SlackClient;

import axios from "axios";
import axiosRetry from "axios-retry";
import { htmlSchema } from "src/scraper/scraper.schema";

const scraperClient = axios.create({
  baseURL: "https://nav.gov.hu",
});

axiosRetry(scraperClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

export const getHtml = async (link: string) => {
  console.log("link", scraperClient.defaults.baseURL + link);
  const response = await scraperClient.get(link);
  return htmlSchema.parse(response.data);
};

export default scraperClient;

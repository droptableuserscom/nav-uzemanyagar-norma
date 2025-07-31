import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import ScraperService from "src/scraper/scraper.service";

export const webhookRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: { description: "Success" },
      500: {
        description: "Internal server error",
      },
    },
  }),
  async (c) => {
    await ScraperService.runScraper();
    return c.body(null, 200);
  }
);

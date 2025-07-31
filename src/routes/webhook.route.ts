import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import ScraperService from "src/scraper/scraper.service";
import { z } from "zod";

export const webhookRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Webhook Status",
        content: {
          "text/plain": {
            schema: z.string().openapi({
              example: "Webhook received",
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    await ScraperService.runScraper();
    return c.text("Webhook received");
  }
);

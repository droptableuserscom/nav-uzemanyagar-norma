import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import ScraperService from "src/scraper/scraper.service";
import SlackClient from "src/slack/slack.client";

export const webhookRoute = new OpenAPIHono()
  .openapi(
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
      const errors = await ScraperService.runScraper();
      if (errors.length > 0) {
        await SlackClient.sendMessage(errors.join("\n"));
      }
      return c.body(null, 200);
    }
  )
  .onError(async (err, c) => {
    console.log("err", err);
    await SlackClient.sendMessage(err.message);
    return c.body(null, 500);
  });

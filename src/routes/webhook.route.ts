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
      const { errors, message } = await ScraperService.runScraper();
      await SlackClient.sendMessage(
        message + (errors.length ? "\n" + errors.join("\n") : "")
      );
      return c.body(null, 200);
    }
  )
  .onError(async (err, c) => {
    console.error("Error in webhook route", err);
    await SlackClient.sendMessage(err.message);
    return c.body(null, 500);
  });

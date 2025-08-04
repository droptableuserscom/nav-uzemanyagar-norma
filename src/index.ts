import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { homeRoute } from "./routes/home.route";
import { webhookRoute } from "./routes/webhook.route";
import { fuelPriceRoute } from "./routes/fuel-price.route";
import { NotFoundError } from "./persistance/persistance.error";

const app = new OpenAPIHono();

app
  .route("/", homeRoute)
  .route("/webhook", webhookRoute)
  .route("/uzemanyagar", fuelPriceRoute)
  .onError((err, c) => {
    console.error(err);
    if (err instanceof NotFoundError) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: "Internal server error" }, 500);
  });

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "NAV Uzemanyagar Norma API",
    description: "API for NAV Uzemanyagar Norma application",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "NAV Uzemanyagar Norma API",
    },
  ],
});

const port = parseInt(process.env.PORT || "3000");
const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(
      `OpenAPI documentation available at http://localhost:${port}/openapi.json`
    );
  }
);

export { app, server };

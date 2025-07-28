import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { homeRoute } from "./routes/home";
import { webhookRoute } from "./routes/webhook";

const app = new OpenAPIHono();

app.route("/", homeRoute).route("/webhook", webhookRoute);

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

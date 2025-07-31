import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

export const homeRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "API Status",
        content: {
          "text/plain": {
            schema: z.string().openapi({
              example: "NAV Uzemanyagar Norma API is running",
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.text("NAV Uzemanyagar Norma API is running");
  }
);

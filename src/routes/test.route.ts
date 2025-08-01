import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { config } from "src/config";
import GitService from "src/git/git.service";
import PersistanceService from "src/persistance/persistance.service";

export const testRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "API Status",
        content: {
          "text/plain": {
            schema: z.string().openapi({
              example: "Test route",
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    console.log(config.git);

    return c.text("Test route");
  }
);

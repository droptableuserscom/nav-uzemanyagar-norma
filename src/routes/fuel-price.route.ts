import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const fuelPriceRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Uzemanyag ar",
        content: {
          "text/plain": {
            schema: z.string().openapi({
              example: "Uzemanyag ar",
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    return c.text("Uzemanyag ar");
  }
);

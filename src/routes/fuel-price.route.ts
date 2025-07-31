import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import FuelPriceService from "src/fuel-price/fuel-price.service";
import { fuelPriceOrYearSchema } from "src/scraper/scraper.schema";
import { monthParamSchema, yearParamSchema } from "./routes.schema";

const fuelPriceFilterSchema = z.object({
  ev: yearParamSchema.optional(),
  honap: monthParamSchema.optional(),
});

export const fuelPriceRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    request: {
      query: fuelPriceFilterSchema,
    },
    responses: {
      200: {
        description: "Get actual fuel prices",
        content: {
          "application/json": {
            schema: fuelPriceOrYearSchema.openapi({
              examples: [
                {
                  olmozatlanMotorbenzin: 100,
                  gazolaj: 100,
                  keverek: 100,
                  lpg: 100,
                  cng: 100,
                },
                {
                  január: {
                    olmozatlanMotorbenzin: 100,
                    gazolaj: 100,
                    keverek: 100,
                    lpg: 100,
                    cng: 100,
                  },
                },
              ],
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const { ev, honap } = c.req.valid("query");
    const prices = await FuelPriceService.handleFuelPriceRequest(ev, honap);
    return c.json(prices);
  }
);

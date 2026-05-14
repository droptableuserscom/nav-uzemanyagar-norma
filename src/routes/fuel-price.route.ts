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
        description:
          "NAV fuel prices: one month or full year; optionally includes special (protected) prices.",
        content: {
          "application/json": {
            schema: fuelPriceOrYearSchema.openapi({
              examples: [
                {
                  olmozatlanMotorbenzin: 704,
                  olmozatlanMotorbenzinSpecial: 595,
                  gazolaj: 802,
                  gazolajSpecial: 615,
                  keverek: 756,
                  lpg: 356,
                  cng: 860,
                },
                {
                  olmozatlanMotorbenzin: 580,
                  gazolaj: 587,
                  keverek: 632,
                  lpg: 328,
                  cng: 800,
                },
                {
                  január: {
                    olmozatlanMotorbenzin: 572,
                    gazolaj: 586,
                    keverek: 624,
                    lpg: 328,
                    cng: 810,
                  },
                  május: {
                    olmozatlanMotorbenzin: 704,
                    olmozatlanMotorbenzinSpecial: 595,
                    gazolaj: 802,
                    gazolajSpecial: 615,
                    keverek: 756,
                    lpg: 356,
                    cng: 860,
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

import { fuelPriceSchema, monthNameSchema } from "src/scraper/scraper.schema";
import { z } from "zod";

export const updateYearPricesSchema = z.object({
  year: z.number().min(1900).max(2100),
  month: monthNameSchema,
  prices: fuelPriceSchema,
});

export type UpdateYearPrices = z.infer<typeof updateYearPricesSchema>;

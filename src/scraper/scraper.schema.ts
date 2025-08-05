import { z } from "zod";

export const htmlSchema = z.string().refine(
  (data) => {
    const trimmed = data.trim();
    return (
      /^<(!DOCTYPE\s+html|html|HTML)/i.test(trimmed) ||
      /<\s*[a-zA-Z][^>]*>/i.test(trimmed)
    );
  },
  { message: "Response does not contain valid HTML" }
);

export const fuelPriceSchema = z.object({
  olmozatlanMotorbenzin: z.number().positive(),
  gazolaj: z.number().positive(),
  keverek: z.number().positive(),
  lpg: z.number().positive(),
  cng: z.number().positive(),
});

export const monthNames = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
] as const;

export const monthNameSchema = z
  .string()
  .refine((val) => monthNames.includes(val as (typeof monthNames)[number]), {
    message: "Invalid month name",
  });

export const yearFuelPricesSchema = z.record(monthNameSchema, fuelPriceSchema);

export const fuelPriceOrYearSchema = z.union([
  fuelPriceSchema,
  yearFuelPricesSchema,
]);

export type FuelPrice = z.infer<typeof fuelPriceSchema>;
export type YearFuelPrices = z.infer<typeof yearFuelPricesSchema>;

export const scraperServiceResponseSchema = z.object({
  errors: z.array(z.string()),
  message: z.string(),
});

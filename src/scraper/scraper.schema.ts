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

export const monthsSchema = z.record(
  z.string().refine((val) => monthNames.includes(val as any), {
    message: "Invalid month name",
  }),
  fuelPriceSchema
);

export const yearPricesSchema = z.record(
  z.string().regex(/^\d{4}$/, "Year must be a 4-digit number"),
  z.array(monthsSchema)
);

export type YearPrices = z.infer<typeof yearPricesSchema>;
export type FuelPrice = z.infer<typeof fuelPriceSchema>;
export type Month = z.infer<typeof monthsSchema>;

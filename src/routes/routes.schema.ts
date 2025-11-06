import { z } from "zod";

export const yearParamSchema = z
  .string()
  .refine((val) => !isNaN(Number(val)), {
    message: "Year must be a number",
  })
  .transform((val) => Number(val));

export const monthParamSchema = z
  .string()
  .refine((val) => !isNaN(Number(val)), {
    message: "Month must be a number",
  })
  .transform((val) => Number(val));

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

import { z } from "zod";

export const getFileResponseDto = z.object({
  content: z.string(),
  sha: z.string(),
});

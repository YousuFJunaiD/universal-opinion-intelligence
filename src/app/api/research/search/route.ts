import { z } from "zod";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody } from "@/lib/api/validation";
import { searchPublicSources } from "@/lib/research/research-provider";

const ROUTE = "/api/research/search";

const requestSchema = z.object({
  dateRange: z.string().optional().default(""),
  language: z.string().optional().default(""),
  query: z.string().trim().min(1),
  region: z.string().optional().default("")
});

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = requestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }

    const result = await searchPublicSources(parsed.data);
    return successResponse(result, requestId);
  });
}

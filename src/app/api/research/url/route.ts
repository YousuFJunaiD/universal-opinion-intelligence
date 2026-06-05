import { z } from "zod";
import { withApiLogging } from "@/lib/api/logger";
import { createRequestId, errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { formatZodError, parseJsonBody } from "@/lib/api/validation";
import { extractPublicUrl } from "@/lib/research/url-extraction";

const ROUTE = "/api/research/url";

const requestSchema = z.object({
  urls: z.array(z.string().trim().url()).min(1).max(5)
});

export async function POST(request: Request) {
  const requestId = createRequestId();
  return withApiLogging(request, ROUTE, requestId, async () => {
    const parsed = requestSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return validationErrorResponse(requestId, formatZodError(parsed.error));
    }

    const results = [];
    const errors = [];

    for (const url of parsed.data.urls) {
      try {
        results.push(await extractPublicUrl(url));
      } catch (error) {
        errors.push({
          url,
          message: error instanceof Error ? error.message : "URL extraction failed."
        });
      }
    }

    if (results.length === 0) {
      return errorResponse({
        code: "url_extraction_failed",
        details: errors,
        message: "No public URL content could be extracted.",
        requestId,
        status: 422
      });
    }

    return successResponse({ results, errors }, requestId);
  });
}

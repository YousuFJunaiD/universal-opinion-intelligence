import type { PublicResearchRecord, UrlExtractionResult } from "@/types/research";

const MAX_TEXT_LENGTH = 12000;

export async function extractPublicUrl(url: string): Promise<UrlExtractionResult> {
  const normalizedUrl = normalizePublicUrl(url);
  const response = await fetch(normalizedUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`URL fetch failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error("Only public HTML pages are supported for URL extraction.");
  }

  const html = await response.text();
  const title = decodeHtml(extractTag(html, "title") || normalizedUrl);
  const description = decodeHtml(extractMetaDescription(html));
  const readableText = cleanText(stripHtml(removeNonReadableSections(html))).slice(0, MAX_TEXT_LENGTH);
  const commentRecords = extractCommentLikeRecords(html, normalizedUrl, title);
  const records: PublicResearchRecord[] = [];

  if (description) {
    records.push(createRecord(description, normalizedUrl, title, "meta-description"));
  }

  if (readableText) {
    records.push(createRecord(readableText, normalizedUrl, title, "readable-page-text"));
  }

  records.push(...commentRecords);

  return {
    url: normalizedUrl,
    title,
    description,
    text: readableText,
    records,
    limitations: [
      "Only publicly accessible HTML was fetched.",
      "No login, CAPTCHA, private, hidden, or platform API data was accessed.",
      "Comment extraction is limited to comment-like text visible in the delivered HTML.",
      commentRecords.length
        ? "Visible comment-like HTML blocks were extracted when detected."
        : "No public comments were detected in the delivered HTML; analysis is based on page title, meta description, and readable page text only."
    ]
  };
}

function normalizePublicUrl(url: string) {
  const parsed = new URL(url.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }
  if (!isPublicHostname(parsed.hostname)) {
    throw new Error("Only public web hostnames are supported. Local, private, and link-local addresses are blocked.");
  }
  return parsed.toString();
}

function isPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return false;
  }

  if (
    /^127\./.test(normalized) ||
    /^10\./.test(normalized) ||
    /^192\.168\./.test(normalized) ||
    /^169\.254\./.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  ) {
    return false;
  }

  return true;
}

function removeNonReadableSections(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ");
}

function cleanText(text: string) {
  return decodeHtml(text).replace(/\s+/g, " ").trim();
}

function extractTag(html: string, tagName: string) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function extractMetaDescription(html: string) {
  const match =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i) ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  return match?.[1]?.trim() ?? "";
}

function extractCommentLikeRecords(html: string, sourceUrl: string, sourceTitle: string) {
  const records: PublicResearchRecord[] = [];
  const commentMatches = html.matchAll(
    /<[^>]+(?:class|id)=["'][^"']*(?:comment|review|reply|discussion)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi
  );

  for (const match of commentMatches) {
    const text = cleanText(stripHtml(removeNonReadableSections(match[1] ?? "")));
    if (text.length >= 20 && !records.some((record) => record.text === text)) {
      records.push(createRecord(text.slice(0, 2000), sourceUrl, sourceTitle, "visible-html-comment"));
    }
  }

  return records.slice(0, 25);
}

function createRecord(
  text: string,
  sourceUrl: string,
  sourceTitle: string,
  recordType: string
): PublicResearchRecord {
  return {
    id: crypto.randomUUID(),
    text,
    sourceUrl,
    sourceTitle,
    metadata: {
      recordType,
      sourceUrl,
      sourceTitle
    }
  };
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

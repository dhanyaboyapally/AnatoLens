export type LearningResourceType = "image" | "video";

export type LearningResource = {
  type: LearningResourceType;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  videoId?: string;
  duration?: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function thumbnailValue(value: unknown) {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";
  return stringValue(value.static) || stringValue(value.rich);
}

function videoIdFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    if (parsed.hostname.endsWith("youtube.com")) return parsed.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
  return "";
}

function normalizeImageResults(results: unknown): LearningResource[] {
  if (!Array.isArray(results)) return [];
  return results.flatMap((value) => {
    if (!isRecord(value)) return [];
    const url = stringValue(value.link);
    const thumbnailUrl = stringValue(value.thumbnail) || stringValue(value.original);
    if (!url || !thumbnailUrl) return [];
    return [{
      type: "image" as const,
      title: stringValue(value.title) || "Anatomy image",
      url,
      thumbnailUrl,
      source: stringValue(value.source) || "Google Images",
    }];
  }).slice(0, 3);
}

function normalizeVideoResults(results: unknown): LearningResource[] {
  if (!Array.isArray(results)) return [];
  return results.flatMap((value) => {
    if (!isRecord(value)) return [];
    const url = stringValue(value.link);
    const videoId = stringValue(value.video_id) || videoIdFromUrl(url);
    const thumbnailUrl = thumbnailValue(value.thumbnail);
    if (!url || !videoId || !thumbnailUrl) return [];
    const channel = isRecord(value.channel) ? stringValue(value.channel.name) : "";
    return [{
      type: "video" as const,
      title: stringValue(value.title) || "Anatomy video",
      url,
      thumbnailUrl,
      source: channel || "YouTube",
      videoId,
      duration: stringValue(value.length) || undefined,
    }];
  }).slice(0, 3);
}

export async function searchLearningResources(
  type: LearningResourceType,
  query: string,
) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return {
      available: false,
      message: "Learning resource search is not configured yet.",
      items: [] as LearningResource[],
    };
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    engine: type === "image" ? "google_images" : "youtube",
    ...(type === "image" ? { q: query } : { search_query: query }),
    num: "3",
    hl: "en",
  });
  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  const payload = await response.json() as unknown;
  if (!response.ok || !isRecord(payload)) {
    throw new Error("The learning resource search failed.");
  }
  if (typeof payload.error === "string") {
    throw new Error(payload.error);
  }

  const items = type === "image"
    ? normalizeImageResults(payload.images_results)
    : normalizeVideoResults(payload.video_results);
  return {
    available: true,
    message: items.length ? undefined : "No suitable learning resources were found.",
    items,
  };
}

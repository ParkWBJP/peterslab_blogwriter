const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

loadDotEnv();

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const NOTION_VERSION = process.env.NOTION_VERSION || "2026-03-11";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function serveStatic(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(ROOT, normalizedPath.replace(/^\/+/, ""));
  const extension = path.extname(filePath).toLowerCase();

  if (![".html", ".css", ".js", ".md"].includes(extension)) {
    return false;
  }

  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(response);
  return true;
}

function currentDateLabel() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${formatter.format(new Date())} (JST)`;
}

async function callOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to your local .env file.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI request failed (${response.status}).`);
  }

  return data;
}

async function callNotion(payload) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("NOTION_API_KEY is not configured. Add it to your local .env file.");
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Notion request failed (${response.status}).`);
  }

  return data;
}

function collectTextParts(value, bucket) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectTextParts(item, bucket));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  if (value.type === "output_text" && typeof value.text === "string") {
    bucket.push(value.text);
  }

  Object.values(value).forEach((entry) => collectTextParts(entry, bucket));
}

function extractOutputText(responseData) {
  if (typeof responseData.output_text === "string" && responseData.output_text.trim()) {
    return responseData.output_text;
  }

  const bucket = [];
  collectTextParts(responseData.output, bucket);
  return bucket.join("\n").trim();
}

function collectSources(value, bucket, seen) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSources(item, bucket, seen));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  if (value.type === "url_citation" && typeof value.url === "string" && !seen.has(value.url)) {
    seen.add(value.url);
    bucket.push({
      title: value.title || value.url,
      url: value.url,
    });
  }

  Object.values(value).forEach((entry) => collectSources(entry, bucket, seen));
}

function extractSources(responseData) {
  const bucket = [];
  collectSources(responseData.output, bucket, new Set());
  return bucket.slice(0, 8);
}

function parseJsonObject(text) {
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  const trimmed = text.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const startIndex = trimmed.indexOf("{");
    const endIndex = trimmed.lastIndexOf("}");
    if (startIndex < 0 || endIndex < startIndex) {
      throw new Error("OpenAI response did not contain JSON.");
    }
    return JSON.parse(trimmed.slice(startIndex, endIndex + 1));
  }
}

function normalizeLanguageMap(value) {
  return {
    ja: value?.ja || "",
    ko: value?.ko || "",
    en: value?.en || "",
  };
}

function coerceTrendPayload(payload) {
  return {
    seasonLabel: {
      ko: payload.seasonLabelKo || "",
      en: payload.seasonLabelEn || "",
      ja: payload.seasonLabelJa || "",
    },
    trends: Array.isArray(payload.trends) ? payload.trends.slice(0, 5) : [],
  };
}

function coerceIdeaPayload(payload) {
  return {
    selectedTrendSummary: normalizeLanguageMap(payload.selectedTrendSummary),
    keywords: Array.isArray(payload.keywords) ? payload.keywords.slice(0, 6) : [],
    titleSuggestions: Array.isArray(payload.titleSuggestions) ? payload.titleSuggestions.slice(0, 3) : [],
  };
}

function coerceDraftPayload(payload) {
  const source = payload || {};
  return {
    aiOriginal: {
      title: normalizeLanguageMap(source.aiOriginal?.title),
      lead: normalizeLanguageMap(source.aiOriginal?.lead),
      body: normalizeLanguageMap(source.aiOriginal?.body),
      cta: normalizeLanguageMap(source.aiOriginal?.cta),
      meta: normalizeLanguageMap(source.aiOriginal?.meta),
      keywords: normalizeLanguageMap(source.aiOriginal?.keywords),
    },
    safeVersion: {
      title: normalizeLanguageMap(source.safeVersion?.title),
      lead: normalizeLanguageMap(source.safeVersion?.lead),
      body: normalizeLanguageMap(source.safeVersion?.body),
      cta: normalizeLanguageMap(source.safeVersion?.cta),
      meta: normalizeLanguageMap(source.safeVersion?.meta),
      keywords: normalizeLanguageMap(source.safeVersion?.keywords),
    },
    rationale: {
      whyThisDirection: normalizeLanguageMap(source.rationale?.whyThisDirection),
      empathyPoint: normalizeLanguageMap(source.rationale?.empathyPoint),
      brandConnection: normalizeLanguageMap(source.rationale?.brandConnection),
    },
    reviewSummary: normalizeLanguageMap(source.reviewSummary),
    compliance: {
      level: source.compliance?.level || "Low",
      items: Array.isArray(source.compliance?.items) ? source.compliance.items.slice(0, 10) : [],
    },
  };
}

function buildTrendSearchPrompt(filters) {
  return [
    `Today is ${currentDateLabel()}.`,
    "Use live web search to identify Japan-relevant pet trends, seasonal needs, commemorative days, and daily care topics that could connect naturally to PetersLab.",
    `Pet focus: ${filters.petType || "common"}.`,
    `Theme focus: ${filters.themeType || "health"}.`,
    `Search scope: ${filters.scope || "japan"}.`,
    "Return concise research notes in English.",
    "Focus on signals that can lead to warm, trustworthy, non-sensational blog content for dog and cat owners.",
  ].join("\n");
}

function buildTrendStructuringPrompt(researchNotes, filters) {
  return [
    `Today is ${currentDateLabel()}.`,
    "Turn the research notes below into a PetersLab trend scan result for a beginner-friendly blog-writing tool.",
    `Pet focus: ${filters.petType || "common"}.`,
    `Theme focus: ${filters.themeType || "health"}.`,
    `Search scope: ${filters.scope || "japan"}.`,
    "Return one JSON object only.",
    "",
    "Research notes:",
    researchNotes,
    "",
    "JSON schema:",
    "{",
    '  "seasonLabelKo": "string",',
    '  "seasonLabelEn": "string",',
    '  "seasonLabelJa": "string",',
    '  "trends": [',
    "    {",
    '      "titleKo": "string",',
    '      "titleEn": "string",',
    '      "titleJa": "string",',
    '      "summaryKo": "string",',
    '      "summaryEn": "string",',
    '      "summaryJa": "string",',
    '      "whyNowKo": "string",',
    '      "whyNowEn": "string",',
    '      "whyNowJa": "string",',
    '      "petersPointKo": "string",',
    '      "petersPointEn": "string",',
    '      "petersPointJa": "string",',
    '      "targetPetKo": "string",',
    '      "targetPetEn": "string",',
    '      "targetPetJa": "string",',
    '      "priority": "High|Medium|Low"',
    "    }",
    "  ]",
    "}",
  ].join("\n");
}

function buildIdeaPrompt(trend, selectedKeyword, outputLanguage) {
  return [
    `Today is ${currentDateLabel()}.`,
    "You are helping a beginner use Peter's Lab Blog Writer.",
    "Based on the selected trend, suggest practical keywords and three title ideas for a Japan-facing blog.",
    "Make the titles emotionally relatable to pet owners without becoming sensational.",
    `Preferred output language: ${outputLanguage || "ja"}.`,
    `Trend title JA: ${trend.titleJa || ""}`,
    `Trend title KO: ${trend.titleKo || ""}`,
    `Trend title EN: ${trend.titleEn || ""}`,
    `Trend summary JA: ${trend.summaryJa || ""}`,
    `PetersLab connection JA: ${trend.petersPointJa || ""}`,
    `Selected keyword: ${selectedKeyword || "none"}`,
    "Return one JSON object only.",
    "{",
    '  "selectedTrendSummary": {"ko": "string", "en": "string", "ja": "string"},',
    '  "keywords": [',
    "    {",
    '      "value": "string",',
    '      "reasonKo": "string",',
    '      "reasonEn": "string",',
    '      "reasonJa": "string"',
    "    }",
    "  ],",
    '  "titleSuggestions": [',
    "    {",
    '      "titleKo": "string",',
    '      "titleEn": "string",',
    '      "titleJa": "string",',
    '      "angleKo": "string",',
    '      "angleEn": "string",',
    '      "angleJa": "string"',
    "    }",
    "  ]",
    "}",
  ].join("\n");
}

function buildDraftPrompt(body) {
  const selection = body.selection || {};
  return [
    `Today is ${currentDateLabel()}.`,
    "Write a PetersLab blog draft for Japan-facing marketing use.",
    "The copy should feel premium, calm, warm, trustworthy, and easy for general pet owners to read.",
    "Avoid diagnosis, treatment, cure, prevention, guaranteed results, and fear-based claims.",
    `Primary display language: ${selection.outputLanguage || "ja"}`,
    `Trend title JA: ${selection.trendTitleJa || ""}`,
    `Keyword: ${selection.keyword || ""}`,
    `Direction: ${selection.direction || "empathy"}`,
    `Selected title JA: ${selection.titleJa || ""}`,
    `Selected title KO: ${selection.titleKo || ""}`,
    `Selected title EN: ${selection.titleEn || ""}`,
    `Trend summary JA: ${selection.trendSummaryJa || ""}`,
    `Trend summary EN: ${selection.trendSummaryEn || ""}`,
    "Return one JSON object only.",
    "{",
    '  "aiOriginal": {',
    '    "title": {"ja": "string", "ko": "string", "en": "string"},',
    '    "lead": {"ja": "string", "ko": "string", "en": "string"},',
    '    "body": {"ja": "string", "ko": "string", "en": "string"},',
    '    "cta": {"ja": "string", "ko": "string", "en": "string"},',
    '    "meta": {"ja": "string", "ko": "string", "en": "string"},',
    '    "keywords": {"ja": "string", "ko": "string", "en": "string"}',
    "  },",
    '  "safeVersion": {',
    '    "title": {"ja": "string", "ko": "string", "en": "string"},',
    '    "lead": {"ja": "string", "ko": "string", "en": "string"},',
    '    "body": {"ja": "string", "ko": "string", "en": "string"},',
    '    "cta": {"ja": "string", "ko": "string", "en": "string"},',
    '    "meta": {"ja": "string", "ko": "string", "en": "string"},',
    '    "keywords": {"ja": "string", "ko": "string", "en": "string"}',
    "  },",
    '  "rationale": {',
    '    "whyThisDirection": {"ja": "string", "ko": "string", "en": "string"},',
    '    "empathyPoint": {"ja": "string", "ko": "string", "en": "string"},',
    '    "brandConnection": {"ja": "string", "ko": "string", "en": "string"}',
    "  },",
    '  "reviewSummary": {"ja": "string", "ko": "string", "en": "string"},',
    '  "compliance": {',
    '    "level": "Low|Medium|High",',
    '    "items": [',
    "      {",
    '        "before": "string",',
    '        "after": "string",',
    '        "reasonKo": "string",',
    '        "reasonEn": "string",',
    '        "reasonJa": "string",',
    '        "meaningKo": "string",',
    '        "meaningEn": "string",',
    '        "meaningJa": "string"',
    "      }",
    "    ]",
    "  }",
    "}",
  ].join("\n");
}

function richTextArray(text) {
  return [
    {
      type: "text",
      text: {
        content: String(text || "").slice(0, 2000),
      },
    },
  ];
}

function paragraphBlocks(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return [];
  }

  const blocks = [];
  const chunks = normalized.split(/\n{2,}/).flatMap((part) => {
    if (part.length <= 1800) {
      return [part];
    }

    const result = [];
    for (let index = 0; index < part.length; index += 1800) {
      result.push(part.slice(index, index + 1800));
    }
    return result;
  });

  chunks.forEach((chunk) => {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: richTextArray(chunk),
      },
    });
  });

  return blocks;
}

function headingBlock(level, text) {
  return {
    object: "block",
    type: level,
    [level]: {
      rich_text: richTextArray(text),
    },
  };
}

function bulletedBlock(text) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: richTextArray(text),
    },
  };
}

function formatDraftForNotion(body) {
  const selection = body.selection || {};
  const draft = body.draft || {};
  const compliance = body.compliance || { level: "Low", items: [] };
  const lang = body.outputLanguage || "ja";
  const title = draft.title || "Peter's Lab Blog Writer";
  const children = [
    headingBlock("heading_1", title),
    ...paragraphBlocks(`Language: ${lang.toUpperCase()}`),
    ...paragraphBlocks(`Trend: ${selection.trendTitle || "-"}`),
    ...paragraphBlocks(`Keyword: ${selection.keyword || "-"}`),
    ...paragraphBlocks(`Direction: ${selection.direction || "-"}`),
    headingBlock("heading_2", "Lead"),
    ...paragraphBlocks(draft.lead || ""),
    headingBlock("heading_2", "Body"),
    ...paragraphBlocks(draft.body || ""),
    headingBlock("heading_2", "CTA"),
    ...paragraphBlocks(draft.cta || ""),
    headingBlock("heading_2", "Meta Description"),
    ...paragraphBlocks(draft.meta || ""),
    headingBlock("heading_2", "Image Keywords"),
    ...paragraphBlocks(draft.keywords || ""),
    headingBlock("heading_2", "Compliance Notes"),
    bulletedBlock(`Risk level: ${compliance.level || "Low"}`),
  ];

  (compliance.items || []).slice(0, 10).forEach((item) => {
    children.push(bulletedBlock(`${item.before} -> ${item.after}`));
  });

  return {
    parent: {
      type: "page_id",
      page_id: process.env.NOTION_PARENT_PAGE_ID,
    },
    properties: {
      title: {
        title: richTextArray(title),
      },
    },
    children: children.slice(0, 100),
  };
}

async function createTrendResponse(filters) {
  const searchResponse = await callOpenAI({
    model: OPENAI_MODEL,
    tools: [
      {
        type: "web_search",
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          country: "JP",
          city: "Tokyo",
          timezone: "Asia/Tokyo",
        },
      },
    ],
    instructions:
      "You are Peter's Lab Blog Writer's trend researcher. Search the live web and focus on Japan-facing pet owner interests, seasonality, commemorative days, and gentle home-care topics.",
    input: buildTrendSearchPrompt(filters),
  });

  const structuringResponse = await callOpenAI({
    model: OPENAI_MODEL,
    text: {
      format: {
        type: "json_object",
      },
    },
    instructions:
      "You convert research notes into structured JSON for a beginner-friendly editorial wizard. Stay faithful to the notes and avoid unsupported claims.",
    input: buildTrendStructuringPrompt(extractOutputText(searchResponse), filters),
  });

  const payload = coerceTrendPayload(parseJsonObject(extractOutputText(structuringResponse)));
  payload.sources = extractSources(searchResponse);
  return payload;
}

async function createIdeaResponse(body) {
  const ideaResponse = await callOpenAI({
    model: OPENAI_MODEL,
    text: {
      format: {
        type: "json_object",
      },
    },
    instructions:
      "You create keyword and title ideas for a PetersLab blog-writing wizard. Suggestions should feel empathetic, practical, and suitable for Japanese pet owners.",
    input: buildIdeaPrompt(body.trend || {}, body.selectedKeyword || "", body.outputLanguage || "ja"),
  });

  return coerceIdeaPayload(parseJsonObject(extractOutputText(ideaResponse)));
}

async function createDraftResponse(body) {
  const draftResponse = await callOpenAI({
    model: OPENAI_MODEL,
    text: {
      format: {
        type: "json_object",
      },
    },
    instructions:
      "You are PetersLab's multilingual drafting and compliance-support assistant. Create a Japanese-first blog draft, provide Korean and English versions, and soften risky wording without losing warmth or readability.",
    input: buildDraftPrompt(body),
  });

  return coerceDraftPayload(parseJsonObject(extractOutputText(draftResponse)));
}

async function createNotionUpload(body) {
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
  if (!parentPageId) {
    throw new Error("NOTION_PARENT_PAGE_ID is not configured. Add it to your local .env file.");
  }

  const payload = await callNotion(formatDraftForNotion(body));
  return {
    id: payload.id,
    url: payload.url,
  };
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, {
        openaiReady: Boolean(process.env.OPENAI_API_KEY),
        notionReady: Boolean(process.env.NOTION_API_KEY && process.env.NOTION_PARENT_PAGE_ID),
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/trends") {
      const body = await readBody(request);
      const payload = await createTrendResponse(body.filters || {});
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/ideas") {
      const body = await readBody(request);
      const payload = await createIdeaResponse(body);
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/draft") {
      const body = await readBody(request);
      const payload = await createDraftResponse(body);
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/notion-upload") {
      const body = await readBody(request);
      const payload = await createNotionUpload(body);
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "GET" && serveStatic(requestUrl.pathname, response)) {
      return;
    }

    sendError(response, 404, "Route not found.");
  } catch (error) {
    sendError(response, 500, error.message || "Unexpected server error.");
  }
});

server.listen(PORT, () => {
  console.log(`Peter's Lab Blog Writer server listening on http://localhost:${PORT}`);
});

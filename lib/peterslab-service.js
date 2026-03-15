const fs = require("node:fs");
const path = require("node:path");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const NOTION_VERSION = process.env.NOTION_VERSION || "2026-03-11";
const MIN_PRIMARY_ARTICLE_CHAR_COUNT = 1500;
const MAX_DRAFT_EXPANSION_ATTEMPTS = 4;

function loadDotEnv(rootDir = process.cwd()) {
  const envPath = path.join(rootDir, ".env");
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

function emptyLanguageMap() {
  return { ja: "", ko: "", en: "" };
}

function mapSingleLanguageValue(value, outputLanguage) {
  const bucket = emptyLanguageMap();
  if (typeof value === "string") {
    bucket[outputLanguage] = value;
    return bucket;
  }

  bucket[outputLanguage] = value?.[outputLanguage] || value?.ja || value?.ko || value?.en || "";
  return bucket;
}

function localizedString(value, outputLanguage, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  return value?.[outputLanguage] || value?.ja || value?.ko || value?.en || fallback;
}

function languageFieldSuffix(outputLanguage) {
  if (outputLanguage === "ko") return "Ko";
  if (outputLanguage === "en") return "En";
  return "Ja";
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

function coerceIdeaPayload(payload, outputLanguage) {
  const suffix = languageFieldSuffix(outputLanguage);
  return {
    selectedTrendSummary: payload.selectedTrendSummary
      ? mapSingleLanguageValue(payload.selectedTrendSummary, outputLanguage)
      : mapSingleLanguageValue(payload.selectedTrendSummaryText, outputLanguage),
    keywords: [],
    titleSuggestions: Array.isArray(payload.titleSuggestions)
      ? payload.titleSuggestions.slice(0, 3).map((item) => ({
          titleKo: outputLanguage === "ko" ? (item.title || item.titleKo || "") : item.titleKo || "",
          titleEn: outputLanguage === "en" ? (item.title || item.titleEn || "") : item.titleEn || "",
          titleJa: outputLanguage === "ja" ? (item.title || item.titleJa || "") : item.titleJa || "",
          angleKo: outputLanguage === "ko" ? (item.angle || item.angleKo || "") : item.angleKo || "",
          angleEn: outputLanguage === "en" ? (item.angle || item.angleEn || "") : item.angleEn || "",
          angleJa: outputLanguage === "ja" ? (item.angle || item.angleJa || "") : item.angleJa || "",
          [`title${suffix}`]: localizedString(item.title, outputLanguage, item[`title${suffix}`] || ""),
          [`angle${suffix}`]: localizedString(item.angle, outputLanguage, item[`angle${suffix}`] || ""),
        }))
      : [],
  };
}

function coerceDraftPayload(payload, outputLanguage) {
  const source = payload || {};
  const complianceItems = Array.isArray(source.compliance?.items)
    ? source.compliance.items.slice(0, 10).map((item) => ({
        before: item.before || "",
        after: item.after || "",
        reasonKo: outputLanguage === "ko" ? localizedString(item.reason, outputLanguage, item.reasonKo || "") : item.reasonKo || "",
        reasonEn: outputLanguage === "en" ? localizedString(item.reason, outputLanguage, item.reasonEn || "") : item.reasonEn || "",
        reasonJa: outputLanguage === "ja" ? localizedString(item.reason, outputLanguage, item.reasonJa || "") : item.reasonJa || "",
        meaningKo: outputLanguage === "ko" ? localizedString(item.meaning, outputLanguage, item.meaningKo || "") : item.meaningKo || "",
        meaningEn: outputLanguage === "en" ? localizedString(item.meaning, outputLanguage, item.meaningEn || "") : item.meaningEn || "",
        meaningJa: outputLanguage === "ja" ? localizedString(item.meaning, outputLanguage, item.meaningJa || "") : item.meaningJa || "",
      }))
    : [];

  return {
    aiOriginal: {
      title: mapSingleLanguageValue(source.aiOriginal?.title, outputLanguage),
      lead: mapSingleLanguageValue(source.aiOriginal?.lead, outputLanguage),
      body: mapSingleLanguageValue(source.aiOriginal?.body, outputLanguage),
      cta: mapSingleLanguageValue(source.aiOriginal?.cta, outputLanguage),
      meta: mapSingleLanguageValue(source.aiOriginal?.meta, outputLanguage),
      keywords: mapSingleLanguageValue(source.aiOriginal?.keywords, outputLanguage),
    },
    safeVersion: {
      title: mapSingleLanguageValue(source.safeVersion?.title, outputLanguage),
      lead: mapSingleLanguageValue(source.safeVersion?.lead, outputLanguage),
      body: mapSingleLanguageValue(source.safeVersion?.body, outputLanguage),
      cta: mapSingleLanguageValue(source.safeVersion?.cta, outputLanguage),
      meta: mapSingleLanguageValue(source.safeVersion?.meta, outputLanguage),
      keywords: mapSingleLanguageValue(source.safeVersion?.keywords, outputLanguage),
    },
    rationale: {
      whyThisDirection: mapSingleLanguageValue(source.rationale?.whyThisDirection, outputLanguage),
      empathyPoint: mapSingleLanguageValue(source.rationale?.empathyPoint, outputLanguage),
      brandConnection: mapSingleLanguageValue(source.rationale?.brandConnection, outputLanguage),
    },
    reviewSummary: mapSingleLanguageValue(source.reviewSummary, outputLanguage),
    compliance: {
      level: source.compliance?.level || "Low",
      items: complianceItems,
    },
  };
}

function countCharacters(text) {
  return Array.from(String(text || "").trim()).length;
}

function buildArticleCharacterCount(version, language) {
  if (!version) {
    return 0;
  }

  return countCharacters(version.title?.[language])
    + countCharacters(version.lead?.[language])
    + countCharacters(version.body?.[language])
    + countCharacters(version.cta?.[language])
    + countCharacters(version.meta?.[language]);
}

function requiredLengthLanguages(outputLanguage) {
  if (outputLanguage === "ko" || outputLanguage === "en" || outputLanguage === "ja") {
    return [outputLanguage];
  }

  return ["ja"];
}

function draftMeetsMinimumLength(payload, outputLanguage) {
  const safeVersion = payload?.safeVersion;
  if (!safeVersion) {
    return false;
  }

  return requiredLengthLanguages(outputLanguage).every((language) =>
    buildArticleCharacterCount(safeVersion, language) >= MIN_PRIMARY_ARTICLE_CHAR_COUNT
  );
}

function buildEmojiUsageInstruction(mode) {
  if (mode === "light") {
    return "Use emojis in only one paragraph of the body. Keep the total amount minimal, premium, and natural. Do not place emojis across multiple paragraphs.";
  }

  if (mode === "warm") {
    return "Use one gentle emoji in most body sentences where it still reads naturally. Keep the tone premium and readable. Avoid childish styling, emoji clusters, or decorative overuse.";
  }

  return "Do not use emojis in the article body, title, lead, CTA, or meta description.";
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
  const trendTitle = localizedString(trend?.title, outputLanguage, trend?.titleJa || "");
  const trendSummary = localizedString(trend?.summary, outputLanguage, trend?.summaryJa || "");
  const petersPoint = localizedString(trend?.petersPoint, outputLanguage, trend?.petersPointJa || "");
  return [
    `Today is ${currentDateLabel()}.`,
    "You are helping a beginner use Peter's Lab Blog Writer.",
    "Based on the selected trend, suggest three title ideas for a Japan-facing blog.",
    "Make the titles emotionally relatable to pet owners without becoming sensational.",
    `Preferred output language: ${outputLanguage || "ja"}.`,
    `Trend title: ${trendTitle}`,
    `Trend summary: ${trendSummary}`,
    `PetersLab connection: ${petersPoint}`,
    `Selected keyword: ${selectedKeyword || "none"}`,
    "Return one JSON object only.",
    "{",
    '  "selectedTrendSummaryText": "string",',
    '  "titleSuggestions": [',
    "    {",
    '      "title": "string",',
    '      "angle": "string"',
    "    }",
    "  ]",
    "}",
  ].join("\n");
}

function buildDraftPrompt(body) {
  const selection = body.selection || {};
  const minimumLanguages = requiredLengthLanguages(selection.outputLanguage || "ja");
  const minimumLabel = minimumLanguages.includes("ko") ? "Korean" : "Japanese";
  const outputLanguage = selection.outputLanguage || "ja";
  return [
    `Today is ${currentDateLabel()}.`,
    "Write a PetersLab blog draft for Japan-facing marketing use.",
    "The copy should feel premium, calm, warm, trustworthy, and easy for general pet owners to read.",
    "Avoid diagnosis, treatment, cure, prevention, guaranteed results, and fear-based claims.",
    `The ${minimumLabel} safeVersion article text must be at least ${MIN_PRIMARY_ARTICLE_CHAR_COUNT} characters total when counting title + lead + body + CTA + meta description.`,
    "Count visible Unicode characters, not bytes.",
    "If needed, make the body longer with practical, natural paragraphs rather than padding with filler.",
    `${minimumLabel} must satisfy the minimum length. Other languages can stay shorter if needed, but should still be complete and readable.`,
    `Primary display language: ${outputLanguage}`,
    `Emoji mode: ${selection.emojiMode || "none"}`,
    buildEmojiUsageInstruction(selection.emojiMode || "none"),
    `Trend title: ${localizedString(selection.trendTitle, outputLanguage, selection.trendTitleJa || "")}`,
    `Keyword: ${selection.keyword || ""}`,
    `Direction: ${selection.direction || "empathy"}`,
    `Selected title: ${localizedString(selection.selectedTitle, outputLanguage, selection.titleJa || "")}`,
    `Trend summary: ${localizedString(selection.trendSummary, outputLanguage, selection.trendSummaryJa || "")}`,
    "Return one JSON object only.",
    "{",
    '  "aiOriginal": {',
    '    "title": "string",',
    '    "lead": "string",',
    '    "body": "string",',
    '    "cta": "string",',
    '    "meta": "string",',
    '    "keywords": "string"',
    "  },",
    '  "safeVersion": {',
    '    "title": "string",',
    '    "lead": "string",',
    '    "body": "string",',
    '    "cta": "string",',
    '    "meta": "string",',
    '    "keywords": "string"',
    "  },",
    '  "rationale": {',
    '    "whyThisDirection": "string",',
    '    "empathyPoint": "string",',
    '    "brandConnection": "string"',
    "  },",
    '  "reviewSummary": "string",',
    '  "compliance": {',
    '    "level": "Low|Medium|High",',
    '    "items": [',
    "      {",
    '        "before": "string",',
    '        "after": "string",',
    '        "reason": "string",',
    '        "meaning": "string"',
    "      }",
    "    ]",
    "  }",
    "}",
  ].join("\n");
}

function buildDraftExpansionPrompt(body, draftPayload) {
  const selection = body.selection || {};
  const minimumLanguages = requiredLengthLanguages(selection.outputLanguage || "ja");
  const minimumLabel = minimumLanguages.includes("ko") ? "Korean" : "Japanese";
  const outputLanguage = selection.outputLanguage || "ja";
  return [
    `Today is ${currentDateLabel()}.`,
    "Rewrite and expand the draft below.",
    `${minimumLabel} safeVersion text must be at least ${MIN_PRIMARY_ARTICLE_CHAR_COUNT} characters total when counting title + lead + body + CTA + meta description.`,
    "Count visible Unicode characters, not bytes.",
    "Keep the same structure, tone, and compliance-safe style, but deepen the practical guidance and examples so the draft reads naturally.",
    "Do not shorten any section. Expand primarily through the lead and body sections.",
    `Primary display language: ${outputLanguage}`,
    `Emoji mode: ${selection.emojiMode || "none"}`,
    buildEmojiUsageInstruction(selection.emojiMode || "none"),
    "Return one JSON object only with the same schema as before.",
    "",
    "Current draft JSON:",
    JSON.stringify(draftPayload),
    "",
    "JSON schema:",
    "{",
    '  "aiOriginal": {',
    '    "title": "string",',
    '    "lead": "string",',
    '    "body": "string",',
    '    "cta": "string",',
    '    "meta": "string",',
    '    "keywords": "string"',
    "  },",
    '  "safeVersion": {',
    '    "title": "string",',
    '    "lead": "string",',
    '    "body": "string",',
    '    "cta": "string",',
    '    "meta": "string",',
    '    "keywords": "string"',
    "  },",
    '  "rationale": {',
    '    "whyThisDirection": "string",',
    '    "empathyPoint": "string",',
    '    "brandConnection": "string"',
    "  },",
    '  "reviewSummary": "string",',
    '  "compliance": {',
    '    "level": "Low|Medium|High",',
    '    "items": [',
    "      {",
    '        "before": "string",',
    '        "after": "string",',
    '        "reason": "string",',
    '        "meaning": "string"',
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
    ...paragraphBlocks(`Emoji mode: ${selection.emojiMode || "-"}`),
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

  return coerceIdeaPayload(parseJsonObject(extractOutputText(ideaResponse)), body.outputLanguage || "ja");
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
      "You are PetersLab's drafting and compliance-support assistant. Create one complete blog draft in the selected language only, and soften risky wording without losing warmth or readability.",
    input: buildDraftPrompt(body),
  });

  let payload = coerceDraftPayload(parseJsonObject(extractOutputText(draftResponse)), body.selection?.outputLanguage || "ja");

  for (
    let attempt = 0;
    attempt < MAX_DRAFT_EXPANSION_ATTEMPTS && !draftMeetsMinimumLength(payload, body.selection?.outputLanguage || "ja");
    attempt += 1
  ) {
    const expandedResponse = await callOpenAI({
      model: OPENAI_MODEL,
      text: {
        format: {
          type: "json_object",
        },
      },
      instructions:
        "You are PetersLab's drafting and compliance-support assistant. Expand the single-language draft so it satisfies the minimum character requirement while staying natural and compliant.",
      input: buildDraftExpansionPrompt(body, payload),
    });

    payload = coerceDraftPayload(parseJsonObject(extractOutputText(expandedResponse)), body.selection?.outputLanguage || "ja");
  }

  if (!draftMeetsMinimumLength(payload, body.selection?.outputLanguage || "ja")) {
    throw new Error("DRAFT_MIN_LENGTH_NOT_MET");
  }

  return payload;
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

function getHealthStatus() {
  return {
    openaiReady: Boolean(process.env.OPENAI_API_KEY),
    notionReady: Boolean(process.env.NOTION_API_KEY && process.env.NOTION_PARENT_PAGE_ID),
  };
}

module.exports = {
  loadDotEnv,
  createTrendResponse,
  createIdeaResponse,
  createDraftResponse,
  createNotionUpload,
  getHealthStatus,
};

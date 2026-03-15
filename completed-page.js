(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  const titleMetric = document.getElementById("completed-title");
  const timeMetric = document.getElementById("completed-time");
  const uploadStatus = document.getElementById("completed-upload-status");
  const languageMetric = document.getElementById("completed-language");
  const summary = document.getElementById("completed-summary");
  const chip = document.getElementById("upload-status-chip");
  const summaryTrend = document.getElementById("summary-trend");
  const summaryKeyword = document.getElementById("summary-keyword");
  const summaryLanguage = document.getElementById("summary-language");
  const summaryStatus = document.getElementById("summary-status");
  const titleInput = document.getElementById("doc-title-input");
  const leadInput = document.getElementById("doc-lead-input");
  const bodyInput = document.getElementById("doc-body-input");
  const ctaInput = document.getElementById("doc-cta-input");
  const metaInput = document.getElementById("doc-meta-input");
  const keywordsInput = document.getElementById("doc-keywords-input");
  const rationalePanel = document.getElementById("rationale-panel");
  const compliancePanel = document.getElementById("compliance-panel");
  const evidencePanel = document.getElementById("trend-evidence-panel");
  const uploadButton = document.getElementById("upload-notion-button");
  const copyButton = document.getElementById("copy-final-button");
  const regenerateButton = document.getElementById("regenerate-final-button");
  const newButton = document.getElementById("new-article-button");
  const notionLink = document.getElementById("notion-link");

  function uploadLabel() {
    if (state.notion.status === "done") return PLBW.t(state, "uploadDone");
    if (state.notion.status === "failed") return PLBW.t(state, "uploadFailed");
    if (!state.health.notionReady) return PLBW.t(state, "uploadUnavailable");
    return PLBW.t(state, "uploadReady");
  }

  function trendTitle() {
    const trend = state.trendPayload?.trends?.[state.selectedTrendIndex];
    if (!trend) return "-";
    return trend[state.language === "ko" ? "titleKo" : state.language === "en" ? "titleEn" : "titleJa"] || trend.titleJa || "-";
  }

  function safeVersion(field) {
    return PLBW.getText(state.draftPayload?.safeVersion?.[field], state.language);
  }

  function articleText() {
    return [
      safeVersion("title"),
      "",
      safeVersion("lead"),
      "",
      safeVersion("body"),
      "",
      `CTA: ${safeVersion("cta")}`,
      `Meta: ${safeVersion("meta")}`,
      `Image Keywords: ${safeVersion("keywords")}`,
    ].join("\n");
  }

  function renderSummaryMetrics() {
    titleMetric.textContent = safeVersion("title") || "-";
    timeMetric.textContent = state.completedAt || "-";
    uploadStatus.textContent = uploadLabel();
    languageMetric.textContent = PLBW.languageLabel(state.language, state.language);
    summary.textContent = PLBW.getText(state.draftPayload?.reviewSummary, state.language) || "-";
    chip.textContent = uploadLabel();
    chip.className = `surface-chip ${state.notion.status === "done" ? "ready" : state.notion.status === "failed" ? "error" : "neutral"}`;
  }

  function renderDocumentSummary() {
    summaryTrend.textContent = trendTitle();
    summaryKeyword.textContent = state.selectedKeyword || "-";
    summaryLanguage.textContent = PLBW.languageLabel(state.language, state.language);
    summaryStatus.textContent = PLBW.draftStatusLabel(state);
  }

  function renderDocument() {
    titleInput.value = safeVersion("title");
    leadInput.value = safeVersion("lead");
    bodyInput.value = safeVersion("body");
    ctaInput.value = safeVersion("cta");
    metaInput.value = safeVersion("meta");
    keywordsInput.value = safeVersion("keywords");
  }

  function renderRationale() {
    const rationale = state.draftPayload?.rationale || {};
    const items = [
      { title: PLBW.t(state, "whyThisDraft"), body: PLBW.getText(rationale.whyThisDirection, state.language) },
      { title: PLBW.t(state, "empathyPoint"), body: PLBW.getText(rationale.empathyPoint, state.language) },
      { title: PLBW.t(state, "brandConnection"), body: PLBW.getText(rationale.brandConnection, state.language) },
    ].filter((item) => item.body);

    rationalePanel.innerHTML = items.length
      ? items.map((item) => `<article class="info-item"><strong>${item.title}</strong><p>${item.body}</p></article>`).join("")
      : `<p class="empty-copy">${PLBW.t(state, "noRationale")}</p>`;
  }

  function renderCompliance() {
    const items = state.draftPayload?.compliance?.items || [];
    compliancePanel.innerHTML = items.length
      ? items.map((item) => `
          <article class="info-item">
            <strong>${item.before} -> ${item.after}</strong>
            <p><span>${PLBW.t(state, "riskReason")}</span> ${PLBW.getText({ ko: item.reasonKo, en: item.reasonEn, ja: item.reasonJa }, state.language)}</p>
            <p><span>${PLBW.t(state, "riskMeaning")}</span> ${PLBW.getText({ ko: item.meaningKo, en: item.meaningEn, ja: item.meaningJa }, state.language)}</p>
          </article>
        `).join("")
      : `<p class="empty-copy">${PLBW.t(state, "noCompliance")}</p>`;
  }

  function renderSources() {
    const sources = state.trendPayload?.sources || [];
    evidencePanel.innerHTML = sources.length
      ? sources.map((source) => `<a class="source-link" href="${source.url}" target="_blank" rel="noreferrer noopener">${source.title || source.url}</a>`).join("")
      : `<p class="empty-copy">${PLBW.t(state, "noSources")}</p>`;
  }

  function render() {
    PLBW.renderFrame(state, "completed");

    if (!state.draftPayload?.safeVersion) {
      titleMetric.textContent = "-";
      timeMetric.textContent = "-";
      uploadStatus.textContent = PLBW.t(state, "uploadUnavailable");
      languageMetric.textContent = PLBW.languageLabel(state.language, state.language);
      summary.textContent = PLBW.t(state, "fetchErrorBody");
      chip.textContent = PLBW.t(state, "uploadUnavailable");
      chip.className = "surface-chip neutral";
      uploadButton.disabled = true;
      notionLink.classList.add("is-hidden");
      rationalePanel.innerHTML = `<p class="empty-copy">${PLBW.t(state, "fetchErrorBody")}</p>`;
      compliancePanel.innerHTML = "";
      evidencePanel.innerHTML = "";
      return;
    }

    renderSummaryMetrics();
    renderDocumentSummary();
    renderDocument();
    renderRationale();
    renderCompliance();
    renderSources();

    uploadButton.disabled = state.notion.status === "done";
    notionLink.classList.toggle("is-hidden", !state.notion.url);
    if (state.notion.url) {
      notionLink.href = state.notion.url;
    }
  }

  function updateField(field, value) {
    state.draftPayload.safeVersion[field][state.language] = value;
    state.draftStatus = "edited";
    PLBW.saveState(state);
    renderSummaryMetrics();
    renderDocumentSummary();
  }

  titleInput.addEventListener("input", (event) => updateField("title", event.target.value));
  leadInput.addEventListener("input", (event) => updateField("lead", event.target.value));
  bodyInput.addEventListener("input", (event) => updateField("body", event.target.value));
  ctaInput.addEventListener("input", (event) => updateField("cta", event.target.value));
  metaInput.addEventListener("input", (event) => updateField("meta", event.target.value));
  keywordsInput.addEventListener("input", (event) => updateField("keywords", event.target.value));

  uploadButton.addEventListener("click", async () => {
    if (!state.health.notionReady) {
      state.notion.status = "failed";
      PLBW.setBanner(state, "notReadyForNotion", "error");
      PLBW.saveState(state);
      render();
      return;
    }

    const trend = state.trendPayload?.trends?.[state.selectedTrendIndex];

    try {
      const payload = await PLBW.postJSON("/api/notion-upload", {
        outputLanguage: state.language,
        selection: {
          trendTitle: trend?.[state.language === "ko" ? "titleKo" : state.language === "en" ? "titleEn" : "titleJa"] || "",
          keyword: state.selectedKeyword,
          direction: state.direction,
          emojiMode: state.emojiMode,
        },
        draft: {
          title: safeVersion("title"),
          lead: safeVersion("lead"),
          body: safeVersion("body"),
          cta: safeVersion("cta"),
          meta: safeVersion("meta"),
          keywords: safeVersion("keywords"),
        },
        compliance: state.draftPayload.compliance,
      });

      state.notion.status = "done";
      state.notion.url = payload.url || "";
      PLBW.setBanner(state, "uploadSuccess", "success");
      PLBW.saveState(state);
      render();
    } catch {
      state.notion.status = "failed";
      PLBW.setBanner(state, "uploadFailedBody", "error");
      PLBW.saveState(state);
      render();
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(articleText());
      PLBW.setBanner(state, "copySuccess", "success");
      render();
    } catch {
      const area = document.createElement("textarea");
      area.value = articleText();
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      PLBW.setBanner(state, copied ? "copySuccess" : "copyFailed", copied ? "success" : "error");
      render();
    }
  });

  regenerateButton.addEventListener("click", () => {
    state.draftPayload = null;
    state.completedAt = "";
    state.notion = { status: "idle", url: "" };
    PLBW.saveState(state);
    PLBW.goPhase("idea");
  });

  newButton.addEventListener("click", () => {
    PLBW.resetState(state.language);
    PLBW.goPhase("trend");
  });

  window.addEventListener("plbw-language-change", render);
  render();
})();

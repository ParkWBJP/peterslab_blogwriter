(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  if (!state.draftPayload?.safeVersion) {
    PLBW.goPhase("review");
    return;
  }

  const title = document.getElementById("completed-title");
  const time = document.getElementById("completed-time");
  const uploadStatus = document.getElementById("completed-upload-status");
  const language = document.getElementById("completed-language");
  const summary = document.getElementById("completed-summary");
  const chip = document.getElementById("upload-status-chip");
  const uploadButton = document.getElementById("upload-notion-button");
  const copyButton = document.getElementById("copy-final-button");
  const backButton = document.getElementById("back-to-review-button");
  const newButton = document.getElementById("new-article-button");
  const notionLink = document.getElementById("notion-link");

  function uploadLabel() {
    if (state.notion.status === "done") return PLBW.t(state, "uploadDone");
    if (state.notion.status === "failed") return PLBW.t(state, "uploadFailed");
    if (!state.health.notionReady) return PLBW.t(state, "uploadUnavailable");
    return PLBW.t(state, "uploadReady");
  }

  function articleText() {
    return [
      PLBW.getText(state.draftPayload.safeVersion.title, state.language),
      "",
      PLBW.getText(state.draftPayload.safeVersion.lead, state.language),
      "",
      PLBW.getText(state.draftPayload.safeVersion.body, state.language),
      "",
      `CTA: ${PLBW.getText(state.draftPayload.safeVersion.cta, state.language)}`,
      `Meta: ${PLBW.getText(state.draftPayload.safeVersion.meta, state.language)}`,
      `Image Keywords: ${PLBW.getText(state.draftPayload.safeVersion.keywords, state.language)}`,
    ].join("\n");
  }

  function render() {
    PLBW.renderFrame(state, "completed");
    title.textContent = PLBW.getText(state.draftPayload.safeVersion.title, state.language) || "-";
    time.textContent = state.completedAt || "-";
    uploadStatus.textContent = uploadLabel();
    language.textContent = PLBW.languageLabel(state.language, state.language);
    summary.textContent = PLBW.getText(state.draftPayload.reviewSummary, state.language) || "-";
    chip.textContent = uploadLabel();
    chip.className = `surface-chip ${state.notion.status === "done" ? "ready" : state.notion.status === "failed" ? "error" : "neutral"}`;
    uploadButton.disabled = state.notion.status === "done";
    notionLink.classList.toggle("is-hidden", !state.notion.url);
    if (state.notion.url) {
      notionLink.href = state.notion.url;
    }
  }

  uploadButton.addEventListener("click", async () => {
    if (!state.health.notionReady) {
      state.notion.status = "failed";
      PLBW.setBanner(state, "notReadyForNotion", "error");
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
        },
        draft: {
          title: PLBW.getText(state.draftPayload.safeVersion.title, state.language),
          lead: PLBW.getText(state.draftPayload.safeVersion.lead, state.language),
          body: PLBW.getText(state.draftPayload.safeVersion.body, state.language),
          cta: PLBW.getText(state.draftPayload.safeVersion.cta, state.language),
          meta: PLBW.getText(state.draftPayload.safeVersion.meta, state.language),
          keywords: PLBW.getText(state.draftPayload.safeVersion.keywords, state.language),
        },
        compliance: state.draftPayload.compliance,
      });

      state.notion.status = "done";
      state.notion.url = payload.url || "";
      PLBW.setBanner(state, "uploadSuccess", "success");
      PLBW.saveState(state);
      render();
    } catch (error) {
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

  backButton.addEventListener("click", () => PLBW.goPhase("review"));
  newButton.addEventListener("click", () => {
    PLBW.resetState(state.language);
    PLBW.goPhase("trend");
  });

  window.addEventListener("plbw-language-change", render);
  render();
})();

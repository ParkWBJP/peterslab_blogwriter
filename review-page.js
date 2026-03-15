(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  const backButton = document.getElementById("back-button");
  const saveButton = document.getElementById("save-button");
  const regenerateButton = document.getElementById("regenerate-button");
  const completeButton = document.getElementById("complete-button");
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

  if (!state.draftPayload?.safeVersion) {
    PLBW.renderFrame(state, "review");
    rationalePanel.innerHTML = `<p class="empty-copy">${PLBW.t(state, "fetchErrorBody")}</p>`;
    compliancePanel.innerHTML = "";
    evidencePanel.innerHTML = "";
    backButton.addEventListener("click", () => PLBW.goPhase("idea"));
    return;
  }

  function trendTitle() {
    const trend = state.trendPayload?.trends?.[state.selectedTrendIndex];
    if (!trend) return "-";
    return trend[state.language === "ko" ? "titleKo" : state.language === "en" ? "titleEn" : "titleJa"] || trend.titleJa || "-";
  }

  function safeVersion(field) {
    return PLBW.getText(state.draftPayload.safeVersion?.[field], state.language);
  }

  function renderSummary() {
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
    const rationale = state.draftPayload.rationale || {};
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
    const items = state.draftPayload.compliance?.items || [];
    compliancePanel.innerHTML = items.length
      ? items.map((item) => `
          <article class="info-item">
            <strong>${item.before} → ${item.after}</strong>
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
    PLBW.renderFrame(state, "review");
    renderSummary();
    renderDocument();
    renderRationale();
    renderCompliance();
    renderSources();
  }

  function updateField(field, value) {
    state.draftPayload.safeVersion[field][state.language] = value;
    state.draftStatus = "edited";
    PLBW.saveState(state);
    summaryStatus.textContent = PLBW.draftStatusLabel(state);
  }

  titleInput.addEventListener("input", (event) => updateField("title", event.target.value));
  leadInput.addEventListener("input", (event) => updateField("lead", event.target.value));
  bodyInput.addEventListener("input", (event) => updateField("body", event.target.value));
  ctaInput.addEventListener("input", (event) => updateField("cta", event.target.value));
  metaInput.addEventListener("input", (event) => updateField("meta", event.target.value));
  keywordsInput.addEventListener("input", (event) => updateField("keywords", event.target.value));

  backButton.addEventListener("click", () => PLBW.goPhase("idea"));
  saveButton.addEventListener("click", () => {
    state.draftStatus = "saved";
    PLBW.setBanner(state, "draftStatusSaved", "success");
    render();
  });
  regenerateButton.addEventListener("click", () => PLBW.goPhase("writingLoading"));
  completeButton.addEventListener("click", () => {
    state.draftStatus = "completed";
    state.completedAt = new Date().toLocaleString();
    PLBW.saveState(state);
    PLBW.setBanner(state, "topHintCompleted", "success");
    PLBW.goPhase("completed");
  });

  window.addEventListener("plbw-language-change", render);
  render();
})();

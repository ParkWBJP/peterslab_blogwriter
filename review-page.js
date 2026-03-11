(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);
  if (!state.draftPayload?.safeVersion) {
    PLBW.go("./idea.html");
    return;
  }

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

  function render() {
    PLBW.renderFrame(state, "review");
    backButton.textContent = { ko: "이전", en: "Back", ja: "戻る" }[state.language];
    saveButton.textContent = { ko: "임시 저장", en: "Save Draft", ja: "下書き保存" }[state.language];
    regenerateButton.textContent = { ko: "다시 생성", en: "Regenerate", ja: "再生成" }[state.language];
    completeButton.textContent = { ko: "완료 단계로 이동", en: "Move to Completed", ja: "完了段階へ移動" }[state.language];

    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    summaryTrend.textContent = trend?.[`${{ ko: "titleKo", en: "titleEn", ja: "titleJa" }[state.language]}`] || "-";
    summaryKeyword.textContent = state.selectedKeyword || "-";
    summaryLanguage.textContent = PLBW.languageLabel(state.language, state.language);
    summaryStatus.textContent = PLBW.draftStatusLabel(state);

    titleInput.value = PLBW.getText(state.draftPayload.safeVersion.title, state.language);
    leadInput.value = PLBW.getText(state.draftPayload.safeVersion.lead, state.language);
    bodyInput.value = PLBW.getText(state.draftPayload.safeVersion.body, state.language);
    ctaInput.value = PLBW.getText(state.draftPayload.safeVersion.cta, state.language);
    metaInput.value = PLBW.getText(state.draftPayload.safeVersion.meta, state.language);
    keywordsInput.value = PLBW.getText(state.draftPayload.safeVersion.keywords, state.language);

    rationalePanel.innerHTML = `
      <div class="info-item"><strong>${PLBW.t(state, "whyThisDraft")}</strong><p>${PLBW.getText(state.draftPayload.rationale?.whyThisDirection, state.language)}</p></div>
      <div class="info-item"><strong>Empathy</strong><p>${PLBW.getText(state.draftPayload.rationale?.empathyPoint, state.language)}</p></div>
      <div class="info-item"><strong>Brand</strong><p>${PLBW.getText(state.draftPayload.rationale?.brandConnection, state.language)}</p></div>
    `;

    compliancePanel.innerHTML = (state.draftPayload.compliance?.items || []).map((item) => `
      <div class="info-item">
        <strong>${item.before} → ${item.after}</strong>
        <p>${PLBW.getText({ ko: item.reasonKo, en: item.reasonEn, ja: item.reasonJa }, state.language)}</p>
        <p>${PLBW.getText({ ko: item.meaningKo, en: item.meaningEn, ja: item.meaningJa }, state.language)}</p>
      </div>
    `).join("");

    evidencePanel.innerHTML = (state.trendPayload.sources || []).map((source) => `
      <a class="source-link" href="${source.url}" target="_blank" rel="noreferrer noopener">${source.title || source.url}</a>
    `).join("");
  }

  function updateField(field, value) {
    state.draftPayload.safeVersion[field][state.language] = value;
    state.draftStatus = "edited";
    PLBW.saveState(state);
    render();
  }

  titleInput.addEventListener("input", (event) => updateField("title", event.target.value));
  leadInput.addEventListener("input", (event) => updateField("lead", event.target.value));
  bodyInput.addEventListener("input", (event) => updateField("body", event.target.value));
  ctaInput.addEventListener("input", (event) => updateField("cta", event.target.value));
  metaInput.addEventListener("input", (event) => updateField("meta", event.target.value));
  keywordsInput.addEventListener("input", (event) => updateField("keywords", event.target.value));

  backButton.addEventListener("click", () => PLBW.go("./idea.html"));
  saveButton.addEventListener("click", () => {
    state.draftStatus = "saved";
    PLBW.saveState(state);
    render();
  });
  regenerateButton.addEventListener("click", () => PLBW.go("./writing.html"));
  completeButton.addEventListener("click", () => {
    state.draftStatus = "completed";
    state.completedAt = new Date().toLocaleString();
    PLBW.saveState(state);
    PLBW.go("./completed.html");
  });

  window.addEventListener("plbw-language-change", render);
  render();
})();

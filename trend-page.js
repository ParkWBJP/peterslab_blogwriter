(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);
  state.banner = { key: "heroGuide", tone: "neutral" };
  PLBW.saveState(state);
  PLBW.renderFrame(state, "trend");

  const petType = document.getElementById("filter-pet-type");
  const themeType = document.getElementById("filter-theme-type");
  const scope = document.getElementById("filter-scope");
  const button = document.getElementById("scan-button");
  const fieldLabels = document.querySelectorAll(".field-label");

  function renderPage() {
    PLBW.renderFrame(state, "trend");
    fieldLabels[0].textContent = { ko: "반려동물 유형", en: "Pet Type", ja: "ペットタイプ" }[state.language];
    fieldLabels[1].textContent = { ko: "주제", en: "Theme", ja: "テーマ" }[state.language];
    fieldLabels[2].textContent = { ko: "검색 범위", en: "Search Scope", ja: "検索範囲" }[state.language];
    button.textContent = { ko: "트렌드 스캔 시작", en: "Start Trend Scan", ja: "トレンドスキャン開始" }[state.language];
    petType.value = state.filters.petType;
    themeType.value = state.filters.themeType;
    scope.value = state.filters.scope;
  }

  petType.addEventListener("change", (event) => {
    state.filters.petType = event.target.value;
    PLBW.saveState(state);
  });
  themeType.addEventListener("change", (event) => {
    state.filters.themeType = event.target.value;
    PLBW.saveState(state);
  });
  scope.addEventListener("change", (event) => {
    state.filters.scope = event.target.value;
    PLBW.saveState(state);
  });

  button.addEventListener("click", () => {
    state.trendPayload = null;
    state.ideaPayload = null;
    state.draftPayload = null;
    state.selectedTrendIndex = -1;
    state.selectedKeyword = "";
    state.selectedTitleMap = { ko: "", en: "", ja: "" };
    state.direction = "empathy";
    PLBW.saveState(state);
    PLBW.go("./trend-loading.html");
  });

  window.addEventListener("plbw-language-change", renderPage);
  renderPage();
})();

(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  const petType = document.getElementById("filter-pet-type");
  const themeType = document.getElementById("filter-theme-type");
  const scope = document.getElementById("filter-scope");
  const scanButton = document.getElementById("scan-button");

  function syncControls() {
    petType.value = state.filters.petType;
    themeType.value = state.filters.themeType;
    scope.value = state.filters.scope;
  }

  function render() {
    if (!state.health.openaiReady) {
      PLBW.setBanner(state, "openAiMissing", "error");
    } else {
      PLBW.setBanner(state, "heroGuide", "neutral");
    }
    PLBW.renderFrame(state, "trend");
    syncControls();
  }

  function updateFilters() {
    state.filters.petType = petType.value;
    state.filters.themeType = themeType.value;
    state.filters.scope = scope.value;
    PLBW.saveState(state);
  }

  petType.addEventListener("change", updateFilters);
  themeType.addEventListener("change", updateFilters);
  scope.addEventListener("change", updateFilters);

  scanButton.addEventListener("click", () => {
    updateFilters();
    state.trendPayload = null;
    state.selectedTrendIndex = -1;
    state.ideaPayload = null;
    state.selectedKeyword = "";
    state.selectedTitleMap = { ko: "", en: "", ja: "" };
    state.draftPayload = null;
    state.draftStatus = "draft";
    state.notion = { status: "idle", url: "" };
    state.completedAt = "";
    PLBW.setBanner(state, "trendLoadingLead", "neutral");
    PLBW.goPhase("trendLoading");
  });

  window.addEventListener("plbw-language-change", render);
  render();
})();

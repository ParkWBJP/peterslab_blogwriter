(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  const loadingHeadline = document.getElementById("loading-headline");
  const loadingBody = document.getElementById("loading-body");
  const loadingList = document.getElementById("loading-list");
  const errorCard = document.getElementById("loading-error");
  const retryButton = document.getElementById("retry-button");
  const backButton = document.getElementById("back-button");

  let loadingTimer = null;
  let requestStarted = false;

  function loadingMessages() {
    return [
      PLBW.t(state, "writingLoadingMsg1"),
      PLBW.t(state, "writingLoadingMsg2"),
      PLBW.t(state, "writingLoadingMsg3"),
      PLBW.t(state, "writingLoadingMsg4"),
      PLBW.t(state, "writingLoadingMsg5"),
    ];
  }

  function renderMessages(activeIndex = 0) {
    loadingHeadline.textContent = PLBW.t(state, "writingLoadingTitle");
    loadingBody.textContent = PLBW.t(state, "writingLoadingBody");
    loadingList.innerHTML = loadingMessages()
      .map((message, index) => `<li class="${index === activeIndex ? "is-active" : ""}">${message}</li>`)
      .join("");
  }

  function startMessageRotation() {
    let current = 0;
    renderMessages(current);
    clearInterval(loadingTimer);
    loadingTimer = window.setInterval(() => {
      current = (current + 1) % loadingMessages().length;
      renderMessages(current);
    }, 1250);
  }

  function stopMessageRotation() {
    clearInterval(loadingTimer);
  }

  function renderBlockedState(message) {
    PLBW.renderFrame(state, "writingLoading");
    stopMessageRotation();
    PLBW.setErrorMessage(errorCard, PLBW.t(state, "fetchErrorTitle"), message);
  }

  if (!state.trendPayload?.trends?.length || state.selectedTrendIndex < 0 || !PLBW.getText(state.selectedTitleMap, state.language)) {
    renderBlockedState(PLBW.t(state, "writingNeedSelections"));
    retryButton.addEventListener("click", () => PLBW.goPhase("idea"));
    backButton.addEventListener("click", () => PLBW.goPhase("idea"));
    return;
  }

  function render() {
    PLBW.renderFrame(state, "writingLoading");
    errorCard.classList.add("is-hidden");
    startMessageRotation();
  }

  function localizeDraftError(error) {
    if (!error?.message) {
      return PLBW.t(state, "fetchErrorBody");
    }

    if (error.message === "REQUEST_TIMEOUT") {
      return PLBW.t(state, "fetchErrorBody");
    }

    if (error.message === "DRAFT_MIN_LENGTH_NOT_MET") {
      return PLBW.t(state, "draftLengthFailure");
    }

    return error.message;
  }

  async function createDraft() {
    if (requestStarted) return;
    requestStarted = true;
    render();

    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    const selectedTitle = state.selectedTitleMap;

    try {
      const payload = await PLBW.postJSON("/api/draft", {
        selection: {
          trendTitle: PLBW.getText({
            ko: trend.titleKo || "",
            en: trend.titleEn || "",
            ja: trend.titleJa || "",
          }, state.language),
          trendSummary: PLBW.getText({
            ko: trend.summaryKo || "",
            en: trend.summaryEn || "",
            ja: trend.summaryJa || "",
          }, state.language),
          keyword: state.selectedKeyword || PLBW.getText({
            ko: trend.titleKo || "",
            en: trend.titleEn || "",
            ja: trend.titleJa || "",
          }, state.language),
          direction: state.direction,
          emojiMode: state.emojiMode || "none",
          selectedTitle: PLBW.getText(selectedTitle, state.language),
          outputLanguage: state.language,
        },
      });

      state.draftPayload = payload;
      state.draftStatus = "completed";
      state.completedAt = new Date().toLocaleString();
      state.notion = { status: "idle", url: "" };
      PLBW.setBanner(state, "articleReady", "success");
      PLBW.goPhase("completed");
    } catch (error) {
      stopMessageRotation();
      requestStarted = false;
      PLBW.setBanner(state, "fetchErrorBody", "error");
      PLBW.renderFrame(state, "writingLoading");
      PLBW.setErrorMessage(errorCard, PLBW.t(state, "fetchErrorTitle"), localizeDraftError(error));
    }
  }

  retryButton.addEventListener("click", createDraft);
  backButton.addEventListener("click", () => PLBW.goPhase("idea"));
  window.addEventListener("plbw-language-change", render);

  render();
  createDraft();
})();

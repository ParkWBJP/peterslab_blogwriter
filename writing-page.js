(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  if (!state.trendPayload?.trends?.length || state.selectedTrendIndex < 0 || !state.selectedKeyword || !PLBW.getText(state.selectedTitleMap, state.language)) {
    PLBW.goPhase("idea");
    return;
  }

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

  function render() {
    PLBW.renderFrame(state, "writingLoading");
    errorCard.classList.add("is-hidden");
    startMessageRotation();
  }

  function localizeDraftError(error) {
    if (!error?.message) {
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
          trendTitleJa: trend.titleJa || "",
          trendTitleKo: trend.titleKo || "",
          trendTitleEn: trend.titleEn || "",
          trendSummaryJa: trend.summaryJa || "",
          trendSummaryEn: trend.summaryEn || "",
          keyword: state.selectedKeyword || trend.titleJa || trend.titleKo || trend.titleEn || "",
          direction: state.direction,
          emojiMode: state.emojiMode || "none",
          titleJa: selectedTitle.ja || "",
          titleKo: selectedTitle.ko || "",
          titleEn: selectedTitle.en || "",
          outputLanguage: state.language,
        },
      });

      state.draftPayload = payload;
      state.draftStatus = "review";
      PLBW.setBanner(state, "articleReady", "success");
      PLBW.goPhase("review");
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

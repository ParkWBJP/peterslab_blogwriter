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
      PLBW.t(state, "trendLoadingMsg1"),
      PLBW.t(state, "trendLoadingMsg2"),
      PLBW.t(state, "trendLoadingMsg3"),
      PLBW.t(state, "trendLoadingMsg4"),
    ];
  }

  function renderMessages(activeIndex = 0) {
    loadingHeadline.textContent = PLBW.t(state, "trendLoadingTitle");
    loadingBody.textContent = PLBW.t(state, "trendLoadingBody");
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
    }, 1400);
  }

  function stopMessageRotation() {
    clearInterval(loadingTimer);
  }

  function render() {
    PLBW.renderFrame(state, "trendLoading");
    errorCard.classList.add("is-hidden");
    startMessageRotation();
  }

  async function runTrendScan() {
    if (requestStarted) return;
    requestStarted = true;
    render();

    try {
      const payload = await PLBW.postJSON("/api/trends", { filters: state.filters });
      state.trendPayload = payload;
      state.selectedTrendIndex = -1;
      state.ideaPayload = null;
      state.selectedKeyword = "";
      state.selectedTitleMap = { ko: "", en: "", ja: "" };
      PLBW.setBanner(state, "ideaReady", "success");
      PLBW.goPhase("idea");
    } catch (error) {
      stopMessageRotation();
      requestStarted = false;
      PLBW.setBanner(state, "fetchErrorBody", "error");
      PLBW.renderFrame(state, "trendLoading");
      PLBW.setErrorMessage(errorCard, PLBW.t(state, "fetchErrorTitle"), error.message || PLBW.t(state, "fetchErrorBody"));
    }
  }

  retryButton.addEventListener("click", runTrendScan);
  backButton.addEventListener("click", () => PLBW.goPhase("trend"));
  window.addEventListener("plbw-language-change", render);

  render();
  runTrendScan();
})();

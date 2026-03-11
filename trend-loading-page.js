(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);
  state.banner = { key: "heroGuide", tone: "neutral" };
  PLBW.saveState(state);

  const headline = document.getElementById("loading-headline");
  const body = document.getElementById("loading-body");
  const list = document.getElementById("loading-list");
  const errorCard = document.getElementById("loading-error");
  const errorText = document.getElementById("loading-error-text");
  const retryButton = document.getElementById("retry-button");
  const backButton = document.getElementById("back-button");
  const messages = {
    ko: ["반려동물 트렌드를 검색하고 있습니다", "계절성, 기념일, 건강 이슈를 정리하고 있습니다", "PetersLab와 연결할 수 있는 주제를 분석하고 있습니다", "추천할 만한 아이디어를 추리는 중입니다"],
    en: ["Searching pet-owner trend signals", "Sorting seasonal and commemorative topics", "Analyzing PetersLab connection points", "Shortlisting strong content ideas"],
    ja: ["ペットトレンドを検索しています", "季節性や記念日テーマを整理しています", "PetersLabとの接点を分析しています", "有力なアイデアを絞り込んでいます"]
  };
  let timer = null;
  let cursor = 0;

  function renderLoading() {
    PLBW.renderFrame(state, "trendLoading");
    headline.textContent = messages[state.language][cursor];
    body.textContent = {
      ko: "일본 시장 기준의 최신 신호를 정리하고 있습니다.",
      en: "Organizing current Japan-facing pet-market signals.",
      ja: "日本市場向けの最新シグナルを整理しています。"
    }[state.language];
    list.innerHTML = messages[state.language].map((message, index) => `<li class="${index === cursor ? "is-active" : ""}">${message}</li>`).join("");
  }

  function startAnimation() {
    timer = window.setInterval(() => {
      cursor = (cursor + 1) % messages[state.language].length;
      renderLoading();
    }, 1200);
  }

  function stopAnimation() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  async function runScan() {
    errorCard.classList.add("is-hidden");
    if (!state.health.openaiReady) {
      errorCard.classList.remove("is-hidden");
      errorText.textContent = PLBW.t(state, "openAiMissing");
      return;
    }

    try {
      const payload = await PLBW.postJSON("/api/trends", { filters: state.filters });
      state.trendPayload = payload;
      state.ideaPayload = null;
      state.draftPayload = null;
      state.selectedTrendIndex = -1;
      PLBW.saveState(state);
      stopAnimation();
      PLBW.go("./idea.html");
    } catch (error) {
      errorCard.classList.remove("is-hidden");
      errorText.textContent = error.message || PLBW.t(state, "fetchErrorBody");
    }
  }

  retryButton.addEventListener("click", runScan);
  backButton.addEventListener("click", () => PLBW.go("./index.html"));
  window.addEventListener("plbw-language-change", renderLoading);

  renderLoading();
  startAnimation();
  runScan();
})();

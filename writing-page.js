(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);
  if (!state.trendPayload?.trends?.length || state.selectedTrendIndex < 0 || !state.selectedKeyword || !PLBW.getText(state.selectedTitleMap, state.language)) {
    PLBW.go("./idea.html");
    return;
  }

  const headline = document.getElementById("loading-headline");
  const body = document.getElementById("loading-body");
  const list = document.getElementById("loading-list");
  const errorCard = document.getElementById("loading-error");
  const errorText = document.getElementById("loading-error-text");
  const retryButton = document.getElementById("retry-button");
  const backButton = document.getElementById("back-button");
  const messages = {
    ko: ["선택한 트렌드와 키워드를 정리하고 있습니다", "PetersLab 브랜드 톤에 맞게 문장을 조정하고 있습니다", "공감을 불러일으킬 수 있는 블로그 구조를 만들고 있습니다", "표현 리스크를 고려해 문장을 점검하고 있습니다", "최종 검토용 초안을 준비하고 있습니다"],
    en: ["Organizing the selected trend and keyword", "Adjusting the tone for PetersLab", "Building a relatable article structure", "Checking expression risk", "Preparing the final review draft"],
    ja: ["選択したトレンドとキーワードを整理しています", "PetersLabのブランドトーンに合わせて文章を整えています", "共感を得やすい記事構成を作っています", "表現リスクを確認しています", "最終確認用の下書きを準備しています"]
  };
  let timer = null;
  let cursor = 0;

  function renderLoading() {
    PLBW.renderFrame(state, "writingLoading");
    backButton.textContent = { ko: "이전", en: "Back", ja: "戻る" }[state.language];
    headline.textContent = messages[state.language][cursor];
    body.textContent = {
      ko: "PetersLab 브랜드 톤과 표현 리스크를 함께 고려해 초안을 구성하고 있습니다.",
      en: "Building a draft with PetersLab tone and softer consumer-facing wording.",
      ja: "PetersLabのブランドトーンと表現リスクを考慮しながら下書きを組み立てています。"
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

  async function runDraft() {
    errorCard.classList.add("is-hidden");
    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    try {
      const payload = await PLBW.postJSON("/api/draft", {
        selection: {
          outputLanguage: state.language,
          direction: state.direction,
          keyword: state.selectedKeyword,
          trendTitleJa: trend.titleJa || "",
          trendTitleKo: trend.titleKo || "",
          trendTitleEn: trend.titleEn || "",
          trendSummaryJa: trend.summaryJa || "",
          trendSummaryEn: trend.summaryEn || "",
          titleJa: state.selectedTitleMap.ja || "",
          titleKo: state.selectedTitleMap.ko || "",
          titleEn: state.selectedTitleMap.en || ""
        }
      });
      state.draftPayload = payload;
      state.draftStatus = "review";
      PLBW.saveState(state);
      stopAnimation();
      PLBW.go("./review.html");
    } catch (error) {
      errorCard.classList.remove("is-hidden");
      errorText.textContent = error.message || PLBW.t(state, "fetchErrorBody");
    }
  }

  retryButton.addEventListener("click", runDraft);
  backButton.addEventListener("click", () => PLBW.go("./idea.html"));
  window.addEventListener("plbw-language-change", renderLoading);
  renderLoading();
  startAnimation();
  runDraft();
})();

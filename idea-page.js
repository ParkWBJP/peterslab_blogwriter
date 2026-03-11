(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);
  if (!state.trendPayload?.trends?.length) {
    PLBW.go("./index.html");
    return;
  }

  const backButton = document.getElementById("back-button");
  const trendResults = document.getElementById("trend-results");
  const selectedTrendCard = document.getElementById("selected-trend-card");
  const feedback = document.getElementById("idea-feedback");
  const refreshIdeasButton = document.getElementById("refresh-ideas-button");
  const keywordSuggestions = document.getElementById("keyword-suggestions");
  const customKeywordInput = document.getElementById("custom-keyword-input");
  const addKeywordButton = document.getElementById("add-keyword-button");
  const titleSuggestions = document.getElementById("title-suggestions");
  const selectedKeywordNote = document.getElementById("selected-keyword-note");
  const selectedTitleInput = document.getElementById("selected-title-input");
  const startWritingButton = document.getElementById("start-writing-button");
  const directionButtons = Array.from(document.querySelectorAll("[data-direction]"));

  function trendText(trend, field) {
    return trend?.[`${field}${{ ko: "Ko", en: "En", ja: "Ja" }[state.language]}`] || trend?.[`${field}Ja`] || "";
  }

  function render() {
    PLBW.renderFrame(state, "idea");
    backButton.textContent = { ko: "이전", en: "Back", ja: "戻る" }[state.language];
    refreshIdeasButton.textContent = { ko: "다시 제안받기", en: "Refresh Ideas", ja: "再提案" }[state.language];
    addKeywordButton.textContent = { ko: "키워드 추가", en: "Add Keyword", ja: "キーワード追加" }[state.language];
    startWritingButton.textContent = { ko: "블로그 작성 시작", en: "Start Writing", ja: "ブログ作成開始" }[state.language];
    customKeywordInput.placeholder = { ko: "직접 입력", en: "Type your own keyword", ja: "直接入力" }[state.language];

    directionButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.direction === state.direction);
    });

    trendResults.innerHTML = state.trendPayload.trends.map((trend, index) => `
      <article class="trend-card ${state.selectedTrendIndex === index ? "is-active" : ""}">
        <div class="trend-card-head">
          <h4>${trendText(trend, "title")}</h4>
          <span class="text-chip">${trend.priority || "Medium"}</span>
        </div>
        <p>${trendText(trend, "summary")}</p>
        <button type="button" class="secondary-button" data-select-trend="${index}">
          ${state.language === "ko" ? "이 트렌드로 진행" : state.language === "ja" ? "このトレンドで進む" : "Use This Trend"}
        </button>
      </article>
    `).join("");

    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    selectedTrendCard.innerHTML = trend ? `
      <p><strong>${trendText(trend, "title")}</strong></p>
      <p>${trendText(trend, "summary")}</p>
      <p>${trendText(trend, "petersPoint")}</p>
    ` : (state.language === "ko" ? "먼저 트렌드를 하나 선택해 주세요." : state.language === "ja" ? "先にトレンドを一つ選んでください。" : "Select a trend first.");

    feedback.classList.toggle("is-hidden", !state._ideaMessage);
    feedback.classList.toggle("is-error", state._ideaTone === "error");
    feedback.textContent = state._ideaMessage || "";

    if (!state.ideaPayload?.keywords?.length) {
      keywordSuggestions.innerHTML = state.language === "ko" ? "키워드 제안은 트렌드 선택 후 표시됩니다." : state.language === "ja" ? "キーワード提案はトレンド選択後に表示されます。" : "Keyword suggestions appear after trend selection.";
    } else {
      keywordSuggestions.innerHTML = `
        <div class="keyword-pills">
          ${state.ideaPayload.keywords.map((item) => `<button type="button" class="keyword-pill ${item.value === state.selectedKeyword ? "is-active" : ""}" data-keyword="${item.value}">${item.value}</button>`).join("")}
        </div>
      `;
    }

    selectedKeywordNote.textContent = state.selectedKeyword || "-";
    if (!state.ideaPayload?.titleSuggestions?.length) {
      titleSuggestions.innerHTML = state.language === "ko" ? "키워드를 선택하면 제목 예시가 표시됩니다." : state.language === "ja" ? "キーワードを選ぶとタイトル例が表示されます。" : "Title suggestions appear after you choose a keyword.";
    } else {
      titleSuggestions.innerHTML = state.ideaPayload.titleSuggestions.map((item, index) => {
        const title = PLBW.getText({ ko: item.titleKo, en: item.titleEn, ja: item.titleJa }, state.language);
        const angle = PLBW.getText({ ko: item.angleKo, en: item.angleEn, ja: item.angleJa }, state.language);
        return `<button type="button" class="title-card ${title === PLBW.getText(state.selectedTitleMap, state.language) ? "is-active" : ""}" data-title-index="${index}"><h4>${title}</h4><p>${angle}</p></button>`;
      }).join("");
    }
    selectedTitleInput.value = PLBW.getText(state.selectedTitleMap, state.language);
  }

  async function loadIdeas(selectedKeyword = "") {
    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    if (!trend) return;
    state._ideaMessage = state.language === "ko" ? "키워드와 제목을 정리하고 있습니다." : state.language === "ja" ? "キーワードとタイトルを整理しています。" : "Preparing keywords and titles.";
    state._ideaTone = "neutral";
    render();
    try {
      const payload = await PLBW.postJSON("/api/ideas", { trend, selectedKeyword, outputLanguage: state.language });
      state.ideaPayload = payload;
      state.selectedKeyword = selectedKeyword || payload.keywords?.[0]?.value || "";
      const firstTitle = payload.titleSuggestions?.[0];
      state.selectedTitleMap = firstTitle ? { ko: firstTitle.titleKo || "", en: firstTitle.titleEn || "", ja: firstTitle.titleJa || "" } : { ko: "", en: "", ja: "" };
      state._ideaMessage = state.language === "ko" ? "키워드와 제목 제안이 준비되었습니다." : state.language === "ja" ? "キーワードとタイトル提案の準備ができました。" : "Keyword and title suggestions are ready.";
      state._ideaTone = "neutral";
      PLBW.saveState(state);
      render();
    } catch (error) {
      state._ideaMessage = error.message;
      state._ideaTone = "error";
      render();
    }
  }

  backButton.addEventListener("click", () => PLBW.go("./index.html"));
  refreshIdeasButton.addEventListener("click", () => loadIdeas(state.selectedKeyword));
  addKeywordButton.addEventListener("click", () => {
    const value = customKeywordInput.value.trim();
    if (!value) return;
    state.selectedKeyword = value;
    customKeywordInput.value = "";
    loadIdeas(value);
  });
  selectedTitleInput.addEventListener("input", (event) => {
    state.selectedTitleMap[state.language] = event.target.value;
    PLBW.saveState(state);
  });
  startWritingButton.addEventListener("click", () => {
    if (state.selectedTrendIndex < 0 || !state.selectedKeyword || !PLBW.getText(state.selectedTitleMap, state.language)) {
      state._ideaMessage = state.language === "ko"
        ? "트렌드, 키워드, 제목을 먼저 정해 주세요."
        : state.language === "ja"
          ? "トレンド、キーワード、タイトルを先に決めてください。"
          : "Choose the trend, keyword, and title first.";
      state._ideaTone = "error";
      render();
      return;
    }
    PLBW.saveState(state);
    PLBW.go("./writing.html");
  });
  trendResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-trend]");
    if (!button) return;
    state.selectedTrendIndex = Number(button.dataset.selectTrend);
    state.ideaPayload = null;
    state.selectedKeyword = "";
    state.selectedTitleMap = { ko: "", en: "", ja: "" };
    PLBW.saveState(state);
    render();
    loadIdeas("");
  });
  keywordSuggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-keyword]");
    if (!button) return;
    state.selectedKeyword = button.dataset.keyword;
    PLBW.saveState(state);
    loadIdeas(button.dataset.keyword);
  });
  titleSuggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-title-index]");
    if (!button) return;
    const item = state.ideaPayload.titleSuggestions[Number(button.dataset.titleIndex)];
    state.selectedTitleMap = { ko: item.titleKo || "", en: item.titleEn || "", ja: item.titleJa || "" };
    PLBW.saveState(state);
    render();
  });
  directionButtons.forEach((button) => button.addEventListener("click", () => {
    state.direction = button.dataset.direction;
    PLBW.saveState(state);
    render();
  }));

  window.addEventListener("plbw-language-change", render);
  render();
})();

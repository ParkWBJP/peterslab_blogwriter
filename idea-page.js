(async () => {
  const state = PLBW.loadState();
  await PLBW.refreshHealth(state);

  if (!state.trendPayload?.trends?.length) {
    PLBW.goPhase("trend");
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

  function fieldByLanguage(prefix) {
    return `${prefix}${state.language === "ko" ? "Ko" : state.language === "en" ? "En" : "Ja"}`;
  }

  function trendText(trend, prefix) {
    return trend?.[fieldByLanguage(prefix)] || trend?.[`${prefix}Ja`] || "";
  }

  function selectedTitle() {
    return PLBW.getText(state.selectedTitleMap, state.language);
  }

  function renderFeedback() {
    feedback.classList.toggle("is-hidden", !state._ideaMessage);
    feedback.classList.toggle("is-error", state._ideaTone === "error");
    feedback.textContent = state._ideaMessage || "";
  }

  function renderTrends() {
    trendResults.innerHTML = state.trendPayload.trends.map((trend, index) => `
      <article class="trend-card ${state.selectedTrendIndex === index ? "is-active" : ""}">
        <div class="trend-card-head">
          <div>
            <h3>${trendText(trend, "title")}</h3>
            <p>${trendText(trend, "summary")}</p>
          </div>
          <span class="priority-badge priority-${String(trend.priority || "Medium").toLowerCase()}">${trend.priority || "Medium"}</span>
        </div>
        <div class="trend-card-body">
          <p><strong>${trendText(trend, "whyNow")}</strong></p>
          <p>${trendText(trend, "petersPoint")}</p>
        </div>
        <button type="button" class="secondary-button" data-select-trend="${index}">${PLBW.t(state, "useThisTrend")}</button>
      </article>
    `).join("");
  }

  function renderSelectedTrend() {
    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    if (!trend) {
      selectedTrendCard.innerHTML = `<p>${PLBW.t(state, "pickTrendFirst")}</p>`;
      return;
    }

    selectedTrendCard.innerHTML = `
      <span class="mini-kicker">${PLBW.t(state, "selectedTrendHeading")}</span>
      <h3>${trendText(trend, "title")}</h3>
      <p>${trendText(trend, "summary")}</p>
      <dl class="detail-list">
        <div><dt>${PLBW.t(state, "summaryTrend")}</dt><dd>${trendText(trend, "whyNow")}</dd></div>
        <div><dt>PetersLab</dt><dd>${trendText(trend, "petersPoint")}</dd></div>
      </dl>
    `;
  }

  function renderKeywords() {
    if (!state.ideaPayload?.keywords?.length) {
      keywordSuggestions.innerHTML = `<p class="empty-copy">${PLBW.t(state, "pickTrendFirst")}</p>`;
      return;
    }

    keywordSuggestions.innerHTML = state.ideaPayload.keywords.map((item) => `
      <button type="button" class="keyword-pill ${item.value === state.selectedKeyword ? "is-active" : ""}" data-keyword="${item.value}">
        ${item.value}
      </button>
    `).join("");
  }

  function renderTitles() {
    selectedKeywordNote.textContent = state.selectedKeyword || "-";

    if (!state.ideaPayload?.titleSuggestions?.length) {
      titleSuggestions.innerHTML = `<p class="empty-copy">${PLBW.t(state, "ideaPreparing")}</p>`;
      return;
    }

    titleSuggestions.innerHTML = state.ideaPayload.titleSuggestions.map((item, index) => {
      const title = PLBW.getText({ ko: item.titleKo, en: item.titleEn, ja: item.titleJa }, state.language);
      const angle = PLBW.getText({ ko: item.angleKo, en: item.angleEn, ja: item.angleJa }, state.language);
      return `
        <button type="button" class="title-card ${title === selectedTitle() ? "is-active" : ""}" data-title-index="${index}">
          <strong>${title}</strong>
          <span>${angle}</span>
        </button>
      `;
    }).join("");
  }

  function renderDirections() {
    directionButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.direction === state.direction);
    });
  }

  function render() {
    PLBW.renderFrame(state, "idea");
    renderTrends();
    renderSelectedTrend();
    renderKeywords();
    renderTitles();
    renderDirections();
    renderFeedback();
    selectedTitleInput.value = selectedTitle();
  }

  async function loadIdeas(selectedKeyword = "") {
    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    if (!trend) {
      state._ideaMessage = PLBW.t(state, "pickTrendFirst");
      state._ideaTone = "error";
      render();
      return;
    }

    state._ideaMessage = PLBW.t(state, "ideaPreparing");
    state._ideaTone = "neutral";
    render();

    try {
      const payload = await PLBW.postJSON("/api/ideas", {
        trend,
        selectedKeyword,
        outputLanguage: state.language,
      });

      state.ideaPayload = payload;
      state.selectedKeyword = selectedKeyword || payload.keywords?.[0]?.value || "";

      const firstTitle = payload.titleSuggestions?.[0];
      if (firstTitle) {
        state.selectedTitleMap = {
          ko: firstTitle.titleKo || "",
          en: firstTitle.titleEn || "",
          ja: firstTitle.titleJa || "",
        };
      }

      state._ideaMessage = PLBW.t(state, "ideaReady");
      state._ideaTone = "neutral";
      PLBW.saveState(state);
      render();
    } catch (error) {
      state._ideaMessage = error.message || PLBW.t(state, "fetchErrorBody");
      state._ideaTone = "error";
      PLBW.saveState(state);
      render();
    }
  }

  backButton.addEventListener("click", () => PLBW.goPhase("trend"));
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
    if (state.selectedTrendIndex < 0 || !state.selectedKeyword || !selectedTitle().trim()) {
      state._ideaMessage = PLBW.t(state, "writingNeedSelections");
      state._ideaTone = "error";
      render();
      return;
    }
    PLBW.setBanner(state, "writingLoadingLead", "neutral");
    PLBW.goPhase("writingLoading");
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
    const item = state.ideaPayload?.titleSuggestions?.[Number(button.dataset.titleIndex)];
    if (!item) return;
    state.selectedTitleMap = {
      ko: item.titleKo || "",
      en: item.titleEn || "",
      ja: item.titleJa || "",
    };
    PLBW.saveState(state);
    render();
  });

  directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.direction = button.dataset.direction;
      PLBW.saveState(state);
      render();
    });
  });

  window.addEventListener("plbw-language-change", render);

  if (state.selectedTrendIndex >= 0 && !state.ideaPayload) {
    render();
    loadIdeas("");
  } else {
    render();
  }
})();

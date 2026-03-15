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
  const titleSuggestions = document.getElementById("title-suggestions");
  const selectedKeywordNote = document.getElementById("selected-keyword-note");
  const selectedTitleInput = document.getElementById("selected-title-input");
  const startWritingButton = document.getElementById("start-writing-button");
  const directionButtons = Array.from(document.querySelectorAll("[data-direction]"));
  const emojiModeButtons = Array.from(document.querySelectorAll("[data-emoji-mode]"));

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

  function renderTitles() {
    selectedKeywordNote.textContent = PLBW.t(state, "titlePickGuide");

    if (state._ideasLoading) {
      titleSuggestions.innerHTML = `
        <div class="title-loading-card">
          <div class="loading-pill-row">
            <span class="loading-pill"></span>
            <span class="loading-pill loading-pill-short"></span>
          </div>
          <div class="loading-line loading-line-long"></div>
          <div class="loading-line loading-line-mid"></div>
          <div class="loading-line loading-line-long"></div>
        </div>
        <div class="title-loading-card">
          <div class="loading-pill-row">
            <span class="loading-pill"></span>
            <span class="loading-pill loading-pill-short"></span>
          </div>
          <div class="loading-line loading-line-mid"></div>
          <div class="loading-line loading-line-long"></div>
          <div class="loading-line loading-line-short"></div>
        </div>
      `;
      return;
    }

    if (!state.ideaPayload?.titleSuggestions?.length) {
      titleSuggestions.innerHTML = `<p class="empty-copy">${PLBW.t(state, "ideaPreparing")}</p>`;
      return;
    }

    titleSuggestions.innerHTML = state.ideaPayload.titleSuggestions.map((item, index) => {
      const title = PLBW.getText({ ko: item.titleKo, en: item.titleEn, ja: item.titleJa }, state.language);
      const angle = PLBW.getText({ ko: item.angleKo, en: item.angleEn, ja: item.angleJa }, state.language);
      const isActive = title === selectedTitle();
      return `
        <button type="button" class="title-card ${isActive ? "is-active" : ""}" data-title-index="${index}">
          ${isActive ? `<span class="title-selected-badge">${PLBW.t(state, "titleChosenLabel")}</span>` : ""}
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

  function renderEmojiMode() {
    emojiModeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.emojiMode === state.emojiMode);
    });
  }

  function render() {
    state._ideasLoading = Boolean(state._ideasLoading);
    PLBW.renderFrame(state, "idea");
    renderTrends();
    renderSelectedTrend();
    renderTitles();
    renderDirections();
    renderEmojiMode();
    renderFeedback();
    selectedTitleInput.value = selectedTitle();
  }

  async function loadIdeas() {
    const trend = state.trendPayload.trends[state.selectedTrendIndex];
    if (!trend) {
      state._ideaMessage = PLBW.t(state, "pickTrendFirst");
      state._ideaTone = "error";
      render();
      return;
    }

    state._ideaMessage = PLBW.t(state, "ideaPreparing");
    state._ideaTone = "neutral";
    state._ideasLoading = true;
    render();

    try {
      const payload = await PLBW.postJSON("/api/ideas", {
        trend: {
          title: trendText(trend, "title"),
          summary: trendText(trend, "summary"),
          petersPoint: trendText(trend, "petersPoint"),
        },
        selectedKeyword: "",
        outputLanguage: state.language,
      });

      state.ideaPayload = payload;
      state.selectedKeyword = trendText(trend, "title");

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
      state._ideasLoading = false;
      PLBW.saveState(state);
      render();
    } catch (error) {
      state._ideaMessage = error.message || PLBW.t(state, "fetchErrorBody");
      state._ideaTone = "error";
      state._ideasLoading = false;
      PLBW.saveState(state);
      render();
    }
  }

  backButton.addEventListener("click", () => PLBW.goPhase("trend"));
  refreshIdeasButton.addEventListener("click", () => loadIdeas());
  selectedTitleInput.addEventListener("input", (event) => {
    state.selectedTitleMap[state.language] = event.target.value;
    PLBW.saveState(state);
  });
  startWritingButton.addEventListener("click", () => {
    if (state.selectedTrendIndex < 0 || !selectedTitle().trim()) {
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
    state._ideasLoading = true;
    PLBW.saveState(state);
    render();
    loadIdeas();
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

  emojiModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.emojiMode = button.dataset.emojiMode;
      PLBW.saveState(state);
      render();
    });
  });

  window.addEventListener("plbw-language-change", render);

  if (state.selectedTrendIndex >= 0 && !state.ideaPayload) {
    state._ideasLoading = true;
    render();
    loadIdeas();
  } else {
    render();
  }
})();

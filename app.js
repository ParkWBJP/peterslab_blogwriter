const PLBW = (() => {
  const STORAGE_KEY = "plbw-workflow-v1";
  const PHASES = ["trend", "trendLoading", "idea", "writingLoading", "review", "completed"];
  const translations = {
    ko: {
      productName: "Peter's Lab Blog Writer",
      productDescription: "일본 반려동물 시장 트렌드를 바탕으로 공감형 블로그 초안을 만들고 최종 검토까지 이어지는 단계형 도구입니다.",
      language: "언어",
      connectionStatus: "연결 상태",
      heroGuide: "위에서 아래로 따라가면 트렌드 선택부터 최종 등록 준비까지 순서대로 진행할 수 있습니다.",
      stepTrendTitle: "Trend Scan",
      stepTrendLoadingTitle: "Trend Loading",
      stepIdeaTitle: "Idea Discovery",
      stepWritingLoadingTitle: "Blog Writing",
      stepReviewTitle: "Review & Edit",
      stepCompletedTitle: "Completed",
      stepCurrent: "진행 중",
      stepWaiting: "대기",
      stepDone: "완료",
      healthReady: "연결됨",
      healthMissing: "설정 필요",
      openAiMissing: "OpenAI API 설정이 필요합니다. 로컬 .env 파일을 확인해 주세요.",
      fetchErrorTitle: "데이터를 불러오는 중 문제가 발생했습니다",
      fetchErrorBody: "잠시 후 다시 시도해 주세요. 네트워크 또는 API 설정을 확인해 주세요.",
      retry: "다시 시도",
      trendResultsHeading: "트렌드 선택",
      chooseTrendHint: "한 개를 골라 다음 작업을 이어가세요.",
      selectedTrendHeading: "선택한 트렌드",
      keywordSuggestions: "추천 키워드",
      titleSuggestions: "제목 제안",
      selectedTitle: "최종 제목",
      blogDirection: "글 방향",
      directionEmpathy: "공감형",
      directionInformative: "정보형",
      directionSeasonal: "계절형",
      directionAnniversary: "기념일형",
      directionGuardian: "보호자 경험형",
      summaryTrend: "선택한 트렌드",
      summaryKeyword: "선택한 키워드",
      summaryLanguage: "언어",
      summaryStatus: "현재 상태",
      fieldTitle: "제목",
      fieldLead: "리드문",
      fieldBody: "본문 전체",
      fieldCta: "CTA",
      fieldMeta: "메타 설명",
      fieldKeywords: "이미지 키워드",
      whyThisDraft: "왜 이런 방향으로 썼나요?",
      riskReview: "표현 조정 포인트",
      trendEvidence: "트렌드 근거",
      completedTimeLabel: "완료 시간",
      completedUploadLabel: "업로드 상태",
      completedLanguageLabel: "언어",
      notionUpload: "Notion 업로드",
      copyAll: "전체 글 복사",
      backToReview: "수정 화면으로 돌아가기",
      newArticle: "새 글 만들기",
      uploadReady: "업로드 대기",
      uploadDone: "업로드 완료",
      uploadFailed: "업로드 실패",
      uploadUnavailable: "Notion 설정 필요",
      draftStatusDraft: "초안 완료",
      draftStatusReview: "검토 중",
      draftStatusEdited: "수정 중",
      draftStatusSaved: "임시 저장됨",
      draftStatusCompleted: "완료"
    },
    en: {
      productName: "Peter's Lab Blog Writer",
      productDescription: "A guided writing tool that turns Japan-facing pet trends into a PetersLab blog draft and takes the user through final review.",
      language: "Language",
      connectionStatus: "Connection Status",
      heroGuide: "Follow each step in order to move from trend scan to final publication prep.",
      stepTrendTitle: "Trend Scan",
      stepTrendLoadingTitle: "Trend Loading",
      stepIdeaTitle: "Idea Discovery",
      stepWritingLoadingTitle: "Blog Writing",
      stepReviewTitle: "Review & Edit",
      stepCompletedTitle: "Completed",
      stepCurrent: "Current",
      stepWaiting: "Waiting",
      stepDone: "Done",
      healthReady: "Ready",
      healthMissing: "Setup Needed",
      openAiMissing: "OpenAI API setup is required. Check your local .env file.",
      fetchErrorTitle: "There was a problem while loading data",
      fetchErrorBody: "Please try again shortly. Check your network or API setup if the issue continues.",
      retry: "Try Again",
      trendResultsHeading: "Choose a Trend",
      chooseTrendHint: "Pick one result to continue.",
      selectedTrendHeading: "Selected Trend",
      keywordSuggestions: "Keyword Suggestions",
      titleSuggestions: "Title Suggestions",
      selectedTitle: "Final Title",
      blogDirection: "Content Direction",
      directionEmpathy: "Empathy",
      directionInformative: "Informative",
      directionSeasonal: "Seasonal",
      directionAnniversary: "Anniversary",
      directionGuardian: "Guardian Story",
      summaryTrend: "Selected Trend",
      summaryKeyword: "Selected Keyword",
      summaryLanguage: "Language",
      summaryStatus: "Current Status",
      fieldTitle: "Title",
      fieldLead: "Lead",
      fieldBody: "Full Body",
      fieldCta: "CTA",
      fieldMeta: "Meta Description",
      fieldKeywords: "Image Keywords",
      whyThisDraft: "Why this direction?",
      riskReview: "Expression Notes",
      trendEvidence: "Trend Evidence",
      completedTimeLabel: "Completed At",
      completedUploadLabel: "Upload Status",
      completedLanguageLabel: "Language",
      notionUpload: "Upload to Notion",
      copyAll: "Copy Full Article",
      backToReview: "Back to Review",
      newArticle: "New Article",
      uploadReady: "Ready to Upload",
      uploadDone: "Uploaded",
      uploadFailed: "Upload Failed",
      uploadUnavailable: "Notion Setup Needed",
      draftStatusDraft: "Draft Ready",
      draftStatusReview: "In Review",
      draftStatusEdited: "Editing",
      draftStatusSaved: "Saved",
      draftStatusCompleted: "Completed"
    },
    ja: {
      productName: "Peter's Lab Blog Writer",
      productDescription: "日本のペット市場トレンドをもとに、共感されやすいブログ下書きを作成し、最終確認まで進めるステップ型ツールです。",
      language: "言語",
      connectionStatus: "接続状態",
      heroGuide: "上から順に進めると、トレンド選定から最終登録準備まで流れで進められます。",
      stepTrendTitle: "Trend Scan",
      stepTrendLoadingTitle: "Trend Loading",
      stepIdeaTitle: "Idea Discovery",
      stepWritingLoadingTitle: "Blog Writing",
      stepReviewTitle: "Review & Edit",
      stepCompletedTitle: "Completed",
      stepCurrent: "進行中",
      stepWaiting: "待機",
      stepDone: "完了",
      healthReady: "接続済み",
      healthMissing: "設定必要",
      openAiMissing: "OpenAI API設定が必要です。ローカルの .env を確認してください。",
      fetchErrorTitle: "データ読み込み中に問題が発生しました",
      fetchErrorBody: "しばらくしてからもう一度お試しください。ネットワークやAPI設定も確認してください。",
      retry: "再試行",
      trendResultsHeading: "トレンド選択",
      chooseTrendHint: "一つ選ぶと次へ進めます。",
      selectedTrendHeading: "選択したトレンド",
      keywordSuggestions: "おすすめキーワード",
      titleSuggestions: "タイトル提案",
      selectedTitle: "最終タイトル",
      blogDirection: "記事の方向",
      directionEmpathy: "共感型",
      directionInformative: "情報型",
      directionSeasonal: "季節型",
      directionAnniversary: "記念日型",
      directionGuardian: "飼い主体験型",
      summaryTrend: "選択したトレンド",
      summaryKeyword: "選択したキーワード",
      summaryLanguage: "言語",
      summaryStatus: "現在状態",
      fieldTitle: "タイトル",
      fieldLead: "リード文",
      fieldBody: "本文全体",
      fieldCta: "CTA",
      fieldMeta: "メタ説明",
      fieldKeywords: "画像キーワード",
      whyThisDraft: "この方向で書いた理由",
      riskReview: "表現調整ポイント",
      trendEvidence: "トレンド根拠",
      completedTimeLabel: "完了時間",
      completedUploadLabel: "アップロード状態",
      completedLanguageLabel: "言語",
      notionUpload: "Notionへアップロード",
      copyAll: "全文コピー",
      backToReview: "編集画面に戻る",
      newArticle: "新しい記事を作る",
      uploadReady: "アップロード待機",
      uploadDone: "アップロード完了",
      uploadFailed: "アップロード失敗",
      uploadUnavailable: "Notion設定が必要です",
      draftStatusDraft: "下書き完了",
      draftStatusReview: "確認中",
      draftStatusEdited: "編集中",
      draftStatusSaved: "保存済み",
      draftStatusCompleted: "完了"
    }
  };

  function defaultState() {
    return {
      language: "ko",
      health: { openaiReady: false, notionReady: false },
      filters: { petType: "common", themeType: "health", scope: "japan" },
      trendPayload: null,
      selectedTrendIndex: -1,
      ideaPayload: null,
      selectedKeyword: "",
      selectedTitleMap: { ko: "", en: "", ja: "" },
      direction: "empathy",
      draftPayload: null,
      draftStatus: "draft",
      notion: { status: "idle", url: "" },
      completedAt: "",
      banner: { key: "heroGuide", tone: "neutral" }
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return { ...defaultState(), ...(saved || {}) };
    } catch {
      return defaultState();
    }
  }

  function saveState(state) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState(language = "ko") {
    const state = defaultState();
    state.language = language;
    saveState(state);
    return state;
  }

  function t(state, key) {
    return translations[state.language]?.[key] || translations.en[key] || key;
  }

  function languageLabel(lang, uiLang) {
    const names = {
      ko: { ko: "한국어", en: "Korean", ja: "韓国語" },
      en: { ko: "영어", en: "English", ja: "英語" },
      ja: { ko: "일본어", en: "Japanese", ja: "日本語" }
    };
    return names[lang]?.[uiLang] || lang.toUpperCase();
  }

  function getText(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.ja || value.en || value.ko || "";
  }

  function draftStatusLabel(state) {
    return {
      draft: t(state, "draftStatusDraft"),
      review: t(state, "draftStatusReview"),
      edited: t(state, "draftStatusEdited"),
      saved: t(state, "draftStatusSaved"),
      completed: t(state, "draftStatusCompleted")
    }[state.draftStatus] || t(state, "draftStatusDraft");
  }

  async function postJSON(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }

  async function refreshHealth(state) {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      state.health = {
        openaiReady: Boolean(data.openaiReady),
        notionReady: Boolean(data.notionReady)
      };
    } catch {
      state.health = { openaiReady: false, notionReady: false };
    }
    saveState(state);
    return state.health;
  }

  function applyTranslations(state) {
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(state, node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-option]").forEach((node) => {
      node.textContent = t(state, node.dataset.i18nOption);
    });
  }

  function renderFrame(state, currentPhase) {
    applyTranslations(state);
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.langSwitch === state.language);
      button.onclick = () => {
        state.language = button.dataset.langSwitch;
        saveState(state);
        renderFrame(state, currentPhase);
        window.dispatchEvent(new CustomEvent("plbw-language-change"));
      };
    });

    const openai = document.getElementById("openai-status");
    const notion = document.getElementById("notion-status");
    if (openai) {
      openai.className = `status-chip ${state.health.openaiReady ? "ready" : "error"}`;
      openai.textContent = `OpenAI · ${state.health.openaiReady ? t(state, "healthReady") : t(state, "healthMissing")}`;
    }
    if (notion) {
      notion.className = `status-chip ${state.health.notionReady ? "ready" : "error"}`;
      notion.textContent = `Notion · ${state.health.notionReady ? t(state, "healthReady") : t(state, "healthMissing")}`;
    }

    const banner = document.getElementById("status-banner");
    if (banner) {
      banner.textContent = t(state, state.banner.key);
      banner.classList.remove("is-success", "is-error");
      if (state.banner.tone === "success") banner.classList.add("is-success");
      if (state.banner.tone === "error") banner.classList.add("is-error");
    }

    document.querySelectorAll("[data-phase-nav]").forEach((button, index) => {
      const phase = button.dataset.phaseNav;
      const currentIndex = PHASES.indexOf(currentPhase);
      const phaseIndex = PHASES.indexOf(phase);
      button.classList.toggle("is-current", phase === currentPhase);
      button.classList.toggle("is-complete", phaseIndex < currentIndex);
      const status = button.querySelector("[data-step-state]");
      if (status) {
        status.textContent = phaseIndex < currentIndex ? t(state, "stepDone") : phase === currentPhase ? t(state, "stepCurrent") : t(state, "stepWaiting");
      }
    });
  }

  function go(page) {
    window.location.href = page;
  }

  return {
    PHASES,
    loadState,
    saveState,
    resetState,
    t,
    getText,
    languageLabel,
    draftStatusLabel,
    postJSON,
    refreshHealth,
    renderFrame,
    go
  };
})();

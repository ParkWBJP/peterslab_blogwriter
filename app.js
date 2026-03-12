const PLBW = (() => {
  const STORAGE_KEY = "plbw-workflow-v3";
  const PHASES = ["trend", "trendLoading", "idea", "writingLoading", "review", "completed"];
  const PAGE_BY_PHASE = {
    trend: "./index.html",
    trendLoading: "./trend-loading.html",
    idea: "./idea.html",
    writingLoading: "./writing.html",
    review: "./review.html",
    completed: "./completed.html",
  };

  const translations = {
    ko: {
      productName: "Peter's Lab Blog Writer",
      productDescription: "일본 반려동물 시장 흐름을 바탕으로 블로그 초안을 만들고 최종 검토까지 이어가는 단계형 워크플로우입니다.",
      language: "언어",
      connectionStatus: "연결 상태",
      heroGuide: "한 번에 한 단계씩 진행하면서 트렌드 탐색부터 최종 정리까지 차분하게 이어집니다.",
      homeEyebrow: "PetersLab Editorial Tool",
      topHintTrend: "먼저 지금 반응할 만한 트렌드를 고르세요.",
      topHintReview: "문서 전체 흐름과 표현 강도를 함께 점검하세요.",
      topHintCompleted: "최종 결과를 복사하거나 Notion 업로드 준비 상태를 확인할 수 있습니다.",
      stepTrendTitle: "Trend Scan",
      stepTrendLoadingTitle: "Trend Loading",
      stepIdeaTitle: "Idea Discovery",
      stepWritingLoadingTitle: "Blog Writing",
      stepReviewTitle: "Review & Edit",
      stepCompletedTitle: "Completed",
      stepCurrent: "진행 중",
      stepWaiting: "대기",
      stepDone: "완료",
      healthReady: "준비됨",
      healthMissing: "설정 필요",
      openAiMissing: "OpenAI API 설정이 필요합니다. 로컬 또는 배포 환경 변수를 확인해 주세요.",
      fetchErrorTitle: "데이터를 불러오는 중 문제가 발생했습니다",
      fetchErrorBody: "잠시 후 다시 시도해 주세요. 네트워크 또는 API 설정을 함께 확인해 주세요.",
      retry: "다시 시도",
      back: "이전",
      backToTrend: "Trend Scan으로 돌아가기",
      backToIdea: "아이디어 단계로 돌아가기",
      backToReview: "검토 화면으로 돌아가기",
      newArticle: "새 글 만들기",
      startTrendScan: "트렌드 스캔 시작",
      petType: "반려동물 유형",
      themeType: "주제",
      scope: "검색 범위",
      petCommon: "공통",
      petDog: "강아지",
      petCat: "고양이",
      themeHealth: "건강",
      themeLifestyle: "생활",
      themeSenior: "노령",
      themeSeasonal: "계절",
      themeAnniversary: "기념일",
      themeHomecare: "홈케어",
      scopeJapan: "일본 중심",
      scopeGlobal: "글로벌 참고 포함",
      trendIntroTitle: "어떤 트렌드에서 시작할까요?",
      trendIntroBody: "필터를 고른 뒤 스캔을 시작하면, 지금 시점에 어울리는 주제 후보를 정리해 드립니다.",
      trendLoadingLead: "검색, 정리, 연결 포인트 분석을 순서대로 진행하고 있습니다.",
      trendLoadingMsg1: "일본 반려동물 시장 신호를 검색하고 있습니다",
      trendLoadingMsg2: "계절성, 기념일, 건강 이슈를 분류하고 있습니다",
      trendLoadingMsg3: "PetersLab와 자연스럽게 연결할 수 있는 포인트를 찾고 있습니다",
      trendLoadingMsg4: "바로 선택하기 쉬운 트렌드 카드로 정리하고 있습니다",
      trendLoadingTitle: "트렌드를 정리하고 있습니다",
      trendLoadingBody: "몇 개의 실시간 신호를 읽고, 블로그로 발전시키기 쉬운 후보만 추리고 있습니다.",
      ideaIntroTitle: "아이디어를 구체화하세요",
      ideaIntroBody: "트렌드를 하나 고른 뒤 키워드와 제목 방향을 정하면 글 초안으로 바로 넘어갑니다.",
      trendResultsHeading: "추천 트렌드",
      chooseTrendHint: "지금 가장 자연스럽게 연결되는 출발점을 고르세요.",
      selectedTrendHeading: "선택한 트렌드",
      keywordSuggestions: "추천 키워드",
      customKeyword: "직접 키워드 입력",
      addKeyword: "추가",
      refreshIdeas: "다시 추천",
      selectedKeyword: "선택한 키워드",
      titleSuggestions: "제목 제안",
      selectedTitle: "최종 제목",
      blogDirection: "글 방향",
      directionEmpathy: "공감형",
      directionInformative: "정보형",
      directionSeasonal: "계절형",
      directionAnniversary: "기념일형",
      directionGuardian: "보호자 경험형",
      startWriting: "블로그 작성 시작",
      useThisTrend: "이 트렌드로 진행",
      pickTrendFirst: "먼저 트렌드를 하나 선택해 주세요.",
      ideaPreparing: "키워드와 제목 제안을 준비하고 있습니다.",
      ideaReady: "키워드와 제목 제안이 준비되었습니다.",
      writingNeedSelections: "트렌드, 키워드, 제목을 먼저 정해 주세요.",
      writingLoadingLead: "브랜드 톤과 표현 리스크를 함께 고려하며 초안을 구성하고 있습니다.",
      writingLoadingMsg1: "선택한 트렌드와 키워드를 정리하고 있습니다",
      writingLoadingMsg2: "PetersLab 톤에 맞게 문장 결을 조정하고 있습니다",
      writingLoadingMsg3: "공감형 문서 구조를 만들고 있습니다",
      writingLoadingMsg4: "과해 보일 수 있는 표현을 점검하고 있습니다",
      writingLoadingMsg5: "최종 검토용 초안을 준비하고 있습니다",
      writingLoadingTitle: "블로그 초안을 작성하고 있습니다",
      writingLoadingBody: "문서 구조, 브랜드 톤, 표현 완화까지 한 번에 반영해 검토 가능한 초안으로 정리합니다.",
      articleReady: "초안이 준비되었습니다. 이제 전체 문서를 보면서 수정할 수 있습니다.",
      summaryTrend: "선택한 트렌드",
      summaryKeyword: "선택한 키워드",
      summaryLanguage: "사용 언어",
      summaryStatus: "현재 상태",
      fieldTitle: "제목",
      fieldLead: "리드문",
      fieldBody: "본문",
      fieldCta: "CTA",
      fieldMeta: "메타 설명",
      fieldKeywords: "이미지 키워드",
      documentTitle: "최종 문서를 검토하고 수정하세요",
      documentBody: "선택한 언어 기준으로 전체 글만 표시합니다. 필요한 부분만 직접 다듬은 뒤 완료 단계로 이동하세요.",
      whyThisDraft: "이 방향으로 작성한 이유",
      empathyPoint: "반영한 공감 포인트",
      brandConnection: "PetersLab 연결 포인트",
      riskReview: "표현 조정 메모",
      trendEvidence: "트렌드 참고 링크",
      saveDraft: "임시 저장",
      regenerate: "다시 생성",
      moveCompleted: "완료 단계로 이동",
      riskReason: "이유",
      riskMeaning: "설명",
      completedTitle: "작업이 완료되었습니다",
      completedBody: "최종 문서를 복사하거나 Notion 업로드를 준비할 수 있습니다.",
      completedTimeLabel: "완료 시간",
      completedUploadLabel: "업로드 상태",
      completedLanguageLabel: "사용 언어",
      notionUpload: "Notion 업로드",
      copyAll: "전체 글 복사",
      uploadReady: "업로드 가능",
      uploadDone: "업로드 완료",
      uploadFailed: "업로드 실패",
      uploadUnavailable: "Notion 설정 필요",
      draftStatusDraft: "초안 완료",
      draftStatusReview: "검토 중",
      draftStatusEdited: "수정 중",
      draftStatusSaved: "임시 저장됨",
      draftStatusCompleted: "완료",
      copySuccess: "전체 글이 클립보드에 복사되었습니다.",
      copyFailed: "복사에 실패했습니다. 다시 시도해 주세요.",
      uploadSuccess: "Notion 업로드가 완료되었습니다.",
      uploadFailedBody: "Notion 업로드 중 문제가 발생했습니다. 설정과 네트워크를 확인해 주세요.",
      notReadyForNotion: "Notion 환경변수가 아직 설정되지 않았습니다.",
      reviewSummaryLabel: "검토 요약",
      noSources: "표시할 참고 링크가 아직 없습니다.",
      noCompliance: "자동 조정된 표현이 없거나 리스크가 낮은 초안입니다.",
      noRationale: "초안 설명이 아직 준비되지 않았습니다.",
      openInNotion: "Notion에서 보기",
    },
    en: {
      productName: "Peter's Lab Blog Writer",
      productDescription: "A guided workflow that turns Japan-facing pet trends into a draft and brings the article through the final review.",
      language: "Language",
      connectionStatus: "Connection Status",
      heroGuide: "Move through the workflow one clear step at a time, from trend scan to final delivery.",
      homeEyebrow: "PetersLab Editorial Tool",
      topHintTrend: "Start by choosing the most timely trend signal.",
      topHintReview: "Review the full document and soften wording where needed.",
      topHintCompleted: "Copy the final article or check whether Notion upload is ready.",
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
      openAiMissing: "OpenAI API setup is required. Check your local or hosted environment variables.",
      fetchErrorTitle: "There was a problem while loading data",
      fetchErrorBody: "Please try again shortly. Check your network or API setup if the issue continues.",
      retry: "Try Again",
      back: "Back",
      backToTrend: "Back to Trend Scan",
      backToIdea: "Back to Idea Discovery",
      backToReview: "Back to Review",
      newArticle: "New Article",
      startTrendScan: "Start Trend Scan",
      petType: "Pet Type",
      themeType: "Theme",
      scope: "Search Scope",
      petCommon: "Common",
      petDog: "Dog",
      petCat: "Cat",
      themeHealth: "Health",
      themeLifestyle: "Lifestyle",
      themeSenior: "Senior",
      themeSeasonal: "Seasonal",
      themeAnniversary: "Anniversary",
      themeHomecare: "Home Care",
      scopeJapan: "Japan Focus",
      scopeGlobal: "Include Global Signals",
      trendIntroTitle: "Where should this article start?",
      trendIntroBody: "Choose filters and scan the market. The tool will return a small set of trends that fit PetersLab.",
      trendLoadingLead: "Searching, sorting, and mapping brand connection points.",
      trendLoadingMsg1: "Searching live Japan-facing pet signals",
      trendLoadingMsg2: "Sorting seasonal, commemorative, and wellness topics",
      trendLoadingMsg3: "Finding natural PetersLab connection points",
      trendLoadingMsg4: "Turning signals into clear starter cards",
      trendLoadingTitle: "Collecting trend signals",
      trendLoadingBody: "The system is reading current signals and narrowing them into a few practical topic options.",
      ideaIntroTitle: "Shape the blog idea",
      ideaIntroBody: "Select one trend, refine a keyword, and decide the tone before drafting starts.",
      trendResultsHeading: "Recommended Trends",
      chooseTrendHint: "Choose the most natural starting point for this article.",
      selectedTrendHeading: "Selected Trend",
      keywordSuggestions: "Keyword Suggestions",
      customKeyword: "Custom Keyword",
      addKeyword: "Add",
      refreshIdeas: "Refresh",
      selectedKeyword: "Selected Keyword",
      titleSuggestions: "Title Suggestions",
      selectedTitle: "Final Title",
      blogDirection: "Content Direction",
      directionEmpathy: "Empathy",
      directionInformative: "Informative",
      directionSeasonal: "Seasonal",
      directionAnniversary: "Anniversary",
      directionGuardian: "Guardian Story",
      startWriting: "Start Writing",
      useThisTrend: "Use This Trend",
      pickTrendFirst: "Select a trend first.",
      ideaPreparing: "Preparing keyword and title suggestions.",
      ideaReady: "Keyword and title suggestions are ready.",
      writingNeedSelections: "Choose the trend, keyword, and title first.",
      writingLoadingLead: "Drafting with PetersLab tone while checking risky wording.",
      writingLoadingMsg1: "Organizing the selected trend and keyword",
      writingLoadingMsg2: "Refining the tone to fit PetersLab",
      writingLoadingMsg3: "Building a relatable editorial structure",
      writingLoadingMsg4: "Reducing wording that may sound too strong",
      writingLoadingMsg5: "Preparing the final review document",
      writingLoadingTitle: "Writing the blog draft",
      writingLoadingBody: "The draft is being assembled with structure, tone, and compliance support in one pass.",
      articleReady: "The draft is ready. You can now review and edit the full document.",
      summaryTrend: "Selected Trend",
      summaryKeyword: "Selected Keyword",
      summaryLanguage: "Language",
      summaryStatus: "Current Status",
      fieldTitle: "Title",
      fieldLead: "Lead",
      fieldBody: "Body",
      fieldCta: "CTA",
      fieldMeta: "Meta Description",
      fieldKeywords: "Image Keywords",
      documentTitle: "Review and refine the final document",
      documentBody: "Only the selected language is shown here. Edit the article directly and move on when it is ready.",
      whyThisDraft: "Why this direction",
      empathyPoint: "Empathy point",
      brandConnection: "Brand connection",
      riskReview: "Expression notes",
      trendEvidence: "Trend references",
      saveDraft: "Save Draft",
      regenerate: "Regenerate",
      moveCompleted: "Move to Completed",
      riskReason: "Reason",
      riskMeaning: "Meaning",
      completedTitle: "The workflow is complete",
      completedBody: "You can copy the article now or prepare a Notion upload.",
      completedTimeLabel: "Completed At",
      completedUploadLabel: "Upload Status",
      completedLanguageLabel: "Language",
      notionUpload: "Upload to Notion",
      copyAll: "Copy Full Article",
      uploadReady: "Ready to Upload",
      uploadDone: "Uploaded",
      uploadFailed: "Upload Failed",
      uploadUnavailable: "Notion Setup Needed",
      draftStatusDraft: "Draft Ready",
      draftStatusReview: "In Review",
      draftStatusEdited: "Editing",
      draftStatusSaved: "Saved",
      draftStatusCompleted: "Completed",
      copySuccess: "The full article was copied to your clipboard.",
      copyFailed: "Copy failed. Please try again.",
      uploadSuccess: "The article was uploaded to Notion.",
      uploadFailedBody: "There was a problem during Notion upload. Check the settings and try again.",
      notReadyForNotion: "Notion environment variables are not configured yet.",
      reviewSummaryLabel: "Review Summary",
      noSources: "No source links are available yet.",
      noCompliance: "No specific softening changes were returned, or the draft risk is already low.",
      noRationale: "Draft notes are not available yet.",
      openInNotion: "Open in Notion",
    },
    ja: {
      productName: "Peter's Lab Blog Writer",
      productDescription: "日本のペット市場トレンドをもとに、ブログ下書きから最終確認まで進める段階型ワークフローです。",
      language: "言語",
      connectionStatus: "接続状態",
      heroGuide: "トレンド探索から最終確認まで、1ステップずつ落ち着いて進められます。",
      homeEyebrow: "PetersLab Editorial Tool",
      topHintTrend: "まずは今使いやすいトレンドを選んでください。",
      topHintReview: "文書全体の流れと表現の強さを一緒に確認してください。",
      topHintCompleted: "最終原稿のコピーや Notion 連携準備をここで確認できます。",
      stepTrendTitle: "Trend Scan",
      stepTrendLoadingTitle: "Trend Loading",
      stepIdeaTitle: "Idea Discovery",
      stepWritingLoadingTitle: "Blog Writing",
      stepReviewTitle: "Review & Edit",
      stepCompletedTitle: "Completed",
      stepCurrent: "進行中",
      stepWaiting: "待機",
      stepDone: "完了",
      healthReady: "準備完了",
      healthMissing: "設定が必要",
      openAiMissing: "OpenAI API の設定が必要です。ローカルまたは配備先の環境変数を確認してください。",
      fetchErrorTitle: "データの読み込み中に問題が発生しました",
      fetchErrorBody: "少し時間を置いて再試行してください。ネットワークまたは API 設定も確認してください。",
      retry: "再試行",
      back: "戻る",
      backToTrend: "Trend Scan に戻る",
      backToIdea: "Idea Discovery に戻る",
      backToReview: "Review に戻る",
      newArticle: "新しい記事を作る",
      startTrendScan: "トレンドスキャンを開始",
      petType: "ペット種別",
      themeType: "テーマ",
      scope: "検索範囲",
      petCommon: "共通",
      petDog: "犬",
      petCat: "猫",
      themeHealth: "健康",
      themeLifestyle: "暮らし",
      themeSenior: "シニア",
      themeSeasonal: "季節",
      themeAnniversary: "記念日",
      themeHomecare: "ホームケア",
      scopeJapan: "日本中心",
      scopeGlobal: "グローバル参考を含む",
      trendIntroTitle: "どの流れから記事を始めますか？",
      trendIntroBody: "条件を選んでスキャンを開始すると、今の時期に合う候補を数件に絞って整理します。",
      trendLoadingLead: "検索、整理、ブランド接続ポイントの抽出を順番に進めています。",
      trendLoadingMsg1: "日本のペット市場シグナルを検索しています",
      trendLoadingMsg2: "季節性、記念日、健康イシューを整理しています",
      trendLoadingMsg3: "PetersLab と自然につながる切り口を探しています",
      trendLoadingMsg4: "すぐ選びやすいトレンドカードへまとめています",
      trendLoadingTitle: "トレンドを整理しています",
      trendLoadingBody: "現在のシグナルを読み込み、ブログ化しやすい候補だけに絞り込んでいます。",
      ideaIntroTitle: "記事の方向を固めてください",
      ideaIntroBody: "トレンド、キーワード、タイトルの方向を決めると下書き作成へ進みます。",
      trendResultsHeading: "おすすめトレンド",
      chooseTrendHint: "今回の記事に最も自然につながる起点を選んでください。",
      selectedTrendHeading: "選択したトレンド",
      keywordSuggestions: "おすすめキーワード",
      customKeyword: "キーワードを直接入力",
      addKeyword: "追加",
      refreshIdeas: "再提案",
      selectedKeyword: "選択キーワード",
      titleSuggestions: "タイトル案",
      selectedTitle: "最終タイトル",
      blogDirection: "記事の方向",
      directionEmpathy: "共感型",
      directionInformative: "情報型",
      directionSeasonal: "季節型",
      directionAnniversary: "記念日型",
      directionGuardian: "飼い主体験型",
      startWriting: "ブログ作成を開始",
      useThisTrend: "このトレンドで進む",
      pickTrendFirst: "先にトレンドを1つ選んでください。",
      ideaPreparing: "キーワードとタイトル案を準備しています。",
      ideaReady: "キーワードとタイトル案の準備ができました。",
      writingNeedSelections: "トレンド、キーワード、タイトルを先に決めてください。",
      writingLoadingLead: "ブランドトーンと表現リスクの両方を見ながら下書きを組み立てています。",
      writingLoadingMsg1: "選択したトレンドとキーワードを整理しています",
      writingLoadingMsg2: "PetersLab トーンに合わせて文章を整えています",
      writingLoadingMsg3: "共感しやすい構成を組み立てています",
      writingLoadingMsg4: "強く見えやすい表現を点検しています",
      writingLoadingMsg5: "最終確認用の下書きを準備しています",
      writingLoadingTitle: "ブログ下書きを作成しています",
      writingLoadingBody: "構成、ブランドトーン、表現の調整をまとめて反映し、確認しやすい下書きに整えています。",
      articleReady: "下書きの準備ができました。ここから全文を確認しながら編集できます。",
      summaryTrend: "選択したトレンド",
      summaryKeyword: "選択したキーワード",
      summaryLanguage: "使用言語",
      summaryStatus: "現在の状態",
      fieldTitle: "タイトル",
      fieldLead: "リード",
      fieldBody: "本文",
      fieldCta: "CTA",
      fieldMeta: "メタ説明",
      fieldKeywords: "画像キーワード",
      documentTitle: "最終文書を確認して編集してください",
      documentBody: "ここでは選択した言語だけを表示します。必要な箇所を直接調整した後、完了ステップへ進んでください。",
      whyThisDraft: "この方向で書いた理由",
      empathyPoint: "反映した共感ポイント",
      brandConnection: "PetersLab との接続点",
      riskReview: "表現調整メモ",
      trendEvidence: "トレンド参考リンク",
      saveDraft: "一時保存",
      regenerate: "再生成",
      moveCompleted: "Completed へ進む",
      riskReason: "理由",
      riskMeaning: "説明",
      completedTitle: "作業が完了しました",
      completedBody: "最終文書をコピーするか、Notion へのアップロード準備を進められます。",
      completedTimeLabel: "完了時刻",
      completedUploadLabel: "アップロード状態",
      completedLanguageLabel: "使用言語",
      notionUpload: "Notion にアップロード",
      copyAll: "全文をコピー",
      uploadReady: "アップロード可能",
      uploadDone: "アップロード完了",
      uploadFailed: "アップロード失敗",
      uploadUnavailable: "Notion 設定が必要",
      draftStatusDraft: "下書き完了",
      draftStatusReview: "確認中",
      draftStatusEdited: "編集中",
      draftStatusSaved: "一時保存済み",
      draftStatusCompleted: "完了",
      copySuccess: "全文をクリップボードへコピーしました。",
      copyFailed: "コピーに失敗しました。再試行してください。",
      uploadSuccess: "Notion へのアップロードが完了しました。",
      uploadFailedBody: "Notion アップロード中に問題が発生しました。設定とネットワークを確認してください。",
      notReadyForNotion: "Notion の環境変数がまだ設定されていません。",
      reviewSummaryLabel: "レビュー要約",
      noSources: "表示できる参考リンクがまだありません。",
      noCompliance: "自動で調整された表現がないか、すでにリスクが低い下書きです。",
      noRationale: "下書きメモはまだ準備されていません。",
      openInNotion: "Notion で開く",
    },
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
      banner: { key: "heroGuide", tone: "neutral" },
    };
  }

  function mergeState(saved) {
    const state = defaultState();
    return {
      ...state,
      ...(saved || {}),
      health: { ...state.health, ...(saved?.health || {}) },
      filters: { ...state.filters, ...(saved?.filters || {}) },
      selectedTitleMap: { ...state.selectedTitleMap, ...(saved?.selectedTitleMap || {}) },
      notion: { ...state.notion, ...(saved?.notion || {}) },
      banner: { ...state.banner, ...(saved?.banner || {}) },
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return mergeState(saved);
    } catch {
      return defaultState();
    }
  }

  function saveState(state) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState(language = "ko") {
    const next = defaultState();
    next.language = language;
    saveState(next);
    return next;
  }

  function t(state, key) {
    return translations[state.language]?.[key] || translations.en[key] || key;
  }

  function getText(value, lang) {
    if (!value) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    return value[lang] || value.ja || value.en || value.ko || "";
  }

  function languageLabel(lang, uiLang) {
    const labels = {
      ko: { ko: "한국어", en: "Korean", ja: "韓国語" },
      en: { ko: "영어", en: "English", ja: "英語" },
      ja: { ko: "일본어", en: "Japanese", ja: "日本語" },
    };
    return labels[lang]?.[uiLang] || lang.toUpperCase();
  }

  function draftStatusLabel(state) {
    const keyByStatus = {
      draft: "draftStatusDraft",
      review: "draftStatusReview",
      edited: "draftStatusEdited",
      saved: "draftStatusSaved",
      completed: "draftStatusCompleted",
    };
    return t(state, keyByStatus[state.draftStatus] || "draftStatusDraft");
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function postJSON(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data.error || t(loadState(), "fetchErrorBody"));
    }
    return data;
  }

  async function refreshHealth(state) {
    try {
      const response = await fetch("/api/health");
      const data = await safeJson(response);
      state.health = {
        openaiReady: Boolean(data.openaiReady),
        notionReady: Boolean(data.notionReady),
      };
    } catch {
      state.health = { openaiReady: false, notionReady: false };
    }
    saveState(state);
    return state.health;
  }

  function setBanner(state, key, tone = "neutral") {
    state.banner = { key, tone };
    saveState(state);
  }

  function phaseIndex(phase) {
    return PHASES.indexOf(phase);
  }

  function canNavigateTo(state, phase) {
    if (phase === "trend") return true;
    if (phase === "trendLoading") return Boolean(state.trendPayload?.trends?.length || phase === "trendLoading");
    if (phase === "idea") return Boolean(state.trendPayload?.trends?.length);
    if (phase === "writingLoading") return Boolean(state.selectedTrendIndex >= 0 && state.selectedKeyword && getText(state.selectedTitleMap, state.language));
    if (phase === "review") return Boolean(state.draftPayload?.safeVersion);
    if (phase === "completed") return Boolean(state.draftPayload?.safeVersion);
    return false;
  }

  function go(page) {
    window.location.href = page;
  }

  function goPhase(phase) {
    go(PAGE_BY_PHASE[phase]);
  }

  function bindBrandHome(state) {
    document.querySelectorAll("[data-brand-home]").forEach((node) => {
      node.onclick = (event) => {
        event.preventDefault();
        resetState(state.language);
        goPhase("trend");
      };
    });
  }

  function renderStatusChips(state) {
    const openai = document.getElementById("openai-status");
    const notion = document.getElementById("notion-status");

    if (openai) {
      openai.className = `status-chip ${state.health.openaiReady ? "ready" : "error"}`;
      openai.textContent = `OpenAI · ${state.health.openaiReady ? t(state, "healthReady") : t(state, "healthMissing")}`;
    }
    if (notion) {
      notion.className = `status-chip ${state.health.notionReady ? "ready" : "neutral"}`;
      notion.textContent = `Notion · ${state.health.notionReady ? t(state, "healthReady") : t(state, "uploadUnavailable")}`;
    }
  }

  function renderBanner(state) {
    const banner = document.getElementById("status-banner");
    if (!banner) return;
    banner.textContent = t(state, state.banner.key);
    banner.classList.remove("is-success", "is-error");
    if (state.banner.tone === "success") {
      banner.classList.add("is-success");
    } else if (state.banner.tone === "error") {
      banner.classList.add("is-error");
    }
  }

  function renderTopHint(state, phase) {
    const node = document.getElementById("top-hint");
    if (!node) return;
    const key =
      phase === "review" ? "topHintReview" :
      phase === "completed" ? "topHintCompleted" :
      "topHintTrend";
    node.textContent = t(state, key);
  }

  function applyTranslations(state) {
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(state, node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", t(state, node.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-option]").forEach((node) => {
      node.textContent = t(state, node.dataset.i18nOption);
    });
  }

  function renderLangSwitcher(state, currentPhase) {
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.langSwitch === state.language);
      button.onclick = () => {
        state.language = button.dataset.langSwitch;
        saveState(state);
        renderFrame(state, currentPhase);
        window.dispatchEvent(new CustomEvent("plbw-language-change"));
      };
    });
  }

  function renderStepNav(state, currentPhase) {
    const currentIndex = phaseIndex(currentPhase);
    document.querySelectorAll("[data-phase-nav]").forEach((button) => {
      const phase = button.dataset.phaseNav;
      const idx = phaseIndex(phase);
      const isCurrent = phase === currentPhase;
      const isComplete = idx < currentIndex;
      const isAvailable = canNavigateTo(state, phase);

      button.classList.toggle("is-current", isCurrent);
      button.classList.toggle("is-complete", isComplete);
      button.disabled = !isAvailable && !isCurrent;

      const stateNode = button.querySelector("[data-step-state]");
      if (stateNode) {
        stateNode.textContent = isComplete ? t(state, "stepDone") : isCurrent ? t(state, "stepCurrent") : t(state, "stepWaiting");
      }

      button.onclick = () => {
        if (!button.disabled) {
          goPhase(phase);
        }
      };
    });
  }

  function renderFrame(state, currentPhase) {
    applyTranslations(state);
    bindBrandHome(state);
    renderLangSwitcher(state, currentPhase);
    renderStatusChips(state);
    renderBanner(state);
    renderTopHint(state, currentPhase);
    renderStepNav(state, currentPhase);
  }

  function textOrFallback(value, lang, fallback = "-") {
    const result = getText(value, lang);
    return result || fallback;
  }

  function setErrorMessage(container, title, body) {
    if (!container) return;
    container.classList.remove("is-hidden");
    const titleNode = container.querySelector("[data-error-title]");
    const bodyNode = container.querySelector("[data-error-body]");
    if (titleNode) titleNode.textContent = title;
    if (bodyNode) bodyNode.textContent = body;
  }

  return {
    PHASES,
    PAGE_BY_PHASE,
    loadState,
    saveState,
    resetState,
    t,
    getText,
    textOrFallback,
    languageLabel,
    draftStatusLabel,
    postJSON,
    refreshHealth,
    setBanner,
    renderFrame,
    go,
    goPhase,
    setErrorMessage,
  };
})();

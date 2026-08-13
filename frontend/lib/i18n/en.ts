export const en = {
  nav: {
    reports: "Reports",
    profile: "Profile",
    compare: "Compare",
    maps: "Maps",
    players: "Players",
    language: "PT",
    languageAria: "Switch to Portuguese",
  },
  common: {
    loading: "Loading…",
    error: "Error",
    noResults: "No players found.",
    apply: "Apply filters",
    applying: "Applying…",
    all: "All",
    backendUnavailable: "Backend unavailable",
    backendConnectError:
      "Could not connect to the backend. Check that FastAPI is running (port 8000).",
    player: "Player",
    playerA: "Player A",
    playerB: "Player B",
    league: "League",
    minutes: "Minutes",
    age: "Age",
    height: "Height",
    nationality: "Nationality",
    foot: "Foot",
    value: "Value",
    contract: "Contract",
    topQuartile: "Top quartile",
  },
  home: {
    eyebrow: "European pass analytics",
    lead:
      "Pass analysis by position across Europe's top five leagues — xP M4, progression ratings and comparative profiles within each pool.",
    players: "players",
    leagues: "leagues",
    model: "model",
    modulesAria: "Pass Scout modules",
    footnote: "Premier League, Serie A, La Liga, Bundesliga and Ligue 1.",
    modules: {
      reports: {
        title: "Reports",
        description:
          "PDF-ready reports for 45 midfielders — xP grades, pass scores and maps by age group.",
      },
      profile: {
        title: "Profile",
        description: "Full player profile — pass radar, xP indices and origin heatmaps.",
      },
      compare: {
        title: "Compare",
        description: "Compare two players side by side within the same position pool.",
      },
      maps: {
        title: "Maps",
        description: "Pass maps and metric scatter — progressive, impact, line break and more.",
      },
      players: {
        title: "Players",
        description: "Full pool list with ratings, filters and metric sorting.",
      },
    },
  },
  players: {
    title: "Players",
    subtitle:
      "Players from Europe's top five leagues with pass ratings and pillars by position pool.",
    loadingFilters: "Loading filters…",
    volume: "Volume",
    efficiency: "Efficiency",
    buildup: "Build-up",
    chanceCreation: "Chance creation",
    defense: "Defense",
    passRating: "Pass Rating",
    searchPlaceholder: "Search player…",
    allLeagues: "All leagues",
    allPositions: "All positions",
    filter: "Filter",
    filtering: "Filtering…",
    clear: "Clear",
    playersFound: (n: number) =>
      `${n} player${n !== 1 ? "s" : ""} found`,
    loadError: "Failed to load players",
    reportsPromo: "PDF-ready reports — U23 Breakout, Blue Collar 24–30 and Experience 30+",
    viewReports: "View reports",
  },
  profile: {
    title: "Player Profile",
    description:
      "Full position analysis — xP, pass scores, indices and origin heatmaps. Rankings within the selected pool.",
    loading: "Loading player profile…",
    loadingPool: "Loading player pool…",
    loadingProfile: "Loading profile…",
    passOriginAlt: "Pass origin heatmap",
    xpProfile: "xP Profile",
    passScores: "Pass Scores",
    compare: "Compare",
    viewMaps: "View maps",
    fullProfile: "Full profile",
    filters: "Filters",
    profileSection: "Profile",
    selectCountries: "Select countries",
    countriesSelected: (n: number) => `${n} selected`,
    selectPlayer: "Player",
    gradesByRound: "Grades by round",
    gradesByRoundAria: "Grades by round",
    searchPlayer: "Search player",
    searchPlaceholder: "Player name…",
    searchAria: "Search",
    noPlayersWithFilters: "No players found with these filters.",
    backendRetryHint:
      "The backend may take a few minutes on first load — try again in a moment.",
    filterTitle: "Pool filters",
    filterSubtitle:
      "Refine position, league, age, value, contract, minutes, height, pass scores and nationality. Metrics and grades are always compared within the selected position pool.",
    clearFilters: "Clear filters",
    subgroup: "Subgroup",
    dominantFoot: "Dominant foot",
    ageBand: "Age band",
    marketPhysical: "Market & physical",
    valueEm: (min: number, max: number) => `Value (€M) ${min}–${max}`,
    contractYears: (min: number, max: number) => `Contract ${min}–${max}`,
    minutesRange: (min: number, max: number) => `Minutes ${min}–${max}`,
    heightM: (min: string, max: string) => `Height (m) ${min}–${max}`,
    passScoresMin: "Pass scores (minimum grade ≥)",
    nationality: "Nationality",
    regionAndCountries: "Region and countries",
  },
  compare: {
    title: "Compare",
    description:
      "Compare two midfielders from the European pool. Metrics and grades are relative to position peers.",
    loading: "Loading comparison…",
    playerLabel: (side: "A" | "B") => `Player ${side}`,
    searchPlaceholder: "Type player name…",
    backToProfile: "Back to profile",
    compareMaps: "Compare maps",
    mapLoadFailed: "Failed to load map",
    xpPillars: "xP Pillars",
    passProfile: "Pass Profile",
    metric: "Metric",
    radarAria: "Pass profile radar comparison",
  },
  reports: {
    eyebrow: "Scouting intelligence",
    title: "Midfielder Reports",
    lead:
      "Curated profiles across 3 age bands — xP overview, pass scores, consistency and pass maps. PDF export by group.",
    reportsCount: "reports",
    groups: "groups",
    exportable: "exportable",
    selectedGroup: "Selected group",
    athletes: (n: number) => `${n} athletes`,
    exportGroup: "Export group",
    loadingBatch: "Loading reports in batches…",
    loadingFirst: "Loading first reports…",
    loadingPlayer: (id: string) => `Loading ${id}…`,
    preparingMaps: "Preparing maps…",
    loadingMaps: (loaded: number, total: number) => `Loading maps… (${loaded}/${total})`,
    mapLoadFailed: "Failed to load map",
    mapLoadFailedMaps: "Failed to load maps",
    loadFailed: (id: string) => `Failed to load player ${id}`,
    hintLoading: "Loading reports in batches…",
    hintReady: (ok: number, visible: number) =>
      `${ok} ready · ${visible} in group · maps load on PDF export`,
    footnote: (n: number) => `${n} athletes · midfielders pool · 5 European leagues`,
    generatingMaps: "Generating player maps…",
    unavailable: "Unavailable",
    backToProfile: "Back to profile",
    viewMaps: "View maps",
    exportPdfTitle: (name: string) => `Export PDF for ${name}`,
    overview: "Overview",
    mapsPage: "Maps",
    yearsOld: (age: number) => `${age} yrs`,
    minutesPct: (pct: number) => `${pct}% of possible minutes`,
    min: "Min",
    sheetEyebrow: "Pass Scout · Midfielder Report",
    mapsEyebrow: "Pass Maps",
    pageFootnote: (name: string, subtitle: string) => `${name} · ${subtitle}`,
  },
  reportCategories: {
    "u23-breakout": {
      title: "U23 — Breakout Promises",
      subtitle: "Emerging profiles under 23",
      description:
        "Young midfielders with standout pass profiles and room to scale impact in top-five leagues.",
    },
    "blue-collar-24-30": {
      title: "24–30 — Blue Collar Prospects",
      subtitle: "Prime-age engine room",
      description: "Reliable progression and pass-value profiles in the peak development window.",
    },
    "experience-30-plus": {
      title: "30+ — Standout Experience",
      subtitle: "Veteran control & leadership",
      description: "Experienced midfield profiles with elite game management and passing authority.",
    },
    groups: {
      "Top 10": "Top 10",
      "Extended watchlist": "Extended watchlist",
    },
  },
  maps: {
    title: "Maps",
    subtitle: "Pass scatter and pass maps — midfielders.",
    passMapAlt: "Pass map",
    destMapAlt: "Destination heatmap",
    commonMapAlt: "Common passes",
    rareMapAlt: "Rare passes",
    scatter: "Scatter",
    passMap: "Pass map",
    axisX: (label: string) => `${label} (X)`,
    axisY: (label: string) => `${label} (Y)`,
    loading: "Generating maps…",
    aggregatedView: "Aggregated view · top 250 by volume",
  },
  passGrade: {
    title: "Overall Pass Grade",
    unavailable: "Grade unavailable",
    tooltip:
      "Overall pass grade from the xP model — composite of volume, efficiency, build-up and chance creation within the position pool.",
    tiers: {
      elite: "Elite",
      veryGood: "Very good",
      good: "Good",
      average: "Average",
      belowAverage: "Below average",
    },
  },
  passLength: {
    title: "Pass Length Mix",
    short: "Short",
    long: "Long",
    shortPct: (pct: string) => `${pct}% short`,
    longPct: (pct: string) => `${pct}% long`,
    leagueRef: (pct: number) => `League reference: ${pct}% long`,
    playerRef: (pct: string) => `Player: ${pct}% long`,
    tooltip:
      "Share of passes ≥ 30 m among all attempts. Reference line marks the league midpoint (~11.4% long).",
  },
  filterOptions: {
    allLeagues: "All leagues",
    foot: {
      all: "All",
      left: "Left",
      right: "Right",
      both: "Both",
    },
    ageBands: {
      all: "All ages",
      u21: "U21",
      u23: "U23",
      "24_30": "24-30",
      over30: ">30",
    },
    letterGrades: {
      all: "All",
    },
    positionFamilies: {
      midfielders: "Midfielders",
    },
    positionBlocks: {
      all: "All midfielders",
      cm: "Central midfielders",
      am: "Attacking midfielders",
    },
  },
  gameStats: {
    game: (round: number) => `Match ${round}`,
    match: "Match",
    close: "Close",
    passes: "Passes",
    shortEff: "% eff short pass",
    longEff: "% eff long pass",
  },
  stratumStar: {
    title: "Top 25% COE within volume quartile",
    aria: "Top quartile",
  },
  passScore: {
    volume: "Volume",
    efficiency: "Efficiency",
    buildup: "Build-up",
    chanceCreation: "Chance creation",
    impact: "Impact",
    defensiveContribution: "Defensive Contribution",
    tooltips: {
      volume: "Within-position composite of passes and long passes per game.",
      efficiency:
        "Within-position composite of COE (completion over expected) on short passes and long passes.",
      buildup:
        "Within-position composite of progressive passes, final-third entries and line-breaking passes per game.",
      chanceCreation:
        "Within-position composite of key passes, passes into the box, and impact passes originating in the final third per game.",
      impact:
        "Within-position composite of Test Impact v2 volume, attempt-pool completion and attempt-pool COE.",
      defensiveContribution:
        "League-scoped defensive score: 60% volume z-score (won tackles, interceptions, aerial duels won, clearances per 90) + 40% quality z-score (tackle and aerial win %), with a minutes confidence factor.",
    },
    components: {
      passes_total: "Passes / game",
      long_balls: "Long passes / game",
      xpass_coe_pct: "%Efficiency - Short Pass",
      xpass_long_coe_pct: "%Efficiency - Long Pass",
      progressive_passes: "Progressive passes / game",
      final_third_passes: "Passes into final third / game",
      key_passes: "Key passes / game",
      passes_to_box: "Passes into box / game",
      test_impact_v2_start_final_third_p90: "Impact Passes / game",
      xpv_threat_p90: "xPV Threat",
      special_line_break_p90: "Line breaking passes / game",
      def_actions_successful_p90: "Defensive Actions Successful",
      def_tackle_won_pct: "Tackle won %",
      def_aerial_won_pct: "Aerial won %",
    },
    componentTips: {
      passes_total: "Passes attempted per 90 minutes.",
      long_balls: "Long passes (≥30 m) per 90 minutes.",
      xpass_coe_pct: "Completion over expected on short passes (< 30 m), in percentage points.",
      xpass_total_coe_pct: "Completion over expected on all pass attempts, in percentage points.",
      xpass_long_coe_pct: "Completion over expected on long passes (percentage points).",
      progressive_passes:
        "Progressive passes completed per game — advance ≥ 10 m toward goal, or ≥ 5 m inside the final third.",
      final_third_passes: "Passes completed into the final third (x ≥ 80 m) per game.",
      key_passes: "Passes leading to a shot per 90 minutes.",
      passes_to_box: "Passes completed into the box per 90 minutes.",
      test_impact_v2_start_final_third_p90: "Impact passes per game originating in the final third (x_start ≥ 72 m).",
      xpv_threat_p90:
        "Total xPV per game from key passes, passes into the box, and impact passes originating in the final third.",
      special_line_break_p90: "Line-breaking passes per game — lateral exit bands, forward angle ≤ 50°.",
      def_actions_successful_p90:
        "Successful defensive actions per 90 — won tackles, interceptions, clearances, recoveries and aerial duels won.",
      def_tackle_won_pct: "Share of tackles won (minimum 10 attempts).",
      def_aerial_won_pct: "Share of aerial duels won (minimum 10 attempts).",
      threat_pass_pct: "Share of all passes classified as impact passes.",
      xpv_per_pass: "Average destination value (xPV) on completed passes.",
    },
  },
  xpProfile: {
    productivity: "Productivity",
    precision: "Precision",
    lethality: "Lethality",
    productivityTip: (xpvPerGame: string) => `xPV/Game: ${xpvPerGame}`,
    precisionTip:
      "75% xPass residual per 90 minutes and 25% COE stratum (short + total passes) vs. peers in the same pass-volume quartile.",
    lethalityTip:
      "Mean z-score of xPV per completed pass, Pass Impact v2 per game, and impact-pass rate (33/33/33) within the position group.",
    indices: "xP Indices",
    consistency: "Consistency",
    impact: "Impact",
    defense: "Defensive Contribution",
    indexTips: {
      consistency:
        "Each match gets a 3–9 grade from game xP vs. all peer matches in the position. Badge when dispersion of those grades is low (MAD).",
      impact:
        "50% xPV per completed pass and 50% impact-pass rate — destination value plus the share of all passes classified as impact passes.",
      defense:
        "League-scoped defensive score: 60% volume z-score (won tackles, interceptions, aerial duels won, clearances per 90) + 40% quality z-score (tackle and aerial win %).",
    },
    impactComponents: {
      xpvPerPass: "xPV/Pass",
      impactRate: "Impact Rate",
    },
    tiers: {
      elite: "Elite",
      above: "Above average",
      mid: "Average",
      below: "Below average",
    },
  },
  roundGrade: {
    grade: "Grade",
    breakline: "Breakline passes",
    impactPasses: "Impact passes",
    keyPasses: "Key passes",
    title: "Grades by round",
    aria: "Grades by round",
  },
  poolFilters: {
    title: "Filters",
    subtitle: "Refine the player pool and select a player.",
    searchPlaceholder: "Search player…",
    filter: "Filter",
  },
  mapFilters: {
    progressive: "Progressive Passes",
    impactPasses: "Impact Passes",
    longPasses: "Long Passes",
    lineBreak: "Break line passes",
    keyPasses: "Key Passes",
    breakline: "Breakline passes",
  },
} as const;

export type Locale = "en" | "pt";

type DeepString<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T[K] extends object
      ? DeepString<T[K]>
      : string;
};

export type TranslationDict = DeepString<typeof en>;

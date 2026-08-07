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
  },
  profile: {
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
  },
  compare: {
    loading: "Loading comparison…",
  },
  reports: {
    loadingBatch: "Loading reports in batches…",
    loadingFirst: "Loading first reports…",
    loadingPlayer: (id: string) => `Loading ${id}…`,
    preparingMaps: "Preparing maps…",
    exportGroup: "Export group",
    loadingMaps: (loaded: number, total: number) => `Loading maps… (${loaded}/${total})`,
    mapLoadFailed: "Failed to load map",
    mapLoadFailedMaps: "Failed to load maps",
  },
  maps: {
    passMapAlt: "Pass map",
    destMapAlt: "Destination heatmap",
    commonMapAlt: "Common passes",
    rareMapAlt: "Rare passes",
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

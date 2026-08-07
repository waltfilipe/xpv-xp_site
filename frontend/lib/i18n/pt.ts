import type { TranslationDict } from "./en";

export const pt: TranslationDict = {
  nav: {
    reports: "Relatórios",
    profile: "Perfil",
    compare: "Comparar",
    maps: "Mapas",
    players: "Jogadores",
    language: "EN",
    languageAria: "Mudar para inglês",
  },
  common: {
    loading: "Carregando…",
    error: "Erro",
    noResults: "Nenhum jogador encontrado.",
    apply: "Aplicar filtros",
    applying: "Aplicando…",
    all: "Todos",
    backendUnavailable: "Backend indisponível",
    backendConnectError:
      "Não foi possível conectar ao backend. Verifique se o FastAPI está rodando (porta 8000).",
    player: "Jogador",
    playerA: "Jogador A",
    playerB: "Jogador B",
    league: "Liga",
    minutes: "Minutos",
    age: "Idade",
    height: "Altura",
    nationality: "Nacionalidade",
    foot: "Pé",
    value: "Valor",
    contract: "Contrato",
    topQuartile: "Top do quartil",
  },
  home: {
    eyebrow: "Análise de passes europeus",
    lead:
      "Análise de passes por posição nas 5 grandes ligas europeias — xP M4, ratings de progressão e perfis comparativos dentro de cada pool.",
    players: "jogadores",
    leagues: "ligas",
    model: "modelo",
    modulesAria: "Módulos do Pass Scout",
    footnote: "Premier League, Serie A, La Liga, Bundesliga e Ligue 1.",
    modules: {
      reports: {
        title: "Relatórios",
        description:
          "Relatórios PDF-ready de 45 meias — grades xP, pass scores e mapas por categoria etária.",
      },
      profile: {
        title: "Perfil",
        description: "Perfil completo do jogador — radar de passes, índices xP e heatmaps de origem.",
      },
      compare: {
        title: "Comparar",
        description: "Compare dois jogadores lado a lado dentro do mesmo pool de posição.",
      },
      maps: {
        title: "Mapas",
        description: "Mapas de passes e scatter de métricas — progressive, impact, line break e mais.",
      },
      players: {
        title: "Jogadores",
        description: "Lista completa do pool com ratings, filtros e ordenação por métrica.",
      },
    },
  },
  players: {
    title: "Jogadores",
    subtitle:
      "Jogadores das 5 grandes ligas europeias com ratings de passe e pilares por pool de posição.",
    loadingFilters: "Carregando filtros…",
    volume: "Volume",
    efficiency: "Eficiência",
    buildup: "Construção",
    chanceCreation: "Criação de chance",
    defense: "Defesa",
  },
  profile: {
    loading: "Carregando perfil do jogador…",
    loadingPool: "Carregando pool de jogadores…",
    loadingProfile: "Carregando perfil…",
    passOriginAlt: "Origem dos passes",
    xpProfile: "Perfil xP",
    passScores: "Pass Scores",
    compare: "Comparar",
    viewMaps: "Ver mapas",
    fullProfile: "Perfil completo",
    filters: "Filtros",
    profileSection: "Perfil",
    selectCountries: "Selecionar países",
    countriesSelected: (n: number) => `${n} selecionada${n > 1 ? "s" : ""}`,
    selectPlayer: "Jogador",
    gradesByRound: "Grades por rodada",
    gradesByRoundAria: "Grades por rodada",
  },
  compare: {
    loading: "Carregando comparação…",
  },
  reports: {
    loadingBatch: "Carregando relatórios em lotes…",
    loadingFirst: "Carregando primeiros relatórios…",
    loadingPlayer: (id: string) => `Carregando ${id}…`,
    preparingMaps: "Preparando mapas…",
    exportGroup: "Exportar grupo",
    loadingMaps: (loaded: number, total: number) => `Carregando mapas… (${loaded}/${total})`,
    mapLoadFailed: "Falha ao carregar mapa",
    mapLoadFailedMaps: "Falha ao carregar mapas",
  },
  maps: {
    passMapAlt: "Mapa de passes",
    destMapAlt: "Heatmap de destino",
    commonMapAlt: "Passes comuns",
    rareMapAlt: "Passes raros",
  },
  passScore: {
    volume: "Volume",
    efficiency: "Eficiência",
    buildup: "Construção",
    chanceCreation: "Criação de chance",
    impact: "Impacto",
    defensiveContribution: "Contribuição defensiva",
    tooltips: {
      volume: "Composto por posição de passes e bolas longas por jogo.",
      efficiency:
        "Composto por posição de COE (conclusão acima do esperado) em passes curtos e longos.",
      buildup:
        "Composto por posição de passes progressivos, entradas no terço final e line breaks por jogo.",
      chanceCreation:
        "Composto por posição de key passes, passes para a área e impact passes no terço final por jogo.",
      impact:
        "Composto por posição de volume Test Impact v2, conclusão no pool de tentativas e COE no pool.",
      defensiveContribution:
        "Score defensivo por liga: 60% volume z (desarmes, interceptações, duelos aéreos, clearances /90) + 40% qualidade z (tackle e aerial win %), com fator de confiança por minutos.",
    },
    components: {
      passes_total: "Passes / jogo",
      long_balls: "Bolas longas / jogo",
      xpass_coe_pct: "%Eficiência - Passe curto",
      xpass_long_coe_pct: "%Eficiência - Passe longo",
      progressive_passes: "Passes progressivos / jogo",
      final_third_passes: "Passes no terço final / jogo",
      key_passes: "Key passes / jogo",
      passes_to_box: "Passes na área / jogo",
      test_impact_v2_start_final_third_p90: "Impact Passes / jogo",
      xpv_threat_p90: "xPV Threat",
      special_line_break_p90: "Line breaking passes / jogo",
      def_actions_successful_p90: "Ações defensivas bem-sucedidas",
      def_tackle_won_pct: "Tackle won %",
      def_aerial_won_pct: "Aerial won %",
    },
    componentTips: {
      passes_total: "Passes tentados por 90 minutos.",
      long_balls: "Passes longos (≥30 m) por 90 minutos.",
      xpass_coe_pct: "Conclusão acima do esperado em passes curtos (< 30 m), em pontos percentuais.",
      xpass_total_coe_pct: "Conclusão acima do esperado em todas as tentativas, em pontos percentuais.",
      xpass_long_coe_pct: "Conclusão acima do esperado em passes longos (pontos percentuais).",
      progressive_passes:
        "Passes progressivos completados por jogo — avanço ≥ 10 m em direção ao gol, ou ≥ 5 m no terço final.",
      final_third_passes: "Passes completados no terço final (x ≥ 80 m) por jogo.",
      key_passes: "Passes que levam a finalização por 90 minutos.",
      passes_to_box: "Passes completados na área por 90 minutos.",
      test_impact_v2_start_final_third_p90: "Impact passes por jogo com origem no terço final (x_start ≥ 72 m).",
      xpv_threat_p90:
        "xPV total por jogo gerado por key passes, passes na área e impact passes no terço final.",
      special_line_break_p90: "Line-breaking passes por jogo — faixas laterais de saída, ângulo ≤ 50°.",
      def_actions_successful_p90:
        "Ações defensivas bem-sucedidas por 90 — desarmes, interceptações, clearances, recoveries e duelos aéreos ganhos.",
      def_tackle_won_pct: "Proporção de desarmes ganhos (mínimo 10 tentativas).",
      def_aerial_won_pct: "Proporção de duelos aéreos ganhos (mínimo 10 tentativas).",
      threat_pass_pct: "Proporção de todos os passes classificados como impact passes.",
      xpv_per_pass: "Valor médio de destino (xPV) em passes completados.",
    },
  },
  xpProfile: {
    productivity: "Produtividade",
    precision: "Precisão",
    lethality: "Letalidade",
    productivityTip: (xpvPerGame: string) => `xPV/Jogo: ${xpvPerGame}`,
    precisionTip:
      "75% residual xPass por 90 minutos e 25% estrato COE (passes curtos + total) vs. pares no mesmo quartil de volume.",
    lethalityTip:
      "Média z de xPV por passe completado, Pass Impact v2 por jogo e taxa de impact passes (33/33/33) no grupo de posição.",
    indices: "Índices xP",
    consistency: "Consistência",
    impact: "Impacto",
    defense: "Contribuição defensiva",
    indexTips: {
      consistency:
        "Cada jogo recebe nota 3–9 pelo xP vs. todos os jogos dos pares na posição. Badge quando a dispersão é baixa (MAD).",
      impact:
        "50% xPV por passe completado e 50% taxa de impact passes — valor de destino mais proporção de impact passes.",
      defense:
        "Score defensivo por liga: 60% volume z (desarmes, interceptações, duelos aéreos, clearances /90) + 40% qualidade z (tackle e aerial win %).",
    },
    impactComponents: {
      xpvPerPass: "xPV/Pass",
      impactRate: "Impact Rate",
    },
    tiers: {
      elite: "Elite",
      above: "Acima da média",
      mid: "Média",
      below: "Abaixo da média",
    },
  },
  roundGrade: {
    grade: "Grade",
    breakline: "Breakline passes",
    impactPasses: "Impact passes",
    keyPasses: "Key passes",
  },
  mapFilters: {
    progressive: "Passes progressivos",
    impactPasses: "Impact Passes",
    longPasses: "Passes longos",
    lineBreak: "Break line passes",
    keyPasses: "Key Passes",
    breakline: "Breakline passes",
  },
};

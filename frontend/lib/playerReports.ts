export type ReportPlayerRef = {
  playerId: string;
  positionFamily?: string;
  note?: string;
};

export type ReportPlayerGroup = {
  label?: string;
  players: ReportPlayerRef[];
};

export type PlayerReportCategory = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  groups: ReportPlayerGroup[];
};

const mid = "midfielders" as const;

function p(playerId: string, note?: string): ReportPlayerRef {
  return { playerId, positionFamily: mid, note };
}

export const PLAYER_REPORT_CATEGORIES: PlayerReportCategory[] = [
  {
    id: "u23-breakout",
    title: "U23 — Breakout Promises",
    subtitle: "Emerging profiles under 23",
    description: "Young midfielders with standout pass profiles and room to scale impact in top-five leagues.",
    accent: "#a78bfa",
    groups: [
      {
        players: [
          p("1493305"),
          p("1086286"),
          p("1120669"),
          p("994546", "*"),
          p("1127057"),
          p("979118"),
          p("1142562"),
          p("1398526"),
          p("1389846"),
          p("1151803"),
        ],
      },
      {
        label: "Extended watchlist",
        players: [
          p("1109771"),
          p("1126569"),
          p("1138804"),
          p("1112327"),
          p("1012657"),
        ],
      },
    ],
  },
  {
    id: "blue-collar-24-30",
    title: "24–30 — Blue Collar Prospects",
    subtitle: "Prime-age engine room",
    description: "Reliable progression and pass-value profiles in the peak development window.",
    accent: "#38bdf8",
    groups: [
      {
        label: "Top 10",
        players: [
          p("796047"),
          p("901882"),
          p("352802"),
          p("822600"),
          p("149593"),
          p("866469"),
          p("901850"),
          p("816763"),
          p("286167"),
          p("826171"),
        ],
      },
      {
        label: "Extended watchlist",
        players: [
          p("911848"),
          p("327755"),
          p("814882"),
          p("991421"),
          p("927361"),
        ],
      },
    ],
  },
  {
    id: "experience-30-plus",
    title: "30+ — Standout Experience",
    subtitle: "Veteran control & leadership",
    description: "Experienced midfield profiles with elite game management and passing authority.",
    accent: "#fbbf24",
    groups: [
      {
        label: "Top 10",
        players: [
          p("581314"),
          p("100389"),
          p("296434"),
          p("190883"),
          p("117777"),
          p("48480"),
          p("149370"),
          p("44241"),
          p("147289"),
          p("913679"),
        ],
      },
      {
        label: "Extended watchlist",
        players: [
          p("96365"),
          p("51665"),
          p("1035996"),
          p("368120"),
          p("106337"),
        ],
      },
    ],
  },
];

export function allReportPlayerRefs(): ReportPlayerRef[] {
  const seen = new Set<string>();
  const out: ReportPlayerRef[] = [];
  for (const category of PLAYER_REPORT_CATEGORIES) {
    for (const group of category.groups) {
      for (const player of group.players) {
        if (seen.has(player.playerId)) continue;
        seen.add(player.playerId);
        out.push(player);
      }
    }
  }
  return out;
}

export function totalReportCount(): number {
  return allReportPlayerRefs().length;
}

export type EnrichedReportPlayer = ReportPlayerRef & {
  category: PlayerReportCategory;
  groupLabel?: string;
};

export function enrichedReportPlayers(): EnrichedReportPlayer[] {
  const out: EnrichedReportPlayer[] = [];
  for (const category of PLAYER_REPORT_CATEGORIES) {
    for (const group of category.groups) {
      for (const player of group.players) {
        out.push({
          ...player,
          category,
          groupLabel: group.label,
        });
      }
    }
  }
  return out;
}

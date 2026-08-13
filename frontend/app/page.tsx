import { getMeta } from "@/lib/api";
import { HomePageContent } from "@/components/HomePageContent";

export default async function HomePage() {
  let meta = { player_count: 0, description: "", leagues: [] as string[] };
  try {
    meta = await getMeta();
  } catch {
    /* backend offline */
  }

  return (
    <HomePageContent
      playerCount={meta.player_count}
      leagueCount={meta.leagues.length}
      description={meta.description || undefined}
    />
  );
}

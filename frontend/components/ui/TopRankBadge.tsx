type Props = { rank?: number | null };

const GOLD = 10;
const SILVER = 20;
const BRONZE = 30;

export function TopRankBadge({ rank }: Props) {
  if (rank == null || rank <= 0) return null;

  if (rank <= GOLD) {
    return (
      <span className="pa-top-badge pa-top-badge-gold" title="Top 10" aria-label="Top 10">
        <i className="fa-solid fa-medal" aria-hidden="true" />
      </span>
    );
  }
  if (rank <= SILVER) {
    return (
      <span className="pa-top-badge pa-top-badge-silver" title="Top 20" aria-label="Top 20">
        <i className="fa-solid fa-medal" aria-hidden="true" />
      </span>
    );
  }
  if (rank <= BRONZE) {
    return (
      <span className="pa-top-badge pa-top-badge-bronze" title="Top 30" aria-label="Top 30">
        <i className="fa-solid fa-medal" aria-hidden="true" />
      </span>
    );
  }
  return null;
}

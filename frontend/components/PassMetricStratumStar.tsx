type Props = {
  show?: boolean;
};

export function PassMetricStratumStar({ show }: Props) {
  if (!show) return null;
  return (
    <i
      className="pass-metric-stratum-star fa-solid fa-star"
      title="Top 25% de COE dentro do quartil de volume"
      aria-label="Top do quartil"
    />
  );
}

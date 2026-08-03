"use client";

type Props = {
  min: number;
  max: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  step?: number;
};

export function RangeDual({ min, max, values, onChange, step = 1 }: Props) {
  const [lo, hi] = values;
  const span = Math.max(1, max - min);
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  return (
    <div className="range-dual">
      <div className="range-dual-rail" aria-hidden="true">
        <div
          className="range-dual-fill"
          style={{ left: `${loPct}%`, width: `${hiPct - loPct}%` }}
        />
      </div>
      <input
        type="range"
        className="range-dual-input range-dual-input-lo"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange([Math.min(v, hi), hi]);
        }}
        aria-label="Minimum"
      />
      <input
        type="range"
        className="range-dual-input range-dual-input-hi"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange([lo, Math.max(v, lo)]);
        }}
        aria-label="Maximum"
      />
    </div>
  );
}

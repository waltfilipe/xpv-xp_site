"use client";

import type { XpRoundGrade } from "@/lib/api";

type Props = {
  game: XpRoundGrade | null;
  onClose: () => void;
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function GameStatsModal({ game, onClose }: Props) {
  if (!game) return null;

  return (
    <div className="game-stats-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="game-stats-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-stats-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="game-stats-modal-head">
          <div>
            <p className="game-stats-modal-eyebrow">Jogo {game.round}</p>
            <h3 id="game-stats-title" className="game-stats-modal-title">
              {game.opponent ? `vs ${game.opponent}` : "Partida"}
            </h3>
            <p className="game-stats-modal-date muted">{formatDate(game.date)}</p>
          </div>
          <button type="button" className="game-stats-modal-close" onClick={onClose} aria-label="Fechar">
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <div className="game-stats-modal-grid">
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">Grade</span>
            <strong className="tabular">{game.grade != null ? game.grade.toFixed(1) : "—"}</strong>
          </div>
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">Passes</span>
            <strong className="tabular">{game.passes ?? "—"}</strong>
          </div>
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">% eff pass curto</span>
            <strong className="tabular">
              {game.short_pass_eff_pct != null
                ? `${game.short_pass_eff_pct > 0 ? "+" : ""}${game.short_pass_eff_pct.toFixed(1)}%`
                : "—"}
            </strong>
          </div>
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">% eff pass longo</span>
            <strong className="tabular">
              {game.long_pass_eff_pct != null
                ? `${game.long_pass_eff_pct > 0 ? "+" : ""}${game.long_pass_eff_pct.toFixed(1)}%`
                : "—"}
            </strong>
          </div>
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">Breakline passes</span>
            <strong className="tabular">{game.breakline_passes ?? "—"}</strong>
          </div>
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">Impact passes</span>
            <strong className="tabular">{game.impact ?? "—"}</strong>
          </div>
          <div className="game-stats-modal-stat">
            <span className="game-stats-modal-label">Key passes</span>
            <strong className="tabular">{game.key_passes ?? "—"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

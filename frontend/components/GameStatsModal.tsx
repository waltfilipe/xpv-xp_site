"use client";

import type { XpRoundGrade } from "@/lib/api";
import { RoundGradeStatsPanel } from "@/components/RoundGradeStatsPanel";

type Props = {
  game: XpRoundGrade | null;
  onClose: () => void;
  accent?: string;
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

export function GameStatsModal({ game, onClose, accent = "#a78bfa" }: Props) {
  if (!game) return null;

  return (
    <div className="game-stats-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="game-stats-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-stats-title"
        onClick={(e) => e.stopPropagation()}
        style={{ "--stats-accent": accent } as React.CSSProperties}
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

        <RoundGradeStatsPanel point={game} accent={accent} layout="modal" />
      </div>
    </div>
  );
}

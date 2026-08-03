import { letterGradeBg, letterGradeColor } from "@/lib/gradeColors";

type Props = { letter: string | null | undefined; size?: "sm" | "md" | "lg" };

export function GradeBadge({ letter, size = "md" }: Props) {
  const l = letter ?? "—";
  const color = letterGradeColor(letter);
  return (
    <span
      className={`grade-badge grade-badge-${size}`}
      style={{ color, background: letterGradeBg(letter), borderColor: `${color}44` }}
    >
      {l}
    </span>
  );
}

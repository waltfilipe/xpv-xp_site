import type { ReactNode } from "react";

type Props = {
  content: string | ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  block?: boolean;
};

export function Tooltip({ content, children, side = "top", block }: Props) {
  if (!content) return <>{children}</>;
  return (
    <span className={`tip-wrap tip-${side}${block ? " tip-wrap-block" : ""}`} tabIndex={0}>
      {children}
      <span className={`tip-box${typeof content !== "string" ? " tip-box-rich" : ""}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}

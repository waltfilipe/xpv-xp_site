"use client";

import type { ReactNode } from "react";

type Props = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  block?: boolean;
};

export function Tooltip({ content, children, side = "top", block }: Props) {
  if (!content) return <>{children}</>;
  return (
    <span className={`tip-wrap tip-${side}${block ? " tip-wrap-block" : ""}`} tabIndex={0}>
      {children}
      <span className="tip-box" role="tooltip">{content}</span>
    </span>
  );
}

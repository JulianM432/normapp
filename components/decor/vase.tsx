import type { SVGProps } from "react";

export function Vase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" {...props}>
      <path d="M40 14h20v8c0 5 16 13 16 33 0 19-9 31-26 31S24 74 24 55c0-20 16-28 16-33z" fill="var(--color-glaze-light)" />
      <path d="M24 55c0-5 2-9 3.5-12.5h45C74 46 76 50 76 55c0 19-9 31-26 31S24 74 24 55z" fill="var(--color-btn)" />
      <circle cx="38" cy="64" r="3.5" fill="var(--color-surface)" />
      <circle cx="50" cy="72" r="3.5" fill="var(--color-surface)" />
      <circle cx="62" cy="64" r="3.5" fill="var(--color-surface)" />
      <path d="M36 14h28" stroke="var(--color-btn)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

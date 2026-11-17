import type { SVGProps } from "react";

export function Squiggle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 10" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M2 5c5-4 9-4 14 0s9 4 14 0 9-4 14 0 9 4 14 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

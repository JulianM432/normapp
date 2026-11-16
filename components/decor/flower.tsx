import type { SVGProps } from "react";

type FlowerProps = SVGProps<SVGSVGElement> & {
  petal?: string;
  center?: string;
};

export function Flower({ petal = "var(--color-surface)", center = "var(--color-mustard)", ...props }: FlowerProps) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" {...props}>
      <g fill={petal}>
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="20" cy="10" rx="6.5" ry="9" transform={`rotate(${deg} 20 20)`} />
        ))}
      </g>
      <circle cx="20" cy="20" r="5.5" fill={center} />
    </svg>
  );
}

export function Leaf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 60 120" aria-hidden="true" focusable="false" {...props}>
      <path d="M30 118C28 80 30 40 34 4" stroke="var(--color-glaze-deep)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M31 70C12 66 4 50 6 36c16 4 25 16 25 34z" fill="var(--color-sage-deep)" />
      <path d="M32 48c18-6 24-20 22-34-15 5-22 18-22 34z" fill="var(--color-glaze-deep)" />
    </svg>
  );
}

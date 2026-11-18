import type { CSSProperties } from "react";

export type ArrowDirection = "left" | "right" | "up-right";

const ARROW_PATHS: Record<ArrowDirection, string> = {
  "up-right": "M4 12 L12 4 M5.5 4 H12 V10.5",
  left: "M12.5 8 H3.5 M7 3.5 L3.5 8 L7 12.5",
  right: "M3.5 8 H12.5 M9 3.5 L12.5 8 L9 12.5",
};

/**
 * A single drawn arrow used across the app so links and buttons share one
 * icon rather than unicode glyphs. It is decorative: the surrounding label
 * carries the meaning, so the svg is aria-hidden and adds no text.
 *
 * `direction` picks left / right / up-right (the homepage default). `size`
 * sets an explicit width and height (use "1em" to track the label's font);
 * leave it unset when a className such as `home-arrow` sizes it via CSS.
 */
export function Arrow({
  direction = "up-right",
  size,
  className,
  style,
}: {
  direction?: ArrowDirection;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em", flexShrink: 0, ...style }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ARROW_PATHS[direction]} />
    </svg>
  );
}

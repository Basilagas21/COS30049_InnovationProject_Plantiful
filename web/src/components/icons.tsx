import type { CSSProperties } from "react";

/**
 * Small drawn icons shared across the app so buttons use one icon family
 * rather than unicode glyphs. Each is decorative (aria-hidden); the button
 * label carries the meaning. Stroke weight and caps match the Arrow icon.
 */
function IconBase({
  size,
  className,
  style,
  children,
}: {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
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
      {children}
    </svg>
  );
}

export function CloseIcon(props: { size?: number | string; className?: string; style?: CSSProperties }) {
  return (
    <IconBase {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </IconBase>
  );
}

export function RefreshIcon(props: { size?: number | string; className?: string; style?: CSSProperties }) {
  return (
    <IconBase {...props}>
      <path d="M15.3 2.7v4h-4" />
      <path d="M13.7 10a6 6 0 1 1-1.4-6.2L15.3 6.7" />
    </IconBase>
  );
}

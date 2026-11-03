"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
};

// Falls back to a soft placeholder when the photo URL is missing or the
// object behind it is damaged, so a broken upload never renders as a
// broken-image icon.
export function PhotoImg({ src, alt, className }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = Boolean(src && failedSource === src);

  if (!src || failed) {
    if (!alt) {
      return (
        <div
          aria-hidden="true"
          className={`${className ?? ""} bg-gradient-to-br from-sprout to-cream`}
        />
      );
    }
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className ?? ""} bg-gradient-to-br from-sprout to-cream`}
      >
        <span className="flex h-full min-h-16 items-center justify-center p-3 text-center text-xs text-pine">{failed ? "Photo unavailable" : "No photograph"}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailedSource(src)} />
  );
}

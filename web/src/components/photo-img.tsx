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
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className ?? ""} bg-gradient-to-br from-sprout to-cream`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

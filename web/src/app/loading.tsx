import Image from "next/image";

export default function Loading() {
  return (
    <div
      className="plantiful-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span aria-hidden="true" className="plantiful-loader-spore plantiful-loader-spore-one" />
      <span aria-hidden="true" className="plantiful-loader-spore plantiful-loader-spore-two" />
      <span aria-hidden="true" className="plantiful-loader-spore plantiful-loader-spore-three" />

      <div className="plantiful-loader-card">
        <div className="plantiful-loader-emblem">
          <span aria-hidden="true" className="plantiful-loader-ring plantiful-loader-ring-outer" />
          <span aria-hidden="true" className="plantiful-loader-ring plantiful-loader-ring-inner" />
          <span aria-hidden="true" className="plantiful-loader-orbit plantiful-loader-orbit-one" />
          <span aria-hidden="true" className="plantiful-loader-orbit plantiful-loader-orbit-two" />
          <div className="plantiful-loader-logo">
            <Image
              src="/plantiful_logo.png"
              alt=""
              width={592}
              height={421}
              priority
              className="h-48 w-auto object-contain sm:h-56"
            />
          </div>
        </div>

        <p className="plantiful-loader-title">Growing your page</p>
        <p className="plantiful-loader-copy">A little closer to nature.</p>

        <div aria-hidden="true" className="plantiful-loader-progress">
          <span />
        </div>

        <div aria-hidden="true" className="plantiful-loader-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

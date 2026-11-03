"use client";

import { useRef, useState } from "react";
import { PhotoImg } from "@/components/photo-img";

export function ObservationPhotos({ photos, title, failed }: { photos: string[]; title: string; failed: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(0);
  if (failed || photos.length === 0) return (
    <p className="rounded-xl bg-sand px-4 py-3 text-sm text-moss">
      {failed ? "Photographs could not be loaded. Reload before reviewing." : "No observation photograph submitted."}
    </p>
  );
  const current = Math.min(selected, photos.length - 1);
  const move = (direction: number) => setSelected(index => (index + direction + photos.length) % photos.length);
  return (
    <section className="min-w-0" aria-label={`Submitted photographs of ${title}`}>
      <div className="relative overflow-hidden rounded-xl bg-sand">
        <PhotoImg key={photos[current]} src={photos[current]} alt={`Observation photograph ${current + 1} of ${title}`} className="aspect-[4/3] w-full object-cover" />
        <button type="button" onClick={() => dialog.current?.showModal()} aria-label={`Inspect full photograph of ${title}`}
          className="absolute inset-0 rounded-xl focus-visible:-outline-offset-4 focus-visible:outline-emerald">
          <span className="absolute bottom-3 right-3 rounded-full bg-[#0c342c] px-3 py-2 text-xs font-semibold text-[#fffdee]">Inspect photo ↗</span>
        </button>
      </div>
      {photos.length > 1 && <ul className="mt-2 flex gap-2 overflow-x-auto p-1">
        {photos.map((url, index) => <li key={`${url}-${index}`} className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg">
          <PhotoImg src={url} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => setSelected(index)} aria-label={`Show photograph ${index + 1}`} aria-pressed={current === index}
            className={`absolute inset-0 rounded-lg border-2 focus-visible:-outline-offset-4 ${current === index ? 'border-emerald' : 'border-transparent'}`} />
        </li>)}
      </ul>}
      <p className="mt-2 text-xs text-moss">Submitted observation · {current + 1} / {photos.length}</p>
      <dialog ref={dialog} aria-label={`Photograph inspection: ${title}`}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}
        className="m-auto max-h-[94dvh] w-[min(94vw,1000px)] overflow-auto rounded-2xl bg-[#0b1512] p-0 text-[#fffdee] backdrop:bg-black/80">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <p className="text-sm font-medium">{title}</p>
          <form method="dialog"><button className="min-h-11 rounded-full px-4 text-sm hover:bg-white/10 focus-visible:outline-chartreuse">Close ✕</button></form>
        </div>
        <PhotoImg key={photos[current]} src={photos[current]} alt={`Full observation photograph ${current + 1} of ${title}`} className="max-h-[65dvh] min-h-32 w-full object-contain" />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button type="button" disabled={photos.length < 2} onClick={() => move(-1)} className="min-h-11 rounded-full px-4 text-sm hover:bg-white/10 disabled:opacity-30 focus-visible:outline-chartreuse">← Previous</button>
          <span aria-live="polite" className="text-xs">{current + 1} / {photos.length}</span>
          <button type="button" disabled={photos.length < 2} onClick={() => move(1)} className="min-h-11 rounded-full px-4 text-sm hover:bg-white/10 disabled:opacity-30 focus-visible:outline-chartreuse">Next →</button>
        </div>
      </dialog>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SpeciesPhoto } from "@/lib/species";

const PHOTO_BUCKET = "species-photos";

type Props = {
  speciesId: string;
  photos: SpeciesPhoto[];
  officer: boolean;
};

export function PhotoGallery({ speciesId, photos, officer }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const supabase = createClient();
    setError(null);
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be signed in to upload a photo.");
      setUploading(false);
      return;
    }

    const path = `${speciesId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { data, error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError || !data) {
      setError(uploadError?.message ?? "Upload failed.");
      setUploading(false);
      return;
    }

    const publicUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(data.path).data.publicUrl;

    const { error: insertError } = await supabase
      .from("species_photos")
      .insert({ species_id: speciesId, photo_url: publicUrl, uploaded_by: user.id });

    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-pine">
          Botanical photos
        </h2>
        {officer && (
          <label
            className={`inline-flex h-10 cursor-pointer items-center rounded-full bg-emerald px-6 text-sm font-semibold text-cream transition-colors hover:bg-pine ${
              uploading ? "opacity-50" : ""
            }`}
          >
            {uploading ? "Uploading…" : "Upload photo"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}

      {photos.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="text-sm text-moss">
            {officer
              ? "No botanical photos yet — upload the first one above."
              : "No botanical photos recorded yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.photoId}
              src={photo.photoUrl}
              alt={`Botanical photo ${photo.photoId}`}
              className="aspect-square w-full rounded-2xl border border-pine/10 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
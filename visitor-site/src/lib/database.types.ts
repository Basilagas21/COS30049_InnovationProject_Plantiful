// Trimmed copy of the main app's generated Supabase types
// (web/src/lib/database.types.ts) — only the tables this visitor site
// actually queries. Keep the field names/types in sync with the real
// schema if it changes; this file intentionally omits every table this site
// has no business reading (user_profiles, sync_conflicts, etc.).
//
// Every table below declares the full Row/Insert/Update/Relationships
// shape, even species/species_photos/plant_records, which this site only
// ever reads. That's not decoration: supabase-js's internal Schema generic
// only resolves correctly when every table in `Tables` satisfies the full
// GenericTable shape — leave one with Row only, and `SupabaseClient<Database>`
// silently degrades to `never` for every table, not just that one, so
// `.insert()` on `inquiries` (and in principle `.select()` elsewhere) stops
// type-checking as anything meaningful. Caught via a deliberate type-error
// probe while wiring up the inquiries INSERT, not by a false sense of
// safety from `.select()` calls that happened to never trip over it.

export interface Database {
  public: {
    Tables: {
      species: {
        Row: {
          species_id: string;
          scientific_name: string;
          common_name: string | null;
          taxonomy: string | null;
          conservation_status: string | null;
          description: string | null;
          ecology: string | null;
          cultural_significance: string | null;
          created_at: string;
          updated_at: string;
          is_published: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["species"]["Row"],
          "species_id" | "created_at" | "updated_at"
        > & {
          species_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["species"]["Insert"]>;
        Relationships: [];
      };
      species_photos: {
        Row: {
          photo_id: string;
          species_id: string;
          photo_url: string;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["species_photos"]["Row"],
          "photo_id" | "uploaded_at"
        > & {
          photo_id?: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["species_photos"]["Insert"]>;
        Relationships: [];
      };
      plant_records: {
        Row: {
          record_id: string;
          species_id: string | null;
          approval_status: "pending" | "approved" | "rejected";
        };
        Insert: Omit<Database["public"]["Tables"]["plant_records"]["Row"], "record_id"> & {
          record_id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plant_records"]["Insert"]>;
        Relationships: [];
      };
      // Write-only from this site's point of view: the anon key can INSERT
      // an inquiry (the /inquiry page's contact form) but has no RLS grant
      // to SELECT, UPDATE or DELETE any row here — see
      // backend/supabase/migrations/add_inquiries.sql.
      inquiries: {
        Row: {
          inquiry_id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status: "new" | "read" | "archived";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["inquiries"]["Row"],
          "inquiry_id" | "created_at" | "status"
        > & {
          inquiry_id?: string;
          created_at?: string;
          status?: "new" | "read" | "archived";
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

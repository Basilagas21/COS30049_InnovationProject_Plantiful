export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          name: string;
          email: string;
          role: "botanist" | "conservation_officer" | "admin";
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          email: string;
          role: "botanist" | "conservation_officer" | "admin";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: [];
      };
      species: {
        Row: {
          species_id: string;
          scientific_name: string;
          common_name: string | null;
          taxonomy: string | null;
          conservation_status: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
          is_published: boolean;
        };
        Insert: {
          species_id?: string;
          scientific_name: string;
          common_name?: string | null;
          taxonomy?: string | null;
          conservation_status?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          is_published?: boolean;
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
        Insert: Omit<Database["public"]["Tables"]["species_photos"]["Row"], "photo_id" | "uploaded_at"> & {
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
          botanist_id: string | null;
          qr_code: string | null;
          gps_lat: number | null;
          gps_lng: number | null;
          height_cm: number | null;
          status: "draft" | "submitted";
          approval_status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          version: number;
          device_id: string | null;
          created_at: string;
          synced_at: string | null;
        };
        Insert: {
          record_id?: string;
          species_id?: string | null;
          botanist_id?: string | null;
          qr_code?: string | null;
          gps_lat?: number | null;
          gps_lng?: number | null;
          height_cm?: number | null;
          status?: "draft" | "submitted";
          approval_status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          version?: number;
          device_id?: string | null;
          created_at?: string;
          synced_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["plant_records"]["Insert"]>;
        Relationships: [];
      };
      plant_record_photos: {
        Row: {
          photo_id: string;
          record_id: string;
          photo_url: string;
          taken_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["plant_record_photos"]["Row"], "photo_id" | "taken_at"> & {
          photo_id?: string;
          taken_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plant_record_photos"]["Insert"]>;
        Relationships: [];
      };
      sync_log: {
        Row: {
          sync_id: string;
          record_id: string;
          device_id: string;
          sync_status: "pending" | "synced" | "conflict" | "failed";
          conflict_flag: boolean;
          synced_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sync_log"]["Row"], "sync_id" | "synced_at"> & {
          sync_id?: string;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sync_log"]["Insert"]>;
        Relationships: [];
      };
      sensors: {
        Row: {
          sensor_id: string;
          record_id: string | null;
          gps_lat: number | null;
          gps_lng: number | null;
          install_date: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["sensors"]["Row"], "sensor_id"> & {
          sensor_id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sensors"]["Insert"]>;
        Relationships: [];
      };
      sensor_readings: {
        Row: {
          reading_id: string;
          sensor_id: string;
          temperature: number | null;
          humidity: number | null;
          movement: boolean | null;
          recorded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sensor_readings"]["Row"], "reading_id" | "recorded_at"> & {
          reading_id?: string;
          recorded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sensor_readings"]["Insert"]>;
        Relationships: [];
      };
      alerts: {
        Row: {
          alert_id: string;
          sensor_id: string;
          alert_type: string;
          severity: "low" | "medium" | "high" | "critical";
          resolved: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "alert_id" | "created_at"> & {
          alert_id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          report_id: string;
          generated_by: string | null;
          report_type: string | null;
          data_range: string | null;
          file_url: string | null;
          created_at: string;
          is_published: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["reports"]["Row"], "report_id" | "created_at"> & {
          report_id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
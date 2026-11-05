export type Provider = 'plantnet' | 'kindwise';
export type Candidate = {
  scientificName: string; commonNames: string[]; score: number;
  taxonId: string | null; speciesId?: string | null;
  mapping?: 'reviewed-id' | 'reviewed-name' | 'exact-name' | 'unmapped';
  guidance?: { prompts: string[]; source: string; revision: number; reviewedAt: string };
};
export type PhotoEvidence = { photo_id: string; photo_url: string; sha256: string; taken_at: string; evidence_path: string; preview_url?: string };
export type Attempt = {
  attempt_id: string; record_id: string; requested_by: string; provider: Provider;
  model_version: string | null; fingerprint: string; record_version: number;
  photos: PhotoEvidence[]; evidence: Record<string, unknown>;
  status: 'processing' | 'succeeded' | 'no_match' | 'failed';
  candidates: Candidate[]; error_code: string | null; duration_ms: number | null;
  created_at: string; completed_at: string | null; stale?: boolean | null;
};
export type Decision = {
  decision_id: string; attempt_id: string; actor_id: string;
  decision_role: 'collector' | 'officer'; species_id: string | null;
  scientific_name: string | null; outcome: 'selected' | 'unidentified' | 'needs_evidence';
  note: string; created_at: string;
};
export type AssistResponse = {
  enabled: boolean; provider: Provider | null; owner: boolean; reviewer: boolean;
  attempts: Attempt[]; decisions: Decision[];
  catalogue: { species_id: string; scientific_name: string }[];
  evidenceError?: string;
};

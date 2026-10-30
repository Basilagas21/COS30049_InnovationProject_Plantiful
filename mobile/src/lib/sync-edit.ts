import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export class EditConflict extends Error {}

type Observation = Pick<Database['public']['Tables']['plant_records']['Row'],
  'species_id' | 'provisional_name' | 'qr_code' | 'gps_lat' | 'gps_lng' |
  'gps_accuracy_m' | 'height_cm' | 'dbh_cm' | 'taxonomy' | 'phenology' |
  'morphology' | 'notes'>;

/** Atomic compare-and-swap; a stale or unknown baseline never overwrites data. */
export async function pushEditedRecord(
  client: SupabaseClient<Database>,
  serverId: string,
  ownerId: string,
  baseVersion: number | null,
  observation: Observation
): Promise<number> {
  if (baseVersion == null) {
    throw new EditConflict('This older offline copy has no server revision. Review it before choosing to keep your changes.');
  }
  const { data, error } = await client.from('plant_records')
    .update({
      ...observation,
      status: 'submitted',
      approval_status: 'pending',
      rejection_reason: null,
      version: baseVersion + 1,
    })
    .eq('record_id', serverId)
    .eq('botanist_id', ownerId)
    .eq('version', baseVersion)
    .select('version')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new EditConflict('The server record changed since this device last synced. Review it before keeping your changes.');
  }
  return data.version;
}

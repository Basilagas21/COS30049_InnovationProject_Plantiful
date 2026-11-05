import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Pressable } from '@/lib/interactionLog';
import { useTheme } from '@/lib/theme';
import { cyclePart, EVIDENCE_PARTS, evidenceChecklist, partState, type EvidenceInput } from '@/lib/field-evidence';

export function FieldEvidenceChecklist({ onNotesChange, ...input }: EvidenceInput & { onNotesChange?: (notes: string) => void }) {
  const { colors } = useTheme();
  return <View style={{ borderRadius: 20, padding: 16, gap: 12, backgroundColor: colors.sprout }}>
    <Text style={{ color: colors.pine, fontWeight: '700', fontSize: 18 }}>Field evidence check</Text>
    {evidenceChecklist(input).map(item => <View key={item.key} style={{ flexDirection: 'row', gap: 8 }}>
      <Ionicons name={item.complete ? 'checkmark-circle-outline' : 'ellipse-outline'} size={20} color={colors.emerald} />
      <Text style={{ flex: 1, color: colors.pine }}>{item.label}</Text>
    </View>)}
    <Text style={{ color: colors.muted, fontSize: 12 }}>Completeness only, not an identification or GPS accuracy guarantee. Missing evidence does not prevent offline saving.</Text>
    {onNotesChange && <>
      <Text style={{ color: colors.pine, fontWeight: '600' }}>Optional views you checked</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>Tap to cycle: not checked → photographed → not available. These are your declarations, saved in Notes, not AI photo classifications.</Text>
      {EVIDENCE_PARTS.map(part => <Pressable key={part} accessibilityRole="button"
        accessibilityLabel={`${part}: ${partState(input.notes ?? '', part)}. Change evidence status`}
        onPress={() => onNotesChange(cyclePart(input.notes ?? '', part))}
        style={{ minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.emerald }}>{part} · {partState(input.notes ?? '', part)}</Text>
      </Pressable>)}
    </>}
    <Text style={{ color: colors.muted, fontSize: 12 }}>AI Field Assist is available from record details after uploading photos. Save offline first, then open Sync when connected.</Text>
  </View>;
}

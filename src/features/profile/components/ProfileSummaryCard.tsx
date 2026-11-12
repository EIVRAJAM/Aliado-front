import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { UserProfile } from '../types/profile';
import { visibilityLabel } from '../utils/profile-format';

interface ProfileSummaryCardProps {
  profile: UserProfile;
}

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Row label="Nombre" value={profile.nombre?.trim() || 'Sin completar'} />
      <Row label="Teléfono" value={profile.telefono?.trim() || 'Sin completar'} />
      <Row label="Visibilidad" value={visibilityLabel(profile.preferenciaVisibilidad)} />
      <Row label="Zona aproximada" value={profile.zonaAproximada?.trim() || 'Sin configurar'} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});

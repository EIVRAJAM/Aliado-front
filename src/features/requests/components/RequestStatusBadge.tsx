import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { RequestStatus } from '../types/request';
import { requestStatusLabel } from '../utils/request-format';

const palette: Record<RequestStatus, { background: string; text: string }> = {
  BORRADOR: { background: colors.infoSurface, text: colors.primary },
  PUBLICADA: { background: colors.successSurface, text: colors.success },
  CANCELADA: { background: colors.dangerSurface, text: colors.danger },
  CONTRATADA: { background: colors.tealSurface, text: colors.teal },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const theme = palette[status];

  return (
    <View style={[styles.badge, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>{requestStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

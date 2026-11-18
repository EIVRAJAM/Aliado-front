import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../../shared/ui/theme';
import type { ServiceState } from '../types/service';
import { serviceStateLabel, serviceStateTone } from '../utils/service-format';

export function ServiceStateBadge({ state }: { state: ServiceState }) {
  const tone = serviceStateTone[state];
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <View style={[styles.dot, { backgroundColor: tone.text }]} />
      <Text style={[styles.text, { color: tone.text }]}>{serviceStateLabel(state)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '700' },
});

import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../../shared/ui/theme';
import type { ServiceState } from '../types/service';
import { serviceStateLabel, serviceStateTone } from '../utils/service-format';

export function ServiceStateBadge({ state }: { state: ServiceState }) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const tone = serviceStateTone(state, colors);
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <View style={[styles.dot, { backgroundColor: tone.text }]} />
      <Text style={[styles.text, { color: tone.text }]}>{serviceStateLabel(state)}</Text>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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

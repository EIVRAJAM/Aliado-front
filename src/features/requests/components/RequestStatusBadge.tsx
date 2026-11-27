import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../../shared/ui/theme';
import type { RequestStatus } from '../types/request';
import { requestStatusLabel } from '../utils/request-format';
import { requestStatusTone } from '../utils/request-visuals';

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const theme = requestStatusTone(status, colors);

  return (
    <View style={[styles.badge, { backgroundColor: theme.background }]}>
      <View style={[styles.dot, { backgroundColor: theme.text }]} />
      <Text style={[styles.text, { color: theme.text }]}>{requestStatusLabel(status)}</Text>
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

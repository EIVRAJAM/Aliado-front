import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../../shared/ui/theme';
import {
  proposalStateLabel,
  proposalStateTone,
  type ProposalVisualState,
} from '../utils/proposal-format';

export function ProposalStateBadge({ state }: { state: ProposalVisualState }) {
  const tone = proposalStateTone[state];

  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <View style={[styles.dot, { backgroundColor: tone.text }]} />
      <Text style={[styles.text, { color: tone.text }]}>{proposalStateLabel(state)}</Text>
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

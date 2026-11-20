import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../../../shared/ui/theme';

export function ReportReviewLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Reportar esta reseña"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}
    >
      <Ionicons name="flag-outline" size={13} color={colors.muted} />
      <Text style={styles.text}>Reportar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.6 },
  text: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';

interface OrientationNoticeProps {
  message: string;
}

export function OrientationNotice({ message }: OrientationNoticeProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Información orientativa. ${message}`}
      style={styles.container}
    >
      <View style={styles.icon}>
        <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Información orientativa</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.message}>
          Cualquier avance mostrado es orientativo y no equivale a una certificación legal, incluso
          al 100%.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warningSurface,
    padding: spacing.md,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});

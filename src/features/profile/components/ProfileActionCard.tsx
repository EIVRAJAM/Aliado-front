import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { radii, spacing } from '../../../shared/ui/theme';

type ActionTone = 'blue' | 'teal' | 'green' | 'danger';

interface ProfileActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  tone?: ActionTone;
  onPress: () => void;
}

function actionTone(
  tone: ActionTone,
  colors: ThemeColors
): { background: string; color: string } {
  switch (tone) {
    case 'blue':
      return { background: colors.infoSurface, color: colors.info };
    case 'teal':
      return { background: colors.tealSurface, color: colors.teal };
    case 'green':
      return { background: colors.successSurface, color: colors.success };
    case 'danger':
      return { background: colors.dangerSurface, color: colors.danger };
  }
}

export function ProfileActionCard({
  icon,
  title,
  subtitle,
  tone = 'blue',
  onPress,
}: ProfileActionCardProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const theme = actionTone(tone, colors);

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={[styles.iconBadge, { backgroundColor: theme.background }]}>
          <Text style={[styles.icon, { color: theme.color }]}>{icon}</Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 19,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  chevron: {
    color: colors.chevron,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
});

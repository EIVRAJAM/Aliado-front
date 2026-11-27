import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ProfileFormSectionProps extends PropsWithChildren {
  icon: IconName;
  title: string;
  description: string;
}

export function ProfileFormSection({
  icon,
  title,
  description,
  children,
}: ProfileFormSectionProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {children}
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});

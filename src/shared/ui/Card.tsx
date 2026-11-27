import { useAppTheme, type ThemeColors } from './ThemeProvider';
import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii, spacing } from './theme';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();

  return <View style={[styles.card, style]}>{children}</View>;
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 1,
    },
  });

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme, type ThemeColors } from './ThemeProvider';

interface LinkButtonProps {
  label: string;
  onPress: () => void;
  align?: 'left' | 'center' | 'right';
}

export function LinkButton({ label, onPress, align = 'center' }: LinkButtonProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={[styles.label, { color: colors.primary, textAlign: align }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});

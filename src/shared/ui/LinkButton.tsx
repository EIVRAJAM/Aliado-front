import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from './theme';

interface LinkButtonProps {
  label: string;
  onPress: () => void;
  align?: 'left' | 'center' | 'right';
}

export function LinkButton({ label, onPress, align = 'center' }: LinkButtonProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={[styles.label, { textAlign: align }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 6,
  },
  label: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});

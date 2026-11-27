import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';

interface ReferenceCopyRowProps {
  label: string;
  displayValue: string;
  value: string;
}

export function ReferenceCopyRow({
  label,
  displayValue,
  value,
}: ReferenceCopyRowProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    []
  );

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(value);
      setCopied(true);
      AccessibilityInfo.announceForAccessibility(`${label} copiada`);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      Alert.alert('No se pudo copiar', 'Intenta de nuevo.');
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {displayValue}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Copiar referencia de ${label.toLowerCase()}`}
        accessibilityHint="Copia la referencia completa."
        onPress={() => {
          void handleCopy();
        }}
        style={({ pressed }) => [styles.copyButton, pressed ? styles.pressed : null]}
      >
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={16}
          color={copied ? colors.success : colors.primary}
        />
        {copied ? (
          <Text style={styles.copied} accessibilityLiveRegion="polite">
            Copiado
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.neutral,
    fontSize: 12,
  },
  copyButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  copied: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
});

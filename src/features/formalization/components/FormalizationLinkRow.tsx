import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';
import type {
  FormalizationLink,
  FormalizationLinkState,
} from '../types/formalization';

interface FormalizationLinkRowProps {
  link: FormalizationLink;
  state: FormalizationLinkState;
  opening: boolean;
  onPress: () => void;
}

export function FormalizationLinkRow({
  link,
  state,
  opening,
  onPress,
}: FormalizationLinkRowProps) {
  const available = state === 'DISPONIBLE';
  const disabled = !available || opening;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${link.nombre}. ${
        available ? 'Enlace externo disponible' : 'Enlace externo no disponible'
      }`}
      accessibilityHint={
        available ? 'Abre el sitio oficial en tu navegador externo.' : undefined
      }
      accessibilityState={{ disabled, busy: opening }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !available ? styles.rowUnavailable : null,
        pressed && !disabled ? styles.rowPressed : null,
      ]}
    >
      <View style={[styles.icon, !available ? styles.iconUnavailable : null]}>
        {opening ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons
            name={available ? 'open-outline' : 'link-outline'}
            size={19}
            color={available ? colors.primary : colors.disabled}
          />
        )}
      </View>
      <View style={styles.text}>
        <Text style={[styles.name, !available ? styles.nameUnavailable : null]}>
          {link.nombre}
        </Text>
        <Text style={styles.url} numberOfLines={1}>
          {link.url}
        </Text>
        <View style={styles.badges}>
          <View style={styles.externalBadge}>
            <Text style={styles.externalText}>Externo</Text>
          </View>
          <View
            style={[
              styles.stateBadge,
              available ? styles.stateAvailable : styles.stateUnavailable,
            ]}
          >
            <Text
              style={[
                styles.stateText,
                { color: available ? colors.success : colors.muted },
              ]}
            >
              {available ? 'Disponible' : 'No disponible'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  rowUnavailable: {
    backgroundColor: colors.neutralSurface,
  },
  rowPressed: {
    backgroundColor: colors.infoSurface,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnavailable: {
    backgroundColor: colors.surface,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  nameUnavailable: {
    color: colors.muted,
  },
  url: {
    color: colors.muted,
    fontSize: 11,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  externalBadge: {
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  externalText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stateBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  stateAvailable: {
    backgroundColor: colors.successSurface,
  },
  stateUnavailable: {
    backgroundColor: colors.background,
  },
  stateText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

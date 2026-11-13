import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { PublicProvider } from '../types/discovery';
import {
  formatAvailability,
  providerDisplayName,
  ratingLabel,
  verificationLabel,
} from '../utils/discovery-format';

interface ProviderResultCardProps {
  provider: PublicProvider;
  onPress: () => void;
}

export function ProviderResultCard({ provider, onPress }: ProviderResultCardProps) {
  const firstAvailability = provider.disponibilidad[0];

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${providerDisplayName(provider)}. ${ratingLabel(
          provider.reputacionAgregada,
          provider.cantidadCalificaciones
        )}.`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.identity}>
            <Text style={styles.title} numberOfLines={2}>
              {providerDisplayName(provider)}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.ratingText}>
                {ratingLabel(provider.reputacionAgregada, provider.cantidadCalificaciones)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
        </View>

        <View style={styles.verificationRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.teal} />
          <Text style={styles.verificationText}>
            {verificationLabel(provider.nivelVerificacion)}
          </Text>
        </View>

        <View style={styles.chips}>
          {provider.categorias.slice(0, 3).map((category) => (
            <View key={category} style={styles.chip}>
              <Text style={styles.chipText}>{category}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {provider.zonas.slice(0, 2).join(', ') || 'Sin zonas declaradas'}
            </Text>
          </View>
          {firstAvailability ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {formatAvailability(firstAvailability)}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  row: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.infoSurface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    flexShrink: 1,
  },
});

import { useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { radii, spacing } from '../../../shared/ui/theme';
import { useAppTheme, type ThemeColors, type ThemeMode } from '../../../shared/ui/ThemeProvider';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type {
  NotificationPreference,
  NotificationPreferenceType,
} from '../types/account-activity';
import {
  PREFERENCE_TYPE_ORDER,
  channelLabel,
  preferenceTypeLabel,
} from '../utils/account-activity-format';

type NotificationPreferencesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'NotificationPreferences'
>;

interface PreferenceGroup {
  type: NotificationPreferenceType;
  preferences: NotificationPreference[];
}

export function NotificationPreferencesScreen({
  navigation,
}: NotificationPreferencesScreenProps) {
  const { colors, mode, setMode } = useAppTheme();
  const styles = useStyles();
  const {
    preferences,
    loading,
    error,
    mutationError,
    savingKey,
    reload,
    updatePreference,
  } = useNotificationPreferences();

  const groups = useMemo<PreferenceGroup[]>(
    () =>
      PREFERENCE_TYPE_ORDER.map((type) => ({
        type,
        preferences: preferences.filter((preference) => preference.tipoAviso === type),
      })).filter((group) => group.preferences.length > 0),
    [preferences]
  );

  return (
    <ScreenLayout
      title="Preferencias de la app"
      subtitle="Personaliza la apariencia y elige qué avisos recibir."
      onBack={() => navigation.goBack()}
    >
      <InlineMessage
        variant="info"
        message="Los avisos de seguridad de la cuenta son obligatorios. Los demás cambios se aplican a avisos futuros."
      />

      {mutationError ? <InlineMessage message={mutationError} /> : null}

      <Card style={styles.appearanceCard}>
        <View style={styles.appearanceHeader}>
          <View style={styles.appearanceIcon}>
            <Ionicons name="contrast-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.appearanceText}>
            <Text style={styles.appearanceTitle}>Apariencia</Text>
            <Text style={styles.appearanceSubtitle}>
              Elige cómo se ve ALIADO en este dispositivo.
            </Text>
          </View>
        </View>
        <View style={styles.appearanceOptions} accessibilityRole="radiogroup">
          {([
            { value: 'light', label: 'Claro', icon: 'sunny-outline' },
            { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
            { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
          ] as Array<{ value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }>).map((option) => {
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Tema ${option.label.toLowerCase()}`}
                onPress={() => setMode(option.value)}
                style={[
                  styles.appearanceOption,
                  selected ? styles.appearanceOptionSelected : null,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={selected ? colors.primary : colors.muted}
                />
                <Text
                  style={[
                    styles.appearanceOptionLabel,
                    selected ? styles.appearanceOptionLabelSelected : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando preferencias…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : groups.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={28} color={colors.muted} />
          <Text style={styles.emptyTitle}>Sin preferencias disponibles</Text>
          <Text style={styles.emptyText}>
            No hay preferencias de notificación disponibles para esta cuenta.
          </Text>
          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </Card>
      ) : (
        groups.map((group) => {
          const mandatory = group.preferences.some((preference) => !preference.configurable);
          return (
            <Card key={group.type} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.groupTitle}>{preferenceTypeLabel(group.type)}</Text>
                  {mandatory ? (
                    <View style={styles.mandatoryBadge}>
                      <Text style={styles.mandatoryText}>Obligatorio</Text>
                    </View>
                  ) : null}
                </View>
                {mandatory ? (
                  <Text style={styles.groupDescription}>
                    Este aviso no puede desactivarse.
                  </Text>
                ) : null}
              </View>

              {group.preferences.map((preference, index) => {
                const key = `${preference.tipoAviso}:${preference.canal}`;
                const saving = savingKey === key;
                return (
                  <View
                    key={key}
                    style={[styles.channelRow, index > 0 ? styles.channelRowBorder : null]}
                  >
                    <View style={styles.channelText}>
                      <Text style={styles.channelTitle}>{channelLabel(preference.canal)}</Text>
                      <Text style={styles.channelDescription}>
                        {preference.configurable
                          ? 'Puedes activar o desactivar este canal.'
                          : 'Canal obligatorio para este tipo de aviso.'}
                      </Text>
                    </View>
                    {!preference.configurable || mandatory ? (
                      <View style={styles.lockedControl}>
                        <Ionicons name="lock-closed" size={14} color={colors.muted} />
                        <Text style={styles.lockedText}>Siempre activo</Text>
                      </View>
                    ) : saving ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Switch
                        accessibilityLabel={`${preferenceTypeLabel(preference.tipoAviso)} por ${channelLabel(
                          preference.canal
                        )}`}
                        accessibilityHint="Activa o desactiva este canal para el tipo de aviso."
                        disabled={savingKey !== null}
                        value={preference.habilitada}
                        onValueChange={(value) => {
                          void updatePreference(
                            preference.tipoAviso,
                            preference.canal,
                            value
                          );
                        }}
                        trackColor={{ false: colors.border, true: colors.success }}
                        thumbColor={colors.onPrimary}
                        ios_backgroundColor={colors.border}
                      />
                    )}
                  </View>
                );
              })}
            </Card>
          );
        })
      )}
    </ScreenLayout>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  groupCard: {
    gap: spacing.sm,
  },
  groupHeader: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  mandatoryBadge: {
    borderRadius: radii.sm,
    backgroundColor: colors.warningSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mandatoryText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  groupDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  channelRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  channelText: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  channelDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  lockedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lockedText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  appearanceCard: {
    gap: spacing.md,
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  appearanceIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceText: {
    flex: 1,
    gap: 2,
  },
  appearanceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  appearanceSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  appearanceOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  appearanceOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  appearanceOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  appearanceOptionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  appearanceOptionLabelSelected: {
    color: colors.primary,
  },
});

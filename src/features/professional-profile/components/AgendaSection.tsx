import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { AgendaCommitment } from '../types/professional-profile';
import {
  formatCommitmentTime,
  originLabel,
} from '../utils/professional-profile-format';

interface AgendaSectionProps {
  agenda: AgendaCommitment[];
  loading: boolean;
  error: string | null;
  missing: boolean;
  onEdit: (commitment: AgendaCommitment) => void;
}

export function AgendaSection({ agenda, loading, error, missing, onEdit }: AgendaSectionProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Compromisos</Text>
          <Text style={styles.subtitle}>Tus compromisos registrados.</Text>
        </View>
        {agenda.length > 0 ? <Text style={styles.count}>{agenda.length}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando agenda…</Text>
        </View>
      ) : missing ? (
        <InlineMessage
          variant="info"
          message="La agenda estará disponible cuando tu cuenta tenga un perfil profesional."
        />
      ) : error ? (
        <InlineMessage message={error} />
      ) : agenda.length === 0 ? (
        <InlineMessage variant="info" message="No tienes compromisos registrados." />
      ) : (
        <View style={styles.list}>
          {agenda.map((commitment) => (
            <View key={commitment.id} style={styles.item}>
              <View style={styles.itemIcon}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTime}>{formatCommitmentTime(commitment)}</Text>
                <Text style={styles.itemOrigin}>{originLabel(commitment.origen)}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Editar compromiso ${formatCommitmentTime(commitment)}`} onPress={() => onEdit(commitment)} style={styles.editButton}>
                <Text style={styles.editText}>Editar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
        <Text style={styles.noteText}>
          Los compromisos se muestran en la hora de tu dispositivo. La disponibilidad semanal usa
          la hora de Colombia. No representan una reserva ni confirman automáticamente la
          compatibilidad con solicitudes.
        </Text>
      </View>
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    gap: spacing.md,
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
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemTime: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  itemOrigin: {
    color: colors.muted,
    fontSize: 12,
  },
  editButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  editText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  noteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});

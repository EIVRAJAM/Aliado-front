import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { ContractedService, ServiceHistoryEntry } from '../types/service';
import { actorRole, formatServiceDateTime, serviceStateLabel } from '../utils/service-format';

interface ServiceHistoryCardProps {
  service: ContractedService;
  history: ServiceHistoryEntry[];
}

export function ServiceHistoryCard({ service, history }: ServiceHistoryCardProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
        </View>
        <Text style={styles.title}>Historial</Text>
      </View>
      {history.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay cambios registrados.</Text>
      ) : (
        <View style={styles.list}>
          {history.map((entry) => (
            <View key={`${entry.fecha}-${entry.estadoNuevo}`} style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.content}>
                <Text style={styles.state}>
                  {entry.estadoAnterior
                    ? `${serviceStateLabel(entry.estadoAnterior)} → ${serviceStateLabel(entry.estadoNuevo)}`
                    : serviceStateLabel(entry.estadoNuevo)}
                </Text>
                <Text style={styles.meta}>
                  {entry.actorEliminado ? 'Cuenta eliminada' : actorRole(service, entry.actorId)} · {formatServiceDateTime(entry.fecha)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  content: { flex: 1, gap: 2 },
  state: { color: colors.text, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, fontSize: 13 },
});

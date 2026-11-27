import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { OrientationNotice } from '../components/OrientationNotice';
import { FormalizationRouteCard } from '../components/FormalizationRouteCard';
import { useFormalization } from '../hooks/useFormalization';
import { useFormalizationError } from '../hooks/useFormalizationError';
import { formalizationGateway } from '../services/formalization-gateway-instance';
import {
  isLinkMissing,
  type FormalizationLink,
} from '../types/formalization';

const FALLBACK_DISCLAIMER =
  'Contenido orientativo e informativo: no certifica ni declara ningún estatus legal o formal.';

type FormalizationScreenProps = NativeStackScreenProps<RootStackParamList, 'Formalization'>;

function isExternalHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

export function FormalizationScreen({ navigation }: FormalizationScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const resolveError = useFormalizationError();
  const {
    routes,
    progressByRoute,
    progressStatus,
    linkStates,
    loading,
    routeError,
    progressError,
    reload,
    setLinkState,
  } = useFormalization();
  const [openingLinkId, setOpeningLinkId] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Formalización"
        subtitle="Ruta orientativa para cuentas de prestador."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Esta sección está disponible solo para cuentas de Prestador."
        />
      </ScreenLayout>
    );
  }

  const disclaimer =
    routes.find((route) => route.avisoLegal.trim())?.avisoLegal ?? FALLBACK_DISCLAIMER;

  const openLink = async (link: FormalizationLink) => {
    if (openingLinkId) {
      return;
    }
    const currentState = linkStates[link.id] ?? link.estado;
    if (currentState !== 'DISPONIBLE') {
      Alert.alert(
        'Enlace no disponible',
        'Este enlace está marcado como no disponible. No se modificó tu progreso.'
      );
      return;
    }

    setOpeningLinkId(link.id);
    try {
      const current = await formalizationGateway.getLink(session.token, link.id);
      if (current.estado !== 'DISPONIBLE') {
        setLinkState(link.id, 'NO_DISPONIBLE');
        Alert.alert(
          'Enlace no disponible',
          'El enlace dejó de estar disponible. No se modificó tu progreso.'
        );
        return;
      }
      if (!isExternalHttpUrl(current.url)) {
        setLinkState(link.id, 'NO_DISPONIBLE');
        Alert.alert(
          'Enlace no disponible',
          'El enlace no es válido. No se modificó tu progreso.'
        );
        return;
      }
      await Linking.openURL(current.url.trim());
    } catch (error) {
      if (isLinkMissing(error)) {
        setLinkState(link.id, 'NO_DISPONIBLE');
        Alert.alert(
          'Enlace no disponible',
          'El enlace ya no está disponible. No se modificó tu progreso.'
        );
        return;
      }
      const message = resolveError(error, 'No fue posible abrir el enlace oficial.');
      if (message) {
        Alert.alert('No se pudo abrir el enlace', message);
      }
    } finally {
      setOpeningLinkId(null);
    }
  };

  return (
    <ScreenLayout
      title="Formalización"
      subtitle="Ruta orientativa para tu actividad como Prestador."
      onBack={() => navigation.goBack()}
    >
      <OrientationNotice message={disclaimer} />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando ruta de formalización…</Text>
        </View>
      ) : routeError ? (
        <>
          <InlineMessage message={routeError} />
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : routes.length === 0 ? (
        <>
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="map-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin ruta publicada</Text>
            <Text style={styles.emptyText}>
              Todavía no hay una ruta de formalización activa para consultar.
            </Text>
          </Card>
          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : (
        <>
          {progressStatus === 'missing' ? (
            <InlineMessage
              variant="info"
              message="Aún no hay un progreso orientativo registrado para tu cuenta."
            />
          ) : null}
          {progressStatus === 'error' && progressError ? (
            <InlineMessage message={progressError} />
          ) : null}

          {routes.map((route) => (
            <FormalizationRouteCard
              key={route.id}
              route={route}
              progress={progressByRoute.get(route.id)}
              progressStatus={progressStatus}
              linkStates={linkStates}
              openingLinkId={openingLinkId}
              onOpenLink={(link) => {
                void openLink(link);
              }}
            />
          ))}

          <Card style={styles.progressLimitCard}>
            <View style={styles.progressLimitHeader}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              <Text style={styles.progressLimitTitle}>Sobre tu avance</Text>
            </View>
            <Text style={styles.progressLimitText}>
              Esta app solo consulta tu avance; no lo actualiza. Abrir un enlace o consultar los
              pasos no modifica tu progreso.
            </Text>
          </Card>

          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </>
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
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  progressLimitCard: {
    gap: spacing.sm,
  },
  progressLimitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressLimitTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  progressLimitText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});

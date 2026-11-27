import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { CatalogMultiSelect } from '../components/CatalogMultiSelect';
import { ProfileFormSection } from '../components/ProfileFormSection';
import { useProfessionalCatalogs } from '../hooks/useProfessionalCatalogs';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  MAX_PROFESSIONAL_DESCRIPTION,
  ProfessionalProfileError,
  isProfileAlreadyExists,
  isProfileMissing,
  isUncertainProfessionalProfileError,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

type ProfessionalProfileCreateScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfessionalProfileCreate'
>;

interface FieldErrors {
  categories?: string;
  zones?: string;
  description?: string;
}

type ReconciliationResult = 'found' | 'missing' | 'unknown';

interface UncertainState {
  kind: ReconciliationResult;
  message: string;
  serverError: boolean;
}

export function ProfessionalProfileCreateScreen({
  navigation,
}: ProfessionalProfileCreateScreenProps) {
  const { session, clearSession } = useAuthSession();
  const { catalogs, loading, error, reload } = useProfessionalCatalogs();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uncertain, setUncertain] = useState<UncertainState | null>(null);

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Crear perfil profesional"
        subtitle="Esta sección pertenece a las cuentas de prestador."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede crear un perfil profesional."
        />
      </ScreenLayout>
    );
  }

  const categoryOptions = (catalogs?.categories ?? []).map((category) => ({
    id: category.id,
    label: category.nombre,
  }));
  const zoneOptions = (catalogs?.zones ?? []).map((zone) => ({
    id: zone.id,
    label: zone.nombre,
    description: zone.coberturaGeografica,
  }));
  const canSubmit = selectedCategoryIds.length > 0 && selectedZoneIds.length > 0;
  const inputsDisabled = submitting || Boolean(uncertain);

  const reconcile = async (): Promise<ReconciliationResult> => {
    if (!session) {
      return 'unknown';
    }
    try {
      await professionalProfileGateway.getOwnProfile(session.token);
      return 'found';
    } catch (reconcileError) {
      if (isProfileMissing(reconcileError)) {
        return 'missing';
      }
      if (
        reconcileError instanceof ProfessionalProfileError &&
        reconcileError.code === 'SESSION_EXPIRED'
      ) {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
      }
      return 'unknown';
    }
  };

  const setReconciledState = (result: ReconciliationResult, serverError: boolean) => {
    if (result === 'found') {
      setUncertain({
        kind: 'found',
        serverError: false,
        message:
          'La consulta encontró tu perfil profesional. Puedes revisar la vista previa y la agenda.',
      });
      return;
    }
    if (result === 'missing') {
      setUncertain({
        kind: 'missing',
        serverError,
        message: serverError
          ? 'El servidor respondió con un error al crear el perfil y la consulta confirma que no se creó. No fue un problema de conexión. Conserva tus selecciones y reintenta solo de forma manual.'
          : 'La consulta confirma que el perfil no se creó. Conserva tus selecciones y reintenta de forma manual.',
      });
      return;
    }
    setUncertain({
      kind: 'unknown',
      serverError: false,
      message:
        'No se pudo verificar si el perfil existe porque la consulta falló. No envíes el formulario de nuevo; vuelve a revisar cuando la conexión se restablezca.',
    });
  };

  const attemptCreate = async () => {
    if (!session || submitting) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await professionalProfileGateway.createProfile(session.token, {
        categoriaIds: selectedCategoryIds,
        zonaIds: selectedZoneIds,
        descripcion: descripcion.trim() || null,
      });
      Alert.alert(
        'Perfil profesional creado',
        'Ahora puedes revisar tu vista previa y tu agenda.',
        [{ text: 'Ver perfil', onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
    } catch (createError) {
      if (isProfileAlreadyExists(createError)) {
        Alert.alert(
          'Perfil existente',
          'Ya tienes un perfil profesional. Vamos a cargar tu vista previa y tu agenda.',
          [{ text: 'Ver perfil', onPress: () => navigation.goBack() }],
          { cancelable: false }
        );
        return;
      }

      if (
        createError instanceof ProfessionalProfileError &&
        createError.code === 'SESSION_EXPIRED'
      ) {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return;
      }

      if (isUncertainProfessionalProfileError(createError)) {
        const serverError =
          createError instanceof ProfessionalProfileError &&
          createError.status !== undefined &&
          createError.status >= 500;
        setReconciledState(await reconcile(), serverError);
        return;
      }

      setFormError(
        getProfessionalProfileErrorMessage(
          createError,
          'No fue posible crear el perfil profesional. Intenta de nuevo.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!session || submitting || uncertain) {
      return;
    }

    const nextErrors: FieldErrors = {};
    if (selectedCategoryIds.length === 0) {
      nextErrors.categories = 'Selecciona al menos una categoría.';
    }
    if (selectedZoneIds.length === 0) {
      nextErrors.zones = 'Selecciona al menos una zona.';
    }
    if (descripcion.trim().length > MAX_PROFESSIONAL_DESCRIPTION) {
      nextErrors.description = `La descripción admite máximo ${MAX_PROFESSIONAL_DESCRIPTION} caracteres.`;
    }
    setFieldErrors(nextErrors);
    setFormError(null);
    if (nextErrors.categories || nextErrors.zones || nextErrors.description) {
      return;
    }

    await attemptCreate();
  };

  const handleRetryCreation = () => {
    Alert.alert(
      'Reintentar creación',
      'Se enviará de nuevo la creación del perfil con las categorías y zonas seleccionadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reintentar',
          onPress: () => {
            setUncertain(null);
            void attemptCreate();
          },
        },
      ]
    );
  };

  const handleCheckAgain = async () => {
    const previousServerError = uncertain?.serverError ?? false;
    setReconciledState(await reconcile(), previousServerError);
  };

  return (
    <ScreenLayout
      title="Crear perfil profesional"
      subtitle="Elige las categorías y zonas con las que trabajarás."
      onBack={() => navigation.goBack()}
    >
      {loading ? (
        <Card style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Cargando categorías y zonas…</Text>
        </Card>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" onPress={() => void reload()} />
        </>
      ) : (
        <>
          <InlineMessage
            variant="info"
            message="El perfil se crea con al menos una categoría y una zona. La descripción profesional es opcional; la experiencia se omite en este paso."
          />

          <ProfileFormSection
            icon="pricetag-outline"
            title="Categorías"
            description="Selecciona una o varias categorías en las que trabajas."
          >
            <CatalogMultiSelect
              options={categoryOptions}
              selectedIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
              error={fieldErrors.categories}
              disabled={inputsDisabled}
              emptyMessage="No hay categorías activas disponibles."
            />
          </ProfileFormSection>

          <ProfileFormSection
            icon="location-outline"
            title="Zonas de atención"
            description="Selecciona una o varias zonas donde puedes trabajar."
          >
            <CatalogMultiSelect
              options={zoneOptions}
              selectedIds={selectedZoneIds}
              onChange={setSelectedZoneIds}
              error={fieldErrors.zones}
              disabled={inputsDisabled}
              emptyMessage="No hay zonas activas disponibles."
            />
          </ProfileFormSection>

          <ProfileFormSection
            icon="document-text-outline"
            title="Descripción profesional"
            description="Opcional. Una presentación breve que verán los clientes en tu perfil público."
          >
            <FormField
              label="Descripción"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              maxLength={MAX_PROFESSIONAL_DESCRIPTION}
              placeholder="Ej.: Plomero con experiencia en reparaciones domiciliarias."
              hint={`${descripcion.length}/${MAX_PROFESSIONAL_DESCRIPTION} caracteres`}
              error={fieldErrors.description}
              editable={!inputsDisabled}
              style={styles.descriptionInput}
            />
          </ProfileFormSection>

          {formError ? <InlineMessage message={formError} /> : null}

          {uncertain ? (
            <Card
              style={[
                styles.uncertainCard,
                uncertain.kind === 'unknown'
                  ? styles.uncertainWarning
                  : uncertain.kind === 'found'
                    ? styles.uncertainSuccess
                    : styles.uncertainError,
              ]}
            >
              <View style={styles.uncertainHeader}>
                <View style={styles.uncertainIcon}>
                  <Ionicons
                    name={
                      uncertain.kind === 'found'
                        ? 'checkmark-circle-outline'
                        : uncertain.kind === 'missing'
                          ? 'close-circle-outline'
                          : 'alert-circle-outline'
                    }
                    size={22}
                    color={
                      uncertain.kind === 'found'
                        ? colors.success
                        : uncertain.kind === 'missing'
                          ? colors.danger
                          : colors.warning
                    }
                  />
                </View>
                <View style={styles.uncertainText}>
                  <Text
                    style={[
                      styles.uncertainTitle,
                      uncertain.kind === 'found'
                        ? styles.confirmedTitle
                        : uncertain.kind === 'unknown'
                          ? styles.warningTitle
                          : null,
                    ]}
                  >
                    {uncertain.kind === 'found'
                      ? 'Perfil confirmado'
                      : uncertain.kind === 'missing'
                        ? 'Perfil no creado'
                        : 'Resultado pendiente'}
                  </Text>
                  <Text style={styles.uncertainMessage} accessibilityLiveRegion="polite">
                    {uncertain.message}
                  </Text>
                  {uncertain.kind === 'missing' && uncertain.serverError ? (
                    <Text style={styles.uncertainDetail}>
                      El problema está en el servidor; el alta puede volver a fallar hasta que se
                      corrija.
                    </Text>
                  ) : null}
                </View>
              </View>
              {uncertain.kind === 'found' ? (
                <PrimaryButton label="Ver perfil" onPress={() => navigation.goBack()} />
              ) : uncertain.kind === 'missing' ? (
                <>
                  <PrimaryButton label="Reintentar creación" onPress={handleRetryCreation} />
                  <PrimaryButton
                    label="Volver"
                    variant="ghost"
                    onPress={() => navigation.goBack()}
                  />
                </>
              ) : (
                <>
                  <PrimaryButton
                    label="Volver a revisar"
                    onPress={() => {
                      void handleCheckAgain();
                    }}
                  />
                  <PrimaryButton
                    label="Volver"
                    variant="ghost"
                    onPress={() => navigation.goBack()}
                  />
                </>
              )}
            </Card>
          ) : (
            <View style={styles.actions}>
              <PrimaryButton
                label="Crear perfil profesional"
                onPress={() => {
                  void handleSubmit();
                }}
                loading={submitting}
                disabled={!canSubmit || submitting}
              />
              {!canSubmit ? (
                <Text style={styles.hint}>
                  Selecciona al menos una categoría y una zona para continuar.
                </Text>
              ) : null}
              <PrimaryButton
                label="Cancelar"
                variant="ghost"
                onPress={() => navigation.goBack()}
                disabled={submitting}
              />
            </View>
          )}

          <Card style={styles.limitsCard}>
            <View style={styles.limitsHeader}>
              <View style={styles.limitsIcon}>
                <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              </View>
              <Text style={styles.limitsTitle}>Alcance de este paso</Text>
            </View>
            <Text style={styles.limitItem}>
              • La creación envía categorías, zonas y una descripción profesional opcional.
            </Text>
            <Text style={styles.limitItem}>
              • La experiencia, el portafolio y la disponibilidad se gestionan en apartados propios.
            </Text>
            <Text style={styles.limitItem}>
              • La agenda se consulta por separado y los compromisos se guardan como instantes. La
              disponibilidad semanal se interpreta en la hora de Colombia (America/Bogota).
            </Text>
          </Card>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  descriptionInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  uncertainCard: {
    gap: spacing.md,
  },
  uncertainError: {
    borderColor: colors.danger,
  },
  uncertainWarning: {
    borderColor: colors.warning,
  },
  uncertainSuccess: {
    borderColor: colors.success,
  },
  uncertainHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  uncertainIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncertainText: {
    flex: 1,
    gap: 2,
  },
  uncertainTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
  confirmedTitle: {
    color: colors.success,
  },
  warningTitle: {
    color: colors.warning,
  },
  uncertainMessage: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  uncertainDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  limitsCard: {
    gap: spacing.sm,
  },
  limitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  limitsIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitsTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  limitItem: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});

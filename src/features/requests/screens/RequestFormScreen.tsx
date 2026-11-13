import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { SelectField, type SelectOption } from '../../../shared/ui/SelectField';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { PhotoAttachments } from '../components/PhotoAttachments';
import { RequestStateView } from '../components/RequestStateView';
import { useRequestCatalogs } from '../hooks/useRequestCatalogs';
import { useRequestDetail } from '../hooks/useRequestDetail';
import { useRequestError } from '../hooks/useRequestError';
import { requestGateway } from '../services/request-gateway-instance';
import {
  urgencyOptions,
  type CreateServiceRequestInput,
  type LocalPhoto,
  type RequestUrgency,
  type UpdateServiceRequestInput,
} from '../types/request';
import { createIdempotencyKey } from '../utils/idempotency';
import { isUncertainRequestError } from '../utils/request-error-message';
import {
  hasFieldErrors,
  validateRequest,
  type RequestFieldErrors,
} from '../validation/request-validation';

type RequestFormScreenProps = NativeStackScreenProps<RootStackParamList, 'RequestForm'>;

type SubmitMode = 'draft' | 'publish';

export function RequestFormScreen({ navigation, route }: RequestFormScreenProps) {
  const requestId = route.params?.requestId;
  const isEditing = Boolean(requestId);
  const { session } = useAuthSession();
  const catalogsState = useRequestCatalogs();
  const detailState = useRequestDetail(requestId);
  const resolveError = useRequestError();
  const idempotencyKeyRef = useRef(createIdempotencyKey());

  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [zonaId, setZonaId] = useState<string | null>(null);
  const [urgencia, setUrgencia] = useState<RequestUrgency | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [errors, setErrors] = useState<RequestFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [photoProgress, setPhotoProgress] = useState<{ label: string; value: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [savedAfterFailureId, setSavedAfterFailureId] = useState<string | null>(null);
  const [uncertainOutcome, setUncertainOutcome] = useState<string | null>(null);

  const request = detailState.request;
  const catalogs = catalogsState.catalogs;
  const loading = catalogsState.loading || (isEditing && detailState.loading);
  const error = catalogsState.error ?? (isEditing ? detailState.error : null);

  useEffect(() => {
    if (!isEditing || !request) {
      return;
    }
    setCategoriaId(request.categoriaId);
    setDescripcion(request.descripcion ?? '');
    setZonaId(request.zonaId);
    setUrgencia(request.urgencia);
  }, [isEditing, request]);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      catalogs?.categories.map((category) => ({
        value: category.id,
        label: category.nombre,
      })) ?? [],
    [catalogs]
  );

  const zoneOptions = useMemo<SelectOption[]>(
    () =>
      catalogs?.zones.map((zone) => ({
        value: zone.id,
        label: zone.nombre,
        description: zone.coberturaGeografica ?? undefined,
      })) ?? [],
    [catalogs]
  );

  const urgencySelectOptions = useMemo<SelectOption[]>(
    () => urgencyOptions.map((option) => ({ value: option.value, label: option.label })),
    []
  );

  const reload = () => {
    void catalogsState.reload();
    if (isEditing) {
      void detailState.reload();
    }
  };

  const uploadPhotos = async (token: string, targetRequestId: string) => {
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index];
      if (!photo) {
        continue;
      }
      const label = `Subiendo foto ${index + 1} de ${photos.length}`;
      setPhotoProgress({ label, value: index / photos.length });
      await requestGateway.uploadPhoto(token, targetRequestId, photo, (fraction) => {
        setPhotoProgress({
          label,
          value: (index + fraction) / photos.length,
        });
      });
    }
    setPhotoProgress(null);
  };

  const handleSave = async (mode: SubmitMode) => {
    if (!session || submitting || savedAfterFailureId || uncertainOutcome) {
      return;
    }

    if (isEditing && !request) {
      return;
    }

    const validationMode: SubmitMode =
      isEditing && request?.estado === 'PUBLICADA' ? 'publish' : mode;
    const nextErrors = validateRequest(
      { categoriaId, descripcion, zonaId, urgencia },
      isEditing ? validationMode : mode
    );
    setErrors(nextErrors);
    setFormError(null);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    const description = descripcion.trim();
    const updateInput: UpdateServiceRequestInput = {
      categoriaId,
      descripcion: description,
      zonaId,
      urgencia,
    };

    let currentId: string | null = null;

    setSubmitting(true);
    try {
      if (isEditing && requestId) {
        await requestGateway.update(session.token, requestId, updateInput);
        currentId = requestId;
      } else {
        const shouldStartAsDraft = photos.length > 0 || mode === 'draft';
        const createInput: CreateServiceRequestInput = {
          categoriaId,
          descripcion: description || null,
          zonaId,
          urgencia,
          estadoDeseado: shouldStartAsDraft ? 'BORRADOR' : 'PUBLICADA',
        };
        const created = await requestGateway.create(
          session.token,
          createInput,
          idempotencyKeyRef.current
        );
        currentId = created.id;
      }

      if (photos.length > 0 && currentId) {
        await uploadPhotos(session.token, currentId);
      }

      if (!isEditing && mode === 'publish' && photos.length > 0 && currentId) {
        await requestGateway.publish(session.token, currentId);
      }

      if (currentId) {
        const targetId = currentId;
        setSubmitting(false);
        setPhotoProgress(null);
        Alert.alert(
          isEditing ? 'Solicitud actualizada' : mode === 'publish' ? 'Solicitud publicada' : 'Borrador guardado',
          isEditing
            ? 'Los cambios se guardaron correctamente.'
            : mode === 'publish'
              ? 'Tu solicitud está visible para los prestadores de la categoría y zona.'
              : 'Tu borrador se guardó y no es visible para prestadores hasta que lo publiques.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('RequestDetail', { requestId: targetId }),
            },
          ],
          { cancelable: false }
        );
        return;
      }
    } catch (saveError) {
      const message = resolveError(
        saveError,
        isEditing
          ? 'No fue posible actualizar la solicitud. Intenta de nuevo.'
          : 'No fue posible guardar la solicitud. Intenta de nuevo.'
      );
      const uncertain = isUncertainRequestError(saveError);
      if (currentId) {
        setSavedAfterFailureId(currentId);
        setFormError(
          uncertain
            ? `${
                isEditing ? 'Los cambios se guardaron' : 'La solicitud se creó'
              }, pero no se pudo confirmar el resultado de las fotos o la publicación. Revisa el detalle para verificar el estado actual.`
            : `${message ?? ''} La solicitud ya quedó guardada${
                photos.length > 0 ? ' con las fotos que se pudieron subir' : ''
              }; puedes revisarla en el detalle.`.trim()
        );
      } else if (uncertain) {
        setUncertainOutcome(
          isEditing
            ? 'No se pudo confirmar si los cambios se guardaron. No reenvíes este formulario; revisa la solicitud en Mis solicitudes y actualiza la lista.'
            : 'No se pudo confirmar si la solicitud se guardó. No reenvíes este formulario para evitar una solicitud duplicada. Revisa Mis solicitudes y actualiza la lista; si no aparece, crea una nueva solicitud.'
        );
        setFormError(null);
      } else if (message) {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
      setPhotoProgress(null);
    }
  };

  return (
    <ScreenLayout
      title={isEditing ? 'Editar solicitud' : 'Nueva solicitud'}
      subtitle={
        isEditing
          ? 'Actualiza los datos mientras la solicitud esté abierta.'
          : 'Describe el servicio, elige la zona y define la urgencia.'
      }
      onBack={() => navigation.goBack()}
    >
      {loading || error || (isEditing && !request) ? (
        <RequestStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          {formError ? <InlineMessage message={formError} /> : null}
          {savedAfterFailureId ? (
            <>
              <PrimaryButton
                label="Ver solicitud"
                onPress={() =>
                  navigation.replace('RequestDetail', { requestId: savedAfterFailureId })
                }
              />
              <InlineMessage
                variant="info"
                message="La solicitud quedó guardada. Revisa el detalle para confirmar su estado actual."
              />
            </>
          ) : (
            <Card style={styles.formCard}>
              <SelectField
                label="Categoría"
                placeholder="Selecciona una categoría"
                value={categoriaId}
                options={categoryOptions}
                onChange={setCategoriaId}
                error={errors.categoriaId}
                disabled={submitting || Boolean(uncertainOutcome)}
              />
              <FormField
                label="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Describe qué servicio necesitas y cualquier detalle útil."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoCapitalize="sentences"
                error={errors.descripcion}
                editable={!submitting && !uncertainOutcome}
                style={styles.descriptionInput}
              />
              <SelectField
                label="Zona"
                placeholder="Selecciona una zona"
                value={zonaId}
                options={zoneOptions}
                onChange={setZonaId}
                error={errors.zonaId}
                disabled={submitting || Boolean(uncertainOutcome)}
              />
              <SelectField
                label="Urgencia"
                placeholder="Selecciona el nivel de urgencia"
                value={urgencia}
                options={urgencySelectOptions}
                onChange={(value) => setUrgencia(value as RequestUrgency)}
                error={errors.urgencia}
                disabled={submitting || Boolean(uncertainOutcome)}
              />
              <PhotoAttachments
                photos={photos}
                existingCount={isEditing ? request?.fotos.length ?? 0 : 0}
                onChange={setPhotos}
                disabled={submitting || Boolean(uncertainOutcome)}
              />
              {photoProgress ? (
                <View style={styles.progress}>
                  <Text style={styles.progressLabel}>{photoProgress.label}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.round(photoProgress.value * 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
              {uncertainOutcome ? null : isEditing ? (
                <PrimaryButton
                  label="Guardar cambios"
                  onPress={() => {
                    void handleSave('draft');
                  }}
                  loading={submitting}
                />
              ) : (
                <>
                  <PrimaryButton
                    label="Publicar solicitud"
                    onPress={() => {
                      void handleSave('publish');
                    }}
                    loading={submitting}
                  />
                  <PrimaryButton
                    label="Guardar borrador"
                    variant="secondary"
                    onPress={() => {
                      void handleSave('draft');
                    }}
                    disabled={submitting}
                  />
                </>
              )}
            </Card>
          )}
          {uncertainOutcome ? (
            <>
              <InlineMessage message={uncertainOutcome} />
              <InlineMessage
                variant="info"
                message="La lista se actualiza automáticamente al abrirla. Si la solicitud no aparece, puedes crear una nueva."
              />
              {isEditing && requestId ? (
                <PrimaryButton
                  label="Ver solicitud"
                  variant="secondary"
                  onPress={() =>
                    navigation.replace('RequestDetail', { requestId })
                  }
                />
              ) : null}
              <PrimaryButton
                label="Ir a Mis solicitudes"
                onPress={() => navigation.push('Requests')}
              />
            </>
          ) : null}
          {!isEditing && !uncertainOutcome && !savedAfterFailureId ? (
            <InlineMessage
              variant="info"
              message="Si la conexión falla antes de recibir confirmación, conservaremos tus datos y te pediremos revisar Mis solicitudes antes de volver a enviar."
            />
          ) : null}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.lg,
  },
  descriptionInput: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  progress: {
    gap: spacing.xs,
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import {
  MAX_PROFESSIONAL_DESCRIPTION,
  ProfessionalProfileError,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

interface ProfessionalDescriptionCardProps {
  description: string | null;
  onSave: (description: string | null) => Promise<unknown>;
}

export function ProfessionalDescriptionCard({
  description,
  onSave,
}: ProfessionalDescriptionCardProps) {
  const { clearSession } = useAuthSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(description ?? '');
    }
  }, [description, editing]);

  const startEditing = () => {
    setDraft(description ?? '');
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(description ?? '');
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    if (saving) {
      return;
    }
    const normalized = draft.trim();
    if (normalized.length > MAX_PROFESSIONAL_DESCRIPTION) {
      setError(`La descripción admite máximo ${MAX_PROFESSIONAL_DESCRIPTION} caracteres.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(normalized || null);
      setEditing(false);
    } catch (saveError) {
      if (
        saveError instanceof ProfessionalProfileError &&
        saveError.code === 'SESSION_EXPIRED'
      ) {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return;
      }
      setError(
        getProfessionalProfileErrorMessage(
          saveError,
          'No fue posible actualizar la descripción profesional.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Descripción profesional</Text>
          <Text style={styles.subtitle}>
            Presentación breve visible en tu perfil público. Es opcional.
          </Text>
        </View>
      </View>

      {editing ? (
        <View style={styles.form}>
          <FormField
            label="Descripción"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={MAX_PROFESSIONAL_DESCRIPTION}
            placeholder="Ej.: Plomero con experiencia en reparaciones domiciliarias."
            hint={`${draft.length}/${MAX_PROFESSIONAL_DESCRIPTION} caracteres`}
            editable={!saving}
            style={styles.input}
          />
          {error ? <InlineMessage message={error} /> : null}
          <View style={styles.actions}>
            <PrimaryButton label="Guardar descripción" onPress={() => void save()} loading={saving} />
            <PrimaryButton
              label="Cancelar"
              variant="ghost"
              onPress={cancelEditing}
              disabled={saving}
            />
          </View>
        </View>
      ) : (
        <View style={styles.readArea}>
          <Text style={description ? styles.description : styles.empty}>
            {description || 'Aún no has añadido una descripción profesional.'}
          </Text>
          {error ? <InlineMessage message={error} /> : null}
          <PrimaryButton
            label={description ? 'Editar descripción' : 'Añadir descripción'}
            variant="secondary"
            onPress={startEditing}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
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
  form: {
    gap: spacing.md,
  },
  input: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  actions: {
    gap: spacing.sm,
  },
  readArea: {
    gap: spacing.md,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});

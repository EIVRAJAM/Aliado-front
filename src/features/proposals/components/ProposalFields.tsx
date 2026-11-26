import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCop } from '../../../shared/format/currency';
import { FormField } from '../../../shared/ui/FormField';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import {
  formatAvailabilityDate,
  formatAvailabilityTime,
} from '../utils/proposal-format';
import type { ProposalFieldErrors } from '../validation/proposal-validation';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_PREVIOUS_VALUE_LENGTH = 80;

interface ProposalFieldsProps {
  availabilityDate: Date | null;
  availabilityTime: Date | null;
  onAvailabilityDateChange: (date: Date) => void;
  onAvailabilityTimeChange: (time: Date) => void;
  mensaje: string;
  tarifaCop: string;
  errors: ProposalFieldErrors;
  onChangeMensaje: (value: string) => void;
  onChangeTarifaCop: (value: string) => void;
  disabled?: boolean;
  existingAvailability?: string | null;
  existingAvailabilityUnreadable?: boolean;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function shortPreviousValue(value: string): string {
  return value.length > MAX_PREVIOUS_VALUE_LENGTH
    ? `${value.slice(0, MAX_PREVIOUS_VALUE_LENGTH)}…`
    : value;
}

export function ProposalFields({
  availabilityDate,
  availabilityTime,
  onAvailabilityDateChange,
  onAvailabilityTimeChange,
  mensaje,
  tarifaCop,
  errors,
  onChangeMensaje,
  onChangeTarifaCop,
  disabled = false,
  existingAvailability,
  existingAvailabilityUnreadable = false,
}: ProposalFieldsProps) {
  const insets = useSafeAreaInsets();
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState(new Date());

  const dateLabel = availabilityDate
    ? formatAvailabilityDate(availabilityDate)
    : 'Selecciona';
  const timeLabel = availabilityTime
    ? formatAvailabilityTime(availabilityTime)
    : 'Selecciona';

  const openPicker = (mode: 'date' | 'time') => {
    if (disabled) {
      return;
    }

    const value =
      mode === 'date'
        ? availabilityDate ?? new Date()
        : availabilityTime ?? new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        minimumDate: mode === 'date' ? startOfToday() : undefined,
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type !== 'set' || !selected) {
            return;
          }
          if (mode === 'date') {
            onAvailabilityDateChange(selected);
          } else {
            onAvailabilityTimeChange(selected);
          }
        },
      });
      return;
    }

    setDraft(value);
    setPickerMode(mode);
  };

  const closePicker = () => {
    setPickerMode(null);
  };

  const confirmIosPicker = () => {
    if (!pickerMode) {
      return;
    }
    if (pickerMode === 'date') {
      onAvailabilityDateChange(draft);
    } else {
      onAvailabilityTimeChange(draft);
    }
    closePicker();
  };

  return (
    <View style={styles.container}>
      <View style={styles.availabilityBlock}>
        <View style={styles.availabilityHeader}>
          <Text style={styles.availabilityLabel}>Disponibilidad</Text>
          <Text style={styles.required}>Obligatoria</Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Fecha de disponibilidad: ${dateLabel}`}
            accessibilityHint="Abre el selector de fecha."
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => openPicker('date')}
            style={({ pressed }) => [
              styles.control,
              availabilityDate ? styles.controlSelected : null,
              pressed && !disabled ? styles.controlPressed : null,
              disabled ? styles.controlDisabled : null,
            ]}
          >
            <View style={styles.controlIcon}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.controlText}>
              <Text style={styles.controlLabel}>Fecha</Text>
              <Text
                style={[
                  styles.controlValue,
                  availabilityDate ? null : styles.controlPlaceholder,
                ]}
              >
                {dateLabel}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Hora de disponibilidad: ${timeLabel}`}
            accessibilityHint="Abre el selector de hora."
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => openPicker('time')}
            style={({ pressed }) => [
              styles.control,
              availabilityTime ? styles.controlSelected : null,
              pressed && !disabled ? styles.controlPressed : null,
              disabled ? styles.controlDisabled : null,
            ]}
          >
            <View style={styles.controlIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.controlText}>
              <Text style={styles.controlLabel}>Hora</Text>
              <Text
                style={[
                  styles.controlValue,
                  availabilityTime ? null : styles.controlPlaceholder,
                ]}
              >
                {timeLabel}
              </Text>
            </View>
          </Pressable>
        </View>

        {existingAvailabilityUnreadable && existingAvailability ? (
          <View style={styles.legacyWarning}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
            <Text style={styles.legacyText}>
              La disponibilidad actual no se puede interpretar como fecha y hora:{' '}
              “{shortPreviousValue(existingAvailability)}”. Selecciona una nueva; se reemplazará
              al guardar.
            </Text>
          </View>
        ) : null}

        {errors.disponibilidad ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {errors.disponibilidad}
          </Text>
        ) : null}

        <Text style={styles.hint}>
          Hora local del dispositivo. Es disponibilidad declarada; no representa una reserva ni
          una coincidencia horaria calculada por el servidor.
        </Text>
      </View>

      <FormField
        label="Tarifa (COP)"
        placeholder="Ej.: 250000"
        value={tarifaCop}
        onChangeText={onChangeTarifaCop}
        error={errors.tarifaCop}
        hint={
          tarifaCop.trim() && /^\d+$/.test(tarifaCop.trim())
            ? `Se mostrará como ${formatCop(Number(tarifaCop))}.`
            : 'Ingresa un entero positivo en pesos colombianos, sin decimales.'
        }
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={10}
        editable={!disabled}
        style={styles.tarifaInput}
      />

      <FormField
        label="Mensaje (opcional)"
        placeholder="Cuéntale al Cliente por qué puedes atender la solicitud."
        value={mensaje}
        onChangeText={onChangeMensaje}
        error={errors.mensaje}
        hint={`${mensaje.length}/${MAX_MESSAGE_LENGTH}`}
        maxLength={MAX_MESSAGE_LENGTH}
        multiline
        numberOfLines={4}
        editable={!disabled}
        textAlignVertical="top"
        style={styles.messageInput}
      />

      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View
          style={[
            styles.pickerOverlay,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar selector"
            onPress={closePicker}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {pickerMode === 'date' ? 'Selecciona una fecha' : 'Selecciona una hora'}
            </Text>
            {pickerMode ? (
              <DateTimePicker
                value={draft}
                mode={pickerMode}
                display="spinner"
                minimumDate={pickerMode === 'date' ? startOfToday() : undefined}
                is24Hour
                onChange={(_, selected) => {
                  if (selected) {
                    setDraft(selected);
                  }
                }}
              />
            ) : null}
            <View style={styles.pickerActions}>
              <View style={styles.pickerAction}>
                <PrimaryButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={closePicker}
                />
              </View>
              <View style={styles.pickerAction}>
                <PrimaryButton label="Listo" onPress={confirmIosPicker} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  availabilityBlock: {
    gap: spacing.sm,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  availabilityLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  control: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
  },
  controlSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  controlPressed: {
    backgroundColor: colors.background,
  },
  controlDisabled: {
    opacity: 0.6,
  },
  controlIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    flex: 1,
    gap: 2,
  },
  controlLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  controlValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  controlPlaceholder: {
    color: colors.muted,
    fontWeight: '500',
  },
  legacyWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warningSurface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  legacyText: {
    flex: 1,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  tarifaInput: {
    fontSize: 18,
  },
  messageInput: {
    minHeight: 116,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerAction: {
    flex: 1,
  },
});

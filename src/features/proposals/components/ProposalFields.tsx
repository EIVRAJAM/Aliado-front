import { StyleSheet, View } from 'react-native';

import { FormField } from '../../../shared/ui/FormField';
import { spacing } from '../../../shared/ui/theme';
import type { ProposalFieldErrors } from '../validation/proposal-validation';

const MAX_AVAILABILITY_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 1000;

interface ProposalFieldsProps {
  disponibilidad: string;
  mensaje: string;
  errors: ProposalFieldErrors;
  onChangeDisponibilidad: (value: string) => void;
  onChangeMensaje: (value: string) => void;
  disabled?: boolean;
}

export function ProposalFields({
  disponibilidad,
  mensaje,
  errors,
  onChangeDisponibilidad,
  onChangeMensaje,
  disabled = false,
}: ProposalFieldsProps) {
  return (
    <View style={styles.container}>
      <FormField
        label="Disponibilidad"
        placeholder="Ej. Mañana de 8:00 a.m. a 12:00 m."
        value={disponibilidad}
        onChangeText={onChangeDisponibilidad}
        error={errors.disponibilidad}
        hint={`Obligatoria · ${disponibilidad.length}/${MAX_AVAILABILITY_LENGTH}`}
        maxLength={MAX_AVAILABILITY_LENGTH}
        multiline
        numberOfLines={3}
        editable={!disabled}
        textAlignVertical="top"
        style={styles.availabilityInput}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  availabilityInput: {
    minHeight: 92,
  },
  messageInput: {
    minHeight: 116,
  },
});

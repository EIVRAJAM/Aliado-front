import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { AgendaCommitment, CommitmentInput } from '../types/professional-profile';
import { toOffsetDateTime } from '../utils/professional-profile-format';
import { DateTimeField } from './DateTimeField';

interface Props {
  visible: boolean;
  initial: AgendaCommitment | null;
  saving: boolean;
  backendError: string | null;
  onClose: () => void;
  onSubmit: (input: CommitmentInput) => Promise<boolean>;
}

const nextHour = () => { const value = new Date(); value.setMinutes(0, 0, 0); value.setHours(value.getHours() + 1); return value; };
const parseDate = (value: string | undefined, fallback: Date) => { if (!value) return fallback; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? fallback : parsed; };

export function CommitmentFormModal({ visible, initial, saving, backendError, onClose, onSubmit }: Props) {
  const [start, setStart] = useState(nextHour());
  const [end, setEnd] = useState(() => { const value = nextHour(); value.setHours(value.getHours() + 1); return value; });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const fallback = nextHour();
    const nextStart = parseDate(initial?.fechaHoraInicio, fallback);
    const nextEnd = parseDate(initial?.fechaHoraFin, new Date(nextStart.getTime() + 3600000));
    setStart(nextStart); setEnd(nextEnd); setFormError(null);
  }, [initial, visible]);

  const changeStart = (value: Date) => { setStart(value); if (end.getTime() <= value.getTime()) setEnd(new Date(value.getTime() + 3600000)); };

  const submit = async () => {
    if (end.getTime() <= start.getTime()) { setFormError('La hora de fin debe ser posterior a la de inicio.'); return; }
    setFormError(null);
    if (await onSubmit({ fechaHoraInicio: toOffsetDateTime(start), fechaHoraFin: toOffsetDateTime(end) })) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centered}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}><View style={styles.headerText}><Text style={styles.title}>{initial ? 'Editar compromiso' : 'Nuevo compromiso'}</Text><Text style={styles.subtitle}>Usa la fecha y hora del dispositivo; el compromiso se guarda como un instante.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario de compromiso" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>Cerrar</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Inicio</Text>
            <View style={styles.row}><View style={styles.flex}><DateTimeField label="Fecha de inicio" value={start} mode="date" onChange={changeStart} disabled={saving} /></View><View style={styles.flex}><DateTimeField label="Hora de inicio" value={start} mode="time" onChange={changeStart} disabled={saving} /></View></View>
            <Text style={styles.sectionTitle}>Fin</Text>
            <View style={styles.row}><View style={styles.flex}><DateTimeField label="Fecha de fin" value={end} mode="date" onChange={setEnd} disabled={saving} /></View><View style={styles.flex}><DateTimeField label="Hora de fin" value={end} mode="time" onChange={setEnd} disabled={saving} /></View></View>
            {formError ? <InlineMessage message={formError} /> : null}
            {backendError ? <InlineMessage message={backendError} /> : null}
            <PrimaryButton label={saving ? 'Guardando…' : 'Guardar compromiso'} onPress={() => void submit()} loading={saving} disabled={saving} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  dialog: { maxHeight: '90%', borderRadius: radii.lg, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  closeButton: { paddingVertical: spacing.xs },
  closeText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  content: { gap: spacing.md, paddingBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});

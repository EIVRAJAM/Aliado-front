import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { DateTimeField } from '../components/DateTimeField';
import { useProfessionalAvailability } from '../hooks/useProfessionalAvailability';
import type { AvailabilityBlockInput } from '../types/professional-profile';
import { ANY_DAY_OPTION, WEEKDAY_OPTIONS, formatClockTime, parseClockTime } from '../utils/professional-profile-format';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfessionalAvailability'>;
const dayLabel = (value: number | null) => value === null ? ANY_DAY_OPTION.label : WEEKDAY_OPTIONS.find((o) => o.value === value)?.label ?? `Día ${value}`;
const blockLabel = (block: AvailabilityBlockInput) => `${dayLabel(block.diaSemana)} · ${block.horaInicio} – ${block.horaFin}`;

export function ProfessionalAvailabilityScreen({ navigation }: Props) {
  const { session } = useAuthSession();
  const { blocks, loading, error, missing, saving, saveError, success, reload, save } = useProfessionalAvailability();
  const [draftBlocks, setDraftBlocks] = useState<AvailabilityBlockInput[]>([]);
  const [day, setDay] = useState(1);
  const [start, setStart] = useState(() => parseClockTime('08:00'));
  const [end, setEnd] = useState(() => parseClockTime('18:00'));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { setDraftBlocks(blocks.map((b) => ({ diaSemana: b.diaSemana, horaInicio: b.horaInicio.slice(0, 5), horaFin: b.horaFin.slice(0, 5) }))); }, [blocks]);
  if (!session) return null;
  if (session.role !== 'PRESTADOR') return <ScreenLayout title="Disponibilidad" subtitle="Esta sección pertenece a las cuentas de prestador." onBack={() => navigation.goBack()}><InlineMessage variant="info" message="Tu cuenta no tiene el rol Prestador, por lo que no puede configurar disponibilidad." /></ScreenLayout>;

  const resetForm = () => { setDay(1); setStart(parseClockTime('08:00')); setEnd(parseClockTime('18:00')); setEditingIndex(null); setFormError(null); };
  const addBlock = () => {
    if (end.getTime() <= start.getTime()) { setFormError('La hora de fin debe ser posterior a la de inicio.'); return; }
    const next = { diaSemana: day === 0 ? null : day, horaInicio: formatClockTime(start), horaFin: formatClockTime(end) };
    setDraftBlocks((current) => editingIndex === null ? [...current, next] : current.map((block, index) => index === editingIndex ? next : block));
    resetForm();
  };
  const editBlock = (index: number) => { const block = draftBlocks[index]; if (!block) return; setDay(block.diaSemana ?? 0); setStart(parseClockTime(block.horaInicio)); setEnd(parseClockTime(block.horaFin)); setEditingIndex(index); setFormError(null); };
  const removeBlock = (index: number) => { setDraftBlocks((current) => current.filter((_, currentIndex) => currentIndex !== index)); if (editingIndex === index) resetForm(); };
  const persist = async () => {
    setFormError(null);
    const saved = await save(draftBlocks);
    if (saved) {
      resetForm();
      return;
    }
    setDraftBlocks(
      blocks.map((block) => ({
        diaSemana: block.diaSemana,
        horaInicio: block.horaInicio.slice(0, 5),
        horaFin: block.horaFin.slice(0, 5),
      }))
    );
    resetForm();
  };

  return (
    <ScreenLayout title="Disponibilidad" subtitle="Define bloques semanales de atención. Los horarios se interpretan en la hora de Colombia (America/Bogota)." onBack={() => navigation.goBack()}>
      {loading ? <Card style={styles.loadingCard}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Cargando disponibilidad…</Text></Card> : error ? <><InlineMessage message={error} /><PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} /></> : missing ? <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>Primero crea tu perfil profesional</Text><Text style={styles.emptyText}>La disponibilidad se guarda dentro de tu perfil profesional.</Text><PrimaryButton label="Crear mi perfil profesional" onPress={() => navigation.navigate('ProfessionalProfileCreate')} /></Card> : <>
        {success ? <InlineMessage variant="success" message={success} /> : null}{saveError ? <InlineMessage message={saveError} /> : null}
        <Card style={styles.editorCard}>
          <View style={styles.cardHeader}><View style={styles.iconBadge}><Ionicons name="time-outline" size={18} color={colors.primary} /></View><View style={styles.headerText}><Text style={styles.title}>{editingIndex === null ? 'Agregar bloque' : 'Editar bloque'}</Text><Text style={styles.subtitle}>Día y horario en hora de Colombia (America/Bogota).</Text></View></View>
          <Text style={styles.fieldLabel}>Día</Text><View style={styles.days}>{[ANY_DAY_OPTION, ...WEEKDAY_OPTIONS].map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: day === option.value }} onPress={() => setDay(option.value)} style={[styles.dayChip, day === option.value ? styles.dayChipSelected : null]}><Text style={[styles.dayChipText, day === option.value ? styles.dayChipTextSelected : null]}>{option.label}</Text></Pressable>)}</View>
          <View style={styles.timeRow}><View style={styles.flex}><DateTimeField label="Hora de inicio" value={start} mode="time" onChange={setStart} disabled={saving} /></View><View style={styles.flex}><DateTimeField label="Hora de fin" value={end} mode="time" onChange={setEnd} disabled={saving} /></View></View>
          {formError ? <InlineMessage message={formError} /> : null}
          <PrimaryButton label={editingIndex === null ? 'Agregar bloque' : 'Guardar bloque'} onPress={addBlock} variant={editingIndex === null ? 'primary' : 'secondary'} disabled={saving} />
          {editingIndex !== null ? <LinkButton label="Cancelar edición" onPress={resetForm} align="center" /> : null}
        </Card>
        <Card style={styles.listCard}>
          <View style={styles.cardHeader}><View style={styles.iconBadge}><Ionicons name="calendar-outline" size={18} color={colors.primary} /></View><View style={styles.headerText}><Text style={styles.title}>Bloques configurados</Text><Text style={styles.subtitle}>{draftBlocks.length} bloque(s) en borrador.</Text></View></View>
          {draftBlocks.length === 0 ? <InlineMessage variant="info" message="Aún no hay bloques de disponibilidad." /> : <View style={styles.list}>{draftBlocks.map((block, index) => <View key={`${block.diaSemana}-${block.horaInicio}-${block.horaFin}-${index}`} style={styles.item}><Text style={styles.itemText}>{blockLabel(block)}</Text><View style={styles.itemActions}><Pressable accessibilityRole="button" accessibilityLabel={`Editar bloque ${blockLabel(block)}`} onPress={() => editBlock(index)} style={styles.action}><Text style={styles.actionText}>Editar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Quitar bloque ${blockLabel(block)}`} onPress={() => removeBlock(index)} style={styles.action}><Text style={styles.removeText}>Quitar</Text></Pressable></View></View>)}</View>}
          <PrimaryButton label={saving ? 'Guardando…' : 'Guardar disponibilidad'} onPress={() => void persist()} loading={saving} disabled={saving} />
        </Card>
        <InlineMessage variant="info" message="La disponibilidad semanal se interpreta en la hora de Colombia (America/Bogota). El matching horario automático con solicitudes sigue pendiente de D-03." />
      </>}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, loadingText: { color: colors.muted, fontSize: 14 },
  emptyCard: { gap: spacing.md }, emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800' }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  editorCard: { gap: spacing.md }, listCard: { gap: spacing.md }, cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.infoSurface, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 }, title: { color: colors.text, fontSize: 16, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '600' }, days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  dayChipSelected: { borderColor: colors.primary, backgroundColor: colors.infoSurface }, dayChipText: { color: colors.muted, fontSize: 12, fontWeight: '600' }, dayChipTextSelected: { color: colors.primary },
  timeRow: { flexDirection: 'row', gap: spacing.md }, flex: { flex: 1 }, list: { gap: spacing.sm },
  item: { gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.background, padding: spacing.md }, itemText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  itemActions: { flexDirection: 'row', gap: spacing.md }, action: { paddingVertical: 2 }, actionText: { color: colors.primary, fontSize: 13, fontWeight: '700' }, removeText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
});

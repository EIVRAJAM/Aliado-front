import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export const CONSENT_TEXT =
  'He leído y acepto los Términos y Condiciones y la Política de Privacidad.';

const TERMS_SECTIONS = [
  {
    title: '1. Qué es ALIADO',
    body: 'ALIADO es un prototipo académico para demostrar un servicio de conexión entre personas que necesitan un servicio y personas que lo ofrecen. No es una plataforma comercial en producción y no garantiza la disponibilidad, continuidad ni soporte de una plataforma real.',
  },
  {
    title: '2. Qué datos usa la app',
    body: 'La app puede solicitar correo electrónico, contraseña, rol, nombre, teléfono, zona aproximada, dirección exacta cuando una función la requiera, ubicación, solicitudes y fotos, propuestas, disponibilidad, compromisos de agenda, mensajes, calificaciones, reseñas, reportes y evidencias. Estos datos se usan para ejecutar los flujos de demostración de la app.',
  },
  {
    title: '3. Visibilidad de la información',
    body: 'Parte de la información del perfil puede mostrarse a otros usuarios según las funciones de la app y los controles de visibilidad disponibles. La zona aproximada puede ser pública; la dirección exacta no debe mostrarse en búsquedas ni perfiles públicos. No uses información que no quieras compartir en una demostración.',
  },
  {
    title: '4. Recomendaciones de seguridad',
    body: 'No ingreses contraseñas, datos financieros, números de documentos, datos de salud ni otra información sensible en descripciones, mensajes, fotos, reseñas o reportes. Usa datos de prueba y evita publicar información personal real.',
  },
  {
    title: '5. Uso limitado a la demostración',
    body: 'El uso está limitado al entorno de demostración del proyecto. La app puede suspenderse, reiniciarse o perder datos durante pruebas. No se ofrecen pagos, anticipos, comisiones, garantías de servicio, soporte continuo ni acuerdos legales entre usuarios.',
  },
  {
    title: '6. Privacidad y conservación',
    body: 'La información puede mostrarse a otros usuarios según las funciones y los controles de visibilidad. El prototipo no promete borrado definitivo, anonimización, plazos de retención, cifrado específico ni certificaciones de seguridad. El flujo de eliminación de cuenta puede registrar una solicitud y bloquear la cuenta, pero la eliminación definitiva y la retención requieren una política aprobada que el proyecto aún no tiene.',
  },
  {
    title: '7. Texto informativo',
    body: 'Este texto es informativo para el prototipo académico. No constituye asesoría legal ni una política aprobada para producción. Debe revisarse por el equipo responsable y por las personas competentes antes de cualquier uso real o publicación.',
  },
  {
    title: '8. Versión del consentimiento',
    body: 'La versión registrada para este prototipo es aliado-academico-mvp-v1. Al marcar la casilla y continuar, dejas constancia de que leíste y aceptaste este texto en el entorno de demostración.',
  },
];

export function ConsentCheckbox({ checked, onChange, error }: ConsentCheckboxProps) {
  const [termsVisible, setTermsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={CONSENT_TEXT}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.box, checked ? styles.boxChecked : null]}>
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.text}>{CONSENT_TEXT}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Ver términos y condiciones"
        onPress={() => setTermsVisible(true)}
        style={styles.termsLink}
      >
        <Text style={styles.termsLinkText}>Ver términos y condiciones</Text>
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={termsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Términos y Condiciones y Política de Privacidad</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar términos y condiciones"
                onPress={() => setTermsVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <Text style={styles.prototypeNotice}>
                ALIADO es un prototipo académico. Usa datos de prueba y evita ingresar información sensible.
              </Text>
              {TERMS_SECTIONS.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionText}>{section.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  box: { width: 24, height: 24, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  check: { color: colors.surface, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  text: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  termsLink: { alignSelf: 'flex-start', paddingVertical: 2, marginLeft: 32 },
  termsLinkText: { color: colors.primary, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  error: { color: colors.danger, fontSize: 13, marginLeft: 32 },
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  dialog: { maxHeight: '88%', gap: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, padding: spacing.lg },
  dialogHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dialogTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '800' },
  closeButton: { paddingVertical: spacing.xs },
  closeText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  dialogContent: { gap: spacing.md, paddingBottom: spacing.sm },
  prototypeNotice: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  section: { gap: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  sectionText: { color: colors.text, fontSize: 13, lineHeight: 20 },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { AuthRole } from '../../auth';
import type { ContractedService, ServiceMessage } from '../types/service';
import { formatServiceDateTime } from '../utils/service-format';

const MAX_MESSAGE_LENGTH = 2000;

interface ServiceMessagesCardProps {
  service: ContractedService;
  messages: ServiceMessage[];
  currentRole: AuthRole;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  uncertain: boolean;
  error: string | null;
}

export function ServiceMessagesCard({
  service,
  messages,
  currentRole,
  value,
  onChange,
  onSend,
  sending,
  uncertain,
  error,
}: ServiceMessagesCardProps) {
  const ownId = currentRole === 'CLIENTE' ? service.clienteId : service.prestadorId;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Mensajes</Text>
          <Text style={styles.subtitle}>Comunicación mediada, sin datos de contacto.</Text>
        </View>
      </View>

      {!service.comunicacionHabilitada ? (
        <InlineMessage
          variant="info"
          message="El canal de comunicación aún no está habilitado para este servicio."
        />
      ) : (
        <>
          {messages.length === 0 ? (
            <Text style={styles.empty}>Aún no hay mensajes.</Text>
          ) : (
            <View style={styles.list}>
              {messages.map((message) => {
                const own = message.remitenteId === ownId;
                const sender = own
                  ? 'Tú'
                  : message.remitenteId === service.clienteId
                    ? 'Cliente'
                    : 'Prestador';
                return (
                  <View
                    key={message.id}
                    style={[styles.message, own ? styles.ownMessage : null]}
                  >
                    <Text style={styles.sender}>{sender}</Text>
                    <Text style={styles.content}>{message.contenido}</Text>
                    <Text style={styles.date}>{formatServiceDateTime(message.fechaEnvio)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {error ? <InlineMessage message={error} /> : null}

          <FormField
            label="Nuevo mensaje"
            placeholder="Escribe un mensaje para coordinar el servicio."
            value={value}
            onChangeText={onChange}
            hint={`${value.length}/${MAX_MESSAGE_LENGTH}`}
            maxLength={MAX_MESSAGE_LENGTH}
            multiline
            numberOfLines={3}
            editable={!sending && !uncertain}
            textAlignVertical="top"
            style={styles.input}
          />

          <PrimaryButton
            label={uncertain ? 'Envío no confirmado' : 'Enviar mensaje'}
            onPress={onSend}
            loading={sending}
            disabled={sending || uncertain || !value.trim()}
          />

          <Text style={styles.note}>
            Los mensajes se actualizan al abrir o actualizar la pantalla; no hay chat en tiempo
            real.
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
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
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  empty: { color: colors.muted, fontSize: 13 },
  list: { gap: spacing.sm },
  message: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 3,
  },
  ownMessage: { alignSelf: 'flex-end', backgroundColor: colors.infoSurface },
  sender: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  content: { color: colors.text, fontSize: 14, lineHeight: 20 },
  date: { color: colors.muted, fontSize: 10 },
  input: { minHeight: 88 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});

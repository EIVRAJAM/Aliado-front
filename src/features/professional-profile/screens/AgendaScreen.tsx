import type { CompositeScreenProps } from '@react-navigation/native';
import { useState } from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { useAuthSession } from '../../auth';
import { AgendaSection } from '../components/AgendaSection';
import { CommitmentFormModal } from '../components/CommitmentFormModal';
import { useProviderAgenda } from '../hooks/useProviderAgenda';
import type { AgendaCommitment, CommitmentInput } from '../types/professional-profile';

type AgendaScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Agenda'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function AgendaScreen({}: AgendaScreenProps) {
  const { session } = useAuthSession();
  const { agenda, loading, error, missing, saving, mutationError, success, reload, saveCommitment, clearFeedback } = useProviderAgenda();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AgendaCommitment | null>(null);
  const openCreate = () => { clearFeedback(); setEditing(null); setFormVisible(true); };
  const openEdit = (commitment: AgendaCommitment) => { clearFeedback(); setEditing(commitment); setFormVisible(true); };
  const submit = async (input: CommitmentInput) => saveCommitment(input, editing?.id);

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Agenda"
        subtitle="Esta sección pertenece a las cuentas de prestador."
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede consultar una agenda profesional."
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Agenda"
      subtitle="Consulta y administra los compromisos de tu agenda."
    >
      {success ? <InlineMessage variant="success" message={success} /> : null}
      <AgendaSection agenda={agenda} loading={loading} error={error} missing={missing} onEdit={openEdit} />
      {!missing && !error ? <PrimaryButton label="Nuevo compromiso" onPress={openCreate} disabled={loading} /> : null}
      <PrimaryButton label={error ? 'Reintentar' : 'Actualizar'} variant="secondary" onPress={() => void reload()} />
      <CommitmentFormModal visible={formVisible} initial={editing} saving={saving} backendError={mutationError} onClose={() => { setFormVisible(false); setEditing(null); }} onSubmit={submit} />
    </ScreenLayout>
  );
}

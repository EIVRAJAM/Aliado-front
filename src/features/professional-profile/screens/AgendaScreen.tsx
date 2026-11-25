import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { useAuthSession } from '../../auth';
import { AgendaSection } from '../components/AgendaSection';
import { useProviderAgenda } from '../hooks/useProviderAgenda';

type AgendaScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Agenda'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function AgendaScreen({}: AgendaScreenProps) {
  const { session } = useAuthSession();
  const { agenda, loading, error, missing, reload } = useProviderAgenda();

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
      subtitle="Consulta los compromisos registrados en tu agenda."
    >
      <AgendaSection agenda={agenda} loading={loading} error={error} missing={missing} />
      <PrimaryButton
        label={error ? 'Reintentar' : 'Actualizar'}
        variant="secondary"
        onPress={() => {
          void reload();
        }}
      />
    </ScreenLayout>
  );
}

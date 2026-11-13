import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { RequestCard } from '../components/RequestCard';
import { RequestStateView } from '../components/RequestStateView';
import { useMyRequests } from '../hooks/useMyRequests';

type RequestListScreenProps = NativeStackScreenProps<RootStackParamList, 'Requests'>;

export function RequestListScreen({ navigation }: RequestListScreenProps) {
  const { session } = useAuthSession();
  const { requests, catalogs, loading, error, reload } = useMyRequests();

  if (!session) {
    return null;
  }

  if (session.role !== 'CLIENTE') {
    return (
      <ScreenLayout
        title="Mis solicitudes"
        subtitle="Esta sección pertenece a las cuentas de cliente."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Cliente, por lo que no puede gestionar solicitudes de servicio."
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Mis solicitudes"
      subtitle="Consulta, retoma y gestiona las solicitudes que has creado."
      onBack={() => navigation.goBack()}
    >
      {loading || error ? (
        <RequestStateView loading={loading} error={error} onRetry={reload} />
      ) : requests.length === 0 ? (
        <RequestStateView
          loading={false}
          error={null}
          onRetry={reload}
          emptyMessage="Todavía no tienes solicitudes. Crea una para que los prestadores de tu zona puedan encontrarla."
        />
      ) : (
        <View style={styles.list}>
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              catalogs={catalogs}
              onPress={() => navigation.navigate('RequestDetail', { requestId: request.id })}
            />
          ))}
        </View>
      )}

      <PrimaryButton
        label="Nueva solicitud"
        onPress={() => navigation.navigate('RequestForm')}
      />
      {!loading && !error ? (
        <LinkButton label="Actualizar lista" onPress={() => void reload()} />
      ) : null}
      <InlineMessage
        variant="info"
        message="Los borradores no son visibles para prestadores hasta que decidas publicarlos."
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});

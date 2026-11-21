import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { useAuthSession } from '../../auth';
import { RequestsBoard } from '../components/RequestsBoard';

type RequestListScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Requests'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function RequestListScreen({ navigation }: RequestListScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'CLIENTE') {
    return (
      <ScreenLayout
        title="Mis solicitudes"
        subtitle="Esta sección pertenece a las cuentas de cliente."
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
      subtitle="Consulta el estado de cada solicitud y retoma la que necesites."
    >
      <RequestsBoard
        onOpenRequest={(requestId) =>
          navigation.navigate('RequestDetail', { requestId })
        }
        onCreate={() => navigation.navigate('RequestForm')}
      />
    </ScreenLayout>
  );
}

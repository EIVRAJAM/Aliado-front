import { useEffect } from 'react';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { useAuthSession } from '../../auth';
import { OpportunitiesBoard } from '../components/OpportunitiesBoard';

type OpportunitiesScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Opportunities'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function OpportunitiesScreen({ navigation, route }: OpportunitiesScreenProps) {
  const { session } = useAuthSession();

  useEffect(() => {
    if (route.params?.filters) {
      navigation.setParams({ filters: undefined });
    }
  }, [navigation, route.params?.filters]);

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Oportunidades"
        subtitle="Esta sección pertenece a las cuentas de prestador."
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede consultar oportunidades."
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Oportunidades"
      subtitle="Revisa solicitudes compatibles con tu perfil y tu disponibilidad."
    >
      <OpportunitiesBoard
        initialFilters={route.params?.filters}
        onOpenOpportunity={(solicitudId) =>
          navigation.navigate('OpportunityDetail', { solicitudId })
        }
        onOpenNotifications={() => navigation.navigate('Notifications')}
        onOpenProfessionalProfile={() => navigation.navigate('ProfessionalProfile')}
      />
    </ScreenLayout>
  );
}

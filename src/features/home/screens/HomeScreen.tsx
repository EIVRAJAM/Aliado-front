import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { OpportunitiesBoard } from '../../opportunities/components/OpportunitiesBoard';
import { RequestsBoard } from '../../requests/components/RequestsBoard';
import { useUnreadNotifications } from '../../notifications/hooks/useUnreadNotifications';

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const hasNewNotifications = useUnreadNotifications();

  if (!session) {
    return null;
  }

  const isClient = session.role === 'CLIENTE';

  return (
    <ScreenLayout
      title="Inicio"
      headerAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasNewNotifications ? 'Notificaciones nuevas' : 'Notificaciones'}
          onPress={() => navigation.navigate('Notifications')}
          style={({ pressed }) => [
            styles.headerAction,
            pressed ? styles.headerActionPressed : null,
          ]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.onImage} />
          {hasNewNotifications ? <View style={styles.notificationDot} /> : null}
        </Pressable>
      }
    >
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{isClient ? 'Espacio Cliente' : 'Espacio Prestador'}</Text>
        <Text style={styles.title}>
          {isClient ? 'Tus solicitudes' : 'Oportunidades para ti'}
        </Text>
        <Text style={styles.subtitle}>
          {isClient
            ? 'Retoma tus solicitudes o publica una nueva para recibir propuestas.'
            : 'Revisa las solicitudes compatibles con tu perfil y abre el detalle para decidir.'}
        </Text>
      </View>

      {isClient ? (
        <RequestsBoard
          showPrivacyHint={false}
          onOpenRequest={(requestId) =>
            navigation.navigate('RequestDetail', { requestId })
          }
          onCreate={() => navigation.navigate('RequestForm')}
        />
      ) : (
        <OpportunitiesBoard
          onOpenOpportunity={(solicitudId) =>
            navigation.navigate('OpportunityDetail', { solicitudId })
          }
          onOpenProfessionalProfile={() => navigation.navigate('ProfessionalProfile')}
        />
      )}
    </ScreenLayout>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  intro: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.danger,
  },
});

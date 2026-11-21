import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '../features/auth';
import { DiscoveryScreen } from '../features/discovery';
import { HomeScreen } from '../features/home';
import { ProfileOverviewScreen } from '../features/profile';
import { ProfessionalProfileScreen } from '../features/professional-profile';
import { colors } from '../shared/ui/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Discovery: { active: 'search', inactive: 'search-outline' },
  ProfessionalProfile: { active: 'briefcase', inactive: 'briefcase-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function MainTabs() {
  const { session } = useAuthSession();
  const insets = useSafeAreaInsets();

  if (!session) {
    return null;
  }

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
          height: 62 + insets.bottom,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? icons[route.name].active : icons[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      {session.role === 'CLIENTE' ? (
        <Tab.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{ title: 'Buscar' }}
        />
      ) : null}
      {session.role === 'PRESTADOR' ? (
        <Tab.Screen
          name="ProfessionalProfile"
          component={ProfessionalProfileScreen}
          options={{ title: 'Profesional' }}
        />
      ) : null}
      <Tab.Screen name="Profile" component={ProfileOverviewScreen} options={{ title: 'Mi perfil' }} />
    </Tab.Navigator>
  );
}

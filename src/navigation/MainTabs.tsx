import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityScreen } from '../features/account-activity';
import { useAuthSession } from '../features/auth';
import { DiscoveryScreen } from '../features/discovery';
import { HomeScreen } from '../features/home';
import { ProfileOverviewScreen } from '../features/profile';
import { AgendaScreen } from '../features/professional-profile';
import { colors, getThemePalette } from '../shared/ui/theme';
import { useTheme } from '../shared/ui/ThemeProvider';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Discovery: { active: 'search', inactive: 'search-outline' },
  Agenda: { active: 'calendar', inactive: 'calendar-outline' },
  Activity: { active: 'pulse', inactive: 'pulse-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function MainTabs() {
  const { session } = useAuthSession();
  const { resolvedScheme } = useTheme();
  const palette = getThemePalette(resolvedScheme);
  const insets = useSafeAreaInsets();

  if (!session) {
    return null;
  }

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: -1,
        },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          height: 68 + insets.bottom,
          elevation: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
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
          name="Agenda"
          component={AgendaScreen}
          options={{ title: 'Agenda' }}
        />
      ) : null}
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ title: 'Actividad' }}
      />
      <Tab.Screen name="Profile" component={ProfileOverviewScreen} options={{ title: 'Mi perfil' }} />
    </Tab.Navigator>
  );
}

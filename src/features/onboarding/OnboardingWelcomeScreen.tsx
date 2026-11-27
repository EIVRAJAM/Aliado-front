import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { colors, spacing } from '../../shared/ui/theme';

interface OnboardingWelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function OnboardingWelcomeScreen({ onLogin, onRegister }: OnboardingWelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ALIADO</Text>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.description}>
          Elige cómo quieres continuar. Puedes iniciar sesión o crear una cuenta nueva.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton label="Ya tengo cuenta" onPress={onLogin} />
          <PrimaryButton label="Registrarme" variant="secondary" onPress={onRegister} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});

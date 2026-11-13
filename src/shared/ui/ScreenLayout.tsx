import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing } from './theme';

type ScreenVariant = 'app' | 'auth';

interface ScreenLayoutProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  variant?: ScreenVariant;
  onBack?: () => void;
}

export function ScreenLayout({
  title,
  subtitle,
  variant = 'app',
  onBack,
  children,
}: ScreenLayoutProps) {
  if (variant === 'auth') {
    return (
      <SafeAreaView style={styles.authSafe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
            <View style={styles.authBrandRow}>
              <View style={styles.authLogo}>
                <Text style={styles.authLogoText}>A</Text>
              </View>
              <Text style={styles.authBrand}>ALIADO</Text>
            </View>
            <Text style={styles.authHeroSubtitle}>Acceso a tu cuenta</Text>
            <View style={styles.authCard}>
              <Text style={styles.authTitle}>{title}</Text>
              {subtitle ? <Text style={styles.authSubtitle}>{subtitle}</Text> : null}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appSafe}>
      <StatusBar style="dark" />
      <View style={styles.appHeader}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed ? styles.backPressed : null]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        <View style={styles.appLogo}>
          <Text style={styles.appLogoText}>A</Text>
        </View>
        <View style={styles.appHeaderText}>
          <Text style={styles.appTitle}>{title}</Text>
          <Text style={styles.appBrandSmall}>ALIADO</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.appContent} keyboardShouldPersistTaps="handled">
          {subtitle ? <Text style={styles.appSubtitle}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  authSafe: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  authContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  authBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  authLogo: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authLogoText: {
    color: colors.authBackground,
    fontSize: 20,
    fontWeight: '800',
  },
  authBrand: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  authHeroSubtitle: {
    color: colors.authMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  authTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  authSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: -spacing.sm,
  },
  appSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.background,
  },
  backText: {
    color: colors.muted,
    fontSize: 32,
    lineHeight: 32,
    marginTop: -2,
  },
  appLogo: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogoText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '800',
  },
  appHeaderText: {
    flex: 1,
  },
  appTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  appBrandSmall: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  appContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  appSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: -spacing.sm,
  },
});

import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, spacing } from '../../shared/ui/theme';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';

const slides = [
  {
    image: require('../../../assets/onboarding/aliado1.jpg'),
    imageLabel: 'Equipo de profesionales de distintos oficios',
    eyebrow: 'Equipo de profesionales',
    title: 'Soluciones para tu hogar, en un solo lugar',
    description: 'Encuentra personas disponibles para lo que necesitas.',
  },
  {
    image: require('../../../assets/onboarding/aliado2.jpg'),
    imageLabel: 'Profesional trabajando en un hogar',
    eyebrow: 'Profesional trabajando',
    title: 'Encuentra el profesional que necesitas',
    description: 'Compara opciones y elige con confianza.',
  },
  {
    image: require('../../../assets/onboarding/aliado3.jpg'),
    imageLabel: 'Profesional realizando un arreglo',
    eyebrow: 'Profesional realizando un arreglo',
    title: 'Conecta, acuerda y sigue tu servicio',
    description: 'Da seguimiento al acuerdo desde la app.',
  },
] as const;

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const position = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return position * position * (3 - 2 * position);
};

const scrimSteps = Array.from({ length: 200 }, (_, index) => {
  const position = index / 199;
  const top = 0.36 * (1 - smoothstep(0, 0.32, position));
  const bottom = 0.94 * smoothstep(0.28, 1, position);
  return Math.min(0.94, top + bottom);
});

function OnboardingScrim() {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {scrimSteps.map((opacity, index) => (
        <View
          key={index}
          style={{ flex: 1, backgroundColor: `rgba(7, 10, 18, ${opacity.toFixed(3)})` }}
        />
      ))}
    </View>
  );
}

interface OnboardingScreenProps {
  onSkip: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export function OnboardingScreen({ onSkip, onLogin, onRegister }: OnboardingScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [page, setPage] = useState(0);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    setPage(clamped);
    listRef.current?.scrollToOffset({ offset: clamped * width, animated: true });
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page === 0) {
        return false;
      }
      goTo(page - 1);
      return true;
    });
    return () => subscription.remove();
  }, [page, width]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(Math.max(0, Math.min(slides.length - 1, next)));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        ref={listRef}
        style={StyleSheet.absoluteFill}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image
              source={item.image}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              accessibilityLabel={item.imageLabel}
            />
            <OnboardingScrim />
            <SafeAreaView style={styles.slideContent} edges={['top', 'bottom']}>
              <View style={styles.slideSpacer} />
              <View style={styles.copy}>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </SafeAreaView>
          </View>
        )}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.topSafe} edges={['top']}>
        <View pointerEvents="box-none" style={styles.topBar}>
          {page > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al paso anterior"
              onPress={() => goTo(page - 1)}
              style={[styles.topButton, styles.topControl]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.onImage} />
            </Pressable>
          ) : (
            <View style={styles.topButton} />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Omitir introducción"
            onPress={onSkip}
            style={[styles.skipButton, styles.topControl]}
          >
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView pointerEvents="box-none" style={styles.footerSafe} edges={['bottom']}>
        <View style={styles.footer}>
          <View
            style={styles.dots}
            accessible
            accessibilityLabel={`Página ${page + 1} de ${slides.length}`}
          >
            {slides.map((slide, index) => (
              <View
                key={slide.title}
                style={[styles.dot, index === page ? styles.dotActive : null]}
              />
            ))}
          </View>
          {page === slides.length - 1 ? (
            <View style={styles.choices}>
              <PrimaryButton label="Ya tengo cuenta" onPress={onLogin} />
              <PrimaryButton label="Registrarme" variant="secondary" onPress={onRegister} />
            </View>
          ) : (
            <PrimaryButton label="Continuar" onPress={() => goTo(page + 1)} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.authBackground },
  topSafe: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },
  footerSafe: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  topBar: {
    height: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topControl: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(7, 10, 18, 0.42)',
  },
  skipButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  skipText: { color: colors.onImage, fontSize: 14, fontWeight: '800' },
  slide: { flex: 1 },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 190,
  },
  slideSpacer: { flex: 1 },
  copy: { gap: spacing.sm, paddingBottom: spacing.md },
  eyebrow: {
    color: 'rgba(219, 234, 254, 0.92)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  title: {
    color: colors.onImage,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 16,
    lineHeight: 23,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  footer: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, minHeight: 20, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.42)' },
  dotActive: { width: 24, backgroundColor: colors.onImage },
  choices: { gap: spacing.sm },
});

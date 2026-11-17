import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import {
  opportunityUrgencyOptions,
  type OpportunityCategory,
  type OpportunityFilters,
  type OpportunityUrgency,
} from '../types/opportunity';
import { opportunityUrgencyTone } from '../utils/opportunity-format';

interface OpportunityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: OpportunityCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  filters: OpportunityFilters;
  onApply: (filters: OpportunityFilters) => void;
  onClear: () => void;
}

export function OpportunityFilterModal({
  visible,
  onClose,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  filters,
  onApply,
  onClear,
}: OpportunityFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [categoryId, setCategoryId] = useState<string | null>(filters.categoriaId);
  const [urgency, setUrgency] = useState<OpportunityUrgency | null>(filters.urgencia);

  useEffect(() => {
    if (visible) {
      setCategoryId(filters.categoriaId);
      setUrgency(filters.urgencia);
    }
  }, [filters.categoriaId, filters.urgencia, visible]);

  const hasSelections = Boolean(
    categoryId || urgency || filters.categoriaId || filters.urgencia
  );

  const handleApply = () => {
    onApply({ categoriaId: categoryId, urgencia: urgency });
    onClose();
  };

  const handleClear = () => {
    setCategoryId(null);
    setUrgency(null);
    onClear();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.overlay, { paddingTop: insets.top + spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar filtros"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Filtros</Text>
                <Text style={styles.subtitle}>
                  Se aplican solo sobre las oportunidades compatibles con tu perfil.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar filtros"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed ? styles.closePressed : null,
                ]}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Categoría</Text>
                {categoriesLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando categorías…</Text>
                  </View>
                ) : categoriesError ? (
                  <>
                    <InlineMessage message={categoriesError} />
                    <LinkButton
                      label="Reintentar categorías"
                      align="left"
                      onPress={onRetryCategories}
                    />
                  </>
                ) : categories.length === 0 ? (
                  <Text style={styles.emptyText}>No hay categorías disponibles.</Text>
                ) : (
                  <View style={styles.options}>
                    {categories.map((category) => {
                      const selected = category.id === categoryId;
                      return (
                        <Pressable
                          key={category.id}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={`Categoría ${category.nombre}`}
                          onPress={() => setCategoryId(selected ? null : category.id)}
                          style={[
                            styles.option,
                            selected ? styles.optionSelected : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionLabel,
                              selected ? styles.optionLabelSelected : null,
                            ]}
                          >
                            {category.nombre}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.group}>
                <Text style={styles.groupLabel}>Urgencia</Text>
                <View style={styles.options}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: urgency === null }}
                    accessibilityLabel="Todas las urgencias"
                    onPress={() => setUrgency(null)}
                    style={[
                      styles.option,
                      urgency === null ? styles.optionSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        urgency === null ? styles.optionLabelSelected : null,
                      ]}
                    >
                      Todas
                    </Text>
                  </Pressable>
                  {opportunityUrgencyOptions.map((option) => {
                    const selected = option.value === urgency;
                    const tone = opportunityUrgencyTone[option.value];
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`Urgencia ${option.label}`}
                        onPress={() => setUrgency(option.value)}
                        style={[
                          styles.option,
                          selected
                            ? { backgroundColor: tone.background, borderColor: tone.text }
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            selected ? { color: tone.text } : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <View style={styles.action}>
                <PrimaryButton
                  label="Limpiar"
                  variant="secondary"
                  onPress={handleClear}
                  disabled={!hasSelections}
                />
              </View>
              <View style={styles.action}>
                <PrimaryButton label="Aplicar filtros" onPress={handleApply} />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.sm,
    marginRight: -spacing.sm,
  },
  closePressed: {
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  optionLabel: {
    color: colors.neutral,
    fontSize: 13,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
  },
});

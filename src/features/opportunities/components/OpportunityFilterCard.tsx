import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { SelectField } from '../../../shared/ui/SelectField';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import {
  opportunityUrgencyOptions,
  type OpportunityCategory,
  type OpportunityUrgency,
} from '../types/opportunity';
import { opportunityUrgencyTone } from '../utils/opportunity-format';

interface OpportunityFilterCardProps {
  categories: OpportunityCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  categoryId: string | null;
  urgency: OpportunityUrgency | null;
  onCategoryChange: (value: string | null) => void;
  onUrgencyChange: (value: OpportunityUrgency | null) => void;
  onApply: () => void;
  onClear: () => void;
  hasFilters: boolean;
  disabled?: boolean;
}

export function OpportunityFilterCard({
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  categoryId,
  urgency,
  onCategoryChange,
  onUrgencyChange,
  onApply,
  onClear,
  hasFilters,
  disabled = false,
}: OpportunityFilterCardProps) {
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.nombre,
  }));

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Filtrar oportunidades</Text>
          <Text style={styles.subtitle}>
            Los filtros se aplican solo sobre las oportunidades compatibles con tu perfil.
          </Text>
        </View>
      </View>

      <SelectField
        label="Categoría"
        placeholder="Todas las categorías"
        value={categoryId}
        options={categoryOptions}
        onChange={onCategoryChange}
        hint={
          categoriesLoading
            ? 'Cargando categorías…'
            : categories.length === 0
              ? 'No hay categorías disponibles.'
              : 'Filtra por una categoría del catálogo.'
        }
        disabled={disabled || categoriesLoading || categories.length === 0}
      />

      {categoriesError ? (
        <>
          <InlineMessage message={categoriesError} />
          <LinkButton
            label="Reintentar categorías"
            align="left"
            onPress={onRetryCategories}
          />
        </>
      ) : null}

      <View style={styles.urgencyGroup}>
        <Text style={styles.groupLabel}>Urgencia</Text>
        <View style={styles.urgencyOptions}>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: urgency === null, disabled }}
            accessibilityLabel="Todas las urgencias"
            disabled={disabled}
            onPress={() => onUrgencyChange(null)}
            style={[
              styles.urgencyOption,
              urgency === null ? styles.urgencyOptionSelected : null,
            ]}
          >
            <Text
              style={[
                styles.urgencyLabel,
                urgency === null ? styles.urgencyLabelSelected : null,
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
                accessibilityState={{ checked: selected, disabled }}
                accessibilityLabel={`Urgencia ${option.label}`}
                disabled={disabled}
                onPress={() => onUrgencyChange(option.value)}
                style={[
                  styles.urgencyOption,
                  selected
                    ? { backgroundColor: tone.background, borderColor: tone.text }
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.urgencyLabel,
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

      <PrimaryButton
        label="Aplicar filtros"
        onPress={onApply}
        disabled={disabled}
      />
      {hasFilters ? (
        <LinkButton label="Limpiar filtros" align="left" onPress={onClear} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  urgencyGroup: {
    gap: spacing.xs,
  },
  groupLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  urgencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  urgencyOption: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    flexGrow: 1,
    flexBasis: '22%',
  },
  urgencyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  urgencyLabel: {
    color: colors.neutral,
    fontSize: 13,
    fontWeight: '600',
  },
  urgencyLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});

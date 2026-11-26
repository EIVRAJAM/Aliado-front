import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  MAX_REQUEST_PHOTOS,
  type LocalPhoto,
} from '../types/request';

interface PhotoAttachmentsProps {
  photos: LocalPhoto[];
  existingCount: number;
  onChange: (photos: LocalPhoto[]) => void;
  disabled?: boolean;
}

function extensionFor(type: string): string {
  if (type === 'image/png') {
    return 'png';
  }
  if (type === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

async function preparePhotoUri(uri: string, type: string, index: number): Promise<string> {
  if (!uri.startsWith('content://')) {
    return uri;
  }

  const destination = new File(
    Paths.cache,
    `f04-photo-${Date.now()}-${index + 1}.${extensionFor(type)}`
  );
  await new File(uri).copy(destination);
  return destination.uri;
}

function mimeFromFileName(fileName?: string | null): string | undefined {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  if (extension === 'png') {
    return 'image/png';
  }
  if (extension === 'webp') {
    return 'image/webp';
  }
  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg';
  }
  return undefined;
}

export function PhotoAttachments({
  photos,
  existingCount,
  onChange,
  disabled = false,
}: PhotoAttachmentsProps) {
  const [error, setError] = useState<string | null>(null);
  const remaining = Math.max(0, MAX_REQUEST_PHOTOS - existingCount - photos.length);

  const pickPhotos = async () => {
    if (disabled || remaining === 0) {
      return;
    }

    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permite el acceso a tus fotos para adjuntarlas a la solicitud.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: Platform.OS === 'android' ? 1 : 0.8,
      });

      if (result.canceled) {
        return;
      }

      const accepted: LocalPhoto[] = [];
      const rejected: string[] = [];
      const selectedAssets = result.assets.slice(0, remaining);

      for (const [index, asset] of selectedAssets.entries()) {
        const type = (asset.mimeType ?? mimeFromFileName(asset.fileName) ?? '').toLowerCase();
        const name =
          asset.fileName ??
          `foto-${Date.now()}-${index + 1}.${extensionFor(type || 'image/jpeg')}`;

        if (!ALLOWED_PHOTO_TYPES.includes(type)) {
          rejected.push(`${name}: formato no compatible`);
          continue;
        }

        if (asset.fileSize !== undefined && asset.fileSize > MAX_PHOTO_BYTES) {
          rejected.push(`${name}: supera 5 MB`);
          continue;
        }

        try {
          const uri = await preparePhotoUri(asset.uri, type, index);
          accepted.push({
            uri,
            name,
            type,
            size: asset.fileSize,
          });
        } catch {
          rejected.push(`${name}: no se pudo preparar la imagen`);
        }
      }

      if (result.assets.length > remaining) {
        rejected.push(`solo puedes adjuntar ${remaining} foto(s) más`);
      }

      if (accepted.length > 0) {
        onChange([...photos, ...accepted]);
      }

      if (rejected.length > 0) {
        setError(`No se agregaron: ${rejected.join('; ')}.`);
      }
    } catch {
      setError('No fue posible abrir o preparar las fotos. Intenta de nuevo.');
    }
  };

  const removePhoto = (index: number) => {
    if (disabled) {
      return;
    }
    onChange(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="images-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Fotos</Text>
            <View style={styles.optionalPill}>
              <Text style={styles.optionalText}>Opcional</Text>
            </View>
          </View>
          <Text style={styles.hint}>Ayudan a entender mejor el trabajo que necesitas.</Text>
        </View>
        <Text style={styles.count}>
          {existingCount + photos.length}/{MAX_REQUEST_PHOTOS}
        </Text>
      </View>

      <Text style={styles.limit}>
        Hasta 10 imágenes JPG, PNG o WebP de 5 MB cada una.
      </Text>

      {existingCount > 0 ? (
        <InlineMessage
          variant="info"
          message={`La solicitud ya tiene ${existingCount} ${
            existingCount === 1 ? 'foto' : 'fotos'
          }. Puedes agregar nuevas imágenes.`}
        />
      ) : null}

      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.thumbnails}>
            {photos.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} style={styles.thumbnail}>
                <Image source={{ uri: photo.uri }} style={styles.image} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${photo.name}`}
                  disabled={disabled}
                  onPress={() => removePhoto(index)}
                  style={styles.remove}
                >
                  <Ionicons name="close" size={15} color={colors.surface} />
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {error ? <InlineMessage message={error} /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={remaining > 0 ? 'Agregar fotos' : 'Límite de fotos alcanzado'}
        disabled={disabled || remaining === 0}
        onPress={() => {
          void pickPhotos();
        }}
        style={({ pressed }) => [
          styles.addButton,
          pressed && !disabled && remaining > 0 ? styles.addPressed : null,
          disabled || remaining === 0 ? styles.addDisabled : null,
        ]}
      >
        <Ionicons
          name={remaining > 0 ? 'add-circle-outline' : 'checkmark-circle-outline'}
          size={20}
          color={remaining > 0 ? colors.primary : colors.muted}
        />
        <Text style={[styles.addText, remaining === 0 ? styles.addTextMuted : null]}>
          {remaining > 0 ? 'Agregar fotos' : 'Límite de fotos alcanzado'}
        </Text>
      </Pressable>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  optionalPill: {
    backgroundColor: colors.neutralSurface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  optionalText: {
    color: colors.neutral,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  limit: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  thumbnails: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbnail: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addPressed: {
    backgroundColor: '#DBEAFE',
  },
  addDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  addText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  addTextMuted: {
    color: colors.muted,
  },
});

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permite el acceso a tus fotos para adjuntarlas a la solicitud.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const accepted: LocalPhoto[] = [];
    const rejected: string[] = [];

    result.assets.slice(0, remaining).forEach((asset, index) => {
      const type = (asset.mimeType ?? mimeFromFileName(asset.fileName) ?? '').toLowerCase();
      const name =
        asset.fileName ??
        `foto-${Date.now()}-${index + 1}.${extensionFor(type || 'image/jpeg')}`;

      if (!ALLOWED_PHOTO_TYPES.includes(type)) {
        rejected.push(`${name}: formato no compatible`);
        return;
      }

      if (asset.fileSize !== undefined && asset.fileSize > MAX_PHOTO_BYTES) {
        rejected.push(`${name}: supera 5 MB`);
        return;
      }

      accepted.push({
        uri: asset.uri,
        name,
        type,
        size: asset.fileSize,
      });
    });

    if (result.assets.length > remaining) {
      rejected.push(`solo puedes adjuntar ${remaining} foto(s) más`);
    }

    if (accepted.length > 0) {
      onChange([...photos, ...accepted]);
    }

    if (rejected.length > 0) {
      setError(`No se agregaron: ${rejected.join('; ')}.`);
    }
  };

  const removePhoto = (index: number) => {
    if (disabled) {
      return;
    }
    onChange(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Fotos (opcional)</Text>
        <Text style={styles.count}>
          {existingCount + photos.length}/{MAX_REQUEST_PHOTOS}
        </Text>
      </View>
      <Text style={styles.hint}>
        Hasta 10 imágenes JPG, PNG o WebP de 5 MB cada una. Las fotos no son obligatorias
        para publicar.
      </Text>
      {existingCount > 0 ? (
        <InlineMessage
          variant="info"
          message={`La solicitud ya tiene ${existingCount} ${
            existingCount === 1 ? 'foto' : 'fotos'
          }. Solo puedes agregar nuevas; reemplazar o eliminar fotos existentes no está disponible porque el contrato no expone sus identificadores.`}
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
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
      {error ? <InlineMessage message={error} /> : null}
      <PrimaryButton
        label={remaining > 0 ? 'Agregar fotos' : 'Límite de fotos alcanzado'}
        variant="secondary"
        onPress={() => {
          void pickPhotos();
        }}
        disabled={disabled || remaining === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
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
  removeText: {
    color: colors.surface,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
  },
});

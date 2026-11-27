import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { opportunitiesGateway } from '../services/opportunities-gateway-instance';
import type { OpportunityPhotoReference } from '../types/opportunity';

interface OpportunityPhotoGalleryProps {
  requestId: string;
  photos: OpportunityPhotoReference[];
  token: string;
}

export function OpportunityPhotoGallery({ requestId, photos, token }: OpportunityPhotoGalleryProps) {
  const [selected, setSelected] = useState<OpportunityPhotoReference | null>(null);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const orderedPhotos = [...photos].sort((a, b) => a.orden - b.orden);

  if (orderedPhotos.length === 0) {
    return (
      <Card style={styles.unavailable}>
        <Ionicons name="images-outline" size={20} color={colors.muted} />
        <Text style={styles.unavailableText}>
          Las fotos todavía no están disponibles para esta solicitud.
        </Text>
      </Card>
    );
  }

  const imageSource = (photoId: string) => ({
    uri: opportunitiesGateway.photoUrl(requestId, photoId),
    headers: { Authorization: `Bearer ${token}` },
  });

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.iconBadge}>
          <Ionicons name="images-outline" size={17} color={colors.primary} />
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>Fotos</Text>
          <Text style={styles.subtitle}>Toca una imagen para verla completa.</Text>
        </View>
        <Text style={styles.count}>{orderedPhotos.length}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {orderedPhotos.map((photo, index) => (
          <Pressable
            key={photo.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver foto ${index + 1}`}
            onPress={() => setSelected(photo)}
            style={({ pressed }) => [styles.thumbnail, pressed ? styles.pressed : null]}
          >
            {failed.has(photo.id) ? (
              <View style={styles.failed}>
                <Ionicons name="image-outline" size={28} color={colors.muted} />
                <Text style={styles.failedText}>No disponible</Text>
              </View>
            ) : (
              <Image
                source={imageSource(photo.id)}
                style={styles.image}
                resizeMode="cover"
                onError={() => setFailed((current) => new Set(current).add(photo.id))}
              />
            )}
            <View style={styles.imageIndex}>
              <Text style={styles.imageIndexText}>{index + 1}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar foto"
            onPress={() => setSelected(null)}
            style={styles.close}
          >
            <Ionicons name="close" size={25} color={colors.surface} />
          </Pressable>
          {selected && !failed.has(selected.id) ? (
            <Image
              source={imageSource(selected.id)}
              style={styles.fullImage}
              resizeMode="contain"
              onError={() => setFailed((current) => new Set(current).add(selected.id))}
            />
          ) : (
            <View style={styles.fullFailed}>
              <Ionicons name="image-outline" size={42} color={colors.surface} />
              <Text style={styles.fullFailedText}>No fue posible cargar esta foto.</Text>
            </View>
          )}
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  unavailable: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unavailableText: { color: colors.muted, flex: 1, fontSize: 14, lineHeight: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBadge: {
    width: 34, height: 34, borderRadius: radii.md, backgroundColor: colors.infoSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  headingText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 12 },
  count: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  list: { gap: spacing.sm },
  thumbnail: { width: 196, height: 142, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.neutralSurface },
  pressed: { opacity: 0.86 },
  image: { width: '100%', height: '100%' },
  failed: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  failedText: { color: colors.muted, fontSize: 12 },
  imageIndex: {
    position: 'absolute', right: spacing.sm, bottom: spacing.sm, minWidth: 24, height: 24,
    borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.72)', alignItems: 'center', justifyContent: 'center',
  },
  imageIndexText: { color: colors.surface, fontSize: 12, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', alignItems: 'center' },
  close: {
    position: 'absolute', zIndex: 1, top: 44, right: 18, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  fullImage: { width: '100%', height: '82%' },
  fullFailed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  fullFailedText: { color: colors.surface, fontSize: 15, textAlign: 'center' },
});

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { wardrobeApi } from '../../api';
import { ApiError } from '../../api/client';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Toast } from '../../components/Toast';
import { UpgradeModal } from '../../components/UpgradeModal';
import { colors, radius, spacing, typography } from '../../theme';

type PickedAsset = { uri: string; fileName: string; mimeType: string };

export function AddItemScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [image, setImage] = useState<PickedAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const pick = async (fromCamera: boolean) => {
    setError(null);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const upload = async () => {
    if (!image) return;
    setUploading(true);
    setError(null);
    try {
      await wardrobeApi.create(image);
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      setImage(null);
      setToast('Eklendi');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'wardrobe_limit_reached') {
        setUpgradeVisible(true);
      } else {
        setError(e instanceof ApiError ? e.message : 'Yükleme başarısız oldu.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Kıyafet Ekle</Text>
        <View style={styles.headerButton} />
      </View>

      {!image ? (
        <View style={styles.sourceContainer}>
          <Text style={styles.prompt}>Parçanın fotoğrafını nasıl eklemek istersin?</Text>
          <View style={styles.sources}>
            <SourceButton icon="camera-outline" label="Kamera" onPress={() => pick(true)} />
            <SourceButton icon="images-outline" label="Galeri" onPress={() => pick(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.preview} contentFit="contain" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.previewActions}>
            <Button label="Vazgeç" variant="secondary" onPress={() => setImage(null)} style={styles.action} />
            <Button label="Yükle" onPress={upload} loading={uploading} style={styles.action} />
          </View>
        </View>
      )}

      <Toast message={toast} />
      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        onUpgrade={() => {
          setUpgradeVisible(false);
          navigation.navigate('Packages' as never);
        }}
        title="Dolap limiti doldu"
        message="Free pakette 5 parça sınırına ulaştın. Sınırsız parça için premium'a yükselt."
      />
    </Screen>
  );
}

function SourceButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.source} onPress={onPress}>
      <Ionicons name={icon} size={32} color={colors.textPrimary} />
      <Text style={styles.sourceLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subtitle,
  },
  sourceContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  prompt: {
    ...typography.title,
  },
  sources: {
    gap: spacing.md,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  sourceLabel: {
    ...typography.subtitle,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  preview: {
    flex: 1,
    borderRadius: radius.card,
    backgroundColor: colors.hairline,
  },
  error: {
    ...typography.bodySecondary,
    color: colors.danger,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
});

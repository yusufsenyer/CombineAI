import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { AppStackParamList } from '../../navigation/types';
import { prepareImageForUpload } from '../../utils/imageUpload';
import { colors, radius, spacing, typography } from '../../theme';

type PickedAsset = {
  uri: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
};
type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function AddItemScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();

  const [asset, setAsset] = useState<PickedAsset | null>(null);
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
      const picked = result.assets[0];
      const next: PickedAsset = {
        uri: picked.uri,
        fileName: picked.fileName ?? null,
        mimeType: picked.mimeType ?? null,
        fileSize: picked.fileSize ?? null,
        width: picked.width ?? null,
        height: picked.height ?? null,
      };
      if (__DEV__) {
        console.log(`[UPLOAD] picked asset: ${JSON.stringify(next)}`);
      }
      setAsset(next);
    }
  };

  const upload = async () => {
    if (!asset) return;
    setUploading(true);
    setError(null);
    try {
      const prepared = await prepareImageForUpload(asset);
      if (__DEV__) {
        console.log(
          `[UPLOAD] prepared (jpeg) file=${prepared.fileName} uri=${prepared.uri} ` +
            `size=${prepared.width}x${prepared.height} srcBytes=${asset.fileSize ?? '?'}`,
        );
      }
      await wardrobeApi.create(prepared);
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      setAsset(null);
      setToast('Eklendi');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'wardrobe_limit_reached') {
        setUpgradeVisible(true);
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        if (__DEV__) {
          const err = e as Error;
          const stack = (err?.stack ?? '').split('\n').slice(0, 6).join('\n');
          console.log(
            `[UPLOAD] network error — method=FormData uri=${asset.uri} ` +
              `srcBytes=${asset.fileSize ?? '?'} name=${asset.fileName ?? '?'} type=${asset.mimeType ?? '?'} ` +
              `errName=${err?.name ?? '?'} errMessage=${err?.message ?? String(e)}\n${stack}`,
          );
        }
        setError('Fotoğraf yüklenemedi, tekrar dene.');
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

      {!asset ? (
        <View style={styles.sourceContainer}>
          <Text style={styles.prompt}>Parçanın fotoğrafını nasıl eklemek istersin?</Text>
          <View style={styles.sources}>
            <SourceButton icon="camera-outline" label="Kamera" onPress={() => pick(true)} />
            <SourceButton icon="images-outline" label="Galeri" onPress={() => pick(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: asset.uri }} style={styles.preview} contentFit="contain" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.previewActions}>
            <Button label="Vazgeç" variant="secondary" onPress={() => setAsset(null)} style={styles.action} />
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
          navigation.navigate('Packages');
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

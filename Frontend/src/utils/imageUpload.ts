import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface ImageAssetInput {
  uri: string;
  width?: number | null;
  height?: number | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

export interface PreparedImage {
  uri: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
}

// Long edge cap and JPEG quality keep uploads small (avoids slow/failed requests on mobile data).
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Re-encodes a picked image into a clean, downscaled JPEG written to the app cache and returns a
 * fresh `file://` uri to upload. This normalizes the source (HEIC/PNG/WebP, messy or unreadable
 * picker uris) into something React Native's multipart uploader can always read, and shrinks size.
 */
export async function prepareImageForUpload(asset: ImageAssetInput): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(asset.uri);

  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  if (width > 0 && height > 0 && Math.max(width, height) > MAX_DIMENSION) {
    if (width >= height) {
      context.resize({ width: MAX_DIMENSION });
    } else {
      context.resize({ height: MAX_DIMENSION });
    }
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });

  return {
    uri: result.uri,
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
    width: result.width,
    height: result.height,
  };
}

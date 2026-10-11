import { File, UploadType } from 'expo-file-system';

import { tokenStorage } from '../auth/tokenStorage';
import { API_V1_URL } from '../config/env';

// TEMPORARY diagnostics used to compare upload methods on-device (see task step 3).
// Only invoked from a __DEV__-only button; safe to delete once the working method is confirmed.

type DiagInput = { uri: string; mimeType: string; fileName: string };

export async function runUploadDiagnostics({ uri, mimeType, fileName }: DiagInput): Promise<void> {
  const token = (await tokenStorage.getAccessToken()) ?? '';
  const url = `${API_V1_URL}/wardrobe/items`;
  const auth = { Authorization: `Bearer ${token}` };

  const run = async (label: string, fn: () => Promise<string>) => {
    const started = Date.now();
    let outcome: string;
    try {
      outcome = await fn();
    } catch (e) {
      const err = e as Error;
      outcome = `ERROR ${err?.name ?? 'Error'}: ${err?.message ?? String(e)}`;
    }
    console.log(`[UPLOAD-DIAG] ${label} -> ${outcome} (${Date.now() - started}ms)`);
  };

  // A) text-only multipart (no file) — expect HTTP 422 missing_image
  await run('A text-only', async () => {
    const form = new FormData();
    form.append('note', 'diag');
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...auth, 'X-Debug-Test': 'A' },
      body: form,
    });
    return `HTTP ${res.status}`;
  });

  // B) current method: FormData + RN-style { uri, name, type } — expected to throw on expo/fetch
  await run('B FormData {uri,name,type}', async () => {
    const form = new FormData();
    form.append('image', { uri, name: fileName, type: mimeType } as unknown as Blob);
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...auth, 'X-Debug-Test': 'B' },
      body: form,
    });
    return `HTTP ${res.status}`;
  });

  // C) expo-file-system native multipart uploader
  await run('C File.upload(MULTIPART)', async () => {
    const file = new File(uri);
    const result = await file.upload(url, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'image',
      mimeType,
      headers: { ...auth, 'X-Debug-Test': 'C' },
    });
    return `HTTP ${result.status}`;
  });

  // D) expo-file-system File appended to FormData (serialized via its bytes())
  await run('D FormData + File', async () => {
    const form = new FormData();
    form.append('image', new File(uri) as unknown as Blob);
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...auth, 'X-Debug-Test': 'D' },
      body: form,
    });
    return `HTTP ${res.status}`;
  });
}

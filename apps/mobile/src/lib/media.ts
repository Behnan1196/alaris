import { localDate, type Json } from '@alaris/shared';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { supabase } from './supabase';

export type PhotoKind = 'meal' | 'front' | 'side' | 'other';

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Dosyayı Storage'a yükler. React Native'de dosyayı bellekten (ArrayBuffer) göndermek iOS'ta
 * 520 hatasına yol açtı; supabase-js'in FormData yolu da RN FormData'sında çalışmıyor.
 * Bu yüzden dosya adresiyle çok parçalı (multipart) istek doğrudan gönderilir; RN dosyayı akıtır.
 */
async function uploadFile(path: string, uri: string, contentType: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Oturum bulunamadı, yeniden giriş yap.');
  const form = new FormData();
  form.append('cacheControl', '3600');
  form.append('', { uri, name: path.split('/').pop()!, type: contentType } as unknown as Blob);
  const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/media/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      'x-upsert': 'false',
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fotoğraf yüklenemedi (${res.status}) ${text.slice(0, 120)}`);
  }
}

/** Kamera mı galeri mi diye sorar; seçilen fotoğrafın yerel adresini döndürür. */
function chooseSource(): Promise<'camera' | 'library' | null> {
  return new Promise((resolve) =>
    Alert.alert('Fotoğraf ekle', undefined, [
      { text: 'Kamera', onPress: () => resolve('camera') },
      { text: 'Galeri', onPress: () => resolve('library') },
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(null) },
    ]),
  );
}

async function pickImage() {
  const source = await chooseSource();
  if (!source) return null;
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('İzin gerekli', 'Ayarlar’dan Alaris için izin verebilirsin.');
    return null;
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, exif: false };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets[0]) return null;
  return res.assets[0];
}

/**
 * Fotoğraf seçtirir, gizli depoya yükler ve `photos` kaydını oluşturur.
 * Yol: <client_id>/<coaching_id | self>/<id>.jpg (erişim kuralları bu yola göre).
 */
export async function addPhoto(input: {
  clientId: string;
  coachingId: string | null;
  kind: PhotoKind;
  taskInstanceId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const asset = await pickImage();
  if (!asset) return null;
  const path = `${input.clientId}/${input.coachingId ?? 'self'}/${randomId()}.jpg`;
  await uploadFile(path, asset.uri, asset.mimeType ?? 'image/jpeg');
  const { data, error } = await supabase
    .from('photos')
    .insert({
      client_id: input.clientId,
      coaching_id: input.coachingId,
      task_instance_id: input.taskInstanceId ?? null,
      kind: input.kind,
      path,
      meta: (input.meta ?? {}) as Json,
      taken_on: localDate(),
    })
    .select('id, kind, path, meta')
    .single();
  if (error) {
    await supabase.storage.from('media').remove([path]);
    throw error;
  }
  return { ...data, url: asset.uri };
}

/** Süreli (1 saat) görüntüleme bağlantıları. */
export async function signedUrls(paths: string[]) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from('media').createSignedUrls(paths, 3600);
  return new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path!, d.signedUrl]));
}

export async function photosOfInstance(instanceId: string) {
  const { data } = await supabase
    .from('photos')
    .select('id, kind, path, meta')
    .eq('task_instance_id', instanceId)
    .order('created_at');
  const urls = await signedUrls((data ?? []).map((p) => p.path));
  return (data ?? []).map((p) => ({ ...p, url: urls.get(p.path) ?? null }));
}

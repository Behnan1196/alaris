# 13. Yayın: Vercel (koç paneli) ve TestFlight (danışan uygulaması)

Hazırlık: 27 Kasım 2026. Hesap adımlarını Behnan yapar; kod tarafı hazır.

## A. Koç paneli → Vercel

1. https://vercel.com → **Add New → Project** → GitHub'dan `Behnan1196/alaris` deposunu seç (Vercel'in GitHub erişimi istenirse ver).
2. **Root Directory:** `apps/web` (Edit ile seç). Framework otomatik **Next.js** gelir. Install / Build komutlarını değiştirme: Vercel kökteki `package-lock.json` ile npm workspaces'i kurar.
3. **Environment Variables** (Production ve Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wionwxwflclxtusvfdld.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `.env.local` içindeki `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` değeri (herkese açık anahtar; gizli **secret** anahtarı asla girme)
4. **Deploy**. Bitince adres `https://<proje>.vercel.app` olur (ileride kendi alan adın eklenebilir).
5. Supabase paneli → **Authentication → URL Configuration**:
   - **Site URL:** Vercel adresi (ör. `https://alaris.vercel.app`)
   - **Redirect URLs:** `https://<vercel-adresi>/**` ve geliştirme için `http://localhost:3000/**`
6. Deneme: Vercel adresinde koç girişi, danışan sayfası, mesajlar, kütüphane.

Sonraki her `main` push'u Vercel'de otomatik yayınlanır.

## B. Danışan uygulaması → TestFlight

Hazır olanlar: `apps/mobile/eas.json` içinde `production` profili (sürüm numarası otomatik artar), Supabase değişkenleri EAS'ta `production` ve `preview` ortamlarında, paket kimliği `com.behnan.alaris`, şifreleme beyanı (`ITSAppUsesNonExemptEncryption: false`), bildirim anahtarı (geliştirme derlemesinde kuruldu).

1. `apps/mobile` içinde:
   ```
   npx eas-cli@latest build --profile production --platform ios --auto-submit
   ```
   Apple hesabınla giriş ister; dağıtım sertifikası ve profil oluşturmayı kabul et. `--auto-submit` derleme bitince App Store Connect'e yükler; uygulama kaydı yoksa oluşturmayı önerir.
2. App Store Connect'te uygulama adı benzersiz olmalı. "Alaris" alınmışsa ör. "Alaris Koçluk" kullan (uygulama içindeki ad değişmez).
3. Yükleme sonrası Apple işlemesi 10-30 dk. App Store Connect → **TestFlight** → kendini **Internal Testing** grubuna ekle; iPhone'daki TestFlight uygulamasından kur.
4. Harici test (başkalarına dağıtım) için TestFlight bilgileri ve Apple incelemesi gerekir; önce gizlilik politikası adresi lazım (bkz. aşağı).

Not: Production derlemesi JavaScript'i içinde taşır, bilgisayardaki dev server'a ihtiyaç duymaz. Kod değişince yeni bir production derlemesi alınır (ileride `eas update` ile derlemesiz güncelleme eklenebilir).

## Yayından önce açık konular

- Supabase **Confirm email** geliştirme için kapalı; gerçek kullanıcılardan önce açılmalı ve e-posta gönderimi için özel SMTP (ör. Resend) ayarlanmalı.
- KVKK aydınlatma metni ve gizlilik politikası taslak; hukuki gözden geçirme ve herkese açık bir adres (App Store için gerekli).
- Supabase projesi `ap-northeast-2` (Seul) bölgesinde; KVKK yurt dışı aktarım değerlendirmesi (açık soru 1).
- Ödeme / koç aboneliği (8. adım) henüz yok.

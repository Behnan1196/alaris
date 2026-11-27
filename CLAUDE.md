# Alaris: geliştirici notu (Claude için)

Bu klasör Alaris'in ana çalışma klasörüdür. Ürünle ilgili **tek doğru kaynak `docs/` klasörüdür**. Kod yazmadan önce ilgili belgeyi oku; bir karar değişirse önce belgeyi güncelle, sonra kodu.

## Hızlı özet

Alaris, birden çok alanda (fitness, beslenme, sınav koçluğu, gitar ve ileride diğerleri) koç ile danışanı buluşturan bir koçluk platformudur.

- **Danışan uygulaması** (mobil): ücretsiz. Ana ekran "Koçluklarım": her koçluk alanı için bir widget. Ayrıca "Alışkanlıklarım", "Mesajlar", "İlerleme".
- **Koç paneli** (web): danışan yönetimi, haftalık program oluşturucu, kütüphane, mesajlar. Koç tek bir aylık/yıllık abonelik öder.
- **MVP:** Fitness ve Beslenme. Sınav ve Gitar yalnızca yer tutucu.

## Teknik yığın [KARAR, 26 Kasım 2026]

- **Koç paneli (web):** Next.js (TypeScript)
- **Danışan uygulaması (mobil):** Expo / React Native (TypeScript); derleme ileride EAS ile
- **Arka uç:** Supabase (Postgres, Auth, Storage, Realtime, Row Level Security)
- Ayrıntılar ve açık teknik konular: `docs/11-teknik-yigin.md`

## Belgeler

| Dosya | İçerik |
|---|---|
| [docs/README.md](docs/README.md) | Belge dizini ve işaretlerin anlamı |
| [docs/01-vizyon.md](docs/01-vizyon.md) | Ürün vizyonu, hedef kitle, ilham alınan ürünler |
| [docs/02-roller.md](docs/02-roller.md) | Danışan, koç, (ileride) yönetici rolleri ve ilişkileri |
| [docs/03-alanlar-ve-gorevler.md](docs/03-alanlar-ve-gorevler.md) | Koçluk alanları, görev tipleri, alışkanlıklar |
| [docs/04-danisan-uygulamasi.md](docs/04-danisan-uygulamasi.md) | Mobil ekranlar ve akışlar |
| [docs/05-koc-paneli.md](docs/05-koc-paneli.md) | Web paneli ekranları ve akışlar |
| [docs/06-veri-modeli.md](docs/06-veri-modeli.md) | Varlıklar ve ilişkiler (taslak) |
| [docs/07-fiyatlandirma.md](docs/07-fiyatlandirma.md) | İş modeli |
| [docs/08-gizlilik-kvkk.md](docs/08-gizlilik-kvkk.md) | Rıza, görünürlük, KVKK |
| [docs/09-mvp-kapsami.md](docs/09-mvp-kapsami.md) | MVP'de olan / olmayan |
| [docs/10-acik-sorular.md](docs/10-acik-sorular.md) | Cevap bekleyen sorular |
| [docs/11-teknik-yigin.md](docs/11-teknik-yigin.md) | Next.js + Expo + Supabase kararları |
| [docs/12-yol-haritasi.md](docs/12-yol-haritasi.md) | Kilometre taşları (öneri) |
| [docs/13-yayin.md](docs/13-yayin.md) | Vercel ve TestFlight yayın adımları |
| [docs/14-panel-arayuz.md](docs/14-panel-arayuz.md) | Koç paneli arayüzü: Everfit/Hubfit kalıpları ve öneri |
| [docs/karar-gunlugu.md](docs/karar-gunlugu.md) | Alınan kararlar, tarihleriyle |
| [docs/mockups/](docs/mockups/) | Onaylı mockup'ların HTML yedekleri |

## Çalışma kuralları

- Kullanıcı (Behnan) Türkçe yazar. Belgeler, arayüz metinleri ve commit dışı yazışmalar Türkçe.
- Kod içi isimler (değişken, tablo, API) İngilizce olabilir.
- Arayüz Türkçe + İngilizce (27 Kasım 2026). Arayüze sabit metin yazılmaz: yeni metin önce `packages/shared/src/i18n/tr.ts`e, aynı anahtarla `en.ts`e eklenir; bileşende `t("anahtar")` kullanılır.
- Belgede **[VARSAYIM]** ile işaretli bir şeyi kesinmiş gibi uygulamadan önce kullanıcıya sor ya da varsayımı açıkça belirterek ilerle.
- Yeni bir karar alındığında `docs/karar-gunlugu.md` dosyasına tarihli satır ekle; ilgili belgeyi de güncelle.
- Onay (26 Kasım 2026, Behnan): GitHub'a push, Supabase migration'ları ve Edge Function yüklemesi için ayrıca onay istenmez. Geri alınamayan işler (veri silme, üretim verisini değiştiren toplu işlem, proje dışına mesaj) yine sorulur.
- Proje kurulunca bu dosyaya "Komutlar" bölümü (kurulum, çalıştırma, test, derleme) ekle.
- Monorepo iskeleti kuruldu (26 Kasım 2026); yol haritası `docs/12-yol-haritasi.md`.

## Depo yapısı

npm workspaces ile tek depo (monorepo). GitHub: https://github.com/Behnan1196/alaris

```
apps/web         Koç paneli: Next.js 16 (App Router, Tailwind), paket adı @alaris/web
apps/mobile      Danışan uygulaması: Expo SDK 58 (Expo Router), paket adı @alaris/mobile
packages/shared  Ortak tipler ve sabitler (alanlar, görev tipleri), @alaris/shared
supabase/        Supabase CLI yapılandırması, migrations/, seed.sql
scripts/         Yardımcı betikler (sync-env.mjs)
```

Not: `apps/web/AGENTS.md` ve `apps/mobile/AGENTS.md` sürüm notları içerir. Next.js 16 ve Expo SDK 58 API'leri eğitim verisinden farklı olabilir; kod yazmadan önce `node_modules/next/dist/docs/` ve https://docs.expo.dev/versions/v58.0.0/ okunmalı.

## Ortam değişkenleri

- Tek kaynak kökteki `.env.local` (gitignore'da; asla commit edilmez, değerleri ekrana yazılmaz). Örnek: `.env.example`.
- `npm run env:sync` bunu `apps/mobile/.env.local` (EXPO_PUBLIC_*) ve `apps/web/.env.local` (NEXT_PUBLIC_*) olarak dağıtır. `dev:*` ve `build:web` komutları bunu otomatik çalıştırır.

## Komutlar

Kök klasörde çalıştırılır (Node 20+, npm).

| Komut | Ne yapar |
|---|---|
| `npm install` | Tüm çalışma alanlarının bağımlılıklarını kurar |
| `npm run dev:web` | Koç panelini http://localhost:3000 adresinde açar |
| `npm run dev:mobile` | Expo geliştirme sunucusunu açar. iPhone'daki geliştirme derlemesi (Alaris) aynı Wi-Fi'da bu sunucuya bağlanır |
| `npm run dev:mobile:tunnel` | Aynı ağda bağlanılamıyorsa sunucuyu internet tüneliyle açar |
| `npm run build:web` | Koç panelinin üretim derlemesi |
| `npm run typecheck` | Tüm paketlerde TypeScript denetimi |
| `npm run lint` | Tüm paketlerde lint |
| `npm run test:db` | Migration'ları PGlite (Docker'sız Postgres) üzerinde kurar, RLS ve RPC testlerini çalıştırır |
| `npm run db:push` | Migration'ları bağlı Supabase projesine uygular |
| `npm run functions:deploy` | `notify` Edge Function'ını yükler |
| `npm run db:exercises` | `supabase/data/exercises.json`dan sistem hareket kütüphanesi migration'ı üretir (sonra `db:push`) |
| `npm run db:types` | Uzak şemadan `packages/shared/src/database.types.ts` üretir |
| `npx supabase ...` | Supabase CLI (yerel geliştirme Docker ister) |
| `cd apps/mobile && npx eas-cli@latest build --profile development --platform ios` | iPhone geliştirme derlemesi (EAS projesi @behnan/alaris) |
| `cd apps/mobile && npx eas-cli@latest build --profile production --platform ios --auto-submit` | TestFlight için production derlemesi ve yükleme (Supabase değişkenleri EAS `production` ortamında) |
| `cd apps/mobile && npx expo install <paket>` | Mobil pakete SDK uyumlu bağımlılık ekler |

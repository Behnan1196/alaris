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
| [docs/karar-gunlugu.md](docs/karar-gunlugu.md) | Alınan kararlar, tarihleriyle |
| [docs/mockups/](docs/mockups/) | Onaylı mockup'ların HTML yedekleri |

## Çalışma kuralları

- Kullanıcı (Behnan) Türkçe yazar. Belgeler, arayüz metinleri ve commit dışı yazışmalar Türkçe.
- Kod içi isimler (değişken, tablo, API) İngilizce olabilir; arayüz metni Türkçe kalır. [VARSAYIM]
- Belgede **[VARSAYIM]** ile işaretli bir şeyi kesinmiş gibi uygulamadan önce kullanıcıya sor ya da varsayımı açıkça belirterek ilerle.
- Yeni bir karar alındığında `docs/karar-gunlugu.md` dosyasına tarihli satır ekle; ilgili belgeyi de güncelle.
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
| `npm run dev:mobile` | Expo geliştirme sunucusunu açar (Expo Go veya web ile) |
| `npm run build:web` | Koç panelinin üretim derlemesi |
| `npm run typecheck` | Tüm paketlerde TypeScript denetimi |
| `npm run lint` | Tüm paketlerde lint |
| `npx supabase ...` | Supabase CLI (yerel geliştirme Docker ister). Uzak projeye migration uygulamadan önce kullanıcıya sorulur. |
| `cd apps/mobile && npx expo install <paket>` | Mobil pakete SDK uyumlu bağımlılık ekler |

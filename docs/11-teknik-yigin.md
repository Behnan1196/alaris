# 11. Teknik yığın

Karar tarihi: 26 Kasım 2026. [KARAR]

| Parça | Teknoloji | Not |
|---|---|---|
| Koç paneli (web) | Next.js, TypeScript | |
| Danışan uygulaması (mobil) | Expo / React Native, TypeScript | iOS ve Android derlemeleri ileride EAS ile |
| Arka uç | Supabase | Postgres, Auth, Storage (fotoğraf, video, ses), Realtime (mesajlar), Row Level Security |

## Bu kararın getirdikleri [VARSAYIM]

- Mobil ve web aynı dili (TypeScript) kullandığı için tipler ve doğrulama kuralları ortak bir pakette paylaşılabilir. Tek depo (monorepo) yapısı önerilir: `apps/web`, `apps/mobile`, `packages/shared`, `supabase/` (migrations, seed).
- Koçlar arası görünürlük ve rıza kuralları (`08-gizlilik-kvkk.md`) veri tabanı seviyesinde Row Level Security politikalarıyla uygulanır; yalnızca arayüzde gizlemek yeterli sayılmaz.
- Koç aboneliğinin ödeme sağlayıcısı henüz seçilmedi (bkz. `10-acik-sorular.md`).

## Açık teknik konular

- Supabase projesinin bölgesi ve KVKK açısından verinin nerede tutulacağı.
- Video barındırma: Supabase Storage mı, ayrı bir video servisi mi.
- ~~Kod deposu~~: GitHub `Behnan1196/alaris`, npm workspaces ile tek depo. [KARAR]

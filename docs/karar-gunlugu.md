# Karar günlüğü

Yeni kararı en alta, tarihiyle ekle.

| Tarih | Karar |
|---|---|
| 2026-11-26 | Danışan ana ekranı "Koçluklarım": alan başına görselli widget; widget bugünün işini başlatır veya kaldığı yerden devam ettirir. Ayrı "Bugün" sekmesi yok. Alt menü: Koçluklarım, Mesajlar, İlerleme. |
| 2026-11-26 | "Alışkanlıklarım" modülü: koçun atadığı ve danışanın kendi alışkanlıkları. |
| 2026-11-26 | Fitness ve Beslenme ayrı alanlardır; aynı koç ikisini verse de ayrı widget. Beslenme tek başına bir alan olabilir (diyetisyen). |
| 2026-11-26 | Mesajlaşma koç başına tek sohbet. |
| 2026-11-26 | Bir koç birden çok alanda hizmet verebilir; danışana kendi alanlarının bir alt kümesini verir. |
| 2026-11-26 | Danışan ücretsiz. İleride ücretli danışan katmanı yalnızca mobil uygulamada (ör. kendi programını oluşturma); danışana koç paneli yok. |
| 2026-11-26 | Koç tek aylık / yıllık abonelik öder; alan başına ücret yok. |
| 2026-11-26 | Bir koç, danışanın diğer koçluklarının bilgisini yalnızca danışan rızasıyla görür. KVKK rızası zorunlu. |
| 2026-11-26 | MVP odağı Fitness ve Beslenme; Sınav ve Gitar yer tutucu. |
| 2026-11-26 | Mockup aşaması bitti. Davet koduyla bağlanma akışları geliştirme sırasında tasarlanacak. |
| 2026-11-26 | Geliştirme Claude ile, kullanıcının `alaris` klasöründe yapılacak; `docs/` tek doğru kaynak. |
| 2026-11-26 | Teknik yığın: Next.js (koç paneli), Expo / React Native (danışan uygulaması, ileride EAS ile derleme), Supabase (arka uç). |
| 2026-11-26 | Beslenme alanının rengi yeşil (`#4D7C0F`). |
| 2026-11-26 | Kod deposu GitHub'da: `Behnan1196/alaris`. Tek depo (npm workspaces): `apps/web`, `apps/mobile`, `packages/shared`, `supabase/`. |
| 2026-11-26 | Program alan başına: aynı koçtan iki alan alan danışana her alan için ayrı program gider; builder alanları birlikte gösterir. |
| 2026-11-26 | Uyum = tamamlanan / planlanan (görevler + koçun atadığı alışkanlıklar). Koç kendi atadığı alışkanlıkları takip eder; danışanın kendi alışkanlıkları uyuma girmez. |
| 2026-11-26 | İlk sürümde hareket kütüphanesi videosuz: ad, kas grubu, ekipman, adımlar. Video yükleme 7. adımda. |
| 2026-11-26 | İlk sürümde besin veritabanı yok: koç öğünleri elle girer (ad, içerik, kcal, makrolar); kaydedilen besinler kütüphanede birikir, arama sonra. |
| 2026-11-26 | Bildirimler: danışana yeni mesaj ve yeni program için uzaktan bildirim (Supabase tetikleyici → notify Edge Function → Expo Push); alışkanlık hatırlatmaları telefonda yerel. Koçlara bildirim yok (web paneli). iPhone geliştirme derlemesi EAS ile, paket kimliği com.behnan.alaris. |
| 2026-11-27 | Koç paneli Vercel'de (kök dizin `apps/web`), danışan uygulaması TestFlight'a EAS `production` profiliyle. Ayrıntı: `docs/13-yayin.md`. |
| 2026-11-27 | Koç paneli arayüzü Everfit/Hubfit'te standartlaşmış iskelete göre iyileştirilecek; sıra `docs/14-panel-arayuz.md` §5. Görsel dil onaylı mockup (sıcak nötrler, Inter + Space Grotesk). |
| 2026-11-27 | Çok haftalı program: 1. hafta şablondur; koç herhangi bir haftayı "ayrı düzenle" ile kopyalayıp değiştirebilir, ayrı düzenlenmeyen haftalar şablonu kullanır. Hafta kopyalama, görev sürükle-bırak ve süperset eklendi. |
| 2026-11-27 | Çok dil: arayüz Türkçe ve İngilizce. Metinler ortak sözlükte (`packages/shared/src/i18n/tr.ts`, `en.ts`); panelde dil çerez ya da tarayıcı dilinden, uygulamada cihaz dilinden seçilir, ikisinde de elle değiştirilebilir. Hazır hareket/besin adları `name_i18n` alanında; koçun ve danışanın yazdıkları yazıldığı dilde kalır. Bildirimler alıcının profil dilinde. |
| 2026-11-27 | Sistem hareket kütüphanesi: 62 sık kullanılan hareket, Türkçe ve İngilizce ad, hedef ve yardımcı kaslar, ekipman, kategori, yararlar ve uygulanış adımları. Kaynak `supabase/data/exercises.json`, `npm run db:exercises` ile migration üretilir. Videolar sonra (açık soru 22). İçerik genel bilgidir; yayından önce bir antrenör gözden geçirmeli. |

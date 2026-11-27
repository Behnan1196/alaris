# 14. Koç paneli arayüzü: Everfit / Hubfit'ten ne alıyoruz

Durum: **onaylandı** [KARAR], 27 Kasım 2026 (sıra §5). Onaylanan maddeler `karar-gunlugu.md` dosyasına yazılır.
Kaynaklar: Everfit ve Hubfit yardım merkezi / ürün sayfaları (aşağıda), onaylı mockup `docs/mockups/koc-paneli.html`.

## 1. Sektörde standartlaşmış kalıplar

| Kalıp | Everfit | Hubfit | Bizde şu an |
|---|---|---|---|
| **Kalıcı sol menü** + üstte danışan arama | Var | Var | Yok; sayfalar arası "← geri" bağlantıları. Mockup'ta var. |
| **Danışan listesi = durum odaklı tablo**: hazır görünümler (Dikkat gerekiyor, Risk altında, Etkinlik yok, Program bitiyor), sütun seçimi (son etkinlik, katılım tarihi…) | Var, görünüm başına canlı sayı | Görev/gecikme odaklı | Tek tablo, filtre yok |
| **Danışan profili = tek ekran**: üstte özet, sekmeler (Genel, Antrenman takvimi, Beslenme, Ölçümler/Fotoğraflar, Notlar), sağda hızlı eylemler | "Client overview" + takvim kısayolu, "Updates" akışı | Profil, etkinlik, ilerleme fotoğrafları, notlar tek görünümde | Uzun tek sayfa, sekmesiz |
| **Haftalık check-in panosu**: haftalık tamamlama, uyum % + 4 haftalık eğilim, program ilerlemesi, oradan mesaj | Var (beta) | Check-in formları ve gecikme | Genel bakışta uyum çubuğu; eğilim yok |
| **Program = takvim**: danışanın aylık/haftalık takvimi ("Master Calendar"), sürükle-bırak, kopyala/yapıştır, hafta kopyalama | Var | Var | Tek hafta şablonu; sürükle-bırak yok |
| **Antrenman oluşturucu**: süperset/devre, ısınma bölümü, kütüphaneden arama ile ekleme | Var | Var (süperset, devre, AMRAP) | Düz hareket listesi |
| **Okunmamış odaklı gelen kutusu**, "yanıt bekleyen" filtresi, takipten düşen danışan uyarısı | Var | Var | Okunmamış sayısı var, filtre yok |
| **Otomasyonlar** (ör. 3 gün kaçırırsa mesaj) | Autoflow | Habit tetikleyicileri | Yok (sonraya) |

Bilinen eleştiri: Everfit'in takvimi ve mobil deneyimi kullanıcı yorumlarında "karışık" bulunuyor. Buradan çıkarılacak ders: özellik sayısında değil, **günlük akışın sadeliğinde** öne geçmek.

## 2. Alacaklarımız, almayacaklarımız

**Alıyoruz (koçların alışık olduğu iskelet):**
1. Sol menü + üst çubuk (arama, "Program oluştur", bildirim), mockup'taki gibi.
2. Danışanlar: durum çipleri ve hazır görünümler (Tümü · Dikkat · Mesaj bekliyor · Program yok · Bitiyor · Etkinlik yok), sayılarla; sütunlar: hedef, alanlar, hafta, uyum (4 haftalık mini eğilim), son etkinlik, durum.
3. Danışan profili sekmeli: **Genel** (bu hafta + uyum eğilimi + son kayıtlar), **Program** (takvim), **İlerleme** (ölçüm grafikleri + fotoğraf karşılaştırma), **Notlar**; sağ sütunda sabit: aktif programlar, koç notu, başka koçlardan aldığı, "Mesaj gönder".
4. Program oluşturucuda: kartı sürükleyip başka güne taşıma, gün/hafta kopyalama, hafta 1..N arası geçiş (açık soru 10'u da çözer).
5. Antrenman düzenleyicide: kütüphaneden arayarak ekleme, süperset gruplama.
6. Mesajlar: "Yanıt bekleyen" filtresi, danışan bağlamı yan panelde (bu hafta + uyum).

**Almıyoruz / sonraya:** otomasyonlar, ödeme ve rezervasyon, AI ile program yazma, ekip/çoklu koç çalışma alanı.

## 3. Bizi ayıran yerler (kopyalamadan)

- **Çok alanlı koçluk:** Everfit/Hubfit tek koç–tek program varsayar. Bizde aynı danışanda Fitness + Beslenme ayrı programdır. Takvim ve profil her yerde **alan rengi** ve alan filtresiyle gösterilir (mockup'taki gibi).
- **Rıza ve koçlar arası görünürlük:** "Başka koçlardan aldığı" kartı ve rızayla açılan veriler profilde görünür bir öğedir; rakiplerde yok.
- **Uyum = görevler + koçun atadığı alışkanlıklar** (karar 26 Kasım).
- **Türkçe ve yerel alışkanlıklar** (ör. öğün isimleri, tarih biçimi, hafta pazartesi başlar).

## 4. Görsel dil

Şu anki uygulama gri (zinc) tonlarda ve Geist yazı tipinde; **onaylı mockup** sıcak nötrler kullanıyor: arka plan `#F6F5F2`, kenarlık `#E6E3DD`, metin `#16181D`, ikincil metin `#5B5F66`, vurgu alan renkleri; yazı tipi Inter, başlıklarda Space Grotesk. Öneri: mockup'taki tasarım değişkenlerini Tailwind temasına taşıyıp tüm paneli buna geçirmek (tek seferlik, hızlı).

## 5. Önerilen sıra

1. **İskelet:** sol menü, üst çubuk (arama), mockup renkleri ve yazı tipleri. Tüm sayfalar bu kabuğa girer.
2. **Danışanlar listesi:** hazır görünümler, durum çipleri, son etkinlik, uyum eğilimi.
3. **Danışan profili:** sekmeler ve sağ sütun.
4. **Program oluşturucu:** sürükle-bırak, kopyalama, çok haftalı geçiş, kütüphane araması, süperset.
5. **Mesajlar:** yanıt bekleyen filtresi ve danışan bağlam paneli.
6. Mobil danışan uygulaması için ayrı bir tur (mockup `danisan-uygulamasi.html` ile hizalama: widget görselleri, alt menü ikonları).

## Kaynaklar

- Everfit, client overview: https://help.everfit.io/en/articles/2972171-understanding-the-client-overview
- Everfit, check-in dashboard: https://help.everfit.io/en/articles/14495409-introducing-coach-check-in-dashboard-beta
- Everfit, client list ve görünümler: https://help.everfit.io/en/articles/16000579-manage-your-client-list
- Everfit, Autoflow: https://help.everfit.io/en/articles/3661707-autoflow-overview
- Everfit kullanıcı yorumları: https://www.g2.com/products/Everfit/reviews
- Hubfit, koçluk platformu: https://hubfit.com/platform/coaching
- Hubfit, antrenman: https://hubfit.com/feature/training
- Hubfit, check-in: https://hubfit.com/feature/check-ins

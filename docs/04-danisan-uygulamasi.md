# 4. Danışan uygulaması (mobil)

Referans: https://claude.ai/artifact/Laoq53ADD1TXRFH3swvdGJ (390×844 tek ekran prototip).

## Gezinme

Alt menü: **Koçluklarım · Mesajlar · İlerleme**. Ayrı bir "Bugün" sekmesi yok; bugünün işi Koçluklarım'da. [KARAR]

## 4.1 Koçluklarım (ana ekran)

- Üstte tarih, selamlama ("Günaydın, Can"), "Bugün X / Y görev tamam", aktif koçluk sayısı.
- Duyuru şeridi (ör. "Deniz Arslan 4. haftanın programını gönderdi"), kapatılabilir.
- **Alan widget'ları**: her alan için arka planı görselli bir kart. İçinde alan adı, program adı, koç ve hafta (ör. "Hafta 4 / 12"), bugünün işi ve bir eylem düğmesi (Başla / Devam et / Tamamlandı). Widget, bugünün işini başlatır veya **kaldığı yerden** devam ettirir. [KARAR]
- **Alışkanlıklarım** modülü: bugünün alışkanlıkları, "Bugün X / Y tamam", "Alışkanlıkları yönet ve yeni ekle".
- "Davet koduyla koç ekle" girişi.
- Widget görselleri şimdilik yer tutucu; gerçek fotoğraflar gerekecek. [AÇIK SORU]

## 4.2 Alan ayrıntısı

Widget'ın kenarına / başlığına dokununca açılır:
- Program adı ve hafta, ilerleme yüzdesi.
- **Bugün**: o alandaki görevler (tip, başlık, meta), tamamlandı durumu; su gibi sayaçlı alışkanlıklar.
- **Bu hafta**: 7 günlük plan, bugün vurgulu.
- **Koç kartı**: koçun adı, bir sonraki önemli olay (ör. "Pazar: haftalık check-in formu"), "Koça mesaj gönder".

## 4.3 Görev ekranları

- **Antrenman**: özet → hareket ekranı → dinlenme sayacı → sonraki hareket. Ayrıntı: `03-alanlar-ve-gorevler.md`.
- **Beslenme**: günlük kalori ve makrolar, öğün kartları, "Yedim", fotoğraf, alternatif öğün.
- **Sınav / Gitar** [SONRA]: soru seti sayacı ve sonuç girişi; ders videosu, akor diyagramı, metronom, kayıt.

## 4.4 Alışkanlıklarım

- Liste: ad, alt bilgi (sıklık / hedef), seri (gün), tamamlama.
- **Yeni alışkanlık** formu: öneriler veya serbest metin, sıklık (Her gün / Hafta içi / Haftada 3), hatırlatma (Sabah / Öğle / Akşam / Yok), "Koçlarım bu alışkanlığı görebilsin" anahtarı, Kaydet / Vazgeç.
- Koçun atadığı alışkanlıklar ile danışanın kendi alışkanlıkları aynı listede; kaynağı belli olur. [VARSAYIM]

## 4.5 Mesajlar

- **Koç başına bir sohbet.** Deniz hem Fitness hem Beslenme veriyorsa tek sohbet ("Fitness ve Beslenme"). [KARAR]
- Liste: koç baş harfleri, ad, son mesaj, saat, okunmamış sayısı.
- Sohbet ekranı: metin mesajı. Fotoğraf, ses kaydı ve görev bağlamlı mesaj (ör. bir antrenmana yorum) ileride. [VARSAYIM]

## 4.6 İlerleme

- Alan seçici (Fitness / Beslenme / ...).
- Alan başına iki özet kutusu ve bir grafik. Örnekler: Fitness: haftalık antrenman, kilo grafiği; Beslenme: protein hedefi tutturulan gün, ortalama kalori, günlük protein grafiği.
- **Koçun yorumu** kartı.

## 4.7 Henüz tasarlanmamış akışlar

- Kayıt / giriş, profil, bildirim ayarları. [AÇIK SORU]
- Davet koduyla koça bağlanma ve rıza ekranları (bkz. `08-gizlilik-kvkk.md`). [KARAR: geliştirmede tasarlanacak]
- Koçluğu bitirme / koçtan ayrılma.
- Çevrimdışı kullanım (spor salonunda zayıf bağlantı). [VARSAYIM: antrenman ekranı çevrimdışı çalışmalı]
- Sağlık uygulamalarıyla bağlantı (adım sayısı: Apple Health / Google Fit). [SONRA]

## Uygulama durumu (26 Kasım 2026)

İlk sürümde yapılanlar [VARSAYIM: ayrıntılar sonra iyileştirilecek]:
- Koçluklarım kartında bugünün görevleri ve durumu (Başla / Devam et / Tamamlandı); göreve dokununca görev ekranı açılır.
- Antrenman: özet → hareket hareket ilerleme, set tablosu (Set / Hedef / Önceki / Yap), kilo ve tekrar girişi, dinlenme sayacı (+15 sn, Atla), isteğe bağlı zorluk puanı (1-10). Kaldığı yer kaydedilir. Video ve "Nasıl yapılır" adımları yok.
- Beslenme: kalori ve makro çubukları (makrolar yenen kaloriyle orantılı yaklaşık), öğünleri "Yedim" ile işaretleme, su sayacı. Fotoğraf ve alternatif öğün yok.
- Ölçüm: seçilen ölçüleri girme, son değer gösterimi. Fotoğraf yok.
- Alışkanlıklarım: ana ekranda bugünün alışkanlıkları (sayaçlı veya tek dokunuş), seri, "haftada 3" için haftalık sayaç; ayrı ekranda yeni alışkanlık (öneriler, sıklık, hedef, hatırlatma saati, "Koçlarım görebilsin"). Hatırlatma bildirimi yok.

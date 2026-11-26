# 3. Alanlar ve görev tipleri

## Alan (domain)

Alan, bir koçluk türüdür. Her alanın adı, rengi, görseli ve kullanabildiği görev tipleri vardır. Danışan uygulamasında **her alan ayrı bir widget**tır. [KARAR]

| Anahtar | Ad | MVP | Renk | Görev tipleri |
|---|---|---|---|---|
| `fitness` | Fitness | Evet | `#C2410C` | Antrenman, Ölçüm |
| `nutrition` | Beslenme | Evet | `#4D7C0F` (yeşil) [KARAR] | Beslenme planı (öğünler), Ölçüm |
| `exam` | Sınav Koçluğu | Yer tutucu | `#1D4ED8` | Soru seti, Deneme, Video ders |
| `guitar` | Gitar Eğitimi | Yer tutucu | `#0F766E` | Gitar pratiği, Video ders |

Not: Danışan mockup'ında Beslenme hâlâ kırmızı (`#BE123C`) çizili; geçerli renk koç panelindeki yeşildir (`#4D7C0F`). Uygulamada yeşil kullanılır.

Alışkanlık her alanda kullanılabilir (aşağıya bakın).

## Görev (task)

Görev, koçun programda belirli bir güne koyduğu iş. Her görevin bir **alanı** ve bir **tipi** vardır. Tipine göre alanları, danışandan istenenleri ve danışan ekranı değişir.

### Antrenman (`workout`) [MVP]
- Koç girer: ad, tahmini süre, yoğunluk (Hafif/Orta/Yüksek), hareket listesi. Her hareket: kütüphaneden hareket, set sayısı, tekrar (veya süre), hedef kilo, dinlenme süresi (sn), not.
- Seçenekler: her sette kilo ve tekrar girişi iste; dinlenme sayacı otomatik başlasın; sonunda zorluk puanı iste.
- Danışan ekranı: antrenman özeti (hareket, set, süre, ekipman, koçun notu) → hareket hareket ilerleme. Hareket ekranında koçun videosu (döngüde, sessiz, açı seçimi ve yavaş çekim), çalışan kaslar, set tablosu (Set / Hedef / Önceki / Yap), set işaretlenince dinlenme sayacı (+15 sn, Atla), "Nasıl yapılır" adımları, koçun notu.

### Beslenme planı / Öğün (`meal`) [MVP]
- Koç girer: plan adı, günlük kalori hedefi, protein / karbonhidrat / yağ (g), öğünler (saat, ad, içerik ve porsiyonlar, kcal).
- Seçenekler: öğün fotoğrafı iste; alternatif öğün seçebilsin (koçun onayladığı alternatif); su takibini plana ekle.
- Danışan ekranı: günlük kalori halkası ve makro çubukları, öğün listesi, öğünü "yedim" olarak işaretleme, fotoğraf ekleme, alternatife geçme.

### Ölçüm (`measure`) [MVP]
- Koç girer: ölçülecekler (kilo; kilo + bel; kilo + bel + kalça; vücut yağ oranı), ne zaman (sabah aç karnına vb.).
- Seçenekler: ön/yan fotoğraf iste; değişimi danışana grafikle göster.
- Hem Fitness hem Beslenme alanında kullanılabilir. Aynı danışanın iki koçu da ölçüm isterse ne olacağı açık. [AÇIK SORU]

### Alışkanlık (`habit`) [MVP]
- Güne değil **haftaya / tekrara** bağlıdır. Koç panelinde takvimin altında ayrı bir şeritte durur.
- Koç girer: ad, sıklık (Her gün / Hafta içi / Haftada 3), günlük hedef (ör. 8 bardak su, 10.000 adım), hatırlatma saati.
- Seçenekler: danışan hedefi değiştirebilsin; seri sayacını göster.
- Danışan kendi alışkanlığını da ekleyebilir ("Koçlarım bu alışkanlığı görebilsin" seçeneğiyle).
- Sayaçlı alışkanlık (su: bardak sayısı) ve tek dokunuşla tamamlanan alışkanlık var.
- Danışan uygulamasında tüm alışkanlıklar alan widget'larından ayrı olarak **Alışkanlıklarım** modülünde toplanır.

### Yer tutucu tipler [SONRA]
- **Soru seti (`study`)**: ders, konu, soru sayısı, süre; odak sayacı (Pomodoro benzeri, ekrandan çıkınca devam eder); doğru/yanlış/boş girişi → net hesabı; yanlış soru fotoğrafı.
- **Deneme (`exam`)**: TYT/AYT/LGS, ders bazında net girişi, ardından analiz görevi.
- **Video ders (`lesson`)**: kütüphaneden / yükleme / bağlantı; izleme sonrası mini kontrol.
- **Gitar pratiği (`guitar`)**: akorlar, süre, başlangıç → hedef BPM, metronom, akor diyagramı, ses kaydı gönderme.

## Program

Program, bir danışana bir veya daha fazla hafta boyunca verilen görevler ve alışkanlıklar bütünüdür.
- Adı, süresi (ör. 12 hafta), başlangıç tarihi, tekrar biçimi (yalnızca 1 hafta / 4 hafta tekrarla / program bitene kadar) vardır.
- Şablon olarak kaydedilip başka danışanlara gönderilebilir.
- Bir danışanın bir alanda aynı anda tek aktif programı olur. [VARSAYIM]
- Aynı koçtan iki alan alan danışana tek program mı, alan başına program mı gider? Mockup'ta builder tek takvimde alan filtresiyle çalışıyor; danışan tarafında ise her alanın kendi program adı ve haftası var. [AÇIK SORU] Önerim: alan başına program, builder'da birlikte gösterim.

# Anamnez Kontrol Listesi — SPEC (sürüm 0.1)

## 1. Amaç

Genel cerrahi asistanının servise yatan hastadan anamnez alırken sorması gereken soruları unutmamasını sağlayan, telefonda çalışan bir kontrol listesi uygulaması.

- Kullanıcı: tek bir hekim, kendi telefonunda.
- Kullanım anı: hasta başında, ayakta, tek elle, birkaç saniyelik bakışlarla.
- Uygulama tanı koymaz, öneri vermez. Yalnızca hangi soruların sorulup sorulmadığını gösterir.

## 2. Kapsam dışı (yapılmayacaklar)

- Sunucu, hesap, giriş ekranı, senkronizasyon, sunucuya gönderilen analitik, hata raporlama servisi. Kullanıcının elle paylaştığı, hasta listesine bağlı olmayan kullanım özeti vardır (Faz 5).
- Ağ isteği (uygulamanın kendi dosyalarını yüklemek dışında).
- AI, RAG, serbest soru sorma.
- Şikayetten giriş (yalnızca tanıdan giriş var).
- Hasta kimlik bilgisi: isim, TC no, protokol no, doğum tarihi, yakın bilgisi.
- Cevaplar için metin kutusu. Alt sorular yalnızca hatırlatmadır, veri girilmez.
- Soru içeriğini (`sorular.json`) uygulama içinden değiştirme. Özel sorular ayrı katmandadır.
- Dışa aktarma, yazdırma, paylaşma (Faz 5'teki elle paylaşılan kullanım özeti hariç).

## 3. İçerik verisi: `public/data/sorular.json`

Salt okunur. Kaynak dosya: `anamnez_sorular_v0.2.json`. Uygulama bu dosyanın içeriğini değiştirmez.

```json
{
  "surum": "0.2",
  "guncelleme": "2026-11-13",
  "ortak": {
    "sorular": [ Soru, ... ]
  },
  "tanilar": [
    {
      "id": "akut-apandisit",
      "ad": "Akut apandisit",
      "sorular": [ Soru, ... ]
    }
  ]
}
```

`Soru` alanları:

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | string | Benzersiz. Sırayı belirtmez. |
| `metin` | string | Hastaya sorulacak soru. |
| `oncelik` | `"kritik"` \| `"standart"` | Kritik sorular rozetle gösterilir. |
| `dogrulanmali` | boolean | `true` ise soru kaynakta doğrudan görülmedi. |
| `kaynak` | `{ ad, url }` | `url` boş olabilir. |
| `alt_sorular` | `{ id, metin }[]` | Boş olabilir. |
| `tip` | `"acik"` (isteğe bağlı) | Yoksa evet/hayır sorusudur. |
| `kosul` | `"kadin"` \| `"65_ustu"` (isteğe bağlı) | Yoksa herkese gösterilir. |

Sorular dizideki sırayla gösterilir. Sıra değiştirilmez, önceliğe göre yeniden dizilmez.

Üst düzeyde isteğe bağlı bir `sema` alanı bulunabilir. Alanların açıklamasını içerir, yalnızca açıklama amaçlıdır ve uygulama bu alanı okumaz.

Doğrulama:

- Bilinmeyen üst düzey alanlar ve soru içindeki bilinmeyen alanlar görmezden gelinir.
- Soru id'leri ve alt soru id'leri birlikte, dosyanın tamamında benzersiz olmalıdır.
- `tanilar` en az bir tanı içermelidir.
- Tanı id'leri kendi aralarında benzersiz olmalıdır.

## 4. Yerel veri (telefonda saklanan)

```ts
type Cevap = "evet" | "hayir" | "soruldu";

interface HastaListesi {
  id: string;
  etiket: string;          // ör. "Yatak 12". En fazla 20 karakter.
  taniId: string;
  cinsiyet: "kadin" | "erkek";
  yas65Ustu: boolean;
  olusturma: string;       // ISO tarih
  cevaplar: Record<string, Cevap>;   // anahtar: soru id. Kayıt yoksa "sorulmadı".
}

interface OzelSoru {
  id: string;              // "ozel-" ile başlar
  hedef: "ortak" | string; // "ortak" ya da bir tanı id'si
  metin: string;
}
```

- Saklama: `localStorage`. Okuma ve yazma `try/catch` içinde; hata olursa uygulama bellekteki veriyle çalışmaya devam eder.
- Otomatik silme: `olusturma` üzerinden 7 gün geçen listeler uygulama açılışında silinir. Süre tek bir sabitte tutulur.
- Özel sorular silinmez, yalnızca kullanıcı siler.

## 5. Davranış kuralları

1. **Görünürlük:** `kosul: "kadin"` olan soru yalnızca cinsiyeti kadın olan listede, `kosul: "65_ustu"` olan soru yalnızca `yas65Ustu` işaretli listede görünür.
2. **Evet/hayır sorusu:** Üç durum vardır: sorulmadı, hayır, evet. Satırda "Hayır" ve "Evet" olmak üzere iki buton bulunur. Seçili butona tekrar basılınca durum sorulmadıya döner.
3. **Açık soru (`tip: "acik"`):** İki durum vardır: sorulmadı, soruldu. Tek bir "Soruldu" butonu bulunur.
4. **Alt sorular:** Ana soru "evet" ya da "soruldu" olduğunda altında liste olarak açılır. İşaretlenmez, veri girilmez.
5. **Kritik rozeti:** `oncelik: "kritik"` olan sorunun yanında belirgin bir rozet görünür.
6. **Doğrulanmalı işareti:** `dogrulanmali: true` olan sorunun yanında soluk bir işaret görünür. Ayarlar ekranından kapatılabilir (bölüm 6).
7. **Sayaç:** Checklist ekranının üstünde "X soru sorulmadı" yazar. Sorulmamış kritik soru varsa sayısı ayrıca gösterilir. Yalnızca görünür sorular sayılır.
8. **Bölümler:** Checklist iki bölümdür: önce "Ortak", sonra tanının adı. Her bölüm katlanabilir. Özel sorular ilgili bölümün sonunda görünür ve evet/hayır sorusu gibi davranır.
9. **Kaynak:** Soruya uzun basınca kaynak adı ve varsa bağlantısı gösterilir.
10. **Etiket uyarısı:** Etiket alanının altında "Hasta adı yazmayın" notu bulunur.
11. **Liste düzenleme ve cevapların korunması:**
    - Bir listenin tanısı oluşturulduktan sonra değiştirilemez. Etiket, cinsiyet ve 65 yaş üstü düzenlenebilir.
    - Cinsiyet ya da 65 yaş üstü değişince cevaplar korunur.
    - Gizlenen sorunun cevabı saklanır ama sayaca girmez.

## 6. Ekranlar

1. **Hastalar (ana ekran):** Açık listeler; her satırda etiket, tanı adı ve sorulmamış soru sayısı. "Yeni liste" butonu. Listeyi sola kaydırınca ya da menüden "Sil".
2. **Yeni liste:** Etiket, tanı seçimi (aranabilir liste), cinsiyet, 65 yaş üstü işareti.
3. **Checklist:** Bölüm 5'teki kurallar.
4. **Soruları düzenle:** Hedef seçimi (ortak ya da tanı), özel soru ekleme ve silme. Hazır sorular burada yalnızca okunur.
5. **Ayarlar:** Hastalar ekranından açılır. "Doğrulanmalı işaretini göster" tercihi burada durur ve `localStorage`'da saklanır.

Arayüz dili Türkçe. Tasarım 380 piksel genişliğe göre yapılır; dokunma hedefleri en az 44 piksel.

## 7. Teknik

- React, TypeScript, Vite.
- PWA: `vite-plugin-pwa`. Uygulama dosyaları ve `sorular.json` önbelleğe alınır.
- Test: Vitest. Görünürlük, sayaç, durum geçişleri ve otomatik silme mantığı testle doğrulanır.
- Bölüm 5'teki kurallar arayüz bileşenlerinden ayrı, saf fonksiyonlarda yazılır.

## 8. Fazlar ve kabul kriterleri

Her faz ayrı oturumda yapılır ve ayrı commit ile biter.

### Faz 1 — İskelet ve veri

- Proje kurulur, `sorular.json` yüklenir ve tiplerle doğrulanır.
- Kabul: Uygulama açılır, 10 tanı adıyla listelenir. Bozuk JSON'da anlaşılır bir hata ekranı çıkar. Şema testi geçer.

### Faz 2 — Checklist

- Bölüm 5'teki 1-9 arası kurallar, geçici (bellekte) tek bir listeyle.
- Tanı, cinsiyet ve 65 yaş üstü geçici bir kontrolle seçilir; Faz 3'te kaldırılır. Bu kontrolde tanı değişince cevaplar sıfırlanır. Bu sıfırlama yalnızca bu fazdaki geçici kontrol için geçerlidir (kalıcı listelerde tanı değiştirilemez, kural 11).
- "Doğrulanmalı işaretini göster" tercihi bu fazda geçici kontrolde, bellekte tutulur.
- Kabul: Bir tanı seçilince ortak ve tanı soruları sırayla görünür. "Evet" basılınca alt sorular açılır. Erkek hastada "kadin" koşullu sorular görünmez. Sayaç doğru günceller. Kural testleri geçer.

### Faz 3 — Hasta listeleri

- Ekran 1, 2 ve 5 (Ayarlar), `localStorage` kaydı, otomatik silme, etiket uyarısı.
- Ekran geçişleri tarayıcı geçmişine işlenir; Android geri tuşu ve iOS geri kaydırma bir önceki ekrana döner, uygulamayı kapatmaz.
- Liste silinmeden önce onay penceresi gösterilir.
- Elle silme ve otomatik silme tek bir fonksiyondan geçer (Faz 5'teki sayaçlar buraya eklenir).
- Kabul: İki ayrı liste açılabilir, işaretler birbirine karışmaz. Uygulama kapatılıp açılınca işaretler durur. 7 günden eski liste açılışta silinir (testle).

### Faz 4 — Özel sorular ve offline

- Ekran 4, özel soruların checklist'te gösterimi, PWA kurulumu.
- Özel soru alanının altında "Hasta bilgisi yazmayın" notu bulunur.
- Kabul: Eklenen özel soru ilgili bölümün sonunda görünür ve işaretlenebilir. `sorular.json` yeni sürümle değiştirildiğinde özel sorular kaybolmaz. Uygulama ana ekrana eklenir ve uçak modunda açılır.

### Faz 5 — Kullanım özeti

- Liste silinirken (elle ya da otomatik) o listede görünür olan her soru için yerel sayaç güncellenir: gösterildi, evet, hayır, soruldu, boş. Hiç işaret konmamış liste sayılmaz. Sayaçlar hasta listesine bağlı değildir.
- Ayarlar ekranında "Kullanım özetini paylaş" butonu bulunur. Soru id'leri, sayaçlar, içerik sürümü ve özel soru metinlerini içeren bir JSON dosyası cihazın paylaşım menüsüyle verilir. Ağ isteği yoktur.
- Paylaşmadan önce dosya içeriği ekranda gösterilir. Özel soru metinleri önizlemede ayrı başlık altında durur ve "Özel soruları dahil etme" seçeneği vardır.
- Özet hasta listesine bağlı değildir; arayüzde "anonim" yerine "hasta listesine bağlı olmayan" ifadesi kullanılır.

## 9. Açık konular

- 21 soruluk ortak modül uzun. Hekim kısalttıktan sonra varsayılan olarak hangi soruların katlanmış geleceği belirlenecek.
- Otomatik silme süresi (7 gün) hekimle teyit edilecek.

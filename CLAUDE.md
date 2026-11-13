# Anamnez Kontrol Listesi

Genel cerrahi asistanı için telefonda çalışan anamnez kontrol listesi (PWA). Ayrıntılı davranış ve fazlar `docs/SPEC.md` dosyasındadır; koda başlamadan önce oku.

## Çalışma şekli

- Her oturumda yalnızca istenen fazı yap. Sonraki fazlara ait özellik ekleme.
- Faza başlamadan önce planını kısa maddelerle yaz ve onay bekle.
- Spec ile çelişen ya da spec'te olmayan bir karar gerekiyorsa kod yazmadan önce sor. Karar verilince önce `docs/SPEC.md` güncellenir.
- Faz bitince kabul kriterlerini tek tek doğrula, sonucu raporla, sonra commit at.

## Değişmez kurallar

- Sunucu, hesap, sunucuya gönderilen analitik, hata raporlama servisi ve üçüncü taraf ağ isteği yok. Kullanıcının elle paylaştığı kullanım özeti dışında veri telefondan çıkmaz.
- Hasta kimlik bilgisi için alan yok. Cevaplar için metin kutusu yok.
- `public/data/sorular.json` içeriğine dokunma. Soru ekleme, silme, sıralama ve metin düzeltme yapma.
- `docs/SPEC.md` bölüm 2'deki kapsam dışı maddeleri ekleme.
- Yeni bağımlılık eklemeden önce sor.

## Teknoloji

- React, TypeScript (strict), Vite, `vite-plugin-pwa`, Vitest.
- Saklama: `localStorage`, her erişim `try/catch` içinde.
- Kurallar (görünürlük, sayaç, durum geçişleri, otomatik silme) `src/store` ve `src/data` altında saf fonksiyonlarda; bileşenler bu fonksiyonları çağırır.

## Klasörler

```text
docs/SPEC.md
public/data/sorular.json
src/data/        şema tipleri, JSON yükleme ve doğrulama
src/store/       hasta listeleri, özel sorular, yerel kayıt
src/screens/     Hastalar, YeniListe, Checklist, SorulariDuzenle
src/components/  soru satırı, rozet, sayaç
tests/
```

## Arayüz

- Dil Türkçe. JSON'daki alan adları Türkçe kalır (`metin`, `oncelik`, `alt_sorular`).
- 380 piksel genişliğe göre tasarla. Dokunma hedefleri en az 44 piksel.
- Tek elle kullanım: sık kullanılan butonlar ekranın alt yarısında.

## Komutlar

```bash
npm run dev      # geliştirme sunucusu
npm run test     # testler
npm run build    # üretim derlemesi
```

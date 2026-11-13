import { useEffect, useState } from 'react'
import { soruVerisiniYukle } from './data/yukle'
import type { SoruVerisi } from './data/sema'
import { Ayarlar } from './screens/Ayarlar'
import { Checklist } from './screens/Checklist'
import { Hastalar } from './screens/Hastalar'
import { YeniListe } from './screens/YeniListe'
import { ayarlariOku, ayarlariYaz, listeleriOku, listeleriYaz } from './store/kayit'
import { cevapla, eskiListeIdleri, listeleriSil, listeyiDuzenle, yeniListe, type HastaListesi } from './store/listeler'

type Durum =
  | { tur: 'yukleniyor' }
  | { tur: 'hata'; mesaj: string }
  | { tur: 'hazir'; veri: SoruVerisi }

export default function App() {
  const [durum, setDurum] = useState<Durum>({ tur: 'yukleniyor' })

  useEffect(() => {
    soruVerisiniYukle()
      .then((veri) => setDurum({ tur: 'hazir', veri }))
      .catch((e: unknown) => setDurum({ tur: 'hata', mesaj: e instanceof Error ? e.message : String(e) }))
  }, [])

  if (durum.tur === 'yukleniyor') return <main><p>Yükleniyor…</p></main>

  if (durum.tur === 'hata') {
    return (
      <main role="alert">
        <h1>Soru listesi açılamadı</h1>
        <p>Soru dosyası (sorular.json) okunamadı ya da beklenen biçimde değil. Uygulama bu dosya düzelene kadar kullanılamaz.</p>
        <p className="ayrinti">Ayrıntı: {durum.mesaj}</p>
      </main>
    )
  }

  return <Uygulama veri={durum.veri} />
}

type Ekran =
  | { ad: 'hastalar' }
  | { ad: 'yeni' }
  | { ad: 'ayarlar' }
  | { ad: 'checklist'; listeId: string }
  | { ad: 'duzenle'; listeId: string }

const ANA_EKRAN: Ekran = { ad: 'hastalar' }

function ilkListeler(veri: SoruVerisi): HastaListesi[] {
  const listeler = listeleriOku(new Set(veri.tanilar.map((t) => t.id)))
  return listeleriSil(listeler, eskiListeIdleri(listeler))
}

// Ekranlar tarayıcı geçmişinde tutulur; geri tuşu bir önceki ekrana döner.
function useEkran() {
  const [ekran, setEkran] = useState<Ekran>(() => (history.state as Ekran | null) ?? ANA_EKRAN)

  useEffect(() => {
    if (history.state === null) history.replaceState(ANA_EKRAN, '')
    const geri = (e: PopStateEvent) => setEkran((e.state as Ekran | null) ?? ANA_EKRAN)
    window.addEventListener('popstate', geri)
    return () => window.removeEventListener('popstate', geri)
  }, [])

  return {
    ekran,
    git: (e: Ekran) => {
      history.pushState(e, '')
      setEkran(e)
    },
    yerineGit: (e: Ekran) => {
      history.replaceState(e, '')
      setEkran(e)
    },
    geri: () => history.back(),
  }
}

function Uygulama({ veri }: { veri: SoruVerisi }) {
  const [listeler, setListeler] = useState(() => ilkListeler(veri))
  const [ayarlar, setAyarlar] = useState(ayarlariOku)
  const [listeKaydedildi, setListeKaydedildi] = useState(true)
  const [ayarKaydedildi, setAyarKaydedildi] = useState(true)
  const { ekran, git, yerineGit, geri } = useEkran()

  useEffect(() => setListeKaydedildi(listeleriYaz(listeler)), [listeler])
  useEffect(() => setAyarKaydedildi(ayarlariYaz(ayarlar)), [ayarlar])

  const listeGuncelle = (id: string, f: (l: HastaListesi) => HastaListesi) =>
    setListeler((ls) => ls.map((l) => (l.id === id ? f(l) : l)))

  const liste = 'listeId' in ekran ? listeler.find((l) => l.id === ekran.listeId) : undefined
  // Silinmiş ya da okunamayan listeye ait ekran (ör. sayfa yenilenince) ana ekrana düşer.
  const gecerliEkran: Ekran = 'listeId' in ekran && !liste ? ANA_EKRAN : ekran

  return (
    <main>
      {!(listeKaydedildi && ayarKaydedildi) && (
        <p className="kayit-hatasi" role="alert">Kaydedilemedi. Değişiklikler uygulama kapanınca kaybolabilir.</p>
      )}
      {gecerliEkran.ad !== 'hastalar' && (
        <div className="ust-cubuk">
          <button type="button" onClick={geri}>‹ Geri</button>
          {gecerliEkran.ad === 'checklist' && liste && (
            <>
              <span className="ust-baslik">{liste.etiket}</span>
              <button type="button" onClick={() => git({ ad: 'duzenle', listeId: liste.id })}>Düzenle</button>
            </>
          )}
        </div>
      )}

      {gecerliEkran.ad === 'hastalar' && (
        <Hastalar
          veri={veri}
          listeler={listeler}
          onAc={(id) => git({ ad: 'checklist', listeId: id })}
          onSil={(id) => setListeler((ls) => listeleriSil(ls, [id]))}
          onYeni={() => git({ ad: 'yeni' })}
          onAyarlar={() => git({ ad: 'ayarlar' })}
        />
      )}
      {gecerliEkran.ad === 'yeni' && (
        <YeniListe
          veri={veri}
          onKaydet={(alanlar) => {
            const yeni = yeniListe(alanlar)
            setListeler((ls) => [...ls, yeni])
            // Geri tuşu formu değil Hastalar ekranını açsın.
            yerineGit({ ad: 'checklist', listeId: yeni.id })
          }}
        />
      )}
      {gecerliEkran.ad === 'duzenle' && liste && (
        <YeniListe
          veri={veri}
          mevcut={liste}
          onKaydet={(alanlar) => {
            listeGuncelle(liste.id, (l) => listeyiDuzenle(l, alanlar))
            geri()
          }}
        />
      )}
      {gecerliEkran.ad === 'checklist' && liste && (
        <Checklist
          veri={veri}
          liste={liste}
          dogrulanmaliGoster={ayarlar.dogrulanmaliGoster}
          onCevap={(soruId, cevap) => listeGuncelle(liste.id, (l) => cevapla(l, soruId, cevap))}
        />
      )}
      {gecerliEkran.ad === 'ayarlar' && <Ayarlar ayarlar={ayarlar} onDegis={setAyarlar} />}
    </main>
  )
}

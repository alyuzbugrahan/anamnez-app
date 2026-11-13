import { useEffect, useState } from 'react'
import { soruVerisiniYukle } from './data/yukle'
import type { SoruVerisi } from './data/sema'
import { Checklist } from './screens/Checklist'
import type { ListeBilgisi } from './store/kurallar'

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

  return <GeciciListe veri={durum.veri} />
}

// GEÇİCİ: Faz 3'te Hastalar, Yeni liste ve Ayarlar ekranlarıyla kaldırılacak.
// Tek liste bellekte tutulur; tanı değişince cevaplar sıfırlanır (SPEC bölüm 8, Faz 2).
function GeciciListe({ veri }: { veri: SoruVerisi }) {
  const [liste, setListe] = useState<ListeBilgisi>({
    taniId: veri.tanilar[0].id,
    cinsiyet: 'erkek',
    yas65Ustu: false,
    cevaplar: {},
  })
  const [dogrulanmaliGoster, setDogrulanmaliGoster] = useState(true)

  return (
    <main>
      <fieldset className="gecici">
        <legend>Geçici seçim</legend>
        <select
          aria-label="Tanı"
          value={liste.taniId}
          onChange={(e) => setListe({ ...liste, taniId: e.target.value, cevaplar: {} })}
        >
          {veri.tanilar.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
        </select>
        <label>
          <input
            type="radio"
            name="cinsiyet"
            checked={liste.cinsiyet === 'kadin'}
            onChange={() => setListe({ ...liste, cinsiyet: 'kadin' })}
          />
          Kadın
        </label>
        <label>
          <input
            type="radio"
            name="cinsiyet"
            checked={liste.cinsiyet === 'erkek'}
            onChange={() => setListe({ ...liste, cinsiyet: 'erkek' })}
          />
          Erkek
        </label>
        <label>
          <input
            type="checkbox"
            checked={liste.yas65Ustu}
            onChange={(e) => setListe({ ...liste, yas65Ustu: e.target.checked })}
          />
          65 yaş üstü
        </label>
        <label>
          <input type="checkbox" checked={dogrulanmaliGoster} onChange={(e) => setDogrulanmaliGoster(e.target.checked)} />
          Doğrulanmalı işaretini göster
        </label>
      </fieldset>
      <Checklist
        veri={veri}
        liste={liste}
        dogrulanmaliGoster={dogrulanmaliGoster}
        onCevap={(soruId, cevap) =>
          setListe((l) => {
            const cevaplar = { ...l.cevaplar }
            if (cevap === undefined) delete cevaplar[soruId]
            else cevaplar[soruId] = cevap
            return { ...l, cevaplar }
          })
        }
      />
    </main>
  )
}

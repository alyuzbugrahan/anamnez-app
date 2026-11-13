import { useEffect, useState } from 'react'
import { soruVerisiniYukle } from './data/yukle'
import type { SoruVerisi } from './data/sema'

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

  return (
    <main>
      <h1>Tanılar</h1>
      <ul>
        {durum.veri.tanilar.map((t) => <li key={t.id}>{t.ad}</li>)}
      </ul>
      <p className="ayrinti">Soru verisi sürüm {durum.veri.surum}</p>
    </main>
  )
}

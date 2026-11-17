import { useState } from 'react'
import { KaynakPenceresi } from '../components/KaynakPenceresi'
import { Sayac } from '../components/Sayac'
import { SoruSatiri } from '../components/SoruSatiri'
import type { Soru, SoruVerisi } from '../data/sema'
import { bolumler, gorunurMu, kalan, sayac, sonrakiCevap, type Cevap } from '../store/kurallar'
import type { HastaListesi } from '../store/listeler'
import type { OzelSoru } from '../store/ozelSorular'

interface Props {
  veri: SoruVerisi
  liste: HastaListesi
  ozelSorular: OzelSoru[]
  dogrulanmaliGoster: boolean
  onCevap: (soruId: string, cevap: Cevap | undefined) => void
}

export function Checklist({ veri, liste, ozelSorular, dogrulanmaliGoster, onCevap }: Props) {
  const [kaynakSoru, setKaynakSoru] = useState<Soru | null>(null)
  const taniAdi = veri.tanilar.find((t) => t.id === liste.taniId)?.ad

  return (
    <>
      <header className="checklist-basi">
        <h1>{liste.etiket}</h1>
        <p className="checklist-tani">{taniAdi}</p>
      </header>
      <Sayac {...sayac(veri, liste, ozelSorular)} />
      {bolumler(veri, liste.taniId, ozelSorular).map((b) => (
        <details key={b.baslik} open className="bolum">
          <summary>
            <span className="bolum-ad">{b.baslik}</span>
            <span className="bolum-kalan">{kalan(b.sorular, liste)} kaldı</span>
          </summary>
          <ul>
            {b.sorular
              .filter((s) => gorunurMu(s, liste))
              .map((s) => (
                <SoruSatiri
                  key={s.id}
                  soru={s}
                  cevap={liste.cevaplar[s.id]}
                  dogrulanmaliGoster={dogrulanmaliGoster}
                  onBas={(buton) => onCevap(s.id, sonrakiCevap(s, liste.cevaplar[s.id], buton))}
                  onKaynak={() => setKaynakSoru(s)}
                />
              ))}
          </ul>
        </details>
      ))}
      {kaynakSoru && <KaynakPenceresi soru={kaynakSoru} onKapat={() => setKaynakSoru(null)} />}
    </>
  )
}

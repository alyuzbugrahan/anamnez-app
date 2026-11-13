import { useRef, useState } from 'react'
import { Sayac } from '../components/Sayac'
import { SoruSatiri } from '../components/SoruSatiri'
import type { Soru, SoruVerisi } from '../data/sema'
import { bolumler, gorunurMu, sayac, sonrakiCevap, type Cevap, type ListeBilgisi } from '../store/kurallar'

interface Props {
  veri: SoruVerisi
  liste: ListeBilgisi
  dogrulanmaliGoster: boolean
  onCevap: (soruId: string, cevap: Cevap | undefined) => void
}

export function Checklist({ veri, liste, dogrulanmaliGoster, onCevap }: Props) {
  const pencere = useRef<HTMLDialogElement>(null)
  const [kaynakSoru, setKaynakSoru] = useState<Soru | null>(null)

  const kaynakGoster = (s: Soru) => {
    setKaynakSoru(s)
    pencere.current?.showModal()
  }

  return (
    <>
      <Sayac {...sayac(veri, liste)} />
      {bolumler(veri, liste.taniId).map((b) => (
        <details key={b.baslik} open className="bolum">
          <summary>{b.baslik}</summary>
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
                  onKaynak={() => kaynakGoster(s)}
                />
              ))}
          </ul>
        </details>
      ))}
      <dialog ref={pencere} className="kaynak" onClick={(e) => e.target === pencere.current && pencere.current.close()}>
        {kaynakSoru && (
          <>
            <p className="kaynak-baslik">Kaynak</p>
            <p>{kaynakSoru.kaynak.ad}</p>
            {kaynakSoru.kaynak.url && (
              <p>
                <a href={kaynakSoru.kaynak.url} target="_blank" rel="noopener noreferrer">
                  Kaynağı aç
                </a>
              </p>
            )}
            <form method="dialog">
              <button type="submit">Kapat</button>
            </form>
          </>
        )}
      </dialog>
    </>
  )
}

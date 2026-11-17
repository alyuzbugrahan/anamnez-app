import type { Soru } from '../data/sema'
import { altSorularAcikMi, butonlar, kaynakVarMi, type Buton, type Cevap } from '../store/kurallar'
import { DogrulanmaliIsaret, KritikRozet } from './Rozet'
import { useUzunBasma } from './uzunBasma'

interface Props {
  soru: Soru
  cevap: Cevap | undefined
  dogrulanmaliGoster: boolean
  onBas: (buton: Buton) => void
  onKaynak: () => void
}

const ETIKET: Record<Buton, string> = { hayir: 'Hayır', evet: 'Evet', soruldu: 'Soruldu' }

export function SoruSatiri({ soru, cevap, dogrulanmaliGoster, onBas, onKaynak }: Props) {
  const kaynak = useUzunBasma(onKaynak)
  const kritik = soru.oncelik === 'kritik'
  const sinif = [
    'soru',
    cevap && 'cevapli',
    kritik && !cevap && 'kritik-acik',
    // Kritik soruya Evet (ör. alerji var) gözden kaçmasın: metin soluklaşmaz.
    kritik && cevap === 'evet' && 'kritik-evet',
  ]
  const metin = (
    <>
      {kritik && <KritikRozet />}
      {soru.metin}
      {dogrulanmaliGoster && soru.dogrulanmali && <DogrulanmaliIsaret />}
    </>
  )

  return (
    <li className={sinif.filter(Boolean).join(' ')}>
      {kaynakVarMi(soru) ? (
        <button type="button" className="soru-metin" aria-haspopup="dialog" {...kaynak}>
          {metin}
        </button>
      ) : (
        <p className="soru-metin">{metin}</p>
      )}
      <div className="soru-butonlar">
        {butonlar(soru).map((b) => (
          <button key={b} type="button" aria-pressed={cevap === b} onClick={() => onBas(b)}>
            {cevap === b && <span aria-hidden="true">✓ </span>}
            {ETIKET[b]}
          </button>
        ))}
      </div>
      {altSorularAcikMi(cevap) && soru.alt_sorular.length > 0 && (
        <ul className="alt-sorular">
          {soru.alt_sorular.map((a) => <li key={a.id}>{a.metin}</li>)}
        </ul>
      )}
    </li>
  )
}

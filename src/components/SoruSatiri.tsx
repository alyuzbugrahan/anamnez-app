import type { Soru } from '../data/sema'
import { altSorularAcikMi, type Buton, type Cevap } from '../store/kurallar'
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
  const uzunBasma = useUzunBasma(onKaynak)
  const butonlar: Buton[] = soru.tip === 'acik' ? ['soruldu'] : ['hayir', 'evet']

  return (
    <li className={`soru${cevap ? ' cevapli' : ''}`}>
      <div className="soru-metin" {...uzunBasma}>
        {soru.oncelik === 'kritik' && <KritikRozet />}
        {soru.metin}
        {dogrulanmaliGoster && soru.dogrulanmali && <DogrulanmaliIsaret />}
      </div>
      <div className="soru-butonlar">
        {butonlar.map((b) => (
          <button key={b} type="button" className={`cevap-${b}`} aria-pressed={cevap === b} onClick={() => onBas(b)}>
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

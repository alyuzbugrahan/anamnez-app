import { useId, useState } from 'react'
import { OnayPenceresi } from '../components/OnayPenceresi'
import type { SoruVerisi } from '../data/sema'
import { eksikAlanlar, ETIKET_EN_FAZLA, type EksikAlan, type HastaListesi, type ListeAlanlari } from '../store/listeler'

interface Props {
  veri: SoruVerisi
  // Verilirse düzenleme modu: tanı kilitli (kural 11).
  mevcut?: HastaListesi
  onKaydet: (alanlar: ListeAlanlari) => void
  // Yalnızca düzenleme modunda: "Listeyi sil" (SPEC ekran 2).
  onSil?: () => void
}

const EKSIK_ADI: Record<EksikAlan, string> = { etiket: 'etiket', cinsiyet: 'cinsiyet', tani: 'tanı' }
const kucuk = (s: string) => s.toLocaleLowerCase('tr')

// SPEC ekran 2: kısa alanlar üstte, uzun tanı listesi en altta; eksik alan butonun üstünde yazar.
export function YeniListe({ veri, mevcut, onKaydet, onSil }: Props) {
  const [etiket, setEtiket] = useState(mevcut?.etiket ?? '')
  const [taniId, setTaniId] = useState(mevcut?.taniId ?? '')
  const [arama, setArama] = useState('')
  const [cinsiyet, setCinsiyet] = useState<'kadin' | 'erkek' | undefined>(mevcut?.cinsiyet)
  const [yas65Ustu, setYas65Ustu] = useState(mevcut?.yas65Ustu ?? false)
  const [silOnayi, setSilOnayi] = useState(false)
  const id = useId()

  const taniAdi = veri.tanilar.find((t) => t.id === taniId)?.ad
  // Seçili tanı aramayla gizlenmez.
  const bulunan = veri.tanilar.filter((t) => t.id === taniId || kucuk(t.ad).includes(kucuk(arama.trim())))
  const eksik = eksikAlanlar({ etiket, taniId, cinsiyet })

  return (
    <form
      className="liste-formu"
      onSubmit={(e) => {
        e.preventDefault()
        if (eksik.length === 0 && cinsiyet) onKaydet({ etiket, taniId, cinsiyet, yas65Ustu })
      }}
    >
      <h1>{mevcut ? 'Listeyi düzenle' : 'Yeni liste'}</h1>

      <div className="alan">
        <label htmlFor={`${id}-etiket`}>Etiket</label>
        <input
          id={`${id}-etiket`}
          value={etiket}
          maxLength={ETIKET_EN_FAZLA}
          autoComplete="off"
          placeholder="ör. Yatak 12"
          aria-describedby={`${id}-etiket-uyari`}
          onChange={(e) => setEtiket(e.target.value)}
        />
        <span id={`${id}-etiket-uyari`} className="uyari">Hasta adı yazmayın.</span>
      </div>

      <fieldset className="alan">
        <legend>Cinsiyet</legend>
        <div className="ikili">
          {(['kadin', 'erkek'] as const).map((c) => (
            <label key={c} className="secenek">
              <input type="radio" name={`${id}-cinsiyet`} checked={cinsiyet === c} onChange={() => setCinsiyet(c)} />
              <span>{c === 'kadin' ? 'Kadın' : 'Erkek'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="secim">
        <input type="checkbox" checked={yas65Ustu} onChange={(e) => setYas65Ustu(e.target.checked)} />
        65 yaş üstü
      </label>

      <fieldset className="alan">
        <legend>Tanı</legend>
        {mevcut ? (
          <p className="kilitli">{taniAdi} (değiştirilemez)</p>
        ) : (
          <>
            <p className="secili-tani" aria-live="polite">{taniAdi ? `Seçili: ${taniAdi}` : 'Tanı seçilmedi'}</p>
            <input type="search" aria-label="Tanı ara" placeholder="Tanı ara" value={arama} onChange={(e) => setArama(e.target.value)} />
            <div className="tani-secim">
              {bulunan.map((t) => (
                <label key={t.id} className="secenek">
                  <input type="radio" name={`${id}-tani`} checked={taniId === t.id} onChange={() => setTaniId(t.id)} />
                  <span>{t.ad}</span>
                </label>
              ))}
              {bulunan.length === 0 && <p className="ayrinti">"{arama.trim()}" ile eşleşen tanı yok.</p>}
            </div>
          </>
        )}
      </fieldset>

      {mevcut && onSil && (
        <button type="button" className="tehlikeli-ikincil" onClick={() => setSilOnayi(true)}>
          Listeyi sil
        </button>
      )}
      {silOnayi && mevcut && onSil && (
        <OnayPenceresi
          mesaj={`"${mevcut.etiket}" listesi silinsin mi? Bu işlem geri alınamaz.`}
          onayMetni="Sil"
          onVazgec={() => setSilOnayi(false)}
          onOnay={onSil}
        />
      )}

      <div className="alt-cubuk sutun">
        {eksik.length > 0 && (
          <p id={`${id}-eksik`} className="eksik">
            Eksik: {eksik.map((e) => EKSIK_ADI[e]).join(', ')}
          </p>
        )}
        <button type="submit" className="birincil" disabled={eksik.length > 0} aria-describedby={eksik.length > 0 ? `${id}-eksik` : undefined}>
          {mevcut ? 'Kaydet' : 'Listeyi aç'}
        </button>
      </div>
    </form>
  )
}

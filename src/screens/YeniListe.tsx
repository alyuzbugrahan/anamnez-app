import { useState } from 'react'
import { OnayPenceresi } from '../components/OnayPenceresi'
import type { SoruVerisi } from '../data/sema'
import { ETIKET_EN_FAZLA, etiketGecerliMi, type HastaListesi, type ListeAlanlari } from '../store/listeler'

interface Props {
  veri: SoruVerisi
  // Verilirse düzenleme modu: tanı kilitli (kural 11).
  mevcut?: HastaListesi
  onKaydet: (alanlar: ListeAlanlari) => void
  // Yalnızca düzenleme modunda: "Listeyi sil" (SPEC ekran 2).
  onSil?: () => void
}

const kucuk = (s: string) => s.toLocaleLowerCase('tr')

export function YeniListe({ veri, mevcut, onKaydet, onSil }: Props) {
  const [silOnayi, setSilOnayi] = useState(false)
  const [etiket, setEtiket] = useState(mevcut?.etiket ?? '')
  const [taniId, setTaniId] = useState(mevcut?.taniId ?? '')
  const [arama, setArama] = useState('')
  const [cinsiyet, setCinsiyet] = useState<'kadin' | 'erkek' | undefined>(mevcut?.cinsiyet)
  const [yas65Ustu, setYas65Ustu] = useState(mevcut?.yas65Ustu ?? false)

  const bulunan = veri.tanilar.filter((t) => kucuk(t.ad).includes(kucuk(arama.trim())))
  const hazir = etiketGecerliMi(etiket) && taniId !== '' && cinsiyet !== undefined

  return (
    <form
      className="liste-formu"
      onSubmit={(e) => {
        e.preventDefault()
        if (hazir) onKaydet({ etiket, taniId, cinsiyet, yas65Ustu })
      }}
    >
      <h1>{mevcut ? 'Listeyi düzenle' : 'Yeni liste'}</h1>

      <label className="alan">
        Etiket
        <input
          value={etiket}
          maxLength={ETIKET_EN_FAZLA}
          autoComplete="off"
          placeholder="ör. Yatak 12"
          onChange={(e) => setEtiket(e.target.value)}
        />
        <span className="uyari">Hasta adı yazmayın.</span>
      </label>

      <fieldset className="alan">
        <legend>Tanı</legend>
        {mevcut ? (
          <p className="kilitli">{veri.tanilar.find((t) => t.id === taniId)?.ad} (değiştirilemez)</p>
        ) : (
          <>
            <input type="search" aria-label="Tanı ara" placeholder="Ara" value={arama} onChange={(e) => setArama(e.target.value)} />
            <ul className="tani-secim">
              {bulunan.map((t) => (
                <li key={t.id}>
                  <button type="button" aria-pressed={taniId === t.id} onClick={() => setTaniId(t.id)}>
                    {t.ad}
                  </button>
                </li>
              ))}
              {bulunan.length === 0 && <li className="ayrinti">Tanı bulunamadı.</li>}
            </ul>
          </>
        )}
      </fieldset>

      <fieldset className="alan">
        <legend>Cinsiyet</legend>
        <div className="ikili">
          <button type="button" aria-pressed={cinsiyet === 'kadin'} onClick={() => setCinsiyet('kadin')}>Kadın</button>
          <button type="button" aria-pressed={cinsiyet === 'erkek'} onClick={() => setCinsiyet('erkek')}>Erkek</button>
        </div>
      </fieldset>

      <label className="secim">
        <input type="checkbox" checked={yas65Ustu} onChange={(e) => setYas65Ustu(e.target.checked)} />
        65 yaş üstü
      </label>

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

      <div className="alt-cubuk">
        <button type="submit" className="birincil" disabled={!hazir}>
          {mevcut ? 'Kaydet' : 'Listeyi aç'}
        </button>
      </div>
    </form>
  )
}

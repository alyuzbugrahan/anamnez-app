import { useState } from 'react'
import { OnayPenceresi } from '../components/OnayPenceresi'
import type { SoruVerisi } from '../data/sema'
import { OZEL_SORU_EN_FAZLA, ozelMetinGecerliMi, type OzelSoru } from '../store/ozelSorular'

interface Props {
  veri: SoruVerisi
  ozelSorular: OzelSoru[]
  onEkle: (hedef: string, metin: string) => void
  onSil: (id: string) => void
}

export function SorulariDuzenle({ veri, ozelSorular, onEkle, onSil }: Props) {
  const [hedef, setHedef] = useState('ortak')
  const [metin, setMetin] = useState('')
  const [silinecek, setSilinecek] = useState<OzelSoru | null>(null)

  const taniIdleri = new Set(veri.tanilar.map((t) => t.id))
  const hazir = hedef === 'ortak' ? veri.ortak.sorular : (veri.tanilar.find((t) => t.id === hedef)?.sorular ?? [])
  const buHedef = ozelSorular.filter((o) => o.hedef === hedef)
  const sahipsiz = ozelSorular.filter((o) => o.hedef !== 'ortak' && !taniIdleri.has(o.hedef))

  const ozelListe = (sorular: OzelSoru[]) => (
    <ul className="ozel-liste">
      {sorular.map((o) => (
        <li key={o.id}>
          <span>{o.metin}</span>
          <button type="button" className="hasta-sil" aria-label={`"${o.metin}" sorusunu sil`} onClick={() => setSilinecek(o)}>
            Sil
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <form
      className="liste-formu"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ozelMetinGecerliMi(metin)) return
        onEkle(hedef, metin)
        setMetin('')
      }}
    >
      <h1>Soruları düzenle</h1>

      <label className="alan">
        Bölüm
        <select value={hedef} onChange={(e) => setHedef(e.target.value)}>
          <option value="ortak">Ortak</option>
          {veri.tanilar.map((t) => (
            <option key={t.id} value={t.id}>{t.ad}</option>
          ))}
        </select>
      </label>

      <label className="alan">
        Yeni özel soru
        <input
          value={metin}
          maxLength={OZEL_SORU_EN_FAZLA}
          autoComplete="off"
          onChange={(e) => setMetin(e.target.value)}
        />
        <span className="uyari">Hasta bilgisi yazmayın.</span>
        <span className="ayrinti">{metin.length}/{OZEL_SORU_EN_FAZLA}</span>
      </label>

      <h2>Özel sorular</h2>
      {buHedef.length === 0 ? <p className="ayrinti">Bu bölümde özel soru yok.</p> : ozelListe(buHedef)}

      {sahipsiz.length > 0 && (
        <>
          <h2>Tanısı artık listede olmayan sorular</h2>
          {ozelListe(sahipsiz)}
        </>
      )}

      <h2>Hazır sorular</h2>
      <ul className="hazir-liste">
        {hazir.map((s) => (
          <li key={s.id}>{s.metin}</li>
        ))}
      </ul>

      <div className="alt-cubuk">
        <button type="submit" className="birincil" disabled={!ozelMetinGecerliMi(metin)}>Ekle</button>
      </div>

      {silinecek && (
        <OnayPenceresi
          mesaj={`"${silinecek.metin}" sorusu silinsin mi?`}
          onayMetni="Sil"
          onVazgec={() => setSilinecek(null)}
          onOnay={() => {
            onSil(silinecek.id)
            setSilinecek(null)
          }}
        />
      )}
    </form>
  )
}

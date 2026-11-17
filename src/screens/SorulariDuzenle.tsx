import { useId, useState } from 'react'
import { OnayPenceresi } from '../components/OnayPenceresi'
import type { SoruVerisi } from '../data/sema'
import { OZEL_SORU_EN_FAZLA, ozelMetinGecerliMi, type OzelSoru } from '../store/ozelSorular'

interface Props {
  veri: SoruVerisi
  ozelSorular: OzelSoru[]
  onEkle: (hedef: string, metin: string) => void
  onSil: (id: string) => void
}

// SPEC ekran 4: önce bölüm ve yeni soru, sonra bu bölümün özel soruları (silinebilir), en altta hazır sorular (salt okunur).
export function SorulariDuzenle({ veri, ozelSorular, onEkle, onSil }: Props) {
  const [hedef, setHedef] = useState('ortak')
  const [metin, setMetin] = useState('')
  const [eklendi, setEklendi] = useState('')
  const [silinecek, setSilinecek] = useState<OzelSoru | null>(null)
  const id = useId()

  const taniIdleri = new Set(veri.tanilar.map((t) => t.id))
  const bolumAdi = hedef === 'ortak' ? 'Ortak' : (veri.tanilar.find((t) => t.id === hedef)?.ad ?? '')
  const hazir = hedef === 'ortak' ? veri.ortak.sorular : (veri.tanilar.find((t) => t.id === hedef)?.sorular ?? [])
  const buHedef = ozelSorular.filter((o) => o.hedef === hedef)
  const sahipsiz = ozelSorular.filter((o) => o.hedef !== 'ortak' && !taniIdleri.has(o.hedef))

  const ozelListe = (sorular: OzelSoru[]) => (
    <ul className="ozel-liste">
      {sorular.map((o) => (
        <li key={o.id}>
          <span>{o.metin}</span>
          <button type="button" className="sil-baglanti" aria-label={`"${o.metin}" sorusunu sil`} onClick={() => setSilinecek(o)}>
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
        setEklendi(`"${metin.trim()}" ${bolumAdi} bölümüne eklendi.`)
        setMetin('')
      }}
    >
      <h1>Soruları düzenle</h1>

      <div className="alan">
        <label htmlFor={`${id}-bolum`}>Bölüm</label>
        <select
          id={`${id}-bolum`}
          value={hedef}
          onChange={(e) => {
            setHedef(e.target.value)
            setEklendi('')
          }}
        >
          <option value="ortak">Ortak</option>
          {veri.tanilar.map((t) => (
            <option key={t.id} value={t.id}>{t.ad}</option>
          ))}
        </select>
      </div>

      <div className="alan">
        <label htmlFor={`${id}-metin`}>Yeni özel soru</label>
        <input
          id={`${id}-metin`}
          value={metin}
          maxLength={OZEL_SORU_EN_FAZLA}
          autoComplete="off"
          aria-describedby={`${id}-uyari`}
          onChange={(e) => setMetin(e.target.value)}
        />
        <div className="alan-alti">
          <span id={`${id}-uyari`} className="uyari">Hasta bilgisi yazmayın.</span>
          {/* Her harfte değişir; ekran okuyucuda alanın adına ya da açıklamasına karışmasın. */}
          <span className="ayrinti sayi" aria-hidden="true">{metin.length}/{OZEL_SORU_EN_FAZLA}</span>
        </div>
        <p className="ayrinti eklendi" role="status">{eklendi}</p>
      </div>

      <h2>{bolumAdi}: özel sorular</h2>
      {buHedef.length === 0 ? (
        <p className="ayrinti">Bu bölümde özel soru yok. Eklediğiniz soru checklist'te bu bölümün sonunda evet/hayır sorusu olarak görünür.</p>
      ) : (
        ozelListe(buHedef)
      )}

      {sahipsiz.length > 0 && (
        <>
          <h2>Tanısı artık listede olmayan sorular</h2>
          <p className="ayrinti">Bu sorular checklist'te görünmez. Gerekmiyorsa silebilirsiniz.</p>
          {ozelListe(sahipsiz)}
        </>
      )}

      <h2>
        {bolumAdi}: hazır sorular <span className="ayrinti">({hazir.length}, değiştirilemez)</span>
      </h2>
      <ol className="hazir-liste">
        {hazir.map((s) => (
          <li key={s.id}>{s.metin}</li>
        ))}
      </ol>

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

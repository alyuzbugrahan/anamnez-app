import { useState } from 'react'
import { OnayPenceresi } from '../components/OnayPenceresi'
import type { SoruVerisi } from '../data/sema'
import { sayac } from '../store/kurallar'
import type { HastaListesi } from '../store/listeler'
import type { OzelSoru } from '../store/ozelSorular'

interface Props {
  veri: SoruVerisi
  listeler: HastaListesi[]
  ozelSorular: OzelSoru[]
  onAc: (id: string) => void
  onSil: (id: string) => void
  onYeni: () => void
  onAyarlar: () => void
  onSorular: () => void
}

export function Hastalar({ veri, listeler, ozelSorular, onAc, onSil, onYeni, onAyarlar, onSorular }: Props) {
  const [silinecek, setSilinecek] = useState<HastaListesi | null>(null)
  const sirali = [...listeler].sort((a, b) => b.olusturma.localeCompare(a.olusturma))

  return (
    <>
      <h1>Hastalar</h1>
      {sirali.length === 0 && <p className="ayrinti">Açık liste yok.</p>}
      <ul className="hasta-listesi">
        {sirali.map((l) => (
          <li key={l.id}>
            <button type="button" className="hasta-ac" onClick={() => onAc(l.id)}>
              <span className="hasta-etiket">{l.etiket}</span>
              <span className="hasta-tani">{veri.tanilar.find((t) => t.id === l.taniId)?.ad}</span>
              <span className="hasta-sayac">{sayac(veri, l, ozelSorular).sorulmadi} soru sorulmadı</span>
            </button>
            <button type="button" className="hasta-sil" aria-label={`${l.etiket} listesini sil`} onClick={() => setSilinecek(l)}>
              Sil
            </button>
          </li>
        ))}
      </ul>
      <div className="alt-cubuk iki-satir">
        <button type="button" onClick={onAyarlar}>Ayarlar</button>
        <button type="button" onClick={onSorular}>Soruları düzenle</button>
        <button type="button" className="birincil" onClick={onYeni}>Yeni liste</button>
      </div>
      {silinecek && (
        <OnayPenceresi
          mesaj={`"${silinecek.etiket}" listesi silinsin mi? Bu işlem geri alınamaz.`}
          onayMetni="Sil"
          onVazgec={() => setSilinecek(null)}
          onOnay={() => {
            onSil(silinecek.id)
            setSilinecek(null)
          }}
        />
      )}
    </>
  )
}

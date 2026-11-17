import type { SoruVerisi } from '../data/sema'
import { sayac } from '../store/kurallar'
import { OTOMATIK_SILME_GUN, type HastaListesi } from '../store/listeler'
import type { OzelSoru } from '../store/ozelSorular'

interface Props {
  veri: SoruVerisi
  listeler: HastaListesi[]
  ozelSorular: OzelSoru[]
  onAc: (id: string) => void
  onYeni: () => void
  onAyarlar: () => void
  onSorular: () => void
}

// SPEC ekran 1: asıl soru "hangi hastada iş kaldı?". Silme listenin Düzenle ekranında.
export function Hastalar({ veri, listeler, ozelSorular, onAc, onYeni, onAyarlar, onSorular }: Props) {
  const sirali = [...listeler].sort((a, b) => b.olusturma.localeCompare(a.olusturma))

  return (
    <>
      <header className="hastalar-basi">
        <h1>Hastalar</h1>
        <nav className="ikincil-baglantilar" aria-label="Diğer ekranlar">
          <button type="button" onClick={onSorular}>Soruları düzenle</button>
          <button type="button" onClick={onAyarlar}>Ayarlar</button>
        </nav>
      </header>

      {sirali.length === 0 ? (
        <div className="bos-durum">
          <p>Açık liste yok.</p>
          <p className="ayrinti">
            Yeni yatan hasta için "Yeni liste"ye basın. Listeler açıldıktan {OTOMATIK_SILME_GUN} gün sonra kendiliğinden silinir.
          </p>
        </div>
      ) : (
        <ul className="hasta-listesi">
          {sirali.map((l) => {
            const { sorulmadi, kritik } = sayac(veri, l, ozelSorular)
            return (
              <li key={l.id}>
                <button type="button" className="hasta-ac" onClick={() => onAc(l.id)}>
                  <span className="hasta-sol">
                    <span className="hasta-etiket">{l.etiket}</span>
                    <span className="hasta-tani">{veri.tanilar.find((t) => t.id === l.taniId)?.ad}</span>
                  </span>
                  <span className="hasta-sag">
                    <span className="hasta-kalan">{sorulmadi} kaldı</span>
                    {kritik > 0 && <span className="hasta-kritik">{kritik} kritik</span>}
                  </span>
                  <span className="hasta-ok" aria-hidden="true">›</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="alt-cubuk">
        <button type="button" className="birincil" onClick={onYeni}>Yeni liste</button>
      </div>
    </>
  )
}

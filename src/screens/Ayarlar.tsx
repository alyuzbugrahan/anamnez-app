import { useState } from 'react'
import type { SoruVerisi } from '../data/sema'
import { anaEkrandanMi, guncellemeDenetle, type DenetimSonucu } from '../pwa'
import type { Ayarlar as AyarlarTipi } from '../store/kayit'

const MESAJ: Record<DenetimSonucu, string> = {
  guncel: 'Güncel.',
  yenileniyor: 'Yeni sürüm yükleniyor…',
  cevrimdisi: 'İnternet bağlantısı yok, güncelleme denetlenemedi. Uygulama çevrimdışı çalışmaya devam eder.',
  basarisiz: 'Güncelleme denetlenemedi. Bağlantıyı kontrol edip yeniden deneyin.',
  desteklenmiyor: 'Bu ortamda güncelleme denetlenemiyor.',
}

interface Props {
  veri: SoruVerisi
  ayarlar: AyarlarTipi
  onDegis: (a: AyarlarTipi) => void
}

export function Ayarlar({ veri, ayarlar, onDegis }: Props) {
  const [denetim, setDenetim] = useState<DenetimSonucu | 'denetleniyor' | null>(null)

  return (
    <>
      <h1>Ayarlar</h1>
      {!anaEkrandanMi() && <p className="kayit-hatasi">Verilerin korunması için ana ekrana ekleyin.</p>}
      <label className="secim">
        <input
          type="checkbox"
          checked={ayarlar.dogrulanmaliGoster}
          onChange={(e) => onDegis({ ...ayarlar, dogrulanmaliGoster: e.target.checked })}
        />
        Doğrulanmalı işaretini göster
      </label>
      <p className="ayrinti">
        İçerik sürümü {veri.surum} · {veri.guncelleme}
      </p>
      <p className="ayrinti" role="status">
        {denetim === 'denetleniyor' ? 'Denetleniyor…' : denetim && MESAJ[denetim]}
      </p>
      <div className="alt-cubuk">
        <button
          type="button"
          className="birincil"
          disabled={denetim === 'denetleniyor' || denetim === 'yenileniyor'}
          onClick={async () => {
            setDenetim('denetleniyor')
            setDenetim(await guncellemeDenetle())
          }}
        >
          Güncellemeleri denetle
        </button>
      </div>
    </>
  )
}

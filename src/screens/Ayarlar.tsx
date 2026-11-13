import type { Ayarlar as AyarlarTipi } from '../store/kayit'

export function Ayarlar({ ayarlar, onDegis }: { ayarlar: AyarlarTipi; onDegis: (a: AyarlarTipi) => void }) {
  return (
    <>
      <h1>Ayarlar</h1>
      <label className="secim">
        <input
          type="checkbox"
          checked={ayarlar.dogrulanmaliGoster}
          onChange={(e) => onDegis({ ...ayarlar, dogrulanmaliGoster: e.target.checked })}
        />
        Doğrulanmalı işaretini göster
      </label>
    </>
  )
}

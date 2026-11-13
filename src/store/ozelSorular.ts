// Özel sorular (SPEC bölüm 4, kural 8, ekran 4). Saf fonksiyonlar.
import type { Soru } from '../data/sema'
import { idUret } from './listeler'

export const OZEL_SORU_EN_FAZLA = 120

export interface OzelSoru {
  id: string // "ozel-" ile başlar
  hedef: 'ortak' | string // "ortak" ya da bir tanı id'si
  metin: string
}

export function ozelMetinGecerliMi(metin: string): boolean {
  const m = metin.trim()
  return m.length > 0 && m.length <= OZEL_SORU_EN_FAZLA
}

export function ozelSoruEkle(sorular: OzelSoru[], hedef: string, metin: string): OzelSoru[] {
  if (!ozelMetinGecerliMi(metin)) return sorular
  return [...sorular, { id: `ozel-${idUret()}`, hedef, metin: metin.trim() }]
}

export function ozelSoruSil(sorular: OzelSoru[], id: string): OzelSoru[] {
  return sorular.filter((s) => s.id !== id)
}

// Kural 8: özel soru evet/hayır sorusu gibi davranır.
export function soruyaCevir(o: OzelSoru): Soru {
  return {
    id: o.id,
    metin: o.metin,
    oncelik: 'standart',
    dogrulanmali: false,
    kaynak: { ad: 'Özel soru', url: '' },
    alt_sorular: [],
  }
}

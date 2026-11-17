// Hasta listesi işlemleri (SPEC bölüm 4 ve kural 11). Saf fonksiyonlar.
import type { Cevap, ListeBilgisi } from './kurallar'

export const OTOMATIK_SILME_GUN = 7
export const ETIKET_EN_FAZLA = 20

export interface HastaListesi extends ListeBilgisi {
  id: string
  etiket: string
  olusturma: string
}

export type ListeAlanlari = Pick<HastaListesi, 'etiket' | 'taniId' | 'cinsiyet' | 'yas65Ustu'>
// Kural 11: tanı oluşturulduktan sonra değiştirilemez.
export type DuzenlenebilirAlanlar = Omit<ListeAlanlari, 'taniId'>

// crypto.randomUUID güvenli olmayan bağlantıda (http://192.168.x.x) yok; bu yüzden zaman + Math.random.
export function idUret(simdi = new Date()): string {
  return `${simdi.getTime().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function etiketGecerliMi(etiket: string): boolean {
  const e = etiket.trim()
  return e.length > 0 && e.length <= ETIKET_EN_FAZLA
}

export type EksikAlan = 'etiket' | 'cinsiyet' | 'tani'

// SPEC ekran 2: eksik alan varsa buton pasif ve hangisinin eksik olduğu yazar. Ekrandaki sırayla.
export function eksikAlanlar(a: { etiket: string; taniId: string; cinsiyet?: 'kadin' | 'erkek' }): EksikAlan[] {
  const eksik: EksikAlan[] = []
  if (!etiketGecerliMi(a.etiket)) eksik.push('etiket')
  if (a.cinsiyet === undefined) eksik.push('cinsiyet')
  if (a.taniId === '') eksik.push('tani')
  return eksik
}

export function yeniListe(alanlar: ListeAlanlari, simdi = new Date()): HastaListesi {
  return {
    ...alanlar,
    etiket: alanlar.etiket.trim(),
    id: idUret(simdi),
    olusturma: simdi.toISOString(),
    cevaplar: {},
  }
}

// Kural 11: cinsiyet ya da yaş değişince cevaplar korunur.
export function listeyiDuzenle(liste: HastaListesi, alanlar: DuzenlenebilirAlanlar): HastaListesi {
  return { ...liste, etiket: alanlar.etiket.trim(), cinsiyet: alanlar.cinsiyet, yas65Ustu: alanlar.yas65Ustu }
}

export function cevapla(liste: HastaListesi, soruId: string, cevap: Cevap | undefined): HastaListesi {
  const cevaplar = { ...liste.cevaplar }
  if (cevap === undefined) delete cevaplar[soruId]
  else cevaplar[soruId] = cevap
  return { ...liste, cevaplar }
}

// Elle ve otomatik silmenin tek yolu. Faz 5: silinen listelerin kullanım sayaçları burada güncellenecek.
export function listeleriSil(listeler: HastaListesi[], idler: string[]): HastaListesi[] {
  if (idler.length === 0) return listeler
  return listeler.filter((l) => !idler.includes(l.id))
}

// olusturma üzerinden OTOMATIK_SILME_GUN ya da daha fazla geçmiş listeler.
export function eskiListeIdleri(listeler: HastaListesi[], simdi = new Date()): string[] {
  const sinir = simdi.getTime() - OTOMATIK_SILME_GUN * 24 * 60 * 60 * 1000
  return listeler.filter((l) => Date.parse(l.olusturma) <= sinir).map((l) => l.id)
}

// localStorage'a erişen tek modül. Okunamayan kayıt yok sayılır, hata uygulamayı durdurmaz.
import type { HastaListesi } from './listeler'
import { ozelMetinGecerliMi, type OzelSoru } from './ozelSorular'

const LISTELER = 'anamnez.listeler.v1'
const AYARLAR = 'anamnez.ayarlar.v1'
const OZEL_SORULAR = 'anamnez.ozelSorular.v1'

export interface Ayarlar {
  dogrulanmaliGoster: boolean
}

export const VARSAYILAN_AYARLAR: Ayarlar = { dogrulanmaliGoster: true }

function oku(anahtar: string): unknown {
  try {
    const metin = localStorage.getItem(anahtar)
    return metin === null ? undefined : JSON.parse(metin)
  } catch {
    return undefined
  }
}

function yaz(anahtar: string, deger: unknown): boolean {
  try {
    localStorage.setItem(anahtar, JSON.stringify(deger))
    return true
  } catch {
    return false
  }
}

const CEVAPLAR = ['evet', 'hayir', 'soruldu']

function listeGecerliMi(v: unknown, taniIdleri: Set<string>): v is HastaListesi {
  if (typeof v !== 'object' || v === null) return false
  const l = v as Record<string, unknown>
  return (
    typeof l.id === 'string' && l.id !== '' &&
    typeof l.etiket === 'string' &&
    typeof l.taniId === 'string' && taniIdleri.has(l.taniId) &&
    (l.cinsiyet === 'kadin' || l.cinsiyet === 'erkek') &&
    typeof l.yas65Ustu === 'boolean' &&
    typeof l.olusturma === 'string' && !Number.isNaN(Date.parse(l.olusturma)) &&
    typeof l.cevaplar === 'object' && l.cevaplar !== null && !Array.isArray(l.cevaplar) &&
    Object.values(l.cevaplar).every((c) => CEVAPLAR.includes(c as string))
  )
}

// Tanısı artık sorular.json'da olmayan liste de okunamayan kayıt sayılır.
export function listeleriOku(taniIdleri: Set<string>): HastaListesi[] {
  const v = oku(LISTELER)
  if (!Array.isArray(v)) return []
  return v.filter((l) => listeGecerliMi(l, taniIdleri))
}

export function listeleriYaz(listeler: HastaListesi[]): boolean {
  return yaz(LISTELER, listeler)
}

export function ayarlariOku(): Ayarlar {
  const v = oku(AYARLAR) as Partial<Ayarlar> | undefined
  return {
    dogrulanmaliGoster:
      typeof v?.dogrulanmaliGoster === 'boolean' ? v.dogrulanmaliGoster : VARSAYILAN_AYARLAR.dogrulanmaliGoster,
  }
}

export function ayarlariYaz(ayarlar: Ayarlar): boolean {
  return yaz(AYARLAR, ayarlar)
}

function ozelSoruGecerliMi(v: unknown): v is OzelSoru {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.startsWith('ozel-') &&
    typeof o.hedef === 'string' && o.hedef !== '' &&
    typeof o.metin === 'string' && ozelMetinGecerliMi(o.metin)
  )
}

// Tanı id'sine göre süzülmez: sorular.json değişse de özel sorular kaybolmaz.
export function ozelSorulariOku(): OzelSoru[] {
  const v = oku(OZEL_SORULAR)
  if (!Array.isArray(v)) return []
  return v.filter(ozelSoruGecerliMi)
}

export function ozelSorulariYaz(sorular: OzelSoru[]): boolean {
  return yaz(OZEL_SORULAR, sorular)
}

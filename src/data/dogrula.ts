import type { SoruVerisi } from './sema'

export class VeriHatasi extends Error {}

type Nesne = Record<string, unknown>

function hata(yol: string, beklenen: string): never {
  throw new VeriHatasi(`${yol}: ${beklenen}`)
}

function nesne(v: unknown, yol: string): Nesne {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) hata(yol, 'nesne olmalı')
  return v as Nesne
}

function dizi(v: unknown, yol: string): unknown[] {
  if (!Array.isArray(v)) hata(yol, 'dizi olmalı')
  return v
}

function metin(v: unknown, yol: string, bosOlabilir = false): string {
  if (typeof v !== 'string' || (!bosOlabilir && v.trim() === '')) {
    hata(yol, bosOlabilir ? 'metin olmalı' : 'boş olmayan metin olmalı')
  }
  return v
}

function secenek(v: unknown, yol: string, degerler: readonly string[]): void {
  if (typeof v !== 'string' || !degerler.includes(v)) {
    hata(yol, `şunlardan biri olmalı: ${degerler.join(', ')}`)
  }
}

// Bilinmeyen alanlar görmezden gelinir (SPEC bölüm 3).
function soruyuDogrula(v: unknown, yol: string, idler: Set<string>): void {
  const s = nesne(v, yol)
  idEkle(metin(s.id, `${yol}.id`), `${yol}.id`, idler)
  metin(s.metin, `${yol}.metin`)
  secenek(s.oncelik, `${yol}.oncelik`, ['kritik', 'standart'])
  if (typeof s.dogrulanmali !== 'boolean') hata(`${yol}.dogrulanmali`, 'true ya da false olmalı')
  const kaynak = nesne(s.kaynak, `${yol}.kaynak`)
  metin(kaynak.ad, `${yol}.kaynak.ad`)
  metin(kaynak.url, `${yol}.kaynak.url`, true)
  dizi(s.alt_sorular, `${yol}.alt_sorular`).forEach((a, i) => {
    const ay = `${yol}.alt_sorular[${i}]`
    const alt = nesne(a, ay)
    idEkle(metin(alt.id, `${ay}.id`), `${ay}.id`, idler)
    metin(alt.metin, `${ay}.metin`)
  })
  if (s.tip !== undefined) secenek(s.tip, `${yol}.tip`, ['acik'])
  if (s.kosul !== undefined) secenek(s.kosul, `${yol}.kosul`, ['kadin', '65_ustu'])
}

function idEkle(id: string, yol: string, idler: Set<string>): void {
  if (idler.has(id)) hata(yol, `"${id}" id'si birden fazla kullanılmış`)
  idler.add(id)
}

export function dogrula(json: unknown): SoruVerisi {
  const kok = nesne(json, 'kök')
  metin(kok.surum, 'surum')
  metin(kok.guncelleme, 'guncelleme')

  // Soru ve alt soru id'leri tüm dosyada birlikte benzersiz olmalı.
  const idler = new Set<string>()
  const ortak = nesne(kok.ortak, 'ortak')
  dizi(ortak.sorular, 'ortak.sorular').forEach((s, i) => soruyuDogrula(s, `ortak.sorular[${i}]`, idler))

  const tanilar = dizi(kok.tanilar, 'tanilar')
  if (tanilar.length === 0) hata('tanilar', 'en az bir tanı olmalı')
  const taniIdleri = new Set<string>()
  tanilar.forEach((t, i) => {
    const yol = `tanilar[${i}]`
    const tani = nesne(t, yol)
    idEkle(metin(tani.id, `${yol}.id`), `${yol}.id`, taniIdleri)
    metin(tani.ad, `${yol}.ad`)
    dizi(tani.sorular, `${yol}.sorular`).forEach((s, j) => soruyuDogrula(s, `${yol}.sorular[${j}]`, idler))
  })

  return json as SoruVerisi
}

export function cozumle(icerik: string): SoruVerisi {
  let json: unknown
  try {
    json = JSON.parse(icerik)
  } catch (e) {
    throw new VeriHatasi(`Geçerli bir JSON değil (${(e as Error).message})`)
  }
  return dogrula(json)
}


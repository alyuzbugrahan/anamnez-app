// docs/SPEC.md bölüm 5'teki kurallar. Bileşenler bu fonksiyonları çağırır.
import type { Soru, SoruVerisi } from '../data/sema'

export type Cevap = 'evet' | 'hayir' | 'soruldu'
export type Buton = Cevap

// SPEC bölüm 4'teki HastaListesi'nin kurallar için gereken kısmı.
export interface ListeBilgisi {
  taniId: string
  cinsiyet: 'kadin' | 'erkek'
  yas65Ustu: boolean
  cevaplar: Record<string, Cevap>
}

// Kural 1
export function gorunurMu(soru: Soru, liste: Omit<ListeBilgisi, 'cevaplar'>): boolean {
  if (soru.kosul === 'kadin') return liste.cinsiyet === 'kadin'
  if (soru.kosul === '65_ustu') return liste.yas65Ustu
  return true
}

// Kural 2 ve 3. undefined = sorulmadı.
export function sonrakiCevap(soru: Soru, mevcut: Cevap | undefined, basilan: Buton): Cevap | undefined {
  const izinli: Buton[] = soru.tip === 'acik' ? ['soruldu'] : ['evet', 'hayir']
  if (!izinli.includes(basilan)) return mevcut
  return mevcut === basilan ? undefined : basilan
}

// Kural 4
export function altSorularAcikMi(cevap: Cevap | undefined): boolean {
  return cevap === 'evet' || cevap === 'soruldu'
}

export function bolumler(veri: SoruVerisi, taniId: string): { baslik: string; sorular: Soru[] }[] {
  const tani = veri.tanilar.find((t) => t.id === taniId)
  if (!tani) return [{ baslik: 'Ortak', sorular: veri.ortak.sorular }]
  return [
    { baslik: 'Ortak', sorular: veri.ortak.sorular },
    { baslik: tani.ad, sorular: tani.sorular },
  ]
}

// Kural 7 ve 11: yalnızca görünür sorular sayılır; gizli sorunun saklı cevabı sayılmaz.
export function sayac(veri: SoruVerisi, liste: ListeBilgisi): { sorulmadi: number; kritik: number } {
  let sorulmadi = 0
  let kritik = 0
  for (const b of bolumler(veri, liste.taniId)) {
    for (const s of b.sorular) {
      if (!gorunurMu(s, liste) || liste.cevaplar[s.id] !== undefined) continue
      sorulmadi++
      if (s.oncelik === 'kritik') kritik++
    }
  }
  return { sorulmadi, kritik }
}

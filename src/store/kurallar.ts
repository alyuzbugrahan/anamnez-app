// docs/SPEC.md bölüm 5'teki kurallar. Bileşenler bu fonksiyonları çağırır.
import type { Soru, SoruVerisi } from '../data/sema'
import { soruyaCevir, type OzelSoru } from './ozelSorular'

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

// Kural 2 ve 3: satırda görünen butonlar, ekrandaki sırayla.
export function butonlar(soru: Soru): Buton[] {
  return soru.tip === 'acik' ? ['soruldu'] : ['hayir', 'evet']
}

// Kural 9: kaynağı olmayan sorunun metni dokunulabilir değildir.
export function kaynakVarMi(soru: Soru): boolean {
  return soru.kaynak.ad.trim() !== '' || soru.kaynak.url.trim() !== ''
}

// Kural 2 ve 3. undefined = sorulmadı.
export function sonrakiCevap(soru: Soru, mevcut: Cevap | undefined, basilan: Buton): Cevap | undefined {
  if (!butonlar(soru).includes(basilan)) return mevcut
  return mevcut === basilan ? undefined : basilan
}

// Kural 4
export function altSorularAcikMi(cevap: Cevap | undefined): boolean {
  return cevap === 'evet' || cevap === 'soruldu'
}

// Kural 8: özel sorular ilgili bölümün sonunda. Silinmiş özel sorunun cevabı burada olmadığı için yok sayılır.
export function bolumler(veri: SoruVerisi, taniId: string, ozel: OzelSoru[] = []): { baslik: string; sorular: Soru[] }[] {
  const ozelleri = (hedef: string) => ozel.filter((o) => o.hedef === hedef).map(soruyaCevir)
  const ortak = { baslik: 'Ortak', sorular: [...veri.ortak.sorular, ...ozelleri('ortak')] }
  const tani = veri.tanilar.find((t) => t.id === taniId)
  if (!tani) return [ortak]
  return [ortak, { baslik: tani.ad, sorular: [...tani.sorular, ...ozelleri(tani.id)] }]
}

// Kural 7: bölüm başlığındaki "X kaldı". Yalnızca görünür ve sorulmamış sorular.
export function kalan(sorular: Soru[], liste: ListeBilgisi): number {
  return sorular.filter((s) => gorunurMu(s, liste) && liste.cevaplar[s.id] === undefined).length
}

// SPEC ekran 1: en yeni üstte; sorusu kalmayan ("Tamam ✓") listeler en altta, kendi aralarında yine en yeni üstte.
export function hastaSirasi<L extends ListeBilgisi & { olusturma: string }>(veri: SoruVerisi, listeler: L[], ozel: OzelSoru[] = []): L[] {
  const bitti = new Map(listeler.map((l) => [l, sayac(veri, l, ozel).sorulmadi === 0]))
  return [...listeler].sort((a, b) => Number(bitti.get(a)) - Number(bitti.get(b)) || b.olusturma.localeCompare(a.olusturma))
}

// Kural 7 ve 11: yalnızca görünür sorular sayılır; gizli sorunun saklı cevabı sayılmaz.
export function sayac(veri: SoruVerisi, liste: ListeBilgisi, ozel: OzelSoru[] = []): { sorulmadi: number; kritik: number } {
  let sorulmadi = 0
  let kritik = 0
  for (const b of bolumler(veri, liste.taniId, ozel)) {
    for (const s of b.sorular) {
      if (!gorunurMu(s, liste) || liste.cevaplar[s.id] !== undefined) continue
      sorulmadi++
      if (s.oncelik === 'kritik') kritik++
    }
  }
  return { sorulmadi, kritik }
}

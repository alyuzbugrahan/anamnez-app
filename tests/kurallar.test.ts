import { describe, expect, it } from 'vitest'
import type { Soru, SoruVerisi } from '../src/data/sema'
import { altSorularAcikMi, bolumler, butonlar, gorunurMu, hastaSirasi, kalan, kaynakVarMi, sayac, sonrakiCevap, type Buton, type ListeBilgisi } from '../src/store/kurallar'
import { cevapla, yeniListe } from '../src/store/listeler'
import { soruyaCevir } from '../src/store/ozelSorular'

function soru(id: string, ek: Partial<Soru> = {}): Soru {
  return { id, metin: id, oncelik: 'standart', dogrulanmali: false, kaynak: { ad: 'K', url: '' }, alt_sorular: [], ...ek }
}

const veri: SoruVerisi = {
  surum: '0',
  guncelleme: '',
  ortak: {
    sorular: [
      soru('o1', { oncelik: 'kritik' }),
      soru('o2', { kosul: 'kadin', oncelik: 'kritik' }),
      soru('o3', { kosul: '65_ustu' }),
      soru('o4', { tip: 'acik' }),
    ],
  },
  tanilar: [
    { id: 't', ad: 'Tanı', sorular: [soru('t1', { oncelik: 'kritik' }), soru('t2')] },
    { id: 'u', ad: 'Başka', sorular: [soru('u1')] },
  ],
}

function liste(ek: Partial<ListeBilgisi> = {}): ListeBilgisi {
  return { taniId: 't', cinsiyet: 'erkek', yas65Ustu: false, cevaplar: {}, ...ek }
}

describe('gorunurMu', () => {
  const kadin = soru('k', { kosul: 'kadin' })
  const yasli = soru('y', { kosul: '65_ustu' })

  it('koşulsuz soru herkese görünür', () => {
    expect(gorunurMu(soru('x'), liste())).toBe(true)
  })
  it('kadin koşullu soru erkekte gizli, kadında görünür', () => {
    expect(gorunurMu(kadin, liste())).toBe(false)
    expect(gorunurMu(kadin, liste({ cinsiyet: 'kadin' }))).toBe(true)
  })
  it('65_ustu koşullu soru yalnızca işaretliyse görünür', () => {
    expect(gorunurMu(yasli, liste())).toBe(false)
    expect(gorunurMu(yasli, liste({ yas65Ustu: true }))).toBe(true)
    expect(gorunurMu(yasli, liste({ cinsiyet: 'kadin' }))).toBe(false)
  })
})

describe('sonrakiCevap', () => {
  const eh = soru('eh')
  const acik = soru('a', { tip: 'acik' })

  it('evet/hayır: sorulmadı → evet / hayır', () => {
    expect(sonrakiCevap(eh, undefined, 'evet')).toBe('evet')
    expect(sonrakiCevap(eh, undefined, 'hayir')).toBe('hayir')
  })
  it('evet/hayır: seçili butona tekrar basınca sorulmadıya döner', () => {
    expect(sonrakiCevap(eh, 'evet', 'evet')).toBeUndefined()
    expect(sonrakiCevap(eh, 'hayir', 'hayir')).toBeUndefined()
  })
  it('evet/hayır: diğer butona basınca geçer', () => {
    expect(sonrakiCevap(eh, 'evet', 'hayir')).toBe('hayir')
    expect(sonrakiCevap(eh, 'hayir', 'evet')).toBe('evet')
  })
  it('açık soru: sorulmadı ↔ soruldu', () => {
    expect(sonrakiCevap(acik, undefined, 'soruldu')).toBe('soruldu')
    expect(sonrakiCevap(acik, 'soruldu', 'soruldu')).toBeUndefined()
  })
  it('soru tipine uymayan buton durumu değiştirmez', () => {
    expect(sonrakiCevap(acik, undefined, 'evet')).toBeUndefined()
    expect(sonrakiCevap(eh, 'evet', 'soruldu')).toBe('evet')
  })
})

describe('butonlar', () => {
  it('evet/hayır sorusunda Hayır sonra Evet, açık soruda yalnızca Soruldu', () => {
    expect(butonlar(soru('eh'))).toEqual(['hayir', 'evet'])
    expect(butonlar(soru('a', { tip: 'acik' }))).toEqual(['soruldu'])
  })
})

// Checklist'teki dokunma yolu: sonrakiCevap sonucu cevapla ile listeye yazılır.
describe('seçili butona tekrar dokunma', () => {
  const dokun = (l: ReturnType<typeof yeniListe>, s: Soru, b: Buton) => cevapla(l, s.id, sonrakiCevap(s, l.cevaplar[s.id], b))
  const bos = yeniListe({ etiket: 'Yatak 1', taniId: 't', cinsiyet: 'erkek', yas65Ustu: false })
  const durumlar: [string, Buton][] = [['o1', 'evet'], ['o1', 'hayir'], ['o4', 'soruldu']]

  it.each(durumlar)('%s / %s: iki dokunuşta seçim kalkar, kayıt silinir, sayaç geri döner', (id, b) => {
    const s = veri.ortak.sorular.find((x) => x.id === id)!
    const bir = dokun(bos, s, b)
    expect(bir.cevaplar[id]).toBe(b)
    const iki = dokun(bir, s, b)
    expect(id in iki.cevaplar).toBe(false)
    expect(sayac(veri, iki)).toEqual(sayac(veri, bos))
  })
})

describe('kaynakVarMi', () => {
  it('kaynak adı ya da bağlantısı varsa true', () => {
    expect(kaynakVarMi(soru('a'))).toBe(true)
    expect(kaynakVarMi(soru('b', { kaynak: { ad: '', url: 'https://ornek.org' } }))).toBe(true)
  })
  it('ikisi de boşsa (ya da yalnızca boşluk) false: metin buton olmaz', () => {
    expect(kaynakVarMi(soru('c', { kaynak: { ad: '', url: '' } }))).toBe(false)
    expect(kaynakVarMi(soru('d', { kaynak: { ad: '  ', url: ' ' } }))).toBe(false)
  })
  it('özel sorunun kaynağı "Özel soru" olarak görünür (kural 8)', () => {
    expect(kaynakVarMi(soruyaCevir({ id: 'ozel-1', hedef: 'ortak', metin: 'X' }))).toBe(true)
  })
})

describe('kalan', () => {
  const ortak = veri.ortak.sorular
  it('bölümde görünür ve sorulmamış soruları sayar', () => {
    // erkek, 65 altı: o1 ve o4 görünür
    expect(kalan(ortak, liste())).toBe(2)
    expect(kalan(ortak, liste({ cinsiyet: 'kadin', yas65Ustu: true }))).toBe(4)
  })
  it('cevaplanan düşer; gizli sorunun cevabı etkilemez', () => {
    expect(kalan(ortak, liste({ cevaplar: { o1: 'hayir' } }))).toBe(1)
    expect(kalan(ortak, liste({ cevaplar: { o2: 'evet' } }))).toBe(2)
  })
})

describe('altSorularAcikMi', () => {
  it('yalnızca evet ve soruldu iken açık', () => {
    expect(altSorularAcikMi('evet')).toBe(true)
    expect(altSorularAcikMi('soruldu')).toBe(true)
    expect(altSorularAcikMi('hayir')).toBe(false)
    expect(altSorularAcikMi(undefined)).toBe(false)
  })
})

describe('bolumler', () => {
  it('önce Ortak, sonra tanı; sorular dizideki sırayla', () => {
    const b = bolumler(veri, 't')
    expect(b.map((x) => x.baslik)).toEqual(['Ortak', 'Tanı'])
    expect(b[0].sorular.map((s) => s.id)).toEqual(['o1', 'o2', 'o3', 'o4'])
    expect(b[1].sorular.map((s) => s.id)).toEqual(['t1', 't2'])
  })
})

describe('sayac', () => {
  it('erkek, 65 altı: yalnızca görünür sorular sayılır', () => {
    // o1, o4, t1, t2 görünür; kritik: o1, t1
    expect(sayac(veri, liste())).toEqual({ sorulmadi: 4, kritik: 2 })
  })
  it('kadın ve 65 üstü: koşullu sorular da sayılır', () => {
    expect(sayac(veri, liste({ cinsiyet: 'kadin', yas65Ustu: true }))).toEqual({ sorulmadi: 6, kritik: 3 })
  })
  it('cevaplanan sorular düşer (hayır da sorulmuş sayılır)', () => {
    expect(sayac(veri, liste({ cevaplar: { o1: 'hayir', o4: 'soruldu' } }))).toEqual({ sorulmadi: 2, kritik: 1 })
  })
  it('başka tanının sorusu sayılmaz', () => {
    expect(sayac(veri, liste({ taniId: 'u' }))).toEqual({ sorulmadi: 3, kritik: 1 })
  })
  it('gizlenen sorunun cevabı saklanır ama sayaca girmez', () => {
    const kadin = liste({ cinsiyet: 'kadin', cevaplar: { o2: 'evet' } })
    expect(sayac(veri, kadin)).toEqual({ sorulmadi: 4, kritik: 2 })
    const erkek = { ...kadin, cinsiyet: 'erkek' as const }
    expect(erkek.cevaplar.o2).toBe('evet')
    expect(sayac(veri, erkek)).toEqual({ sorulmadi: 4, kritik: 2 })
  })
})

describe('hastaSirasi', () => {
  // Erkek, 65 altı, tanı t: görünür sorular o1, o4, t1, t2
  const hepsi = { o1: 'hayir', o4: 'soruldu', t1: 'evet', t2: 'hayir' } as const
  const l = (etiket: string, gun: number, cevaplar: ListeBilgisi['cevaplar'] = {}) => ({
    ...liste({ cevaplar }),
    etiket,
    olusturma: `2026-11-${String(gun).padStart(2, '0')}T08:00:00.000Z`,
  })

  it('bitmemiş listeler en yeni üstte', () => {
    const sira = hastaSirasi(veri, [l('A', 10), l('B', 12), l('C', 11)])
    expect(sira.map((x) => x.etiket)).toEqual(['B', 'C', 'A'])
  })
  it('sorusu kalmayan listeler en altta, kendi aralarında en yeni üstte', () => {
    const sira = hastaSirasi(veri, [l('Bitti eski', 13, hepsi), l('Açık eski', 10), l('Bitti yeni', 14, hepsi), l('Açık yeni', 12)])
    expect(sira.map((x) => x.etiket)).toEqual(['Açık yeni', 'Açık eski', 'Bitti yeni', 'Bitti eski'])
  })
  it('yalnızca kritik sorusu kalan liste bitmiş sayılmaz (kalan 0 olmalı)', () => {
    const yalnizKritikKaldi = l('K', 15, { o4: 'soruldu', t2: 'hayir' })
    expect(hastaSirasi(veri, [l('Bitti', 16, hepsi), yalnizKritikKaldi]).map((x) => x.etiket)).toEqual(['K', 'Bitti'])
  })
  it('girdi dizisini değiştirmez', () => {
    const girdi = [l('A', 10), l('B', 12)]
    hastaSirasi(veri, girdi)
    expect(girdi.map((x) => x.etiket)).toEqual(['A', 'B'])
  })
})

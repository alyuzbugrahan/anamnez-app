import { describe, expect, it } from 'vitest'
import type { Soru, SoruVerisi } from '../src/data/sema'
import { altSorularAcikMi, bolumler, gorunurMu, sayac, sonrakiCevap, type ListeBilgisi } from '../src/store/kurallar'

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

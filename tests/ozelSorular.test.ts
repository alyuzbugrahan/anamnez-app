import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SoruVerisi } from '../src/data/sema'
import { ozelSorulariOku, ozelSorulariYaz } from '../src/store/kayit'
import { bolumler, sayac, type ListeBilgisi } from '../src/store/kurallar'
import { idUret, yeniListe } from '../src/store/listeler'
import { OZEL_SORU_EN_FAZLA, ozelSoruEkle, ozelSoruSil } from '../src/store/ozelSorular'

const soru = (id: string) => ({
  id, metin: id, oncelik: 'standart' as const, dogrulanmali: false, kaynak: { ad: 'k', url: '' }, alt_sorular: [],
})
const veri: SoruVerisi = {
  surum: '1', guncelleme: '2026-11-13',
  ortak: { sorular: [soru('o1')] },
  tanilar: [{ id: 't', ad: 'Tanı', sorular: [soru('t1')] }],
}
const liste: ListeBilgisi = { taniId: 't', cinsiyet: 'erkek', yas65Ustu: false, cevaplar: {} }

afterEach(() => vi.unstubAllGlobals())

describe('ozelSoruEkle', () => {
  it('metni kırpar, id "ozel-" ile başlar', () => {
    const [o] = ozelSoruEkle([], 'ortak', '  Sigara?  ')
    expect(o.metin).toBe('Sigara?')
    expect(o.id.startsWith('ozel-')).toBe(true)
  })

  it(`boş ya da ${OZEL_SORU_EN_FAZLA} karakterden uzun metin eklenmez`, () => {
    expect(ozelSoruEkle([], 'ortak', '   ')).toEqual([])
    expect(ozelSoruEkle([], 'ortak', 'a'.repeat(OZEL_SORU_EN_FAZLA + 1))).toEqual([])
    expect(ozelSoruEkle([], 'ortak', 'a'.repeat(OZEL_SORU_EN_FAZLA))).toHaveLength(1)
  })
})

describe('checklist ve sayaç', () => {
  const ozel = [...ozelSoruEkle([], 't', 'Tanı özel'), ...ozelSoruEkle([], 'ortak', 'Ortak özel')]

  it('özel soru ilgili bölümün sonunda görünür', () => {
    const [ortak, tani] = bolumler(veri, 't', ozel)
    expect(ortak.sorular.map((s) => s.metin)).toEqual(['o1', 'Ortak özel'])
    expect(tani.sorular.map((s) => s.metin)).toEqual(['t1', 'Tanı özel'])
  })

  it('başka tanının özel sorusu görünmez', () => {
    const baska = ozelSoruEkle([], 'baska', 'X')
    expect(bolumler(veri, 't', baska).flatMap((b) => b.sorular).map((s) => s.id)).toEqual(['o1', 't1'])
  })

  it('özel soru sayaca girer, işaretlenince düşer', () => {
    expect(sayac(veri, liste, ozel).sorulmadi).toBe(4)
    expect(sayac(veri, { ...liste, cevaplar: { [ozel[0].id]: 'evet' } }, ozel).sorulmadi).toBe(3)
  })

  it('silinen özel sorunun cevabı yok sayılır', () => {
    const cevapli = { ...liste, cevaplar: { [ozel[0].id]: 'evet' as const } }
    const kalan = ozelSoruSil(ozel, ozel[0].id)
    expect(sayac(veri, cevapli, kalan).sorulmadi).toBe(3)
    expect(bolumler(veri, 't', kalan).flatMap((b) => b.sorular).some((s) => s.id === ozel[0].id)).toBe(false)
  })
})

describe('kayıt', () => {
  it('tanısı sorular.json\'dan kalkan özel soru da okunur; bozuk kayıt atlanır', () => {
    const depo = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => depo.get(k) ?? null,
      setItem: (k: string, v: string) => void depo.set(k, v),
    })
    const ozel = ozelSoruEkle([], 'kaldirilan-tani', 'Soru')
    ozelSorulariYaz(ozel)
    expect(ozelSorulariOku()).toEqual(ozel)

    depo.set('anamnez.ozelSorular.v1', JSON.stringify([...ozel, { id: 'x', hedef: 'ortak', metin: 'a' }, null]))
    expect(ozelSorulariOku()).toEqual(ozel)
  })
})

describe('id üretimi', () => {
  it('crypto olmadan (güvenli olmayan bağlantı) çalışır ve benzersizdir', () => {
    vi.stubGlobal('crypto', undefined)
    const simdi = new Date('2026-11-13T08:00:00Z')
    const idler = new Set(Array.from({ length: 1000 }, () => idUret(simdi)))
    expect(idler.size).toBe(1000)
    expect(yeniListe({ etiket: 'a', taniId: 't', cinsiyet: 'erkek', yas65Ustu: false }).id).toBeTruthy()
    expect(ozelSoruEkle([], 'ortak', 'a')).toHaveLength(1)
  })
})

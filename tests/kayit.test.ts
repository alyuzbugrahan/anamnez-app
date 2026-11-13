import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ayarlariOku, ayarlariYaz, listeleriOku, listeleriYaz } from '../src/store/kayit'
import { yeniListe } from '../src/store/listeler'

const ANAHTAR = 'anamnez.listeler.v1'
const taniIdleri = new Set(['t'])
let depo: Map<string, string>

beforeEach(() => {
  depo = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => depo.get(k) ?? null,
    setItem: (k: string, v: string) => void depo.set(k, v),
  })
})
afterEach(() => vi.unstubAllGlobals())

const liste = () => yeniListe({ etiket: 'Yatak 1', taniId: 't', cinsiyet: 'kadin', yas65Ustu: true })

describe('listeler', () => {
  it('yazılan liste aynen okunur', () => {
    const l = { ...liste(), cevaplar: { o1: 'evet' as const } }
    expect(listeleriYaz([l])).toBe(true)
    expect(listeleriOku(taniIdleri)).toEqual([l])
  })

  it('kayıt yoksa boş liste', () => {
    expect(listeleriOku(taniIdleri)).toEqual([])
  })

  it('bozuk JSON ya da dizi olmayan kayıt boş liste döner', () => {
    depo.set(ANAHTAR, '{bozuk')
    expect(listeleriOku(taniIdleri)).toEqual([])
    depo.set(ANAHTAR, '{"a":1}')
    expect(listeleriOku(taniIdleri)).toEqual([])
  })

  it('okunamayan tek kayıt yok sayılır, diğerleri kalır', () => {
    const iyi = liste()
    const bozuklar = [
      null,
      'metin',
      { ...iyi, cinsiyet: 'diger' },
      { ...iyi, olusturma: 'dün' },
      { ...iyi, cevaplar: { o1: 'belki' } },
      { ...iyi, taniId: 'kaldirilmis-tani' },
      { id: 'eski-bicim', ad: 'Yatak 2', tani: 't' },
    ]
    depo.set(ANAHTAR, JSON.stringify([...bozuklar, iyi]))
    expect(listeleriOku(taniIdleri)).toEqual([iyi])
  })

  it('localStorage hata fırlatırsa çökmez', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('erişim yok')
      },
      setItem: () => {
        throw new Error('kota doldu')
      },
    })
    expect(listeleriOku(taniIdleri)).toEqual([])
    expect(listeleriYaz([liste()])).toBe(false)
    expect(ayarlariOku()).toEqual({ dogrulanmaliGoster: true })
    expect(ayarlariYaz({ dogrulanmaliGoster: false })).toBe(false)
  })
})

describe('ayarlar', () => {
  it('varsayılan: doğrulanmalı işareti açık', () => {
    expect(ayarlariOku()).toEqual({ dogrulanmaliGoster: true })
  })

  it('kaydedilen tercih okunur, geçersiz değer varsayılana döner', () => {
    ayarlariYaz({ dogrulanmaliGoster: false })
    expect(ayarlariOku()).toEqual({ dogrulanmaliGoster: false })
    depo.set('anamnez.ayarlar.v1', '{"dogrulanmaliGoster":"hayir"}')
    expect(ayarlariOku()).toEqual({ dogrulanmaliGoster: true })
  })
})

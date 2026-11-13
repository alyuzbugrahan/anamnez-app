import { describe, expect, it } from 'vitest'
import ham from '../public/data/sorular.json?raw'
import { cozumle, dogrula, VeriHatasi } from '../src/data/dogrula'

function ornekSoru(id: string): Record<string, unknown> {
  return {
    id,
    metin: 'Ağrınız var mı?',
    oncelik: 'kritik',
    dogrulanmali: false,
    kaynak: { ad: 'Kaynak', url: '' },
    alt_sorular: [{ id: `${id}a`, metin: 'Ne zamandan beri?' }],
  }
}

function ornekVeri(): Record<string, any> {
  return {
    surum: '0.2',
    guncelleme: '2026-11-13',
    ortak: { sorular: [ornekSoru('ortak-01')] },
    tanilar: [{ id: 'tani', ad: 'Tanı', sorular: [ornekSoru('tani-01')] }],
  }
}

describe('gerçek sorular.json', () => {
  it('doğrulamadan geçer ve en az bir tanı içerir', () => {
    const veri = cozumle(ham)
    expect(veri.tanilar.length).toBeGreaterThan(0)
    for (const t of veri.tanilar) expect(t.ad.trim()).not.toBe('')
  })
})

describe('dogrula', () => {
  it('geçerli örneği kabul eder', () => {
    expect(() => dogrula(ornekVeri())).not.toThrow()
  })

  it('bilinmeyen üst düzey ve soru alanlarını görmezden gelir', () => {
    const v = ornekVeri()
    v.sema = { aciklama: 'x' }
    v.ortak.sorular[0].yeniAlan = 42
    expect(() => dogrula(v)).not.toThrow()
  })

  it('isteğe bağlı tip ve kosul alanlarını kabul eder', () => {
    const v = ornekVeri()
    v.ortak.sorular[0].tip = 'acik'
    v.ortak.sorular[0].kosul = '65_ustu'
    expect(() => dogrula(v)).not.toThrow()
  })

  const bozuklar: [string, (v: Record<string, any>) => void, RegExp][] = [
    ['eksik metin', (v) => delete v.ortak.sorular[0].metin, /ortak\.sorular\[0\]\.metin/],
    ['geçersiz oncelik', (v) => (v.tanilar[0].sorular[0].oncelik = 'yuksek'), /tanilar\[0\]\.sorular\[0\]\.oncelik/],
    ['geçersiz tip', (v) => (v.ortak.sorular[0].tip = 'coktan'), /\.tip/],
    ['geçersiz kosul', (v) => (v.ortak.sorular[0].kosul = 'erkek'), /\.kosul/],
    ['dogrulanmali boolean değil', (v) => (v.ortak.sorular[0].dogrulanmali = 'hayir'), /\.dogrulanmali/],
    ['kaynak eksik', (v) => delete v.ortak.sorular[0].kaynak, /\.kaynak/],
    ['alt_sorular dizi değil', (v) => (v.ortak.sorular[0].alt_sorular = {}), /\.alt_sorular/],
    ['alt soru metni eksik', (v) => delete v.ortak.sorular[0].alt_sorular[0].metin, /alt_sorular\[0\]\.metin/],
    ['tanılar boş', (v) => (v.tanilar = []), /en az bir tanı/],
    ['tanı adı eksik', (v) => delete v.tanilar[0].ad, /tanilar\[0\]\.ad/],
    ['soru id tekrarı', (v) => (v.tanilar[0].sorular[0].id = 'ortak-01'), /"ortak-01"/],
    ['alt soru id tekrarı', (v) => (v.tanilar[0].sorular[0].alt_sorular[0].id = 'ortak-01a'), /"ortak-01a"/],
    ['alt soru id soru id ile çakışır', (v) => (v.tanilar[0].sorular[0].alt_sorular[0].id = 'ortak-01'), /"ortak-01"/],
    ['tanı id tekrarı', (v) => v.tanilar.push({ id: 'tani', ad: 'Başka', sorular: [] }), /"tani"/],
  ]

  it.each(bozuklar)('%s: alan yolunu belirten hata verir', (_ad, boz, beklenen) => {
    const v = ornekVeri()
    boz(v)
    expect(() => dogrula(v)).toThrow(VeriHatasi)
    expect(() => dogrula(v)).toThrow(beklenen)
  })
})

describe('cozumle', () => {
  it('bozuk JSON metninde anlaşılır hata verir', () => {
    expect(() => cozumle('{ "surum": ')).toThrow(/Geçerli bir JSON değil/)
  })

  it('JSON nesne değilse hata verir', () => {
    expect(() => cozumle('[]')).toThrow(/kök: nesne olmalı/)
  })
})

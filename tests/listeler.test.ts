import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cevapla,
  eskiListeIdleri,
  etiketGecerliMi,
  listeleriSil,
  listeyiDuzenle,
  OTOMATIK_SILME_GUN,
  yeniListe,
  type ListeAlanlari,
} from '../src/store/listeler'

const alanlar: ListeAlanlari = { etiket: 'Yatak 12', taniId: 't', cinsiyet: 'erkek', yas65Ustu: false }
const GUN = 24 * 60 * 60 * 1000

afterEach(() => vi.useRealTimers())

describe('otomatik silme', () => {
  it(`${OTOMATIK_SILME_GUN} gün dolan liste silinir, dolmayan kalır (sahte tarih)`, () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-01T08:00:00Z'))
    const eski = yeniListe(alanlar)
    vi.setSystemTime(new Date('2026-11-02T08:00:00Z'))
    const yeni = yeniListe({ ...alanlar, etiket: 'Yatak 3' })

    // Açılış: ilk listenin üzerinden tam 7 gün, ikincisinin üzerinden 6 gün geçmiş.
    vi.setSystemTime(new Date(Date.parse('2026-11-01T08:00:00Z') + OTOMATIK_SILME_GUN * GUN))
    const listeler = [eski, yeni]
    expect(listeleriSil(listeler, eskiListeIdleri(listeler))).toEqual([yeni])
  })

  it('süre dolmadan bir dakika önce silinmez', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-01T08:00:00Z'))
    const liste = yeniListe(alanlar)
    vi.setSystemTime(new Date(Date.parse('2026-11-01T08:00:00Z') + OTOMATIK_SILME_GUN * GUN - 60_000))
    expect(eskiListeIdleri([liste])).toEqual([])
  })
})

describe('listeleriSil', () => {
  it('yalnızca verilen listeleri siler', () => {
    const a = yeniListe(alanlar)
    const b = { ...yeniListe(alanlar), id: 'b' }
    expect(listeleriSil([a, b], [a.id])).toEqual([b])
    expect(listeleriSil([a, b], [])).toEqual([a, b])
  })
})

describe('liste işlemleri', () => {
  it('iki listenin cevapları birbirine karışmaz', () => {
    const a = yeniListe(alanlar)
    const b = { ...yeniListe(alanlar), id: 'b' }
    const a2 = cevapla(a, 'o1', 'evet')
    const b2 = cevapla(b, 'o1', 'hayir')
    expect(a2.cevaplar).toEqual({ o1: 'evet' })
    expect(b2.cevaplar).toEqual({ o1: 'hayir' })
    expect(a.cevaplar).toEqual({})
  })

  it('cevabı geri almak kaydı siler', () => {
    const a = cevapla(yeniListe(alanlar), 'o1', 'evet')
    expect(cevapla(a, 'o1', undefined).cevaplar).toEqual({})
  })

  it('düzenleme cevapları ve tanıyı korur', () => {
    const a = cevapla(yeniListe(alanlar), 'o1', 'evet')
    const d = listeyiDuzenle(a, { etiket: ' Yatak 4 ', cinsiyet: 'kadin', yas65Ustu: true })
    expect(d).toMatchObject({ etiket: 'Yatak 4', cinsiyet: 'kadin', yas65Ustu: true, taniId: 't', cevaplar: { o1: 'evet' } })
  })

  it('etiket boş olamaz, en fazla 20 karakter', () => {
    expect(etiketGecerliMi('  ')).toBe(false)
    expect(etiketGecerliMi('a'.repeat(20))).toBe(true)
    expect(etiketGecerliMi('a'.repeat(21))).toBe(false)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { guncellemeDenetle } from '../src/pwa'

function sahteSw(durum: { installing?: { state: string }; update?: () => Promise<void> } | null) {
  const dinleyiciler: (() => void)[] = []
  const yeni = durum?.installing && {
    ...durum.installing,
    addEventListener: (_: string, f: () => void) => dinleyiciler.push(f),
  }
  const kayit = durum && { installing: yeni ?? null, waiting: null, update: durum.update ?? (async () => {}) }
  return {
    sw: { getRegistration: async () => kayit } as unknown as Pick<ServiceWorkerContainer, 'getRegistration'>,
    durumDegis: (s: string) => {
      yeni!.state = s
      dinleyiciler.forEach((f) => f())
    },
  }
}

describe('guncellemeDenetle', () => {
  it('çevrimdışıyken denetlemez', async () => {
    expect(await guncellemeDenetle(sahteSw({}).sw, () => false)).toBe('cevrimdisi')
  })

  it('service worker yoksa desteklenmiyor', async () => {
    expect(await guncellemeDenetle(sahteSw(null).sw, () => true)).toBe('desteklenmiyor')
  })

  it('yeni sürüm yoksa güncel, sayfa yenilenmez', async () => {
    const yenile = vi.fn()
    expect(await guncellemeDenetle(sahteSw({}).sw, () => true, yenile)).toBe('guncel')
    expect(yenile).not.toHaveBeenCalled()
  })

  it('güncelleme isteği başarısızsa (ağ yok) yenilemez', async () => {
    const s = sahteSw({ update: () => Promise.reject(new TypeError('ağ')) })
    expect(await guncellemeDenetle(s.sw, () => true)).toBe('basarisiz')
  })

  it('yeni sürüm devreye girince sayfa yeniden yüklenir', async () => {
    const yenile = vi.fn()
    const s = sahteSw({ installing: { state: 'installing' } })
    const sonuc = guncellemeDenetle(s.sw, () => true, yenile)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    s.durumDegis('activated')
    expect(await sonuc).toBe('yenileniyor')
    expect(yenile).toHaveBeenCalledOnce()
  })
})

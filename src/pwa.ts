// Ayarlar ekranındaki PWA bilgileri (SPEC bölüm 6.5 ve 7).

// Ana ekrandan açıldıysa true. iOS Safari display-mode yerine navigator.standalone kullanır.
export function anaEkrandanMi(): boolean {
  try {
    return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

export type DenetimSonucu = 'guncel' | 'yenileniyor' | 'cevrimdisi' | 'basarisiz' | 'desteklenmiyor'

// Yeni sürüm varsa kurulmasını bekler ve sayfayı yeniden yükler (skipWaiting açık, beklemede kalmaz).
export async function guncellemeDenetle(
  sw: Pick<ServiceWorkerContainer, 'getRegistration'> | undefined = navigator.serviceWorker,
  cevrimici: () => boolean = () => navigator.onLine,
  yenile: () => void = () => location.reload(),
): Promise<DenetimSonucu> {
  if (!cevrimici()) return 'cevrimdisi'
  const kayit = await sw?.getRegistration().catch(() => undefined)
  if (!kayit) return 'desteklenmiyor'
  try {
    await kayit.update()
  } catch {
    return cevrimici() ? 'basarisiz' : 'cevrimdisi'
  }
  const yeni = kayit.installing ?? kayit.waiting
  if (!yeni) return 'guncel'
  return new Promise((sonuc) => {
    const izle = () => {
      if (yeni.state === 'activated') {
        yenile()
        sonuc('yenileniyor')
      } else if (yeni.state === 'redundant') {
        sonuc('basarisiz')
      }
    }
    yeni.addEventListener('statechange', izle)
    izle()
  })
}

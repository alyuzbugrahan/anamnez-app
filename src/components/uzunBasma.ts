import { useRef, type PointerEvent } from 'react'

const SURE_MS = 500
const KAYMA_PX = 10

// Dokunma (ya da klavyeyle tıklama) ve uzun basma aynı işi yapar (SPEC kural 9).
// Uzun basma tetiklendiyse parmak kalkınca gelen tıklama yok sayılır; iş iki kez yapılmaz.
// Kaydırma (pointercancel ya da parmağın kayması) uzun basmayı iptal eder.
export function useUzunBasma(tetikle: () => void) {
  const zamanlayici = useRef<number | undefined>(undefined)
  const baslangic = useRef({ x: 0, y: 0 })
  const uzunBasildi = useRef(false)

  const iptal = () => {
    window.clearTimeout(zamanlayici.current)
    zamanlayici.current = undefined
  }

  return {
    onClick: () => {
      if (uzunBasildi.current) {
        uzunBasildi.current = false
        return
      }
      tetikle()
    },
    onPointerDown: (e: PointerEvent) => {
      baslangic.current = { x: e.clientX, y: e.clientY }
      uzunBasildi.current = false
      iptal()
      zamanlayici.current = window.setTimeout(() => {
        zamanlayici.current = undefined
        uzunBasildi.current = true
        tetikle()
      }, SURE_MS)
    },
    onPointerMove: (e: PointerEvent) => {
      if (Math.hypot(e.clientX - baslangic.current.x, e.clientY - baslangic.current.y) > KAYMA_PX) iptal()
    },
    onPointerUp: iptal,
    onPointerCancel: iptal,
    onPointerLeave: iptal,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }
}

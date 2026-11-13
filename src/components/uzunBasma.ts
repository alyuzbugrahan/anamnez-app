import { useRef, type PointerEvent } from 'react'

const SURE_MS = 500
const KAYMA_PX = 10

// Kaydırma (pointercancel ya da parmağın kayması) uzun basmayı iptal eder.
export function useUzunBasma(tetikle: () => void) {
  const zamanlayici = useRef<number | undefined>(undefined)
  const baslangic = useRef({ x: 0, y: 0 })

  const iptal = () => {
    window.clearTimeout(zamanlayici.current)
    zamanlayici.current = undefined
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      baslangic.current = { x: e.clientX, y: e.clientY }
      iptal()
      zamanlayici.current = window.setTimeout(() => {
        zamanlayici.current = undefined
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

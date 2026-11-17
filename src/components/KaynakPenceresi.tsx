import { useEffect, useId, useRef } from 'react'
import type { Soru } from '../data/sema'

// OnayPenceresi ile aynı kalıp: ekrana gelince açılır, böylece odak dolu içerikteki ilk butona gider.
export function KaynakPenceresi({ soru, onKapat }: { soru: Soru; onKapat: () => void }) {
  const pencere = useRef<HTMLDialogElement>(null)
  const baslik = useId()

  useEffect(() => {
    const p = pencere.current
    if (p && !p.open) p.showModal()
  }, [])

  return (
    <dialog
      ref={pencere}
      className="kaynak"
      aria-labelledby={baslik}
      onClose={onKapat}
      onClick={(e) => e.target === pencere.current && pencere.current.close()}
    >
      <div className="pencere-ic">
        <h2 id={baslik} className="pencere-baslik">Kaynak</h2>
        <p>{soru.kaynak.ad}</p>
        {soru.kaynak.url && (
          <p>
            <a href={soru.kaynak.url} target="_blank" rel="noopener noreferrer">
              Kaynağı aç
            </a>
          </p>
        )}
        <form method="dialog" className="pencere-butonlar">
          <button type="submit">Kapat</button>
        </form>
      </div>
    </dialog>
  )
}

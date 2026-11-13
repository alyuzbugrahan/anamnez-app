import { useEffect, useRef } from 'react'

interface Props {
  mesaj: string
  onayMetni: string
  onOnay: () => void
  onVazgec: () => void
}

// Ekrandayken açık kalır; Esc ya da dışarı dokunma vazgeçer.
export function OnayPenceresi({ mesaj, onayMetni, onOnay, onVazgec }: Props) {
  const pencere = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const p = pencere.current
    if (p && !p.open) p.showModal()
  }, [])

  return (
    <dialog
      ref={pencere}
      className="pencere"
      onCancel={(e) => {
        e.preventDefault()
        onVazgec()
      }}
      onClick={(e) => e.target === pencere.current && onVazgec()}
    >
      <p>{mesaj}</p>
      <div className="pencere-butonlar">
        <button type="button" onClick={onVazgec}>Vazgeç</button>
        <button type="button" className="tehlikeli" onClick={onOnay}>{onayMetni}</button>
      </div>
    </dialog>
  )
}

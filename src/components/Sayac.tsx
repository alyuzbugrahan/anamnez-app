// SPEC kural 7: "X kaldı · Y kritik".
export function Sayac({ sorulmadi, kritik }: { sorulmadi: number; kritik: number }) {
  return (
    <p className="sayac" role="status">
      {sorulmadi} kaldı
      {kritik > 0 && <span className="sayac-kritik"> · {kritik} kritik</span>}
    </p>
  )
}

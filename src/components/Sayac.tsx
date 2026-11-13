export function Sayac({ sorulmadi, kritik }: { sorulmadi: number; kritik: number }) {
  return (
    <div className="sayac" role="status">
      <span>{sorulmadi} soru sorulmadı</span>
      {kritik > 0 && <span className="sayac-kritik">{kritik} kritik</span>}
    </div>
  )
}

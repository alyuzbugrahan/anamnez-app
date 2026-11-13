// docs/SPEC.md bölüm 3
export type Oncelik = 'kritik' | 'standart'
export type Kosul = 'kadin' | '65_ustu'

export interface AltSoru {
  id: string
  metin: string
}

export interface Soru {
  id: string
  metin: string
  oncelik: Oncelik
  dogrulanmali: boolean
  kaynak: { ad: string; url: string }
  alt_sorular: AltSoru[]
  tip?: 'acik'
  kosul?: Kosul
}

export interface Tani {
  id: string
  ad: string
  sorular: Soru[]
}

export interface SoruVerisi {
  surum: string
  guncelleme: string
  ortak: { sorular: Soru[] }
  tanilar: Tani[]
}

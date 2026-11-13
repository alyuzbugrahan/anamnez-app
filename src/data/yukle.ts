import { cozumle, VeriHatasi } from './dogrula'
import type { SoruVerisi } from './sema'

export async function soruVerisiniYukle(): Promise<SoruVerisi> {
  const yanit = await fetch(`${import.meta.env.BASE_URL}data/sorular.json`)
  if (!yanit.ok) throw new VeriHatasi(`Dosya yüklenemedi (HTTP ${yanit.status})`)
  return cozumle(await yanit.text())
}

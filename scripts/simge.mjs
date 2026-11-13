// Uygulama simgesini bağımlılıksız üretir: mavi zemin üzerinde beyaz onay işareti.
// Çalıştırma: node scripts/simge.mjs  (çıktı public/ altına yazılır)
import { writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'

const ZEMIN = [0x1d, 0x4f, 0x91]
// Onay işareti, simgenin ortasındaki maskable güvenli alanın (merkezdeki %80) içinde.
const NOKTALAR = [[0.3, 0.52], [0.44, 0.66], [0.71, 0.37]]
const KALINLIK = 0.09

function parca(tur, veri) {
  const uzunluk = Buffer.alloc(4)
  uzunluk.writeUInt32BE(veri.length)
  const tv = Buffer.concat([Buffer.from(tur), veri])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(tv))
  return Buffer.concat([uzunluk, tv, crc])
}

function segmentUzakligi(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

function png(boyut) {
  const satirlar = Buffer.alloc(boyut * (boyut * 3 + 1))
  const noktalar = NOKTALAR.map(([x, y]) => [x * boyut, y * boyut])
  const yariKalinlik = (KALINLIK * boyut) / 2
  for (let y = 0; y < boyut; y++) {
    const satir = y * (boyut * 3 + 1) // ilk bayt: filtre 0
    for (let x = 0; x < boyut; x++) {
      const d = Math.min(
        segmentUzakligi(x + 0.5, y + 0.5, noktalar[0], noktalar[1]),
        segmentUzakligi(x + 0.5, y + 0.5, noktalar[1], noktalar[2]),
      )
      const beyaz = Math.max(0, Math.min(1, yariKalinlik - d + 0.5)) // kenar yumuşatma
      for (let k = 0; k < 3; k++) satirlar[satir + 1 + x * 3 + k] = Math.round(ZEMIN[k] + (255 - ZEMIN[k]) * beyaz)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(boyut, 0)
  ihdr.writeUInt32BE(boyut, 4)
  ihdr.set([8, 2, 0, 0, 0], 8) // 8 bit, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parca('IHDR', ihdr),
    parca('IDAT', deflateSync(satirlar)),
    parca('IEND', Buffer.alloc(0)),
  ])
}

for (const boyut of [180, 192, 512]) writeFileSync(new URL(`../public/simge-${boyut}.png`, import.meta.url), png(boyut))

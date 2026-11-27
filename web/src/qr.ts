// A small QR code encoder: byte mode, error correction level M, versions 1 to 10.
// That holds up to 213 bytes, far more than any address on this site. Written here so the site
// needs no extra package. The method follows the QR Code standard (ISO/IEC 18004).

/** Error correction bytes per block and number of blocks, by version, for level M. */
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]
const MAX_VERSION = 10

/** How many modules of a symbol are left for data and error correction. */
function rawModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2
    result -= (25 * align - 10) * align - 55
    if (version >= 7) result -= 36
  }
  return result
}

const dataBytes = (version: number) => Math.floor(rawModules(version) / 8) - ECC_PER_BLOCK[version]! * BLOCKS[version]!

/** Multiplication in the field GF(256) that Reed-Solomon codes for QR use. */
function multiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; --i) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function divisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; ++i) {
    for (let j = 0; j < degree; ++j) {
      result[j] = multiply(result[j]!, root)
      if (j + 1 < degree) result[j]! ^= result[j + 1]!
    }
    root = multiply(root, 2)
  }
  return result
}

function remainder(data: number[], div: number[]): number[] {
  const result = div.map(() => 0)
  for (const byte of data) {
    const factor = byte ^ result.shift()!
    result.push(0)
    div.forEach((coefficient, i) => (result[i]! ^= multiply(coefficient, factor)))
  }
  return result
}

/** The data with its length header, padded to fill the version exactly. */
function codewords(bytes: Uint8Array, version: number): number[] {
  const bits: number[] = []
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; --i) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4) // byte mode
  push(bytes.length, version < 10 ? 8 : 16)
  for (const b of bytes) push(b, 8)
  const capacity = dataBytes(version) * 8
  push(0, Math.min(4, capacity - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8)
  const result: number[] = []
  for (let i = 0; i < bits.length; i += 8) result.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0))
  return result
}

/** Splits the data into blocks, adds error correction to each, and interleaves them. */
function withErrorCorrection(data: number[], version: number): number[] {
  const blocks = BLOCKS[version]!
  const eccLength = ECC_PER_BLOCK[version]!
  const total = Math.floor(rawModules(version) / 8)
  const shortBlocks = blocks - (total % blocks)
  const shortLength = Math.floor(total / blocks)
  const div = divisor(eccLength)
  const parts: number[][] = []
  for (let i = 0, k = 0; i < blocks; ++i) {
    const part = data.slice(k, k + shortLength - eccLength + (i < shortBlocks ? 0 : 1))
    k += part.length
    const ecc = remainder(part, div)
    // short blocks get a placeholder so every block has the same length
    if (i < shortBlocks) part.push(0)
    parts.push(part.concat(ecc))
  }
  const result: number[] = []
  for (let i = 0; i < parts[0]!.length; ++i)
    parts.forEach((part, j) => {
      if (i !== shortLength - eccLength || j >= shortBlocks) result.push(part[i]!)
    })
  return result
}

function alignmentPositions(version: number, size: number): number[] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2
  const result = [6]
  for (let pos = size - 7; result.length < count; pos -= step) result.splice(1, 0, pos)
  return result
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

/** How hard a symbol is to read, by the four rules of the standard. Lower is better. */
function penalty(m: boolean[][]): number {
  const size = m.length
  let result = 0
  const lines: boolean[][] = []
  for (let i = 0; i < size; ++i) {
    lines.push(m[i]!)
    lines.push(m.map((row) => row[i]!))
  }
  for (const line of lines) {
    // runs of five or more of one colour
    for (let i = 0, run = 1; i < size; ++i, ++run) {
      if (i + 1 < size && line[i + 1] === line[i]) continue
      if (run >= 5) result += run - 2
      run = 0
    }
    // anything that looks like a finder pattern: 1011101 with four light modules on either side
    const text = line.map((dark) => (dark ? "1" : "0")).join("")
    for (const pattern of ["10111010000", "00001011101"])
      for (let at = text.indexOf(pattern); at >= 0; at = text.indexOf(pattern, at + 1)) result += 40
  }
  let dark = 0
  for (let y = 0; y < size; ++y)
    for (let x = 0; x < size; ++x) {
      if (m[y]![x]) ++dark
      // 2 x 2 blocks of one colour
      if (x + 1 < size && y + 1 < size) {
        const c = m[y]![x]
        if (c === m[y]![x + 1] && c === m[y + 1]![x] && c === m[y + 1]![x + 1]) result += 3
      }
    }
  // an uneven balance of dark and light
  result += Math.floor(Math.abs((dark * 20) / (size * size) - 10)) * 10
  return result
}

/** The QR code for a text as rows of modules, `true` for dark. Does not include the quiet zone. */
export function qrCode(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text)
  let version = 1
  while (version <= MAX_VERSION && 4 + (version < 10 ? 8 : 16) + bytes.length * 8 > dataBytes(version) * 8) ++version
  if (version > MAX_VERSION) throw new Error("Text is too long for a QR code")

  const size = version * 4 + 17
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const set = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    modules[y]![x] = dark
    fixed[y]![x] = true
  }

  // timing lines
  for (let i = 0; i < size; ++i) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }
  // the three finder patterns with their light border
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const)
    for (let dy = -4; dy <= 4; ++dy)
      for (let dx = -4; dx <= 4; ++dx) {
        const ring = Math.max(Math.abs(dx), Math.abs(dy))
        set(cx + dx, cy + dy, ring !== 2 && ring !== 4)
      }
  // alignment patterns, except where a finder pattern is
  const align = alignmentPositions(version, size)
  align.forEach((cx, i) =>
    align.forEach((cy, j) => {
      const last = align.length - 1
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return
      for (let dy = -2; dy <= 2; ++dy)
        for (let dx = -2; dx <= 2; ++dx) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    })
  )
  // version number, from version 7 up
  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; ++i) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; ++i) {
      const dark = ((bits >>> i) & 1) === 1
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      set(a, b, dark)
      set(b, a, dark)
    }
  }
  /** Error correction level and mask number, written twice around the finder patterns. */
  const format = (mask: number) => {
    const data = mask // level M is 00, so only the mask number remains
    let rem = data
    for (let i = 0; i < 10; ++i) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const bits = ((data << 10) | rem) ^ 0x5412
    const bit = (i: number) => ((bits >>> i) & 1) === 1
    for (let i = 0; i <= 5; ++i) set(8, i, bit(i))
    set(8, 7, bit(6))
    set(8, 8, bit(7))
    set(7, 8, bit(8))
    for (let i = 9; i < 15; ++i) set(14 - i, 8, bit(i))
    for (let i = 0; i < 8; ++i) set(size - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; ++i) set(8, size - 15 + i, bit(i))
    set(8, size - 8, true)
  }
  format(0) // reserves the places before the data goes in

  // the data, in a zigzag from the bottom right, two columns at a time
  const data = withErrorCorrection(codewords(bytes, version), version)
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; ++vert)
      for (let j = 0; j < 2; ++j) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (fixed[y]![x] || i >= data.length * 8) continue
        modules[y]![x] = ((data[i >>> 3]! >>> (7 - (i & 7))) & 1) === 1
        ++i
      }
  }

  // try the eight masks and keep the one that reads best
  const flip = (mask: number) => {
    for (let y = 0; y < size; ++y)
      for (let x = 0; x < size; ++x) if (!fixed[y]![x] && MASKS[mask]!(x, y)) modules[y]![x] = !modules[y]![x]
  }
  let best = 0
  let lowest = Infinity
  for (let mask = 0; mask < 8; ++mask) {
    flip(mask)
    format(mask)
    const p = penalty(modules)
    if (p < lowest) {
      lowest = p
      best = mask
    }
    flip(mask) // the same mask again undoes it
  }
  flip(best)
  format(best)
  return modules
}

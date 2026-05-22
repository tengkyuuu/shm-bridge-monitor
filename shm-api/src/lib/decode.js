export function decodeDeflection(raw) {
  let v = (raw[0] << 8) | raw[1];
  if (v & 0x8000) v -= 0x10000;
  return v / 100;
}

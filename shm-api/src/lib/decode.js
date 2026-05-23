function readInt16BE(raw, offset, scale) {
  if (raw.length < offset + 2) return null;
  let v = (raw[offset] << 8) | raw[offset + 1];
  if (v & 0x8000) v -= 0x10000;
  return v / scale;
}

export function decodePayload(raw) {
  return {
    deflection_mm: readInt16BE(raw, 0,   100),
    accel_ms2:     readInt16BE(raw, 2,  1000),
    velocity_ms:   readInt16BE(raw, 4, 10000),
  };
}

export function decodeDeflection(raw) {
  return readInt16BE(raw, 0, 100);
}

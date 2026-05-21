const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function uuidV7(now: number = Date.now()): string {
  const rand = new Uint8Array(10);
  globalThis.crypto.getRandomValues(rand);

  const ts = BigInt(now);
  const tsHex = ts.toString(16).padStart(12, '0');

  const time_low = tsHex.slice(0, 8);
  const time_mid = tsHex.slice(8, 12);

  const rand_a_byte0 = (0x70 | (rand[0]! & 0x0f)).toString(16).padStart(2, '0');
  const rand_a_byte1 = rand[1]!.toString(16).padStart(2, '0');
  const time_high_and_version = `${rand_a_byte0}${rand_a_byte1}`;

  const clock_seq_hi = (0x80 | (rand[2]! & 0x3f)).toString(16).padStart(2, '0');
  const clock_seq_low = rand[3]!.toString(16).padStart(2, '0');
  const clock_seq = `${clock_seq_hi}${clock_seq_low}`;

  const node = Array.from(rand.slice(4, 10))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${time_low}-${time_mid}-${time_high_and_version}-${clock_seq}-${node}`;
}

export function isUuidV7(value: string): boolean {
  return UUID_V7_RE.test(value);
}

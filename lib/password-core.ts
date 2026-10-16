/** TEAM360 password hashing: PBKDF2-HMAC-SHA256 for Web Crypto runtimes. */
const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = 'pbkdf2-sha256';
const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) throw new Error('Invalid hex');
  return Uint8Array.from(hex.match(/../g)!, (pair) => Number.parseInt(pair, 16));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** Stored form: pbkdf2-sha256$iterations$saltHex$derivedKeyHex */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new Error('Password length must be between 12 and 256 characters');
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toHex(salt)}$${toHex(key)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (typeof password !== 'string' || password.length > 256 || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== PREFIX) return false;
  const iterations = Number(parts[1]);
  // Restrict cost to avoid a malicious stored hash consuming unbounded CPU.
  if (!Number.isSafeInteger(iterations) || iterations < 600_000 || iterations > 1_200_000) return false;
  if (!/^[0-9a-f]{32}$/i.test(parts[2]) || !/^[0-9a-f]{64}$/i.test(parts[3])) return false;
  const expected = fromHex(parts[3]);
  const actual = await derive(password, fromHex(parts[2]), iterations);
  let diff = 0;
  for (let i = 0; i < KEY_BYTES; i++) diff |= expected[i] ^ actual[i];
  return diff === 0;
}

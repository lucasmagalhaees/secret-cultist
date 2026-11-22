/* D159: the bunker's shared password. The expansion's key is kept here wrapped with a key derived from the password
   (PBKDF2, 200k rounds), so neither the page nor the server holds it in the clear. A weak shared password only keeps
   the historical themes out of public sight; it is not a vault. */
import { openDlc } from '../src/core/dlc';

const WRAP = 'KynVEhY9NKMXMjxQTvA+bG80DLoTpzD4Iw//yc2dKkFflBZRVP+UIRR073V14zxmiJZ9ciuWnHPz+Dttf1nRqPkceQN5rFpa8qawen1HfzAY5Uy+2OCBjA==';

/** The expansion's key, if the password is the bunker's; null otherwise. */
export async function bunkerKey(password: string): Promise<string | null> {
  try {
    const c = crypto.subtle, t = atob(WRAP), b = Uint8Array.from(t, ch => ch.charCodeAt(0));
    const base = await c.importKey('raw', new TextEncoder().encode(password.trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
    const k = await c.deriveKey({ name: 'PBKDF2', salt: b.slice(0, 16), iterations: 200000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return new TextDecoder().decode(await c.decrypt({ name: 'AES-GCM', iv: b.slice(16, 28) }, k, b.slice(28)));
  } catch { return null; }
}
/** Opens the historical themes with the bunker's password: true when it was right. */
export async function enterBunker(password: string): Promise<boolean> {
  const key = await bunkerKey(password);
  return !!key && !!(await openDlc(key));
}

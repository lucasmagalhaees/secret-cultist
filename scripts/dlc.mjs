// D100, D138: the expansion's data (the historical themes' words, names and faces) is kept in src/core/dlc.ts encrypted
// with AES-GCM. The key is not in the repository: it lives in Supabase (only a driver gets it, D138) and in the secret
// DLC_KEY of the CI. To change the data:
//   DLC_KEY=... node scripts/dlc.mjs decode > /tmp/dlc.json   (edit it outside the repository)
//   DLC_KEY=... node scripts/dlc.mjs encode /tmp/dlc.json
import fs from 'fs';
import { webcrypto as wc } from 'crypto';
const file = new URL('../src/core/dlc.ts', import.meta.url), src = fs.readFileSync(file, 'utf8');
const raw = Buffer.from(process.env.DLC_KEY || '', 'base64');
if (raw.length !== 32) { console.error('DLC_KEY: 32 bytes in base64'); process.exit(1); }
const key = await wc.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
const [cmd, path] = process.argv.slice(2);
if (cmd === 'decode') {
  const b = Buffer.from(src.match(/BLOB = '([^']*)'/)[1], 'base64');
  process.stdout.write(new TextDecoder().decode(await wc.subtle.decrypt({ name: 'AES-GCM', iv: b.subarray(0, 12) }, key, b.subarray(12))));
} else if (cmd === 'encode') {
  const iv = wc.getRandomValues(new Uint8Array(12)), plain = new TextEncoder().encode(JSON.stringify(JSON.parse(fs.readFileSync(path, 'utf8'))));
  const out = Buffer.concat([Buffer.from(iv), Buffer.from(await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain))]).toString('base64');
  fs.writeFileSync(file, src.replace(/BLOB = '[^']*'/, `BLOB = '${out}'`));
} else { console.error('usage: DLC_KEY=... node scripts/dlc.mjs decode | encode <file.json>'); process.exit(1); }

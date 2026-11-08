// D100: the expansion's data (the historical themes' words, names and faces) is kept in src/core/dlc.ts scrambled with
// the expansion key, so the source shows only Secret Cultist. To change it:
//   node scripts/dlc.mjs decode > /tmp/dlc.json   (edit it outside the repository)
//   node scripts/dlc.mjs encode /tmp/dlc.json
import fs from 'fs';
const game = fs.readFileSync(new URL('../src/core/game.ts', import.meta.url), 'utf8'), file = new URL('../src/core/dlc.ts', import.meta.url);
const key = new TextEncoder().encode(game.match(/DLC_KEY = '([^']+)'/)[1]);
const xor = b => b.map((x, i) => x ^ key[i % key.length]);
const [cmd, path] = process.argv.slice(2), src = fs.readFileSync(file, 'utf8');
if (cmd === 'decode') process.stdout.write(new TextDecoder().decode(xor(Buffer.from(src.match(/BLOB = '([^']*)'/)[1], 'base64'))));
else if (cmd === 'encode') { const out = Buffer.from(xor(new TextEncoder().encode(JSON.stringify(JSON.parse(fs.readFileSync(path, 'utf8')))))).toString('base64'); fs.writeFileSync(file, src.replace(/BLOB = '[^']*'/, `BLOB = '${out}'`)); }
else { console.error('usage: node scripts/dlc.mjs decode | encode <file.json>'); process.exit(1); }

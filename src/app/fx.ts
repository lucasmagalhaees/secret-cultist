/* ================= effects: sound, vibration and timing =================
   Sounds are made on the spot with Web Audio (no files, nothing downloaded): a rubber stamp, a sheet of paper, a gavel
   and a short fanfare. They only play for things the whole table already knows; a secret never makes a noise. The
   phone vibrates for the one holding it (opening a secret) and for loud moments (an election, an elimination); only
   Android lets a page do that. Secret Cultist rings a bell and whispers instead (D106). "Som e vibração" in Aparência turns both off (`S.quiet`). */
import { S } from './state';

/** The device asks for less motion: animations are off in the CSS, and nothing here waits for one to end. */
export const calm = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs `fn` once a short animation has had time to play, or at once when the device asks for less motion. */
export function later(fn: () => void, ms: number): void {
  if (calm()) fn(); else setTimeout(fn, ms);
}

/** A vibration, where the device allows it. */
export function buzz(pattern: number | number[]): void {
  if (S.quiet) return;
  try { navigator.vibrate?.(pattern); } catch (e) { /* not allowed here: no vibration */ }
}

export type Sound = 'stamp' | 'paper' | 'gavel' | 'shot' | 'win' | 'lose';
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (S.quiet) return null;
  try {
    ctx = ctx || new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch (e) { return null; }
}
/** A note: a frequency for `dur` seconds from `at`, fading out. */
function tone(a: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number): void {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(a.destination); o.start(at); o.stop(at + dur + 0.02);
}
/** A burst of filtered noise: paper, the thud of a stamp. */
function hiss(a: AudioContext, at: number, dur: number, vol: number, freq: number): void {
  const n = Math.max(1, Math.floor(a.sampleRate * dur)), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(at);
}
/** One of the few sounds of the game. */
export function sound(name: Sound): void {
  const a = audio(); if (!a) return;
  const t = a.currentTime + 0.01;
  // D106: Secret Cultist has its own sounds: a bell for the gavel, a whisper for an elimination, an eerie end
  if (document.documentElement.dataset.pack === 'culto' && (name === 'gavel' || name === 'shot' || name === 'win' || name === 'lose')) {
    if (name === 'gavel') { tone(a, 220, t, 1.4, 'sine', 0.35); tone(a, 554, t, 1.1, 'sine', 0.12); tone(a, 330, t + 0.02, 0.9, 'triangle', 0.08); }
    else if (name === 'shot') { hiss(a, t, 0.9, 0.18, 700); hiss(a, t + 0.35, 0.8, 0.14, 1100); tone(a, 55, t, 1.2, 'sine', 0.2); }
    else if (name === 'win') { const fs = [440, 523, 659, 880]; for (let i = 0; i < fs.length; i++) tone(a, fs[i], t + i * 0.18, 0.6, 'sine', 0.09); }
    else { const fs = [233, 165, 117]; for (let i = 0; i < fs.length; i++) tone(a, fs[i], t + i * 0.3, 0.9, 'sawtooth', 0.05); }
    return;
  }
  if (name === 'stamp') { tone(a, 90, t, 0.18, 'sine', 0.5); hiss(a, t, 0.08, 0.5, 900); }
  else if (name === 'paper') hiss(a, t, 0.22, 0.35, 3200);
  else if (name === 'gavel') { tone(a, 140, t, 0.12, 'triangle', 0.5); tone(a, 140, t + 0.18, 0.16, 'triangle', 0.55); hiss(a, t, 0.05, 0.4, 600); }
  else if (name === 'shot') { hiss(a, t, 0.09, 0.2, 1700); tone(a, 85, t, 0.12, 'triangle', 0.2); }
  else if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.12, 0.3, 'square', 0.08));
  else [392, 330, 262].forEach((f, i) => tone(a, f, t + i * 0.16, 0.35, 'sawtooth', 0.07));
}

/** The law landing on the board (D46): a low thump. */
export function thud(): void {
  const a = audio(); if (!a) return;
  const t = a.currentTime + 0.01;
  tone(a, 70, t, 0.2, 'sine', 0.45); hiss(a, t, 0.06, 0.3, 400);
}

/** The table's reactions to a claim, rising from the foot of the screen (D31): 👍 who agrees, 👎 who does not, 🤷 who
 *  is unsure. Nothing rises when the device asks for less motion. */
export function reactions(answers: number[]): void {
  if (calm()) return;
  answers.forEach((a, k) => {
    const el = document.createElement('span');
    el.className = 'react-fx'; el.textContent = ['👍', '🤷', '👎'][a] ?? '🤷';
    el.style.left = `${10 + ((k * 37) % 80)}%`; el.style.animationDelay = `${k * 160}ms`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200 + k * 160);
  });
}

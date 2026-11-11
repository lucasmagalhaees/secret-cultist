/* ================= the drawings =================
   Original caricatures, inline SVG: thick ink outlines, flat colours, big heads and loud faces. The liberals are a
   smug bird in a navy uniform; the hidden side and its leader get creatures of their own in each theme (Secret Cultist:
   a goat-skulled cultist in a red hood and a tentacled high priest in a gold mitre). Each figure stands on a soft spotlight so it reads on any card colour, in every style and theme. */
import type { Law, Pack, Region, Role } from '../core';

const K = '#1b1512';                  // ink
const W = '#fffaf0', GOLD = '#e8b730', RED = '#d63c2b', PINK = '#f19a8c';
const o = (w = 2.6): string => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const spot = `<ellipse cx="60" cy="66" rx="50" ry="52" fill="rgba(255,244,220,.16)"/><ellipse cx="60" cy="116" rx="36" ry="4" fill="rgba(0,0,0,.25)"/>`;

/** A liberal: a round, smug bird in a navy uniform with gold buttons and a kepi. */
const bird = (): string => {
  const SKY = '#9cc6e4', SKY2 = '#78a8cc', NAVY = '#2d4c7c', NAVY2 = '#203a63', BEAK = '#f3a43b';
  return `${spot}
  <path d="M50 98 L47 113 M44 113 h8 M64 98 L67 113 M64 113 h8" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/>
  <path d="M50 98 L47 113 M44 113 h8 M64 98 L67 113 M64 113 h8" fill="none" stroke="${BEAK}" stroke-width="3" stroke-linecap="round"/>
  <path d="M34 84 L8 74 L16 86 L6 96 L36 94Z" fill="${SKY2}" ${o()}/>
  <path d="M30 80 C30 62 44 54 58 54 C74 54 84 64 84 80 C84 96 72 104 57 104 C42 104 30 96 30 80Z" fill="${NAVY}" ${o()}/>
  <path d="M62 56 L72 74 L70 102 C66 103 62 104 57 104 C58 90 58 72 62 56Z" fill="${W}" ${o(2)}/>
  <path d="M62 56 L72 74 L82 62" fill="none" ${o(2.2)}/>
  <circle cx="76" cy="80" r="2.6" fill="${GOLD}" ${o(1.4)}/><circle cx="75" cy="91" r="2.6" fill="${GOLD}" ${o(1.4)}/>
  <path d="M36 74 C44 68 56 72 58 86 C50 90 40 88 36 82Z" fill="${NAVY2}" ${o()}/>
  <path d="M44 66 l14 -5 l2 4 l-14 5Z" fill="${GOLD}" ${o(1.4)}/>
  <path d="M64 66 h7 v7 l-3.5 -2 l-3.5 2Z" fill="${RED}" ${o(1.2)}/><circle cx="67.5" cy="77" r="3.4" fill="${GOLD}" ${o(1.2)}/>
  <circle cx="72" cy="38" r="22" fill="${SKY}" ${o()}/>
  <path d="M52 44 C54 56 66 61 78 58 C66 56 58 50 56 40Z" fill="${SKY2}"/>
  <ellipse cx="70" cy="48" rx="5" ry="3" fill="${PINK}" opacity=".8"/>
  <ellipse cx="82" cy="36" rx="8.5" ry="9.5" fill="${W}" ${o(2)}/>
  <circle cx="84.5" cy="37" r="4" fill="${K}"/><circle cx="86" cy="35.3" r="1.4" fill="${W}"/>
  <path d="M74 25 C79 23 86 23 92 26" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M92 40 L114 45 L93 53 C90 50 90 44 92 40Z" fill="${BEAK}" ${o()}/>
  <path d="M93 47 L110 46" fill="none" ${o(1.6)}/>
  <path d="M84 52 C88 55 92 54 94 51" fill="none" ${o(2)}/>
  <path d="M56 22 L58 6 L88 6 L90 22Z" fill="${NAVY}" ${o()}/>
  <path d="M57 16 H89" stroke="${GOLD}" stroke-width="3.4"/><path d="M57 16 H89" fill="none" ${o(1)}/>
  <circle cx="73" cy="11" r="2.6" fill="${GOLD}" ${o(1.2)}/>
  <path d="M86 21 L102 24 C98 28 90 27 86 25Z" fill="${K}"/>`;
};

/** A cultist: a sneering alligator with a long toothy grin, in a brown uniform with a belt and a black peaked cap. */
const gator = (): string => {
  const G = '#6f9440', G2 = '#557530', BELLY = '#efe2b4', COAT = '#6a4f34', COAT2 = '#54402a', CAP = '#26221f';
  return `${spot}
  <path d="M40 100 C24 102 12 112 4 106 C12 100 20 92 38 88Z" fill="${G}" ${o()}/>
  <path d="M28 98 l-3 -6 l-3 6 M18 102 l-3 -6 l-3 6" fill="${G2}" ${o(1.4)}/>
  <path d="M48 104 L46 114 M42 114 h9 M70 104 L72 114 M68 114 h9" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>
  <path d="M48 104 L46 114 M42 114 h9 M70 104 L72 114 M68 114 h9" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>
  <path d="M34 104 C30 84 36 66 52 60 C64 56 76 60 82 70 C88 82 88 96 84 106 C70 110 48 110 34 104Z" fill="${COAT}" ${o()}/>
  <path d="M58 60 L66 76 L74 60" fill="${BELLY}" ${o(2)}/>
  <path d="M66 76 V106" fill="none" ${o(1.6)}/>
  <circle cx="71" cy="84" r="2.6" fill="${GOLD}" ${o(1.3)}/><circle cx="71" cy="94" r="2.6" fill="${GOLD}" ${o(1.3)}/>
  <path d="M35 96 H86" stroke="${K}" stroke-width="6"/><path d="M35 96 H86" stroke="#2b2420" stroke-width="3.4"/>
  <rect x="63" y="92" width="8" height="8" rx="1" fill="${GOLD}" ${o(1.4)}/>
  <path d="M40 72 C46 66 56 70 56 82 C54 90 46 92 40 88Z" fill="${COAT2}" ${o()}/>
  <path d="M42 89 l-3 5 M46 91 l-1 5 M50 91 l1 5" fill="none" ${o(2)}/>
  <path d="M44 66 l12 -6 l2 4 l-12 6Z" fill="${GOLD}" ${o(1.3)}/>
  <path d="M42 48 C38 30 52 18 70 20 C82 21 90 26 98 28 L114 32 C121 34 121 46 114 48 L94 54 C82 60 60 62 50 58 C45 56 43 52 42 48Z" fill="${G}" ${o()}/>
  <path d="M50 58 C60 61 80 60 94 54 L112 48 C104 52 90 52 70 52 C60 52 54 54 50 58Z" fill="${BELLY}" ${o(1.6)}/>
  <path d="M66 46 C80 49 98 44 116 40" fill="none" ${o(2.4)}/>
  <path d="M74 47 l2 5 l2 -5 M82 47 l2 5 l2 -5 M90 45 l2 5 l2 -5 M98 44 l2 5 l2 -5 M106 42 l2 4 l2 -4 M78 47 l2 -4 l2 4 M94 45 l2 -4 l2 4 M102 43 l2 -4 l2 4" fill="${W}" ${o(1.1)}/>
  <ellipse cx="110" cy="33" rx="2.2" ry="1.6" fill="${K}"/><ellipse cx="104" cy="31.5" rx="2" ry="1.4" fill="${K}"/>
  <circle cx="56" cy="40" r="2" fill="${G2}"/><circle cx="62" cy="34" r="1.6" fill="${G2}"/><circle cx="52" cy="48" r="1.8" fill="${G2}"/><circle cx="86" cy="34" r="1.5" fill="${G2}"/><circle cx="92" cy="36" r="1.5" fill="${G2}"/>
  <circle cx="74" cy="24" r="10" fill="${G}" ${o()}/>
  <ellipse cx="76" cy="24" rx="6.5" ry="6" fill="#f6e36b" ${o(1.6)}/>
  <rect x="75" y="19" width="2.6" height="10" rx="1.3" fill="${K}"/>
  <path d="M67 18 C72 19 80 22 86 26 L86 21 C80 17 72 15 67 16Z" fill="${G2}" ${o(2)}/>
  <path d="M40 30 C36 12 64 6 74 14 L80 22 C66 26 50 30 40 30Z" fill="${CAP}" ${o()}/>
  <path d="M40 30 C52 28 66 24 80 21" fill="none" stroke="${RED}" stroke-width="3.2"/>
  <path d="M74 20 L94 18 C92 23 84 25 78 25Z" fill="${CAP}" ${o(1.8)}/>
  <circle cx="58" cy="16" r="3" fill="${GOLD}" ${o(1.2)}/>`;
};

/** The expansion's leader: a cobra with its hood spread, angry yellow eyes, fangs bared, in a long grey coat, yelling over
 *  a lectern. */
const cobra = (): string => {
  const S = '#9b8340', S2 = '#6e5c2a', HOOD = '#f2e2b2', COAT = '#4a4e55', COAT2 = '#383b41', CAP = '#26221f', WOOD = '#8a5a34';
  return `${spot}
  <path d="M24 116 C22 92 30 74 46 68 L74 68 C90 74 98 92 96 116Z" fill="${COAT}" ${o()}/>
  <path d="M46 68 L60 92 L74 68" fill="${COAT2}" ${o(2)}/>
  <path d="M30 84 C34 76 42 72 46 74 L44 100 C38 100 32 96 30 92Z" fill="${COAT2}" ${o(2)}/>
  <path d="M31 86 L44 84 L44 93 L31 94Z" fill="${RED}" ${o(1.6)}/>
  <path d="M28 72 l14 -4 l2 4 l-14 5Z M92 72 l-14 -4 l-2 4 l14 5Z" fill="${GOLD}" ${o(1.3)}/>
  <path d="M53 76 C53 68 56 62 60 60 C64 62 67 68 67 76Z" fill="${HOOD}" ${o(2)}/>
  <path d="M55 70 h10 M54 74 h12" fill="none" ${o(1.2)}/>
  <path d="M60 10 C34 12 26 38 34 56 C40 68 52 70 60 64 C68 70 80 68 86 56 C94 38 86 12 60 10Z" fill="${S}" ${o()}/>
  <path d="M60 18 C44 20 38 38 42 52 C46 60 54 62 60 58 C66 62 74 60 78 52 C82 38 76 20 60 18Z" fill="${HOOD}" ${o(1.8)}/>
  <path d="M48 34 c3 -2 6 0 4 3 M70 34 c-3 -2 -6 0 -4 3 M46 46 c3 -2 6 0 4 3 M74 46 c-3 -2 -6 0 -4 3" fill="${S2}" ${o(1.2)}/>
  <path d="M44 38 C44 26 52 22 60 22 C68 22 76 26 76 38 C76 50 70 58 60 58 C50 58 44 50 44 38Z" fill="${S}" ${o()}/>
  <path d="M49 44 C52 54 68 54 71 44 C68 47 52 47 49 44Z" fill="#7d1d1a" ${o(1.8)}/>
  <path d="M52 45 l2 6 l2 -5.5 M68 45 l-2 6 l-2 -5.5" fill="${W}" ${o(1.1)}/>
  <path d="M60 50 V60 L56 65 M60 60 L64 65" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="53" cy="36" rx="5" ry="4.2" fill="#f6e36b" ${o(1.6)}/><ellipse cx="67" cy="36" rx="5" ry="4.2" fill="#f6e36b" ${o(1.6)}/>
  <rect x="52" y="33" width="2.4" height="6.4" rx="1.2" fill="${K}"/><rect x="65.8" y="33" width="2.4" height="6.4" rx="1.2" fill="${K}"/>
  <path d="M46 30 L57 34 M74 30 L63 34" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M41 24 C38 4 82 2 79 24Z" fill="${CAP}" ${o()}/>
  <path d="M42 22 H78" stroke="${RED}" stroke-width="3.2"/>
  <path d="M38 24 H82 C80 29 72 30 60 30 C48 30 40 29 38 24Z" fill="${CAP}" ${o(1.8)}/>
  <circle cx="60" cy="13" r="3.4" fill="${GOLD}" ${o(1.3)}/>
  <path d="M34 96 H86 L80 118 H40Z" fill="${WOOD}" ${o()}/>
  <path d="M34 96 H86 L84 102 H36Z" fill="#a46e43" ${o(1.6)}/>
  <rect x="44" y="105" width="32" height="7" fill="${RED}" ${o(1.4)}/>
  <path d="M28 54 l-6 -3 M26 62 l-7 0 M92 54 l6 -3 M94 62 l7 0" fill="none" stroke="${W}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
};

/** A red (D12): a snarling white wolf in a red tunic with a belt and a pointed cloth cap with a red star. */
const wolf = (): string => {
  const FUR = '#f4f3ee', FUR2 = '#c9ced3', TUNIC = '#b8322a', TUNIC2 = '#8f241e', CAP = '#6b7a52', CAP2 = '#56633f';
  return `${spot}
  <path d="M38 98 C20 104 8 96 6 84 C14 90 22 88 30 84 C20 82 16 74 18 68 C24 78 34 84 42 86Z" fill="${FUR}" ${o()}/>
  <path d="M14 82 C18 86 24 86 28 84" fill="none" stroke="${FUR2}" stroke-width="2.4"/>
  <path d="M48 104 L46 114 M42 114 h9 M70 104 L72 114 M68 114 h9" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>
  <path d="M48 104 L46 114 M42 114 h9 M70 104 L72 114 M68 114 h9" fill="none" stroke="${FUR}" stroke-width="4" stroke-linecap="round"/>
  <path d="M34 104 C30 84 36 66 52 60 C64 56 76 60 82 70 C88 82 88 96 84 106 C70 110 48 110 34 104Z" fill="${TUNIC}" ${o()}/>
  <path d="M56 60 L64 72 L72 60 L66 58 L64 62 L62 58Z" fill="${FUR}" ${o(1.8)}/>
  <path d="M64 72 V106" fill="none" ${o(1.6)}/>
  <circle cx="69" cy="82" r="2.4" fill="${GOLD}" ${o(1.2)}/><circle cx="69" cy="92" r="2.4" fill="${GOLD}" ${o(1.2)}/>
  <path d="M35 96 H86" stroke="${K}" stroke-width="6"/><path d="M35 96 H86" stroke="#3a2a22" stroke-width="3.4"/>
  <rect x="60" y="92" width="8" height="8" rx="1" fill="${GOLD}" ${o(1.4)}/>
  <path d="M40 72 C46 66 56 70 56 82 C54 90 46 92 40 88Z" fill="${TUNIC2}" ${o()}/>
  <path d="M42 89 l-3 6 M46 91 l-1 6 M50 91 l1 6" fill="none" stroke="${FUR}" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 89 l-3 6 M46 91 l-1 6 M50 91 l1 6" fill="none" ${o(1)}/>
  <path d="M76 70 l3 3 l-1 -4 l4 -1 l-4 -1 l1 -4 l-3 3 l-3 -3 l1 4 l-4 1 l4 1 l-1 4Z" fill="${GOLD}" ${o(0.8)}/>
  <path d="M44 42 C42 28 54 20 68 20 C80 20 88 28 90 34 L108 38 C116 40 117 50 110 52 L92 58 C80 62 58 62 50 56 C46 52 44 48 44 42Z" fill="${FUR}" ${o()}/>
  <path d="M44 44 l-6 -2 l5 6 l-6 2 l7 2 l-4 5 l8 -2" fill="${FUR}" ${o(1.6)}/>
  <path d="M52 56 C62 60 82 60 94 55 L106 51 C98 53 88 54 74 52 C64 51 56 52 52 56Z" fill="${FUR2}"/>
  <path d="M74 48 C84 51 98 48 112 46" fill="none" ${o(2.2)}/>
  <path d="M84 49 l2 6 l2 -6 M100 47 l2 6 l2 -6" fill="${W}" ${o(1.1)}/>
  <ellipse cx="111" cy="41" rx="4.6" ry="3.6" fill="${K}"/>
  <ellipse cx="78" cy="34" rx="5.6" ry="4.6" fill="#f6e36b" ${o(1.6)}/><circle cx="79.5" cy="34.5" r="2.2" fill="${K}"/>
  <path d="M70 26 L86 31" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M60 50 c3 2 6 2 9 0" fill="none" stroke="${FUR2}" stroke-width="2"/>
  <path d="M44 32 C42 22 50 14 62 2 C70 12 80 18 84 30 C70 26 56 28 44 32Z" fill="${CAP}" ${o()}/>
  <path d="M62 2 C62 10 62 20 63 28" fill="none" stroke="${CAP2}" stroke-width="2.2"/>
  <path d="M44 32 C56 28 70 26 84 30 L86 36 C72 32 56 34 44 38Z" fill="${CAP2}" ${o(1.6)}/>
  <path d="M63 14 l2 4 l4.4 .4 l-3.4 2.8 l1.2 4.3 l-4.2 -2.4 l-4.2 2.4 l1.2 -4.3 l-3.4 -2.8 l4.4 -.4Z" fill="${RED}" ${o(1.2)}/>`;
};

/** Red Leader (D12): a big brown bear with a heavy moustache and a pipe, in a plain khaki tunic with gold shoulder boards
 *  and a peaked cap with a red star, glowering. */
const bear = (): string => {
  const FUR = '#7a5232', FUR2 = '#5c3c22', MUZ = '#d8b48a', TUNIC = '#8a865f', TUNIC2 = '#6f6b48', CAP = '#7d7a55', CAP2 = '#5f5c3d';
  return `${spot}
  <path d="M22 116 C20 92 30 74 46 70 L76 70 C92 74 100 92 98 116Z" fill="${TUNIC}" ${o()}/>
  <path d="M60 72 V116" fill="none" ${o(1.6)}/>
  <circle cx="64" cy="84" r="2.6" fill="${GOLD}" ${o(1.2)}/><circle cx="64" cy="96" r="2.6" fill="${GOLD}" ${o(1.2)}/><circle cx="64" cy="108" r="2.6" fill="${GOLD}" ${o(1.2)}/>
  <path d="M40 86 h12 v8 h-12Z M70 86 h12 v8 h-12Z" fill="${TUNIC2}" ${o(1.6)}/>
  <path d="M26 76 l16 -4 l2 6 l-16 4Z M94 76 l-16 -4 l-2 6 l16 4Z" fill="${GOLD}" ${o(1.3)}/>
  <path d="M48 70 L60 78 L72 70" fill="none" ${o(2)}/>
  <circle cx="36" cy="22" r="10" fill="${FUR}" ${o()}/><circle cx="36" cy="22" r="5" fill="${FUR2}"/>
  <circle cx="84" cy="22" r="10" fill="${FUR}" ${o()}/><circle cx="84" cy="22" r="5" fill="${FUR2}"/>
  <path d="M30 44 C28 24 42 14 60 14 C78 14 92 24 90 44 C88 62 76 72 60 72 C44 72 32 62 30 44Z" fill="${FUR}" ${o()}/>
  <ellipse cx="60" cy="52" rx="17" ry="13" fill="${MUZ}" ${o(2)}/>
  <ellipse cx="60" cy="45" rx="6" ry="4.4" fill="${K}"/>
  <path d="M38 56 C44 48 54 50 60 52 C66 50 76 48 82 56 C76 58 68 56 60 58 C52 56 44 58 38 56Z" fill="#2a1d14" ${o(1.6)}/>
  <path d="M54 62 C58 64 62 64 66 62" fill="none" ${o(2)}/>
  <path d="M66 62 L84 66 L86 62 L92 62 C96 62 98 66 96 70 C94 74 88 74 86 70 L84 70 L64 66Z" fill="#4a2e1c" ${o(1.6)}/>
  <path d="M94 58 c-2 -4 2 -6 0 -10 M99 56 c-2 -4 2 -6 0 -10" fill="none" stroke="${W}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  <ellipse cx="50" cy="38" rx="4.6" ry="3.8" fill="${W}" ${o(1.4)}/><circle cx="51" cy="38.6" r="2.2" fill="${K}"/>
  <ellipse cx="70" cy="38" rx="4.6" ry="3.8" fill="${W}" ${o(1.4)}/><circle cx="69" cy="38.6" r="2.2" fill="${K}"/>
  <path d="M42 30 L56 35 M78 30 L64 35" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
  <path d="M36 26 C34 6 86 6 84 26Z" fill="${CAP}" ${o()}/>
  <path d="M37 24 H83" stroke="${CAP2}" stroke-width="3.4"/>
  <path d="M34 26 H86 C84 31 74 32 60 32 C46 32 36 31 34 26Z" fill="#2b2a22" ${o(1.8)}/>
  <path d="M60 10 l2 4 l4.4 .4 l-3.4 2.8 l1.2 4.3 l-4.2 -2.4 l-4.2 2.4 l1.2 -4.3 l-3.4 -2.8 l4.4 -.4Z" fill="${RED}" ${o(1.2)}/>`;
};

/* ---------- the animals of each continent (D24) ----------
   The leader of the hidden side stays the same everywhere (the cobra, the bear); the liberals and the members of the
   hidden side change with the continent the names come from. They share one body in a tunic of their side and one cap
   of their side; each animal is a head. National emblems never play the villains. */
type Side = 'L' | 'F' | 'C';
const TUNIC: Record<Side, [string, string]> = { L: ['#2d4c7c', '#203a63'], F: ['#6a4f34', '#54402a'], C: ['#b8322a', '#8f241e'] };
const star = (x: number, y: number, r: number, fill: string): string => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r * 0.45 : r; return `${(x + d * Math.cos(a)).toFixed(1)},${(y + d * Math.sin(a)).toFixed(1)}`; });
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${o(1)}/>`;
};
/** A tunic of the side: navy with a white shirt for the liberals, brown with a belt for the cultists, red with a star
 *  for the reds; gold buttons and shoulder boards on all. */
const torso = (s: Side): string => {
  const [c, c2] = TUNIC[s];
  return `<path d="M22 118 C20 94 30 76 46 70 L78 70 C94 76 102 94 100 118Z" fill="${c}" ${o()}/>
  <path d="M50 70 L62 86 L74 70" fill="${s === 'L' ? W : c2}" ${o(2)}/>
  <path d="M62 86 V118" fill="none" ${o(1.6)}/>
  <circle cx="67" cy="95" r="2.6" fill="${GOLD}" ${o(1.3)}/><circle cx="67" cy="107" r="2.6" fill="${GOLD}" ${o(1.3)}/>
  <path d="M27 79 l16 -5 l2 6 l-16 5Z M97 79 l-16 -5 l-2 6 l16 5Z" fill="${GOLD}" ${o(1.3)}/>
  ${s === 'F' ? `<path d="M25 104 H99" stroke="${K}" stroke-width="6"/><path d="M25 104 H99" stroke="#2b2420" stroke-width="3.4"/><rect x="58" y="100" width="8" height="8" rx="1" fill="${GOLD}" ${o(1.4)}/>` : ''}
  ${s === 'C' ? star(82, 92, 6, GOLD) : ''}
  ${s === 'L' ? `<path d="M76 84 h7 v7 l-3.5 -2 l-3.5 2Z" fill="${RED}" ${o(1.2)}/><circle cx="79.5" cy="95" r="3.4" fill="${GOLD}" ${o(1.2)}/>` : ''}`;
};
/** The cap of the side: a navy kepi, a black peaked cap with a red band, a cloth cap with a red star. */
const cap = (s: Side): string => s === 'L'
  ? `<path d="M46 24 L48 6 L78 6 L80 24Z" fill="${TUNIC.L[0]}" ${o()}/><path d="M47 16 H79" stroke="${GOLD}" stroke-width="3.4"/><path d="M47 16 H79" fill="none" ${o(1)}/><circle cx="63" cy="11" r="2.6" fill="${GOLD}" ${o(1.2)}/><path d="M43 24 H83 C81 29 72 30 63 30 C54 30 45 29 43 24Z" fill="${K}"/>`
  : s === 'F'
    ? `<path d="M43 24 C40 4 86 2 83 24Z" fill="#26221f" ${o()}/><path d="M44 21 H82" stroke="${RED}" stroke-width="3.2"/><path d="M40 24 H86 C84 29 75 31 63 31 C51 31 42 29 40 24Z" fill="#26221f" ${o(1.8)}/><circle cx="63" cy="12" r="3" fill="${GOLD}" ${o(1.2)}/>`
    : `<path d="M42 28 C42 18 50 8 63 -2 C76 8 84 18 84 28Z" fill="#6b7a52" ${o()}/><path d="M42 28 H84 L85 34 H41Z" fill="#56633f" ${o(1.6)}/>${star(63, 17, 6, RED)}`;
/** Brows: smug (raised) for a liberal, a sneer (down to the middle) for the hidden side; then the eyes. */
const brows = (s: Side, y: number, gap: number): string => s === 'L'
  ? `<path d="M${54 - gap} ${y - 5} L${68 - gap} ${y - 6.5} M${56 + gap} ${y - 6.5} L${70 + gap} ${y - 5}" fill="none" stroke="${K}" stroke-width="4.2" stroke-linecap="round"/>`
  : `<path d="M${55 - gap} ${y - 10} L${67 - gap} ${y - 6} M${69 + gap} ${y - 10} L${57 + gap} ${y - 6}" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>`;
const look = (s: Side, iris = '#f6e36b', y = 42, gap = 10, lid = ''): string => `<ellipse cx="${62 - gap}" cy="${y}" rx="${s === 'L' && lid ? 5.2 : 4.8}" ry="${s === 'L' && lid ? 3 : 4}" fill="${iris}" ${o(1.4)}/><ellipse cx="${62 + gap}" cy="${y}" rx="${s === 'L' && lid ? 5.2 : 4.8}" ry="${s === 'L' && lid ? 3 : 4}" fill="${iris}" ${o(1.4)}/>
  ${s === 'L' && lid ? [62 - gap, 62 + gap].map(x => `<circle cx="${x + 0.6}" cy="${y + 0.3}" r="2.2" fill="${K}"/><path d="M${x - 5.4} ${y - 0.6} C${x - 3} ${y - 3.6} ${x + 3} ${y - 3.6} ${x + 5.4} ${y - 0.6}" fill="none" stroke="${lid}" stroke-width="2.4"/><path d="M${x - 5.4} ${y - 0.6} C${x - 3} ${y - 3.4} ${x + 3} ${y - 3.4} ${x + 5.4} ${y - 0.6}" fill="none" ${o(1.4)}/>`).join('')
    : `<rect x="${61 - gap}" y="${y - 3}" width="2.2" height="6" rx="1.1" fill="${K}"/><rect x="${61 + gap}" y="${y - 3}" width="2.2" height="6" rx="1.1" fill="${K}"/>`}${brows(s, y, gap)}`;
/** A cat's face (jaguar, lion, tiger, lynx): round head, round ears, a white muzzle, whiskers. */
const cat = (s: Side, fur: string, fur2: string, extra: { behind?: string; marks?: string; ears?: string } = {}): string => `${extra.behind || ''}
  ${extra.ears || (s === 'L' ? `<path d="M36 34 C34 22 40 16 48 20 L50 28Z M90 34 C92 22 86 16 78 20 L76 28Z" fill="${fur}" ${o()}/><path d="M39 28 C38 23 41 20 45 22 L46 27Z M87 28 C88 23 85 20 81 22 L80 27Z" fill="${fur2}"/>` : `<circle cx="41" cy="27" r="9" fill="${fur}" ${o()}/><circle cx="41" cy="27" r="4.4" fill="${fur2}"/><circle cx="85" cy="27" r="9" fill="${fur}" ${o()}/><circle cx="85" cy="27" r="4.4" fill="${fur2}"/>`)}
  <path d="${s === 'L' ? 'M38 42 C38 28 49 21 63 21 C77 21 88 28 88 42 L87 54 C85 66 75 74 63 74 C51 74 41 66 39 54Z' : 'M36 46 C36 30 48 22 63 22 C78 22 90 30 90 46 C90 62 78 70 63 70 C48 70 36 62 36 46Z'}" fill="${fur}" ${o()}/>
  ${s === 'L' ? `<path d="M60 40 L60 50 M66 40 L66 50" fill="none" stroke="${fur2}" stroke-width="2" opacity=".7"/>` : ''}
  ${extra.marks || ''}
  <ellipse cx="63" cy="${s === 'L' ? 60 : 57}" rx="${s === 'L' ? 10 : 13}" ry="${s === 'L' ? 8 : 9}" fill="${W}" ${o(1.8)}/>
  <path d="${s === 'L' ? 'M58 52 H68 L63 57Z' : 'M58 49 H68 L63 54Z'}" fill="${s === 'L' ? '#4a2e22' : PINK}" ${o(1.4)}/>
  <path d="${s === 'L' ? 'M63 57 V61 M57 63 C60 64 66 64 70 61.5' : 'M55 59 C59 61 67 61 71 60'}" fill="none" ${o(2)}/>
  ${s === 'L' ? '' : `<path d="M58 60 l1.5 4 l1.5 -3.6 M66 60 l1.5 4 l1.5 -3.6" fill="${W}" ${o(1)}/>`}
  <path d="M48 55 L34 52 M48 58 L34 60 M78 55 L92 52 M78 58 L92 60" fill="none" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>
  ${look(s, '#f6e36b', 42, 10, fur)}`;
/** A dog's face (coyote, jackal, fox, hyena): tall ears, a long muzzle pointing down. */
const dog = (s: Side, fur: string, fur2: string, muz: string, extra: { ears?: string; marks?: string; grin?: boolean } = {}): string => `
  ${extra.ears || `<path d="M40 34 L36 8 L54 24Z M86 34 L90 8 L72 24Z" fill="${fur}" ${o()}/><path d="M41 28 L39 14 L49 24Z M85 28 L87 14 L77 24Z" fill="${fur2}"/>`}
  <path d="M38 40 C38 28 48 22 63 22 C78 22 88 28 88 40 C88 52 78 60 72 66 L63 76 L54 66 C48 60 38 52 38 40Z" fill="${fur}" ${o()}/>
  ${extra.marks || ''}
  <path d="M51 52 C56 49 70 49 75 52 L68 67 L63 74 L58 67Z" fill="${muz}" ${o(1.6)}/>
  <ellipse cx="63" cy="71" rx="5" ry="3.6" fill="${K}"/>
  ${extra.grin ? `<path d="M52 62 C58 70 68 70 74 62" fill="#7d1d1a" ${o(1.6)}/><path d="M55 64 l2 4 l2 -3.4 M63 66 l2 4 l2 -4 M69 64 l1.6 3.6 l2 -3.6" fill="${W}" ${o(1)}/>` : `<path d="M57 64 C60 66 66 66 69 63" fill="none" ${o(1.8)}/>`}
  ${look(s, '#f6e36b', 40, 11)}`;
/** A bird's head (stork, vulture), with its beak to the side. */
const beaked = (s: Side, head: string, beak: string, extra: { ruff?: string; marks?: string } = {}): string => `${extra.ruff || ''}
  <circle cx="60" cy="44" r="21" fill="${head}" ${o()}/>
  ${extra.marks || ''}
  <path d="M76 44 L114 ${s === 'L' ? 50 : 56} L78 56 C74 52 74 48 76 44Z" fill="${beak}" ${o()}/>
  ${s === 'L' ? '' : `<path d="M108 54 C112 58 110 62 106 62" fill="${beak}" ${o(1.6)}/>`}
  <ellipse cx="66" cy="41" rx="6" ry="6.4" fill="${W}" ${o(1.6)}/><circle cx="67.5" cy="42" r="3" fill="${K}"/><circle cx="68.6" cy="40.6" r="1" fill="${W}"/>
  ${s === 'L' ? `<path d="M58 35 L74 34" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M60 36.5 C63 35 70 35 72.5 37" fill="${head}"/>` : `<path d="M58 31 L74 36" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>`}`;
const spots = (pts: number[][], c: string, ring = false): string => pts.map(([x, y, r]) => (ring ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="1.8"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`)).join('');
const HEADS: Record<string, (s: Side) => string> = {
  condor: s => `<path d="M30 72 C34 60 42 56 50 60 C54 54 70 54 74 60 C82 56 90 60 94 72Z" fill="${W}" ${o(1.8)}/>
    <path d="M44 42 C44 28 52 22 62 22 C72 22 80 28 80 40 C80 52 76 60 68 62 L54 62 C48 58 44 52 44 42Z" fill="#c98a7a" ${o()}/>
    <path d="M56 24 C58 18 64 16 68 20 C68 24 64 26 60 26Z" fill="#a8645a" ${o(1.4)}/>
    <path d="M76 36 C90 34 100 40 100 48 C100 54 94 56 90 52 L78 52 C74 48 74 40 76 36Z" fill="#e8dcc4" ${o()}/><path d="M94 50 C98 52 96 58 92 58" fill="#3a3330" ${o(1.4)}/>
    <ellipse cx="66" cy="38" rx="5.4" ry="5" fill="${W}" ${o(1.5)}/><circle cx="67" cy="38.6" r="2.6" fill="#7d1d1a"/><circle cx="68" cy="37.4" r="0.9" fill="${W}"/>
    <path d="M58 31 C63 29 70 29 74 33" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>`,
  tucano: s => `<circle cx="56" cy="44" r="21" fill="#1f1b19" ${o()}/>
    <path d="M40 50 C42 62 54 66 64 60 C60 54 56 50 56 44 C50 48 44 50 40 50Z" fill="#fff6d8" ${o(1.6)}/>
    <path d="M70 34 C88 26 108 28 118 40 C112 46 96 48 74 50 C70 46 68 40 70 34Z" fill="#f28c1c" ${o()}/>
    <path d="M74 50 C92 50 108 48 118 42 C116 52 98 60 76 58 C72 56 72 52 74 50Z" fill="#f6c33b" ${o()}/>
    <path d="M110 34 C116 36 119 40 118 42 C116 44 112 46 108 46 C110 42 111 38 110 34Z" fill="#1f1b19" ${o(1.4)}/>
    <path d="M76 36 C86 34 96 34 104 36" fill="none" stroke="#d8641a" stroke-width="2"/>
    <circle cx="62" cy="40" r="7.4" fill="#3aa0d8" ${o(1.6)}/><circle cx="62" cy="40" r="4.4" fill="${W}" ${o(1.2)}/><circle cx="63" cy="40.6" r="2.4" fill="${K}"/><circle cx="64" cy="39.4" r="0.9" fill="${W}"/>
    ${s === 'L' ? `<path d="M54 31 L70 31" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>` : `<path d="M54 30 L70 35" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`}`,
  bezerro: s => `<path d="M38 36 C24 30 16 36 18 44 C26 46 34 44 40 42Z M88 36 C102 30 110 36 108 44 C100 46 92 44 86 42Z" fill="#c98a5a" ${o()}/><path d="M36 38 C28 36 23 39 24 42 C30 43 35 42 38 41Z M90 38 C98 36 103 39 102 42 C96 43 91 42 88 41Z" fill="${PINK}"/>
    <path d="M48 24 C46 18 48 14 52 14 C54 18 54 22 54 24Z M78 24 C80 18 78 14 74 14 C72 18 72 22 72 24Z" fill="#e8dcc4" ${o(1.6)}/>
    <path d="M38 44 C38 28 48 22 63 22 C78 22 88 28 88 44 C88 54 84 60 80 64 L46 64 C42 60 38 54 38 44Z" fill="#c98a5a" ${o()}/>
    <path d="M54 22 C58 30 68 30 72 22 C68 26 58 26 54 22Z M42 46 C46 40 52 42 52 48 C50 54 44 54 42 46Z" fill="${W}" ${o(1.2)}/>
    <ellipse cx="63" cy="64" rx="16" ry="11" fill="#f2b2a8" ${o(1.8)}/><ellipse cx="57" cy="64" rx="2.4" ry="3.2" fill="${K}"/><ellipse cx="69" cy="64" rx="2.4" ry="3.2" fill="${K}"/>
    <path d="M58 71 C61 73 65 73 68 71" fill="none" ${o(1.8)}/>
    ${look(s, '#f6e36b', 42, 11)}`,
  onca: s => cat(s, '#e9a23b', '#b9741f', { marks: spots([[48, 34, 3], [58, 30, 2.6], [70, 30, 2.6], [80, 34, 3], [44, 48, 2.6], [83, 47, 2.6], [52, 66, 2.2], [75, 65, 2.2]], '#5a3410', true) }),
  elefante: s => `<path d="M44 34 C24 22 8 38 12 56 C16 70 34 72 44 60Z M82 34 C102 22 118 38 114 56 C110 70 92 72 82 60Z" fill="#8a9096" ${o()}/><path d="M40 38 C28 32 18 42 20 54 C22 62 32 64 40 58Z M86 38 C98 32 108 42 106 54 C104 62 94 64 86 58Z" fill="#cfa2a2"/>
    <path d="M40 44 C40 28 50 22 63 22 C76 22 86 28 86 44 C86 56 80 62 72 64 L54 64 C46 62 40 56 40 44Z" fill="#9aa0a6" ${o()}/>
    <path d="M56 54 C54 72 56 88 62 96 C66 100 72 98 70 92 C66 86 66 72 70 54Z" fill="#9aa0a6" ${o()}/>
    <path d="M58 70 h10 M58 78 h10 M60 86 h8" fill="none" stroke="#6f757b" stroke-width="1.6"/>
    <path d="M52 60 C46 68 48 76 54 78 L56 70Z M74 60 C80 68 78 76 72 78 L70 70Z" fill="${W}" ${o(1.4)}/>
    ${look(s, '#f6e36b', 42, 11, '#9aa0a6')}`,
  canguru: s => `<path d="M42 30 C34 18 32 4 40 2 C48 4 52 18 52 28Z M84 30 C92 18 94 4 86 2 C78 4 74 18 74 28Z" fill="#b87a4a" ${o()}/><path d="M43 26 C38 16 37 8 40 7 C45 9 48 18 49 26Z M83 26 C88 16 89 8 86 7 C81 9 78 18 77 26Z" fill="#e3b9a6"/>
    <path d="M40 42 C40 28 50 22 63 22 C76 22 86 28 86 42 C86 56 78 64 72 72 C68 78 58 78 54 72 C48 64 40 56 40 42Z" fill="#b87a4a" ${o()}/>
    <path d="M52 56 C56 52 70 52 74 56 C72 68 66 74 63 74 C60 74 54 68 52 56Z" fill="#e8cfae" ${o(1.6)}/>
    <ellipse cx="63" cy="60" rx="5" ry="3.6" fill="${K}"/><path d="M63 64 V68 M58 70 C61 71 66 71 69 69" fill="none" ${o(1.8)}/>
    ${look(s, '#f6e36b', 42, 11, '#b87a4a')}`,
  tigre: s => cat(s, '#ec8a2e', '#b7601a', { marks: `<path d="M40 50 C44 60 52 66 63 66 C74 66 82 60 86 50 C82 58 74 62 63 62 C52 62 44 58 40 50Z" fill="${W}" opacity=".9"/><path d="M63 22 L60 30 L63 34 L66 30Z M52 24 L54 33 M74 24 L72 33 M36 40 L48 44 L38 46 M36 50 L48 51 L37 55 M90 40 L78 44 L88 46 M90 50 L78 51 L89 55" fill="${K}" stroke="${K}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>` }),
  lince: s => cat(s, '#c9a477', '#9b7a52', { ears: `<path d="M30 38 L24 10 L48 26Z M96 38 L102 10 L78 26Z" fill="#c9a477" ${o()}/><path d="M28 18 L27 24 L36 26Z M98 18 L99 24 L90 26Z" fill="#9b7a52"/><path d="M24 10 L20 -2 M102 10 L106 -2" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`, marks: `<path d="M36 50 L26 62 L40 58 L34 68 L48 62 M90 50 L100 62 L86 58 L92 68 L78 62" fill="#ede0c8" ${o(1.6)}/>${spots([[48, 34, 1.6], [56, 30, 1.4], [72, 30, 1.4], [79, 34, 1.6]], '#6b4a2c')}` }),
  diabo: s => `<circle cx="38" cy="26" r="10" fill="#1f1b19" ${o()}/><circle cx="38" cy="26" r="5" fill="#d96a6a"/><circle cx="88" cy="26" r="10" fill="#1f1b19" ${o()}/><circle cx="88" cy="26" r="5" fill="#d96a6a"/>
    <path d="M34 46 C34 30 46 22 63 22 C80 22 92 30 92 46 C92 62 80 72 63 72 C46 72 34 62 34 46Z" fill="#1f1b19" ${o()}/>
    <path d="M44 54 C48 74 78 74 82 54 C74 60 52 60 44 54Z" fill="#c43a3a" ${o(1.8)}/><path d="M50 60 C56 68 70 68 76 60" fill="#7d1d1a"/>
    <path d="M47 56 l2.4 5 l2.4 -4.4 l2.4 5 l2.4 -4.6 l2.4 5 l2.4 -5 l2.4 5 l2.4 -4.6 l2.4 5 l2.4 -4.6" fill="${W}" ${o(0.9)}/>
    <ellipse cx="63" cy="50" rx="5" ry="3.4" fill="#d96a6a" ${o(1.2)}/>
    <path d="M40 66 C46 74 54 76 58 76 M86 66 C80 74 72 76 68 76" fill="none" stroke="${W}" stroke-width="2.4" opacity=".8"/>
    ${look(s, '#f05a3c', 40, 11)}`,
  ornitorrinco: s => `<path d="M36 46 C36 30 48 22 63 22 C78 22 90 30 90 46 C90 58 82 64 74 66 L52 66 C44 64 36 58 36 46Z" fill="#7a5236" ${o()}/>
    <path d="M66 50 C84 44 110 46 116 56 C114 66 88 70 66 62 C62 58 62 54 66 50Z" fill="#3b3a3e" ${o()}/>
    <path d="M72 52 C88 49 104 50 110 54" fill="none" stroke="#6a6970" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="102" cy="55" rx="1.8" ry="1.2" fill="#121214"/><ellipse cx="108" cy="56" rx="1.8" ry="1.2" fill="#121214"/>
    <path d="M70 61 C86 64 102 63 112 60" fill="none" ${o(1.6)}/>
    ${look(s, '#f6e36b', 42, 10)}`,
  coiote: s => `<path d="M40 32 L38 10 L54 24Z M86 32 L88 10 L72 24Z" fill="#a39a8c" ${o()}/><path d="M42 26 L41 15 L50 24Z M84 26 L85 15 L76 24Z" fill="#e3b9a6"/>
    <path d="M36 40 L28 46 L35 50 L29 57 L39 58 L45 65 L54 69 L63 80 L72 69 L81 65 L87 58 L97 57 L91 50 L98 46 L90 40 C88 28 78 22 63 22 C48 22 38 28 36 40Z" fill="#a39a8c" ${o()}/>
    <path d="M50 54 C55 50 71 50 76 54 L70 68 L63 78 L56 68Z" fill="#ece6da" ${o(1.6)}/>
    <ellipse cx="63" cy="74" rx="4.6" ry="3.4" fill="${K}"/>
    <path d="M58 66 C61 69 65 69 68 66" fill="none" ${o(1.6)}/><path d="M64 68 C64 75 70 76 70 70 L68 67Z" fill="${PINK}" ${o(1.3)}/>
    ${look(s, '#f6e36b', 40, 11)}`,
  chacal: s => `<path d="M42 34 L30 -4 L56 24Z M84 34 L96 -4 L70 24Z" fill="#2a1d14" ${o()}/><path d="M43 27 L35 6 L52 24Z M83 27 L91 6 L74 24Z" fill="#e6b468"/>
    <path d="M44 36 C44 27 52 22 63 22 C74 22 82 27 82 36 C82 46 76 54 70 62 L63 82 L56 62 C50 54 44 46 44 36Z" fill="#d6a050" ${o()}/>
    <path d="M60 22 L66 22 L65 56 L61 56Z" fill="#5a3a1e"/>
    <path d="M44 40 C48 50 54 56 58 60 L60 70 C54 64 46 54 44 40Z M82 40 C78 50 72 56 68 60 L66 70 C72 64 80 54 82 40Z" fill="${W}" ${o(1.2)}/>
    <ellipse cx="63" cy="79" rx="3.6" ry="3" fill="${K}"/>
    ${look(s, '#f6e36b', 40, 10)}`,
  raposa: s => dog(s, '#e0782c', '#2a1d14', W, { marks: `<path d="M38 40 C42 52 50 58 56 60 L52 50Z M88 40 C84 52 76 58 70 60 L74 50Z" fill="${W}" ${o(1.2)}/>` }),
  hiena: s => `<circle cx="36" cy="24" r="11" fill="#cdb88f" ${o()}/><circle cx="36" cy="24" r="5.6" fill="#3d3026"/><circle cx="90" cy="24" r="11" fill="#cdb88f" ${o()}/><circle cx="90" cy="24" r="5.6" fill="#3d3026"/>
    <path d="M34 46 C34 30 46 22 63 22 C80 22 92 30 92 46 C92 62 80 72 63 72 C46 72 34 62 34 46Z" fill="#cdb88f" ${o()}/>
    ${spots([[42, 34, 2.6], [50, 28, 2.2], [76, 28, 2.2], [84, 34, 2.6], [39, 46, 2.4], [87, 46, 2.4], [42, 56, 2.2], [84, 56, 2.2], [56, 30, 1.6], [70, 30, 1.6]], '#4a3a2c')}
    <ellipse cx="63" cy="57" rx="16" ry="12" fill="#3d3026" ${o(1.6)}/>
    <ellipse cx="63" cy="49" rx="5.4" ry="3.6" fill="${K}"/>
    <path d="M49 56 C54 70 72 70 77 56 C70 60 56 60 49 56Z" fill="#9a2a22" ${o(1.6)}/>
    <path d="M52 58 l2 4 l2 -3.4 M58 59 l2 4.4 l2 -4 M64 59 l2 4.4 l2 -4 M70 58 l2 3.6 l2 -4" fill="${W}" ${o(0.9)}/>
    ${look(s, '#f6e36b', 40, 11)}`,
  javali: s => `<path d="M38 22 L46 4 L54 22Z M88 22 L80 4 L72 22Z" fill="#5d4636" ${o()}/>
    <path d="M44 20 L48 12 L52 18 L56 10 L60 18 L64 8 L68 18 L72 10 L76 18 L80 12 L84 20Z" fill="#3e2e22" ${o(1.4)}/>
    <path d="M36 44 C36 30 48 20 63 20 C78 20 90 30 90 44 C90 60 80 70 63 70 C46 70 36 60 36 44Z" fill="#5d4636" ${o()}/>
    <ellipse cx="63" cy="58" rx="14" ry="10" fill="#c99a86" ${o(1.8)}/><ellipse cx="58" cy="58" rx="2.6" ry="3.6" fill="${K}"/><ellipse cx="68" cy="58" rx="2.6" ry="3.6" fill="${K}"/>
    <path d="M48 62 C42 60 40 52 44 46 C44 54 46 58 50 60Z M78 62 C84 60 86 52 82 46 C82 54 80 58 76 60Z" fill="${W}" ${o(1.3)}/>
    ${look(s, '#f05a3c', 40, 11)}`,
  komodo: s => `<path d="M40 48 C36 32 50 22 68 24 C84 26 98 30 108 37 C116 42 115 51 106 53 L90 57 C78 61 58 63 50 59 C45 57 42 53 40 48Z" fill="#7a6f55" ${o()}/>
    <path d="M46 56 C48 70 66 74 82 62 C72 64 58 64 46 56Z" fill="#9a8d6a" ${o(1.6)}/>
    <path d="M62 51 C78 54 96 52 110 46" fill="none" ${o(2.2)}/>
    <path d="M110 47 L122 43 M110 47 L121 51 M110 47 L104 48" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/>
    ${spots([[50, 40, 1.6], [56, 34, 1.4], [62, 44, 1.6], [86, 32, 1.4], [94, 36, 1.4], [70, 46, 1.4], [54, 50, 1.4], [98, 44, 1.2]], '#57503c')}
    <path d="M66 30 C72 25 84 26 88 32" fill="none" stroke="#57503c" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="78" cy="35" rx="5" ry="4" fill="#f6c33b" ${o(1.5)}/><rect x="77" y="31.8" width="2.2" height="6.4" rx="1.1" fill="${K}"/>
    <path d="M70 29 L86 34" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="105" cy="39" rx="2" ry="1.4" fill="${K}"/>`,
  cegonha: s => beaked(s, W, '#e4572e', { marks: `<path d="M42 54 C48 64 60 66 68 62" fill="none" stroke="#d8d2c4" stroke-width="3"/>` }),
  urubu: s => beaked(s, '#7a716b', '#d8cfc0', { ruff: `<path d="M34 70 L38 58 L44 66 L48 56 L54 66 L60 56 L66 66 L72 56 L76 66 L82 58 L86 70Z" fill="#1f1b19" ${o(1.6)}/>`, marks: `<path d="M48 34 c3 2 6 2 8 0 M46 46 c3 2 6 2 8 0 M52 54 c3 2 6 2 8 0" fill="none" stroke="#4e4743" stroke-width="1.6"/>` })
};
/** Who stands for each side on each continent (D24): the liberal, the cultist, the red. The world keeps the
 *  bird, the alligator and the white wolf. */
const ANIMALS: Record<Exclude<Region, 'mundo'>, { L: string; F: string; C: string }> = {
  americas: { L: 'condor', F: 'urubu', C: 'coiote' },
  africa: { L: 'elefante', F: 'hiena', C: 'chacal' },
  asia: { L: 'tigre', F: 'komodo', C: 'raposa' },
  europa: { L: 'cegonha', F: 'javali', C: 'lince' },
  oceania: { L: 'canguru', F: 'diabo', C: 'ornitorrinco' },
  brasil: { L: 'tucano', F: 'bezerro', C: 'onca' }              // the expansion (D27): the jaguar changes sides
};
/* The leader of the hidden side on each continent (D24): a long grey coat over a lectern, yelling, in one expansion
   theme; a khaki tunic with gold shoulder boards and a pipe in the other. */
const bossBody = (): string => `<path d="M22 118 C20 94 28 76 44 70 L76 70 C92 76 100 94 98 118Z" fill="#4a4e55" ${o()}/>
  <path d="M44 70 L60 92 L76 70" fill="#383b41" ${o(2)}/>
  <path d="M28 86 C32 78 40 74 44 76 L42 102 C36 102 30 98 28 94Z" fill="#383b41" ${o(2)}/><path d="M29 88 L42 86 L42 95 L29 96Z" fill="${RED}" ${o(1.6)}/>
  <path d="M26 74 l14 -4 l2 4 l-14 5Z M94 74 l-14 -4 l-2 4 l14 5Z" fill="${GOLD}" ${o(1.3)}/>`;
const lectern = `<path d="M34 98 H86 L80 120 H40Z" fill="#8a5a34" ${o()}/><path d="M34 98 H86 L84 104 H36Z" fill="#a46e43" ${o(1.6)}/><rect x="44" y="107" width="32" height="7" fill="${RED}" ${o(1.4)}/>`;
const bossCap = `<path d="M41 24 C38 4 82 2 79 24Z" fill="#26221f" ${o()}/><path d="M42 22 H78" stroke="${RED}" stroke-width="3.2"/><path d="M36 24 H84 C82 29 72 31 60 31 C48 31 38 29 36 24Z" fill="#26221f" ${o(1.8)}/><circle cx="60" cy="13" r="3.4" fill="${GOLD}" ${o(1.3)}/>`;
const shout = `<path d="M26 54 l-6 -3 M24 62 l-7 0 M94 54 l6 -3 M96 62 l7 0" fill="none" stroke="${W}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
const chiefBody = (): string => `<path d="M22 118 C20 94 30 76 46 72 L76 72 C92 76 100 94 98 118Z" fill="#8a865f" ${o()}/>
  <path d="M60 74 V118" fill="none" ${o(1.6)}/>
  <circle cx="64" cy="86" r="2.6" fill="${GOLD}" ${o(1.2)}/><circle cx="64" cy="98" r="2.6" fill="${GOLD}" ${o(1.2)}/><circle cx="64" cy="110" r="2.6" fill="${GOLD}" ${o(1.2)}/>
  <path d="M40 88 h12 v8 h-12Z M70 88 h12 v8 h-12Z" fill="#6f6b48" ${o(1.6)}/>
  <path d="M26 78 l16 -4 l2 6 l-16 4Z M94 78 l-16 -4 l-2 6 l16 4Z" fill="${GOLD}" ${o(1.3)}/>`;
const chiefCap = `<path d="M38 26 C36 6 84 6 82 26Z" fill="#7d7a55" ${o()}/><path d="M39 24 H81" stroke="#5f5c3d" stroke-width="3.4"/><path d="M36 26 H84 C82 31 72 32 60 32 C48 32 38 31 36 26Z" fill="#2b2a22" ${o(1.8)}/>${star(60, 15, 5.6, RED)}`;
const pipe = (x: number, y: number): string => `<path d="M${x} ${y} L${x + 18} ${y + 4} L${x + 20} ${y} L${x + 26} ${y} C${x + 30} ${y} ${x + 32} ${y + 4} ${x + 30} ${y + 8} C${x + 28} ${y + 12} ${x + 22} ${y + 12} ${x + 20} ${y + 8} L${x + 18} ${y + 8} L${x - 2} ${y + 4}Z" fill="#4a2e1c" ${o(1.6)}/><path d="M${x + 28} ${y - 4} c-2 -4 2 -6 0 -10 M${x + 33} ${y - 6} c-2 -4 2 -6 0 -10" fill="none" stroke="${W}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
const stache = (y: number, c = '#2a1d14'): string => `<path d="M40 ${y} C46 ${y - 8} 54 ${y - 6} 60 ${y - 4} C66 ${y - 6} 74 ${y - 8} 80 ${y} C74 ${y + 2} 66 ${y} 60 ${y + 2} C54 ${y} 46 ${y + 2} 40 ${y}Z" fill="${c}" ${o(1.6)}/>`;
const angry = (y = 40, gap = 10, iris = '#f6e36b'): string => look('F', iris, y, gap);
const LEADERS: Record<string, () => string> = {
  polvo: () => `<path d="M34 46 C30 22 44 8 60 8 C76 8 90 22 86 46 C84 58 76 66 60 66 C44 66 36 58 34 46Z" fill="#c8506a" ${o()}/>
    ${spots([[44, 26, 2.2], [52, 18, 1.8], [70, 18, 1.8], [78, 28, 2.2], [40, 40, 1.6], [82, 42, 1.6]], '#9a3450')}
    <path d="M40 62 C28 70 20 84 30 92 C36 96 40 88 34 84 M48 64 C42 80 44 96 52 100 C58 102 58 94 52 92 M60 66 C60 84 58 98 64 104 C70 106 72 98 66 96 M72 64 C78 80 76 96 68 100 C62 102 62 94 68 92 M80 62 C92 70 100 84 90 92 C84 96 80 88 86 84" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round"/>
    <path d="M40 62 C28 70 20 84 30 92 C36 96 40 88 34 84 M48 64 C42 80 44 96 52 100 C58 102 58 94 52 92 M60 66 C60 84 58 98 64 104 C70 106 72 98 66 96 M72 64 C78 80 76 96 68 100 C62 102 62 94 68 92 M80 62 C92 70 100 84 90 92 C84 96 80 88 86 84" fill="none" stroke="#d8607a" stroke-width="5" stroke-linecap="round"/>
    ${spots([[28, 80, 1.3], [32, 88, 1.3], [46, 84, 1.3], [48, 94, 1.3], [60, 86, 1.3], [62, 96, 1.3], [74, 84, 1.3], [72, 94, 1.3], [90, 80, 1.3], [88, 88, 1.3]], '#f4c6d0')}
    ${stache(56)}<path d="M54 61 C58 63 62 63 66 61" fill="none" ${o(2)}/>${pipe(66, 60)}${angry(42, 12, W)}`,
  boi: () => `<path d="M38 32 C22 32 10 22 8 6 C16 16 26 20 40 22Z M82 32 C98 32 110 22 112 6 C104 16 94 20 80 22Z" fill="#efe4cc" ${o()}/>
    <path d="M40 34 C26 30 16 36 18 44 C26 46 34 44 42 42Z M80 34 C94 30 104 36 102 44 C94 46 86 44 78 42Z" fill="#4a2e1c" ${o()}/>
    <path d="M36 42 C36 28 46 22 60 22 C74 22 84 28 84 42 C84 54 80 62 76 66 L44 66 C40 62 36 54 36 42Z" fill="#4a2e1c" ${o()}/>
    <path d="M54 22 L60 34 L66 22Z" fill="${W}" ${o(1.2)}/>
    <ellipse cx="60" cy="66" rx="18" ry="12" fill="#9a6a54" ${o(1.8)}/><ellipse cx="53" cy="64" rx="2.6" ry="3.6" fill="${K}"/><ellipse cx="67" cy="64" rx="2.6" ry="3.6" fill="${K}"/>
    <path d="M54 70 C54 80 66 80 66 70" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 72 C54 78 66 78 70 72 C66 74 54 74 50 72Z" fill="#5a1414" ${o(1.2)}/>
    ${angry(42, 12, '#e8442e')}${shout}`,
  piranha: () => `<path d="M32 46 L20 36 L22 50Z M88 46 L100 36 L98 50Z" fill="#7d8790" ${o()}/>
    <path d="M34 44 C34 28 46 20 60 20 C76 20 86 30 86 46 C86 62 76 72 60 72 C46 72 34 62 34 44Z" fill="#8f9aa3" ${o()}/>
    <path d="M36 50 C40 70 80 70 84 50 C78 58 66 56 60 56 C54 56 42 58 36 50Z" fill="#d65a3a" ${o(1.8)}/>
    <path d="M42 54 C50 66 70 66 78 54 C70 58 50 58 42 54Z" fill="#5a1414" ${o(1.6)}/>
    <path d="M44 55 l3 5 l3 -4.4 l3 5 l3 -4.6 l3 5 l3 -5 l3 5 l3 -4.6 l3 5 l3 -5" fill="${W}" ${o(1)}/>
    <path d="M46 64 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4" fill="${W}" ${o(1)}/>
    ${angry(40, 12, '#f2c02e')}${shout}`,
  crocodilo: () => `<path d="M40 50 C36 32 50 24 66 26 C82 28 98 30 110 34 C116 36 116 42 110 44 L92 46 C80 46 62 48 50 50Z" fill="#7b7a3c" ${o()}/>
    <path d="M44 54 C58 56 82 60 108 66 C114 68 114 74 108 74 C90 74 64 70 48 64Z" fill="#7b7a3c" ${o()}/>
    <path d="M50 50 C62 50 86 48 108 44 L108 66 C84 60 62 56 48 54Z" fill="#7d1d1a" ${o(1.6)}/>
    <path d="M70 47 l2 5 l2 -5 M80 46 l2 5 l2 -5 M90 45 l2 5 l2 -5 M100 44 l2 5 l2 -5 M74 58 l2 -5 l2 5 M86 61 l2 -5 l2 5 M98 64 l2 -5 l2 5" fill="${W}" ${o(1)}/>
    ${spots([[56, 34, 1.8], [64, 30, 1.6], [86, 33, 1.5], [96, 35, 1.5]], '#5a5a2a')}
    <ellipse cx="72" cy="35" rx="5.4" ry="4.4" fill="#f6e36b" ${o(1.5)}/><rect x="71" y="31.8" width="2.2" height="6.4" rx="1.1" fill="${K}"/>
    <path d="M64 28 L80 33" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/><ellipse cx="110" cy="37" rx="2" ry="1.4" fill="${K}"/>${shout}`,
  aranha: () => `<path d="M38 44 C24 36 14 40 6 54 M38 52 C22 50 12 58 8 72 M82 44 C96 36 106 40 114 54 M82 52 C98 50 108 58 112 72" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>
    <path d="M38 44 C24 36 14 40 6 54 M38 52 C22 50 12 58 8 72 M82 44 C96 36 106 40 114 54 M82 52 C98 50 108 58 112 72" fill="none" stroke="#4a3426" stroke-width="4" stroke-linecap="round"/>
    <path d="M36 46 C36 30 46 22 60 22 C74 22 84 30 84 46 C84 60 74 70 60 70 C46 70 36 60 36 46Z" fill="#4a3426" ${o()}/>
    <path d="M40 40 l-4 -2 M42 34 l-3 -3 M80 40 l4 -2 M78 34 l3 -3 M44 60 l-3 3 M76 60 l3 3" stroke="#2a1c14" stroke-width="2" stroke-linecap="round"/>
    <circle cx="54" cy="40" r="4.6" fill="#e8442e" ${o(1.4)}/><circle cx="66" cy="40" r="4.6" fill="#e8442e" ${o(1.4)}/>
    <circle cx="46" cy="36" r="2.4" fill="#e8442e" ${o(1)}/><circle cx="74" cy="36" r="2.4" fill="#e8442e" ${o(1)}/><circle cx="50" cy="31" r="2" fill="#e8442e" ${o(1)}/><circle cx="70" cy="31" r="2" fill="#e8442e" ${o(1)}/><circle cx="56" cy="32" r="1.6" fill="#e8442e" ${o(1)}/><circle cx="64" cy="32" r="1.6" fill="#e8442e" ${o(1)}/>
    <path d="M52 34 L58 38 M68 34 L62 38" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
    <path d="M52 54 C48 62 50 70 54 72 C56 66 56 60 56 56Z M68 54 C72 62 70 70 66 72 C64 66 64 60 64 56Z" fill="#1f1b19" ${o(1.4)}/>
    <path d="M56 56 C58 64 62 64 64 56 C62 58 58 58 56 56Z" fill="#5a1414" ${o(1.2)}/>${shout}`,
  rato: () => `<circle cx="34" cy="24" r="13" fill="#8a8580" ${o()}/><circle cx="34" cy="24" r="7" fill="#d99a9a"/><circle cx="86" cy="24" r="13" fill="#8a8580" ${o()}/><circle cx="86" cy="24" r="7" fill="#d99a9a"/>
    <path d="M38 40 C38 28 48 22 60 22 C72 22 82 28 82 40 C82 52 74 60 68 66 L60 76 L52 66 C46 60 38 52 38 40Z" fill="#8a8580" ${o()}/>
    <ellipse cx="60" cy="74" rx="4.6" ry="3.6" fill="${PINK}" ${o(1.4)}/>
    <path d="M48 68 L30 64 M48 71 L30 72 M72 68 L90 64 M72 71 L90 72" fill="none" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M52 62 C56 70 64 70 68 62 C64 64 56 64 52 62Z" fill="#5a1414" ${o(1.4)}/><path d="M57 63 h6 v5 h-6Z" fill="${W}" ${o(1)}/>
    ${angry(42, 10, '#e8442e')}${shout}`,
  panda: () => `<circle cx="36" cy="22" r="10" fill="#1f1b19" ${o()}/><circle cx="84" cy="22" r="10" fill="#1f1b19" ${o()}/>
    <path d="M30 46 C28 26 42 16 60 16 C78 16 92 26 90 46 C88 62 76 72 60 72 C44 72 32 62 30 46Z" fill="#f4f1ea" ${o()}/>
    <path d="M40 40 C40 32 50 30 54 36 C58 44 52 50 46 50 C42 50 40 46 40 40Z M80 40 C80 32 70 30 66 36 C62 44 68 50 74 50 C78 50 80 46 80 40Z" fill="#1f1b19"/>
    <ellipse cx="60" cy="54" rx="13" ry="10" fill="#fffaf0" ${o(1.6)}/><ellipse cx="60" cy="48" rx="5.4" ry="3.8" fill="${K}"/>
    ${stache(57)}<path d="M54 63 C58 65 62 65 66 63" fill="none" ${o(2)}/>${pipe(66, 62)}${angry(40, 12, W)}`,
  casuar: () => `<path d="M58 6 C56 -6 66 -10 70 -2 C72 4 70 12 66 20Z" fill="#8a5a34" ${o()}/>
    <path d="M46 72 C42 60 40 50 44 40 C48 26 56 20 64 20 C74 20 82 28 82 42 C82 54 76 64 74 72Z" fill="#3a8fc8" ${o()}/>
    <path d="M56 68 C52 78 56 86 60 84 C62 80 62 72 62 68Z M70 68 C72 78 70 86 66 84 C64 80 64 72 64 68Z" fill="#d8322a" ${o(1.4)}/>
    <path d="M70 46 L100 52 L78 60 C74 58 72 52 70 46Z" fill="#2a2420" ${o()}/><path d="M72 56 L94 54 L80 62Z" fill="#7d1d1a" ${o(1.2)}/>
    ${angry(40, 8, '#e8442e')}${shout}`,
  coala: () => `<circle cx="32" cy="30" r="15" fill="#9b9b9b" ${o()}/><circle cx="32" cy="30" r="9" fill="#f1ece4"/><circle cx="88" cy="30" r="15" fill="#9b9b9b" ${o()}/><circle cx="88" cy="30" r="9" fill="#f1ece4"/>
    <path d="M32 46 C30 28 44 18 60 18 C76 18 90 28 88 46 C86 62 76 72 60 72 C44 72 34 62 32 46Z" fill="#a7a7a7" ${o()}/>
    <path d="M52 40 C52 34 68 34 68 40 L68 52 C68 58 52 58 52 52Z" fill="#2a2a2c" ${o(1.6)}/>
    ${stache(61)}<path d="M54 66 C58 68 62 68 66 66" fill="none" ${o(2)}/>${pipe(66, 66)}${angry(38, 15, W)}`,
  rinoceronte: () => `<path d="M38 30 L34 14 L48 24Z M82 30 L86 14 L72 24Z" fill="#8d8a86" ${o()}/>
    <path d="M32 44 C32 28 44 20 60 20 C76 20 88 28 88 44 C88 64 78 78 60 78 C42 78 32 64 32 44Z" fill="#8d8a86" ${o()}/>
    <path d="M36 50 C40 46 44 46 46 50 M84 50 C80 46 76 46 74 50 M40 60 C44 58 46 60 48 64 M80 60 C76 58 74 60 72 64" fill="none" stroke="#5f5c58" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="60" cy="64" rx="17" ry="12" fill="#a8a49e" ${o(1.8)}/>
    <path d="M50 56 C52 42 58 30 62 24 C64 36 68 48 70 56Z" fill="#e6dccb" ${o(1.8)}/>
    <path d="M56 42 C56 38 58 34 60 32" fill="none" stroke="#c8bba4" stroke-width="2"/>
    <ellipse cx="54" cy="64" rx="2.2" ry="3" fill="${K}"/><ellipse cx="66" cy="64" rx="2.2" ry="3" fill="${K}"/>
    ${stache(70)}${pipe(66, 72)}${angry(42, 13, W)}`,
  oculos: () => `<circle cx="36" cy="24" r="10" fill="#2a2420" ${o()}/><circle cx="84" cy="24" r="10" fill="#2a2420" ${o()}/>
    <path d="M30 46 C28 26 42 16 60 16 C78 16 92 26 90 46 C88 62 76 72 60 72 C44 72 32 62 30 46Z" fill="#2a2420" ${o()}/>
    <path d="M42 34 C46 28 56 30 56 38 C56 46 48 50 44 46 Z M78 34 C74 28 64 30 64 38 C64 46 72 50 76 46 Z" fill="#e8d6a8" ${o(1.2)}/>
    <ellipse cx="60" cy="54" rx="15" ry="11" fill="#e8d6a8" ${o(1.8)}/><ellipse cx="60" cy="47" rx="5.6" ry="4" fill="${K}"/>
    ${stache(57)}<path d="M54 63 C58 65 62 65 66 63" fill="none" ${o(2)}/>${pipe(66, 62)}${angry(39, 10, W)}`,
  morsa: () => `<path d="M30 46 C28 26 42 18 60 18 C78 18 92 26 90 46 C88 62 76 70 60 70 C44 70 32 62 30 46Z" fill="#9a6a4a" ${o()}/>
    <path d="M38 52 C40 42 52 40 60 46 C68 40 80 42 82 52 C80 62 68 64 60 58 C52 64 40 62 38 52Z" fill="#c69a74" ${o(1.8)}/>
    ${spots([[46, 50, 1], [50, 54, 1], [44, 56, 1], [74, 50, 1], [70, 54, 1], [76, 56, 1]], K)}
    <path d="M50 60 C48 72 50 84 54 90 C56 82 56 70 56 60Z M70 60 C72 72 70 84 66 90 C64 82 64 70 64 60Z" fill="#f4ecd8" ${o(1.6)}/>
    <ellipse cx="60" cy="44" rx="4" ry="3" fill="${K}"/>${pipe(72, 58)}${angry(36, 11, W)}`
};
const BOSSES: Record<Exclude<Region, 'mundo'>, { H: string; S: string }> = {
  americas: { H: 'piranha', S: 'oculos' }, africa: { H: 'crocodilo', S: 'rinoceronte' }, asia: { H: 'aranha', S: 'panda' }, europa: { H: 'rato', S: 'morsa' }, oceania: { H: 'casuar', S: 'coala' }, brasil: { H: 'boi', S: 'polvo' }
};
const leader = (pack: Pack, region: Exclude<Region, 'mundo'>): string => pack === 'vermelho'
  ? `${spot}${chiefBody()}${LEADERS[BOSSES[region].S]()}${chiefCap}`
  : `${spot}${bossBody()}${LEADERS[BOSSES[region].H]()}${bossCap}${lectern}`;
const LABEL: Record<string, string> = {
  onca: 'onça', urubu: 'urubu', coiote: 'coiote', elefante: 'elefante', hiena: 'hiena', chacal: 'chacal', tigre: 'tigre', komodo: 'dragão-de-komodo',
  raposa: 'raposa', cegonha: 'cegonha', javali: 'javali', lince: 'lince', canguru: 'canguru', diabo: 'diabo-da-tasmânia', ornitorrinco: 'ornitorrinco',
  piranha: 'piranha', oculos: 'urso-de-óculos', crocodilo: 'crocodilo-do-Nilo', rinoceronte: 'rinoceronte', aranha: 'aranha', panda: 'panda',
  rato: 'rato', morsa: 'morsa', casuar: 'casuar', coala: 'coala', tucano: 'tucano', bezerro: 'bezerro', boi: 'boi', polvo: 'polvo', condor: 'condor'
};
/** The animal behind each role, by name, for the gallery (D25). */
export const animalOf = (r: Role, pack: Pack = 'culto', region: Region = 'mundo'): string => {
  if (pack === 'culto') return r === 'liberal' ? 'investigador' : r === 'lider' ? 'sumo sacerdote' : 'cultista';   // D96
  if (pack === 'esparta') return r === 'liberal' ? 'hoplita ateniense' : r === 'lider' ? 'rei de Esparta' : 'hoplita espartano';   // D139, D150
  if (region === 'mundo') return r === 'liberal' ? 'pássaro' : pack === 'vermelho' ? (r === 'lider' ? 'urso' : 'lobo-branco') : r === 'lider' ? 'naja' : 'jacaré';
  if (r === 'lider') return LABEL[BOSSES[region][pack === 'vermelho' ? 'S' : 'H']];
  return LABEL[ANIMALS[region][r === 'liberal' ? 'L' : pack === 'vermelho' ? 'C' : 'F']];
};
const member = (s: Side, animal: string): string => `${spot}${torso(s)}${HEADS[animal](s)}${cap(s)}`;

const svg = (body: string, cls: string): string => `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${body}</svg>`;

/** The big picture on a role card. In the red theme (D12) the hidden side is the wolf and its leader the bear;
 *  on a continent (D24), the liberal and the member of the hidden side are that continent's animals. */
/* D96: Secret Cultist, in the same heavy-outline style: the investigator in trench coat and hat with a lamp, the cultist
 * in a red hooded robe with no face in the hood, the High Priest in black with a gold mitre and tentacles at the hem. */
const investigator = (): string => `<circle cx="60" cy="62" r="52" fill="#f2d98a" opacity=".35"/><path d="M20 118c2-30 16-44 40-44s38 14 40 44z" fill="#8a6a3a" ${K}/><path d="M48 76l12 32 12-32" fill="#e8e1cf" ${K}/><path d="M58 80h4l2 30h-8z" fill="#7a2a1a" ${K}/><path d="M40 82l-8 36M80 82l8 36" stroke="#15110e" stroke-width="3"/><ellipse cx="60" cy="54" rx="20" ry="23" fill="#e0ad86" ${K}/><path d="M48 50l7 1M65 51l7-1" stroke="#15110e" stroke-width="3" stroke-linecap="round"/><circle cx="52" cy="56" r="2.6" fill="#15110e"/><circle cx="68" cy="56" r="2.6" fill="#15110e"/><path d="M51 66c4-3 14-3 18 0-3 3-15 3-18 0z" fill="#5a3a22" ${K}/><path d="M24 38h72l-7 6H31z" fill="#3a2a1a" ${K}/><path d="M37 38c0-15 10-23 23-23s23 8 23 23z" fill="#3a2a1a" ${K}/><path d="M39 35h42" stroke="#7a2a1a" stroke-width="4"/><circle cx="94" cy="92" r="11" fill="#cfe6ee" ${K}/><path d="M86 100 72 116" stroke="#15110e" stroke-width="5" stroke-linecap="round"/><path d="M90 88c2-2 5-2 7 0" stroke="#fff" stroke-width="2" fill="none"/>`;
// the cultist: a red hood with a goat skull for a face (horns curling out of the hood)
const cultist = (): string => `<circle cx="60" cy="62" r="52" fill="#c4381f" opacity=".25"/><path d="M18 118c4-40 18-78 42-90 24 12 38 50 42 90z" fill="#9e2414" ${K}/><path d="M36 74c0-24 10-38 24-38s24 14 24 38c-6 6-14 9-24 9s-18-3-24-9z" fill="#2a0f0a" ${K}/><path d="M44 48c-10-6-16-2-18 6 6-3 10-2 14 2M76 48c10-6 16-2 18 6-6-3-10-2-14 2" fill="#efe6d2" ${K}/><path d="M46 50c2-6 8-8 14-8s12 2 14 8l-3 16c-2 8-6 14-11 16-5-2-9-8-11-16z" fill="#efe6d2" ${K}/><path d="M50 56l6 3-5 3zM70 56l-6 3 5 3z" fill="#15110e"/><path d="M57 70h6l-3 5z" fill="#15110e"/><path d="M55 78h10M57 82h6" stroke="#15110e" stroke-width="2"/><path d="M48 118l12-26 12 26" fill="#2a0f0a" ${K}/>`;
// the High Priest: black robe and gold mitre over a face of tentacles, more of them crawling out from under the robe
const priest = (): string => `<circle cx="60" cy="62" r="52" fill="#3c6e71" opacity=".3"/><path d="M14 118c4-40 18-74 46-86 28 12 42 46 46 86z" fill="#1d1a24" ${K}/><path d="M40 74c0-22 9-34 20-34s20 12 20 34c-6 5-13 8-20 8s-14-3-20-8z" fill="#2f5a5c" ${K}/><circle cx="52" cy="58" r="3.5" fill="#d4ac0d"/><circle cx="68" cy="58" r="3.5" fill="#d4ac0d"/><path d="M46 66c-2 10 0 18-6 26M53 68c0 10 2 18-2 28M60 68c0 12 2 20 0 30M67 68c0 10-2 18 2 28M74 66c2 10 0 18 6 26" fill="none" stroke="#3c8a8c" stroke-width="5" stroke-linecap="round"/><path d="M46 66c-2 10 0 18-6 26M53 68c0 10 2 18-2 28M60 68c0 12 2 20 0 30M67 68c0 10-2 18 2 28M74 66c2 10 0 18 6 26" fill="none" stroke="#15110e" stroke-width="1.5" stroke-dasharray="1 4" stroke-linecap="round"/><path d="M44 38 50 6l10 14 10-14 6 32c-5-3-10-4-16-4s-11 1-16 4z" fill="#d4ac0d" ${K}/><circle cx="60" cy="24" r="4" fill="#3c6e71" ${K}/><path d="M18 116c4-10 10-12 12-4s8 6 10-4M80 112c2-10 8-10 10-2s8 4 10-6" fill="none" stroke="#3c8a8c" stroke-width="6" stroke-linecap="round"/>`;
// D150: Secret Leônidas, drawn again (by Claude Fable 5.1, approved by the user): helmeted hoplite busts in the style of
// the other portraits. The Athenian in profile with a Corinthian helmet pushed up (like the Pericles bust), white and blue;
// the Spartan anonymous behind a closed helmet and the lambda shield, eyes glowing; Leônidas with the ram-horn cheek guards
// of the marble "Leonidas" of Sparta, a general's transverse crest, red cloak and spear. Gradient ids are fixed per piece.
const athenian = (): string => `<defs>
<radialGradient id="atV" cx="55%" cy="42%" r="62%"><stop offset="0" stop-color="#eaf7ff"/><stop offset=".55" stop-color="#74b4e4"/><stop offset="1" stop-color="#1d4a86"/></radialGradient>
<clipPath id="atC"><path d="M-10 -10H130V60H-10Z"/><circle cx="60" cy="60" r="57"/></clipPath>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#atV)" stroke="#1b1512" stroke-width="2.6"/>
<g clip-path="url(#atC)" stroke="#1b1512" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
<!-- crest -->
<path d="M88 19C86 5 68 0 52 2C30 5 15 24 15 50C15 60 18 68 23 75C24 62 27 52 32 44L60 30Z" fill="#f6f1e6"/>
<path d="M85 19C76 7.500 60 5.500 48 9.500C31 15.500 21 34 20.500 62" fill="none" stroke="#2f66b3" stroke-width="4" stroke-linecap="butt"/>
<g stroke-width="1.1" fill="none"><path d="M72 5L74 14M58 3L60 12M44 6L48 15M32 14L38 21M23 26L30 31M18 40L25 43M17 54L24 54"/></g>
<!-- cloak behind -->
<path d="M46 72C28 78 12 96 6 122L46 122Z" fill="#2f66b3"/>
<path d="M30 92C24 100 20 110 18 120" fill="none" stroke-width="1.6"/>
<!-- neck -->
<path d="M52 66L49 100L77 100L73 74Z" fill="#dba06c"/>
<path d="M54 76L74 80L74 88C66 86 58 82 54 76Z" fill="#b57a4c" stroke="none"/>
<!-- linothorax -->
<path d="M20 122C22 102 34 91 50 87L62 96L77 90C90 94 98 106 100 122Z" fill="#f3eee2"/>
<path d="M50 87L62 96L77 90L78 95L61 102L46 92Z" fill="#2f66b3" stroke-width="1.5"/>
<path d="M34 98C32 106 31 114 31 122" fill="none" stroke-width="1.4"/>
<!-- face -->
<path d="M70 36L75.5 44L84 56Q83.5 59 79.5 59L80 61.5Q82 63 80 64.5Q81.5 66.5 79.5 68Q78 70 80 73Q80.5 79 73 80L58 77Q47 70 47 54L50 36Z" fill="#e3aa76"/>

<!-- hair + beard -->
<path d="M72 36Q69 44 63 43.500Q64 48 60 49Q55 49 54 54L52 60Q46 58 45 50Q44 42 48 36Z" fill="#3b2a20"/>
<path d="M55 57C57 63 62 66 68 66.500C72 67 74 66.500 76 66.500L79.500 67.500Q78 70 80.500 73Q82.500 79 76 82Q72 84.500 68 82.500Q63 83.500 60 79.500Q55 78 54 72Q50 66 52 58Z" fill="#3b2a20"/>
<path d="M71 63.500Q75 59 80.500 60.500Q82 62.500 80 63.800Q75 63.300 72 65.500Z" fill="#3b2a20" stroke-width="1.6"/>
<path d="M56.500 52.500Q60.500 50 61.500 54Q62 58.500 58.500 60Q56.500 60 56.500 57.500Z" fill="#e3aa76" stroke-width="1.5"/><path d="M58.300 54Q59.800 54.500 59.300 57" fill="none" stroke-width="1"/>
<path d="M60 72Q63 75 67 75M66 70Q69 72 73 71" fill="none" stroke="#6b4a36" stroke-width="1.3"/>
<!-- eye -->
<path d="M68 49.500Q72 45.500 78 48.200Q74 52 68 49.500Z" fill="#fff" stroke-width="1.2"/>
<circle cx="75" cy="48.600" r="1.9" fill="#1b1512" stroke="none"/>
<path d="M68 49.3Q72 45.500 78 48.200" fill="none" stroke-width="2"/>
<path d="M65.500 45.500Q71 42.500 78.500 46.300" fill="none" stroke-width="3"/>
<!-- helmet pushed up -->
<path d="M33 67C26 46 31 15 60 13C70 12.5 79 15 84 20L93 30.5L87.5 31.5L91 38.5Q80 41.5 70 39.5C60 38.5 52 42 48 50C45 56 43 62 41 68Z" fill="#dfe5ea"/>
<path d="M33 67C26 46 31 15 60 13C48 18 40 30 40 46C40 54 40 62 41 68Z" fill="#a9b4c0" stroke="none"/>
<path d="M56 17C64 15 72 16 78 20C70 19 62 19 54 21Z" fill="#ffffff" stroke="none"/>
<path d="M73.5 30.5Q80 24.5 87 30Q80 34.5 73.5 30.5Z" fill="#1b1512" stroke-width="1.4"/>
<path d="M88 36Q79 38 70 36.5C59 35.5 50 39 45.5 48" fill="none" stroke-width="1.2"/>
<!-- olive leaves -->
<g fill="#d9a93a" stroke-width="1.2"><path d="M46 36Q50 28 58 28Q54 35 46 36Z"/><path d="M56 30Q61 23 69 24Q64 30 56 30Z"/><path d="M45 40Q43 31 48 25Q51 33 45 40Z"/></g>
<!-- shield -->
<circle cx="87" cy="99" r="26" fill="#e0b04a"/>
<circle cx="87" cy="99" r="20.500" fill="#2f66b3" stroke-width="1.6"/>
<path d="M66 89A23.500 23.500 0 0 1 82 76" fill="none" stroke="#fff3c4" stroke-width="1.6"/>
</g>
<path d="M3 60A57 57 0 0 0 117 60" fill="none" stroke="#1b1512" stroke-width="2.6"/>`;
const spartan = (): string => `<defs>
<radialGradient id="esV" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#e8604a"/><stop offset=".55" stop-color="#8e1f1a"/><stop offset="1" stop-color="#2a0808"/></radialGradient>
<clipPath id="esC"><path d="M-10 -10H130V60H-10Z"/><circle cx="60" cy="60" r="57"/></clipPath>
<filter id="esG" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#esV)" stroke="#1b1512" stroke-width="2.6"/>
<g clip-path="url(#esC)" stroke="#1b1512" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
<!-- crest -->
<path d="M64 8C92 4 113 30 109 70L105 87L101.500 78L98 89L94 77C96 60 90 42 72 28Z" fill="#a81e18"/>
<path d="M78 14L76 22M90 22L85 28M99 34L93 38M104 48L97 50M105 62L98 62" fill="none" stroke-width="1.1" opacity=".8"/>
<path d="M54 30C52 18 48 10 45 4L49.500 6L52.500 1.500L56.500 5L60 0.800L63.500 5L67.500 1.500L70.500 6L75 4C72 10 68 18 66 30Z" fill="#d8301f"/>
<path d="M56.500 9L57.500 24M60 6L60 24M63.500 9L62.500 24" fill="none" stroke="#7d1310" stroke-width="1.2"/>
<!-- body -->
<path d="M28 122C32 100 44 91 60 89C80 89 96 98 104 122Z" fill="#a8702c"/>
<path d="M72 86C90 86 106 96 118 122L80 122C82 108 80 97 72 86Z" fill="#c8281e"/>
<path d="M84 94C90 102 93 112 94 122M98 100C103 108 106 115 108 122" fill="none" stroke-width="1.4"/>
<circle cx="78" cy="92" r="4.2" fill="#e9b94f" stroke-width="1.8"/>
<g transform="translate(60 23) scale(.92) translate(-60 -16)">
<!-- helmet -->
<path d="M60 16C83 16 96 32 96 52C96 68 91 83 83 93L67 98L60 94L53 98L37 93C29 83 24 68 24 52C24 32 37 16 60 16Z" fill="#cf9038"/>
<path d="M60 16C83 16 96 32 96 52C96 68 91 83 83 93L75 95.5C84 82 88 68 87 52C86 34 76 21 60 16Z" fill="#96591f" stroke="none"/>
<path d="M32 46C33 33 42 24 54 21C45 27 39 36 38 47Z" fill="#f7d488" stroke="none"/>
<path d="M56 17L57.5 48Q60 51 62.5 48L64 17Z" fill="#e9b94f" stroke-width="1.5"/>
<path d="M30 45Q46 39 58 52M90 45Q74 39 62 52" fill="none" stroke="#f7d488" stroke-width="1.5"/>
<path d="M33 50Q46 47 56 57L57 72Q60 76 63 72L64 57Q74 47 87 50Q83 65 66 66L64.5 99L55.5 99L54 66Q37 65 33 50Z" fill="#120b09"/>
<g stroke="none"><ellipse cx="46" cy="57.5" rx="8" ry="5" fill="#ff3b1f" filter="url(#esG)"/><ellipse cx="74" cy="57.5" rx="8" ry="5" fill="#ff3b1f" filter="url(#esG)"/>
<path d="M39 54Q47 53 53 60Q45 62 39 54Z" fill="#ff5a2a"/><path d="M81 54Q73 53 67 60Q75 62 81 54Z" fill="#ff5a2a"/>
<path d="M43 55.5Q47 55.5 50.5 59Q46 59.5 43 55.5Z" fill="#ffe27a"/><path d="M77 55.5Q73 55.5 69.5 59Q74 59.5 77 55.5Z" fill="#ffe27a"/></g>
<path d="M70 30L76 36M73 29L77 33" fill="none" stroke-width="1" opacity=".7"/>
</g>
<!-- shield -->
<circle cx="40" cy="110" r="39" fill="#e0a945"/>
<circle cx="40" cy="110" r="32" fill="#c08232" stroke-width="1.6"/>
<path d="M6 99A36 36 0 0 1 30 75.5" fill="none" stroke="#fff0b8" stroke-width="1.8"/>
<path d="M40 82L23 121L32 121L40 101L48 121L57 121Z" fill="#c8281e" stroke-width="2.2"/>
</g>
<path d="M3 60A57 57 0 0 0 117 60" fill="none" stroke="#1b1512" stroke-width="2.6"/>`;
const leonidas = (): string => `<defs>
<radialGradient id="leV" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#a3241a"/><stop offset=".6" stop-color="#4a0f12"/><stop offset="1" stop-color="#17070a"/></radialGradient>
<clipPath id="leC"><path d="M-10 -10H130V60H-10Z"/><circle cx="60" cy="60" r="57"/></clipPath>
<clipPath id="leR"><circle cx="60" cy="60" r="56"/></clipPath>
<filter id="leG" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>
<circle cx="60" cy="60" r="57" fill="url(#leV)" stroke="#1b1512" stroke-width="2.6"/>
<path d="M60 60L139.8 54.4L139.8 65.6ZM60 60L136.9 82.1L133.1 92.5ZM60 60L124.7 107.0L117.5 115.6ZM60 60L104.7 126.3L95.1 131.9ZM60 60L79.4 137.6L68.4 139.6ZM60 60L51.6 139.6L40.6 137.6ZM60 60L24.9 131.9L15.3 126.3ZM60 60L2.5 115.6L-4.7 107.0ZM60 60L-13.1 92.5L-16.9 82.1ZM60 60L-19.8 65.6L-19.8 54.4ZM60 60L-16.9 37.9L-13.1 27.5ZM60 60L-4.7 13.0L2.5 4.4ZM60 60L15.3 -6.3L24.9 -11.9ZM60 60L40.6 -17.6L51.6 -19.6ZM60 60L68.4 -19.6L79.4 -17.6ZM60 60L95.1 -11.9L104.7 -6.3ZM60 60L117.5 4.4L124.7 13.0ZM60 60L133.1 27.5L136.9 37.9Z" fill="#f0b93c" opacity=".16" clip-path="url(#leR)"/>
<circle cx="60" cy="60" r="53.6" fill="none" stroke="#f0b93c" stroke-width="1.8"/>
<g clip-path="url(#leC)" stroke="#1b1512" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
<!-- transverse crest -->
<path d="M91.0 50.0L109.5 50.0L106.5 47.4L109.2 44.5L105.9 42.2L108.3 39.0L104.8 37.1L106.7 33.7L103.1 32.2L104.6 28.5L100.8 27.5L101.9 23.7L98.0 23.0L98.7 19.1L94.7 18.9L95.0 15.0L91.1 15.3L90.9 11.3L87.0 12.0L86.3 8.1L82.5 9.2L81.5 5.4L77.8 6.9L76.3 3.3L72.9 5.2L71.0 1.7L67.8 4.1L65.5 0.8L62.6 3.5L60.0 0.5L57.4 3.5L54.5 0.8L52.2 4.1L49.0 1.7L47.1 5.2L43.7 3.3L42.2 6.9L38.5 5.4L37.5 9.2L33.7 8.1L33.0 12.0L29.1 11.3L28.9 15.3L25.0 15.0L25.3 18.9L21.3 19.1L22.0 23.0L18.1 23.7L19.2 27.5L15.4 28.5L16.9 32.2L13.3 33.7L15.2 37.1L11.7 39.0L14.1 42.2L10.8 44.5L13.5 47.4L10.5 50.0L29.0 50.0A31 31 0 1 1 91.0 50.0Z" fill="#d42c20"/>
<path d="M99.3 45.6L105.7 44.8M97.3 37.0L103.4 34.8M93.4 29.0L98.9 25.5M87.9 22.1L92.5 17.5M81.0 16.6L84.5 11.1M73.0 12.7L75.2 6.6M64.4 10.7L65.2 4.3M55.6 10.7L54.8 4.3M47.0 12.7L44.8 6.6M39.0 16.6L35.5 11.1M32.1 22.1L27.5 17.5M26.6 29.0L21.1 25.5M22.7 37.0L16.6 34.8M20.7 45.6L14.3 44.8" fill="none" stroke="#7d1310" stroke-width="1.3"/>
<path d="M98.0 50.0A38 38 0 1 0 22.0 50.0" fill="none" stroke-width="1.2"/>
<path d="M95.2 49.4A35.2 35.2 0 1 0 24.8 49.4" fill="none" stroke="#f6f1e6" stroke-width="4.6" stroke-linecap="butt"/>
<path d="M95.2 49.4A35.2 35.2 0 1 0 24.8 49.4" fill="none" stroke="#1b1512" stroke-width="4.6" stroke-dasharray="3.2 3.2" stroke-linecap="butt"/>
<!-- cuirass -->
<path d="M8 122C10 100 26 86 46 82L74 82C94 86 110 100 112 122Z" fill="#cf9038"/>
<path d="M76 84C90 88 100 98 104 112" fill="none" stroke="#f7d488" stroke-width="1.8"/>
<path d="M70 96C78 96 86 100 90 108" fill="none" stroke-width="1.5"/>
<!-- cloak -->
<path d="M0 122C2 98 20 84 46 80C56 92 72 108 86 122Z" fill="#c8281e"/>
<path d="M46 80C56 92 72 108 86 122L76 122C63 109 50 96 39 83Z" fill="#f0b93c" stroke-width="1.5"/>
<path d="M47.5 87L51 84.5M53.5 93.5L57 91M60 100L63.5 97.5M66.5 106.5L70 104M73 113L76.500 110.500" fill="none" stroke-width="1.3"/>
<path d="M16 96C14 104 13 112 13 120M28 90C27 100 27 110 28 120" fill="none" stroke-width="1.4"/>
<!-- beard -->
<path d="M55 74L65 74L65 87L81 83C83 91 79 97 75 100Q72 104 68 104Q64 109 60 108Q56 109 52 104Q48 104 45 100C41 97 37 91 39 83L55 87Z" fill="#4a2c1c"/>
<path d="M50 92Q51 98 55 101M70 92Q69 98 65 101M60 90L60 102" fill="none" stroke="#8a5a34" stroke-width="1.5"/>
<!-- helmet -->
<path d="M60 20C81 20 92 33 92 50C92 64 88 77 81 86L66 90L60 87L54 90L39 86C32 77 28 64 28 50C28 33 39 20 60 20Z" fill="#f0b93c"/>
<path d="M60 20C81 20 92 33 92 50C92 64 88 77 81 86L74 88C82 76 85 63 84 50C83 35 74 24 60 20Z" fill="#b97a22" stroke="none"/>
<path d="M34 44C35 34 42 27 52 24C45 29 40 36 39 45Z" fill="#fff3c0" stroke="none"/>
<path d="M33.500 45Q47 40.500 58 51M86.500 45Q73 40.500 62 51" fill="none" stroke="#9a6218" stroke-width="1.6"/>
<path d="M60 21L60 46" fill="none" stroke="#9a6218" stroke-width="1.4"/>
<!-- ram-horn cheek pieces -->
<path d="M34 67Q42 62 48.500 67.500Q52.500 73 47.500 77Q42.500 79 41.500 74.500Q42 71 45.500 72.200" fill="none" stroke="#9a6218" stroke-width="1.7"/>
<path d="M86 67Q78 62 71.500 67.500Q67.500 73 72.500 77Q77.500 79 78.500 74.500Q78 71 74.500 72.200" fill="none" stroke="#9a6218" stroke-width="1.7"/>
<path d="M36 49Q47 46 56.5 55L57.5 68Q60 71.5 62.5 68L63.5 55Q73 46 84 49Q80.5 62 65.5 63L64.2 91L55.8 91L54.5 63Q39.5 62 36 49Z" fill="none" stroke="#1b1512" stroke-width="5.6"/>
<path d="M36 49Q47 46 56.5 55L57.5 68Q60 71.5 62.5 68L63.5 55Q73 46 84 49Q80.5 62 65.5 63L64.2 91L55.8 91L54.5 63Q39.5 62 36 49Z" fill="#120b09" stroke="#fff0b0" stroke-width="2.6"/>
<path d="M36 49Q47 46 56.5 55L57.5 68Q60 71.5 62.5 68L63.5 55Q73 46 84 49Q80.5 62 65.5 63L64.2 91L55.8 91L54.5 63Q39.5 62 36 49Z" fill="#120b09" stroke-width="1"/>

<g stroke="none"><ellipse cx="47.500" cy="55.500" rx="7" ry="4.500" fill="#ffb01f" filter="url(#leG)"/><ellipse cx="72.500" cy="55.500" rx="7" ry="4.500" fill="#ffb01f" filter="url(#leG)"/>
<path d="M41.500 52.500Q48 51.500 53.500 57.500Q46.500 59 41.500 52.500Z" fill="#ffd23a"/><path d="M78.500 52.500Q72 51.500 66.500 57.500Q73.500 59 78.500 52.500Z" fill="#ffd23a"/>
<path d="M45 54Q48.500 54 51.500 57Q47.500 57.500 45 54Z" fill="#fffbe0"/><path d="M75 54Q71.500 54 68.500 57Q72.500 57.500 75 54Z" fill="#fffbe0"/></g>
<!-- pin -->
<circle cx="37" cy="86" r="6" fill="#f0b93c" stroke-width="1.8"/><circle cx="37" cy="86" r="2.2" fill="#c8281e" stroke-width="1"/>
<!-- spear -->
<path d="M100 122L105.500 36" fill="none" stroke-width="6.2"/><path d="M100 122L105.500 36" fill="none" stroke="#8a5a2c" stroke-width="3"/>
<path d="M105.800 38C99 30 103 15 108.500 3C113 15 114 30 105.800 38Z" fill="#e6e0d4"/>
<path d="M106.300 35L108.300 7" fill="none" stroke-width="1.1"/>
<path d="M102.300 38L109.500 39" fill="none" stroke="#f0b93c" stroke-width="3"/>
</g>
<path d="M3 60A57 57 0 0 0 117 60" fill="none" stroke="#1b1512" stroke-width="2.6"/>`;
export const portrait = (r: Role, pack: Pack = 'culto', region: Region = 'mundo'): string => {
  if (pack === 'esparta') return svg(r === 'liberal' ? athenian() : r === 'lider' ? leonidas() : spartan(), 'art');   // D139
  if (pack === 'culto') return svg(r === 'liberal' ? investigator() : r === 'lider' ? priest() : cultist(), 'art');
  if (r === 'lider' && region !== 'mundo' && BOSSES[region]) return svg(leader(pack, region), 'art');
  if (r !== 'lider' && region !== 'mundo' && ANIMALS[region]) {
    const a = ANIMALS[region], s: Side = r === 'liberal' ? 'L' : pack === 'vermelho' ? 'C' : 'F';
    return svg(member(s, a[s]), 'art');
  }
  return svg(r === 'liberal' ? bird() : pack === 'vermelho' ? (r === 'lider' ? bear() : wolf()) : r === 'lider' ? cobra() : gator(), 'art');
};

/** The seal of a party on law cards and on the board: a symbol, not a character (the scales and the theme's mark). */
// D86: drawn, not emoji: the phone's emoji (a glossy skull, a coloured scale) clashed with the poster
const SEALS: Record<'L' | 'F' | 'C' | 'K' | 'E' | 'O' | 'A', string> = {
  // D139: Athens' decree carries the owl; Sparta's the lambda of its shields
  O: '<path d="M14 28c0-12 8-20 18-20s18 8 18 20v14c0 8-8 14-18 14S14 50 14 42z" fill="currentColor" stroke-width="2.5"/><circle cx="25" cy="27" r="6" fill="var(--halo)" stroke-width="2"/><circle cx="39" cy="27" r="6" fill="var(--halo)" stroke-width="2"/><circle cx="25" cy="28" r="2.5" fill="currentColor" stroke="none"/><circle cx="39" cy="28" r="2.5" fill="currentColor" stroke="none"/><path d="M29 36l3 5 3-5z" fill="var(--halo)" stroke-width="1.5"/><path d="M14 16l6 6M50 16l-6 6" stroke-width="3"/>',
  A: '<circle cx="32" cy="32" r="26" fill="currentColor" stroke-width="2.5"/><circle cx="32" cy="32" r="20" stroke="var(--halo)" stroke-width="2"/><path d="M20 46 32 16l12 30" stroke="var(--halo)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
  // D115: the cult's law is a page of the Necronomicon (an open book with an eye); the investigators' a relic, a piece of
  // the Spear of Longinus (a cracked spearhead)
  K: '<path d="M10 14c8-3 15-2 22 3v38c-7-5-14-6-22-3z" fill="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M54 14c-8-3-15-2-22 3v38c7-5 14-6 22-3z" fill="currentColor" stroke-width="2.5" stroke-linejoin="round"/><circle cx="21" cy="32" r="5" stroke="var(--halo)" stroke-width="2"/><circle cx="21" cy="32" r="1.8" fill="var(--halo)" stroke="none"/><path d="M38 24h10M38 30h10M38 36h7M38 42h9" stroke="var(--halo)" stroke-width="1.6"/>',
  E: '<path d="M32 4 42 26 36 31v19h-8V31l-6-5z" fill="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 17l-5 5 4 4-3 3" stroke="var(--halo)" stroke-width="2"/><path d="M23 50h18M26 56h12" stroke-width="3" stroke-linecap="round"/>',
  L: '<path d="M32 9v40M18 15h28" stroke-width="4"/><circle cx="32" cy="10" r="3.5" fill="currentColor" stroke="none"/><path d="M18 15 10 33M18 15l8 18M46 15l-8 18M46 15l8 18" stroke-width="2.2"/><path d="M8 33h20c0 6-4.5 9-10 9s-10-3-10-9zM36 33h20c0 6-4.5 9-10 9s-10-3-10-9z" fill="currentColor" stroke-width="2"/><path d="M22 55h20l-3-6H25z" fill="currentColor" stroke-width="2"/>',
  F: '<path class="sk" fill="currentColor" stroke-width="3" d="M38 8c11 0 19 6 21 16-8-3-14-3-21 0z"/><path d="M22 12h20v40H22z" fill="currentColor" stroke-width="2.5"/><path d="M27 12v40M32 12v40M37 12v40" stroke="var(--halo)" stroke-width="1.8"/><path class="sk" d="M19 20h26M19 44h26" stroke-width="7" stroke-linecap="round"/><path d="M19 20h26M19 44h26" stroke-width="4.5" stroke-linecap="round"/><path d="M29 6h6v6h-6z" fill="currentColor" stroke-width="2"/><path d="M26 52h12l3 7H23z" fill="currentColor" stroke-width="2"/>',
  C: '<path fill="currentColor" stroke-width="1.5" d="M15.4 41A21 21 0 1 1 52.6 41L48.4 35A14 14 0 1 0 24 34z"/><path d="M18 39 9 52" stroke-width="6" stroke-linecap="round"/><path class="sk" d="M51 53 23 25" stroke-width="6.5" stroke-linecap="round"/><path d="M51 53 23 25" stroke-width="5" stroke-linecap="round"/><g transform="rotate(-45 21 23)"><rect class="sk" x="9" y="18" width="24" height="10" fill="currentColor" stroke-width="2.5"/></g>'
};
const sealKey = (p: Law, pack: Pack): 'L' | 'F' | 'C' | 'K' | 'E' | 'O' | 'A' => pack === 'esparta' ? (p === 'L' ? 'O' : 'A') : pack === 'culto' ? (p === 'L' ? 'E' : 'K') : p === 'L' ? 'L' : pack === 'vermelho' ? 'C' : 'F';
export const seal = (p: Law, pack: Pack = 'culto'): string => `<svg class="glyph seal-${sealKey(p, pack)}" viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden="true">${SEALS[sealKey(p, pack)]}</svg>`;

/* D92: a face for each seat, flat and faceless (no eyes, no mouth: just the shape of a person), dressed the way people
 * dress where the names come from: coats, scarves and fur hats in Europe; bright patterned cloth, caps and head wraps in
 * Africa; ponchos, woven bands and wide hats in the Americas; high collars in Asia; flowered shirts and sun hats in
 * Oceania. Chosen by the name, always the same for a name, and never by the role. Drawn here: no outside art. */
/** D92: some of the expansion's names get the dress of their own country (fur hat and coat, keffiyeh and robe, a
 *  cleric's turban). */
// D100: who they are comes with the expansion's key (src/core/dlc.ts); Secret Cultist's names are none of them
export const RUSSIAN = new Set<string>(), ARAB = new Set<string>(), CLERIC = new Set<string>();
const FEMALE = new Set<string>(['Cleópatra', 'Thatcher', 'Merkel', 'Rainha Vitória', 'Rainha Elizabeth', 'Nefertiti', 'Indira Gandhi']);
const SKINS: Record<string, string[]> = {
  europa: ['#f3cfb0', '#ecc19c', '#e0ad86'], africa: ['#8a5634', '#6e4126', '#a8693f', '#5a3420'], americas: ['#c68a5d', '#d9a27a', '#a8693f', '#f0c8a6', '#7a4a2a'],
  asia: ['#ecc79f', '#e3b88b', '#c99566'], oceania: ['#e9be98', '#9c6440', '#c68a5d'], brasil: ['#f0c8a6', '#c68a5d', '#8a5634', '#a8693f'], mundo: ['#f0c8a6', '#c68a5d', '#8a5634', '#e3b88b']
};
const CLOTH: Record<string, string[]> = {
  europa: ['#3b4a63', '#5a3b2e', '#2f4f4f', '#6b2d2d'], africa: ['#d35400', '#1e8449', '#c0392b', '#7d3c98', '#d4ac0d'], americas: ['#a0522d', '#2e86ab', '#8e44ad', '#c0392b'],
  asia: ['#1f3a5f', '#8b1e3f', '#2d6a4f', '#3d3d3d'], oceania: ['#16a085', '#e67e22', '#2980b9', '#c0392b'], brasil: ['#f1c40f', '#27ae60', '#2980b9', '#e74c3c'], mundo: ['#2f6690', '#5a3b2e', '#6b4f8a', '#556b2f']
};
const HAIR = ['#1a1310', '#2a1d15', '#4a3020', '#7a5a3a', '#9a9a9a'];
const hashOf = (s: string): number => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/* D92: the famous ones get their own look: an outfit made of parts (the body, what goes behind the head, the hat or
 * hair, extras), still faceless. Historical figures in the dress of their time; modern leaders in what they wore. */
type Look = { skin?: string; body: string; back?: string; top: string; extra?: string[] };
const FK = 'stroke="#15110e" stroke-width="2.5" stroke-linejoin="round"';
const BODY: Record<string, string> = {
  suit: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#2c3440" ${FK}/><path d="M26 45l6 8 6-8" fill="#f2efe6" ${FK}/>`,
  suitblue: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#1f3a5f" ${FK}/><path d="M26 45l6 8 6-8" fill="#f2efe6" ${FK}/>`,
  military: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#4b5320" ${FK}/><path d="M32 46v18" stroke="#15110e" stroke-width="2"/><circle cx="35" cy="52" r="1.3" fill="#d4ac0d"/><circle cx="35" cy="58" r="1.3" fill="#d4ac0d"/>`,
  imperial: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#1f2f5f" ${FK}/><path d="M9 52c3-4 7-6 11-6l-1 5c-4 0-7 1-10 3zM55 52c-3-4-7-6-11-6l1 5c4 0 7 1 10 3z" fill="#d4ac0d" ${FK}/><path d="M26 44l6 6 6-6v4l-6 6-6-6z" fill="#f2efe6" ${FK}/>`,
  toga: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#f2efe6" ${FK}/><path d="M18 47c8 4 18 10 26 17h-8C30 58 24 53 16 50z" fill="#8b1e3f" ${FK}/>`,
  egypt: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#f2efe6" ${FK}/><path d="M14 50c5-5 11-7 18-7s13 2 18 7l-3 6c-4-3-9-5-15-5s-11 2-15 5z" fill="#d4ac0d" ${FK}/><path d="M17 52c4-3 9-4 15-4s11 1 15 4" fill="none" stroke="#1f6fb2" stroke-width="2.5"/>`,
  mongol: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#7a3b2e" ${FK}/><path d="M24 45l16 19" stroke="#d4ac0d" stroke-width="3"/>`,
  assyrian: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#8b1e3f" ${FK}/><path d="M10 58h44" stroke="#d4ac0d" stroke-width="3" stroke-dasharray="3 2"/>`,
  hanfu: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#2d4a6b" ${FK}/><path d="M24 45l12 19M40 45 30 58" stroke="#f2efe6" stroke-width="3"/>`,
  carthage: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#9a7b4f" ${FK}/><path d="M6 64c2-8 6-14 12-17l4 17zM58 64c-2-8-6-14-12-17l-4 17z" fill="#8b1e3f" ${FK}/>`,
  shawl: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#f2efe6" ${FK}/><path d="M12 54c8-6 22-8 34-2l4 12H8z" fill="#e8e1cf" ${FK}/>`,
  maosuit: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#5b6260" ${FK}/><path d="M26 43h12v5c-4 2-8 2-12 0zM32 48v16" fill="#5b6260" ${FK}/>`,
  fatigue: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#556b2f" ${FK}/><path d="M24 45l8 7 8-7" fill="#556b2f" ${FK}/>`,
  gown: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#2a2a3a" ${FK}/><path d="M24 46c5 3 11 3 16 0" fill="none" stroke="#f2efe6" stroke-width="2.5" stroke-dasharray="1.5 2.5"/>`,
  blazer: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#c0392b" ${FK}/><path d="M27 45l5 6 5-6" fill="#f2efe6" ${FK}/>`,
  regal: `<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="#5b2c6f" ${FK}/><path d="M12 56c6-4 13-6 20-6s14 2 20 6" fill="none" stroke="#f2efe6" stroke-width="4" stroke-dasharray="1 3"/><path d="M22 46l20 18" stroke="#1f6fb2" stroke-width="3"/>`
};
const TOP: Record<string, string> = {
  short: `<path d="M21 26c0-9 5-13 11-13s11 4 11 13c-3-4-6-6-11-6s-8 2-11 6z" fill="#2a1d15" ${FK}/>`,
  grey: `<path d="M21 26c0-9 5-13 11-13s11 4 11 13c-3-4-6-6-11-6s-8 2-11 6z" fill="#b8b8b8" ${FK}/>`,
  blond: `<path d="M20 25c0-9 6-14 12-14s13 3 13 12c-6-3-14-4-25 2z" fill="#e8c26a" ${FK}/>`,
  bald: `<path d="M21 24c1-5 5-9 11-9s10 4 11 9" fill="none" stroke="#15110e" stroke-width="1.5" opacity=".5"/>`,
  laurel: `<path d="M21 26c0-9 5-13 11-13s11 4 11 13c-3-4-6-6-11-6s-8 2-11 6z" fill="#3a2a1a" ${FK}/><path d="M19 22c4-5 9-7 13-7s9 2 13 7" fill="none" stroke="#3f8f3f" stroke-width="4" stroke-dasharray="3 1.5"/>`,
  bicorne: `<path d="M10 20c6-9 15-13 22-13s16 4 22 13c-6-2-14-3-22-3s-16 1-22 3z" fill="#15110e" ${FK}/><circle cx="32" cy="12" r="2.5" fill="#c0392b"/>`,
  nemes: `<path d="M18 22c0-10 6-15 14-15s14 5 14 15l4 22c-4 1-7 0-9-3l-1-14H24l-1 14c-2 3-5 4-9 3z" fill="#d4ac0d" ${FK}/><path d="M20 14h24M19 19h26M47 26l2 10M17 26l-2 10" stroke="#1f6fb2" stroke-width="2.5"/>`,
  egyptcrown: `<path d="M20 20 18 3h28l-2 17c-3-2-7-3-12-3s-9 1-12 3z" fill="#1f6fb2" ${FK}/><path d="M19 13h26" stroke="#d4ac0d" stroke-width="3"/>`,
  bob: `<path d="M18 28c0-11 7-16 14-16s14 5 14 16v12h-6V24H24v16h-6z" fill="#15110e" ${FK}/><path d="M20 18h24" stroke="#d4ac0d" stroke-width="3"/>`,
  helmet: `<path d="M19 24c0-9 6-14 13-14s13 5 13 14v4h-5v-6H24v6h-5z" fill="#b08d57" ${FK}/><path d="M24 10c2-6 14-6 16 0l-8 2z" fill="#c0392b" ${FK}/>`,
  mongol: `<path d="M17 22c2-3 8-5 15-5s13 2 15 5l-2 4c-3-2-8-3-13-3s-10 1-13 3z" fill="#8a7458" ${FK}/><path d="M22 18c0-7 4-12 10-14 6 2 10 7 10 14z" fill="#7a3b2e" ${FK}/>`,
  assyrian: `<path d="M21 21 23 5h18l2 16c-3-2-7-3-11-3s-8 1-11 3z" fill="#f2efe6" ${FK}/><path d="M22 12h20" stroke="#d4ac0d" stroke-width="2.5"/>`,
  scholar: `<path d="M21 26c0-9 5-13 11-13s11 4 11 13c-3-4-6-6-11-6s-8 2-11 6z" fill="#b8b8b8" ${FK}/><path d="M23 15V7h18v8z" fill="#15110e" ${FK}/><path d="M19 15h26" stroke="#15110e" stroke-width="3"/>`,
  crown: `<path d="M21 26c0-9 5-13 11-13s11 4 11 13c-3-4-6-6-11-6s-8 2-11 6z" fill="#b8b8b8" ${FK}/><path d="M23 15l-1-8 5 4 5-6 5 6 5-4-1 8z" fill="#d4ac0d" ${FK}/>`,
  tophat: `<path d="M23 15V1h18v14z" fill="#15110e" ${FK}/><path d="M17 16h30v3H17z" fill="#15110e" ${FK}/>`,
  tricorne: `<path d="M21 26c0-9 5-13 11-13s11 4 11 13" fill="#e8e1cf" ${FK}/><path d="M14 18c6-8 12-10 18-10s12 2 18 10l-7 2c-3-2-7-3-11-3s-8 1-11 3z" fill="#15110e" ${FK}/>`,
  homburg: `<path d="M22 18c0-7 4-10 10-10s10 3 10 10z" fill="#2c2c2c" ${FK}/><path d="M17 18h30v3H17z" fill="#2c2c2c" ${FK}/>`,
  peaked: `<path d="M19 18c0-6 6-9 13-9s13 3 13 9z" fill="#4b5320" ${FK}/><path d="M20 18h24v3H20z" fill="#4b5320" ${FK}/><path d="M22 21h20l-3 3H25z" fill="#15110e"/><circle cx="32" cy="14" r="2" fill="#d4ac0d"/>`,
  peakedblue: `<path d="M19 18c0-6 6-9 13-9s13 3 13 9z" fill="#1f2f5f" ${FK}/><path d="M20 18h24v3H20z" fill="#1f2f5f" ${FK}/><path d="M22 21h20l-3 3H25z" fill="#15110e"/><circle cx="32" cy="14" r="2" fill="#d4ac0d"/>`,
  beret: `<path d="M18 19c2-6 8-9 15-8s12 4 12 9c-8 1-18 1-27-1z" fill="#15110e" ${FK}/><path d="M30 13l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5z" fill="#d4ac0d"/>`,
  redberet: `<path d="M18 19c2-6 8-9 15-8s12 4 12 9c-8 1-18 1-27-1z" fill="#c0392b" ${FK}/>`,
  fatigue: `<path d="M20 20c0-7 5-10 12-10s12 3 12 10z" fill="#556b2f" ${FK}/><path d="M30 20h18l-2 3H30z" fill="#556b2f" ${FK}/>`,
  maocap: `<path d="M19 18c0-6 6-9 13-9s13 3 13 9z" fill="#5b6260" ${FK}/><path d="M20 18h24v3H20z" fill="#5b6260" ${FK}/><path d="M22 21h20l-3 3H25z" fill="#15110e"/><circle cx="32" cy="14" r="2" fill="#c0392b"/>`,
  sides: `<path d="M21 22c0-7 5-10 11-10s11 3 11 10c-4-2-7-3-11-3s-7 1-11 3z" fill="#15110e" ${FK}/>`,
  long: `<path d="M21 25c1-8 5-12 11-12s10 4 11 12c-5-1-9-4-11-7-2 3-6 6-11 7z" fill="#5a3a22" ${FK}/>`
};
const BACK: Record<string, string> = { longhair: `<path d="M17 28c0-12 8-17 15-17s15 5 15 17v16c-4 2-8 2-10 0H27c-2 2-6 2-10 0z" fill="#b8b8b8" ${FK}/>`, veil: `<path d="M16 26c0-12 8-17 16-17s16 5 16 17l2 22c-6 2-11 1-14-3l-1-15H27l-1 15c-3 4-8 5-14 3z" fill="#2a2a3a" ${FK}/>` };
const EXTRA: Record<string, string> = {
  glasses: '<circle cx="27" cy="28" r="3.2" fill="none" stroke="#15110e" stroke-width="1.8"/><circle cx="37" cy="28" r="3.2" fill="none" stroke="#15110e" stroke-width="1.8"/><path d="M30 28h4" stroke="#15110e" stroke-width="1.8"/>',
  beard: '<path d="M21 31c1 8 5 11 11 11s10-3 11-11c-3 3-7 4-11 4s-8-1-11-4z" fill="#2a1d15" stroke="#15110e" stroke-width="2"/>',
  greybeard: '<path d="M21 31c1 8 5 11 11 11s10-3 11-11c-3 3-7 4-11 4s-8-1-11-4z" fill="#b8b8b8" stroke="#15110e" stroke-width="2"/>',
  chinbeard: '<path d="M22 34c2 5 5 8 10 8s8-3 10-8" fill="none" stroke="#2a1d15" stroke-width="4"/>',
  longbeard: '<path d="M22 32c0 10 4 16 10 18 6-2 10-8 10-18-3 3-6 4-10 4s-7-1-10-4z" fill="#15110e" stroke="#15110e" stroke-width="2"/><path d="M26 38h12M27 43h10" stroke="#3a3a3a" stroke-width="1.5"/>',
  mustache: '<path d="M26 33c2-1 4-1 6 0 2-1 4-1 6 0" fill="none" stroke="#15110e" stroke-width="2.5"/>',
  tie: '<path d="M30 49h4l1 15h-6z" fill="#c0392b" stroke="#15110e" stroke-width="1.5"/>',
  bluetie: '<path d="M30 49h4l1 15h-6z" fill="#1f6fb2" stroke="#15110e" stroke-width="1.5"/>',
  bowtie: '<path d="M27 47l5 2 5-2v5l-5-2-5 2z" fill="#1f6fb2" stroke="#15110e" stroke-width="1.5"/>',
  pearls: '<path d="M24 47c5 3 11 3 16 0" fill="none" stroke="#f2efe6" stroke-width="3" stroke-dasharray="1 2"/>'
};
const LOOKS: Record<string, Look> = {};
/** D100: the expansion's faces and dress, from the data the key unlocks. */
export function dlcLooks(d: { looks: Record<string, unknown>; female: string[]; russian: string[]; arab: string[]; cleric: string[] }): void {
  Object.assign(LOOKS, d.looks as Record<string, Look>);
  d.female.forEach(n => FEMALE.add(n)); d.russian.forEach(n => RUSSIAN.add(n)); d.arab.forEach(n => ARAB.add(n)); d.cleric.forEach(n => CLERIC.add(n));
}
function famous(nameOf: string, skin0: string): string | null {
  const l = LOOKS[nameOf];
  if (!l) return null;
  const skin = l.skin || skin0;
  return `<svg class="face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#2b241f"/>${BODY[l.body] || BODY.suit}<path d="M27 40h10v7c-3 2-7 2-10 0z" fill="${skin}" stroke="#15110e" stroke-width="2"/>${l.back ? BACK[l.back] : ''}<ellipse cx="32" cy="28" rx="11" ry="13" fill="${skin}" ${FK}/>${(l.extra || []).filter(x => x.includes('beard') || x === 'mustache').map(x => EXTRA[x]).join('')}${TOP[l.top] || TOP.short}${(l.extra || []).filter(x => !(x.includes('beard') || x === 'mustache')).map(x => EXTRA[x]).join('')}</svg>`;
}
const faceCache = new Map<string, string>();
/** D92: drawn once per name, then taken from memory: the screen is repainted often. */
export function face(nameOf: string, region = 'mundo', me = false): string {
  const key = `${nameOf}|${region}|${me ? 1 : 0}`, hit = faceCache.get(key);
  if (hit) return hit;
  const out = drawFace(nameOf, region, me);
  faceCache.set(key, out);
  return out;
}
function drawFace(nameOf: string, region = 'mundo', me = false): string {
  const known = me ? null : famous(nameOf, '#e0ad86');
  if (known) return known;
  const h = hashOf(nameOf), pick = <T>(xs: T[], k: number): T => xs[(h >>> k) % xs.length];
  const reg0 = region === 'mundo' ? pick(['europa', 'africa', 'americas', 'asia', 'oceania'], 3) : region, fem = FEMALE.has(nameOf);
  const own = RUSSIAN.has(nameOf) ? 'russo' : ARAB.has(nameOf) ? 'arabe' : CLERIC.has(nameOf) ? 'clerigo' : '', reg = own === 'russo' ? 'europa' : own ? 'asia' : reg0;
  const skin = pick(SKINS[reg] || SKINS.mundo, 1), cloth = me ? '#5b5b5b' : pick(CLOTH[reg] || CLOTH.mundo, 5), hair = pick(HAIR, 9), alt = pick(CLOTH[reg] || CLOTH.mundo, 13);
  const id = `fp${h.toString(36)}`, S = 'stroke="#15110e" stroke-width="2.5" stroke-linejoin="round"';
  const v = own === 'russo' ? 0 : (h >>> 17) % 3, out: string[] = ['<circle cx="32" cy="32" r="31" fill="#2b241f"/>'];
  // the pattern of the cloth, by region
  const pat = reg === 'africa' ? `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${cloth}"/><path d="M0 8 4 2 8 8" fill="none" stroke="${alt}" stroke-width="2"/><circle cx="4" cy="1.5" r="1" fill="#f7e9c4"/></pattern>`
    : reg === 'americas' ? `<pattern id="${id}" width="64" height="7" patternUnits="userSpaceOnUse"><rect width="64" height="7" fill="${cloth}"/><rect y="3" width="64" height="2" fill="${alt}"/><path d="M0 3 2 1 4 3 6 1 8 3" stroke="#f7e9c4" stroke-width="1" fill="none"/></pattern>`
    : reg === 'oceania' ? `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${cloth}"/><circle cx="3" cy="3" r="2" fill="#f7e9c4"/><circle cx="8" cy="8" r="1.5" fill="${alt}"/></pattern>` : '';
  if (pat) out.push(`<defs>${pat}</defs>`);
  const fill = own === 'arabe' ? '#f2efe6' : own === 'clerigo' ? '#3a3a3a' : pat ? `url(#${id})` : cloth;
  if (own === 'arabe') out.push(`<defs><pattern id="${id}k" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#f2efe6"/><path d="M0 0h3v3H0zM3 3h3v3H3z" fill="#b8322a"/></pattern></defs>`);
  if (reg === 'americas' && v === 0 && !fem) out.push(`<path d="M4 64 16 44h32l12 20z" fill="${fill}" ${S}/>`);   // a poncho
  else out.push(`<path d="M6 64c1-14 11-20 26-20s25 6 26 20z" fill="${fill}" ${S}/>`);
  out.push(`<path d="M27 40h10v7c-3 2-7 2-10 0z" fill="${skin}" stroke="#15110e" stroke-width="2"/>`);
  // collars
  if (reg === 'europa') out.push(v === 1 ? `<path d="M22 44c6 5 14 5 20 0l1 5c-7 5-15 5-22 0z" fill="${alt}" ${S}/>` : `<path d="M14 50c6-5 12-6 18-6s12 1 18 6l-4 4c-4-3-9-4-14-4s-10 1-14 4z" fill="#d8c4a0" ${S}/>`);
  if (reg === 'asia' && !own) out.push(`<path d="M25 42h14v5c-4 2-10 2-14 0z" fill="${cloth}" ${S}/><path d="M32 47v17" stroke="#15110e" stroke-width="2"/>`);
  if (own === 'arabe' || own === 'clerigo') out.push(`<path d="M28 46l4 6 4-6" fill="none" stroke="#15110e" stroke-width="2"/>`);
  if (own === 'clerigo') out.push(`<path d="M14 64c2-10 6-16 10-19l8 19zM50 64c-2-10-6-16-10-19l-8 19z" fill="#2a2420" ${S}/>`);
  if (reg === 'africa' && v !== 0) out.push(`<path d="M23 45c5 4 13 4 18 0" fill="none" stroke="#f1c40f" stroke-width="3"/><path d="M23 45c5 4 13 4 18 0" fill="none" stroke="#15110e" stroke-width="1" stroke-dasharray="2 2"/>`);
  if (reg === 'brasil' || reg === 'mundo') out.push(`<path d="M26 45l6 7 6-7" fill="none" stroke="#15110e" stroke-width="2"/>`);
  // long hair goes behind the head
  if (fem && !(reg === 'africa' && v !== 2)) out.push(`<path d="M17 28c0-12 8-17 15-17s15 5 15 17v16c-4 2-8 2-10 0H27c-2 2-6 2-10 0z" fill="${hair}" ${S}/>`);
  if (own === 'arabe') out.push(`<path d="M17 22c0-9 7-14 15-14s15 5 15 14l3 24c-5 2-9 1-12-2V30H26v14c-3 3-7 4-12 2z" fill="url(#${id}k)" ${S}/>`);
  out.push(`<ellipse cx="32" cy="28" rx="11" ry="13" fill="${skin}" ${S}/>`);
  // hair and hats
  const short = `<path d="M21 26c0-9 5-13 11-13s11 4 11 13c-3-4-6-6-11-6s-8 2-11 6z" fill="${hair}" ${S}/>`;
  const fringe = `<path d="M21 25c1-8 5-12 11-12s10 4 11 12c-5-1-9-4-11-7-2 3-6 6-11 7z" fill="${hair}" ${S}/>`;
  if (own === 'arabe') out.push(`<path d="M19 21c0-8 6-12 13-12s13 4 13 12c-4-2-9-3-13-3s-9 1-13 3z" fill="url(#${id}k)" ${S}/><path d="M19 15c4-2 22-2 26 0" fill="none" stroke="#15110e" stroke-width="3.5"/>`);
  else if (own === 'clerigo') out.push(`<path d="M18 20c0-9 6-14 14-14s14 5 14 14c-4-3-9-4-14-4s-10 1-14 4z" fill="#15110e" ${S}/><path d="M20 15c6-3 18-3 24 0" fill="none" stroke="#3a3a3a" stroke-width="1.5"/>`);
  else if (reg === 'europa') out.push(own === 'russo' ? `<path d="M14 23c0-11 8-17 18-17s18 6 18 17v10c0 3-6 3-6 0v-9c-3-2-7-3-12-3s-9 1-12 3v9c0 3-6 3-6 0z" fill="#8a7458" ${S}/><path d="M21 13c2-4 6-6 11-6s9 2 11 6c-3-1-7-2-11-2s-8 1-11 2z" fill="#4a3a2a" stroke="#15110e" stroke-width="1.5"/><circle cx="32" cy="9" r="1.8" fill="#c0392b"/>` : v === 0 && !fem ? `<path d="M22 19c0-7 4-10 10-10s10 3 10 10z" fill="#222" ${S}/><path d="M17 19h30v3H17z" fill="#222" ${S}/>` : fem ? fringe : v === 1 ? `<path d="M20 20c2-6 7-8 13-8s10 2 11 6c-6 2-15 3-24 2z" fill="${alt}" ${S}/><circle cx="33" cy="11" r="1.6" fill="#15110e"/>` : short);
  else if (reg === 'africa') out.push(fem ? `<path d="M18 22c0-9 6-14 14-14s14 5 14 14c-2 0-3-2-5-2-3 2-15 2-18 0-2 0-3 2-5 2z" fill="${fill}" ${S}/><path d="M38 9c5-1 9 2 9 6-3-1-6-1-9 0z" fill="${alt}" ${S}/>` : v === 0 ? short : `<path d="M21 20c0-6 5-8 11-8s11 2 11 8z" fill="${fill}" ${S}/>`);
  else if (reg === 'americas') out.push(v === 1 ? `<path d="M14 21h36v3H14z" fill="#8b5a2b" ${S}/><path d="M22 21c0-7 4-10 10-10s10 3 10 10z" fill="#8b5a2b" ${S}/>` : `${fem ? fringe : short}<path d="M20 22h24v4H20z" fill="url(#${id})" ${S}/>`);
  else if (reg === 'asia') out.push(fem ? `${fringe}<circle cx="32" cy="12" r="4.5" fill="${hair}" ${S}/><path d="M26 10 40 13" stroke="#c0392b" stroke-width="2"/>` : v === 2 ? `<path d="M20 21c0-7 5-10 12-10s12 3 12 10z" fill="#3d3d3d" ${S}/><path d="M18 21h28v3H18z" fill="#3d3d3d" ${S}/>` : short);
  else if (reg === 'oceania') out.push(v !== 2 ? `<path d="M15 23c3-2 8-3 17-3s14 1 17 3l-2 3c-4-1-9-2-15-2s-11 1-15 2z" fill="#d8b66a" ${S}/><path d="M22 21c0-7 4-10 10-10s10 3 10 10z" fill="#d8b66a" ${S}/>` : fem ? fringe : short);
  else out.push(fem ? fringe : v === 0 ? `<path d="M20 22c0-8 5-11 12-11s12 3 12 11z" fill="${alt}" ${S}/><path d="M30 22h20l-2 3H30z" fill="${alt}" ${S}/>` : short);
  return `<svg class="face" viewBox="0 0 64 64" aria-hidden="true">${out.join('')}</svg>`;
}

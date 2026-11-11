/* The words of each theme (D12). The rules and the data are the same in all: inside, the hidden side is always 'F',
   its members 'cultista' and its leader 'lider'. Only what is shown changes. */
import type { Pack, Region } from './types';

export interface Words {
  /** The hidden side, as an adjective and a plural ("lei vermelho", "os vermelhos"), and with a capital. */
  f: string; fs: string; F: string;
  /** Its leader: the role that wins when elected chancellor late in the game and loses when eliminated. */
  boss: string;
  /** The two votes. */
  ja: string; nein: string;
  /** The short name of each side, for small buttons: the liberals, and the hidden side. */
  libs: string; short: string;
  /** The name of the theme. */
  theme: string;
  /** D102: the name on a law card of the majority ("Liberal" when the theme says nothing). */
  law?: string;
  /** D115: the name on a law card of the hidden side (the hidden side's name when the theme says nothing). */
  lawF?: string;
}
export const PACKS: Pack[] = ['classico', 'vermelho', 'culto', 'esparta'];
export const WORDS: Record<Pack, Words> = {
  // D96: Secret Cultist: investigators against a cult, led in secret by its High Priest; the votes in the tongue of the book
  // D139: Secret Leônidas, the public face: Athens against the Spartans hidden in its Assembly, led in secret by Leônidas;
  // the votes in Greek
  esparta: { f: 'espartano', fs: 'espartanos', F: 'Espartano', boss: 'Leônidas', ja: 'Naí!', nein: 'Oú!', libs: 'Aten', short: 'Espa', theme: 'Atenienses x Espartanos', law: 'Decreto de Atenas', lawF: 'Decreto de Esparta' },
  culto: { f: 'cultista', fs: 'cultistas', F: 'Cultista', boss: 'Sumo Sacerdote', ja: 'Aye!', nein: 'Nay!', libs: 'Invs', short: 'Cult', theme: 'Investigadores x Cultistas', law: 'Relíquia', lawF: 'Página' }
} as Record<Pack, Words>;
// D100: the words of the expansion's themes are not in the source: they arrive with the key (src/core/dlc.ts); until
// then those themes speak like Secret Cultist
WORDS.classico = WORDS.culto; WORDS.vermelho = WORDS.culto;
/** The votes in the tongue of each continent (D29): the Americas vote in Spanish, Brazil in Portuguese, Asia in
 *  Japanese (Chinese in the red theme), Africa in Swahili, Oceania in English; the world and Europe keep the theme's. */
export const VOTES: Partial<Record<Region, Partial<Record<Pack, [string, string]>>>> = {
  americas: { classico: ['¡Sí!', '¡No!'], vermelho: ['¡Sí!', '¡No!'], culto: ['¡Sí!', '¡No!'] },
  brasil: { classico: ['Sim!', 'Não!'], vermelho: ['Sim!', 'Não!'], culto: ['Sim!', 'Não!'] },
  asia: { classico: ['Hai!', 'Iie!'], vermelho: ['Shì!', 'Bù!'], culto: ['Hai!', 'Iie!'] },
  africa: { classico: ['Ndiyo!', 'Hapana!'], vermelho: ['Ndiyo!', 'Hapana!'], culto: ['Ndiyo!', 'Hapana!'] },
  oceania: { classico: ['Yes!', 'No!'], vermelho: ['Yes!', 'No!'], culto: ['Yes!', 'No!'] }
};
/** D139: Secret Leônidas votes in Greek, on every continent. */
export const GREEK_VOTES: [string, string] = ['Naí!', 'Oú!'];
/** D128: Secret Cultist votes in Latin, on every continent: the tongue of the rites. */
export const CULT_VOTES: [string, string] = ['Ita!', 'Non!'];
/** The words of a theme, with the votes of the continent; without one, Secret Cultist's (D100). */
export const words = (pack?: Pack, region?: Region): Words => {
  const p: Pack = pack && PACKS.includes(pack) ? pack : 'culto', v = p === 'culto' ? CULT_VOTES : p === 'esparta' ? GREEK_VOTES : region ? VOTES[region]?.[p] : undefined;
  return { law: 'Liberal', lawF: WORDS[p].F, ...WORDS[p], ...(v ? { ja: v[0], nein: v[1] } : {}) };
};
/* D102: Secret Cultist speaks of investigators, not liberals: the rules and the core keep 'liberal' inside, and what is
   shown in the cult theme is turned by this, the laws being relics and pages of the Necronomicon (D115). */
const N = '(\\d+|uma|um|duas|dois|três|nenhuma)';
const plural = (n: string, one: string, many: string): string => (n === '1' || n === 'uma' || n === 'um' ? one : many);
const CULT_SPEAK: [RegExp, string | ((...m: string[]) => string)][] = [
  // D115: the laws are relics (pieces of the Spear of Longinus) and pages of the Necronomicon
  [/\b([Ll])eis liberais\b/g, (_, l) => `${l === 'L' ? 'R' : 'r'}elíquias`], [/\b([Ll])ei liberal\b/g, (_, l) => `${l === 'L' ? 'R' : 'r'}elíquia`],
  [/\b([Ll])eis cultistas\b/g, (_, l) => `${l === 'L' ? 'P' : 'p'}áginas do Necronomicon`], [/\b([Ll])ei cultista\b/g, (_, l) => `${l === 'L' ? 'P' : 'p'}ágina do Necronomicon`],
  [new RegExp(`\\b${N} libera(?:is|l)\\b`, 'g'), (_, n) => `${n} ${plural(n, 'relíquia', 'relíquias')}`],
  [new RegExp(`\\b(tirou|recebeu|passou|tirei|recebi|passei|com|e|restam|sobram) ${N} cultistas?\\b`, 'g'), (_, w, n) => `${w} ${n} ${plural(n, 'página', 'páginas')}`],
  [/\bliberais\b/g, 'investigadores'], [/\bLiberais\b/g, 'Investigadores'], [/\bLIBERAIS\b/g, 'INVESTIGADORES'],
  [/\bliberal\b/g, 'investigador'], [/\bLiberal\b/g, 'Investigador'], [/\bLIBERAL\b/g, 'INVESTIGADOR']
];
/** A text as Secret Cultist says it (D102, D115). */
export const cultSpeak = (s: string): string => CULT_SPEAK.reduce((t, [re, to]) => t.replace(re, to as (...m: string[]) => string), s);

/* D139: Secret Leônidas speaks of Athenians and Spartans, of decrees, archons and strategoi. */
const GREEK_SPEAK: [RegExp, string | ((...m: string[]) => string)][] = [
  [/\b([Ll])eis liberais\b/g, (_, l) => `${l === 'L' ? 'D' : 'd'}ecretos de Atenas`], [/\b([Ll])ei liberal\b/g, (_, l) => `${l === 'L' ? 'D' : 'd'}ecreto de Atenas`],
  [/\b([Ll])eis espartanos\b/g, (_, l) => `${l === 'L' ? 'D' : 'd'}ecretos de Esparta`], [/\b([Ll])ei espartano\b/g, (_, l) => `${l === 'L' ? 'D' : 'd'}ecreto de Esparta`],
  [new RegExp(`\\b${N} libera(?:is|l)\\b`, 'g'), (_, n) => `${n} ${plural(n, 'decreto de Atenas', 'decretos de Atenas')}`],
  [new RegExp(`\\b(tirou|recebeu|passou|tirei|recebi|passei|com|e|restam|sobram) ${N} espartanos?\\b`, 'g'), (_, w, n) => `${w} ${n} ${plural(n, 'decreto de Esparta', 'decretos de Esparta')}`],
  [/\bliberais\b/g, 'atenienses'], [/\bLiberais\b/g, 'Atenienses'], [/\bLIBERAIS\b/g, 'ATENIENSES'],
  [/\bliberal\b/g, 'ateniense'], [/\bLiberal\b/g, 'Ateniense'], [/\bLIBERAL\b/g, 'ATENIENSE'],
  [/\bpresidentes\b/g, 'arcontes'], [/\bPresidentes\b/g, 'Arcontes'], [/\bpresidente\b/g, 'arconte'], [/\bPresidente\b/g, 'Arconte'], [/\bPRESIDENTE\b/g, 'ARCONTE'],
  [/\bchanceleres\b/g, 'estrategos'], [/\bChanceleres\b/g, 'Estrategos'], [/\bchanceler\b/g, 'estratego'], [/\bChanceler\b/g, 'Estratego'], [/\bCHANCELER\b/g, 'ESTRATEGO'],
  [/\bEliminação\b/g, 'Ostracismo'], [/\beliminação\b/g, 'ostracismo'], [/\beliminações\b/g, 'ostracismos'],   // D148: in Athens, one is sent away by ostracism
  [/\b([Ee])limin(ar|ado|ada|ados|adas|ou|am|a|e)(?![\wçãõáéíóú])/g, (_, e, x) => `${e === 'E' ? 'O' : 'o'}straciz${x}`],
  [/\bpresidência\b/g, 'arcontado'], [/\bPresidência\b/g, 'Arcontado'], [/\bPres\./g, 'Arc.'], [/\bChanc\./g, 'Estr.']
];
/** A text in the words of a theme (D102, D139): Secret Cultist's, Secret Leônidas's, or as it is. */
export const speakAs = (pack: string | undefined, s: string): string => {
  const list = pack === 'culto' ? CULT_SPEAK : pack === 'esparta' ? GREEK_SPEAK : null;
  return list ? list.reduce((t, [re, to]) => t.replace(re, to as (...m: string[]) => string), s) : s;
};

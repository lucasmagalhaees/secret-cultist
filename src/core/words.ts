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
}
export const PACKS: Pack[] = ['classico', 'vermelho', 'culto'];
export const WORDS: Record<Pack, Words> = {
  // D96: Secret Cultist: investigators against a cult, led in secret by its High Priest; the votes in the tongue of the book
  culto: { f: 'cultista', fs: 'cultistas', F: 'Cultista', boss: 'Sumo Sacerdote', ja: 'Aye!', nein: 'Nay!', libs: 'Invs', short: 'Cult', theme: 'Investigadores x Cultistas', law: 'Sinal' }
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
/** The words of a theme, with the votes of the continent; without one, Secret Cultist's (D100). */
export const words = (pack?: Pack, region?: Region): Words => {
  const p: Pack = pack && PACKS.includes(pack) ? pack : 'culto', v = region ? VOTES[region]?.[p] : undefined;
  return { law: 'Liberal', ...WORDS[p], ...(v ? { ja: v[0], nein: v[1] } : {}) };
};
/* D102: Secret Cultist speaks of investigators, not liberals: the rules and the core keep 'liberal' inside, and what is
   shown in the cult theme is turned by this, the laws of the investigators being "do Sinal" (the Elder Sign on them). */
const CULT_SPEAK: [RegExp, string][] = [
  [/\b(leis?) liberais\b/g, '$1 do Sinal'], [/\b(leis?) liberal\b/g, '$1 do Sinal'], [/\b(Leis?) liberais\b/g, '$1 do Sinal'], [/\b(Leis?) liberal\b/g, '$1 do Sinal'],
  [/\b(\d+|uma|duas|três|uma lei|nenhuma) liberais\b/g, '$1 do Sinal'], [/\b(\d+|uma|duas|três|nenhuma) liberal\b/g, '$1 do Sinal'],
  [/\bliberais\b/g, 'investigadores'], [/\bLiberais\b/g, 'Investigadores'], [/\bLIBERAIS\b/g, 'INVESTIGADORES'],
  [/\bliberal\b/g, 'investigador'], [/\bLiberal\b/g, 'Investigador'], [/\bLIBERAL\b/g, 'INVESTIGADOR']
];
/** A text as Secret Cultist says it (D102). */
export const cultSpeak = (s: string): string => CULT_SPEAK.reduce((t, [re, to]) => t.replace(re, to), s);

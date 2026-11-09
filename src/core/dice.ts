/* D94: the dice of Call of Cthulhu. A percentile roll (d100) against a skill of the character sheet: the lower the
   better. 01 is a critical; at or under a fifth of the skill, an extreme success; under half, a hard one; under the
   skill, a success; over it, a failure; 100 (or 96 and up for a skill under 50) a fumble. The game's rules stay as in
   the original: only what is said (an argument in the debate, a reason to turn a vote) is rolled. */
import type { Game, RollLevel, Sheet } from './types';
import { ITEMS, itemHelps, itemOf, statesOf, poisonedRounds } from './items';
import { actOf, godIdOf } from './story';
import { CULT_WON, CULT_WON_CTHULHU, horrorOf, mythosOf, MYTHOS_SEES, NPC_SAN, PASTS, RARE_SKILLS, type Rare } from './horror';

export type { RollLevel };
export interface Roll { skill: string; label: string; val: number; base?: number; hard?: boolean; d: number; level: RollLevel; shaken?: boolean; mod?: 1 | -1; tens?: number[]; luck?: number; helped?: string; gear?: string; past?: boolean }
/** The skills the game rolls, by their name on the sheet, with the name shown at the table. */
export const SKILLS: Record<string, string> = {
  Persuade: 'Persuasão', 'Fast Talk': 'Lábia', Charm: 'Charme', Psychology: 'Psicologia', Intimidate: 'Intimidação',
  'Firearms Handgun': 'Armas de fogo', 'Fighting Brawl': 'Briga', 'Spot Hidden': 'Encontrar', Listen: 'Escutar', Occult: 'Ocultismo',
  'Sleight of Hand': 'Prestidigitação', 'Drive Auto': 'Dirigir', Swim: 'Nadar', Climb: 'Escalar', Dodge: 'Esquiva', 'First Aid': 'Primeiros socorros', Medicine: 'Medicina', 'Library Use': 'Biblioteca', Stealth: 'Furtividade'
};
/* D114: the characteristic behind each skill: at SUPPORT_AT or more it gives the roll a bonus die. */
export const SUPPORT: Record<string, string> = {
  Persuade: 'Education', 'Fast Talk': 'Intelligence', Charm: 'Appearance', Psychology: 'Intelligence', Intimidate: 'Strength',
  'Firearms Handgun': 'Dexterity', 'Fighting Brawl': 'Strength', 'Spot Hidden': 'Intelligence', Listen: 'Power', Occult: 'Education'
};
export const SUPPORT_AT = 70;
/** D114: the names of the characteristics at the table. */
export const CHAR_NAME: Record<string, string> = { Strength: 'Força', Constitution: 'Constituição', Size: 'Tamanho', Dexterity: 'Destreza', Appearance: 'Aparência', Intelligence: 'Inteligência', Power: 'Poder', Education: 'Educação', Luck: 'Sorte' };
/** D109: what each skill of the sheet is rolled for in the game, for the player's own sheet. */
export const SKILL_USE: Record<string, string> = {
  Persuade: 'As provas no debate e o motivo para virar o voto de uma IA',
  'Fast Talk': 'Contra-atacar, cobrar prova e virar o jogo no debate',
  Charm: 'Abonar alguém e chamar a mesa para o seu lado',
  Psychology: 'Ler se quem diz à mesa o que recebeu ou investigou está mentindo',
  Intimidate: 'Convencer a mesa do seu motivo ao eliminar alguém',
  'Firearms Handgun': 'Eliminar alguém com um tiro limpo (a mais alta entre esta e Briga)',
  'Fighting Brawl': 'Eliminar alguém no corpo a corpo, com Destreza e Constituição contra as dele',
  'Spot Hidden': 'Ao contar o que investigou: um detalhe que deixa a sua história mais crível',
  Listen: 'Ouvir a hesitação de quem fala à mesa: ajuda a sua Psicologia',
  Occult: 'Sentir algo errado num chanceler na zona de perigo (só uma pista, e só se passar); resistir a sussurros',
  'Sleight of Hand': 'Roubar o item de alguém, uma vez por partida (contra o Encontrar dele)',
  'Drive Auto': 'Armadilha: perseguição na estrada', Swim: 'Armadilha: porão alagado', Climb: 'Armadilhas: porão alagado e desabamento',
  Dodge: 'Armadilha: desabamento na cripta', 'First Aid': 'Armadilha: ferido no ritual (cuida pela mesa toda)', Medicine: 'Armadilha: ferido no ritual (cuida pela mesa toda)',
  'Library Use': 'Armadilha: sussurros na biblioteca', Stealth: 'Armadilha: cão de Tindalos'
};
/** What each level does to the strength of what was said. */
export const ROLL_BONUS: Record<RollLevel, number> = { crit: 0.3, extreme: 0.2, hard: 0.1, ok: 0.05, fail: -0.1, fumble: -0.25 };
export const ROLL_NAME: Record<RollLevel, string> = { crit: 'Crítico!', extreme: 'Sucesso extremo', hard: 'Sucesso difícil', ok: 'Sucesso', fail: 'Falha', fumble: 'Desastre!' };
export function levelOf(d: number, val: number): RollLevel {
  if (d === 1) return 'crit';
  if (d === 100 || (val < 50 && d >= 96)) return 'fumble';
  return d <= Math.floor(val / 5) ? 'extreme' : d <= Math.floor(val / 2) ? 'hard' : d <= val ? 'ok' : 'fail';
}
/** D95: the sheet of a seat, when the API sent one; without it (the API is down, or the breaker is open) nothing is
 *  rolled and the game plays as before the sheets. */
export const sheetOf = (g: Game, i: number): Sheet | undefined => (g.pack === 'culto' ? g.sheets?.[i] : undefined);   // D99: dice only in Secret Cultist
/* D101: sanity (SAN), the mark of Call of Cthulhu. Each seat starts at its sheet's Sanity and loses it to what the whole
   table sees: SAN_LOSS.exec for every elimination, SAN_LOSS.lawF for every law of the cult. Under SAN_LOW the seat is
   shaken: its skills roll with a penalty die (D113; SHAKEN was the old cut, kept for the record). Worked out from the record, so nothing more is kept. */
export const SAN_LOSS = { exec: 8, lawF: 3, ugly: 4 };
export const SAN_LOW = 35;
export const SHAKEN = 0.75;
/** The sanity of a seat now, or undefined without a sheet. */
export function sanity(g: Game, i: number): number | undefined {
  const sh = sheetOf(g, i);
  if (!sh) return undefined;
  const execs = g.hist.filter(e => e.k === 'exec').length, lawsF = g.hist.filter(e => e.k === 'gov' && e.law === 'F').length;
  const ugly = g.hist.filter(e => e.k === 'exec' && e.atk && (e.atk.level === 'fail' || e.atk.level === 'fumble')).length;   // D114: an ugly kill costs more
  const traps = g.hist.reduce((n, e) => n + (e.k === 'trap' ? e.rolls.filter(x => x.seat === i).reduce((a, x) => a + x.loss, 0) : 0), 0);   // D115
  const book = rollsBy(g, i).filter(r => r.gear === 'livro').length * (ITEMS.livro.cost ?? 0);   // D115: the forbidden book costs its reader
  const dreams = godIdOf(g) === 'cthulhu' && g.players[i].role === 'liberal' ? 2 * (actOf(g) - 1) : 0;   // D118: Cthulhu's dreams
  const poison = poisonedRounds(g, i);   // D119: each round poisoned costs 1
  const read = mythosOf(g, i) / 3;   // D120: each page read costs its readers 1 more
  const help = (g.hist.some(e => e.k === 'npc') ? NPC_SAN : 0) + (g.players[i].role === 'liberal' ? FAITH_SAN * g.hist.filter(e => e.k === 'faith' && e.kind === 'reza').length : 0);   // D126: faith   // D120: the scene's character gives some back
  // D121: in a campaign, the person carries what they lost; when the cult won the chapter before, everyone starts worse
  const c = g.campaign, person = !g.players[i].ai && g.players.filter(p => !p.ai).length === 1;
  const carried = c ? (person ? c.lost ?? 0 : 0) + (c.prev === 'F' ? (godIdOf(g) === 'cthulhu' ? CULT_WON_CTHULHU : CULT_WON) : 0) : 0;
  const lost = carried + poison + dreams + (SAN_LOSS.exec + (godIdOf(g) === 'ereshkigal' ? 4 : 0)) * execs + (SAN_LOSS.lawF + (godIdOf(g) === 'moloque' ? 2 : 0)) * lawsF + SAN_LOSS.ugly * ugly * (godIdOf(g) === 'cthugha' ? 2 : 1) + traps + book + read;
  return Math.max(0, Math.min(99 - mythosOf(g, i), Math.round((sh.vals.Sanity ?? 50) + help - lost * horrorOf(g).loss)));   // D120: Mythos lowers the most sanity one can have; the horror's weight
}
/* D126: what the investigators have against the gods. A doctor or a nurse by profession never rolls worse hurt or
   poisoned; and once a game each investigator chooses faith (FAITH_SAN back to every investigator) or reason (a bonus
   die in Occult and Power for the rest of the game). */
export const HEALERS = ['Medicine', 'First Aid'], FAITH_SAN = 5;
export const canFaith = (g: Game, i: number): boolean => g.pack === 'culto' && g.phase !== 'over' && !!g.players[i]?.alive && g.players[i].role === 'liberal' && !!sheetOf(g, i) && !g.hist.some(e => e.k === 'faith' && e.by === i);
export function faith(g: Game, i: number, kind: 'reza' | 'estudo'): Game {
  if (!canFaith(g, i)) return g;
  return { ...g, hist: [...g.hist, { k: 'faith', by: i, kind }], log: [...g.log, kind === 'reza' ? `🙏 ${g.players[i].name} rezou pela mesa: os investigadores recuperam ${FAITH_SAN} de sanidade.` : `📚 ${g.players[i].name} estudou o inimigo: dado de bônus em Ocultismo e Poder até o fim.`] };
}
/** D126: from Act II, each investigator of the app chooses: faith when shaken, reason otherwise. */
export function aiFaith(g: Game): Game {
  if (actOf(g) < 2) return g;
  return g.players.reduce((n, p, i) => (p.ai && canFaith(n, i) ? faith(n, i, (sanity(n, i) ?? 99) < 45 ? 'reza' : 'estudo') : n), g);
}
/** Roll a skill of a seat's sheet (D101: at a lower value when the seat is shaken; D109: with a bonus or penalty die). */
export const STRONG_ARG = 0.45;
/** D113: an argument this weak or weaker is a hard test (half the value), and one made while shaken rolls a penalty die. */
export const WEAK_ARG = 0.2;
/* D111: the skills of a fresh investigator are low (often 10 to 30), and a talk at the table is not a hard test: every
   roll gets EASE more, up to EASE_CAP (a 96 or more always fails). */
export const EASE = 20, EASE_CAP = 95;
export function roll(g: Game, i: number, skill: string, rand: () => number, mod: 0 | 1 | -1 = 0, hard = false): Roll | undefined {
  const sh = sheetOf(g, i);
  if (!sh) return undefined;
  const god = godIdOf(g), priest = g.players[i].role === 'lider', low = god === 'hastur' && g.players[i].role === 'liberal' ? 45 : SAN_LOW;   // D118: the Yellow Sign
  const san = sanity(g, i) ?? 99, shaken = san < low, base = sh.vals[skill] ?? 25, val = Math.min(EASE_CAP, base + horrorOf(g).ease);   // D111: the table's ease (D120: by the horror's weight)
  // D114: a strong characteristic behind the skill helps (a bonus die)
  const helper = SUPPORT[skill], helped = helper && (sh.vals[helper] ?? 0) >= SUPPORT_AT && mod === 0 ? helper : undefined;
  if (helped) mod = 1;
  // D120: the past (the first roll of the seat's best skill), a rare find made for the skill, Mythos for the Occult
  const pastSkill = Object.keys(PASTS).reduce((a, k) => ((sh.vals[k] ?? 0) > (sh.vals[a] ?? 0) ? k : a), Object.keys(PASTS)[0]);
  const inv = g.players[i].role === 'liberal';   // D126: an investigator's profession: a bonus die on its best skill every time
  const past = skill === pastSkill && (inv || !rollsBy(g, i).some(r => r.skill === skill));
  const studied = inv && (skill === 'Occult' || skill === 'Power') && g.hist.some(e => e.k === 'faith' && e.by === i && e.kind === 'estudo');   // D126: reason
  const rare = g.hist.find(e => e.k === 'find' && e.seat === i);
  if (past || (rare && rare.k === 'find' && RARE_SKILLS[rare.id as Rare]?.includes(skill)) || (skill === 'Occult' && mythosOf(g, i) >= MYTHOS_SEES) || studied) mod = 1;
  // D118: the god's gift to its high priest
  if (priest && ((god === 'nyarlathotep' && skill === 'Persuade') || (god === 'yog' && skill === 'Psychology') || (god === 'hydra' && skill === 'Intimidate') || (god === 'glaaki' && skill === 'Charm') || (god === 'baal' && skill === 'Fast Talk'))) mod = 1;
  const cultGift: Partial<Record<string, string>> = { mamon: 'Persuade', marduque: 'Spot Hidden', asmodeu: 'Charm', astarote: 'Occult' };   // D124, D125
  if (g.players[i].role !== 'liberal' && god && cultGift[god] === skill) mod = 1;   // D123: Hydra, Glaaki
  // D115: an item made for this skill helps too
  const gear = itemHelps(g, i, skill) ? itemOf(g, i) : undefined;
  if (gear) mod = 1;
  // D119: hurt or poisoned, a penalty die
  if (statesOf(g, i).length && !(inv && HEALERS.includes(pastSkill))) mod = mod === 1 ? 0 : -1;
  // D113: a shaken seat rolls a penalty die (a bonus die and a penalty die cancel out), as in Call of Cthulhu
  if (shaken) mod = mod === 1 ? 0 : -1;
  // D113: a hard test (a weak argument) needs half the value: a plain success does not count
  const need = hard ? Math.floor(val / 2) : val, lv = (d: number): RollLevel => { const l = levelOf(d, val); return hard && l === 'ok' ? 'fail' : l; };
  let d: number, tens: number[] | undefined;
  if (!mod) d = 1 + Math.floor(rand() * 100);
  else {
    // D109: a bonus (or penalty) die, as in Call of Cthulhu: one units die and two tens dice, keeping the better (or the
    // worse) tens (counted 1 to 100, like the plain roll)
    const u = Math.floor(rand() * 10);
    tens = [Math.floor(rand() * 10), Math.floor(rand() * 10)];
    d = (mod > 0 ? Math.min(...tens) : Math.max(...tens)) * 10 + u + 1;
  }
  // D114: Luck, once a game: a failure by LUCK_MAX or less is bought with Luck points (never a fumble)
  let luck: number | undefined;
  const azath = god === 'azathoth' && g.players[i].role === 'liberal' && d >= 90;   // D123: Azathoth's chaos
  const tiam = god === 'tiamat' && g.players[i].role !== 'liberal' && d <= 5;   // D124: Tiamat
  const level0 = azath ? 'fumble' : tiam ? 'crit' : lv(d), short = d - need;
  if (level0 === 'fail' && short > 0 && short <= LUCK_MAX && luckLeft(g, i) >= short && !luckUsed(g, i) && horrorOf(g).luck) { luck = short; d = need; }
  return { skill, label: SKILLS[skill] || CHAR_NAME[skill] || skill, val, base, d, level: azath ? 'fumble' : tiam ? 'crit' : lv(d), ...(mod ? { mod, ...(tens ? { tens } : {}) } : {}), ...(hard ? { hard } : {}), ...(shaken ? { shaken } : {}), ...(luck ? { luck } : {}), ...(helped ? { helped } : {}), ...(gear ? { gear } : {}), ...(past ? { past } : {}) };
}
/** D114: the rolls on the record made by a seat. */
export function rollsBy(g: Game, i: number): Roll[] {
  const out: Roll[] = [];
  for (const e of g.hist) {
    if (e.k === 'talk') for (const l of e.deb || []) { if (l.who === i && l.roll) out.push(l.roll); }
    if ((e.k === 'psy' || e.k === 'sense') && e.by === i && e.roll) out.push(e.roll);
    if (e.k === 'exec' && e.by === i && e.atk) out.push(e.atk);
    if (e.k === 'steal') { if (e.by === i) out.push(e.roll); else if (e.from === i) out.push(e.vs); }
    if (e.k === 'trap') for (const x of e.rolls) if (x.seat === i && (e.healer === undefined || e.healer === i)) out.push(x.roll);
    if (e.k === 'tend' && e.by === i) out.push(e.roll);
  }
  return out;
}
export const LUCK_MAX = 10;
const luckUsed = (g: Game, i: number): boolean => rollsBy(g, i).some(r => !!r.luck);
/** D114: the Luck a seat has left (its sheet's, less what it spent). */
export const luckLeft = (g: Game, i: number): number => (sheetOf(g, i)?.vals.Luck ?? 0) - rollsBy(g, i).reduce((n, r) => n + (r.luck || 0), 0);
/** D114: how a seat eliminates someone: the higher of Firearms and Brawl; by hand, Dexterity and Constitution against
 *  the target's give a bonus die (both higher) or a penalty die (both lower). The shot never misses (the rules have no
 *  luck): the roll says whether it was clean or ugly, and an ugly one costs the table more sanity. */
export function attack(g: Game, i: number, target: number, rand: () => number): Roll | undefined {
  const a = sheetOf(g, i), t = sheetOf(g, target);
  if (!a) return undefined;
  const gun = a.vals['Firearms Handgun'] ?? 20, fist = a.vals['Fighting Brawl'] ?? 25, it = itemOf(g, i), w = it ? ITEMS[it].weapon : undefined;
  // D115: a weapon in hand decides how; without one, the better of the two
  if (w === 'gun' || (!w && gun >= fist)) return roll(g, i, 'Firearms Handgun', rand);
  const v = (s: typeof a, k: string): number => s?.vals[k] ?? 50, up = ['Dexterity', 'Constitution'].map(k => Math.sign(v(a, k) - v(t as typeof a, k)));
  const r = roll(g, i, 'Fighting Brawl', rand, up.every(x => x > 0) ? 1 : up.every(x => x < 0) ? -1 : 0);
  return r && it && ITEMS[it].ugly && r.level !== 'fumble' ? { ...r, level: r.level === 'crit' || r.level === 'extreme' ? 'ok' : 'fail' } : r;   // a club or knuckles is never clean
}
/** Which skill backs each argument of the debate: proofs and accounts are persuasion; turning it on the other one,
 *  fast talk; leaning on friends and the table, charm. */
export function skillForArg(id: string): string | null {
  if (id === 'quiet' || id === 'drop') return null;
  if (['counter', 'turn', 'noproof', 'failed', 'rush', 'turnpres', 'blame', 'weak'].includes(id)) return 'Fast Talk';
  if (['vouch', 'table'].includes(id)) return 'Charm';
  return 'Persuade';
}

/** D96: how good a level is, to compare two rolls (an opposed roll: the better level wins; a tie goes to the speaker). */
export const RANK: Record<RollLevel, number> = { fumble: 0, fail: 1, ok: 2, hard: 3, extreme: 4, crit: 5 };
/** D96: the dice of Secret Cultist only, and only with sheets. */
export const cultDice = (g: Game): boolean => g.pack === 'culto' && !!g.sheets;

/* D116: the investigator's stereotype, the one the person picks (or drawn): the API deals the best characteristics and
   skill points to it. The names at the table and what it is good at in the game. */
export const STEREOTYPES: Record<string, { name: string; good: string }> = {
  ADVENTURER: { name: 'Aventureiro', good: 'Escalar, Nadar, Dirigir, Briga, Primeiros socorros' },
  BEEFCAKE: { name: 'Brutamontes', good: 'Briga, Intimidação, Escutar, Psicologia' },
  BON_VIVANT: { name: 'Boa-vida', good: 'Charme, Lábia, Encontrar, Psicologia' },
  COLD_BLOODED: { name: 'Sangue-frio', good: 'Disfarce, Furtividade, Briga, Armas de fogo' },
  EGGHEAD: { name: 'Cabeção', good: 'Biblioteca, Mecânica, Ciência' },
  EXPLORER: { name: 'Explorador', good: 'Sobrevivência, Rastrear, Escalar' },
  FEMME_FATALE: { name: 'Femme fatale', good: 'Charme, Lábia, Prestidigitação, Armas de fogo, Psicologia' },
  GREASE_MONKEY: { name: 'Mecânico', good: 'Mecânica, Dirigir, Chaveiro, Briga' },
  HARD_BOILED: { name: 'Durão', good: 'Armas de fogo, Intimidação, Briga, Dirigir' },
  HARLEQUIN: { name: 'Arlequim', good: 'Persuasão, Charme, Lábia, Prestidigitação, Furtividade' },
  HUNTER: { name: 'Caçador', good: 'Sobrevivência, Nadar, Rastrear, Primeiros socorros' },
  MYSTIC: { name: 'Místico', good: 'Psicologia, Ocultismo, História' },
  OUTSIDER: { name: 'Forasteiro', good: 'Sobrevivência, Nadar, Rastrear, Primeiros socorros' },
  ROGUE: { name: 'Malandro', good: 'Furtividade, Prestidigitação, Disfarce, Encontrar' },
  SCHOLAR: { name: 'Erudito', good: 'Biblioteca, Medicina, História' },
  SEEKER: { name: 'Buscador', good: 'Encontrar, Escutar, Ocultismo, Biblioteca' },
  SIDEKICK: { name: 'Ajudante', good: 'Furtividade, Rastrear, Escalar, Primeiros socorros' },
  STEADFAST: { name: 'Inabalável', good: 'Persuasão, Psicologia, Primeiros socorros' },
  THRILL_SEEKER: { name: 'Destemido', good: 'Escalar, Nadar, Dirigir, Sobrevivência' },
  TWO_FISTED: { name: 'Brigão', good: 'Briga, Armas de fogo, Intimidação, Nadar' }
};

/* The players run by the app (D10). Pure, and blind on purpose: every function here gets a View, what one seat could
   know sitting at the table, built by the judge (judge.ts), and answers the one question the judge asked with one of
   the options it offered. Nothing here can see the game itself, so no player run by the app can know more than its
   seat, or do more than it was asked.

   How they think: each one weighs every way the roles could be dealt that fits what it knows ("worlds"), by how well
   each world explains what happened: the laws each government made, what its president and chancellor said they got,
   what investigations were said to show. A liberal then picks governments, votes and targets by those odds. The level
   changes how careful it is, how much it remembers, how much it believes what it hears, and whether it counts the laws
   still in the deck. A cultist knows its team and plays for it, lying about its hand when the truth would give it away;
   Leader, when he does not know his team, plays like a liberal so he can be elected later. */
import { DECK_F, DECK_L, LEADER_KNOWS_UPTO, LEADER_ZONE, TRACKER_MAX, WIN, SMALL_TABLE } from './game';
import type { Law, Level, Party, Persona, Role, Seen, View, Why } from './types';

/** What each level does differently:
 *  - noise: how often it picks someone or votes without thinking (a random option);
 *  - slip: how often it plays a law from its hand without thinking;
 *  - memory: how many of the last governments, investigations and eliminations it remembers (what it saw itself it
 *    never forgets);
 *  - lie: how often it thinks a cultist lies about a hand or an investigation (0: it believes everything it hears);
 *  - count: whether it counts the laws still in the deck to tell how likely a hand is;
 *  - act: how often, as a cultist, it lies when the truth would give it away;
 *  - trust: how often, as a cultist, it lets a liberal law through to look clean;
 *  - wary: the chance that the nominated chancellor is Leader above which it votes Nein, from LEADER_ZONE cultist laws;
 *  - plan: as a cultist, plays for the long game: makes Leader look clean before LEADER_ZONE (puts him in governments
 *    that pass liberal laws) and eliminates the liberals who caught a teammate lying;
 *  - image: as a cultist with a hand to play, how much looking suspicious to the table costs, against a cultist law
 *    worth 1 (0: it does not think about it). It works out how the table would see each way to play the hand, with the
 *    same reasoning the table uses;
 *  - test: as a liberal president with 1 cultist and 2 liberal laws, how often it tests a chancellor it is unsure of by
 *    passing the cultist one with a liberal one (D22), and says so: the chancellor shows its side by what it enacts. */
export interface Knobs { noise: number; memory: number; lie: number; count: boolean; act: number; trust: number; wary: number; plan: boolean; image: number; slip: number; test: number }
export const AI: Record<Level, Knobs> = {
  facil: { noise: 0.3, slip: 0.1, memory: 5, lie: 0.1, count: false, act: 0.4, trust: 0, wary: 0.5, plan: false, image: 0, test: 0 },
  medio: { noise: 0.1, slip: 0.1, memory: 6, lie: 0.3, count: false, act: 0.6, trust: 0.1, wary: 0.3, plan: false, image: 0, test: 0 },
  dificil: { noise: 0.03, slip: 0.03, memory: 99, lie: 0.32, count: false, act: 0.9, trust: 0.15, wary: 0.2, plan: true, image: 1, test: 0.3 },
  extremo: { noise: 0.02, slip: 0.02, memory: 99, lie: 0.34, count: true, act: 0.95, trust: 0.15, wary: 0.25, plan: true, image: 1, test: 0.3 }
};
/** What each personality (D26) changes, on top of the level:
 *  - mood: where its temper sits (-1 wary, 1 trusting), the drawn temper moving it a little (temper);
 *  - ear: how much an accusation or a vouch with nothing in the record behind it weighs (the power of 1 + TALK_W);
 *  - proof: how much one the record backs up weighs (twice the ear for most: D26);
 *  - bluff: how much more (or less) than its level it lies as a cultist;
 *  - wild: how much more often than its level it does something without thinking;
 *  - quiet: how often it keeps quiet between rounds. */
export const PERSONA: Record<Persona, { mood: number; ear: number; proof: number; bluff: number; wild: number; quiet: number }> = {
  certinho: { mood: 0, ear: 1, proof: 2, bluff: 0.6, wild: 0, quiet: 0.1 },
  desconfiado: { mood: -0.7, ear: 1.2, proof: 2.4, bluff: 1, wild: 0, quiet: 0.15 },
  cetico: { mood: 0, ear: 0.3, proof: 1, bluff: 1, wild: 0, quiet: 0.4 },
  critico: { mood: -0.2, ear: 0.4, proof: 3, bluff: 1, wild: 0, quiet: 0.1 },
  centrado: { mood: 0, ear: 1, proof: 2, bluff: 1, wild: 0, quiet: 0.15 },
  blefador: { mood: 0.3, ear: 1, proof: 2, bluff: 1.3, wild: 0, quiet: 0.05 },
  caotico: { mood: 0.5, ear: 1.3, proof: 1.3, bluff: 1.3, wild: 0.08, quiet: 0.1 }
};
/** The temper a player plays with (D26): its personality's, moved by the one drawn at the start. */
export const temper = (drawn: number, persona: Persona = 'centrado'): number => Math.max(-1, Math.min(1, PERSONA[persona].mood + 0.4 * drawn));
/** The knobs of this player: its level's, moved by its personality (D26). */
function knob(v: View): Knobs {
  const k = AI[v.level], p = PERSONA[v.persona || 'centrado'];
  return { ...k, noise: Math.min(1, k.noise + p.wild), act: Math.min(1, k.act * p.bluff) };
}
/** How each personality plays the hidden leader (D40): how much more (or less) often than usual it lets a liberal law
 *  through early to look clean. The straight one hides deep, the bluffer and the chaotic push their luck. */
export const BOSS_STYLE: Record<Persona, number> = { certinho: 0.25, desconfiado: 0.1, cetico: 0, critico: 0.05, centrado: 0, blefador: -0.25, caotico: -0.15 };
/** The answers to 'react' (D26). */
export const REACT = { agree: 0, unsure: 1, disagree: 2 } as const;
/** How much an answer to a claim weighs, against a talk of its own (D33): a little. */
export const REACT_W = 0.3;
/** The answer to 'talk' that means keeping quiet (D13). */
export const QUIET = 1000;
/** How far the temper of a player (View.mood, -1 to 1) moves the risk it accepts in a government. */
export const MOOD = 0.2;
/** How often a liberal thinks a cultist lets a liberal law through on purpose (the same at every level). */
const TRUST_GUESS = 0.15;
/** The chancellor test (D22), as everyone reckons it, at every level: how often a liberal president with 1 cultist and
 *  2 liberal laws passes the cultist one on, to see what the chancellor enacts. A liberal who tests says so (its claim
 *  is the truth), so "I drew 2 liberals and passed you one of each" raises suspicion without proving anything. A
 *  cultist can hide behind it too, by telling the truth where it could have lied: that is in the lie rate already,
 *  since a cultist who does not lie tells the truth. */
export const TEST_GUESS = 0.15;
/** What the levels that read the long game (`plan`, D22) know the hidden leader does: before LEADER_ZONE cultist laws
 *  he lets liberal laws through to look clean, and his team hands him liberal laws to pass; this is how often. The
 *  levels below take him for any other cultist (TRUST_GUESS). */
export const BOSS_CLEAN = 0.6;
/** What the extreme level reads in the votes (D22): a cultist who knows the government has a teammate in it votes Ja
 *  this often; anyone else votes Ja about this often, whatever their side. */
export const ALLY_JA = 0.8, ANY_JA = 0.7;   // D33: people vote Ja about 74% of the time in the exported games
/** Above this chance, as the table sees it, of being the hidden leader, a cultist waits to nominate him (D33). */
export const LEADER_BURNT = 0.35;
/** How often the hard level misses a decisive law (D33); the extreme never does. */
export const DECISIVE_SLIP = 0.1;
/** D51: before the danger zone the hidden side's first plan is to stay clean, so the leader can be elected chancellor
 *  later: how often a cultist with the choice lets the liberal law through, per level (a burnt cultist is voted down). */
/** D52: from LEADER_ZONE cultist laws on, the easiest way for the hidden side to win is the leader as chancellor, so a
 *  liberal votes Nein unless it is fairly sure the chancellor is liberal: the most chance of the hidden side it accepts. */
export const ZONE_SURE: Record<Level, number> = { facil: 1, medio: 0.7, dificil: 0.75, extremo: 0.9 };
/** D62: how much the votes already cast weigh on a liberal's vote, by how much it trusts each voter (the sceptic less). */
export const CASCADE_W = 0.15;
/** D65: how much a plea for its vote moves a liberal, times how much it trusts whoever asks. */
export const PLEA_W = 0.2;
/** D66: how much a request to whoever presides (pick me, do not pick someone, investigate someone) moves it, times how
 *  much it trusts whoever asked. Requests last until the next government. */
export const REQ_W = 0.25;
function requests(v: View, b: Beliefs, what: 'pick' | 'avoid' | 'inv' | 'kill'): (i: number) => number {
  let from = 0;
  for (let i = v.hist.length - 1; i >= 0; i--) { const e = v.hist[i]; if (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos') { from = i + 1; break; } }
  const asks = v.hist.slice(from).filter((e): e is Extract<Seen, { k: 'ask' }> => e.k === 'ask' && e.what === what && e.by !== v.me);
  const m = v.persona === 'cetico' ? 0.4 : 1;
  return i => asks.filter(e => e.who === i).reduce((a, e) => a + REQ_W * m * (1 - b.pF[e.by]) * (e.power !== undefined ? 0.5 + e.power * 2 : 1), 0);
}
/** D75: from LEADER_ZONE on, a liberal neither nominates nor votes Ja for a chancellor who sat in this many governments
 *  that passed a law of the hidden side (a public fact), unless an investigation said it is liberal. */
export const ZONE_DIRTY = 2;
const dirtyCount = (v: View, i: number): number => v.hist.filter(e => e.k === 'gov' && e.law === 'F' && (e.pres === i || e.chanc === i)).length;
/** D80: two who governed together and a law of the hidden side came out: one cannot clear the other by investigating. */
const together = (v: View, a: number, b: number): boolean => v.hist.some(e => e.k === 'gov' && e.law === 'F' && ((e.pres === a && e.chanc === b) || (e.pres === b && e.chanc === a)));
/** D82: an investigator is believed only with a record: at least this many liberal laws passed in its governments. */
export const INV_CRED = 2;
/** D90: a story that did not add up, or an accusation with a proof the table upheld, is harder evidence than someone's
 *  word that an investigation said liberal: no investigation clears it. */
const marked = (v: View, i: number): boolean => v.hist.some(e => ((e.k === 'gov' || e.k === 'veto') && (e.pres === i || e.chanc === i) && e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && Math.max(0, e.pc - 1) !== e.cc && !(e.pc === 1 && e.cc === 1))
  || (e.k === 'talk' && e.say === 'acc' && e.about === i && !!e.hit && !!e.verdict && e.verdict.filter(x => x[1] === 1).length > e.verdict.filter(x => x[1] === 0).length));
const credible = (v: View, by: number, i: number): boolean => !marked(v, i) && v.hist.filter(e => e.k === 'gov' && e.law === 'L' && (e.pres === by || e.chanc === by)).length >= INV_CRED && dirtyCount(v, by) < ZONE_DIRTY && !together(v, by, i);
const dirtyIn = (v: View, i: number): boolean => {
  // an investigation that said "liberal" clears it only if the investigator is not dirty itself: in the exported games
  // the hidden side covered its allies in 14 of its investigations
  if (v.hist.some(e => e.k === 'inv' && e.target === i && e.said === 'L' && (e.by === v.me || credible(v, e.by, i)))) return false;
  return dirtyCount(v, i) >= ZONE_DIRTY;
};
/** D81: a combo accusation that the table upheld: from one law short of the danger zone on, a liberal neither nominates
 *  nor votes Ja for that chancellor, unless an investigation by someone clean said it is liberal. */
export const barred = (v: View, i: number): boolean => v.laws.F >= LEADER_ZONE - 1
  && !v.hist.some(e => e.k === 'inv' && e.target === i && e.said === 'L' && (e.by === v.me || credible(v, e.by, i)))
  && v.hist.some(e => e.k === 'talk' && e.say === 'acc' && e.about === i && (e.proofs?.length ?? 0) > 1 && !!e.verdict && e.verdict.filter(x => x[1] === 1).length > e.verdict.filter(x => x[1] === 0).length);
/** D90: whether this player accused `i` since the last government (its words this round). */
const saidAgainst = (v: View, i: number): boolean => {
  let from = 0;
  for (let k = v.hist.length - 1; k >= 0; k--) { const e = v.hist[k]; if (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos') { from = k + 1; break; } }
  return v.hist.slice(from).some(e => e.k === 'talk' && e.by === v.me && e.say === 'acc' && e.about === i);
};
/** D91: "pass two liberals early, then put the leader in as chancellor" is the oldest trick of the hidden side. From the
 *  danger zone on, the levels that read the long game (difícil, extremo) only trust as chancellor someone who proved
 *  itself after the game heated up (a liberal law passed in its government from the 2nd law of the hidden side on) or
 *  whom a credible investigation said is liberal; early liberal laws alone are what the trick looks like. Not with
 *  the chaos one rejection away: that would hand the hidden side a law. */
export const LATE_FROM = 2;
const provedLate = (v: View, i: number): boolean => {
  let F = 0;
  for (const e of v.hist) {
    if ((e.k === 'gov' || e.k === 'chaos') && e.law === 'F') F++;
    else if (e.k === 'gov' && e.law === 'L' && F >= LATE_FROM && (e.pres === i || e.chanc === i)) return true;
  }
  return v.hist.some(e => e.k === 'inv' && e.target === i && e.said === 'L' && credible(v, e.by, i));
};
const unproven = (v: View, i: number): boolean => AI[v.level].plan && v.laws.F >= LEADER_ZONE && v.tracker < TRACKER_MAX - 1 && i !== v.me && !provedLate(v, i);
export const EARLY_CLEAN: Record<Level, number> = { facil: 0, medio: 0.1, dificil: 0.3, extremo: 0.35 };
/** What the levels that read the long game see in a nomination (D22): a cultist president who knows its team picks a
 *  teammate for chancellor this many times more often than chance would. */
export const ALLY_PICK = 1.5;
/** How often anyone, liberal or not, plays a law against its own side by mistake (a wrong tap): no single play is
 *  ever taken as proof (D22). */
export const SLIP_GUESS = 0.03;
/** What is said between rounds (D26): an accusation or a vouch moves the odds a little, since anyone may lie. A world
 *  is weighed by how likely the speaker, on its side in that world, would say it (TALK_LIE, SLIP_TALK), against even
 *  odds, to the power TALK_W: a little. An accusation the record backs up
 *  (TALK_BACKED: the one accused was in a government that passed a cultist law, or whose story did not hold; the one
 *  vouched for, in one that passed a liberal law with a story that held) weighs double: the square. Only what this
 *  player still remembers of the record counts, as a person at the table would remember it. */
export const TALK_W = 0.3;
/** How the table reckons what is said (D26): a cultist points the wrong way (smears a liberal, vouches for a teammate)
 *  this often, and the right way the rest, to look clean; a liberal points the wrong way only by mistake, this often. */
export const TALK_LIE = 0.6, SLIP_TALK = 0.1;
/** Whether what `by`'s talk says about `about` is backed by the record from `from` to `upto` (D26). */
export function backed(hist: Seen[], from: number, upto: number, about: number, acc: boolean): boolean {
  return hist.slice(from, upto).some((e, k) => {
    if (e.k !== 'gov' || (e.pres !== about && e.chanc !== about)) return false;
    const clash = e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && Math.max(0, e.pc - 1) !== e.cc && !(e.pc === 1 && e.cc === 1);
    // D52: an early law proves little either way (the hidden side plays clean early, and smears a liberal); only a story
    // that does not add up still holds then
    const early = earlyGov(hist, from + k);
    return acc ? (e.law === 'F' && !early) || clash : e.law === 'L' && !clash && !early;
  });
}
/** D52: governments this early (the first EARLY_GOVS, or the one that made the first cultist law) prove little. */
export const EARLY_GOVS = 2;
export function earlyGov(hist: Seen[], at: number): boolean {
  let govs = 0, F = 0;
  for (let i = 0; i < at; i++) { const e = hist[i]; if (e.k === 'gov') { govs++; if (e.law === 'F') F++; } else if (e.k === 'chaos' && e.law === 'F') F++; }
  const e = hist[at];
  return govs < EARLY_GOVS || (e?.k === 'gov' && e.law === 'F' && F === 0);
}

/** How many times this speaker made the same claim since the last new fact involving its target. */
export function claimRepeats(hist: Seen[], at: number, from = 0): number {
  const t = hist[at];
  if (!t || t.k !== 'talk' || t.say === 'quiet') return 0;
  let count = 0;
  for (let i = from; i <= at; i++) {
    const e = hist[i];
    if ((e.k === 'gov' || e.k === 'veto') && (e.pres === t.about || e.chanc === t.about) || e.k === 'inv' && e.target === t.about || e.k === 'exec' && e.target === t.about) count = 0;
    else if (e.k === 'talk' && e.by === t.by && e.about === t.about && e.say === t.say) count++;
  }
  return count;
}

/** Public social record: changing sides is suspicious only while nothing new happened about that target. */
export function socialMemory(v: View, seat: number): { accusations: number; defenses: number; reversals: number; contradictions: number } {
  const result = { accusations: 0, defenses: 0, reversals: 0, contradictions: 0 };
  const opinions = new Map<number, string>();
  v.hist.forEach((e, at) => {
    // an accusation made firmly, or with a proof, that the record does not back costs the accuser (D39)
    if (e.k === 'talk' && e.by === seat && e.say === 'acc' && (e.tone === 'firm' || e.tone === 'proof') && !e.hit && !backed(v.hist, 0, at, e.about, true)) result.contradictions++;
    // D66: a seat vouched for that an investigation was said to show as the other side: the stake is lost
    if (e.k === 'inv' && e.said === 'F' && e.target !== seat && v.hist.slice(0, at).some(x => x.k === 'talk' && x.by === seat && x.say === 'trust' && x.about === e.target)) result.contradictions++;
    if (e.k === 'gov' && e.law === 'F') { const vt = v.hist[at - 1], bl = [...v.hist.slice(0, at)].reverse().find((x): x is Extract<Seen, { k: 'bloc' }> => x.k === 'bloc'); if (bl && vt && vt.k === 'vote' && vt.ja.includes(seat) && (bl.by === seat || bl.yes.includes(seat)) && v.hist.slice(v.hist.lastIndexOf(bl), at).filter(x => x.k === 'gov' || x.k === 'veto' || x.k === 'chaos' || x.k === 'rej').length < 3) result.contradictions++; }
    // D65: said it was liberal, and an investigation was said to show the other side: a lie the table remembers
    if (e.k === 'inv' && e.target === seat && e.said === 'F' && v.hist.slice(0, at).some(x => x.k === 'self' && x.by === seat)) result.contradictions += 2;
    // a weak accusation that fell in a debate turned against the accuser (D61): it costs it the table's trust
    if (e.k === 'talk' && e.by === seat && e.backfire) { result.contradictions += 2; result.reversals++; }
    if (e.k === 'gov' || e.k === 'veto') {
      opinions.delete(e.pres); opinions.delete(e.chanc);
      if ((e.pres === seat || e.chanc === seat) && e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && (e.cc > e.pc || e.cc < e.pc - 1)) result.contradictions++;
    } else if (e.k === 'inv' || e.k === 'exec') opinions.delete(e.target);
    else if (e.k === 'talk' && e.by === seat && e.about >= 0 && e.say !== 'quiet') {
      if (e.say === 'acc') result.accusations++; else result.defenses++;
      const previous = opinions.get(e.about);
      if (previous && previous !== e.say) result.reversals++;
      opinions.set(e.about, e.say);
    }
  });
  return result;
}

/** Estimate approval using public beliefs and declared opinions, never the voters' private hands or roles. */
export function governmentPlan(v: View, pres: number, chanc: number): { approval: number; voters: number; majority: number; next: number } {
  const b = believe(v, true), live = v.alive.map((a, i) => a ? i : -1).filter(i => i >= 0);
  const base = v.cultists / Math.max(1, v.n), r = risk(b, [pres, chanc]);
  const chances = live.map(i => {
    if (i === pres || i === chanc) return 0.9;
    const opinion = [...v.hist].reverse().find(e => e.k === 'talk' && e.by === i && (e.about === pres || e.about === chanc) && e.say !== 'quiet');
    const stance = opinion?.k === 'talk' ? opinion.say === 'acc' ? -0.18 : 0.12 : 0;
    return Math.max(0.05, Math.min(0.95, 0.72 + 0.5 * (1 - (1 - base) ** 2 - r) + stance - (v.laws.F >= LEADER_ZONE ? 0.8 * b.pH[chanc] : 0)));
  });
  let counts = [1];
  for (const p of chances) {
    const next = Array(counts.length + 1).fill(0) as number[];
    counts.forEach((chance, yes) => { next[yes] += chance * (1 - p); next[yes + 1] += chance * p; }); counts = next;
  }
  const majority = Math.floor(live.length / 2) + 1;
  let anchor = pres;
  if (pres === v.pres) for (let i = v.hist.length - 1; i >= 0; i--) {
    const e = v.hist[i];
    if (e.k === 'gov' || e.k === 'veto' || e.k === 'rej' || e.k === 'chaos') break;
    if (e.k === 'special') { if (e.target === pres) anchor = e.by; break; }
  }
  let next = anchor;
  for (let step = 1; step <= v.n; step++) if (v.alive[(anchor + step) % v.n]) { next = (anchor + step) % v.n; break; }
  return { approval: counts.slice(majority).reduce((a, x) => a + x, 0), voters: live.length, majority, next };
}

const fasc = (r: Role): boolean => r !== 'liberal';
const nF = (laws: Law[]): number => laws.filter(l => l === 'F').length;
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}
/** The odds of drawing 0, 1, 2 or 3 cultist laws out of f cultist and l liberal. */
export function drawOdds(f: number, l: number): number[] {
  const all = choose(f + l, 3);
  return all ? [0, 1, 2, 3].map(d => (choose(f, d) * choose(l, 3 - d)) / all) : [0.25, 0.25, 0.25, 0.25];
}

/* ---------- what a cultist would say, and what a liberal believes a cultist does ---------- */
/** The president's story that makes the laws he passed look forced: with m cultist laws passed, he says he drew m + 1
 *  (all 3 when a cultist law came out of it); having passed none, he tells the truth. */
export const presStory = (d: number, m: number, law: Law | undefined): number => (m === 0 ? d : Math.min(3, Math.max(m + 1, law === 'F' ? 3 : 0)));
/** The chancellor's story: a cultist law came out, so both were cultist. */
export const chancStory = (m: number, law: Law | undefined): number => (law === 'F' ? 2 : m);

/** The cultist laws a president passes on with d drawn: a liberal throws a cultist one away when he can; a cultist
 *  keeps them, now and then letting a liberal one through. */
function passOdds(d: number, cultist: boolean, trust: number, test: number): [number, number][] {
  const lo = Math.max(0, d - 1), hi = Math.min(2, d);
  if (lo === hi) return [[lo, 1]];
  if (cultist) return [[hi, 1 - trust], [lo, trust]];
  const off = d === 1 ? test : SLIP_GUESS;                                  // one of each from 1F 2L: a test (D22); two F from 2F 1L: a slip
  return [[lo, 1 - off], [hi, off]];
}
/** How likely this law comes out of a hand with m cultist laws. */
function lawOdds(m: number, cultist: boolean, law: Law | undefined, trust: number): number {
  if (m === 0) return law === 'L' ? 1 : 0;
  if (m === 2) return law === 'F' ? 1 : 0;
  return !cultist ? (law === 'L' ? 1 - SLIP_GUESS : SLIP_GUESS) : law === 'F' ? 1 - trust : trust;
}
/** How likely a chancellor asks to veto (and it goes through) with m cultist laws in hand. */
const vetoOdds = (m: number, cultist: boolean): number => (cultist ? (m === 0 ? 0.8 : 0.05) : m === 2 ? 0.8 : 0.02);
/** How likely someone says `said` when the truth is `truth` and the story is `story`. */
function sayOdds(said: number | undefined, truth: number, story: number, cultist: boolean, lie: number): number {
  if (said === undefined || said < 0) return 1;
  if (!cultist) return said === truth ? 1 - SLIP_GUESS : SLIP_GUESS / 3;    // a liberal tells the truth, but a wrong tap is never proof
  if (story === truth) return said === truth ? 1 : 0;
  return (said === truth ? 1 - lie : 0) + (said === story ? lie : 0);
}

/** How well one government (or veto) is explained by who was cultist in it. */
/** `tp` and `tc`: how often the president and the chancellor, if cultist, let a liberal law through in this world. */
function govOdds(e: Extract<Seen, { k: 'gov' | 'veto' }>, fp: boolean, fc: boolean, pd: number[], lie: number, knownD: number | null, tp = TRUST_GUESS, tc = TRUST_GUESS, test = TEST_GUESS): number {
  const D = e.drew && e.drew.length ? [nF(e.drew)] : knownD !== null ? [knownD] : [0, 1, 2, 3];
  const got = e.got && e.got.length ? nF(e.got) : null, law = e.k === 'veto' ? undefined : e.law;
  let sum = 0;
  for (const d of D) {
    const p = D.length === 1 ? 1 : pd[d];
    if (!p) continue;
    for (const [m, pm] of passOdds(d, fp, tp, test)) {
      if (got !== null && m !== got) continue;
      const out = e.k === 'veto' ? vetoOdds(m, fc) : lawOdds(m, fc, law, tc);
      if (!out) continue;
      sum += p * pm * out * sayOdds(e.pc, d, presStory(d, m, law), fp, lie) * sayOdds(e.cc, m, chancStory(m, law), fc, lie);
    }
  }
  return sum;
}

/* ---------- worlds ---------- */
export interface Beliefs { worlds: { roles: Role[]; w: number }[]; pF: number[]; pH: number[] }

/** Every way the roles could be, given what this seat knows (or, `outside`, given nothing but what everyone saw: how
 *  the table sees things, which a cultist needs to know how suspicious its team looks). */
function worlds(v: View, outside: boolean): Role[][] {
  const known = outside ? v.known.map(() => null) : v.known;
  const free = known.map((r, i) => (r === null ? i : -1)).filter(i => i >= 0);
  const need = v.cultists - known.filter(r => r !== null && fasc(r)).length, leaderKnown = known.includes('lider');
  const out: Role[][] = [];
  const pick = (from: number, chosen: number[]): void => {
    if (chosen.length === need) {
      const base: Role[] = known.map(r => r || 'liberal');
      if (leaderKnown) out.push(base.map((r, i) => (chosen.includes(i) ? 'cultista' : r)));
      else for (const h of chosen) out.push(base.map((r, i) => (i === h ? 'lider' : chosen.includes(i) ? 'cultista' : r)));
      return;
    }
    for (let j = from; j <= free.length - (need - chosen.length); j++) pick(j + 1, [...chosen, free[j]]);
  };
  if (need >= 0 && need <= free.length) pick(0, []);
  return out.length ? out : [known.map(r => r || 'liberal')];
}

/** The weight of every world after what happened, and from them the chance that each seat is a cultist (Leader
 *  included) and that it is Leader. */
let beliefCache: WeakMap<View, Map<boolean, Beliefs>> | null = null;
export function believe(v: View, outside = false): Beliefs {
  const cached = beliefCache?.get(v)?.get(outside);
  if (cached) return cached;
  const k = AI[v.level], mine = (by: number): boolean => !outside && by === v.me;
  const remember = (() => {
    const idx = v.hist.map((e, i) => (e.k === 'gov' || e.k === 'veto' || e.k === 'inv' || e.k === 'exec' ? i : -1)).filter(i => i >= 0);
    return idx.length > k.memory ? idx[idx.length - k.memory] : 0;
  })();
  const social = Array.from({ length: v.n }, (_, seat) => socialMemory({ ...v, hist: v.hist.slice(remember) }, seat));
  const repeats = v.hist.map((e, i) => e.k === 'talk' ? claimRepeats(v.hist, i, remember) : 0);
  const support = v.hist.map((e, i) => e.k === 'talk' && !e.ok && (!!e.hit || backed(v.hist, remember, i, e.about, e.say === 'acc')));   // a defence that holds takes it back (D40)   // a proof that holds weighs double (D39)
  const generated = worlds(v, outside);
  const viable = generated.filter(roles => {
    let enactedF = 0;
    for (let i = 0; i < v.hist.length; i++) {
      const e = v.hist[i];
      if (e.k === 'inv' && mine(e.by) && e.party && (fasc(roles[e.target]) ? 'F' : 'L') !== e.party) return false;
      if ((e.k === 'gov' || e.k === 'veto') && enactedF >= LEADER_ZONE && roles[e.chanc] === 'lider') return false;
      if (e.k === 'exec' && i < v.hist.length - 1 && roles[e.target] === 'lider') return false;
      if ((e.k === 'gov' || e.k === 'chaos') && e.law === 'F') enactedF++;
    }
    return true;
  });
  // Even if every behavioural likelihood conflicts, the fallback keeps the worlds allowed by first-hand facts.
  const ws = (viable.length ? viable : generated).map(roles => {
    let socialLog = 0;
    for (let seat = 0; seat < v.n; seat++) if (!mine(seat)) socialLog += Math.min(3, social[seat].reversals) * Math.log(fasc(roles[seat]) ? 1.3 : 0.85);
    let logW = socialLog, L = 0, F = 0, knownD: number | null = null;
    const weight = (p: number): void => { logW += Math.log(p); };
    const gone = new Set<number>(), knowsTeam = (j: number): boolean => roles[j] === 'cultista' || (roles[j] === 'lider' && v.n <= LEADER_KNOWS_UPTO);
    v.hist.forEach((e, i) => {
      const fresh = i >= remember;
      // D96: a reading of its own (Psychology): a lie read points hard at the hidden side; the truth read clears a little
      if (e.k === 'psy') {
        if (e.by !== v.me || e.lie === undefined || mine(e.about)) return;
        const f = fasc(roles[e.about]);
        weight(e.lie ? (f ? (e.sure ? 4 : 2.2) : (e.sure ? 0.25 : 0.5)) : f ? (e.sure ? 0.4 : 0.7) : 1.15);
        return;
      }
      // D96: the eliminator's Intimidation: a roll that convinced keeps it clean; one that failed looks bad
      if (e.k === 'exec' && e.intim && !mine(e.by)) {
        const f = fasc(roles[e.by]), bad = e.intim === 'fail' ? 1.3 : e.intim === 'fumble' ? 1.6 : 0.85;
        weight(f ? bad : 1 / bad);
      }
      if (e.k === 'vote' && k.count && fresh) {
        // the extreme level reads the votes: a cultist votes Ja for a government with a teammate in it
        const team = fasc(roles[e.pres]) || fasc(roles[e.chanc]);
        for (let j = 0; j < v.n; j++) {
          if (gone.has(j) || j === e.pres || j === e.chanc || mine(j)) continue;
          const ja = e.ja.includes(j), p = knowsTeam(j) && team ? ALLY_JA : ANY_JA;
          weight(ja ? p : 1 - p);
        }
        return;
      }
      // who a president nominated: a cultist who knows its team leans to a teammate (the levels that read the long game)
      if ((e.k === 'gov' || e.k === 'veto' || e.k === 'rej') && fresh && k.plan && !mine(e.pres) && knowsTeam(e.pres) && fasc(roles[e.chanc])) weight(ALLY_PICK);
      if (e.k === 'gov' || e.k === 'veto') {
        const own = mine(e.pres) || mine(e.chanc);
        if (fresh || own) {
          const pd = k.count ? drawOdds(Math.max(0, DECK_F - F), Math.max(0, DECK_L - L)) : drawOdds(DECK_F, DECK_L);
          const ev = outside ? { ...e, drew: undefined, got: undefined } : e;
          // the levels that read the long game know the hidden leader keeps clean early, helped by his team (D22)
          const early = k.plan && F < LEADER_ZONE, boss = (j: number): boolean => roles[j] === 'lider';
          const tp = early && (boss(e.pres) || (fasc(roles[e.pres]) && boss(e.chanc))) ? BOSS_CLEAN : TRUST_GUESS, tc = early && boss(e.chanc) ? BOSS_CLEAN : TRUST_GUESS;
          const p = govOdds(ev, fasc(roles[e.pres]), fasc(roles[e.chanc]), pd, k.lie, k.count || k.plan ? knownD : null, tp, tc, k.plan ? TEST_GUESS : TEST_GUESS / 2);
          weight(own ? p : 0.03 + 0.97 * p);
        }
        // A legislative session proves this chancellor was not Leader in the danger zone, at every memory level.
        if (F >= LEADER_ZONE && roles[e.chanc] === 'lider') weight(0);
        knownD = null;
        if (e.law) e.law === 'F' ? F++ : L++;
      } else if (e.k === 'chaos') {
        knownD = null;
        e.law === 'F' ? F++ : L++;
      } else if (e.k === 'peek') {
        if (mine(e.by) && e.saw) knownD = nF(e.saw);
        // what someone else says the next 3 laws are: the truth if they are liberal, which the next president's story
        // then has to match (the levels that read the long game check it)
        else if (k.plan && e.said !== undefined && e.said >= 0 && !fasc(roles[e.by])) knownD = e.said;
      } else if (e.k === 'inv') {
        if (mine(e.by) && e.party) weight((fasc(roles[e.target]) ? 'F' : 'L') === e.party ? 1 : 0);
        else if (fresh && e.said && e.said !== '-') {
          const truth: Party = fasc(roles[e.target]) ? 'F' : 'L';
          const p = !fasc(roles[e.by]) ? (e.said === truth ? 1 : 0)
            : truth === 'F' ? (e.said === 'L' ? k.lie : 1 - k.lie) : e.said === 'F' ? k.lie / 2 : 1 - k.lie / 2;
          weight(0.03 + 0.97 * p);
        }
      } else if (e.k === 'exec') {
        gone.add(e.target);
        if (i < v.hist.length - 1 && roles[e.target] === 'lider') weight(0);                 // the game went on
        // the levels that read the long game: a cultist who knows its team hardly ever eliminates a teammate
        if (fresh && k.plan && !mine(e.by) && knowsTeam(e.by) && fasc(roles[e.target])) weight(0.15);
      } else if (e.k === 'talk' && fresh && !mine(e.by) && e.about >= 0 && e.say !== 'quiet' && !gone.has(e.by)) {
        // what someone said between rounds (D26): fits a liberal speaker if it points the right way, a cultist one if not
        if (repeats[i] > 1) {
          // Insistence is not fresh evidence about the target. Unsupported pressure instead costs credibility.
          if (e.say === 'acc' && !support[i] && repeats[i] <= 4) {
            const ear = PERSONA[outside ? 'centrado' : v.persona || 'centrado'];
            weight((fasc(roles[e.by]) ? 1.3 : 0.85) ** ear.ear);
          }
          return;
        }
        const acc = e.say === 'acc', right = fasc(roles[e.about]) === acc, liar = fasc(roles[e.by]);
        const like = right ? (liar ? 1 - TALK_LIE : 1 - SLIP_TALK) : liar ? TALK_LIE : SLIP_TALK;
        const ear = PERSONA[outside ? 'centrado' : v.persona || 'centrado'];
        const reliability = (e.ok ? 0.4 : 1) / (1 + 0.35 * social[e.by].contradictions + 0.5 * social[e.by].reversals);
        weight((2 * like) ** (TALK_W * reliability * (support[i] ? ear.proof : ear.ear)));
        // how the table took it (D33): agreeing repeats the claim, disagreeing says the opposite, each a fraction of a
        // talk, weighed by the credibility of who answered; the one claimed and this player's own answer do not count
        for (const [r, a] of e.re || []) {
          if (a === REACT.unsure || mine(r) || r === e.about) continue;
          const says = (a === REACT.agree) === acc, rRight = fasc(roles[e.about]) === says, rLiar = fasc(roles[r]);
          const rLike = rRight ? (rLiar ? 1 - TALK_LIE : 1 - SLIP_TALK) : rLiar ? TALK_LIE : SLIP_TALK;
          const rRel = 1 / (1 + 0.35 * social[r].contradictions + 0.5 * social[r].reversals);
          weight((2 * rLike) ** (TALK_W * REACT_W * rRel * ear.ear));
        }
      } else if (e.k === 'special' && fresh && k.plan && !mine(e.by) && knowsTeam(e.by) && !fasc(roles[e.target])) {
        weight(0.5);                                                              // and hands the presidency to a teammate when it can
      }
    });
    return { roles, w: logW };
  });
  // Subtract the largest log likelihood before exponentiating: long games cannot erase all evidence by underflow.
  const peak = Math.max(...ws.map(x => x.w));
  ws.forEach(x => { x.w = Number.isFinite(peak) ? Math.exp(x.w - peak) : 0; });
  let total = ws.reduce((a, x) => a + x.w, 0);
  if (!(total > 0)) {
    ws.forEach(x => { x.w = v.hist.every(e => e.k !== 'inv' || !mine(e.by) || !e.party || (fasc(x.roles[e.target]) ? 'F' : 'L') === e.party) ? 1 : 0; });
    total = ws.reduce((a, x) => a + x.w, 0);
    if (!total) { ws.forEach(x => { x.w = 1; }); total = ws.length; }
  }
  ws.forEach(x => { x.w /= total; });
  const pF = Array.from({ length: v.n }, (_, i) => ws.reduce((a, x) => a + (fasc(x.roles[i]) ? x.w : 0), 0));
  const pH = Array.from({ length: v.n }, (_, i) => ws.reduce((a, x) => a + (x.roles[i] === 'lider' ? x.w : 0), 0));
  const result = { worlds: ws, pF, pH };
  if (beliefCache) {
    let entries = beliefCache.get(v);
    if (!entries) { entries = new Map(); beliefCache.set(v, entries); }
    entries.set(outside, result);
  }
  return result;
}
/** The chance that at least one of these seats is a cultist. */
export const risk = (b: Beliefs, seats: number[]): number => b.worlds.reduce((a, x) => a + (seats.some(i => fasc(x.roles[i])) ? x.w : 0), 0);

/* ---------- explaining (D16) ----------
   While a decision is made, what weighed in it is written down: the sentences and the options compared. Writing it
   down never changes the decision; outside decideWhy nothing is written. */
let ex: Why | null = null;
const P = (i: number): string => `{p${i}}`;
const pc = (x: number): string => `${Math.round(x * 100)}%`;
const why = (line: string): void => { if (ex) ex.text.push(line); };
const rows = (b: Beliefs, seats: number[], score?: (i: number) => number): void => {
  if (ex) ex.rows = seats.map(i => ({ seat: i, f: b.pF[i], h: b.pH[i], ...(score ? { v: score(i) } : {}) }));
};
const nmF = (n: number, of: number): string => (of === 3 ? ['3 liberais', '1 {f} e 2 liberais', '2 {fs} e 1 liberal', '3 {fs}'] : ['2 liberais', '1 {f} e 1 liberal', '2 {fs}'])[n] ?? `${n}`;

/* ---------- deciding ---------- */
/** The option with the lowest score; ties go to chance. */
function best(options: number[], score: (i: number) => number, rand: () => number): number {
  let top: number[] = [], low = Infinity;
  for (const i of options) {
    const s = score(i);
    if (s < low - 1e-9) { low = s; top = [i]; } else if (Math.abs(s - low) <= 1e-9) top.push(i);
  }
  return top[Math.floor(rand() * top.length)] ?? options[0];
}
/** Whether a liberal (or someone playing like one) votes Ja on this government, by these beliefs. */
function liberalJa(v: View, b: Beliefs): boolean {
  const k = AI[v.level], gov = [v.pres, v.chanc as number];
  const others = v.alive.map((a, i) => (a && i !== v.me ? i : -1)).filter(i => i >= 0);
  let base = 0, pairs = 0;
  for (let x = 0; x < others.length; x++) for (let y = x + 1; y < others.length; y++) { base += risk(b, [others[x], others[y]]); pairs++; }
  base = pairs ? base / pairs : 1;
  // the temper of this player: the wary one wants a government clearly cleaner than most, the trusting one goes along
  // never below zero: even the most wary one accepts a government no riskier than any other pair (D22)
  // D62: the votes heard before its turn: a Ja from someone it trusts makes it easier, a Nein harder
  const heard = (v.cast || []).filter(([j]) => j !== v.me), lean = heard.length ? heard.reduce((a, [j, ja]) => a + (1 - b.pF[j]) * (ja ? 1 : -1), 0) / heard.length : 0;
  const pull = CASCADE_W * (v.persona === 'cetico' ? 0.4 : v.persona === 'certinho' ? 1.2 : 1) * lean
    + (v.pleas || []).reduce((a, [j, ja]) => a + PLEA_W * (1 - b.pF[j]) * (ja ? 1 : -1), 0) * (v.persona === 'cetico' ? 0.4 : 1);   // D65
  const slack = Math.max(0, 0.05 + MOOD * v.mood) + pull + (v.tracker === TRACKER_MAX - 1 ? 0.2 : 0);
  rows(b, gov.filter(i => i !== v.me));
  if (v.laws.F >= LEADER_ZONE && b.pH[gov[1]] > k.wary) {
    why(`Já há ${LEADER_ZONE} leis {fs}: eleger o {boss} chanceler perde o jogo. A chance de ${P(gov[1])} ser o {boss} é ${pc(b.pH[gov[1]])}, acima do limite do nível (${pc(k.wary)}): {nein}`);
    return false;
  }
  if (unproven(v, gov[1])) {
    why(`Já há ${LEADER_ZONE} leis {fs} e ${P(gov[1])} nunca provou nada depois que o jogo esquentou: lei liberal no começo é o disfarce mais velho do {boss}. {nein}`);
    return false;
  }
  if (gov[1] !== v.me && barred(v, gov[1])) {
    why(`A mesa aceitou a acusação com várias provas contra ${P(gov[1])}, e a mesa está perto das ${LEADER_ZONE} leis {fs}: {nein}`);
    return false;
  }
  if (v.laws.F >= LEADER_ZONE && gov[1] !== v.me && dirtyIn(v, gov[1])) {
    why(`Já há ${LEADER_ZONE} leis {fs} e ${P(gov[1])} esteve em ${ZONE_DIRTY} ou mais governos que aprovaram lei {f}: não arrisca o {boss} chanceler. {nein}`);
    return false;
  }
  if (v.laws.F >= LEADER_ZONE && gov[1] !== v.me && b.pF[gov[1]] > ZONE_SURE[v.level]) {
    why(`Já há ${LEADER_ZONE} leis {fs}: daqui em diante só vota Ja! num chanceler de quem tem boa certeza. ${P(gov[1])} tem ${pc(b.pF[gov[1]])} de chance de ser do lado escondido, acima do que o nível aceita (${pc(ZONE_SURE[v.level])}): {nein}`);
    return false;
  }
  const r = risk(b, gov.filter(i => i !== v.me)), ok = r <= base + slack;
  why(`Chance de ter alguém do lado escondido neste governo: ${pc(r)}. Num par qualquer da mesa: ${pc(base)}. Aceita até ${pc(base + slack)} (folga de 5%, ${v.mood >= 0 ? '+' : ''}${pc(MOOD * v.mood)} do temperamento${0.05 + MOOD * v.mood < 0 ? ', nunca abaixo de zero' : ''}${v.tracker === TRACKER_MAX - 1 ? ', +20% porque mais uma rejeição traz o caos' : ''}): ${ok ? '{ja}' : '{nein}'}`);
  return ok;
}

/** The last government (or investigation, or spying) this seat was part of, for what it says about it. */
function lastOwn<K extends Seen['k']>(v: View, kinds: K[], who: (e: Extract<Seen, { k: K }>) => boolean): Extract<Seen, { k: K }> | undefined {
  for (let i = v.hist.length - 1; i >= 0; i--) {
    const e = v.hist[i];
    if ((kinds as string[]).includes(e.k) && who(e as Extract<Seen, { k: K }>)) return e as Extract<Seen, { k: K }>;
  }
  return undefined;
}

/** The answer of this player to the question in its view: always one of `v.options`. */
export function decide(v: View, rand: () => number): number {
  return decideWhy(v, rand).a;
}
/** The same answer, with why it was given (D16). The decision is the same as decide's, draw for draw. */
export function decideWhy(v: View, rand: () => number): { a: number; why: Why } {
  ex = { text: [] };
  beliefCache = new WeakMap();
  try {
    const a = decideIn(v, rand);
    return { a, why: ex };
  } finally { ex = null; beliefCache = null; }
}
function decideIn(v: View, rand: () => number): number {
  const k = knob(v), o = v.options;
  if (!o.length) return -1;
  if (v.ask === 'talk') return speak(v, rand);
  if (v.ask === 'react') return react(v, rand);
  // A private peek remains valid through rejected elections, but not after any draw or chaos.
  if (k.plan && v.ask === 'vote' && v.tracker === TRACKER_MAX - 1) {
    let top: Law | undefined;
    for (let i = v.hist.length - 1; i >= 0; i--) {
      const e = v.hist[i];
      if (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos') break;
      if (e.k === 'peek' && e.by === v.me && e.saw?.length) { top = e.saw[0]; break; }
    }
    if (top && v.laws[top] === WIN[top] - 1) {
      const side: Party = fasc(v.role) ? 'F' : 'L';
      const b = believe(v);
      const safe = side === 'F' || v.laws.F < LEADER_ZONE || v.chanc !== null && b.pH[v.chanc] <= k.wary;
      const a = top === side ? 0 : safe ? 1 : -1;
      if (o.includes(a)) { rows(b, v.chanc === null ? [] : [v.pres, v.chanc]); why(top === side ? 'Viu a lei do topo: rejeitar traz o caos e a vitória do próprio lado.' : 'Viu a lei do topo: o caos daria vitória ao adversário, então tentou eleger um governo seguro.'); return a; }
    }
  }
  if (k.plan && fasc(v.role)) {
    const leader = v.known.indexOf('lider');
    // patience (D33): nominate the leader at once only while the table does not suspect him; a burnt leader waits
    const burnt = leader >= 0 && v.ask === 'nominate' && believe(v, true).pH[leader] > LEADER_BURNT;
    if (leader >= 0 && v.laws.F >= LEADER_ZONE && (v.ask === 'nominate' && o.includes(leader) && !burnt || v.ask === 'vote' && v.chanc === leader && o.includes(1))) {
      why('Eleger o {boss} agora vence a partida: priorizou a vitória.');
      return v.ask === 'vote' ? 1 : leader;
    }
    if (v.ask === 'execute' && o.includes(leader) && o.some(i => i !== leader)) {
      const safe = o.filter(i => i !== leader);
      why('Protegeu o {boss}: eliminá-lo perderia a partida.');
      return decideIn({ ...v, options: safe }, rand);
    }
  }
  // Planning levels never trade a decisive law for reputation or a random slip. Only use this seat's hand.
  // only the extreme level is sure every time; the hard one slips now and then (D33)
  if (k.plan && (k.count || rand() >= DECISIVE_SLIP) && (v.ask === 'pdiscard' || v.ask === 'cdiscard' || v.ask === 'veto')) {
    const side: Party = fasc(v.role) ? 'F' : 'L', other: Party = side === 'F' ? 'L' : 'F';
    const own = v.hand.filter(l => l === side).length;
    let decisive = -1;
    if (v.ask === 'cdiscard') {
      if (own && (v.laws[side] === WIN[side] - 1 || v.laws[other] === WIN[other] - 1)) decisive = Math.max(0, v.hand.indexOf(other));
      else if (!own && v.laws[other] === WIN[other] - 1 && o.includes(2)) decisive = 2;
    } else if (v.ask === 'pdiscard' && (own >= 1 && v.laws[side] === WIN[side] - 1 || own >= 2 && v.laws[other] === WIN[other] - 1)) {
      decisive = Math.max(0, v.hand.indexOf(other));
    } else if (v.ask === 'veto') {
      if (own === 2 && v.laws[side] === WIN[side] - 1) decisive = 0;
      else if (!own && v.laws[other] === WIN[other] - 1) decisive = 1;
    }
    if (o.includes(decisive)) { why(decisive === 2 || (v.ask === 'veto' && decisive === 1) ? 'A outra equipe venceria com essa lei: usou o veto para impedir.' : 'A lei pode decidir a partida: priorizou o próprio lado, antes de reputação ou blefe.'); return decisive; }
  }
  const talk = v.ask === 'pc' || v.ask === 'cc' || v.ask === 'inv' || v.ask === 'peek';
  const hand = v.ask === 'pdiscard' || v.ask === 'cdiscard' || v.ask === 'veto';
  if (!talk && rand() < (hand ? k.slip : k.noise)) { why(`Decidiu sem pensar: o nível${k.noise > AI[v.level].noise ? ' e o jeito dela' : ''} erra ${pc(hand ? k.slip : k.noise)} das vezes ${hand ? 'na lei que descarta' : 'em quem escolhe e como vota'}.`); return o[Math.floor(rand() * o.length)]; }
  const team = fasc(v.role), all = team && v.known.every(r => r !== null);
  const allies = all ? v.known.map((r, i) => (r && fasc(r) && i !== v.me ? i : -1)).filter(i => i >= 0) : [];
  const lider = v.known.indexOf('lider');
  const ans = all ? cultist(v, rand, allies, lider) : v.role === 'lider' ? hidden(v, rand) : liberal(v, rand);
  return o.includes(ans) ? ans : o[0];
}

/** What a player says between rounds (D13). A liberal (and Leader, who plays like one) says what it believes: whom it
 *  suspects most, or, if nobody stands out, whom it trusts. A cultist piles on the liberal the table already doubts, or
 *  vouches for a teammate. The easy level talks less. */
function speak(v: View, rand: () => number): number {
  const k = knob(v), o = v.options, others = v.alive.map((a, i) => (a && i !== v.me ? i : -1)).filter(i => i >= 0);
  if (!others.length || rand() < (v.level === 'facil' ? 0.5 : PERSONA[v.persona || 'centrado'].quiet)) { why('Ficou calada desta vez.'); return QUIET; }
  if (PERSONA[v.persona || 'centrado'].wild && rand() < 0.3) { const t = others[Math.floor(rand() * others.length)], a = 2 * t + (rand() < 0.5 ? 1 : 0); why(`É caótica: falou de ${P(t)} sem conta nenhuma.`); return o.includes(a) ? a : QUIET; }
  if (v.phase === 'vote' && v.chanc !== null) {
    const all = fasc(v.role) && v.known.every(r => r !== null), b = believe(v, all);
    const support = all ? [v.pres, v.chanc].some(i => fasc(v.known[i] as Role)) : liberalJa(v, b);
    const cabinet = [v.pres, v.chanc].filter(i => i !== v.me);
    const target = best(cabinet, i => support ? b.pF[i] : -b.pF[i], rand), a = 2 * target + (support ? 1 : 0);
    why(support ? 'Tentou reunir apoio para aprovar o governo, em vez de só esperar a votação.' : 'Pressionou a mesa a rejeitar o governo e cobrou explicação de um rival.');
    return o.includes(a) ? a : QUIET;
  }
  const base = v.cultists / Math.max(1, v.n - 1), all = fasc(v.role) && v.known.every(r => r !== null);
  const pick = (i: number, trust: boolean): number => {
    if (k.plan) {
      for (let j = v.hist.length - 1; j >= 0; j--) {
        const e = v.hist[j];
        if ((e.k === 'gov' || e.k === 'veto') && (e.pres === i || e.chanc === i) || (e.k === 'inv' || e.k === 'exec') && e.target === i) break;
        if (e.k === 'talk' && e.by === v.me && e.about === i && e.say !== 'quiet') {
          if ((e.say === 'trust') !== trust) { why('Manteve a versão anterior: não houve fato novo para mudar a história.'); trust = e.say === 'trust'; }
          break;
        }
      }
    }
    const a = 2 * i + (trust ? 1 : 0); return o.includes(a) ? a : QUIET; };
  if (all) {
    const pub = believe(v, true), libs = others.filter(i => v.known[i] === 'liberal'), mates = others.filter(i => v.known[i] !== 'liberal');
    const target = best(libs, i => -pub.pF[i], rand);
    rows(pub, others);
    if (libs.length && (pub.pF[target] >= base || rand() < k.act * 0.5)) { why(`É do lado escondido e sabe quem é liberal. Engrossou a desconfiança sobre ${P(target)}, o liberal de quem a mesa mais desconfia (${pc(pub.pF[target])}, pelo que todos viram).`); return pick(target, false); }
    if (mates.length && rand() < 0.5) { const m = best(mates, i => pub.pF[i], rand); why(`É do lado escondido: abonou ${P(m)}, um aliado.`); return pick(m, true); }
    why('É do lado escondido e preferiu não chamar atenção.');
    return QUIET;
  }
  // the hidden leader who found a teammate with his own investigation does not accuse him
  const mates = v.role === 'lider' ? new Set(v.hist.flatMap(e => (e.k === 'inv' && e.by === v.me && e.party === 'F' ? [e.target] : []))) : new Set<number>();
  const b = believe(v), free = others.filter(i => v.known[i] === null && !mates.has(i));
  if (!free.length) return QUIET;
  const worst = best(free, i => -b.pF[i], rand), clean = best(free, i => b.pF[i], rand);
  rows(b, free);
  if (b.pF[worst] >= base + (v.persona === 'desconfiado' ? 0.12 : 0.2)) { why(`Disse o que acha: ${P(worst)} é de quem mais desconfia (${pc(b.pF[worst])}; num lugar qualquer seria ${pc(base)}).`); return pick(worst, false); }
  if (b.pF[clean] <= base * 0.5) { why(`Disse o que acha: ${P(clean)} é quem parece mais limpo (${pc(b.pF[clean])}; num lugar qualquer seria ${pc(base)}).`); return pick(clean, true); }
  why('Ninguém se destaca o bastante para acusar ou abonar: ficou calada.');
  return QUIET;
}

/** How a player takes what a person just told the table (D26), the last talk in its view. A liberal (and Leader, who
 *  plays like one) goes by what it believes now, with the talk weighed in: it agrees when the one talked about now
 *  looks clearly on that side, disagrees when clearly on the other, and is unsure in between; the sceptic and the
 *  critic need more to agree. A cultist who knows the team plays for it: piles on a liberal, defends a teammate (the
 *  bluffer and the chaotic sometimes throw one under the bus to look clean). */
function react(v: View, rand: () => number): number {
  const t = v.hist[v.hist.length - 1];
  if (!t || t.k !== 'talk' || t.about < 0) return REACT.unsure;
  const before = socialMemory({ ...v, hist: v.hist.slice(0, -1) }, t.by), after = socialMemory(v, t.by);
  if (after.reversals > before.reversals) {
    why(`${P(t.by)} defendeu e depois acusou, ou mudou de lado, sem fato novo: cobrou coerência.`);
    return REACT.disagree;
  }
  if (t.say === 'acc' && claimRepeats(v.hist, v.hist.length - 1) > 1 && !backed(v.hist, 0, v.hist.length - 1, t.about, true)) {
    const n = claimRepeats(v.hist, v.hist.length - 1);
    why(`${P(t.by)} repetiu a acusação sem fato novo: cobrou uma prova e passou a desconfiar da insistência.`);
    return n >= 3 || v.persona === 'critico' || v.persona === 'cetico' ? REACT.disagree : REACT.unsure;
  }
  const acc = t.say === 'acc', base = v.cultists / Math.max(1, v.n - 1), p = PERSONA[v.persona || 'centrado'];
  if (p.wild && rand() < 0.25) { why('É caótica: reagiu sem pensar.'); return [REACT.agree, REACT.unsure, REACT.disagree][Math.floor(rand() * 3)]; }
  if (fasc(v.role) && v.known.every(r => r !== null)) {
    const ally = fasc(v.known[t.about] as Role), helps = acc !== ally;          // agreeing points the table the wrong way
    if (helps) { const yes = rand() < 0.4 + 0.4 * Math.min(1, p.bluff); why(yes ? `Sabe que ${P(t.about)} é ${ally ? 'aliado' : 'liberal'}: concordou, que leva a mesa para o lado errado.` : 'Concordaria, mas não quis chamar atenção.'); return yes ? REACT.agree : REACT.unsure; }
    if (ally && p.bluff > 1 && rand() < 0.25) { why(`${P(t.about)} é aliado, mas concordou para parecer limpa (blefe).`); return REACT.agree; }
    const no = rand() < 0.5; why(no ? `Sabe que ${P(t.about)} é ${ally ? 'aliado: defendeu' : 'liberal, e discordou de quem confiou: para lançar dúvida'}.` : 'Preferiu ficar em cima do muro.'); return no ? REACT.disagree : REACT.unsure;
  }
  if (v.role === 'lider' && v.hist.some(e => e.k === 'inv' && e.by === v.me && e.target === t.about && e.party === 'F')) { why(`Investigou ${P(t.about)} e sabe que é aliado: ${acc ? 'defendeu' : 'concordou'}.`); return acc ? REACT.disagree : REACT.agree; }
  if (v.known[t.about]) { const f = fasc(v.known[t.about] as Role); why(`Sabe o papel de ${P(t.about)}.`); return f === acc ? REACT.agree : REACT.disagree; }
  const b = believe(v), f = b.pF[t.about], need = v.persona === 'cetico' || v.persona === 'critico' ? 0.2 : v.persona === 'desconfiado' && acc ? 0.06 : 0.12;
  rows(b, [t.about]);
  const lean = acc ? f - base : base - f, a = lean >= need ? REACT.agree : lean <= -need ? REACT.disagree : REACT.unsure;
  why(`Com o que viu e ouviu, ${P(t.about)} tem ${pc(f)} de chance de ser {f} (num lugar qualquer, ${pc(base)}); precisa de ${pc(need)} de diferença para tomar partido: ${a === REACT.agree ? 'concordou' : a === REACT.disagree ? 'discordou' : 'não soube dizer'}.`);
  return a;
}

/** A liberal: plays its side by what it believes. */
function liberal(v: View, rand: () => number): number {
  const o = v.options;
  if (v.ask === 'pdiscard') {
    // the chancellor test (D22): with one cultist law in three, pass it on with a liberal one to a chancellor it is
    // unsure of, while a cultist law still costs little (before the cultists' Leader zone)
    const k = AI[v.level];
    if (k.test && nF(v.hand) === 1 && v.chanc !== null && v.laws.F < LEADER_ZONE - 1) {
      const c = believe(v).pF[v.chanc];
      if (c >= 0.25 && c <= 0.75 && rand() < k.test) { why(`Testou ${P(v.chanc)}: passou uma {f} e uma liberal para ver qual ${P(v.chanc)} aprova (tinha ${pc(c)} de dúvida sobre ele). Vai contar a verdade.`); rows(believe(v), [v.chanc]); return v.hand.indexOf('L'); }
    }
    why(v.hand.includes('F') ? 'É liberal: jogou fora uma lei {f} e passou o melhor que tinha.' : 'Só tinha liberais: qualquer uma.'); return Math.max(0, v.hand.indexOf('F'));
  }
  if (v.ask === 'cdiscard') {
    if (nF(v.hand) === 2) { const veto = o.includes(2) && v.tracker < TRACKER_MAX - 1; why(veto ? 'Recebeu 2 {fs}: pediu veto (o caos ainda não está perto).' : `Recebeu 2 {fs}: não tinha como evitar${o.includes(2) ? ' (veto arriscaria o caos)' : ''}.`); return veto ? 2 : 0; }
    why(v.hand.includes('L') ? 'É liberal: aprovou a liberal.' : 'Sem escolha.'); return Math.max(0, v.hand.indexOf('F'));
  }
  if (v.ask === 'veto') { const yes = nF(v.hand) === 2 && v.tracker < TRACKER_MAX - 1; why(nF(v.hand) === 2 ? (yes ? 'Passou 2 {fs} mesmo: aceitou o veto.' : 'Passou 2 {fs}, mas o veto traria o caos: recusou.') : 'Sabe que passou uma liberal: o chanceler quer vetar sem motivo. Recusou.'); return yes ? 1 : 0; }
  if (v.ask === 'pc') { const e = lastOwn(v, ['gov', 'veto'], e => e.pres === v.me); why(`É liberal: disse a verdade${e?.drew ? `, ${nmF(nF(e.drew), 3)}` : ''}.`); return e?.drew ? nF(e.drew) : -1; }
  if (v.ask === 'cc') { const e = lastOwn(v, ['gov', 'veto'], e => e.chanc === v.me); why(`É liberal: disse a verdade${e?.got ? `, ${nmF(nF(e.got), 2)}` : ''}.`); return e?.got ? nF(e.got) : -1; }
  if (v.ask === 'inv') { const e = lastOwn(v, ['inv'], e => e.by === v.me); why('É liberal: disse o que viu.'); return e?.party === 'F' ? 1 : 0; }
  if (v.ask === 'peek') { const e = lastOwn(v, ['peek'], e => e.by === v.me); why('É liberal: disse o que viu.'); return e?.saw ? nF(e.saw) : -1; }
  const b = believe(v);
  if (v.ask === 'vote') {
    // On higher levels, self-interest must not override an immediate Leader-election loss.
    // The leader check uses only the player's posterior, never the real hidden role.
    if (v.laws.F >= LEADER_ZONE && (v.level === 'dificil' || v.level === 'extremo')
        && b.pH[v.chanc as number] > AI[v.level].wary) {
      why(`Rejeitou o governo: a chance de ${P(v.chanc as number)} ser o {boss} (${pc(b.pH[v.chanc as number])}) é alta demais, mesmo participando do governo.`);
      rows(b, [v.pres, v.chanc as number].filter(i => i !== v.me));
      return 0;
    }
    if (v.pres === v.me || v.chanc === v.me) { why('Está no governo: {ja}'); return 1; }
    // D90: what it said this round binds its vote: it does not vote Ja on the chancellor it just accused
    if (saidAgainst(v, v.chanc as number)) { why(`Acabou de dizer que desconfia de ${P(v.chanc as number)}: {nein}, para o voto bater com a fala.`); return 0; }
    return liberalJa(v, b) ? 1 : 0;
  }
  if (v.ask === 'nominate') {
    const zone = v.laws.F >= LEADER_ZONE;
    // Stronger bots evaluate the whole proposed government rather than the chancellor in isolation.
    // An uncertain chancellor is useful early on (a government reveals evidence), but this is never
    // worth taking a large risk of electing the hidden leader after the third cultist law.
    const strategic = v.level === 'dificil' || v.level === 'extremo';
    const score = (i: number): number => {
      if (!strategic) return b.pF[i] + (zone ? 2 * b.pH[i] : 0);
      const govRisk = risk(b, [v.me, i]);
      const leaderLoss = zone ? 3 * b.pH[i] : 0;
      const uncertainty = 4 * b.pF[i] * (1 - b.pF[i]); // 0..1, maximal at 50%
      const learning = zone ? 0 : 0.08 * uncertainty;
      // With two rejected governments, favor a safer cabinet rather than gambling on chaos.
      const chaos = v.tracker === TRACKER_MAX - 1 ? 0.25 * govRisk : 0;
      const plan = governmentPlan(v, v.me, i);
      const rejection = (0.2 + (v.tracker === TRACKER_MAX - 1 ? 0.25 : 0)) * (1 - plan.approval) * (1 + 0.3 * b.pF[plan.next]);
      return govRisk + leaderLoss + chaos + rejection - learning;
    };
    const pick = requests(v, b, 'pick'), avoid = requests(v, b, 'avoid'), base = score;
    const scored = (i: number): number => base(i) - pick(i) + avoid(i) + ((zone && dirtyIn(v, i)) || barred(v, i) ? 10 : 0) + (unproven(v, i) ? 3 : 0);   // D91   // D66: what the table asked; D75: never a dirty chancellor in the zone
    rows(b, o, scored);
    why(strategic
      ? `Comparou governos completos: risco de ter alguém do lado escondido, ${zone ? 'risco imediato de eleger o {boss}' : 'informação que uma nova rodada pode revelar'}${v.tracker === TRACKER_MAX - 1 ? ' e perigo de chegar ao caos' : ''}. Considerou a maioria dos votos e a próxima presidência. Escolheu o menor risco estratégico.`
      : `Indicou quem parece mais limpo: menor chance de ser do lado escondido${zone ? ', contando em dobro a chance de ser o {boss} (já há 3 leis {fs})' : ''}.`);
    return best(o, scored, rand);
  }
  if (v.ask === 'investigate') {
    const asked = requests(v, b, 'inv'), score = (i: number): number => -(b.pF[i] * (1 - b.pF[i])) - b.pF[i] / 100 - asked(i);   // D66
    rows(b, o, i => b.pF[i] * (1 - b.pF[i]));
    why('Investigou de quem tinha mais dúvida: a chance mais perto de 50%, onde ver o partido ensina mais (investigar quem já parece limpo ou culpado quase não muda o que ela sabe). No empate, pende para o mais suspeito.');
    return best(o, score, rand);
  }
  if (v.ask === 'special') {
    const strategic = v.level === 'dificil' || v.level === 'extremo';
    // A special president will nominate the next chancellor. Avoid giving that power
    // to a likely cultist, especially when the leader-election victory is unlocked.
    const score = (i: number): number => {
      const partners = v.alive.map((a, j) => a && j !== i && j !== v.lastChanc && (v.alive.filter(Boolean).length <= SMALL_TABLE || j !== v.lastPres) ? j : -1).filter(j => j >= 0);
      const approval = strategic && partners.length ? Math.max(...partners.map(j => governmentPlan(v, i, j).approval)) : 1;
      return b.pF[i] + (strategic && v.laws.F >= LEADER_ZONE ? 0.5 * b.pH[i] : 0) + 0.2 * (1 - approval);
    };
    rows(b, o, score);
    why(strategic ? 'Escolheu presidente especial com menor risco de favorecer o lado escondido na próxima indicação.' : 'Escolheu para presidente quem parece mais limpo.');
    return best(o, score, rand);
  }
  // Executing the leader wins immediately. With five cultist laws, removing any
  // ordinary cultist is less valuable than targeting the leader; earlier, removing
  // a probable cultist also protects subsequent governments.
  const leaderWeight = v.level === 'dificil' || v.level === 'extremo'
    ? (v.laws.F >= 5 ? 4 : v.laws.F >= LEADER_ZONE ? 2 : 1)
    : 1;
  const executionScore = (i: number): number => leaderWeight * b.pH[i] + 0.3 * b.pF[i];
  rows(b, o, executionScore);
  why(`Eliminou quem oferece maior chance de derrotar o {boss}, ponderando o risco de ser do lado escondido${leaderWeight > 1 ? ' e a urgência do fim da partida' : ''}.`);
  const kill = requests(v, b, 'kill');   // D73: who the table asked it to eliminate, and on what grounds
  return best(o, i => -executionScore(i) - kill(i), rand);                                // execute
}

/** What a cultist says about its own hand, investigation or spying: the truth, unless it gives it away. */
function cultistTalk(v: View, rand: () => number, isAlly: (i: number) => boolean): number {
  const act = knob(v).act;
  const previous = v.ask === 'pc' || v.ask === 'cc' ? lastOwn(v, ['gov', 'veto'], e => v.ask === 'pc' ? e.pres === v.me : e.chanc === v.me) : undefined;
  const recorded = v.ask === 'pc' ? previous?.pc : previous?.cc;
  if (recorded !== undefined && v.options.includes(recorded)) { why('Manteve a versão que já contou sobre essa mão.'); return recorded; }
  if (v.ask === 'pc') {
    const e = lastOwn(v, ['gov', 'veto'], e => e.pres === v.me);
    if (!e?.drew || !e.got) return -1;
    const d = nF(e.drew), m = nF(e.got), law = e.k === 'veto' ? undefined : e.law, story = presStory(d, m, law);
    if (AI[v.level].plan) {
      for (let i = v.hist.lastIndexOf(e) - 1; i >= 0; i--) {
        const prior = v.hist[i];
        if (prior.k === 'gov' || prior.k === 'veto' || prior.k === 'chaos') break;
        if (prior.k === 'peek' && prior.by === v.me && prior.said !== undefined && prior.said >= m && prior.said <= m + 1 && v.options.includes(prior.said)) {
          why('Manteve o que já contou ao espiar o baralho: um blefe coerente não troca a compra sem motivo.'); return prior.said;
        }
      }
    }
    // the chancellor enacted the liberal law it was handed: a planning cultist can own up to "a test" instead of lying (D22)
    if (AI[v.level].plan && d === 1 && m === 1 && law === 'L' && rand() < 0.5) { why('Passou uma {f} e uma liberal e o chanceler aprovou a liberal: disse a verdade, como se tivesse sido um teste.'); return d; }
    const lie = story !== d && rand() < act;
    why(story === d ? `Disse a verdade (${nmF(d, 3)}): não a entrega.` : lie ? `Tirou ${nmF(d, 3)} e passou ${nmF(m, 2)}; a verdade a entregaria. Mentiu: ${nmF(story, 3)}, a história que faz o que passou parecer forçado.` : `A verdade (${nmF(d, 3)}) a entrega, mas ela não mentiu desta vez (o nível mente ${pc(act)} das vezes).`);
    return lie ? story : d;
  }
  if (v.ask === 'cc') {
    const e = lastOwn(v, ['gov', 'veto'], e => e.chanc === v.me);
    if (!e?.got) return -1;
    const m = nF(e.got), story = chancStory(m, e.k === 'veto' ? undefined : e.law);
    // D51: a chancellor never pins the blame on an allied president. It backs the president's story when there is one,
    // and otherwise takes the blame itself (the truth) when the president is the hidden leader.
    if (isAlly(e.pres) && e.pres !== v.me) {
      const backed = e.pc !== undefined && e.pc >= 0 ? Math.max(0, e.pc - 1) : -1;
      if (backed >= 0 && v.options.includes(backed)) { why(`O presidente é aliado e disse que tirou ${nmF(e.pc as number, 3)}: confirmou a história dele.`); return backed; }
      // the president said nothing (forgot or kept quiet): the chancellor still does not burn it
      if (story > m) { why(v.known[e.pres] === 'lider' ? 'O presidente é o líder e não disse nada: não pôs a culpa nele, disse a verdade e ficou com a culpa.' : 'O presidente é aliado e não disse nada: não pôs a culpa nele, disse a verdade e ficou com a culpa.'); return m; }
    }
    const lie = story !== m && rand() < act;
    why(story === m ? `Disse a verdade (${nmF(m, 2)}).` : lie ? `Recebeu ${nmF(m, 2)} e aprovou a {f}. Mentiu: ${nmF(story, 2)}, para parecer que não teve escolha.` : `A verdade a entrega, mas não mentiu desta vez (o nível mente ${pc(act)} das vezes).`);
    return lie ? story : m;
  }
  if (v.ask === 'inv') {
    const e = lastOwn(v, ['inv'], e => e.by === v.me);
    if (!e?.party) return 0;
    if (e.party === 'F' || isAlly(e.target)) { const cover = rand() < Math.max(act, 0.8); why(cover ? `Viu que ${P(e.target)} é do lado escondido e mentiu: disse liberal, para cobrir o aliado.` : `Viu que ${P(e.target)} é do lado escondido e não mentiu desta vez.`); return cover ? 0 : 1; }   // covers a teammate
    const frame = rand() < act / 2; why(frame ? `Viu que ${P(e.target)} é liberal e mentiu: disse {f}, para incriminar.` : `Viu que ${P(e.target)} é liberal e disse a verdade.`); return frame ? 1 : 0;   // frames a liberal, now and then
  }
  const e = lastOwn(v, ['peek'], e => e.by === v.me);
  why('Disse a verdade sobre as próximas leis.');
  return e?.saw ? nF(e.saw) : -1;
}

/** The best way for a cultist to play a hand, thinking about how the table will see it: each way is a law (worth 1 if
 *  cultist) and what will be said about it; it costs `image` times how much more the table would suspect this player,
 *  and Leader. Returns the index of the best way. */
function weigh(v: View, ways: { law?: Law; pc?: number; cc?: number }[], lider: number): number {
  const k = knob(v), now = believe(v, true), gov = { k: 'gov' as const, pres: v.pres, chanc: v.chanc as number };
  const watch = (b: Beliefs): number => b.pF[v.me] + (lider >= 0 && lider !== v.me ? b.pH[lider] : 0) + (v.me === lider ? b.pH[v.me] : 0);
  const base = watch(now);
  let top = 0, best = -Infinity;
  const told: string[] = [];
  ways.forEach((w, i) => {
    const after = believe({ ...v, hist: [...v.hist, { ...gov, ...(w.law ? { law: w.law } : { k: 'veto' as const }), pc: w.pc, cc: w.cc }] }, true);
    const score = (w.law === 'F' ? 1 : 0) - k.image * (watch(after) - base);
    told.push(`lei ${w.law === 'F' ? '{f}' : 'liberal'}: a desconfiança da mesa sobre ela${lider >= 0 && lider !== v.me ? ' e o {boss}' : ''} iria de ${pc(base)} para ${pc(watch(after))}, valor ${score.toFixed(2)}`);
    if (score > best + 1e-9) { best = score; top = i; }
  });
  why(`Pesou como a mesa veria cada jeito (lei {f} vale 1; cada ponto de desconfiança custa ${k.image}): ${told.join('; ')}. Ficou com a lei ${ways[top].law === 'F' ? '{f}' : 'liberal'}.`);
  return top;
}
/** The cultist laws a president who sees a hand with d of them passes on: as many as possible, or one fewer. */
const passes = (d: number): number[] => [...new Set([Math.min(2, d), Math.max(0, d - 1)])];

/** A cultist who knows its team (and Leader at a small table): plays for it, and looks like a liberal when it can. */
function cultist(v: View, rand: () => number, allies: number[], lider: number): number {
  const o = v.options, k = knob(v), isAlly = (i: number): boolean => allies.includes(i);
  const early = v.laws.F < LEADER_ZONE, clean = (): boolean => rand() < k.trust && early, fresh = (): boolean => early && EARLY_CLEAN[v.level] > 0 && rand() < EARLY_CLEAN[v.level];
  const groom = k.plan && early && lider >= 0 && v.alive[lider];
  if (v.ask === 'pc' || v.ask === 'cc' || v.ask === 'inv' || v.ask === 'peek') return cultistTalk(v, rand, isAlly);
  if (v.ask === 'pdiscard') {
    const L = v.hand.indexOf('L'), F = Math.max(0, v.hand.indexOf('F'));
    if (L < 0) { why('Só tinha {fs}: qualquer uma.'); return 0; }
    if (groom && v.chanc === lider) { why(`O chanceler é o {boss}: passou uma liberal para ele aprovar e parecer limpo antes da ${LEADER_ZONE}ª lei {f}.`); return F; }   // Leader gets a liberal law to pass
    if (isAlly(v.chanc as number)) {
      if (fresh()) { why(`O chanceler é aliado: passou uma liberal para os dois ficarem limpos antes da ${LEADER_ZONE}ª lei {f}.`); return F; }
      why('O chanceler é aliado: jogou fora a liberal e passou {fs}.'); return L;
    }
    if (fresh()) { why(`Antes da ${LEADER_ZONE}ª lei {f}, o plano é parecer liberal: passou uma liberal.`); return F; }
    if (k.image) {                                                           // the chancellor is a liberal: what will the table think?
      const d = nF(v.hand), ms = passes(d);
      const m = ms[weigh(v, ms.map(m => { const law: Law = m === 2 ? 'F' : 'L'; return { law, pc: presStory(d, m, law), cc: m }; }), lider)];
      return m === Math.min(2, d) ? L : F;
    }
    // passing two cultist laws out of a hand with one liberal means saying "I drew 3 cultist": the one who counts the
    // laws only says it when it is believable
    if (k.count && nF(v.hand) === 2 && drawOdds(Math.max(0, DECK_F - v.laws.F), Math.max(0, DECK_L - v.laws.L))[3] < 0.2) { why('Contando o baralho, dizer "tirei 3 {fs}" não seria crível: passou uma liberal.'); return F; }
    const c = clean(); why(c ? 'Deixou passar uma liberal para parecer limpa.' : 'Jogou fora a liberal e passou {fs}.'); return c ? F : L;
  }
  if (v.ask === 'cdiscard') {
    if (nF(v.hand) === 0) { why(o.includes(2) ? 'Recebeu 2 liberais: pediu veto, para não aprovar liberal.' : 'Recebeu 2 liberais: sem escolha.'); return o.includes(2) ? 2 : 0; }
    if (nF(v.hand) === 2) { why('Recebeu 2 {fs}: aprovou uma.'); return 0; }
    if (groom && v.me === lider) { why(`É o {boss}: aprovou a liberal para parecer limpo antes da ${LEADER_ZONE}ª lei {f}.`); return v.hand.indexOf('F'); }   // Leader stays clean until it pays
    if (isAlly(v.pres) && v.pres === lider && k.plan && early) { why(`O presidente é o {boss} e passou uma de cada: aprovou a liberal para limpar a barra dele antes da ${LEADER_ZONE}ª lei {f}.`); return v.hand.indexOf('F'); }
    if (fresh()) { why(`Antes da ${LEADER_ZONE}ª lei {f}, o plano é parecer liberal: aprovou a liberal.`); return v.hand.indexOf('F'); }
    if (k.image && !isAlly(v.pres)) {                                        // a liberal president passed one of each
      const ways: { law: Law; pc?: number; cc: number }[] = [{ law: 'F', cc: 2 }, { law: 'L', cc: 1 }];
      return weigh(v, ways, lider) === 0 ? v.hand.indexOf('L') : v.hand.indexOf('F');
    }
    if (isAlly(v.pres) && v.pres === lider && k.image) return weigh(v, [{ law: 'F', pc: 1, cc: 1 }, { law: 'L', pc: 1, cc: 1 }], lider) === 0 ? v.hand.indexOf('L') : v.hand.indexOf('F');
    const c = !isAlly(v.pres) && clean(); why(c ? 'Aprovou a liberal para parecer limpa.' : 'Aprovou a {f}.'); return c ? v.hand.indexOf('F') : v.hand.indexOf('L');
  }
  if (v.ask === 'veto') { why(nF(v.hand) === 0 ? 'Sabe que passou 2 liberais: aceitou o veto, para não sair liberal.' : 'Passou {fs}: recusou o veto, para sair lei {f}.'); return nF(v.hand) === 0 ? 1 : 0; }
  const pub = believe(v, true);
  if (v.ask === 'vote') {
    if (v.chanc === lider && v.laws.F >= LEADER_ZONE) { why(`O chanceler é o {boss} e já há ${LEADER_ZONE} leis {fs}: elegê-lo ganha o jogo. {ja}`); return 1; }
    if (v.pres === v.me || v.chanc === v.me) { why('Está no governo: {ja}'); return 1; }
    if (isAlly(v.pres) || isAlly(v.chanc as number)) {
      // the extreme level knows its votes are read (D22): on a government the table already doubts, it votes like a
      // liberal would, now and then, so as not to stand out next to its teammate
      if (k.count && !liberalJa(v, pub) && rand() < 0.8) { why('Há um aliado no governo, mas a mesa desconfia dele: votou {nein} para não aparecer junto.'); return 0; }
      why('Há um aliado no governo: {ja}'); return 1;
    }
    if (saidAgainst(v, v.chanc as number)) { why('Acusou o chanceler nesta rodada: {nein}, para o voto bater com a fala.'); return 0; }   // D90
    if (v.tracker === TRACKER_MAX - 1 && rand() < 0.5) { why('Mais uma rejeição traz o caos, que costuma tirar lei {f}: {nein}'); return 0; }   // the chaos plays for the cultists
    why('Nenhum aliado no governo: votou como um liberal votaria pelo que a mesa viu, para não destoar.');
    return liberalJa(v, pub) ? 1 : 0;
  }
  if (v.ask === 'nominate') {
    rows(pub, o);
    if (v.laws.F >= LEADER_ZONE && o.includes(lider) && (k.plan || pub.pH[lider] < 0.5)) { why(`Já há ${LEADER_ZONE} leis {fs}: indicou o {boss}, ${P(lider)}, para ganhar se a mesa o eleger.`); return lider; }
    if (groom && o.includes(lider) && rand() < 0.5) { why(`Indicou o {boss}, ${P(lider)}, para ele aprovar uma liberal e parecer limpo.`); return lider; }
    const mates = o.filter(isAlly);
    // the levels that read the long game know nominations are read (D22): they pick a teammate less often
    if (mates.length && rand() < (k.plan ? 0.35 : 0.6)) { const m = best(mates, i => pub.pF[i], rand); why(`Indicou um aliado, ${P(m)}, o que a mesa menos desconfia.`); return m; }
    const libs = o.filter(i => !isAlly(i)).length ? o.filter(i => !isAlly(i)) : o, pick = best(libs, i => pub.pF[i], rand);
    why(`Indicou ${P(pick)}, quem a mesa acha mais limpo, para parecer liberal.`); return pick;
  }
  if (v.ask === 'investigate') {
    rows(pub, o);
    if (k.plan && o.includes(lider) && lider !== v.me) { why(`Investigou o {boss}, ${P(lider)}, para depois dizer que ele é liberal e abonar.`); return lider; }    // to vouch for him afterwards
    const mates = o.filter(isAlly);
    if (mates.length && rand() < 0.4) { const m = best(mates, i => -pub.pF[i], rand); why(`Investigou um aliado sob suspeita, ${P(m)}, para limpar a barra dele.`); return m; }
    const libs = o.filter(i => !isAlly(i)), pick = best(libs.length ? libs : o, i => pub.pF[i], rand);
    why(`Investigou ${P(pick)}, o liberal que a mesa acha mais limpo, e pode incriminá-lo depois.`); return pick;
  }
  if (v.ask === 'special') { const mates = o.filter(isAlly), pick = best(mates.length ? mates : o, i => pub.pF[i], rand); rows(pub, o); why(mates.length ? `Deu a presidência a um aliado, ${P(pick)}.` : `Deu a presidência a ${P(pick)}.`); return pick; }
  // execute: a liberal who knows a teammate lied (it investigated one, or got caught by one), or else the one the
  // table trusts most
  const libs = o.filter(i => !isAlly(i)), saw = (i: number): number => k.plan ? v.hist.filter(e =>
    (e.k === 'inv' && e.by === i && isAlly(e.target)) || ((e.k === 'gov' || e.k === 'veto') && e.pres === i && isAlly(e.chanc) && (e.pc ?? -1) >= 0 && (e.cc ?? -1) >= 0 && Math.max(0, (e.pc as number) - 1) !== e.cc)).length : 0;
  const pick = best(libs.length ? libs : o, i => pub.pF[i] - saw(i), rand); rows(pub, o, i => pub.pF[i] - saw(i));
  why(saw(pick) ? `Eliminou ${P(pick)}, que sabe que um aliado mentiu.` : `Eliminou ${P(pick)}, o liberal em quem a mesa mais confia.`);
  return pick;
}

/** Leader who does not know his team: plays like a liberal to be trusted, lets liberal laws through early, and once
 *  enough cultist laws are on the table, keeps the cultist ones. */
function hidden(v: View, rand: () => number): number {
  const early = v.laws.F < LEADER_ZONE, k = AI[v.level];
  const seen = new Set(v.hist.flatMap(e => (e.k === 'inv' && e.by === v.me && e.party === 'F' ? [e.target] : [])));
  if (k.image && v.ask === 'pdiscard' && v.hand.includes('L') && v.hand.includes('F')) {   // weighs his image, as a cultist does
    const d = nF(v.hand), ms = passes(d);
    const m = ms[weigh(v, ms.map(m => { const law: Law = m === 2 ? 'F' : 'L'; return { law, pc: presStory(d, m, law), cc: m }; }), v.me)];
    return m === Math.min(2, d) ? v.hand.indexOf('L') : v.hand.indexOf('F');
  }
  if (k.image && v.ask === 'cdiscard' && nF(v.hand) === 1) return weigh(v, [{ law: 'F', cc: 2 }, { law: 'L', cc: 1 }], v.me) === 0 ? v.hand.indexOf('L') : v.hand.indexOf('F');
  if (v.ask === 'pdiscard') { const L = v.hand.indexOf('L'), keep = L >= 0 && !(early && rand() < 0.5 + k.trust + BOSS_STYLE[v.persona || 'centrado']); why(keep ? 'É o {boss}: jogou fora a liberal.' : 'É o {boss}: passou o melhor que tinha, para parecer liberal.'); return keep ? L : Math.max(0, v.hand.indexOf('F')); }
  if (v.ask === 'cdiscard') { const L = v.hand.indexOf('L'); if (nF(v.hand) === 1 && !(early && rand() < 0.5 + k.trust + BOSS_STYLE[v.persona || 'centrado'])) { why('É o {boss}: aprovou a {f}.'); return L; } return liberal(v, rand); }
  if (v.ask === 'veto') { why(nF(v.hand) === 0 ? 'É o {boss} e passou 2 liberais: aceitou o veto.' : 'É o {boss}: recusou o veto.'); return nF(v.hand) === 0 ? 1 : 0; }
  if (v.ask === 'pc' || v.ask === 'cc' || v.ask === 'inv' || v.ask === 'peek') return cultistTalk(v, rand, i => seen.has(i));
  if (k.plan && seen.size && (v.ask === 'nominate' || v.ask === 'special')) {
    const mates = v.options.filter(i => seen.has(i));
    if (mates.length) { const b = believe(v, true); rows(b, mates); why('É o {boss}: escolheu um aliado que descobriu investigando, preferindo quem a mesa menos suspeita.'); return best(mates, i => b.pF[i], rand); }
  }
  if (k.plan && v.ask === 'vote' && (seen.has(v.pres) || v.chanc !== null && seen.has(v.chanc))) { why('É o {boss}: há um aliado descoberto por investigação no governo. {ja}'); return 1; }
  if (v.ask === 'execute') { const b = believe(v), safe = v.options.filter(i => !seen.has(i)), options = safe.length ? safe : v.options; rows(b, options); why('É o {boss}: poupou os aliados que investigou e eliminou quem tem mais cara de liberal.'); return best(options, i => b.pF[i], rand); }   // the one most surely liberal
  return liberal(v, rand);
}

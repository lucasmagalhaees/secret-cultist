/* D95: a circuit breaker for the character sheets API. The sheets are an upgrade: the game worked without them. While
   the API answers, the breaker stays closed and every call goes out. After BREAK_AFTER failures in a row it opens: for
   a while no call is made at all (no time or battery spent on a dead server), and the game plays as it did before the
   sheets. When the wait is over it lets one probe through (half open): if it answers, the breaker closes and the
   sheets come back; if not, it opens again, waiting twice as long, up to BREAK_MAX. Pure: the clock comes in as `now`. */
export interface Breaker { fails: number; until: number; wait: number }
export const BREAK_AFTER = 2;
export const BREAK_WAIT = 2 * 60 * 1000;
export const BREAK_MAX = 60 * 60 * 1000;
export const BREAKER0: Breaker = { fails: 0, until: 0, wait: BREAK_WAIT };
export type BreakerState = 'closed' | 'open' | 'half';
export const breakerState = (b: Breaker, now: number): BreakerState => b.fails < BREAK_AFTER ? 'closed' : now < b.until ? 'open' : 'half';
/** Whether a call may go out now (closed, or the one probe of half open). */
export const breakerAllows = (b: Breaker, now: number): boolean => breakerState(b, now) !== 'open';
export const breakerOk = (): Breaker => ({ ...BREAKER0 });
export function breakerFail(b: Breaker, now: number): Breaker {
  const fails = b.fails + 1;
  if (fails < BREAK_AFTER) return { ...b, fails };
  const wait = b.fails >= BREAK_AFTER ? Math.min(BREAK_MAX, b.wait * 2) : b.wait;   // a failed probe doubles the wait
  return { fails, until: now + wait, wait };
}
/** Read what was stored; anything that does not fit is a closed breaker. */
export function readBreaker(j: unknown): Breaker {
  const o = j as Partial<Breaker> | null;
  return o && typeof o === 'object' && [o.fails, o.until, o.wait].every(x => typeof x === 'number' && Number.isFinite(x)) ? { fails: o.fails as number, until: o.until as number, wait: Math.min(BREAK_MAX, Math.max(BREAK_WAIT, o.wait as number)) } : { ...BREAKER0 };
}

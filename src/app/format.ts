/* ================= text and the page ================= */

/** Every text that did not come from the code itself goes through here before it goes into the page. */
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"'{}]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '{': '&#123;', '}': '&#125;' }[c] as string));
/** The words of the theme in a text of the code (D12): {f} {fs} {F} {boss} {ja} {nein} become the theme's. Text from
 *  outside never has a brace left in it after esc(), so it is never touched. */
export const themed = (s: string, w: Record<string, string>): string => s.replace(/\{(f|fs|F|boss|ja|nein|theme|law|lawF)\}/g, (_, k: string) => w[k] ?? _);

export const $ = <T extends Element = HTMLElement>(sel: string): T | null => document.querySelector<T>(sel);
/** A fixed part of the page (index.html), by id. */
export const part = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
export const valOf = (sel: string): string => { const el = $<HTMLInputElement>(sel); return el ? el.value : ''; };

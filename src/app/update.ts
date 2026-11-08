import { part } from './format';
import { render, toast } from './render';

/* ================= offline start and new versions =================
   The service worker (src/sw.js) keeps the page on the device. When a newer version is published, the browser installs
   it next to the one in use and it waits; the page then offers a button, and tapping it swaps versions and reloads. */
const CHECK_EVERY = 30 * 60e3;
let waiting: ServiceWorker | null = null, reg: ServiceWorkerRegistration | null = null, asked = false;

/** The commit this page was built from, as stamped by the build. */
export const builtFrom = (): string => { const m = document.querySelector<HTMLMetaElement>('meta[name="app-commit"]'); return (m && m.content) || ''; };
export const canUpdate = (): boolean => !!reg;

function offer(w: ServiceWorker | null): void {
  if (!w || !navigator.serviceWorker.controller) return;       // no controller: this is the first install, there is nothing to update from
  waiting = w; showBar();
}
function showBar(): void {
  const bar = part('update');
  bar.hidden = !waiting;
  bar.innerHTML = waiting ? `<div class="wrap"><span>${asked ? 'Atualizando…' : 'Saiu uma versão nova do app.'}</span><button class="btn" data-act="update" ${asked ? 'disabled' : ''}>Atualizar agora</button></div>` : '';
}
export function initUpdates(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  const sw = navigator.serviceWorker;
  sw.register('./sw.js').then(r => {
    reg = r; render();                 // the version card can now say that the app is kept on the device
    offer(r.waiting);
    r.addEventListener('updatefound', () => { const w = r.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); });
    const check = (): void => { r.update().catch(() => { /* no connection: try again later */ }); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, CHECK_EVERY);
  }).catch(() => { /* no service worker here: the app works as before, it just does not open without a connection */ });
  sw.addEventListener('controllerchange', () => { if (asked) location.reload(); });
}
/** The person tapped "Atualizar agora": the waiting version takes over and the page reloads into it. */
export function applyUpdate(): void {
  if (!waiting) return;
  asked = true; showBar();
  waiting.postMessage('activate');
}
/** The person asked whether there is anything newer. */
export async function checkNow(): Promise<void> {
  if (!reg) { toast('Este aparelho não guarda o app para abrir sem internet.'); return; }
  try { await reg.update(); } catch (e) { toast('Sem conexão: não deu pra procurar versão nova.'); return; }
  if (waiting || reg.installing || reg.waiting) { offer(reg.waiting); if (!waiting) toast('Baixando a versão nova…'); }
  else toast('Você já está na versão mais recente.');
}

// Entry point: wires the listeners, exposes the test handle, paints the screen and registers the service worker.
import './styles.css';
import { Core } from './core';
import { initEvents, tick } from './app/events';
import { render } from './app/render';
import { S, ui } from './app/state';
import { initUpdates } from './app/update';

initEvents();
// D102: in Secret Cultist, whatever the page shows says investigators, not liberals (one place for every screen)
const speak = (n: Node): void => {
  if (document.documentElement.dataset.pack !== 'culto') return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
  for (let t = n.nodeType === Node.TEXT_NODE ? n : w.nextNode(); t; t = w.nextNode()) { const v = t.nodeValue || '', c = Core.cultSpeak(v); if (c !== v) t.nodeValue = c; }
};
new MutationObserver(ms => ms.forEach(m => (m.type === 'characterData' ? speak(m.target) : m.addedNodes.forEach(speak)))).observe(document.body, { childList: true, subtree: true, characterData: true });
window.__APP = { Core, ui, get S() { return S; } };
render();
tick();                      // a saved game where it is an app player's turn goes on by itself
initUpdates();

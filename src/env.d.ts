/// <reference types="vite/client" />
import type { Core } from './core';
import type { AppState } from './core';
import type { Ui } from './app/state';

declare global {
  /** The handle the tests use: the core and what is on screen. */
  interface Window { __APP: { Core: typeof Core; ui: Ui; readonly S: AppState } }
}
export {};

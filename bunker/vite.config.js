import { defineConfig } from 'vite';
// D159: the bunker's page, built apart from the game's (its own folder, its own server on Cloudflare).
export default defineConfig({ root: import.meta.dirname, base: './', build: { outDir: 'dist', emptyOutDir: true } });

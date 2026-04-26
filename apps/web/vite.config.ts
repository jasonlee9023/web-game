import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@casual-game-world/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
      '@casual-game-world/game-sdk': fileURLToPath(new URL('../../packages/game-sdk/src/index.ts', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        xfwd: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        jumpCat: fileURLToPath(new URL('./games/jump-cat/index.html', import.meta.url)),
        neonDrift: fileURLToPath(new URL('./games/neon-drift/index.html', import.meta.url)),
        bubbleSortBlitz: fileURLToPath(new URL('./games/bubble-sort-blitz/index.html', import.meta.url)),
        orbitSmash: fileURLToPath(new URL('./games/orbit-smash/index.html', import.meta.url)),
        pixelHarvest: fileURLToPath(new URL('./games/pixel-harvest/index.html', import.meta.url)),
        tetraFall: fileURLToPath(new URL('./games/tetra-fall/index.html', import.meta.url)),
        brickBreaker: fileURLToPath(new URL('./games/brick-breaker/index.html', import.meta.url)),
        neoguri: fileURLToPath(new URL('./games/neoguri/index.html', import.meta.url)),
        galaga: fileURLToPath(new URL('./games/galaga/index.html', import.meta.url)),
        spaceInvaders: fileURLToPath(new URL('./games/space-invaders/index.html', import.meta.url)),
        frogger: fileURLToPath(new URL('./games/frogger/index.html', import.meta.url)),
        pongDuel: fileURLToPath(new URL('./games/pong-duel/index.html', import.meta.url)),
        dungeonQuest: fileURLToPath(new URL('./games/dungeon-quest/index.html', import.meta.url)),
        retargetLab: fileURLToPath(new URL('./games/retarget-lab/index.html', import.meta.url)),
      },
    },
  },
});

import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type FallingItem = {
  x: number;
  y: number;
  vy: number;
  type: 'star' | 'bomb';
};

createHostedGame(
  canvas,
  {
    title: 'Jump Cat',
    mode: 'normal',
    durationMs: 45_000,
    reviveMs: 12_000,
    aspectRatio: 9 / 16,
    maxWidth: 580,
    intro: '좌우로 움직이며 별을 먹고 폭탄을 피하세요.',
    palette: {
      bg: '#211916',
      bg2: '#ff7a18',
      panel: 'rgba(255,255,255,0.12)',
      text: '#fff7ee',
      accent: '#ffe083',
      accentSoft: 'rgba(255,224,131,0.32)',
      danger: '#ff5d5d',
      success: '#7effb7',
    },
  },
  (runtime) => {
    const player = {
      x: runtime.state.width / 2,
      targetX: runtime.state.width / 2,
      y: runtime.state.height - 110,
      width: 54,
      height: 52,
    };
    const items: FallingItem[] = [];
    let spawnTimer = 0;
    let combo = 0;
    let starsCollected = 0;

    function resetBoard() {
      items.length = 0;
      combo = 0;
      player.x = runtime.state.width / 2;
      player.targetX = runtime.state.width / 2;
      player.y = runtime.state.height - 110;
    }

    function spawnItem() {
      const type = Math.random() > 0.74 ? 'bomb' : 'star';
      items.push({
        x: runtime.random(44, runtime.state.width - 44),
        y: 120,
        vy: runtime.random(type === 'star' ? 240 : 290, type === 'star' ? 350 : 430),
        type,
      });
    }

    function setTarget(x: number) {
      player.targetX = clamp(x, 40, runtime.state.width - 40);
    }

    return {
      onResize() {
        resetBoard();
      },
      onRevive() {
        resetBoard();
      },
      update(deltaMs) {
        spawnTimer += deltaMs;

        if (spawnTimer > 320) {
          spawnTimer = 0;
          spawnItem();
        }

        player.x += (player.targetX - player.x) * Math.min(1, deltaMs * 0.012);

        for (let index = items.length - 1; index >= 0; index -= 1) {
          const item = items[index];
          item.y += (item.vy * deltaMs) / 1000;

          const dx = Math.abs(item.x - player.x);
          const dy = Math.abs(item.y - player.y);

          if (dx < 34 && dy < 32) {
            if (item.type === 'bomb') {
              runtime.finishRound({
                reason: 'bomb',
                starsCollected,
              });
              return;
            }

            combo += 1;
            starsCollected += 1;
            runtime.addScore(120 + combo * 15);
            items.splice(index, 1);
            continue;
          }

          if (item.y > runtime.state.height + 40) {
            if (item.type === 'star') {
              combo = 0;
            }
            items.splice(index, 1);
          }
        }
      },
      draw(context) {
        fillGradient(context.ctx, context.state.width, context.state.height, '#2a1810', '#ff7a18');

        context.ctx.fillStyle = 'rgba(255,255,255,0.07)';
        for (let row = 0; row < 8; row += 1) {
          context.ctx.fillRect(24, 120 + row * 80, context.state.width - 48, 2);
        }

        context.ctx.fillStyle = 'rgba(255,255,255,0.08)';
        context.ctx.fillRect(24, context.state.height - 170, context.state.width - 48, 98);

        for (const item of items) {
          if (item.type === 'star') {
            context.ctx.fillStyle = runtime.config.palette.accent;
            context.ctx.beginPath();
            context.ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
            context.ctx.fill();
            context.ctx.fillStyle = '#fff7ee';
            context.ctx.beginPath();
            context.ctx.arc(item.x, item.y, 5, 0, Math.PI * 2);
            context.ctx.fill();
          } else {
            context.ctx.fillStyle = runtime.config.palette.danger;
            context.ctx.beginPath();
            context.ctx.arc(item.x, item.y, 17, 0, Math.PI * 2);
            context.ctx.fill();
            context.ctx.fillStyle = '#1f0f0f';
            context.ctx.fillRect(item.x - 3, item.y - 15, 6, 10);
          }
        }

        context.ctx.fillStyle = '#fff1d8';
        drawRoundedRect(context.ctx, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height, 18);
        context.ctx.fill();
        context.ctx.beginPath();
        context.ctx.moveTo(player.x - 16, player.y - 20);
        context.ctx.lineTo(player.x - 8, player.y - 38);
        context.ctx.lineTo(player.x, player.y - 18);
        context.ctx.fill();
        context.ctx.beginPath();
        context.ctx.moveTo(player.x + 16, player.y - 20);
        context.ctx.lineTo(player.x + 8, player.y - 38);
        context.ctx.lineTo(player.x, player.y - 18);
        context.ctx.fill();

        context.ctx.fillStyle = '#392417';
        context.ctx.beginPath();
        context.ctx.arc(player.x - 10, player.y - 4, 4, 0, Math.PI * 2);
        context.ctx.arc(player.x + 10, player.y - 4, 4, 0, Math.PI * 2);
        context.ctx.fill();

        context.ctx.fillStyle = '#fff7ee';
        context.ctx.font = '600 16px Space Grotesk, sans-serif';
        context.ctx.fillText(`combo x${Math.max(1, combo)}`, 34, context.state.height - 92);
      },
      pointerDown(point) {
        setTarget(point.x);
      },
      pointerMove(point) {
        if (point.pressed) {
          setTarget(point.x);
        }
      },
      keyDown(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          setTarget(player.targetX - 68);
        }

        if (code === 'ArrowRight' || code === 'KeyD') {
          setTarget(player.targetX + 68);
        }
      },
    };
  },
);

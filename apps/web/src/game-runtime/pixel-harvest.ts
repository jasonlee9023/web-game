import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Enemy = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

type Gem = {
  x: number;
  y: number;
  radius: number;
};

createHostedGame(
  canvas,
  {
    title: 'Pixel Harvest',
    mode: 'normal',
    durationMs: 60_000,
    reviveMs: 16_000,
    aspectRatio: 4 / 3,
    maxWidth: 760,
    intro: '보석을 모으고 드론을 피해 1분 동안 살아남으세요.',
    palette: {
      bg: '#11221d',
      bg2: '#2a8b72',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f4fff9',
      accent: '#f3ff8d',
      accentSoft: 'rgba(243,255,141,0.3)',
      danger: '#ff7488',
      success: '#8effc0',
    },
  },
  (runtime) => {
    const player = {
      x: runtime.state.width / 2,
      y: runtime.state.height / 2,
      radius: 16,
    };
    const input = {
      left: false,
      right: false,
      up: false,
      down: false,
      targetX: runtime.state.width / 2,
      targetY: runtime.state.height / 2,
      usingPointer: false,
    };
    const enemies: Enemy[] = [];
    let gem: Gem = { x: 0, y: 0, radius: 12 };
    let collected = 0;

    function boundsPadding() {
      return 34;
    }

    function randomGem() {
      gem = {
        x: runtime.random(boundsPadding(), runtime.state.width - boundsPadding()),
        y: runtime.random(120, runtime.state.height - boundsPadding()),
        radius: 12,
      };
    }

    function spawnEnemy() {
      enemies.push({
        x: runtime.random(boundsPadding(), runtime.state.width - boundsPadding()),
        y: runtime.random(120, runtime.state.height - boundsPadding()),
        vx: runtime.random(-120, 120),
        vy: runtime.random(-120, 120),
        radius: runtime.random(12, 18),
      });
    }

    function resetBoard() {
      enemies.length = 0;
      player.x = runtime.state.width / 2;
      player.y = runtime.state.height / 2;
      input.targetX = player.x;
      input.targetY = player.y;
      collected = 0;
      randomGem();
      spawnEnemy();
      spawnEnemy();
    }

    return {
      onResize() {
        resetBoard();
      },
      onRevive() {
        resetBoard();
      },
      update(deltaMs) {
        const speed = 220 * (deltaMs / 1000);

        if (input.left) {
          player.x -= speed;
        }
        if (input.right) {
          player.x += speed;
        }
        if (input.up) {
          player.y -= speed;
        }
        if (input.down) {
          player.y += speed;
        }

        if (input.usingPointer) {
          player.x += (input.targetX - player.x) * Math.min(1, deltaMs * 0.009);
          player.y += (input.targetY - player.y) * Math.min(1, deltaMs * 0.009);
        }

        player.x = clamp(player.x, boundsPadding(), runtime.state.width - boundsPadding());
        player.y = clamp(player.y, 120, runtime.state.height - boundsPadding());

        for (const enemy of enemies) {
          enemy.x += (enemy.vx * deltaMs) / 1000;
          enemy.y += (enemy.vy * deltaMs) / 1000;

          if (enemy.x < boundsPadding() || enemy.x > runtime.state.width - boundsPadding()) {
            enemy.vx *= -1;
          }

          if (enemy.y < 120 || enemy.y > runtime.state.height - boundsPadding()) {
            enemy.vy *= -1;
          }

          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          if (Math.hypot(dx, dy) < enemy.radius + player.radius) {
            runtime.finishRound({
              reason: 'drone-hit',
              collected,
            });
            return;
          }
        }

        const gemDx = gem.x - player.x;
        const gemDy = gem.y - player.y;
        if (Math.hypot(gemDx, gemDy) < gem.radius + player.radius) {
          collected += 1;
          runtime.addScore(160);
          randomGem();

          if (collected % 3 === 0 && enemies.length < 6) {
            spawnEnemy();
          }
        }
      },
      draw(context) {
        fillGradient(context.ctx, context.state.width, context.state.height, '#0f231f', '#299173');

        context.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        context.ctx.lineWidth = 1;
        for (let x = 28; x < context.state.width; x += 38) {
          context.ctx.beginPath();
          context.ctx.moveTo(x, 106);
          context.ctx.lineTo(x, context.state.height - 26);
          context.ctx.stroke();
        }
        for (let y = 106; y < context.state.height; y += 38) {
          context.ctx.beginPath();
          context.ctx.moveTo(28, y);
          context.ctx.lineTo(context.state.width - 28, y);
          context.ctx.stroke();
        }

        context.ctx.fillStyle = runtime.config.palette.accent;
        context.ctx.beginPath();
        context.ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
        context.ctx.fill();

        context.ctx.fillStyle = runtime.config.palette.danger;
        for (const enemy of enemies) {
          context.ctx.beginPath();
          context.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          context.ctx.fill();
        }

        context.ctx.fillStyle = runtime.config.palette.text;
        drawRoundedRect(context.ctx, player.x - 16, player.y - 16, 32, 32, 10);
        context.ctx.fill();
        context.ctx.fillStyle = '#22443d';
        context.ctx.fillRect(player.x - 4, player.y - 4, 8, 8);

        context.ctx.fillStyle = runtime.config.palette.text;
        context.ctx.font = '600 16px Space Grotesk, sans-serif';
        context.ctx.fillText(`gems ${collected}`, 30, context.state.height - 24);
      },
      pointerDown(point) {
        input.usingPointer = true;
        input.targetX = point.x;
        input.targetY = point.y;
      },
      pointerMove(point) {
        if (!point.pressed) {
          return;
        }
        input.usingPointer = true;
        input.targetX = point.x;
        input.targetY = point.y;
      },
      pointerUp() {
        input.usingPointer = false;
      },
      keyDown(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') input.left = true;
        if (code === 'ArrowRight' || code === 'KeyD') input.right = true;
        if (code === 'ArrowUp' || code === 'KeyW') input.up = true;
        if (code === 'ArrowDown' || code === 'KeyS') input.down = true;
      },
      keyUp(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') input.left = false;
        if (code === 'ArrowRight' || code === 'KeyD') input.right = false;
        if (code === 'ArrowUp' || code === 'KeyW') input.up = false;
        if (code === 'ArrowDown' || code === 'KeyS') input.down = false;
      },
    };
  },
);


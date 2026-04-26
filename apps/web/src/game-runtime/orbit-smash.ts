import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

createHostedGame(
  canvas,
  {
    title: 'Orbit Smash',
    mode: 'normal',
    durationMs: 55_000,
    reviveMs: 14_000,
    aspectRatio: 1,
    maxWidth: 640,
    intro: '실드를 회전시켜 소행성을 튕겨내고 코어를 지키세요.',
    palette: {
      bg: '#120c29',
      bg2: '#4030a3',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f7f3ff',
      accent: '#8bf6ff',
      accentSoft: 'rgba(139,246,255,0.3)',
      danger: '#ff7a90',
      success: '#b5ffa1',
    },
  },
  (runtime) => {
    const asteroids: Asteroid[] = [];
    const input = {
      left: false,
      right: false,
      targetAngle: 0,
      usingPointer: false,
    };
    let shieldAngle = -Math.PI / 2;
    let spawnTimer = 0;
    let destroyed = 0;

    function center() {
      return {
        x: runtime.state.width / 2,
        y: runtime.state.height / 2 + 14,
      };
    }

    function orbitRadius() {
      return Math.min(runtime.state.width, runtime.state.height) * 0.28;
    }

    function spawnAsteroid() {
      const angle = runtime.random(0, Math.PI * 2);
      const distance = Math.min(runtime.state.width, runtime.state.height) * 0.58;
      const target = center();
      const x = target.x + Math.cos(angle) * distance;
      const y = target.y + Math.sin(angle) * distance;
      const dx = target.x - x;
      const dy = target.y - y;
      const length = Math.hypot(dx, dy) || 1;

      asteroids.push({
        x,
        y,
        vx: (dx / length) * runtime.random(90, 150),
        vy: (dy / length) * runtime.random(90, 150),
        radius: runtime.random(10, 18),
      });
    }

    function resetBoard() {
      asteroids.length = 0;
      shieldAngle = -Math.PI / 2;
      spawnTimer = 0;
    }

    return {
      onResize() {
        resetBoard();
      },
      onRevive() {
        resetBoard();
      },
      update(deltaMs) {
        if (input.left) {
          shieldAngle -= deltaMs * 0.0048;
        }

        if (input.right) {
          shieldAngle += deltaMs * 0.0048;
        }

        if (input.usingPointer) {
          const difference = Math.atan2(Math.sin(input.targetAngle - shieldAngle), Math.cos(input.targetAngle - shieldAngle));
          shieldAngle += difference * Math.min(1, deltaMs * 0.012);
        }

        spawnTimer += deltaMs;
        if (spawnTimer > 540) {
          spawnTimer = 0;
          spawnAsteroid();
        }

        const mid = center();
        const shieldRadius = orbitRadius();

        for (let index = asteroids.length - 1; index >= 0; index -= 1) {
          const asteroid = asteroids[index];
          asteroid.x += (asteroid.vx * deltaMs) / 1000;
          asteroid.y += (asteroid.vy * deltaMs) / 1000;

          const dx = asteroid.x - mid.x;
          const dy = asteroid.y - mid.y;
          const distance = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const angleGap = Math.abs(Math.atan2(Math.sin(angle - shieldAngle), Math.cos(angle - shieldAngle)));

          if (Math.abs(distance - shieldRadius) < 18 && angleGap < 0.42) {
            destroyed += 1;
            runtime.addScore(110);
            asteroids.splice(index, 1);
            continue;
          }

          if (distance < 34) {
            runtime.finishRound({
              reason: 'core-hit',
              destroyed,
            });
            return;
          }
        }
      },
      draw(context) {
        fillGradient(context.ctx, context.state.width, context.state.height, '#150d2d', '#4832b0');

        const mid = center();
        const shieldRadius = orbitRadius();

        context.ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let ring = 1; ring <= 3; ring += 1) {
          context.ctx.beginPath();
          context.ctx.arc(mid.x, mid.y, shieldRadius * (ring / 3), 0, Math.PI * 2);
          context.ctx.fill();
        }

        context.ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        context.ctx.lineWidth = 3;
        context.ctx.beginPath();
        context.ctx.arc(mid.x, mid.y, shieldRadius, 0, Math.PI * 2);
        context.ctx.stroke();

        context.ctx.strokeStyle = runtime.config.palette.accent;
        context.ctx.lineWidth = 14;
        context.ctx.lineCap = 'round';
        context.ctx.beginPath();
        context.ctx.arc(mid.x, mid.y, shieldRadius, shieldAngle - 0.42, shieldAngle + 0.42);
        context.ctx.stroke();
        context.ctx.lineCap = 'butt';

        context.ctx.fillStyle = runtime.config.palette.text;
        context.ctx.beginPath();
        context.ctx.arc(mid.x, mid.y, 24, 0, Math.PI * 2);
        context.ctx.fill();
        context.ctx.fillStyle = '#241b42';
        drawRoundedRect(context.ctx, mid.x - 10, mid.y - 10, 20, 20, 6);
        context.ctx.fill();

        for (const asteroid of asteroids) {
          context.ctx.fillStyle = runtime.config.palette.danger;
          context.ctx.beginPath();
          context.ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
          context.ctx.fill();
        }

        context.ctx.fillStyle = runtime.config.palette.text;
        context.ctx.font = '600 16px Space Grotesk, sans-serif';
        context.ctx.fillText(`destroyed ${destroyed}`, 30, context.state.height - 24);
      },
      pointerDown(point) {
        const mid = center();
        input.usingPointer = true;
        input.targetAngle = Math.atan2(point.y - mid.y, point.x - mid.x);
      },
      pointerMove(point) {
        if (!point.pressed) {
          return;
        }
        const mid = center();
        input.usingPointer = true;
        input.targetAngle = Math.atan2(point.y - mid.y, point.x - mid.x);
      },
      pointerUp() {
        input.usingPointer = false;
      },
      keyDown(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          input.left = true;
        }
        if (code === 'ArrowRight' || code === 'KeyD') {
          input.right = true;
        }
      },
      keyUp(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          input.left = false;
        }
        if (code === 'ArrowRight' || code === 'KeyD') {
          input.right = false;
        }
      },
    };
  },
);


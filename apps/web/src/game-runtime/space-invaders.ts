import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Bullet = {
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: string;
};

type Invader = {
  row: number;
  col: number;
  alive: boolean;
  value: number;
};

type Barrier = {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
};

createHostedGame(
  canvas,
  {
    title: 'Space Invaders',
    mode: 'normal',
    durationMs: 78_000,
    reviveMs: 14_000,
    aspectRatio: 4 / 3,
    maxWidth: 860,
    intro: '좌우 이동과 발사로 적 편대를 막아내세요.',
    palette: {
      bg: '#06090f',
      bg2: '#18334b',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f4fff8',
      accent: '#7dffb3',
      accentSoft: 'rgba(125,255,179,0.26)',
      danger: '#ff7c70',
      success: '#ffe47a',
    },
  },
  (runtime) => {
    const player = {
      x: runtime.state.width / 2,
      y: runtime.state.height - 60,
      width: 46,
      height: 24,
      speed: 360,
    };
    const input = {
      left: false,
      right: false,
      fire: false,
      usingPointer: false,
      targetX: runtime.state.width / 2,
    };
    let invaders: Invader[] = [];
    let playerBullets: Bullet[] = [];
    let enemyBullets: Bullet[] = [];
    let barriers: Barrier[] = [];
    let wave = 1;
    let destroyed = 0;
    let formationX = 0;
    let formationY = 150;
    let formationDirection = 1;
    let moveTimer = 0;
    let moveInterval = 460;
    let enemyFireTimer = 0;
    let fireCooldown = 0;

    function formationMetrics() {
      const cols = 8;
      const spacingX = 64;
      const spacingY = 42;
      const width = spacingX * (cols - 1);

      return {
        cols,
        spacingX,
        spacingY,
        width,
        minX: 74,
        maxX: runtime.state.width - 74 - width,
      };
    }

    function invaderPosition(invader: Invader) {
      const metrics = formationMetrics();

      return {
        x: formationX + invader.col * metrics.spacingX,
        y: formationY + invader.row * metrics.spacingY,
      };
    }

    function resetBarriers() {
      const y = runtime.state.height - 148;
      const width = 74;
      const height = 34;

      barriers = [0, 1, 2, 3].map((index) => ({
        x: 80 + index * ((runtime.state.width - 160) / 3),
        y,
        width,
        height,
        hp: 7,
      }));
    }

    function buildWave(level: number) {
      const metrics = formationMetrics();

      formationX = Math.max(metrics.minX, runtime.state.width / 2 - metrics.width / 2);
      formationY = 150;
      formationDirection = 1;
      moveTimer = 0;
      moveInterval = Math.max(120, 470 - level * 25);
      enemyFireTimer = 0;
      playerBullets = [];
      enemyBullets = [];
      invaders = [];

      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < metrics.cols; col += 1) {
          invaders.push({
            row,
            col,
            alive: true,
            value: 90 + (3 - row) * 25,
          });
        }
      }

      resetBarriers();
      player.x = runtime.state.width / 2;
      input.targetX = player.x;
    }

    function firePlayerBullet() {
      if (fireCooldown > 0 || playerBullets.length >= 2) {
        return;
      }

      fireCooldown = 180;
      playerBullets.push({
        x: player.x,
        y: player.y - player.height / 2 - 6,
        vy: -520,
        radius: 4,
        color: runtime.config.palette.accent,
      });
    }

    function fireEnemyBullet() {
      const bottomByColumn = new Map<number, Invader>();

      for (const invader of invaders) {
        if (!invader.alive) {
          continue;
        }

        const current = bottomByColumn.get(invader.col);
        if (!current || current.row < invader.row) {
          bottomByColumn.set(invader.col, invader);
        }
      }

      const candidates = [...bottomByColumn.values()];
      const shooter = candidates[Math.floor(runtime.random(0, candidates.length))];

      if (!shooter) {
        return;
      }

      const position = invaderPosition(shooter);
      enemyBullets.push({
        x: position.x,
        y: position.y + 18,
        vy: 250 + wave * 14,
        radius: 5,
        color: runtime.config.palette.danger,
      });
    }

    function bulletHitsRect(bullet: Bullet, left: number, top: number, width: number, height: number) {
      return (
        bullet.x >= left - bullet.radius &&
        bullet.x <= left + width + bullet.radius &&
        bullet.y >= top - bullet.radius &&
        bullet.y <= top + height + bullet.radius
      );
    }

    function drawAlien(invader: Invader) {
      const position = invaderPosition(invader);
      const flicker = (runtime.state.frame + invader.col + invader.row) % 16 < 8;
      const color = invader.row < 2 ? '#7dffb3' : invader.row === 2 ? '#ffe47a' : '#ff9b71';

      runtime.ctx.save();
      runtime.ctx.translate(position.x, position.y);
      runtime.ctx.fillStyle = color;

      if (flicker) {
        runtime.ctx.fillRect(-18, -10, 36, 6);
        runtime.ctx.fillRect(-12, -16, 8, 6);
        runtime.ctx.fillRect(4, -16, 8, 6);
        runtime.ctx.fillRect(-22, -2, 44, 8);
        runtime.ctx.fillRect(-14, 6, 8, 10);
        runtime.ctx.fillRect(6, 6, 8, 10);
      } else {
        runtime.ctx.fillRect(-16, -12, 32, 8);
        runtime.ctx.fillRect(-22, -4, 44, 8);
        runtime.ctx.fillRect(-10, 4, 20, 8);
        runtime.ctx.fillRect(-20, 8, 8, 8);
        runtime.ctx.fillRect(12, 8, 8, 8);
      }

      runtime.ctx.restore();
    }

    function finishWithReason(reason: string) {
      runtime.finishRound({
        reason,
        wave,
        destroyed,
        invadersLeft: invaders.filter((invader) => invader.alive).length,
      });
    }

    return {
      onResize() {
        player.y = runtime.state.height - 60;
        buildWave(1);
        wave = 1;
        destroyed = 0;
      },
      onRevive() {
        player.x = runtime.state.width / 2;
        input.targetX = player.x;
        playerBullets = [];
        enemyBullets = [];
      },
      update(deltaMs) {
        const deltaSeconds = deltaMs / 1000;
        fireCooldown = Math.max(0, fireCooldown - deltaMs);

        if (input.left) {
          player.x -= player.speed * deltaSeconds;
        }

        if (input.right) {
          player.x += player.speed * deltaSeconds;
        }

        if (input.usingPointer) {
          player.x += (input.targetX - player.x) * Math.min(1, deltaMs * 0.015);
        }

        player.x = clamp(player.x, 40, runtime.state.width - 40);

        if (input.fire) {
          firePlayerBullet();
        }

        moveTimer += deltaMs;
        if (moveTimer >= moveInterval) {
          moveTimer = 0;
          const aliveInvaders = invaders.filter((invader) => invader.alive);
          const positions = aliveInvaders.map((invader) => invaderPosition(invader));
          const minX = Math.min(...positions.map((position) => position.x), runtime.state.width / 2);
          const maxX = Math.max(...positions.map((position) => position.x), runtime.state.width / 2);

          if (
            (formationDirection > 0 && maxX >= runtime.state.width - 54) ||
            (formationDirection < 0 && minX <= 54)
          ) {
            formationDirection *= -1;
            formationY += 18;
          } else {
            formationX += formationDirection * 20;
          }

          moveInterval = Math.max(110, 470 - wave * 24 - (32 - aliveInvaders.length) * 8);
        }

        enemyFireTimer += deltaMs;
        if (enemyFireTimer >= Math.max(340, 920 - wave * 65)) {
          enemyFireTimer = 0;
          fireEnemyBullet();
        }

        for (let index = playerBullets.length - 1; index >= 0; index -= 1) {
          const bullet = playerBullets[index];

          if (!bullet) {
            continue;
          }

          bullet.y += bullet.vy * deltaSeconds;

          if (bullet.y < 108) {
            playerBullets.splice(index, 1);
            continue;
          }

          let consumed = false;
          for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex -= 1) {
            const barrier = barriers[barrierIndex];

            if (!barrier || !bulletHitsRect(bullet, barrier.x - barrier.width / 2, barrier.y - barrier.height / 2, barrier.width, barrier.height)) {
              continue;
            }

            barrier.hp -= 1;
            if (barrier.hp <= 0) {
              barriers.splice(barrierIndex, 1);
            }

            playerBullets.splice(index, 1);
            consumed = true;
            break;
          }

          if (consumed) {
            continue;
          }

          for (const invader of invaders) {
            if (!invader.alive) {
              continue;
            }

            const position = invaderPosition(invader);
            if (!bulletHitsRect(bullet, position.x - 22, position.y - 18, 44, 32)) {
              continue;
            }

            invader.alive = false;
            destroyed += 1;
            runtime.addScore(invader.value);
            playerBullets.splice(index, 1);
            consumed = true;
            break;
          }

          if (consumed) {
            continue;
          }
        }

        for (let index = enemyBullets.length - 1; index >= 0; index -= 1) {
          const bullet = enemyBullets[index];

          if (!bullet) {
            continue;
          }

          bullet.y += bullet.vy * deltaSeconds;

          if (bullet.y > runtime.state.height + 24) {
            enemyBullets.splice(index, 1);
            continue;
          }

          let consumed = false;
          for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex -= 1) {
            const barrier = barriers[barrierIndex];

            if (!barrier || !bulletHitsRect(bullet, barrier.x - barrier.width / 2, barrier.y - barrier.height / 2, barrier.width, barrier.height)) {
              continue;
            }

            barrier.hp -= 1;
            if (barrier.hp <= 0) {
              barriers.splice(barrierIndex, 1);
            }

            enemyBullets.splice(index, 1);
            consumed = true;
            break;
          }

          if (consumed) {
            continue;
          }

          if (bulletHitsRect(bullet, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)) {
            finishWithReason('enemy-shot');
            return;
          }
        }

        const aliveInvaders = invaders.filter((invader) => invader.alive);
        const lowestY = Math.max(...aliveInvaders.map((invader) => invaderPosition(invader).y), 0);

        if (lowestY >= player.y - 54) {
          finishWithReason('formation-breach');
          return;
        }

        if (aliveInvaders.length === 0) {
          wave += 1;
          runtime.addScore(520 + wave * 60);
          buildWave(wave);
        }
      },
      draw() {
        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#050910', '#17324a');

        runtime.ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let star = 0; star < 64; star += 1) {
          const x = ((star * 97 + runtime.state.frame * 0.4) % runtime.state.width);
          const y = 110 + ((star * 53 + runtime.state.frame * 0.7) % (runtime.state.height - 120));
          runtime.ctx.fillRect(x, y, 2, 2);
        }

        runtime.ctx.fillStyle = 'rgba(255,255,255,0.08)';
        runtime.ctx.fillRect(24, runtime.state.height - 104, runtime.state.width - 48, 1);

        for (const barrier of barriers) {
          runtime.ctx.fillStyle = barrier.hp > 4 ? '#7dffb3' : barrier.hp > 2 ? '#ffe47a' : '#ff9470';
          drawRoundedRect(
            runtime.ctx,
            barrier.x - barrier.width / 2,
            barrier.y - barrier.height / 2,
            barrier.width,
            barrier.height,
            10,
          );
          runtime.ctx.fill();
        }

        for (const invader of invaders) {
          if (!invader.alive) {
            continue;
          }

          drawAlien(invader);
        }

        for (const bullet of playerBullets) {
          runtime.ctx.fillStyle = bullet.color;
          runtime.ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 16);
        }

        for (const bullet of enemyBullets) {
          runtime.ctx.fillStyle = bullet.color;
          runtime.ctx.fillRect(bullet.x - 3, bullet.y - 7, 6, 14);
        }

        runtime.ctx.save();
        runtime.ctx.translate(player.x, player.y);
        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(0, -18);
        runtime.ctx.lineTo(18, 10);
        runtime.ctx.lineTo(8, 10);
        runtime.ctx.lineTo(8, 18);
        runtime.ctx.lineTo(-8, 18);
        runtime.ctx.lineTo(-8, 10);
        runtime.ctx.lineTo(-18, 10);
        runtime.ctx.closePath();
        runtime.ctx.fill();
        runtime.ctx.fillStyle = runtime.config.palette.accent;
        runtime.ctx.fillRect(-4, -10, 8, 18);
        runtime.ctx.restore();

        drawRoundedRect(runtime.ctx, 24, runtime.state.height - 84, runtime.state.width - 48, 48, 18);
        runtime.ctx.fillStyle = 'rgba(9, 15, 26, 0.45)';
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '600 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText(`wave ${wave}`, 42, runtime.state.height - 54);
        runtime.ctx.fillText(`destroyed ${destroyed}`, 132, runtime.state.height - 54);
        runtime.ctx.fillText(`barriers ${barriers.length}`, 274, runtime.state.height - 54);
        runtime.ctx.textAlign = 'right';
        runtime.ctx.fillText(`left ${invaders.filter((invader) => invader.alive).length}`, runtime.state.width - 40, runtime.state.height - 54);
        runtime.ctx.textAlign = 'left';
      },
      pointerDown(point) {
        input.usingPointer = true;
        input.targetX = point.x;
        input.fire = true;
      },
      pointerMove(point) {
        if (!point.pressed) {
          return;
        }

        input.usingPointer = true;
        input.targetX = point.x;
      },
      pointerUp() {
        input.usingPointer = false;
        input.fire = false;
      },
      keyDown(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          input.left = true;
        }

        if (code === 'ArrowRight' || code === 'KeyD') {
          input.right = true;
        }

        if (code === 'Space' || code === 'KeyJ' || code === 'KeyK' || code === 'Enter') {
          input.fire = true;
        }
      },
      keyUp(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          input.left = false;
        }

        if (code === 'ArrowRight' || code === 'KeyD') {
          input.right = false;
        }

        if (code === 'Space' || code === 'KeyJ' || code === 'KeyK' || code === 'Enter') {
          input.fire = false;
        }
      },
    };
  },
);

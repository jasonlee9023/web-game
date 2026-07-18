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

type Enemy = {
  row: number;
  col: number;
  width: number;
  height: number;
  color: string;
  alive: boolean;
  mode: 'formation' | 'diving';
  x: number;
  y: number;
  vx: number;
  vy: number;
  diveClock: number;
  shotCooldown: number;
};

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
};

createHostedGame(
  canvas,
  {
    title: '별무리 슈터',
    mode: 'normal',
    durationMs: 80_000,
    reviveMs: 15_000,
    aspectRatio: 4 / 3,
    maxWidth: 860,
    intro: '좌우 이동과 발사로 적 편대를 격추하세요.',
    palette: {
      bg: '#070b1c',
      bg2: '#1d2758',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f4f7ff',
      accent: '#7fffd4',
      accentSoft: 'rgba(127,255,212,0.26)',
      danger: '#ff6a88',
      success: '#ffe27a',
    },
  },
  (runtime) => {
    const player = {
      x: runtime.state.width / 2,
      y: runtime.state.height - 58,
      width: 42,
      height: 24,
      speed: 380,
    };
    const input = {
      left: false,
      right: false,
      fire: false,
      usingPointer: false,
      targetX: runtime.state.width / 2,
    };
    let stars: Star[] = [];
    let enemies: Enemy[] = [];
    let playerBullets: Bullet[] = [];
    let enemyBullets: Bullet[] = [];
    let wave = 1;
    let destroyed = 0;
    let shotsFired = 0;
    let shotsLanded = 0;
    let formationX = 0;
    let formationY = 144;
    let formationDirection = 1;
    let formationSpeed = 48;
    let fireCooldown = 0;
    let enemyFireTimer = 0;
    let diveTimer = 0;

    function formationMetrics() {
      const cols = 8;
      const spacingX = Math.min(72, (runtime.state.width - 160) / (cols - 1));
      const spacingY = 54;
      const width = spacingX * (cols - 1);

      return {
        cols,
        spacingX,
        spacingY,
        width,
        minX: 54,
        maxX: runtime.state.width - 54 - width,
      };
    }

    function syncPlayerBounds() {
      player.y = runtime.state.height - 58;
      player.x = clamp(player.x, 36, runtime.state.width - 36);
    }

    function populateStars() {
      stars = Array.from({ length: 52 }, () => ({
        x: runtime.random(0, runtime.state.width),
        y: runtime.random(110, runtime.state.height),
        radius: runtime.random(0.8, 2.3),
        speed: runtime.random(22, 76),
        alpha: runtime.random(0.25, 0.9),
      }));
    }

    function formationPosition(enemy: Enemy) {
      const { spacingX, spacingY } = formationMetrics();
      const wobbleX = Math.sin(runtime.state.elapsedMs * 0.003 + enemy.col * 0.55 + enemy.row) * 5;
      const wobbleY = Math.cos(runtime.state.elapsedMs * 0.0023 + enemy.col * 0.35) * 3;

      enemy.x = formationX + enemy.col * spacingX + wobbleX;
      enemy.y = formationY + enemy.row * spacingY + wobbleY;
    }

    function buildWave(level: number) {
      const colors = ['#ffd166', '#f78c6b', '#83e8ff', '#b388ff'];
      const metrics = formationMetrics();

      formationX = Math.max(metrics.minX, runtime.state.width / 2 - metrics.width / 2);
      formationY = 144;
      formationDirection = 1;
      formationSpeed = 44 + level * 5;
      enemyFireTimer = 260;
      diveTimer = 1600;

      enemies = [];
      playerBullets = [];
      enemyBullets = [];

      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < metrics.cols; col += 1) {
          const enemy: Enemy = {
            row,
            col,
            width: 30,
            height: 24,
            color: colors[row % colors.length] ?? '#ffffff',
            alive: true,
            mode: 'formation',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            diveClock: 0,
            shotCooldown: 0,
          };
          formationPosition(enemy);
          enemies.push(enemy);
        }
      }
    }

    function resetMatch() {
      wave = 1;
      destroyed = 0;
      shotsFired = 0;
      shotsLanded = 0;
      fireCooldown = 0;
      player.x = runtime.state.width / 2;
      input.targetX = player.x;
      syncPlayerBounds();
      populateStars();
      buildWave(wave);
    }

    function accuracy() {
      return shotsFired === 0 ? 100 : Math.round((shotsLanded / shotsFired) * 100);
    }

    function firePlayerBullet() {
      if (fireCooldown > 0) {
        return;
      }

      fireCooldown = 170;
      shotsFired += 1;
      playerBullets.push({
        x: player.x,
        y: player.y - player.height / 2 - 2,
        vy: -540,
        radius: 4,
        color: runtime.config.palette.accent,
      });
    }

    function fireEnemyBullet(x: number, y: number, speed = 240) {
      enemyBullets.push({
        x,
        y,
        vy: speed + wave * 12,
        radius: 5,
        color: runtime.config.palette.danger,
      });
    }

    function bottomFormationEnemies() {
      const columns = new Map<number, Enemy>();

      for (const enemy of enemies) {
        if (!enemy.alive || enemy.mode !== 'formation') {
          continue;
        }

        const current = columns.get(enemy.col);
        if (!current || current.row < enemy.row) {
          columns.set(enemy.col, enemy);
        }
      }

      return [...columns.values()];
    }

    function fireFormationShot() {
      const formationEnemies = bottomFormationEnemies();

      if (formationEnemies.length === 0) {
        return;
      }

      const shooter = formationEnemies[Math.floor(Math.random() * formationEnemies.length)];

      if (!shooter) {
        return;
      }

      fireEnemyBullet(shooter.x, shooter.y + shooter.height / 2);
    }

    function launchDive() {
      const candidates = enemies.filter((enemy) => enemy.alive && enemy.mode === 'formation');

      if (candidates.length === 0) {
        return;
      }

      const enemy = candidates[Math.floor(Math.random() * candidates.length)];

      if (!enemy) {
        return;
      }

      enemy.mode = 'diving';
      enemy.diveClock = 0;
      enemy.vx = enemy.x < runtime.state.width / 2 ? runtime.random(90, 140) : -runtime.random(90, 140);
      enemy.vy = runtime.random(170, 220) + wave * 12;
      enemy.shotCooldown = runtime.random(220, 680);
    }

    function enemyHitbox(enemy: Enemy) {
      return {
        left: enemy.x - enemy.width / 2,
        right: enemy.x + enemy.width / 2,
        top: enemy.y - enemy.height / 2,
        bottom: enemy.y + enemy.height / 2,
      };
    }

    function shipHit(x: number, y: number, radius: number) {
      const left = player.x - player.width / 2;
      const right = player.x + player.width / 2;
      const top = player.y - player.height / 2;
      const bottom = player.y + player.height / 2;
      const nearestX = clamp(x, left, right);
      const nearestY = clamp(y, top, bottom);
      const dx = x - nearestX;
      const dy = y - nearestY;

      return dx * dx + dy * dy < radius * radius;
    }

    function finishWithReason(reason: string) {
      runtime.finishRound({
        reason,
        wave,
        destroyed,
        accuracy: accuracy(),
      });
    }

    function drawPlayerShip() {
      runtime.ctx.save();
      runtime.ctx.translate(player.x, player.y);

      runtime.ctx.fillStyle = runtime.config.palette.text;
      runtime.ctx.beginPath();
      runtime.ctx.moveTo(0, -18);
      runtime.ctx.lineTo(18, 14);
      runtime.ctx.lineTo(8, 10);
      runtime.ctx.lineTo(3, 18);
      runtime.ctx.lineTo(-3, 18);
      runtime.ctx.lineTo(-8, 10);
      runtime.ctx.lineTo(-18, 14);
      runtime.ctx.closePath();
      runtime.ctx.fill();

      runtime.ctx.fillStyle = runtime.config.palette.accent;
      runtime.ctx.fillRect(-4, -8, 8, 18);
      runtime.ctx.fillRect(-14, 6, 8, 6);
      runtime.ctx.fillRect(6, 6, 8, 6);
      runtime.ctx.restore();
    }

    function drawEnemy(enemy: Enemy) {
      runtime.ctx.save();
      runtime.ctx.translate(enemy.x, enemy.y);

      if (enemy.mode === 'diving') {
        runtime.ctx.fillStyle = 'rgba(255,255,255,0.08)';
        runtime.ctx.beginPath();
        runtime.ctx.arc(0, 0, 24, 0, Math.PI * 2);
        runtime.ctx.fill();
      }

      runtime.ctx.fillStyle = enemy.color;
      runtime.ctx.beginPath();
      runtime.ctx.moveTo(0, -12);
      runtime.ctx.lineTo(13, -3);
      runtime.ctx.lineTo(18, 10);
      runtime.ctx.lineTo(6, 6);
      runtime.ctx.lineTo(0, 14);
      runtime.ctx.lineTo(-6, 6);
      runtime.ctx.lineTo(-18, 10);
      runtime.ctx.lineTo(-13, -3);
      runtime.ctx.closePath();
      runtime.ctx.fill();

      runtime.ctx.fillStyle = '#14203d';
      runtime.ctx.fillRect(-5, -4, 10, 10);
      runtime.ctx.fillStyle = '#ffffff';
      runtime.ctx.fillRect(-7, -8, 4, 4);
      runtime.ctx.fillRect(3, -8, 4, 4);
      runtime.ctx.restore();
    }

    return {
      onResize() {
        resetMatch();
      },
      onRevive() {
        syncPlayerBounds();
        player.x = runtime.state.width / 2;
        input.targetX = player.x;
        playerBullets = [];
        enemyBullets = [];

        for (const enemy of enemies) {
          if (!enemy.alive) {
            continue;
          }

          enemy.mode = 'formation';
          formationPosition(enemy);
        }
      },
      update(deltaMs) {
        const deltaSeconds = deltaMs / 1000;

        syncPlayerBounds();
        fireCooldown = Math.max(0, fireCooldown - deltaMs);

        if (input.left) {
          player.x -= player.speed * deltaSeconds;
        }

        if (input.right) {
          player.x += player.speed * deltaSeconds;
        }

        if (input.usingPointer) {
          player.x += (input.targetX - player.x) * Math.min(1, deltaMs * 0.012);
        }

        player.x = clamp(player.x, 36, runtime.state.width - 36);

        if (input.fire) {
          firePlayerBullet();
        }

        for (const star of stars) {
          star.y += star.speed * deltaSeconds;
          if (star.y > runtime.state.height) {
            star.x = runtime.random(0, runtime.state.width);
            star.y = runtime.random(110, 130);
          }
        }

        const metrics = formationMetrics();
        formationX += formationDirection * formationSpeed * deltaSeconds;

        if (formationX <= metrics.minX || formationX >= metrics.maxX) {
          formationDirection *= -1;
          formationX = clamp(formationX, metrics.minX, metrics.maxX);
          formationY = Math.min(runtime.state.height * 0.48, formationY + 18);
        }

        enemyFireTimer += deltaMs;
        if (enemyFireTimer >= Math.max(380, 980 - wave * 55)) {
          enemyFireTimer = 0;
          fireFormationShot();
        }

        diveTimer += deltaMs;
        if (diveTimer >= Math.max(1200, 2600 - wave * 140)) {
          diveTimer = runtime.random(0, 300);
          launchDive();
        }

        for (const enemy of enemies) {
          if (!enemy.alive) {
            continue;
          }

          if (enemy.mode === 'formation') {
            formationPosition(enemy);
            continue;
          }

          enemy.diveClock += deltaMs;
          enemy.x += (enemy.vx + Math.sin(enemy.diveClock * 0.012 + enemy.col) * 80) * deltaSeconds;
          enemy.y += enemy.vy * deltaSeconds;
          enemy.shotCooldown -= deltaMs;

          if (enemy.shotCooldown <= 0 && enemy.y < runtime.state.height - 100) {
            enemy.shotCooldown = Number.POSITIVE_INFINITY;
            fireEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 280);
          }

          if (shipHit(enemy.x, enemy.y, Math.max(enemy.width, enemy.height) * 0.55)) {
            finishWithReason('ship-collision');
            return;
          }

          if (
            enemy.y > runtime.state.height + 36 ||
            enemy.x < -48 ||
            enemy.x > runtime.state.width + 48
          ) {
            enemy.mode = 'formation';
            formationPosition(enemy);
          }
        }

        for (let bulletIndex = playerBullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
          const bullet = playerBullets[bulletIndex];

          if (!bullet) {
            continue;
          }

          bullet.y += bullet.vy * deltaSeconds;

          if (bullet.y < 104) {
            playerBullets.splice(bulletIndex, 1);
            continue;
          }

          let consumed = false;
          for (const enemy of enemies) {
            if (!enemy.alive) {
              continue;
            }

            const box = enemyHitbox(enemy);
            if (bullet.x < box.left || bullet.x > box.right || bullet.y < box.top || bullet.y > box.bottom) {
              continue;
            }

            enemy.alive = false;
            shotsLanded += 1;
            destroyed += 1;
            runtime.addScore(120 + (3 - enemy.row) * 25 + (enemy.mode === 'diving' ? 90 : 0));
            playerBullets.splice(bulletIndex, 1);
            consumed = true;
            break;
          }

          if (consumed) {
            continue;
          }
        }

        for (let bulletIndex = enemyBullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
          const bullet = enemyBullets[bulletIndex];

          if (!bullet) {
            continue;
          }

          bullet.y += bullet.vy * deltaSeconds;

          if (bullet.y > runtime.state.height + 24) {
            enemyBullets.splice(bulletIndex, 1);
            continue;
          }

          if (shipHit(bullet.x, bullet.y, bullet.radius + 2)) {
            finishWithReason('enemy-shot');
            return;
          }
        }

        if (enemies.every((enemy) => !enemy.alive)) {
          wave += 1;
          runtime.addScore(650 + wave * 80);
          buildWave(wave);
        }
      },
      draw() {
        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#070d20', '#1f2b63');

        runtime.ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let y = 110; y < runtime.state.height; y += 46) {
          runtime.ctx.fillRect(24, y, runtime.state.width - 48, 1);
        }

        for (const star of stars) {
          runtime.ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
          runtime.ctx.beginPath();
          runtime.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          runtime.ctx.fill();
        }

        runtime.ctx.fillStyle = 'rgba(127,255,212,0.08)';
        runtime.ctx.fillRect(18, runtime.state.height - 112, runtime.state.width - 36, 1);

        for (const enemy of enemies) {
          if (!enemy.alive) {
            continue;
          }

          drawEnemy(enemy);
        }

        for (const bullet of playerBullets) {
          runtime.ctx.fillStyle = bullet.color;
          runtime.ctx.beginPath();
          runtime.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
          runtime.ctx.fill();
        }

        for (const bullet of enemyBullets) {
          runtime.ctx.fillStyle = bullet.color;
          runtime.ctx.beginPath();
          runtime.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
          runtime.ctx.fill();
        }

        drawPlayerShip();

        drawRoundedRect(runtime.ctx, 22, runtime.state.height - 90, runtime.state.width - 44, 56, 20);
        runtime.ctx.fillStyle = 'rgba(9, 13, 27, 0.42)';
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '600 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText(`wave ${wave}`, 40, runtime.state.height - 56);
        runtime.ctx.fillText(`destroyed ${destroyed}`, 132, runtime.state.height - 56);
        runtime.ctx.fillText(`accuracy ${accuracy()}%`, 266, runtime.state.height - 56);
        runtime.ctx.textAlign = 'right';
        runtime.ctx.fillText(
          `left ${enemies.filter((enemy) => enemy.alive).length}`,
          runtime.state.width - 36,
          runtime.state.height - 56,
        );
        runtime.ctx.textAlign = 'left';
      },
      pointerDown(point) {
        input.usingPointer = true;
        input.fire = true;
        input.targetX = point.x;
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

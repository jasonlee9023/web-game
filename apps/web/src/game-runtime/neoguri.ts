import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Platform = {
  row: number;
  y: number;
};

type Ladder = {
  x: number;
  fromRow: number;
  toRow: number;
};

type Snack = {
  row: number;
  x: number;
  collected: boolean;
};

type Enemy = {
  row: number;
  x: number;
  vx: number;
  radius: number;
};

type ClimbState = {
  ladderIndex: number;
  direction: -1 | 1;
  targetRow: number;
};

createHostedGame(
  canvas,
  {
    title: '너구리',
    mode: 'normal',
    durationMs: 80_000,
    reviveMs: 16_000,
    aspectRatio: 4 / 3,
    maxWidth: 780,
    intro: '간식을 모두 모으고 굴러오는 적을 피해 사다리를 오르내리세요.',
    palette: {
      bg: '#182313',
      bg2: '#476f2d',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f8fff2',
      accent: '#ffd166',
      accentSoft: 'rgba(255,209,102,0.28)',
      danger: '#ff7b6b',
      success: '#9cffac',
    },
  },
  (runtime) => {
    const input = {
      left: false,
      right: false,
      targetX: runtime.state.width / 2,
      usingPointer: false,
    };

    const player = {
      x: runtime.state.width / 2,
      y: runtime.state.height - 84,
      row: 4,
      width: 28,
      height: 32,
      climbing: null as ClimbState | null,
    };

    let stage = 1;
    let platforms: Platform[] = [];
    let ladders: Ladder[] = [];
    let snacks: Snack[] = [];
    let enemies: Enemy[] = [];

    function edgePadding() {
      return 46;
    }

    function getPlatformY(row: number) {
      return platforms.find((platform) => platform.row === row)?.y ?? runtime.state.height - 80;
    }

    function setupLayout() {
      const step = (runtime.state.height - 180) / 4;
      platforms = Array.from({ length: 5 }, (_, index) => ({
        row: index,
        y: 128 + step * index,
      }));

      ladders = [
        { x: runtime.state.width * 0.22, fromRow: 4, toRow: 3 },
        { x: runtime.state.width * 0.72, fromRow: 4, toRow: 3 },
        { x: runtime.state.width * 0.48, fromRow: 3, toRow: 2 },
        { x: runtime.state.width * 0.18, fromRow: 2, toRow: 1 },
        { x: runtime.state.width * 0.68, fromRow: 2, toRow: 1 },
        { x: runtime.state.width * 0.38, fromRow: 1, toRow: 0 },
      ];
    }

    function spawnSnacks() {
      snacks = [];
      for (const platform of platforms) {
        for (const slot of [0.2, 0.5, 0.8]) {
          snacks.push({
            row: platform.row,
            x: edgePadding() + (runtime.state.width - edgePadding() * 2) * slot,
            collected: false,
          });
        }
      }
    }

    function createEnemies() {
      const enemyCount = Math.min(5, stage + 1);
      enemies = Array.from({ length: enemyCount }, (_, index) => {
        const row = index % platforms.length;
        const direction = index % 2 === 0 ? 1 : -1;
        return {
          row,
          x: direction > 0 ? edgePadding() + 8 : runtime.state.width - edgePadding() - 8,
          vx: direction * (70 + stage * 16 + index * 8),
          radius: 12,
        };
      });
    }

    function resetPlayer() {
      player.row = 4;
      player.x = runtime.state.width * 0.22;
      player.y = getPlatformY(4) - 18;
      player.climbing = null;
      input.targetX = player.x;
    }

    function resetStage() {
      setupLayout();
      spawnSnacks();
      createEnemies();
      resetPlayer();
    }

    function tryClimb(direction: -1 | 1) {
      if (player.climbing) {
        return;
      }

      const ladderIndex = ladders.findIndex((ladder) => {
        const closeEnough = Math.abs(ladder.x - player.x) < 28;
        if (!closeEnough) {
          return false;
        }

        if (direction === -1) {
          return ladder.fromRow === player.row;
        }

        return ladder.toRow === player.row;
      });

      if (ladderIndex === -1) {
        return;
      }

      const ladder = ladders[ladderIndex]!;
      player.climbing = {
        ladderIndex,
        direction,
        targetRow: direction === -1 ? ladder.toRow : ladder.fromRow,
      };
      player.x = ladder.x;
    }

    function handlePointer(pointX: number, pointY: number) {
      const ladder = ladders.find((item) => Math.abs(item.x - pointX) < 28 && Math.abs(getPlatformY(player.row) - pointY) < 90);
      if (ladder) {
        if (ladder.fromRow === player.row) {
          tryClimb(-1);
          return;
        }
        if (ladder.toRow === player.row) {
          tryClimb(1);
          return;
        }
      }

      input.usingPointer = true;
      input.targetX = pointX;
    }

    function checkSnackCollection() {
      for (const snack of snacks) {
        if (snack.collected || snack.row !== player.row || player.climbing) {
          continue;
        }

        if (Math.abs(snack.x - player.x) < 22) {
          snack.collected = true;
          runtime.addScore(140);
        }
      }

      if (snacks.every((snack) => snack.collected)) {
        stage += 1;
        runtime.addScore(420);
        spawnSnacks();
        createEnemies();
        resetPlayer();
      }
    }

    function checkEnemyCollision() {
      for (const enemy of enemies) {
        if (enemy.row !== player.row || player.climbing) {
          continue;
        }

        if (Math.abs(enemy.x - player.x) < enemy.radius + player.width * 0.4) {
          runtime.finishRound({
            reason: 'enemy-hit',
            stage,
            collected: snacks.filter((snack) => snack.collected).length,
          });
          return true;
        }
      }

      return false;
    }

    return {
      onResize() {
        resetStage();
      },
      onRevive() {
        createEnemies();
        resetPlayer();
      },
      update(deltaMs) {
        if (player.climbing) {
          const ladder = ladders[player.climbing.ladderIndex]!;
          player.x = ladder.x;
          player.y += player.climbing.direction * (deltaMs * 0.16);

          const targetY = getPlatformY(player.climbing.targetRow) - 18;
          if (
            (player.climbing.direction === -1 && player.y <= targetY) ||
            (player.climbing.direction === 1 && player.y >= targetY)
          ) {
            player.row = player.climbing.targetRow;
            player.y = targetY;
            player.climbing = null;
          }
        } else {
          if (input.left) {
            player.x -= deltaMs * 0.17;
          }
          if (input.right) {
            player.x += deltaMs * 0.17;
          }
          if (input.usingPointer) {
            player.x += (input.targetX - player.x) * Math.min(1, deltaMs * 0.01);
          }

          player.x = clamp(player.x, edgePadding(), runtime.state.width - edgePadding());
          player.y = getPlatformY(player.row) - 18;
        }

        for (const enemy of enemies) {
          enemy.x += (enemy.vx * deltaMs) / 1000;

          if (enemy.x <= edgePadding() || enemy.x >= runtime.state.width - edgePadding()) {
            enemy.vx *= -1;
            enemy.x = clamp(enemy.x, edgePadding(), runtime.state.width - edgePadding());
          }
        }

        checkSnackCollection();
        checkEnemyCollision();
      },
      draw() {
        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#162111', '#4d7c30');

        runtime.ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let x = 26; x < runtime.state.width; x += 38) {
          runtime.ctx.fillRect(x, 112, 1, runtime.state.height - 144);
        }

        for (const platform of platforms) {
          runtime.ctx.fillStyle = '#c98d58';
          drawRoundedRect(
            runtime.ctx,
            edgePadding() - 18,
            platform.y,
            runtime.state.width - (edgePadding() - 18) * 2,
            16,
            10,
          );
          runtime.ctx.fill();
          runtime.ctx.fillStyle = '#8b5a2b';
          runtime.ctx.fillRect(edgePadding() - 6, platform.y + 12, runtime.state.width - edgePadding() * 2 + 12, 5);
        }

        for (const ladder of ladders) {
          const topY = getPlatformY(ladder.toRow) + 12;
          const bottomY = getPlatformY(ladder.fromRow);
          runtime.ctx.strokeStyle = '#f6f2cc';
          runtime.ctx.lineWidth = 4;
          runtime.ctx.beginPath();
          runtime.ctx.moveTo(ladder.x - 10, topY);
          runtime.ctx.lineTo(ladder.x - 10, bottomY);
          runtime.ctx.moveTo(ladder.x + 10, topY);
          runtime.ctx.lineTo(ladder.x + 10, bottomY);
          runtime.ctx.stroke();

          for (let y = topY + 8; y < bottomY; y += 16) {
            runtime.ctx.beginPath();
            runtime.ctx.moveTo(ladder.x - 10, y);
            runtime.ctx.lineTo(ladder.x + 10, y);
            runtime.ctx.stroke();
          }
        }

        for (const snack of snacks) {
          if (snack.collected) {
            continue;
          }

          runtime.ctx.fillStyle = runtime.config.palette.accent;
          runtime.ctx.beginPath();
          runtime.ctx.arc(snack.x, getPlatformY(snack.row) - 18, 10, 0, Math.PI * 2);
          runtime.ctx.fill();
          runtime.ctx.fillStyle = '#8b4513';
          runtime.ctx.fillRect(snack.x - 2, getPlatformY(snack.row) - 31, 4, 8);
        }

        for (const enemy of enemies) {
          runtime.ctx.fillStyle = runtime.config.palette.danger;
          runtime.ctx.beginPath();
          runtime.ctx.arc(enemy.x, getPlatformY(enemy.row) - 10, enemy.radius, 0, Math.PI * 2);
          runtime.ctx.fill();
          runtime.ctx.fillStyle = 'rgba(255,255,255,0.3)';
          runtime.ctx.beginPath();
          runtime.ctx.arc(enemy.x - 4, getPlatformY(enemy.row) - 14, 4, 0, Math.PI * 2);
          runtime.ctx.fill();
        }

        runtime.ctx.fillStyle = '#f0d7b5';
        drawRoundedRect(runtime.ctx, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height, 12);
        runtime.ctx.fill();
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(player.x - 10, player.y - 14);
        runtime.ctx.lineTo(player.x - 4, player.y - 28);
        runtime.ctx.lineTo(player.x + 1, player.y - 14);
        runtime.ctx.fill();
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(player.x + 10, player.y - 14);
        runtime.ctx.lineTo(player.x + 4, player.y - 28);
        runtime.ctx.lineTo(player.x - 1, player.y - 14);
        runtime.ctx.fill();
        runtime.ctx.fillStyle = '#3b2c24';
        runtime.ctx.beginPath();
        runtime.ctx.arc(player.x - 5, player.y - 2, 2.5, 0, Math.PI * 2);
        runtime.ctx.arc(player.x + 5, player.y - 2, 2.5, 0, Math.PI * 2);
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '600 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText(`stage ${stage}`, 30, runtime.state.height - 22);
      },
      pointerDown(point) {
        handlePointer(point.x, point.y);
      },
      pointerMove(point) {
        if (point.pressed && !player.climbing) {
          input.usingPointer = true;
          input.targetX = point.x;
        }
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
        if (code === 'ArrowUp' || code === 'KeyW') {
          tryClimb(-1);
        }
        if (code === 'ArrowDown' || code === 'KeyS') {
          tryClimb(1);
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


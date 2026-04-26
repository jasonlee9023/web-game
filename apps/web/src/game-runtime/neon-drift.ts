import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Traffic = {
  lane: number;
  y: number;
  type: 'wall' | 'boost';
};

createHostedGame(
  canvas,
  {
    title: 'Neon Drift',
    mode: 'time-attack',
    durationMs: 55_000,
    reviveMs: 12_000,
    aspectRatio: 16 / 9,
    maxWidth: 860,
    intro: '차선을 바꿔 장벽을 피하고 부스트 게이트를 수집하세요.',
    palette: {
      bg: '#06111a',
      bg2: '#2c5364',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f4fffe',
      accent: '#8bfaff',
      accentSoft: 'rgba(139,250,255,0.3)',
      danger: '#ff6170',
      success: '#a2ff9f',
    },
  },
  (runtime) => {
    const laneCount = 4;
    const player = {
      lane: 1,
      laneVisual: 1,
      y: runtime.state.height - 100,
    };
    const traffic: Traffic[] = [];
    let spawnTimer = 0;
    let passed = 0;

    function laneWidth() {
      return (runtime.state.width - 140) / laneCount;
    }

    function laneCenter(lane: number) {
      return 70 + laneWidth() * lane + laneWidth() / 2;
    }

    function moveLane(nextLane: number) {
      player.lane = clamp(nextLane, 0, laneCount - 1);
    }

    function resetBoard() {
      traffic.length = 0;
      player.lane = 1;
      player.laneVisual = 1;
      passed = 0;
    }

    function spawnTraffic() {
      const boostLane = Math.random() > 0.75 ? Math.floor(runtime.random(0, laneCount)) : -1;

      for (let lane = 0; lane < laneCount; lane += 1) {
        if (lane === boostLane) {
          traffic.push({ lane, y: 124, type: 'boost' });
          continue;
        }

        if (Math.random() > 0.55) {
          traffic.push({ lane, y: 124, type: 'wall' });
        }
      }
    }

    return {
      onResize() {
        player.y = runtime.state.height - 100;
        resetBoard();
      },
      onRevive() {
        resetBoard();
      },
      update(deltaMs) {
        spawnTimer += deltaMs;
        if (spawnTimer > 620) {
          spawnTimer = 0;
          spawnTraffic();
        }

        player.laneVisual += (player.lane - player.laneVisual) * Math.min(1, deltaMs * 0.016);

        for (let index = traffic.length - 1; index >= 0; index -= 1) {
          const item = traffic[index];
          item.y += (340 * deltaMs) / 1000;

          const hitLane = Math.round(player.laneVisual) === item.lane;
          const inCollisionBand = Math.abs(item.y - player.y) < 48;

          if (hitLane && inCollisionBand) {
            if (item.type === 'wall') {
              runtime.finishRound({
                reason: 'crash',
                passed,
              });
              return;
            }

            runtime.addScore(240);
            traffic.splice(index, 1);
            continue;
          }

          if (item.y > runtime.state.height + 80) {
            if (item.type === 'wall') {
              passed += 1;
              runtime.addScore(65);
            }
            traffic.splice(index, 1);
          }
        }
      },
      draw(context) {
        fillGradient(context.ctx, context.state.width, context.state.height, '#07111b', '#294b6a');

        context.ctx.fillStyle = 'rgba(10,15,22,0.82)';
        drawRoundedRect(context.ctx, 48, 114, context.state.width - 96, context.state.height - 154, 34);
        context.ctx.fill();

        context.ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        context.ctx.lineWidth = 4;
        for (let lane = 1; lane < laneCount; lane += 1) {
          const x = 70 + laneWidth() * lane;
          for (let dash = 0; dash < 8; dash += 1) {
            context.ctx.beginPath();
            context.ctx.moveTo(x, 130 + dash * 80 + (context.state.frame % 40));
            context.ctx.lineTo(x, 170 + dash * 80 + (context.state.frame % 40));
            context.ctx.stroke();
          }
        }

        for (const item of traffic) {
          const x = laneCenter(item.lane);

          if (item.type === 'wall') {
            context.ctx.fillStyle = runtime.config.palette.danger;
            drawRoundedRect(context.ctx, x - 48, item.y - 30, 96, 60, 18);
            context.ctx.fill();
          } else {
            context.ctx.fillStyle = runtime.config.palette.accent;
            drawRoundedRect(context.ctx, x - 42, item.y - 24, 84, 48, 18);
            context.ctx.fill();
            context.ctx.fillStyle = '#07111b';
            context.ctx.font = '700 18px Space Grotesk, sans-serif';
            context.ctx.textAlign = 'center';
            context.ctx.fillText('BOOST', x, item.y + 6);
            context.ctx.textAlign = 'left';
          }
        }

        const playerX = laneCenter(player.laneVisual);
        context.ctx.fillStyle = '#f0fffe';
        drawRoundedRect(context.ctx, playerX - 34, player.y - 44, 68, 88, 24);
        context.ctx.fill();
        context.ctx.fillStyle = runtime.config.palette.accent;
        context.ctx.fillRect(playerX - 8, player.y - 16, 16, 32);
      },
      pointerDown(point) {
        const nextLane = Math.floor((point.x - 70) / laneWidth());
        moveLane(nextLane);
      },
      keyDown(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          moveLane(player.lane - 1);
        }

        if (code === 'ArrowRight' || code === 'KeyD') {
          moveLane(player.lane + 1);
        }
      },
    };
  },
);

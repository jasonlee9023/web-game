import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

createHostedGame(
  canvas,
  {
    title: 'Pong Duel',
    mode: 'normal',
    durationMs: 74_000,
    reviveMs: 14_000,
    aspectRatio: 4 / 3,
    maxWidth: 860,
    intro: '패들을 움직여 AI를 상대로 7점을 먼저 만드세요.',
    palette: {
      bg: '#0d1020',
      bg2: '#244074',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f6f8ff',
      accent: '#8fd7ff',
      accentSoft: 'rgba(143,215,255,0.24)',
      danger: '#ff7d8a',
      success: '#ffe070',
    },
  },
  (runtime) => {
    const paddleHeight = 92;
    const paddleWidth = 16;
    const player = {
      x: 42,
      y: runtime.state.height / 2,
      speed: 430,
    };
    const ai = {
      x: runtime.state.width - 42,
      y: runtime.state.height / 2,
      speed: 340,
    };
    const ball = {
      x: runtime.state.width / 2,
      y: runtime.state.height / 2,
      vx: 240,
      vy: 90,
      radius: 10,
    };
    const input = {
      up: false,
      down: false,
      usingPointer: false,
      targetY: runtime.state.height / 2,
    };
    let playerPoints = 0;
    let aiPoints = 0;
    let rally = 0;
    let longestRally = 0;

    function applyScore() {
      runtime.setScore(playerPoints * 280 + longestRally * 24 + rally * 4);
    }

    function resetRound(direction: 1 | -1) {
      ball.x = runtime.state.width / 2;
      ball.y = runtime.state.height / 2;
      ball.vx = direction * (240 + Math.min(120, longestRally * 8));
      ball.vy = runtime.random(-160, 160);
      rally = 0;
    }

    function resetMatch() {
      playerPoints = 0;
      aiPoints = 0;
      longestRally = 0;
      player.y = runtime.state.height / 2;
      ai.y = runtime.state.height / 2;
      input.targetY = player.y;
      resetRound(Math.random() > 0.5 ? 1 : -1);
      applyScore();
    }

    function paddleHit(paddleX: number, paddleY: number, direction: 1 | -1) {
      if (
        Math.abs(ball.x - paddleX) > paddleWidth / 2 + ball.radius ||
        Math.abs(ball.y - paddleY) > paddleHeight / 2 + ball.radius
      ) {
        return false;
      }

      const impact = (ball.y - paddleY) / (paddleHeight / 2);
      const speed = Math.min(520, Math.abs(ball.vx) + 24);

      ball.vx = direction * speed;
      ball.vy = impact * 260;
      rally += 1;
      longestRally = Math.max(longestRally, rally);
      runtime.addScore(8);
      applyScore();
      return true;
    }

    function finishWithReason(reason: string) {
      runtime.finishRound({
        reason,
        playerPoints,
        aiPoints,
        longestRally,
      });
    }

    return {
      onResize() {
        player.x = 42;
        ai.x = runtime.state.width - 42;
        resetMatch();
      },
      onRevive() {
        player.y = runtime.state.height / 2;
        ai.y = runtime.state.height / 2;
        input.targetY = player.y;
        resetRound(-1);
      },
      update(deltaMs) {
        const deltaSeconds = deltaMs / 1000;

        if (input.up) {
          player.y -= player.speed * deltaSeconds;
        }

        if (input.down) {
          player.y += player.speed * deltaSeconds;
        }

        if (input.usingPointer) {
          player.y += (input.targetY - player.y) * Math.min(1, deltaMs * 0.016);
        }

        player.y = clamp(player.y, 128 + paddleHeight / 2, runtime.state.height - 42 - paddleHeight / 2);

        const aiTarget = ball.y + (ball.vx > 0 ? ball.vy * 0.08 : 0);
        ai.y += clamp(aiTarget - ai.y, -ai.speed * deltaSeconds, ai.speed * deltaSeconds);
        ai.y = clamp(ai.y, 128 + paddleHeight / 2, runtime.state.height - 42 - paddleHeight / 2);

        ball.x += ball.vx * deltaSeconds;
        ball.y += ball.vy * deltaSeconds;

        if (ball.y <= 112 + ball.radius || ball.y >= runtime.state.height - 28 - ball.radius) {
          ball.vy *= -1;
          ball.y = clamp(ball.y, 112 + ball.radius, runtime.state.height - 28 - ball.radius);
        }

        if (ball.vx < 0) {
          paddleHit(player.x, player.y, 1);
        } else {
          paddleHit(ai.x, ai.y, -1);
        }

        if (ball.x < -28) {
          aiPoints += 1;
          applyScore();
          if (aiPoints >= 7) {
            finishWithReason('match-lost');
            return;
          }

          resetRound(-1);
          return;
        }

        if (ball.x > runtime.state.width + 28) {
          playerPoints += 1;
          runtime.addScore(180);
          applyScore();
          if (playerPoints >= 7) {
            finishWithReason('match-won');
            return;
          }

          resetRound(1);
        }
      },
      draw() {
        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#0d1020', '#244074');

        runtime.ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        runtime.ctx.lineWidth = 4;
        runtime.ctx.setLineDash([12, 18]);
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(runtime.state.width / 2, 110);
        runtime.ctx.lineTo(runtime.state.width / 2, runtime.state.height - 30);
        runtime.ctx.stroke();
        runtime.ctx.setLineDash([]);

        runtime.ctx.fillStyle = 'rgba(255,255,255,0.08)';
        drawRoundedRect(runtime.ctx, 22, 112, runtime.state.width - 44, runtime.state.height - 140, 28);
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        drawRoundedRect(runtime.ctx, player.x - paddleWidth / 2, player.y - paddleHeight / 2, paddleWidth, paddleHeight, 8);
        runtime.ctx.fill();
        drawRoundedRect(runtime.ctx, ai.x - paddleWidth / 2, ai.y - paddleHeight / 2, paddleWidth, paddleHeight, 8);
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.accent;
        runtime.ctx.beginPath();
        runtime.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '700 42px Space Grotesk, sans-serif';
        runtime.ctx.textAlign = 'center';
        runtime.ctx.fillText(`${playerPoints}`, runtime.state.width / 2 - 54, 154);
        runtime.ctx.fillText(`${aiPoints}`, runtime.state.width / 2 + 54, 154);
        runtime.ctx.textAlign = 'left';

        drawRoundedRect(runtime.ctx, 24, runtime.state.height - 76, runtime.state.width - 48, 42, 18);
        runtime.ctx.fillStyle = 'rgba(10, 15, 26, 0.42)';
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '600 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText(`rally ${rally}`, 42, runtime.state.height - 48);
        runtime.ctx.fillText(`longest ${longestRally}`, 130, runtime.state.height - 48);
        runtime.ctx.textAlign = 'right';
        runtime.ctx.fillText(`drag or arrows`, runtime.state.width - 40, runtime.state.height - 48);
        runtime.ctx.textAlign = 'left';
      },
      pointerDown(point) {
        input.usingPointer = true;
        input.targetY = point.y;
      },
      pointerMove(point) {
        if (!point.pressed) {
          return;
        }

        input.usingPointer = true;
        input.targetY = point.y;
      },
      pointerUp() {
        input.usingPointer = false;
      },
      keyDown(code) {
        if (code === 'ArrowUp' || code === 'KeyW') {
          input.up = true;
        }

        if (code === 'ArrowDown' || code === 'KeyS') {
          input.down = true;
        }
      },
      keyUp(code) {
        if (code === 'ArrowUp' || code === 'KeyW') {
          input.up = false;
        }

        if (code === 'ArrowDown' || code === 'KeyS') {
          input.down = false;
        }
      },
    };
  },
);

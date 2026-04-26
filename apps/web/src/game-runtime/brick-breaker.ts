import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  color: string;
};

createHostedGame(
  canvas,
  {
    title: 'Brick Breaker',
    mode: 'normal',
    durationMs: 75_000,
    reviveMs: 15_000,
    aspectRatio: 4 / 3,
    maxWidth: 820,
    intro: '패들을 움직여 공을 튕기고 모든 브릭을 깨세요.',
    palette: {
      bg: '#0f1b2d',
      bg2: '#214a74',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f5fbff',
      accent: '#8de3ff',
      accentSoft: 'rgba(141,227,255,0.28)',
      danger: '#ff7e72',
      success: '#96ffb9',
    },
  },
  (runtime) => {
    const paddle = {
      x: runtime.state.width / 2 - 56,
      width: 112,
      height: 16,
      speed: 420,
    };
    const ball = {
      x: runtime.state.width / 2,
      y: runtime.state.height - 78,
      vx: 180,
      vy: -240,
      radius: 10,
      stuck: true,
    };
    const input = {
      left: false,
      right: false,
      targetX: runtime.state.width / 2,
      usingPointer: false,
    };
    let bricks: Brick[] = [];
    let livesLost = 0;

    function createBricks() {
      bricks = [];
      const rows = 6;
      const cols = 8;
      const gap = 8;
      const width = (runtime.state.width - 80 - gap * (cols - 1)) / cols;
      const colors = ['#93c5fd', '#a7f3d0', '#fde68a', '#fca5a5', '#c4b5fd', '#fdba74'];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          bricks.push({
            x: 40 + col * (width + gap),
            y: 128 + row * 30,
            width,
            height: 22,
            hits: row % 3 === 0 ? 2 : 1,
            color: colors[row % colors.length]!,
          });
        }
      }
    }

    function resetPositions() {
      paddle.x = runtime.state.width / 2 - paddle.width / 2;
      ball.x = paddle.x + paddle.width / 2;
      ball.y = runtime.state.height - 78;
      ball.vx = 180;
      ball.vy = -240;
      ball.stuck = true;
      input.targetX = ball.x;
    }

    function resetGame() {
      createBricks();
      livesLost = 0;
      resetPositions();
    }

    function clampPaddle() {
      paddle.x = clamp(paddle.x, 24, runtime.state.width - paddle.width - 24);
      if (ball.stuck) {
        ball.x = paddle.x + paddle.width / 2;
      }
    }

    function releaseBall() {
      if (ball.stuck) {
        ball.stuck = false;
      }
    }

    function brickCollision(brick: Brick) {
      const nearestX = clamp(ball.x, brick.x, brick.x + brick.width);
      const nearestY = clamp(ball.y, brick.y, brick.y + brick.height);
      const dx = ball.x - nearestX;
      const dy = ball.y - nearestY;

      return dx * dx + dy * dy < ball.radius * ball.radius;
    }

    return {
      onResize() {
        resetGame();
      },
      onRevive() {
        resetPositions();
      },
      update(deltaMs) {
        if (input.left) {
          paddle.x -= paddle.speed * (deltaMs / 1000);
        }

        if (input.right) {
          paddle.x += paddle.speed * (deltaMs / 1000);
        }

        if (input.usingPointer) {
          paddle.x += (input.targetX - paddle.width / 2 - paddle.x) * Math.min(1, deltaMs * 0.015);
        }

        clampPaddle();

        if (ball.stuck) {
          return;
        }

        ball.x += ball.vx * (deltaMs / 1000);
        ball.y += ball.vy * (deltaMs / 1000);

        if (ball.x <= ball.radius + 16 || ball.x >= runtime.state.width - ball.radius - 16) {
          ball.vx *= -1;
          ball.x = clamp(ball.x, ball.radius + 16, runtime.state.width - ball.radius - 16);
        }

        if (ball.y <= ball.radius + 110) {
          ball.vy *= -1;
          ball.y = ball.radius + 110;
        }

        if (
          ball.y + ball.radius >= runtime.state.height - 54 &&
          ball.y + ball.radius <= runtime.state.height - 30 &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.width &&
          ball.vy > 0
        ) {
          const hitRatio = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          ball.vx = hitRatio * 300;
          ball.vy = -Math.abs(ball.vy) - 10;
        }

        for (let index = bricks.length - 1; index >= 0; index -= 1) {
          const brick = bricks[index]!;
          if (!brickCollision(brick)) {
            continue;
          }

          brick.hits -= 1;
          ball.vy *= -1;
          runtime.addScore(brick.hits <= 0 ? 90 : 35);

          if (brick.hits <= 0) {
            bricks.splice(index, 1);
          }

          break;
        }

        if (bricks.length === 0) {
          createBricks();
          resetPositions();
          runtime.addScore(500);
          return;
        }

        if (ball.y - ball.radius > runtime.state.height) {
          livesLost += 1;

          if (livesLost >= 2) {
            runtime.finishRound({
              reason: 'ball-out',
              bricksDestroyed: 48 - bricks.length,
            });
            return;
          }

          resetPositions();
        }
      },
      draw() {
        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#0f1d2f', '#285d84');

        runtime.ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let y = 116; y < runtime.state.height; y += 34) {
          runtime.ctx.fillRect(20, y, runtime.state.width - 40, 1);
        }

        for (const brick of bricks) {
          runtime.ctx.fillStyle = brick.color;
          drawRoundedRect(runtime.ctx, brick.x, brick.y, brick.width, brick.height, 8);
          runtime.ctx.fill();

          if (brick.hits > 1) {
            runtime.ctx.fillStyle = 'rgba(15,27,45,0.4)';
            runtime.ctx.font = '700 12px Space Grotesk, sans-serif';
            runtime.ctx.textAlign = 'center';
            runtime.ctx.fillText(`${brick.hits}`, brick.x + brick.width / 2, brick.y + 15);
            runtime.ctx.textAlign = 'left';
          }
        }

        runtime.ctx.fillStyle = runtime.config.palette.text;
        drawRoundedRect(runtime.ctx, paddle.x, runtime.state.height - 50, paddle.width, paddle.height, 10);
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.accent;
        runtime.ctx.beginPath();
        runtime.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '600 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText(`round ${48 - bricks.length}/48`, 30, runtime.state.height - 18);
        runtime.ctx.textAlign = 'right';
        runtime.ctx.fillText(`mistakes ${livesLost}/2`, runtime.state.width - 26, runtime.state.height - 18);
        runtime.ctx.textAlign = 'left';
      },
      pointerDown(point) {
        input.usingPointer = true;
        input.targetX = point.x;
        releaseBall();
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
      },
      keyDown(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          input.left = true;
        }
        if (code === 'ArrowRight' || code === 'KeyD') {
          input.right = true;
        }
        if (code === 'Space') {
          releaseBall();
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


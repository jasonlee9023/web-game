import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Cell = number;
type PieceDefinition = {
  rotations: number[][][];
  color: string;
};

type ActivePiece = {
  type: number;
  rotation: number;
  x: number;
  y: number;
};

const COLS = 10;
const ROWS = 20;

const PIECES: PieceDefinition[] = [
  {
    color: '#67e8f9',
    rotations: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },
  {
    color: '#c084fc',
    rotations: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  {
    color: '#f472b6',
    rotations: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  {
    color: '#f59e0b',
    rotations: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
  },
  {
    color: '#fb7185',
    rotations: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
  },
  {
    color: '#4ade80',
    rotations: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  {
    color: '#fde047',
    rotations: [
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
    ],
  },
];

createHostedGame(
  canvas,
  {
    title: 'Tetra Fall',
    mode: 'normal',
    durationMs: 90_000,
    reviveMs: 18_000,
    aspectRatio: 10 / 16,
    maxWidth: 560,
    intro: '블록을 쌓아 줄을 지우세요. 좌우 이동, 회전, 빠른 낙하 지원.',
    palette: {
      bg: '#141825',
      bg2: '#2b3756',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f5f7ff',
      accent: '#8ab4ff',
      accentSoft: 'rgba(138,180,255,0.28)',
      danger: '#ff7b8b',
      success: '#90f7b8',
    },
  },
  (runtime) => {
    let board: Cell[][] = [];
    let active: ActivePiece | null = null;
    let nextType = 0;
    let gravityTimer = 0;
    let linesCleared = 0;

    function createBoard() {
      board = Array.from({ length: ROWS }, () => Array.from<Cell>({ length: COLS }).fill(-1));
    }

    function randomType() {
      return Math.floor(runtime.random(0, PIECES.length));
    }

    function resetGame() {
      createBoard();
      nextType = randomType();
      linesCleared = 0;
      gravityTimer = 0;
      spawnPiece();
    }

    function pieceShape(piece: ActivePiece) {
      return PIECES[piece.type].rotations[piece.rotation];
    }

    function spawnPiece() {
      const type = nextType;
      nextType = randomType();
      active = {
        type,
        rotation: 0,
        x: 3,
        y: -1,
      };

      if (collides(active.x, active.y, active.rotation)) {
        runtime.finishRound({
          reason: 'stack-topout',
          linesCleared,
        });
      }
    }

    function collides(testX: number, testY: number, rotation: number) {
      if (!active) {
        return false;
      }

      const shape = PIECES[active.type].rotations[rotation];

      for (let row = 0; row < shape.length; row += 1) {
        for (let col = 0; col < shape[row]!.length; col += 1) {
          if (!shape[row]![col]) {
            continue;
          }

          const boardX = testX + col;
          const boardY = testY + row;

          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true;
          }

          if (boardY >= 0 && board[boardY]![boardX]! >= 0) {
            return true;
          }
        }
      }

      return false;
    }

    function mergePiece() {
      if (!active) {
        return;
      }

      const shape = pieceShape(active);

      for (let row = 0; row < shape.length; row += 1) {
        for (let col = 0; col < shape[row]!.length; col += 1) {
          if (!shape[row]![col]) {
            continue;
          }
          const boardX = active.x + col;
          const boardY = active.y + row;

          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            board[boardY]![boardX] = active.type;
          }
        }
      }
    }

    function clearLines() {
      let cleared = 0;

      for (let row = ROWS - 1; row >= 0; row -= 1) {
        if (board[row]!.every((cell) => cell >= 0)) {
          board.splice(row, 1);
          board.unshift(Array.from<Cell>({ length: COLS }).fill(-1));
          cleared += 1;
          row += 1;
        }
      }

      if (cleared > 0) {
        linesCleared += cleared;
        runtime.addScore([0, 120, 320, 560, 900][cleared] ?? cleared * 300);
      }
    }

    function lockPiece() {
      mergePiece();
      clearLines();
      spawnPiece();
    }

    function tryMove(dx: number, dy: number) {
      if (!active) {
        return false;
      }

      const nextX = active.x + dx;
      const nextY = active.y + dy;

      if (collides(nextX, nextY, active.rotation)) {
        if (dy > 0) {
          lockPiece();
        }
        return false;
      }

      active.x = nextX;
      active.y = nextY;
      return true;
    }

    function tryRotate() {
      if (!active) {
        return;
      }

      const nextRotation = (active.rotation + 1) % 4;
      const kicks = [0, -1, 1, -2, 2];

      for (const kick of kicks) {
        if (!collides(active.x + kick, active.y, nextRotation)) {
          active.rotation = nextRotation;
          active.x += kick;
          return;
        }
      }
    }

    function hardDrop() {
      if (!active) {
        return;
      }

      let dropped = 0;
      while (tryMove(0, 1)) {
        dropped += 1;
      }
      runtime.addScore(dropped * 6);
    }

    function boardMetrics() {
      const availableWidth = runtime.state.width - 64;
      const size = Math.floor(Math.min(availableWidth / (COLS + 4), (runtime.state.height - 172) / ROWS));
      const boardWidth = size * COLS;
      const boardHeight = size * ROWS;
      const offsetX = 30;
      const offsetY = 118;
      const previewX = offsetX + boardWidth + 22;
      return { size, boardWidth, boardHeight, offsetX, offsetY, previewX };
    }

    function drawCell(x: number, y: number, size: number, color: string) {
      runtime.ctx.fillStyle = color;
      drawRoundedRect(runtime.ctx, x + 1, y + 1, size - 2, size - 2, Math.max(5, size * 0.18));
      runtime.ctx.fill();
      runtime.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      drawRoundedRect(runtime.ctx, x + 4, y + 4, size - 12, size * 0.22, Math.max(3, size * 0.08));
      runtime.ctx.fill();
    }

    function handleTouchControl(pointX: number, pointY: number) {
      const { offsetY } = boardMetrics();
      if (pointY < offsetY) {
        return;
      }

      const band = pointY > runtime.state.height - 120;
      if (!band) {
        return;
      }

      const zone = pointX / runtime.state.width;
      if (zone < 0.24) {
        tryMove(-1, 0);
      } else if (zone < 0.48) {
        tryMove(1, 0);
      } else if (zone < 0.72) {
        tryRotate();
      } else {
        hardDrop();
      }
    }

    return {
      onResize() {
        resetGame();
      },
      onRevive() {
        if (!active) {
          spawnPiece();
        }
      },
      update(deltaMs) {
        if (!active) {
          return;
        }

        gravityTimer += deltaMs;
        const interval = Math.max(90, 620 - linesCleared * 14);

        if (gravityTimer >= interval) {
          gravityTimer = 0;
          tryMove(0, 1);
        }
      },
      draw() {
        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#121826', '#34446a');

        const { size, boardWidth, boardHeight, offsetX, offsetY, previewX } = boardMetrics();

        drawRoundedRect(runtime.ctx, offsetX - 10, offsetY - 10, boardWidth + 20, boardHeight + 20, 24);
        runtime.ctx.fillStyle = 'rgba(8, 12, 18, 0.42)';
        runtime.ctx.fill();

        for (let row = 0; row < ROWS; row += 1) {
          for (let col = 0; col < COLS; col += 1) {
            const x = offsetX + col * size;
            const y = offsetY + row * size;
            runtime.ctx.fillStyle = 'rgba(255,255,255,0.05)';
            drawRoundedRect(runtime.ctx, x, y, size - 1, size - 1, Math.max(3, size * 0.16));
            runtime.ctx.fill();

            const cell = board[row]![col]!;
            if (cell >= 0) {
              drawCell(x, y, size - 1, PIECES[cell]!.color);
            }
          }
        }

        if (active) {
          const shape = pieceShape(active);
          for (let row = 0; row < shape.length; row += 1) {
            for (let col = 0; col < shape[row]!.length; col += 1) {
              if (!shape[row]![col]) {
                continue;
              }

              const boardX = active.x + col;
              const boardY = active.y + row;

              if (boardY < 0) {
                continue;
              }

              drawCell(offsetX + boardX * size, offsetY + boardY * size, size - 1, PIECES[active.type]!.color);
            }
          }
        }

        drawRoundedRect(runtime.ctx, previewX, offsetY, runtime.state.width - previewX - 24, 148, 22);
        runtime.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        runtime.ctx.fill();
        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '700 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText('NEXT', previewX + 18, offsetY + 28);

        const preview = PIECES[nextType]!.rotations[0];
        for (let row = 0; row < preview.length; row += 1) {
          for (let col = 0; col < preview[row]!.length; col += 1) {
            if (!preview[row]![col]) {
              continue;
            }
            drawCell(previewX + 22 + col * 26, offsetY + 44 + row * 26, 24, PIECES[nextType]!.color);
          }
        }

        drawRoundedRect(runtime.ctx, previewX, offsetY + 166, runtime.state.width - previewX - 24, 120, 22);
        runtime.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        runtime.ctx.fill();
        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.fillText(`LINES ${linesCleared}`, previewX + 18, offsetY + 198);
        runtime.ctx.font = '500 14px Space Grotesk, sans-serif';
        runtime.ctx.fillText('← → move', previewX + 18, offsetY + 226);
        runtime.ctx.fillText('↑ rotate', previewX + 18, offsetY + 248);
        runtime.ctx.fillText('↓ / space drop', previewX + 18, offsetY + 270);
      },
      pointerDown(point) {
        handleTouchControl(point.x, point.y);
      },
      keyDown(code) {
        if (!active) {
          return;
        }

        if (code === 'ArrowLeft' || code === 'KeyA') {
          tryMove(-1, 0);
        }

        if (code === 'ArrowRight' || code === 'KeyD') {
          tryMove(1, 0);
        }

        if (code === 'ArrowDown' || code === 'KeyS') {
          if (tryMove(0, 1)) {
            runtime.addScore(2);
          }
        }

        if (code === 'ArrowUp' || code === 'KeyW') {
          tryRotate();
        }

        if (code === 'Space') {
          hardDrop();
        }
      },
    };
  },
);


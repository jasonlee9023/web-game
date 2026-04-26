import { createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type Bubble = { color: number };

createHostedGame(
  canvas,
  {
    title: 'Bubble Sort Blitz',
    mode: 'hard',
    durationMs: 60_000,
    reviveMs: 15_000,
    aspectRatio: 4 / 3,
    maxWidth: 760,
    intro: '같은 색 버블 2개 이상을 클릭해 연쇄 점수를 만드세요.',
    palette: {
      bg: '#0d2f28',
      bg2: '#11998e',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f0fff9',
      accent: '#f6ffb2',
      accentSoft: 'rgba(246,255,178,0.3)',
      danger: '#ff6b6b',
      success: '#95ffb6',
    },
  },
  (runtime) => {
    const columns = 7;
    const rows = 8;
    const palette = ['#fb7185', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa'];
    let board: Array<Array<Bubble | null>> = [];
    let combo = 0;
    let lastPopAt = 0;

    function buildBoard() {
      board = Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => ({
          color: Math.floor(runtime.random(0, palette.length)),
        })),
      );
    }

    function cellSize() {
      return Math.min(72, Math.floor((runtime.state.width - 120) / columns));
    }

    function boardOffset() {
      const size = cellSize();
      return {
        x: (runtime.state.width - size * columns) / 2,
        y: 128,
        size,
      };
    }

    function neighbors(row: number, column: number) {
      return [
        [row - 1, column],
        [row + 1, column],
        [row, column - 1],
        [row, column + 1],
      ];
    }

    function findCluster(startRow: number, startColumn: number) {
      const bubble = board[startRow]?.[startColumn];
      if (!bubble) {
        return [];
      }

      const cluster: Array<[number, number]> = [];
      const queue: Array<[number, number]> = [[startRow, startColumn]];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const [row, column] = queue.shift()!;
        const key = `${row}:${column}`;

        if (visited.has(key)) {
          continue;
        }

        visited.add(key);

        const current = board[row]?.[column];
        if (!current || current.color !== bubble.color) {
          continue;
        }

        cluster.push([row, column]);

        for (const [nextRow, nextColumn] of neighbors(row, column)) {
          if (nextRow >= 0 && nextRow < rows && nextColumn >= 0 && nextColumn < columns) {
            queue.push([nextRow, nextColumn]);
          }
        }
      }

      return cluster;
    }

    function collapseBoard() {
      for (let column = 0; column < columns; column += 1) {
        const values = [];

        for (let row = rows - 1; row >= 0; row -= 1) {
          const current = board[row][column];
          if (current) {
            values.push(current);
          }
        }

        for (let row = rows - 1; row >= 0; row -= 1) {
          board[row][column] = values[rows - 1 - row] ?? {
            color: Math.floor(runtime.random(0, palette.length)),
          };
        }
      }
    }

    function hasAnyMoves() {
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          if (findCluster(row, column).length >= 2) {
            return true;
          }
        }
      }
      return false;
    }

    function popAt(x: number, y: number) {
      const { x: offsetX, y: offsetY, size } = boardOffset();
      const column = Math.floor((x - offsetX) / size);
      const row = Math.floor((y - offsetY) / size);

      if (column < 0 || column >= columns || row < 0 || row >= rows) {
        return;
      }

      const cluster = findCluster(row, column);
      if (cluster.length < 2) {
        combo = 0;
        return;
      }

      const now = performance.now();
      combo = now - lastPopAt < 1500 ? combo + 1 : 1;
      lastPopAt = now;

      for (const [clusterRow, clusterColumn] of cluster) {
        board[clusterRow][clusterColumn] = null;
      }

      collapseBoard();
      runtime.addScore(cluster.length * cluster.length * 24 + combo * 30);

      if (!hasAnyMoves()) {
        buildBoard();
      }
    }

    return {
      onResize() {
        buildBoard();
        combo = 0;
      },
      onRevive() {
        buildBoard();
        combo = 0;
      },
      update() {},
      draw(context) {
        fillGradient(context.ctx, context.state.width, context.state.height, '#0d3029', '#169a84');

        const { x, y, size } = boardOffset();
        drawRoundedRect(context.ctx, x - 18, y - 18, size * columns + 36, size * rows + 36, 24);
        context.ctx.fillStyle = 'rgba(8, 18, 17, 0.34)';
        context.ctx.fill();

        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < columns; column += 1) {
            const bubble = board[row][column];
            if (!bubble) {
              continue;
            }

            const centerX = x + column * size + size / 2;
            const centerY = y + row * size + size / 2;

            context.ctx.beginPath();
            context.ctx.fillStyle = palette[bubble.color];
            context.ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
            context.ctx.fill();

            context.ctx.beginPath();
            context.ctx.fillStyle = 'rgba(255,255,255,0.26)';
            context.ctx.arc(centerX - size * 0.12, centerY - size * 0.12, size * 0.1, 0, Math.PI * 2);
            context.ctx.fill();
          }
        }

        context.ctx.fillStyle = runtime.config.palette.text;
        context.ctx.font = '600 16px Space Grotesk, sans-serif';
        context.ctx.fillText(`combo x${Math.max(1, combo)}`, 36, context.state.height - 30);
      },
      pointerDown(point) {
        popAt(point.x, point.y);
      },
      keyDown(code) {
        if (code === 'Space') {
          buildBoard();
          combo = 0;
        }
      },
    };
  },
);

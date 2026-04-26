import { clamp, createHostedGame, drawRoundedRect, fillGradient } from './runtime-core';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas not found');
}

type LaneActor = {
  x: number;
  widthCells: number;
  color: string;
};

type Lane = {
  row: number;
  type: 'road' | 'water';
  direction: 1 | -1;
  speed: number;
  actors: LaneActor[];
};

const COLS = 11;
const ROWS = 11;
const HOME_COLUMNS = [1, 3, 5, 7, 9];

createHostedGame(
  canvas,
  {
    title: 'Frogger',
    mode: 'normal',
    durationMs: 82_000,
    reviveMs: 16_000,
    aspectRatio: 4 / 3,
    maxWidth: 860,
    intro: '차와 강을 건너 홈 슬롯 다섯 곳을 채우세요.',
    palette: {
      bg: '#0b141c',
      bg2: '#244d6b',
      panel: 'rgba(255,255,255,0.12)',
      text: '#f6fff3',
      accent: '#98ff8d',
      accentSoft: 'rgba(152,255,141,0.24)',
      danger: '#ff7d70',
      success: '#ffe27d',
    },
  },
  (runtime) => {
    const frog = {
      x: runtime.state.width / 2,
      row: ROWS - 1,
    };
    const input = {
      moveCooldown: 0,
    };
    let lanes: Lane[] = [];
    let homes = Array.from({ length: HOME_COLUMNS.length }, () => false);
    let stage = 1;
    let rescued = 0;

    function boardMetrics() {
      const cell = Math.min((runtime.state.width - 70) / COLS, (runtime.state.height - 178) / ROWS);
      const width = cell * COLS;
      const height = cell * ROWS;

      return {
        cell,
        width,
        height,
        left: (runtime.state.width - width) / 2,
        top: 118,
      };
    }

    function cellCenter(column: number) {
      const board = boardMetrics();
      return board.left + board.cell * column + board.cell / 2;
    }

    function rowCenter(row: number) {
      const board = boardMetrics();
      return board.top + board.cell * row + board.cell / 2;
    }

    function buildLanes(level: number) {
      const roadColors = ['#ff8e72', '#ffd166', '#8ec5ff', '#ff6a88'];
      const logColors = ['#9c6b3f', '#7b532f', '#b17a48', '#8f5f36'];

      lanes = [
        {
          row: 1,
          type: 'water',
          direction: 1,
          speed: 90 + level * 8,
          actors: [
            { x: cellCenter(1), widthCells: 2.4, color: logColors[0] ?? '#9c6b3f' },
            { x: cellCenter(6), widthCells: 2.6, color: logColors[1] ?? '#7b532f' },
          ],
        },
        {
          row: 2,
          type: 'water',
          direction: -1,
          speed: 110 + level * 8,
          actors: [
            { x: cellCenter(2), widthCells: 2.2, color: logColors[2] ?? '#b17a48' },
            { x: cellCenter(8), widthCells: 2.2, color: logColors[3] ?? '#8f5f36' },
          ],
        },
        {
          row: 3,
          type: 'water',
          direction: 1,
          speed: 120 + level * 10,
          actors: [
            { x: cellCenter(0), widthCells: 1.8, color: logColors[1] ?? '#7b532f' },
            { x: cellCenter(4), widthCells: 1.8, color: logColors[2] ?? '#b17a48' },
            { x: cellCenter(8), widthCells: 1.8, color: logColors[0] ?? '#9c6b3f' },
          ],
        },
        {
          row: 4,
          type: 'water',
          direction: -1,
          speed: 132 + level * 10,
          actors: [
            { x: cellCenter(1), widthCells: 2.8, color: logColors[3] ?? '#8f5f36' },
            { x: cellCenter(7), widthCells: 2.8, color: logColors[0] ?? '#9c6b3f' },
          ],
        },
        {
          row: 6,
          type: 'road',
          direction: -1,
          speed: 150 + level * 10,
          actors: [
            { x: cellCenter(1), widthCells: 1.4, color: roadColors[0] ?? '#ff8e72' },
            { x: cellCenter(5), widthCells: 1.4, color: roadColors[1] ?? '#ffd166' },
            { x: cellCenter(9), widthCells: 1.4, color: roadColors[2] ?? '#8ec5ff' },
          ],
        },
        {
          row: 7,
          type: 'road',
          direction: 1,
          speed: 170 + level * 10,
          actors: [
            { x: cellCenter(0), widthCells: 2.0, color: roadColors[3] ?? '#ff6a88' },
            { x: cellCenter(6), widthCells: 2.0, color: roadColors[2] ?? '#8ec5ff' },
          ],
        },
        {
          row: 8,
          type: 'road',
          direction: -1,
          speed: 180 + level * 12,
          actors: [
            { x: cellCenter(2), widthCells: 1.6, color: roadColors[1] ?? '#ffd166' },
            { x: cellCenter(7), widthCells: 1.6, color: roadColors[0] ?? '#ff8e72' },
          ],
        },
        {
          row: 9,
          type: 'road',
          direction: 1,
          speed: 200 + level * 12,
          actors: [
            { x: cellCenter(1), widthCells: 1.2, color: roadColors[3] ?? '#ff6a88' },
            { x: cellCenter(4), widthCells: 1.2, color: roadColors[2] ?? '#8ec5ff' },
            { x: cellCenter(8), widthCells: 1.2, color: roadColors[1] ?? '#ffd166' },
          ],
        },
      ];
    }

    function resetFrog() {
      frog.x = cellCenter(Math.floor(COLS / 2));
      frog.row = ROWS - 1;
      input.moveCooldown = 0;
    }

    function resetStage(level: number) {
      stage = level;
      homes = Array.from({ length: HOME_COLUMNS.length }, () => false);
      buildLanes(level);
      resetFrog();
    }

    function moveFrog(dx: number, dy: number) {
      if (input.moveCooldown > 0) {
        return;
      }

      const currentColumn = Math.round((frog.x - cellCenter(0)) / boardMetrics().cell);
      const nextColumn = clamp(currentColumn + dx, 0, COLS - 1);
      const nextRow = clamp(frog.row + dy, 0, ROWS - 1);

      if (dy < 0) {
        runtime.addScore(12);
      }

      frog.x = cellCenter(nextColumn);
      frog.row = nextRow;
      input.moveCooldown = 130;
    }

    function finishWithReason(reason: string) {
      runtime.finishRound({
        reason,
        stage,
        rescued,
        homesFilled: homes.filter(Boolean).length,
      });
    }

    function actorWidthPx(actor: LaneActor) {
      return actor.widthCells * boardMetrics().cell;
    }

    function frogBounds() {
      const board = boardMetrics();
      const size = board.cell * 0.7;

      return {
        left: frog.x - size / 2,
        right: frog.x + size / 2,
        top: rowCenter(frog.row) - size / 2,
        bottom: rowCenter(frog.row) + size / 2,
      };
    }

    function actorBounds(actor: LaneActor, row: number) {
      const board = boardMetrics();
      const width = actorWidthPx(actor);
      const height = board.cell * 0.7;

      return {
        left: actor.x - width / 2,
        right: actor.x + width / 2,
        top: rowCenter(row) - height / 2,
        bottom: rowCenter(row) + height / 2,
      };
    }

    function overlapsActor(actor: LaneActor, row: number) {
      const frogBox = frogBounds();
      const actorBox = actorBounds(actor, row);

      return (
        frogBox.left < actorBox.right &&
        frogBox.right > actorBox.left &&
        frogBox.top < actorBox.bottom &&
        frogBox.bottom > actorBox.top
      );
    }

    function checkHomeSlot() {
      const slotIndex = HOME_COLUMNS.findIndex((column) => Math.abs(frog.x - cellCenter(column)) <= boardMetrics().cell * 0.36);

      if (slotIndex === -1 || homes[slotIndex]) {
        finishWithReason('home-miss');
        return;
      }

      homes[slotIndex] = true;
      rescued += 1;
      runtime.addScore(360);

      if (homes.every(Boolean)) {
        runtime.addScore(920);
        resetStage(stage + 1);
        return;
      }

      resetFrog();
    }

    function handleDirectionalTap(pointX: number, pointY: number) {
      const dx = pointX - frog.x;
      const dy = pointY - rowCenter(frog.row);

      if (Math.abs(dx) > Math.abs(dy)) {
        moveFrog(dx > 0 ? 1 : -1, 0);
        return;
      }

      moveFrog(0, dy > 0 ? 1 : -1);
    }

    return {
      onResize() {
        resetStage(stage);
      },
      onRevive() {
        resetFrog();
      },
      update(deltaMs) {
        const board = boardMetrics();
        const deltaSeconds = deltaMs / 1000;
        input.moveCooldown = Math.max(0, input.moveCooldown - deltaMs);

        for (const lane of lanes) {
          for (const actor of lane.actors) {
            actor.x += lane.direction * lane.speed * deltaSeconds;

            const wrapWidth = actorWidthPx(actor) / 2;
            if (lane.direction > 0 && actor.x - wrapWidth > board.left + board.width + board.cell) {
              actor.x = board.left - wrapWidth - board.cell;
            }

            if (lane.direction < 0 && actor.x + wrapWidth < board.left - board.cell) {
              actor.x = board.left + board.width + wrapWidth + board.cell;
            }
          }
        }

        if (frog.row === 0) {
          checkHomeSlot();
          return;
        }

        const activeLane = lanes.find((lane) => lane.row === frog.row);
        if (!activeLane) {
          return;
        }

        if (activeLane.type === 'road') {
          if (activeLane.actors.some((actor) => overlapsActor(actor, activeLane.row))) {
            finishWithReason('road-hit');
            return;
          }

          return;
        }

        const carriedBy = activeLane.actors.find((actor) => overlapsActor(actor, activeLane.row));
        if (!carriedBy) {
          finishWithReason('water-fall');
          return;
        }

        frog.x += activeLane.direction * activeLane.speed * deltaSeconds;
        if (frog.x < board.left + board.cell * 0.35 || frog.x > board.left + board.width - board.cell * 0.35) {
          finishWithReason('river-edge');
        }
      },
      draw() {
        const board = boardMetrics();

        fillGradient(runtime.ctx, runtime.state.width, runtime.state.height, '#0b141c', '#244d6b');
        drawRoundedRect(runtime.ctx, board.left - 12, board.top - 8, board.width + 24, board.height + 16, 26);
        runtime.ctx.fillStyle = 'rgba(8, 12, 18, 0.4)';
        runtime.ctx.fill();

        for (let row = 0; row < ROWS; row += 1) {
          let color = '#203829';
          if (row >= 1 && row <= 4) {
            color = '#184260';
          } else if (row >= 6 && row <= 9) {
            color = '#26272e';
          } else if (row === 0) {
            color = '#14311d';
          }

          runtime.ctx.fillStyle = color;
          runtime.ctx.fillRect(board.left, board.top + row * board.cell, board.width, board.cell - 2);
        }

        runtime.ctx.fillStyle = '#0f2216';
        for (const [index, column] of HOME_COLUMNS.entries()) {
          const filled = homes[index];
          runtime.ctx.beginPath();
          runtime.ctx.arc(cellCenter(column), rowCenter(0), board.cell * 0.28, 0, Math.PI * 2);
          runtime.ctx.fillStyle = filled ? runtime.config.palette.accent : '#0f2216';
          runtime.ctx.fill();
        }

        for (const lane of lanes) {
          for (const actor of lane.actors) {
            const width = actorWidthPx(actor);
            const y = rowCenter(lane.row);

            if (lane.type === 'road') {
              runtime.ctx.fillStyle = actor.color;
              drawRoundedRect(runtime.ctx, actor.x - width / 2, y - board.cell * 0.28, width, board.cell * 0.56, 10);
              runtime.ctx.fill();
              runtime.ctx.fillStyle = 'rgba(14, 18, 24, 0.6)';
              runtime.ctx.fillRect(actor.x - width * 0.25, y - 6, width * 0.5, 12);
            } else {
              runtime.ctx.fillStyle = actor.color;
              drawRoundedRect(runtime.ctx, actor.x - width / 2, y - board.cell * 0.18, width, board.cell * 0.36, 12);
              runtime.ctx.fill();
              runtime.ctx.fillStyle = 'rgba(0,0,0,0.15)';
              runtime.ctx.fillRect(actor.x - width / 2 + 8, y - 3, width - 16, 6);
            }
          }
        }

        const frogY = rowCenter(frog.row);
        runtime.ctx.fillStyle = runtime.config.palette.accent;
        runtime.ctx.beginPath();
        runtime.ctx.arc(frog.x, frogY, board.cell * 0.26, 0, Math.PI * 2);
        runtime.ctx.fill();
        runtime.ctx.fillStyle = '#10311d';
        runtime.ctx.beginPath();
        runtime.ctx.arc(frog.x - board.cell * 0.08, frogY - board.cell * 0.08, board.cell * 0.04, 0, Math.PI * 2);
        runtime.ctx.arc(frog.x + board.cell * 0.08, frogY - board.cell * 0.08, board.cell * 0.04, 0, Math.PI * 2);
        runtime.ctx.fill();

        drawRoundedRect(runtime.ctx, 24, runtime.state.height - 78, runtime.state.width - 48, 44, 18);
        runtime.ctx.fillStyle = 'rgba(10, 15, 24, 0.42)';
        runtime.ctx.fill();

        runtime.ctx.fillStyle = runtime.config.palette.text;
        runtime.ctx.font = '600 16px Space Grotesk, sans-serif';
        runtime.ctx.fillText(`stage ${stage}`, 40, runtime.state.height - 50);
        runtime.ctx.fillText(`rescued ${rescued}`, 134, runtime.state.height - 50);
        runtime.ctx.fillText(`homes ${homes.filter(Boolean).length}/5`, 266, runtime.state.height - 50);
        runtime.ctx.textAlign = 'right';
        runtime.ctx.fillText(`use arrows or tap`, runtime.state.width - 38, runtime.state.height - 50);
        runtime.ctx.textAlign = 'left';
      },
      pointerDown(point) {
        handleDirectionalTap(point.x, point.y);
      },
      keyDown(code) {
        if (code === 'ArrowUp' || code === 'KeyW') {
          moveFrog(0, -1);
        }

        if (code === 'ArrowDown' || code === 'KeyS') {
          moveFrog(0, 1);
        }

        if (code === 'ArrowLeft' || code === 'KeyA') {
          moveFrog(-1, 0);
        }

        if (code === 'ArrowRight' || code === 'KeyD') {
          moveFrog(1, 0);
        }
      },
    };
  },
);

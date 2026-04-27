import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

const chromePath =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const remoteDebuggingPort = Number(process.env.CHROME_DEBUG_PORT ?? 9339);
const origin = process.env.WEB_ORIGIN ?? 'http://localhost:5174';
const outputDir = resolve('apps/web/public/assets/game-screenshots');
const screenshotWidth = 1200;
const screenshotHeight = 675;

const games = [
  { slug: 'jump-cat' },
  { slug: 'neon-drift' },
  { slug: 'bubble-sort-blitz' },
  { slug: 'orbit-smash' },
  { slug: 'pixel-harvest' },
  { slug: 'tetra-fall' },
  { slug: 'brick-breaker' },
  { slug: 'neoguri' },
  { slug: 'galaga' },
  { slug: 'space-invaders' },
  { slug: 'frogger' },
  { slug: 'pong-duel' },
];

function delay(ms) {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, ms);
  });
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.json();
}

async function waitForChrome() {
  const versionUrl = `http://127.0.0.1:${remoteDebuggingPort}/json/version`;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      await fetchJson(versionUrl);
      return;
    } catch {
      await delay(100);
    }
  }

  throw new Error('Chrome DevTools endpoint did not start in time');
}

function connectCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  let messageId = 0;

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);

    if (!handler) {
      return;
    }

    pending.delete(message.id);

    if (message.error) {
      handler.reject(new Error(message.error.message));
      return;
    }

    handler.resolve(message.result);
  });

  const opened = new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });

  async function send(method, params = {}) {
    await opened;
    const id = ++messageId;

    const result = new Promise((resolveSend, rejectSend) => {
      pending.set(id, { resolve: resolveSend, reject: rejectSend });
    });

    socket.send(JSON.stringify({ id, method, params }));
    return result;
  }

  return {
    send,
    close() {
      socket.close();
    },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  }

  return result.result.value;
}

async function waitForCanvas(cdp) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const canvas = await evaluate(
      cdp,
      `(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })()`,
    );

    if (canvas && canvas.width > 120 && canvas.height > 120) {
      return canvas;
    }

    await delay(100);
  }

  throw new Error('Canvas was not ready');
}

async function captureGame(game) {
  const targetUrl = `${origin}/games/${game.slug}/index.html`;
  const target = await fetchJson(`http://127.0.0.1:${remoteDebuggingPort}/json/new?${encodeURIComponent(targetUrl)}`, {
    method: 'PUT',
  });
  const cdp = connectCdp(target.webSocketDebuggerUrl);

  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.setLifecycleEventsEnabled', { enabled: true });
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: screenshotWidth,
      height: screenshotHeight,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Page.navigate', { url: targetUrl });
    await delay(900);

    await waitForCanvas(cdp);
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      windowsVirtualKeyCode: 32,
      code: 'Space',
      key: ' ',
    });
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: 32,
      code: 'Space',
      key: ' ',
    });
    await delay(600);

    const screenshot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const outputPath = resolve(outputDir, `${game.slug}.png`);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`captured ${game.slug} -> ${outputPath}`);
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/close/${target.id}`).catch(() => undefined);
  }
}

const userDataDir = mkdtempSync(resolve(tmpdir(), 'cgw-chrome-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${remoteDebuggingPort}`,
  `--user-data-dir=${userDataDir}`,
  'about:blank',
]);

chrome.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  if (!text.includes('DevTools listening')) {
    process.stderr.write(text);
  }
});

try {
  await waitForChrome();
  mkdirSync(outputDir, { recursive: true });

  for (const game of games) {
    await captureGame(game);
  }
} finally {
  chrome.kill('SIGTERM');
  await delay(500);
  try {
    rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    // Chrome can keep profile bookkeeping files open briefly after SIGTERM.
  }
}

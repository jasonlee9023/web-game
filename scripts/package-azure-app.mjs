import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const deployRoot = join(projectRoot, '.azure-deploy');
const stagingRoot = join(deployRoot, 'app');
const zipPath = join(deployRoot, 'casual-game-world-app.zip');

const runtimePackageJson = {
  name: 'casual-game-world-azure-app',
  version: '0.1.0',
  private: true,
  type: 'module',
  engines: {
    node: '>=24',
  },
  scripts: {
    start: 'node apps/api/server.mjs',
  },
  dependencies: {
    bcryptjs: '^2.4.3',
    'cookie-parser': '^1.4.7',
    cors: '^2.8.5',
    express: '^5.1.0',
    jsonwebtoken: '^9.0.2',
    zod: '^3.24.4',
  },
};

const ecosystemConfig = `const fs = require('node:fs');
const path = require('node:path');

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\\r?\\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    env[key] = rawValue.replace(/^(['"])(.*)\\1$/, '$2');
  }
  return env;
}

const localEnv = loadLocalEnv(path.resolve(__dirname, '.env.production.local'));

module.exports = {
  apps: [
    {
      name: 'casual-game-world',
      script: 'apps/api/server.mjs',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      exp_backoff_restart_delay: 1000,
      kill_timeout: 5000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '3001',
        WEB_ORIGIN: 'https://gamezip.kr',
        WEB_DIST_DIR: 'apps/web/dist',
        SERVE_WEB: 'true',
        AI_LEVEL_PROVIDER: 'auto',
        AZURE_OPENAI_ENDPOINT: '',
        AZURE_OPENAI_API_KEY: '',
        AZURE_OPENAI_DEPLOYMENT: '',
        LOG_LEVEL: 'warn',
        LOG_ERROR_STACKS: 'false',
        LOG_MAX_META_CHARS: '2000',
        ...localEnv,
      },
      env_production: {},
    },
  ],
};
`;

async function run(command, args, options = {}) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: projectRoot,
    maxBuffer: 1024 * 1024 * 20,
    ...options,
  });

  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
}

await run('npm', ['run', 'build']);

await rm(deployRoot, { recursive: true, force: true });
await mkdir(stagingRoot, { recursive: true });
await mkdir(join(stagingRoot, 'apps/api'), { recursive: true });
await mkdir(join(stagingRoot, 'apps/web'), { recursive: true });

await cp(join(projectRoot, 'apps/web/dist'), join(stagingRoot, 'apps/web/dist'), { recursive: true });
await run('npx', [
  'esbuild',
  'apps/api/src/server.ts',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--target=node24',
  '--packages=external',
  `--outfile=${join(stagingRoot, 'apps/api/server.mjs')}`,
]);
await writeFile(join(stagingRoot, 'package.json'), `${JSON.stringify(runtimePackageJson, null, 2)}\n`);
await writeFile(join(stagingRoot, 'ecosystem.config.cjs'), ecosystemConfig);

await run('npm', ['install', '--omit=dev', '--ignore-scripts', '--package-lock=false'], { cwd: stagingRoot });
await run('zip', ['-qr', zipPath, '.'], { cwd: stagingRoot });

console.log(`Azure package created: ${zipPath}`);

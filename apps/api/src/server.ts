import { createApp } from './app';
import { env } from './config/env';
import { errorToLogMeta, logger } from './utils/logger';

const app = createApp();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: errorToLogMeta(reason) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  setTimeout(() => process.exit(1), 100).unref();
});

app.listen(env.port, env.host, () => {
  logger.info(`Casual Game World API listening on http://${env.host}:${env.port}`);
});

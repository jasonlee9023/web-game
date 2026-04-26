import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, env.host, () => {
  console.log(`Casual Game World API listening on http://${env.host}:${env.port}`);
});

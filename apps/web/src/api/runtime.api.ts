import { http } from './http';

export interface RuntimeConfig {
  webOrigin: string;
  shareOrigin: string;
}

export function fetchRuntimeConfig() {
  return http<RuntimeConfig>('/api/config', {
    includeGuestId: false,
  });
}

import { http } from './http';

export function trackEvent(eventType: string, payload: Record<string, unknown>) {
  return http(`/api/events/${eventType}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


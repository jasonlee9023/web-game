export function isWithinPeriod(dateString: string, period: 'daily' | 'weekly' | 'monthly' | 'all') {
  if (period === 'all') {
    return true;
  }

  const candidate = new Date(dateString);
  const now = new Date();

  if (period === 'daily') {
    return candidate.toDateString() === now.toDateString();
  }

  if (period === 'monthly') {
    return candidate.getUTCFullYear() === now.getUTCFullYear() && candidate.getUTCMonth() === now.getUTCMonth();
  }

  const start = new Date(now);
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  start.setUTCHours(0, 0, 0, 0);
  return candidate >= start;
}

export function isoNow() {
  return new Date().toISOString();
}


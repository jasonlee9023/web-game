import { networkInterfaces } from 'node:os';
import type { Request } from 'express';

import type { ApiEnvelope } from '@casual-game-world/shared';

import { env } from '../config/env';

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return { data, meta };
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function parseHost(value: string) {
  try {
    return new URL(`http://${value}`).hostname;
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function isPrivateIpv4(address: string) {
  if (address.startsWith('10.') || address.startsWith('192.168.')) {
    return true;
  }

  if (!address.startsWith('172.')) {
    return false;
  }

  const secondOctet = Number.parseInt(address.split('.')[1] ?? '', 10);
  return secondOctet >= 16 && secondOctet <= 31;
}

function getPreferredLanAddress() {
  const candidates: string[] = [];

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        candidates.push(address.address);
      }
    }
  }

  return candidates.find((address) => isPrivateIpv4(address)) ?? candidates[0] ?? null;
}

export function resolveShareableWebOrigin(req?: Request) {
  const configuredOrigin = parseUrl(env.webOrigin);
  if (configuredOrigin && !isLoopbackHostname(configuredOrigin.hostname)) {
    return configuredOrigin.origin;
  }

  const forwardedProto = req?.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req?.protocol || configuredOrigin?.protocol.replace(':', '') || 'http';
  const lanAddress = getPreferredLanAddress();
  if (!lanAddress) {
    return configuredOrigin?.origin ?? env.webOrigin;
  }

  const publicOrigin = new URL(`${protocol}://${lanAddress}`);
  if (configuredOrigin?.port) {
    publicOrigin.port = configuredOrigin.port;
  }

  return publicOrigin.origin;
}

export function resolveWebOrigin(req: Request) {
  const configuredOrigin = parseUrl(env.webOrigin);
  if (configuredOrigin && !isLoopbackHostname(configuredOrigin.hostname)) {
    return configuredOrigin.origin;
  }

  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol || configuredOrigin?.protocol.replace(':', '') || 'http';
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
  const requestHost = forwardedHost || req.get('host');
  const requestHostname = requestHost ? parseHost(requestHost) : null;

  if (requestHost && requestHostname && !isLoopbackHostname(requestHostname)) {
    const publicOrigin = new URL(`${protocol}://${requestHost}`);
    if (configuredOrigin?.port) {
      publicOrigin.port = configuredOrigin.port;
    }

    return publicOrigin.origin;
  }

  return resolveShareableWebOrigin(req);
}

export function rewriteLoopbackUrlOrigin(sourceUrl: string, publicOrigin: string) {
  const parsed = parseUrl(sourceUrl);
  if (!parsed || !isLoopbackHostname(parsed.hostname)) {
    return sourceUrl;
  }

  return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, publicOrigin).toString();
}

export class HttpError extends Error {
  statusCode: number;

  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

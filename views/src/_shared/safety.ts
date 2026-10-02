const PRODUCTION_IMAGE_ORIGINS = ['https://photos.rentennials.app', 'https://api.rentennials.app'];
const PRODUCTION_LINK_ORIGINS = ['https://mcp.rentennials.app', 'https://www.rentennials.app', 'https://rentennials.app'];

const listFromEnv = (value: unknown): string[] =>
  typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

export const IMAGE_ORIGINS: readonly string[] = [
  ...PRODUCTION_IMAGE_ORIGINS,
  ...listFromEnv(import.meta.env.VITE_MCP_UI_IMAGE_HOSTS),
];

export const LINK_ORIGINS: readonly string[] = [
  ...PRODUCTION_LINK_ORIGINS,
  ...listFromEnv(import.meta.env.VITE_MCP_UI_LINK_ORIGINS),
];

export const ImageOriginContext = createContext<readonly string[]>(IMAGE_ORIGINS);

export function declaredImageOrigins(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((origin): origin is string => {
    if (typeof origin !== 'string' || origin.includes('*')) return false;
    try {
      const url = new URL(origin);
      return url.protocol === 'https:' && !url.username && !url.password && url.origin === origin;
    } catch { return false; }
  });
}

export function safeHttpsUrl(value: unknown, allowedOrigins: readonly string[]): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  return allowedOrigins.includes(url.origin) ? url.href : null;
}

export const safeImageUrl = (value: unknown, origins: readonly string[] = IMAGE_ORIGINS) => safeHttpsUrl(value, origins);
export const safeLinkUrl = (value: unknown, origins: readonly string[] = LINK_ORIGINS) => safeHttpsUrl(value, origins);
import { createContext } from 'react';

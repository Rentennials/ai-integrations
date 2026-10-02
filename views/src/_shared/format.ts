export type WallTime = { year: number; month: number; day: number; hour: number; minute: number };

const WALL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function parseWallTime(value: unknown): WallTime | null {
  if (typeof value !== 'string') return null;
  const match = WALL.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [number, number, number, number, number];
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day, hour, minute };
}

export function wallFromParts(date: unknown, time: unknown): WallTime | null {
  if (typeof date !== 'string' || typeof time !== 'string') return null;
  return parseWallTime(`${date}T${time}`);
}

const asUtc = (w: WallTime) => new Date(Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute));

export function formatWallDate(w: WallTime, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(asUtc(w));
}

export function formatWallTime(w: WallTime, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(asUtc(w));
}

export function formatWallDateTime(w: WallTime, locale: string): string {
  return `${formatWallDate(w, locale)} · ${formatWallTime(w, locale)}`;
}

export function timezoneLabel(tz: unknown): string | null {
  if (typeof tz !== 'string' || tz.length === 0) return null;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
  } catch {
    return null;
  }
  return tz;
}

export function parseInstant(value: unknown): number | null {
  if (typeof value !== 'string' || !/Z$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function formatInstant(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
}

export function computeDeadline(expiresAt: unknown, ttlSeconds: unknown, receivedAt: number): number | null {
  const absolute = parseInstant(expiresAt);
  if (absolute != null) return absolute;
  if (typeof ttlSeconds === 'number' && Number.isFinite(ttlSeconds)) return receivedAt + ttlSeconds * 1000;
  return null;
}

export function formatMoney(amount: unknown, currency: unknown, locale: string): string | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return null;
  const fraction = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: fraction,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRating(value: unknown, locale: string): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 5) return null;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function datesFromArgs(args: Record<string, unknown> | null | undefined): { from: WallTime; to: WallTime } | null {
  if (!args) return null;
  const from = parseWallTime(args.from) ?? parseWallTime(args.from_date_time) ?? wallFromParts(args.from_date, args.from_time ?? args.from_date_time);
  const to = parseWallTime(args.to) ?? parseWallTime(args.to_date_time) ?? wallFromParts(args.to_date, args.to_time ?? args.to_date_time);
  return from && to ? { from, to } : null;
}

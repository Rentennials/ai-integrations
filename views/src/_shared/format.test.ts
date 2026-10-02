import { describe, expect, it } from 'vitest';
import {
  computeDeadline, datesFromArgs, formatCountdown, formatMoney, formatRating, formatWallDate, formatWallTime, parseInstant, parseWallTime, timezoneLabel, wallFromParts,
} from './format';
import { safeHttpsUrl } from './safety';

const strip = (s: string | null) => s?.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formats ARS and USD with visible code', () => {
    expect(strip(formatMoney(174650, 'ARS', 'es-AR'))).toBe('ARS 174.650');
    expect(strip(formatMoney(420, 'USD', 'en-US'))).toBe('USD 420');
    expect(strip(formatMoney(12.5, 'USD', 'en-US'))).toBe('USD 12.50');
  });
  it('shows zero amounts and never infers a currency', () => {
    expect(strip(formatMoney(0, 'ARS', 'es-AR'))).toBe('ARS 0');
    expect(formatMoney(100, null, 'es-AR')).toBeNull();
    expect(formatMoney(100, undefined, 'es-AR')).toBeNull();
    expect(formatMoney(null, 'ARS', 'es-AR')).toBeNull();
    expect(formatMoney(Number.NaN, 'ARS', 'es-AR')).toBeNull();
  });
});

describe('wall time', () => {
  it('preserves components regardless of the runtime time zone', () => {
    expect(process.env.TZ).toBe('Asia/Tokyo');
    const w = parseWallTime('2026-10-02T18:00')!;
    expect(w).toEqual({ year: 2026, month: 10, day: 2, hour: 18, minute: 0 });
    expect(formatWallTime(w, 'es-AR')).toBe('18:00');
    expect(formatWallDate(w, 'es-AR')).toMatch(/02/);
  });
  it('rejects instants and malformed strings', () => {
    expect(parseWallTime('2026-10-02T18:00Z')).toBeNull();
    expect(parseWallTime('2026-13-02T18:00')).toBeNull();
    expect(parseWallTime('2026-02-30T18:00')).toBeNull();
    expect(parseWallTime(null)).toBeNull();
  });
  it('joins search date and time per vehicle', () => {
    expect(wallFromParts('2026-10-04', '09:30')).toEqual({ year: 2026, month: 10, day: 4, hour: 9, minute: 30 });
    expect(datesFromArgs({ from: '2026-10-02T18:00', to: '2026-10-04T18:00' })).not.toBeNull();
    expect(datesFromArgs({ vehicle_id: 'x' })).toBeNull();
  });
  it('labels the vehicle time zone', () => {
    expect(timezoneLabel('America/Argentina/Mendoza')).toBe('America/Argentina/Mendoza');
    expect(timezoneLabel('America/New_York')).toBe('America/New_York');
    expect(timezoneLabel('Not/AZone')).toBeNull();
  });
});

describe('expiry', () => {
  it('only accepts UTC instants with Z', () => {
    expect(parseInstant('2026-10-01T12:00:00Z')).toBe(Date.UTC(2026, 9, 1, 12));
    expect(parseInstant('2026-10-01T12:00:00')).toBeNull();
  });
  it('prefers the absolute instant and falls back to TTL from reception', () => {
    expect(computeDeadline('2026-10-01T12:00:00Z', 900, 0)).toBe(Date.UTC(2026, 9, 1, 12));
    expect(computeDeadline(null, 900, 1000)).toBe(901000);
    expect(computeDeadline(null, null, 1000)).toBeNull();
  });
  it('formats mm:ss and never goes negative', () => {
    expect(formatCountdown(14 * 60000 + 32000)).toBe('14:32');
    expect(formatCountdown(-5000)).toBe('00:00');
  });
});

describe('rating', () => {
  it('keeps null as unavailable and shows 0', () => {
    expect(formatRating(null, 'es-AR')).toBeNull();
    expect(formatRating(0, 'es-AR')).toBe('0,0');
    expect(formatRating(6, 'es-AR')).toBeNull();
  });
});

describe('safeHttpsUrl', () => {
  const allow = ['https://photos.rentennials.app'];
  it('accepts exact allowed HTTPS origins', () => {
    expect(safeHttpsUrl('https://photos.rentennials.app/a.jpg', allow)).toBe('https://photos.rentennials.app/a.jpg');
  });
  it.each([
    'http://photos.rentennials.app/a.jpg',
    'https://user:pass@photos.rentennials.app/a.jpg',
    'https://photos.rentennials.app.evil.com/a.jpg',
    'https://evil.example.com/a.jpg',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    '//photos.rentennials.app/a.jpg',
    '',
  ])('rejects %s', (url) => {
    expect(safeHttpsUrl(url, allow)).toBeNull();
  });
});

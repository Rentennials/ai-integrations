import { describe, expect, it } from 'vitest';
import { featureLabel, specValue } from './features';
import { declaredImageOrigins, safeImageUrl } from './safety';

describe('feature presentation', () => {
  it('translates stable contract keys instead of printing model labels', () => {
    expect(featureLabel('air_condition', 'Air conditioning', 'es')).toBe('Aire acondicionado');
    expect(featureLabel('luggage', 'Luggage capacity', 'es')).toBe('Capacidad de equipaje');
    expect(featureLabel('air_condition', 'Air conditioning', 'en')).toBe('Air conditioning');
    expect(featureLabel('owner_custom', '<b>data</b>', 'es')).toBe('<b>data</b>');
  });
  it('does not duplicate upstream units', () => {
    expect(specValue('car_doors', '5 Puertas', 'es')).toBe('5 puertas');
    expect(specValue('car_doors', '5 Puertas', 'en')).toBe('5 doors');
    expect(specValue('kms_per_day', '300 kms', 'es')).toBe('300 km/día');
    expect(specValue('kms_per_day', 'Ilimitado', 'en')).toBe('Unlimited mileage');
  });
});

describe('declared image policy', () => {
  it('accepts an exact runtime origin and rejects undeclared or unsafe sources', () => {
    const origins = declaredImageOrigins(['https://images.example.com', 'http://bad.example', 'https://*.example.com', 'https://user:pass@images.example.com']);
    expect(origins).toEqual(['https://images.example.com']);
    expect(safeImageUrl('https://images.example.com/picture.webp', origins)).toBe('https://images.example.com/picture.webp');
    expect(safeImageUrl('https://other.example.com/picture.webp', origins)).toBeNull();
  });
});

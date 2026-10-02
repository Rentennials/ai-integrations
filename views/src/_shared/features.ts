import type { Lang } from './i18n';

const labels: Record<string, [string, string]> = {
  year: ['Año', 'Year'], transmition: ['Transmisión', 'Transmission'],
  car_doors: ['Puertas', 'Doors'], fuel_car: ['Combustible', 'Fuel'],
  kms_per_day: ['Kilómetros por día', 'Daily mileage'], passengers: ['Pasajeros', 'Passengers'],
  luggage: ['Capacidad de equipaje', 'Luggage capacity'], enabled_drivers: ['Conductores permitidos', 'Allowed drivers'],
  air_condition: ['Aire acondicionado', 'Air conditioning'], airbags: ['Airbags', 'Airbags'],
  abs_breaks: ['Frenos ABS', 'ABS brakes'], raise_crystals: ['Levantavidrios eléctricos', 'Power windows'],
  bluetooh: ['Bluetooth', 'Bluetooth'], usb: ['Puerto USB', 'USB port'],
  cruising_speed: ['Control de crucero', 'Cruise control'], dont_smoking: ['Prohibido fumar', 'Smoking prohibited'],
  dont_eating: ['Prohibido comer', 'Eating prohibited'], assist_24_hours: ['Asistencia 24 horas', '24-hour assistance'],
  full_secured: ['Seguro incluido', 'Insurance included'], tolls: ['Peajes incluidos', 'Tolls included'],
  android_apple_carplay: ['Android Auto / Apple CarPlay', 'Android Auto / Apple CarPlay'],
  rear_camera: ['Cámara trasera', 'Rear camera'], wifi: ['Wi-Fi', 'Wi-Fi'],
  roadside_assistance: ['Asistencia en ruta', 'Roadside assistance'],
  allow_out_of_state: ['Circulación fuera de la provincia/estado', 'Travel outside the state/province'],
};

export const SUMMARY_FEATURE_KEYS = new Set(['year', 'transmition', 'car_doors', 'fuel_car', 'kms_per_day', 'passengers']);

export const featureLabel = (key: string, fallback: string | null | undefined, lang: Lang): string =>
  labels[key]?.[lang === 'es' ? 0 : 1] ?? fallback ?? key;

export function specValue(key: string, value: string, lang: Lang): string {
  if (key === 'car_doors') {
    const match = /^(\d+)\s*(?:puertas?|doors?)?$/i.exec(value.trim());
    return match ? `${match[1]} ${lang === 'es' ? 'puertas' : 'doors'}` : value;
  }
  if (key === 'kms_per_day') {
    if (/^(ilimitad[oa]|unlimited)$/i.test(value.trim())) return lang === 'es' ? 'Kilometraje ilimitado' : 'Unlimited mileage';
    const match = /^(\d+(?:[.,]\d+)?)\s*(?:kms?|kil[oó]metros?)?(?:\s*\/\s*(?:d[ií]a|day))?$/i.exec(value.trim());
    return match ? `${match[1]} ${lang === 'es' ? 'km/día' : 'km/day'}` : value;
  }
  if (key === 'transmition') {
    if (/^autom[aá]tic[oa]?$|^automatic$/i.test(value.trim())) return lang === 'es' ? 'Automática' : 'Automatic';
    if (/^manual$/i.test(value.trim())) return 'Manual';
  }
  if (key === 'fuel_car' && lang === 'en') {
    const fuel: Record<string, string> = { nafta: 'Gasoline', 'nafta premium': 'Premium gasoline', gasoil: 'Diesel', 'gasoil premium': 'Premium diesel', gas: 'CNG', 'híbrido': 'Hybrid', 'eléctrico': 'Electric', regular: 'Regular gasoline', premium: 'Premium gasoline', diesel: 'Diesel' };
    return fuel[value.toLowerCase()] ?? value;
  }
  return value;
}

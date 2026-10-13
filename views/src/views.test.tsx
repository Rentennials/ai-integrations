import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import type { Actions } from './_bridge/useMcpApp';
import { I18nProvider } from './_shared/i18n';
import { Quote, SearchVehiclesResult } from './_shared/contracts';
import { VehicleResultsContent } from './vehicle-results/View';
import { QuoteContent } from './quote/View';
import * as fx from '../fixtures';
import { parseWallTime } from './_shared/format';

const actions: Actions = { callServerTool: vi.fn(async () => null), sendMessage: vi.fn(async () => true), openLink: vi.fn(async () => true), updateModelContext: vi.fn(async () => true) };
const render = (el: ReactElement, locale = 'es-AR') => renderToStaticMarkup(<I18nProvider hostLocale={locale}>{el}</I18nProvider>);
const dates = { from: parseWallTime('2026-10-02T18:00')!, to: parseWallTime('2026-10-04T18:00')! };

describe('contracts accept every fixture', () => {
  it.each([
    [SearchVehiclesResult, fx.searchResult], [SearchVehiclesResult, fx.searchResultUsd],
    [Quote, fx.quote], [Quote, fx.quoteNoFast],
  ] as const)('%#', (schema, data) => {
    expect(schema.safeParse(data).success).toBe(true);
  });
});

describe('vehicle-results', () => {
  const html = render(<VehicleResultsContent data={SearchVehiclesResult.parse(fx.searchResult)} actions={actions} />);
  it('renders cards, badges only for true and estimate notice', () => {
    expect(html).toContain('Renault Kwid 2018');
    expect(html).toContain('24 coincidencias');
    expect(html.match(/Superhost/g)?.length).toBe(3);
    expect(html).toContain('Precios orientativos');
    expect(html).toContain('Hay más autos');
  });
  it('keeps null rating, null year, zero price and rejects unsafe images', () => {
    expect(html).toContain('Sin calificaciones');
    expect(html).toContain('>Toyota Etios<');
    expect(html).toMatch(/ARS\s0/);
    expect(html).not.toContain('http://photos.rentennials.app');
    expect(html).not.toContain('evil.example.com');
    expect(html).toContain('Imagen no disponible');
    const zero = render(<VehicleResultsContent data={SearchVehiclesResult.parse({ ...fx.searchResult, vehicles: [fx.searchResult.vehicles[5]] })} actions={actions} />);
    expect(zero).toContain('0,0');
  });
  it('wraps long names and never shows ids or slugs', () => {
    expect(html).not.toContain('nombre de publicación muy largo');
    const long = render(<VehicleResultsContent data={SearchVehiclesResult.parse({ ...fx.searchResult, vehicles: [fx.searchResult.vehicles[5]] })} actions={actions} />);
    expect(long).toContain('nombre de publicación muy largo');
    expect(html).not.toMatch(/veh_fx_|vehicle-fx-/);
  });
  it('renders USD in English', () => {
    const en = render(<VehicleResultsContent data={SearchVehiclesResult.parse(fx.searchResultUsd)} actions={actions} />, 'en-US');
    expect(en).toMatch(/USD\s420/);
    expect(en).toContain('1 matches');
    expect(en).not.toContain('0 matches');
  });
});

describe('quote', () => {
  it('keeps server order, discount once and separates totals', () => {
    const html = render(<QuoteContent data={Quote.parse({ ...fx.quote, breakdown: [...fx.quote.breakdown,
      { concept: 'hour', description: 'Fracción horaria', unit_amount: null, quantity: 5, amount: 42 },
      { concept: 'baby_chair', description: 'Extra acumulado', unit_amount: null, quantity: 2, amount: 18000 },
    ] })} dates={dates} actions={actions} />);
    expect(html.indexOf('Alquiler')).toBeLessThan(html.indexOf('Rentennials Cover'));
    expect(html).toMatch(/ARS\s174\.650/);
    expect(html).toContain('Rentennials Fast disponible');
    expect(html).toContain('El total se actualiza con una nueva cotización');
    expect(html).toMatch(/2 u\. · ARS\s18\.000/);
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('Fracción horaria');
    expect(html).not.toMatch(/5 × ARS\s42/);
    expect(html).not.toMatch(/2 × ARS\s18\.000/);
  });
  it('treats payment_fast null as unavailable', () => {
    const html = render(<QuoteContent data={Quote.parse(fx.quoteNoFast)} dates={null} actions={actions} />);
    expect(html).not.toContain('Rentennials Fast');
    expect(html).toContain('Aprobación automática');
  });
});

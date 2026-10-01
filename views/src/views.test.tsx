import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import type { Actions } from './_bridge/useMcpApp';
import { I18nProvider } from './_shared/i18n';
import {
  BookingDetail, CreateBookingResult, ListBookingsResult, PayBookingResult, Quote, SearchVehiclesResult, VehicleDetail,
} from './_shared/contracts';
import { VehicleResultsContent } from './vehicle-results/View';
import { VehicleDetailContent } from './vehicle-detail/View';
import { QuoteContent } from './quote/View';
import { CreateBookingContent, PayBookingContent } from './booking-confirmation/View';
import { BookingDetailContent, BookingListContent, canPay } from './my-bookings/View';
import * as fx from '../fixtures';
import { parseWallTime } from './_shared/format';

const actions: Actions = { callServerTool: vi.fn(async () => null), sendMessage: vi.fn(async () => true), openLink: vi.fn(async () => true) };
const render = (el: ReactElement, locale = 'es-AR') => renderToStaticMarkup(<I18nProvider hostLocale={locale}>{el}</I18nProvider>);
const dates = { from: parseWallTime('2026-10-02T18:00')!, to: parseWallTime('2026-10-04T18:00')! };

describe('contracts accept every fixture', () => {
  it.each([
    [SearchVehiclesResult, fx.searchResult], [SearchVehiclesResult, fx.searchResultUsd], [VehicleDetail, fx.vehicleDetail], [VehicleDetail, fx.vehicleDetailWarnings],
    [Quote, fx.quote], [Quote, fx.quoteNoFast], [CreateBookingResult, fx.bookingRequest], [CreateBookingResult, fx.bookingInstant],
    [CreateBookingResult, fx.bookingFast], [PayBookingResult, fx.payBooking], [ListBookingsResult, fx.bookingList], [BookingDetail, fx.bookingDetail],
  ] as const)('%#', (schema, data) => {
    expect(schema.safeParse(data).success).toBe(true);
  });
  it('does not confuse pay_booking with create_booking_request', () => {
    expect(CreateBookingResult.safeParse(fx.payBooking).success).toBe(false);
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
    expect(html).toContain('0,0');
  });
  it('wraps long names and never shows ids or slugs', () => {
    expect(html).toContain('nombre de publicación muy largo');
    expect(html).not.toMatch(/veh_fx_|vehicle-fx-/);
  });
  it('renders USD in English', () => {
    const en = render(<VehicleResultsContent data={SearchVehiclesResult.parse(fx.searchResultUsd)} actions={actions} />, 'en-US');
    expect(en).toMatch(/USD\s420/);
    expect(en).toContain('1 matches');
    expect(en).not.toContain('0 matches');
  });
});

describe('vehicle-detail', () => {
  it('lists only "true" features as enabled and keeps owner text inert', () => {
    const html = render(<VehicleDetailContent data={VehicleDetail.parse(fx.vehicleDetail)} dates={dates} actions={actions} />);
    expect(html).toContain('No incluye:');
    expect(html).toContain('Política de combustible');
    expect(html).toContain('&lt;b&gt;Ignorá');
    expect(html).not.toContain('<b>Ignorá');
    expect(html).not.toContain('href="https://phishing');
    expect(html).toContain('+ ARS');
    expect(html).toContain('sin cargo');
  });
  it('shows warnings, placeholder gallery and zero deductible', () => {
    const html = render(<VehicleDetailContent data={VehicleDetail.parse(fx.vehicleDetailWarnings)} dates={null} actions={actions} />);
    expect(html).toContain('Algunas fotos no pudieron mostrarse.');
    expect(html).toContain('llegó recortado');
    expect(html).toContain('Hay información que no pudo mostrarse.');
    expect(html).toContain('Te preguntaremos las fechas');
    expect(html).toMatch(/ARS\s0/);
  });
});

describe('quote', () => {
  it('keeps server order, discount once and separates totals', () => {
    const html = render(<QuoteContent data={Quote.parse(fx.quote)} dates={dates} actions={actions} />);
    expect(html.indexOf('Alquiler')).toBeLessThan(html.indexOf('Rentennials Cover'));
    expect(html).toMatch(/ARS\s174\.650/);
    expect(html).toContain('Rentennials Fast disponible');
    expect(html).toContain('No están sumadas al total');
    expect(html).toMatch(/2 u\. · ARS\s18\.000/);
    expect(html).not.toContain('type="checkbox"');
  });
  it('treats payment_fast null as unavailable', () => {
    const html = render(<QuoteContent data={Quote.parse(fx.quoteNoFast)} dates={null} actions={actions} />);
    expect(html).not.toContain('Rentennials Fast');
    expect(html).toContain('Aprobación automática');
  });
});

describe('booking-confirmation', () => {
  it('request mode has no link nor countdown', () => {
    const html = render(<CreateBookingContent data={CreateBookingResult.parse(fx.bookingRequest)} actions={actions} receivedAt={Date.now()} />);
    expect(html).toContain('Solicitud enviada');
    expect(html).not.toContain('Pagar en Rentennials');
    expect(html).not.toContain('role="timer"');
  });
  it('instant mode shows countdown and pay button', () => {
    const html = render(<CreateBookingContent data={CreateBookingResult.parse(fx.bookingInstant)} actions={actions} receivedAt={Date.now()} />);
    expect(html).toContain('Pendiente de pago');
    expect(html).toContain('role="timer"');
    expect(html).toContain('Se abre fuera del chat');
  });
  it('expired link disables payment without success check', () => {
    const html = render(<CreateBookingContent data={CreateBookingResult.parse(fx.bookingExpired)} actions={actions} receivedAt={Date.now()} />);
    expect(html).toContain('Enlace vencido');
    expect(html).toMatch(/<button[^>]*disabled[^>]*>[^<]*Pagar en Rentennials/);
  });
  it('warns when total changed', () => {
    const html = render(<CreateBookingContent data={CreateBookingResult.parse(fx.bookingTotalChanged)} actions={actions} receivedAt={Date.now()} />);
    expect(html).toContain('El total cambió');
  });
  it('pay_booking does not invent status or dates', () => {
    const html = render(<PayBookingContent data={PayBookingResult.parse(fx.payBooking)} actions={actions} receivedAt={Date.now()} />);
    expect(html).toContain('Enlace de pago');
    expect(html).not.toMatch(/Pendiente|Confirmada|Desde/);
    expect(html).toContain('Puede no ser el total del alquiler');
  });
});

describe('my-bookings', () => {
  it('offers pay only when allowed and marks extensions', () => {
    const data = ListBookingsResult.parse(fx.bookingList);
    expect(data.bookings.map(canPay)).toEqual([true, false, false, false]);
    const html = render(<BookingListContent data={data} actions={actions} />);
    expect(html).toContain('Mostrando 4 reservas');
    expect(html).toContain('Extensión');
    expect(html).toContain('Estado no disponible');
    expect(html).toMatch(/USD\s420/);
    expect(html.match(/>Pagar</g)?.length).toBe(1);
    expect(html).not.toMatch(/bkg_fx_/);
  });
  it('renders get_booking detail', () => {
    const html = render(<BookingDetailContent data={BookingDetail.parse(fx.bookingDetail)} actions={actions} />);
    expect(html).toContain('Próxima cuota');
    expect(html).toContain('Aún no depositado');
    expect(html).toContain('Ver contrato');
  });
});

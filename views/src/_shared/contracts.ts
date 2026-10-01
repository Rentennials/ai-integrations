import { z } from 'zod';

const num = z.number().nullish();
const str = z.string().nullish();
const bool = z.boolean().nullish();

export const VehicleSummary = z.object({
  id: z.string(),
  slug: str,
  name: z.string(),
  year: str,
  image_url: str,
  total_price: num,
  price_per_day: num,
  currency: str,
  total_days: num,
  transmission: str,
  passengers: str,
  city: str,
  timezone: str,
  automatic_approval: bool,
  is_super_host: bool,
  immediate_reserve: bool,
  owner_rating: num,
});

export const SearchVehiclesResult = z.object({
  vehicles: z.array(VehicleSummary),
  total_count: num,
  has_more: bool,
  page: num,
  limit: num,
  search_context: z
    .object({ country: str, region: str, from_date: str, to_date: str, from_date_time: str, to_date_time: str })
    .nullish(),
});

export const VehicleDetail = z.object({
  id: z.string(),
  slug: str,
  name: z.string(),
  year: str,
  image_urls: z.array(z.string()).nullish(),
  description: str,
  disclaimer: str,
  features: z.array(z.object({ key: z.string(), label: str, value: z.string() })).nullish(),
  meeting_points: z.array(z.object({ id: z.string(), name: str, type: z.enum(['PICKUP', 'RETURN']), price: num })).nullish(),
  passengers: str,
  transmission: str,
  fuel: str,
  doors: str,
  kms_per_day: str,
  timezone: str,
  currency: str,
  guarantee_deposit: num,
  guarantee_deposit_currency: str,
  deductible: num,
  content_warnings: z.array(z.string()).nullish(),
});

const Coverage = z.object({
  type: str,
  description: str,
  price: num,
  deposit_amount: num,
  max_deductible: num,
  luggage_theft_coverage: num,
});

export const Quote = z.object({
  breakdown: z.array(z.object({ concept: z.string(), description: str, unit_amount: num, quantity: num, amount: z.number() })),
  total: num,
  currency: str,
  total_days: num,
  price_per_day: num,
  discount: num,
  discount_code: str,
  pay_now: num,
  pay_on_pickup: num,
  security_deposit: num,
  security_deposit_currency: str,
  timezone: str,
  automatic_approval: bool,
  payment_fast: z
    .object({ available: z.boolean(), amount_now: num, remaining_amount: num, currency: str, remaining_charge_date: str })
    .nullish(),
  included_coverages: z.array(Coverage).nullish(),
  available_coverages: z.array(Coverage.extend({ id: z.string() })).nullish(),
  available_extras: z
    .array(z.object({ key: z.string(), label: str, description: str, price_by_quantity: z.array(z.number()) }))
    .nullish(),
});

export const CreateBookingResult = z.object({
  booking_id: z.string(),
  booking_number: num,
  vehicle_name: str,
  mode: z.enum(['request', 'instant']),
  status: str,
  from: str,
  to: str,
  timezone: str,
  total: num,
  currency: str,
  total_matches_quote: bool,
  pay_now: num,
  payment_url: str,
  payment_expires_at: str,
  payment_expires_in_seconds: num,
  payment_plan: z.enum(['full', 'fast']),
  remaining_amount: num,
  remaining_charge_date: str,
  next_step: str,
  manage_url: str,
});

export const PayBookingResult = z.object({
  booking_id: z.string(),
  booking_number: num,
  vehicle_name: str,
  amount: num,
  currency: str,
  payment_url: str,
  payment_url_expires_at: str,
  payment_url_expires_in_seconds: num,
  next_step: str,
  manage_url: str,
});

export const BookingSummary = z.object({
  booking_id: z.string(),
  booking_number: num,
  status: str,
  vehicle_name: str,
  from: str,
  to: str,
  timezone: str,
  total: num,
  currency: str,
  amount_to_pay_now: num,
  needs_payment: bool,
  paid: bool,
  is_extension: bool,
});

export const ListBookingsResult = z.object({
  bookings: z.array(BookingSummary),
  page: num,
  total_count: num,
  has_more: bool,
});

export const BookingDetail = BookingSummary.extend({
  amount_to_pay_now_currency: str,
  subtotal: num,
  discount_total: num,
  extra_services_total: num,
  date_paid: str,
  cancelled: bool,
  pickup_city: str,
  included_kms_per_day: str,
  extra_services: z.array(z.object({ name: str, quantity: num, price: num })).nullish(),
  coverages: z.array(z.object({ name: str, price: num })).nullish(),
  pickup_meeting_point: z.object({ name: str, price: num }).nullish(),
  return_meeting_point: z.object({ name: str, price: num }).nullish(),
  security_deposit: z.object({ amount: num, currency: str, paid: bool }).nullish(),
  next_instalment: z.object({ amount: num, currency: str, debit_date: str }).nullish(),
  contract_url: str,
});

export type SearchVehiclesResult = z.infer<typeof SearchVehiclesResult>;
export type VehicleSummary = z.infer<typeof VehicleSummary>;
export type VehicleDetail = z.infer<typeof VehicleDetail>;
export type Quote = z.infer<typeof Quote>;
export type CreateBookingResult = z.infer<typeof CreateBookingResult>;
export type PayBookingResult = z.infer<typeof PayBookingResult>;
export type ListBookingsResult = z.infer<typeof ListBookingsResult>;
export type BookingSummary = z.infer<typeof BookingSummary>;
export type BookingDetail = z.infer<typeof BookingDetail>;

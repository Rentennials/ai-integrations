import { z } from 'zod';

const num = z.number().nullish();
const str = z.string().nullish();
const bool = z.boolean().nullish();

export const SortOrder = z.enum(['default', 'lower_price', 'higher_price', 'average_rating', 'amount_of_bookings']);
export const SearchArguments = z.object({
  country: z.string(), region: z.string().optional(),
  from_date: z.string(), to_date: z.string(), from_date_time: z.string().optional(), to_date_time: z.string().optional(),
  sort: SortOrder.optional(), page: z.number().int().positive().optional(), limit: z.number().int().min(1).max(20).optional(),
  passengers: z.number().optional(), car_doors: z.number().optional(), transmission: z.string().optional(), fuel: z.string().optional(),
  min_kms_per_day: z.string().optional(), min_price: z.number().optional(), max_price: z.number().optional(),
  baby_chair: z.number().optional(), booster: z.number().optional(),
  all_inclusive: z.boolean().optional(), automatic_approval: z.boolean().optional(), has_deposit_cover: z.boolean().optional(),
  allow_out_of_state: z.boolean().optional(), tolls: z.boolean().optional(), snow_chains: z.boolean().optional(),
  air_condition: z.boolean().optional(), airbags: z.boolean().optional(), abs_breaks: z.boolean().optional(),
  bluetooth: z.boolean().optional(), raise_crystals: z.boolean().optional(), usb: z.boolean().optional(), cruise_control: z.boolean().optional(),
  pickup_location_id: z.string().optional(), return_location_id: z.string().optional(),
});
export type SearchArguments = z.infer<typeof SearchArguments>;

export const VehiclePresentation = z.object({ id: z.string(), slug: str, name: z.string(), year: str, image_url: str, country: str, timezone: str });
export type VehiclePresentation = z.infer<typeof VehiclePresentation>;
const MeetingPoint = z.object({ id: z.string(), location_id: str, name: str, type: z.enum(['PICKUP', 'RETURN']), price: num });

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
    .object({ country: str, region: str, from_date: str, to_date: str, from_date_time: str, to_date_time: str, sort: SortOrder.nullish() })
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
  meeting_points: z.array(MeetingPoint).nullish(),
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
  id: str,
  type: str,
  description: str,
  price: num,
  deposit_amount: num,
  max_deductible: num,
  luggage_theft_coverage: num,
});

export const Quote = z.object({
  vehicle: VehiclePresentation.nullish(),
  availability: z.enum(['available', 'unknown']).nullish(),
  meeting_points: z.object({ pickup: z.array(MeetingPoint), return: z.array(MeetingPoint) }).nullish(),
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

export const QuoteArguments = z.object({
  vehicle_id: z.string().regex(/^[a-f\d]{24}$/i),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  from_date_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  to_date_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  coupon: z.string().optional(),
  covers: z.array(z.string()).optional(),
  pickup_meeting_point_id: z.string().optional(),
  return_meeting_point_id: z.string().optional(),
  extra_services: z.array(z.object({ key: z.string(), quantity: z.number().int().min(1).optional() })).optional(),
});
export type QuoteArguments = z.infer<typeof QuoteArguments>;

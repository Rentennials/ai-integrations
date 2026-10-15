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
  province: str,
  timezone: str,
  automatic_approval: bool,
  is_super_host: bool,
  immediate_reserve: bool,
  owner_rating: num,
  bookings_count: num,
  price_before_promotion: num,
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

export type SearchVehiclesResult = z.infer<typeof SearchVehiclesResult>;
export type VehicleSummary = z.infer<typeof VehicleSummary>;
export type Quote = z.infer<typeof Quote>;

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

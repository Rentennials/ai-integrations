import { useRef, useState } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { SearchArguments, SearchVehiclesResult, type VehicleSummary } from '../_shared/contracts';
import { Badge, Button, Notice, SafeImage, useAction } from '../_shared/components';
import { formatMoney, formatRating, formatWallDateTime, wallFromParts, type WallTime } from '../_shared/format';
import { useI18n } from '../_shared/i18n';
import { IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconPin, IconStar } from '../_shared/icons';
import { Frame, Parsed, parseResult, type ViewProps } from '../_shared/ViewRoot';
import { vehicleTitle } from '../_shared/vehicle';
import './styles.css';

type Dates = { from: WallTime; to: WallTime } | null;
type Sort = NonNullable<SearchArguments['sort']>;

const SORTS: Sort[] = ['default', 'lower_price', 'higher_price', 'amount_of_bookings', 'average_rating'];
const PAGE_SIZE = 5;
const GAP = 12;
const MORE_UNTIL = 15;

const chooseText = (id: string) => `I'd like to rent the vehicle with id ${id} from these search results, for the searched dates. Ask me for anything still missing (pickup and return points, coverages, extras), then call show_rental_summary once with the complete arguments. Do not book or charge yet.`;

function LaneSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rt-carousel__item" aria-hidden="true">
          <div className="rt-card rt-vcard">
            <div className="rt-media rt-skel" style={{ borderRadius: 0 }} />
            <div className="rt-vcard__body">
              <div className="rt-skel" style={{ height: 18, width: '70%' }} />
              <div className="rt-skel" style={{ height: 12, width: '45%' }} />
              <div className="rt-skel" style={{ height: 46, borderRadius: 9999, marginTop: 8 }} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function VehicleCard({ v, chosen, pending, locked, onChoose }: { v: VehicleSummary; chosen: boolean; pending: boolean; locked: boolean; onChoose: () => void }) {
  const { t, locale } = useI18n();
  const title = vehicleTitle(v);
  const rating = formatRating(v.owner_rating, locale);
  const total = formatMoney(v.total_price, v.currency, locale);
  const onPromo = typeof v.price_before_promotion === 'number' && typeof v.total_price === 'number' && v.price_before_promotion > v.total_price;
  const before = onPromo ? formatMoney(v.price_before_promotion, v.currency, locale) : null;
  const place = [v.province, v.city].filter((part): part is string => Boolean(part)).join(' - ') || t('results.noCity');
  const trips = typeof v.bookings_count === 'number' && v.bookings_count > 0
    ? (v.bookings_count === 1 ? t('results.trip', { n: 1 }) : t('results.trips', { n: v.bookings_count }))
    : null;
  const days = typeof v.total_days === 'number'
    ? (v.total_days === 1 ? t('results.day') : t('results.days', { n: v.total_days }))
    : null;

  return (
    <article className="rt-card rt-vcard rt-result" aria-label={title}>
      <div className="rt-media">
        <SafeImage src={v.image_url} alt={title} />
        {v.is_super_host === true ? (
          <span className="rt-result__super"><Badge icon={<IconCheck size={12} strokeWidth={2.4} />}>{t('badge.superHost')}</Badge></span>
        ) : null}
        <div className="rt-result__pills">
          <span className="rt-rating"><IconStar size={14} style={{ color: '#7B45F6' }} />{rating ?? t('results.noRating')}</span>
          {trips ? <span className="rt-result__trips">{trips}</span> : null}
        </div>
      </div>
      <div className="rt-vcard__body">
        <div className="rt-result__info">
          <h2 className="rt-h3 rt-result__title">{title}</h2>
          <span className="rt-meta rt-result__meta">{place}</span>
        </div>
        <div className="rt-result__offer">
          {before || v.automatic_approval === true ? (
            <div className="rt-result__row">
              {before ? <Badge tone="warn">{t('results.discount')}</Badge> : null}
              {v.automatic_approval === true ? <Badge icon={<IconCheck size={12} strokeWidth={2.4} />}>{t('badge.autoApproval')}</Badge> : null}
              {before ? <s className="rt-small">{before}</s> : null}
            </div>
          ) : null}
          <div className="rt-result__total">
            <span className="rt-result__amount">{total ?? t('priceUnavailable')}</span>
            {days ? <span className="rt-result__days">{days}</span> : null}
          </div>
        </div>
        <Button block className="rt-result__cta" disabled={chosen || locked} loading={pending} onClick={onChoose}>
          {chosen ? <><IconCheck size={16} strokeWidth={2.4} />{t('results.chosen')}</> : t('results.choose')}
        </Button>
      </div>
    </article>
  );
}

export function VehicleResultsContent({ data: initialData, actions, searchArgs: initialArgs }: { data: SearchVehiclesResult; actions: Actions; searchArgs?: SearchArguments | null }) {
  const { t, locale } = useI18n();
  const [data, setData] = useState(initialData);
  const [searchArgs, setSearchArgs] = useState(initialArgs ?? null);
  const [failed, setFailed] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const sequence = useRef(0);
  const busy = useRef(false);
  const lane = useRef<HTMLDivElement>(null);
  const ctx = data.search_context;
  const searched = ctx ? { from: wallFromParts(ctx.from_date, ctx.from_date_time), to: wallFromParts(ctx.to_date, ctx.to_date_time) } : null;
  const dates: Dates = searched?.from && searched.to ? { from: searched.from, to: searched.to } : null;
  const place = [ctx?.region, ctx?.country].filter(Boolean).join(', ');
  const activeSort = data.search_context?.sort ?? searchArgs?.sort ?? 'default';
  const loading = sorting || loadingMore;

  const runSearch = async (args: Record<string, unknown>, setPending: (value: boolean) => void, apply: (parsed: SearchVehiclesResult) => void) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setFailed(false);
    const request = ++sequence.current;
    try {
      const result = await actions.callServerTool('search_vehicles', args);
      const parsed = result && !result.isError ? parseResult(SearchVehiclesResult, result) : null;
      if (request !== sequence.current) return;
      if (parsed) apply(parsed);
      else setFailed(true);
    } catch { setFailed(true); }
    finally { if (request === sequence.current) { busy.current = false; setPending(false); } }
  };

  const changeSort = (sort: Sort) => {
    if (!searchArgs) return;
    const args = { ...searchArgs, sort, page: 1, limit: PAGE_SIZE };
    void runSearch(args, setSorting, (parsed) => { setData(parsed); setSearchArgs(args); });
  };

  const showMore = () => {
    if (!searchArgs) return;
    const args = { ...searchArgs, page: (data.page ?? 1) + 1, limit: PAGE_SIZE };
    void runSearch(args, setLoadingMore, (parsed) => setData((current) => {
      const seen = new Set(current.vehicles.map((v) => v.id));
      return {
        ...current,
        vehicles: [...current.vehicles, ...parsed.vehicles.filter((v) => !seen.has(v.id))],
        page: parsed.page ?? args.page,
        has_more: parsed.has_more,
      };
    }));
  };

  const [choose, choosing] = useAction(async (v: VehicleSummary) => {
    setFailed(false);
    setChoosingId(v.id);
    const sent = await actions.sendMessage(chooseText(v.id));
    if (sent) setChosenId(v.id);
    else setFailed(true);
    setChoosingId(null);
  });

  const scrollLane = (direction: -1 | 1) => {
    const el = lane.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * ((card?.offsetWidth ?? 260) + GAP), behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const canShowMore = data.has_more === true && data.vehicles.length < MORE_UNTIL;

  return (
    <div className="rt-results">
      <div className="rt-between">
        <div className="rt-row">
          {place ? <span className="rt-chip"><IconPin size={16} style={{ color: 'var(--rt-brand)' }} />{place}</span> : null}
          {dates ? (
            <span className="rt-chip"><IconCalendar size={16} style={{ color: 'var(--rt-brand)' }} />{formatWallDateTime(dates.from, locale)} → {formatWallDateTime(dates.to, locale)}</span>
          ) : null}
        </div>
        <span className="rt-small" style={{ fontWeight: 500 }}>
          {typeof data.total_count === 'number' ? t('results.count', { n: data.total_count }) : t('results.shown', { n: data.vehicles.length })}
        </span>
      </div>
      <div className="rt-sort" role="group" aria-label={t('results.sort')}>
        {SORTS.map((sort) => (
          <button key={sort} type="button" aria-pressed={activeSort === sort} disabled={!searchArgs || loading} onClick={() => changeSort(sort)}>
            {t(`results.sort.${sort}`)}
          </button>
        ))}
      </div>
      {failed ? <Notice tone="err" role="alert" title={t('state.actionFailed.title')}>{t('state.actionFailed.text')}</Notice> : null}
      <div className="rt-carousel">
        <div className="rt-carousel__lane" ref={lane} role="region" tabIndex={0} aria-label={t('title.results')} aria-busy={sorting || undefined}>
          {sorting ? <LaneSkeleton count={3} /> : data.vehicles.map((v) => (
            <div key={v.id} className="rt-carousel__item">
              <VehicleCard
                v={v}
                chosen={chosenId === v.id}
                pending={choosing && choosingId === v.id}
                locked={choosing}
                onChoose={() => void choose(v)}
              />
            </div>
          ))}
          {canShowMore && !sorting ? (
            <div className="rt-carousel__item">
              <article className="rt-card rt-result rt-result--more">
                <Button variant="secondary" block loading={loadingMore} disabled={!searchArgs || loading} onClick={showMore}>{t('results.showMore')}</Button>
              </article>
            </div>
          ) : null}
        </div>
        <button type="button" className="rt-carousel__nav rt-carousel__nav--prev" aria-label={t('results.prev')} onClick={() => scrollLane(-1)}><IconChevronLeft size={22} /></button>
        <button type="button" className="rt-carousel__nav rt-carousel__nav--next" aria-label={t('results.next')} onClick={() => scrollLane(1)}><IconChevronRight size={22} /></button>
      </div>
      <p className="rt-small rt-results__note">{t('results.estimate')}</p>
      {data.has_more === true && !canShowMore ? <p className="rt-small rt-results__note">{t('results.hasMore')}</p> : null}
    </div>
  );
}

export function VehicleResultsView({ view }: ViewProps) {
  const { t } = useI18n();
  const parsedArgs = SearchArguments.safeParse(view.result?._meta?.['rentennials/search_args'] ?? view.input);
  return (
    <Frame title={t('title.results')} view={{ ...view, actionError: false }} skeletons={3}>
      <Parsed schema={SearchVehiclesResult} result={view.result} isEmpty={(d) => d.vehicles.length === 0} emptyTitle="noResults" emptyText="results.empty">
        {(data) => <VehicleResultsContent key={view.receivedAt} data={data} actions={view.actions} searchArgs={parsedArgs.success ? parsedArgs.data : null} />}
      </Parsed>
    </Frame>
  );
}

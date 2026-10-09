import { useRef, useState } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { SearchArguments, SearchVehiclesResult, Quote as QuoteSchema, QuoteArguments, VehicleDetail as VehicleDetailSchema, type Quote, type VehicleDetail, type VehicleSummary } from '../_shared/contracts';
import { Badge, Button, Notice, SafeImage } from '../_shared/components';
import { formatMoney, formatRating, formatWallDateTime, wallFromParts, type WallTime } from '../_shared/format';
import { useI18n } from '../_shared/i18n';
import { IconCalendar, IconCheck, IconChevronLeft, IconGear, IconInfo, IconPin, IconStar, IconUsers } from '../_shared/icons';
import { Frame, Parsed, parseResult, type ViewProps } from '../_shared/ViewRoot';
import { VehicleDetailContent } from '../vehicle-detail/View';
import { specValue } from '../_shared/features';
import { vehicleTitle } from '../_shared/vehicle';
import { QuoteContent } from '../quote/View';

type Dates = { from: WallTime; to: WallTime } | null;

function VehicleCard({ v, onDetail, onQuote, opening, disabled }: { v: VehicleSummary; onDetail: () => void; onQuote: () => void; opening: boolean; disabled: boolean }) {
  const { t, locale, lang } = useI18n();
  const title = vehicleTitle(v);
  const rating = formatRating(v.owner_rating, locale);
  const total = formatMoney(v.total_price, v.currency, locale);
  const perDay = formatMoney(v.price_per_day, v.currency, locale);
  const badges = [
    v.is_super_host === true ? t('badge.superHost') : null,
    v.automatic_approval === true ? t('badge.autoApproval') : null,
    v.immediate_reserve === true ? t('badge.immediate') : null,
  ].filter((b): b is string => b !== null);

  return (
    <article className="rt-card rt-vcard" aria-label={title}>
      <div className="rt-media">
        <SafeImage src={v.image_url} alt={title} />
        <span className="rt-rating"><IconStar size={14} style={{ color: '#7B45F6' }} />{rating ?? t('results.noRating')}</span>
      </div>
      <div className="rt-vcard__body">
        {badges.length > 0 ? (
          <div className="rt-row" style={{ gap: 6 }}>
            {badges.map((b) => <Badge key={b} icon={<IconCheck size={12} strokeWidth={2.4} />}>{b}</Badge>)}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="rt-h3">{title}</h2>
          <span className="rt-meta">{v.city ?? t('results.noCity')}</span>
        </div>
        <div className="rt-vcard__specs">
          <span className="rt-vcard__spec"><IconGear size={16} />{v.transmission ? specValue('transmition', v.transmission, lang) : t('results.noTransmission')}</span>
          <span className="rt-vcard__spec"><IconUsers size={16} />{v.passengers ? t('results.passengers', { n: v.passengers }) : t('results.noPassengers')}</span>
        </div>
        <div className="rt-vcard__price">
          <span className="rt-small" style={{ color: 'var(--rt-muted)' }}>{perDay ? t('results.perDay', { amount: perDay }) : ''}</span>
          <div className="rt-vcard__total">
            <span className="rt-vcard__amount">{total ?? t('priceUnavailable')}</span>
            {typeof v.total_days === 'number' ? (
              <span className="rt-small">{v.total_days === 1 ? t('results.day') : t('results.days', { n: v.total_days })}</span>
            ) : null}
          </div>
        </div>
        <div className="rt-actions">
          <Button variant="secondary" disabled={disabled || !v.slug} onClick={onDetail}>{t('viewDetails')}</Button>
          <Button disabled={disabled} loading={opening} onClick={onQuote}>{t('getQuote')}</Button>
        </div>
      </div>
    </article>
  );
}

export function VehicleResultsContent({ data: initialData, actions, searchArgs: initialArgs }: { data: SearchVehiclesResult; actions: Actions; searchArgs?: SearchArguments | null }) {
  const { t, locale } = useI18n();
  const [data, setData] = useState(initialData);
  const [searchArgs, setSearchArgs] = useState(initialArgs ?? null);
  const [detail, setDetail] = useState<{ vehicle: VehicleDetail; dates: Dates } | null>(null);
  const [quotePanel, setQuotePanel] = useState<{ vehicle: VehicleSummary; data: Quote; args: QuoteArguments; requiredPoints: { pickup?: boolean; return?: boolean } } | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [detailFailed, setDetailFailed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [sorting, setSorting] = useState(false);
  const sequence = useRef(0);
  const busy = useRef(false);
  const detailCache = useRef(new Map<string, VehicleDetail>());
  const quoteCache = useRef(new Map<string, Quote>());
  const lastQuotes = useRef(new Map<string, { data: Quote; args: QuoteArguments }>());
  const ctx = data.search_context;
  const searched = ctx ? { from: wallFromParts(ctx.from_date, ctx.from_date_time), to: wallFromParts(ctx.to_date, ctx.to_date_time) } : null;
  const dates: Dates = searched?.from && searched.to ? { from: searched.from, to: searched.to } : null;
  const place = [ctx?.region, ctx?.country].filter(Boolean).join(', ');

  const openDetail = async (v: VehicleSummary) => {
    if (!v.slug || busy.current) return;
    const cached = detailCache.current.get(v.id);
    if (cached) { setDetail({ vehicle: cached, dates }); return; }
    busy.current = true;
    const request = ++sequence.current;
    setOpeningId(v.id);
    setDetailFailed(false);
    const result = await actions.callServerTool('get_vehicle', { slug: v.slug });
    if (request !== sequence.current) return;
    busy.current = false;
    setOpeningId(null);
    const parsed = result && !result.isError ? parseResult(VehicleDetailSchema, result) : null;
    if (parsed && parsed.id === v.id) { detailCache.current.set(v.id, parsed); setDetail({ vehicle: parsed, dates }); }
    else setDetailFailed(true);
  };

  const openQuote = async (v: VehicleSummary) => {
    if (busy.current || !ctx?.from_date || !ctx.to_date) return;
    busy.current = true;
    const request = ++sequence.current;
    setOpeningId(v.id);
    setDetailFailed(false);
    try {
      let vehicleDetail = detailCache.current.get(v.id);
      if (!vehicleDetail && v.slug) {
        const result = await actions.callServerTool('get_vehicle', { slug: v.slug });
        const parsed = result && !result.isError ? parseResult(VehicleDetailSchema, result) : null;
        if (parsed?.id === v.id) { vehicleDetail = parsed; detailCache.current.set(v.id, parsed); }
      }
      const args: QuoteArguments = {
        vehicle_id: v.id, from_date: ctx.from_date, to_date: ctx.to_date,
        from_date_time: ctx.from_date_time ?? '10:00', to_date_time: ctx.to_date_time ?? '10:00',
      };
      const requiredPoints: { pickup?: boolean; return?: boolean } = {};
      for (const leg of ['pickup', 'return'] as const) {
        const globalId = searchArgs?.[leg === 'pickup' ? 'pickup_location_id' : 'return_location_id'];
        if (!globalId) continue;
        const matched = vehicleDetail?.meeting_points?.find((point) => point.location_id === globalId && point.type === (leg === 'pickup' ? 'PICKUP' : 'RETURN'));
        if (matched) args[leg === 'pickup' ? 'pickup_meeting_point_id' : 'return_meeting_point_id'] = matched.id;
        else requiredPoints[leg] = true;
      }
      const cacheKey = JSON.stringify(args);
      const previous = lastQuotes.current.get(v.id);
      if (previous && request === sequence.current) { setDetail(null); setQuotePanel({ vehicle: v, ...previous, requiredPoints }); return; }
      let quote = quoteCache.current.get(cacheKey);
      if (!quote) {
        const result = await actions.callServerTool('get_vehicle_quote', args);
        const parsed = result && !result.isError ? parseResult(QuoteSchema, result) : null;
        if (parsed) { quote = parsed; quoteCache.current.set(cacheKey, parsed); }
      }
      if (request !== sequence.current) return;
      if (quote) { setDetail(null); setQuotePanel({ vehicle: v, data: quote, args, requiredPoints }); }
      else setDetailFailed(true);
    } catch { setDetailFailed(true); }
    finally { if (request === sequence.current) { busy.current = false; setOpeningId(null); } }
  };

  const changeSort = async (sort: SearchArguments['sort']) => {
    if (!searchArgs || busy.current) return;
    busy.current = true;
    setSorting(true);
    setDetailFailed(false);
    const request = ++sequence.current;
    try {
      const args = { ...searchArgs, sort, page: 1, limit: 5 };
      const result = await actions.callServerTool('search_vehicles', args);
      const parsed = result && !result.isError ? parseResult(SearchVehiclesResult, result) : null;
      if (request !== sequence.current) return;
      if (parsed) { setData(parsed); setSearchArgs(args); setVisibleCount(5); quoteCache.current.clear(); lastQuotes.current.clear(); }
      else setDetailFailed(true);
    } catch { setDetailFailed(true); }
    finally { if (request === sequence.current) { busy.current = false; setSorting(false); } }
  };

  if (quotePanel) return <div className="rt-workspace"><Button variant="secondary" onClick={() => setQuotePanel(null)}>{t('results.backToList')}</Button><QuoteContent data={quotePanel.data} dates={dates} actions={actions} quoteArgs={quotePanel.args} vehicle={quotePanel.vehicle} requiredPoints={quotePanel.requiredPoints} onApplied={(quote, args) => { lastQuotes.current.set(quotePanel.vehicle.id, { data: quote, args }); quoteCache.current.set(JSON.stringify(args), quote); }} /></div>;

  if (detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Button variant="secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setDetail(null)}><IconChevronLeft size={18} />{t('back')}</Button>
        {detailFailed ? <Notice tone="err" role="alert">{t('state.actionFailed.text')}</Notice> : null}
        <VehicleDetailContent data={detail.vehicle} dates={detail.dates} actions={actions} onQuote={() => {
          const v = data.vehicles.find((vehicle) => vehicle.id === detail.vehicle.id);
          if (v) void openQuote(v);
        }} quoting={openingId !== null} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <Notice icon={<IconInfo size={18} />}>{t('results.estimate')}</Notice>
      <label className="rt-edit-label">{t('results.sort')}<select aria-label={t('results.sort')} value={data.search_context?.sort ?? searchArgs?.sort ?? 'default'} disabled={!searchArgs || sorting || openingId !== null} onChange={(e) => void changeSort(e.target.value as SearchArguments['sort'])}>
        {(['default', 'lower_price', 'higher_price', 'average_rating', 'amount_of_bookings'] as const).map((sort) => <option key={sort} value={sort}>{t(`results.sort.${sort}`)}</option>)}
      </select></label>
      {detailFailed ? <Notice tone="err" role="alert" title={t('state.actionFailed.title')}>{t('state.actionFailed.text')}</Notice> : null}
      {openingId ? <span className="rt-sr" role="status">{t('state.loading')}</span> : null}
      <div className="rt-grid">
        {data.vehicles.slice(0, visibleCount).map((v) => (
          <VehicleCard key={v.id} v={v} disabled={sorting || openingId !== null || !dates} opening={openingId === v.id} onDetail={() => void openDetail(v)} onQuote={() => void openQuote(v)} />
        ))}
      </div>
      {data.vehicles.length > 5 ? <Button variant="secondary" onClick={() => setVisibleCount(visibleCount >= data.vehicles.length ? 5 : visibleCount + 5)}>{visibleCount >= data.vehicles.length ? t('showLess') : t('showMore')}</Button> : null}
      {data.has_more === true ? <p className="rt-small" style={{ margin: 0, textAlign: 'center' }}>{t('results.hasMore')}</p> : null}
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

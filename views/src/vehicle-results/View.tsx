import { useRef, useState } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { SearchArguments, SearchVehiclesResult, type VehicleSummary } from '../_shared/contracts';
import { Badge, Button, Notice, SafeImage } from '../_shared/components';
import { formatMoney, formatRating, formatWallDateTime, wallFromParts, type WallTime } from '../_shared/format';
import { useI18n } from '../_shared/i18n';
import { IconCalendar, IconCheck, IconGear, IconInfo, IconPin, IconStar, IconUsers } from '../_shared/icons';
import { Frame, Parsed, parseResult, type ViewProps } from '../_shared/ViewRoot';
import { specValue } from '../_shared/features';
import { vehicleTitle } from '../_shared/vehicle';

type Dates = { from: WallTime; to: WallTime } | null;

function VehicleCard({ v }: { v: VehicleSummary }) {
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
          <Button disabled>{t('results.choose')}</Button>
        </div>
      </div>
    </article>
  );
}

export function VehicleResultsContent({ data: initialData, actions, searchArgs: initialArgs }: { data: SearchVehiclesResult; actions: Actions; searchArgs?: SearchArguments | null }) {
  const { t, locale } = useI18n();
  const [data, setData] = useState(initialData);
  const [searchArgs, setSearchArgs] = useState(initialArgs ?? null);
  const [detailFailed, setDetailFailed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [sorting, setSorting] = useState(false);
  const sequence = useRef(0);
  const busy = useRef(false);
  const ctx = data.search_context;
  const searched = ctx ? { from: wallFromParts(ctx.from_date, ctx.from_date_time), to: wallFromParts(ctx.to_date, ctx.to_date_time) } : null;
  const dates: Dates = searched?.from && searched.to ? { from: searched.from, to: searched.to } : null;
  const place = [ctx?.region, ctx?.country].filter(Boolean).join(', ');

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
      if (parsed) { setData(parsed); setSearchArgs(args); setVisibleCount(5); }
      else setDetailFailed(true);
    } catch { setDetailFailed(true); }
    finally { if (request === sequence.current) { busy.current = false; setSorting(false); } }
  };

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
      <label className="rt-edit-label">{t('results.sort')}<select aria-label={t('results.sort')} value={data.search_context?.sort ?? searchArgs?.sort ?? 'default'} disabled={!searchArgs || sorting} onChange={(e) => void changeSort(e.target.value as SearchArguments['sort'])}>
        {(['default', 'lower_price', 'higher_price', 'average_rating', 'amount_of_bookings'] as const).map((sort) => <option key={sort} value={sort}>{t(`results.sort.${sort}`)}</option>)}
      </select></label>
      {detailFailed ? <Notice tone="err" role="alert" title={t('state.actionFailed.title')}>{t('state.actionFailed.text')}</Notice> : null}
      <div className="rt-grid">
        {data.vehicles.slice(0, visibleCount).map((v) => (
          <VehicleCard key={v.id} v={v} />
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

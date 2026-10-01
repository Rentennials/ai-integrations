import type { Actions } from '../_bridge/useMcpApp';
import { Quote as QuoteSchema, type Quote } from '../_shared/contracts';
import { Button, DateBlock, Notice, PriceRow, SectionHead, TotalPanel, useAction } from '../_shared/components';
import { datesFromArgs, formatMoney, formatWallDate, formatWallDateTime, formatWallTime, parseWallTime, timezoneLabel, type WallTime } from '../_shared/format';
import { useI18n } from '../_shared/i18n';
import { IconBolt, IconClock, IconShield } from '../_shared/icons';
import { Frame, Parsed, type ViewProps } from '../_shared/ViewRoot';

export function QuoteContent({ data, dates, actions }: { data: Quote; dates: { from: WallTime; to: WallTime } | null; actions: Actions }) {
  const { t, locale, message } = useI18n();
  const c = data.currency;
  const m = (n: unknown, cur: unknown = c) => formatMoney(n, cur, locale) ?? t('notAvailable');
  const tz = timezoneLabel(data.timezone) ?? '—';
  const fast = data.automatic_approval === true && data.payment_fast?.available === true ? data.payment_fast : null;
  const fastDate = fast ? parseWallTime(fast.remaining_charge_date) : null;
  const totalText = formatMoney(data.total, c, locale);

  const [book, booking] = useAction(() =>
    actions.sendMessage(
      dates
        ? message('msg.book', { from: formatWallDateTime(dates.from, locale), to: formatWallDateTime(dates.to, locale), tz, total: totalText ?? 'Price unavailable' })
        : message('msg.bookNoDates', { total: totalText ?? 'Price unavailable' }),
    ),
  );

  const totalSub = [
    typeof data.total_days === 'number' && data.price_per_day != null ? t('quote.totalSub', { days: data.total_days, perDay: m(data.price_per_day) }) : null,
    typeof data.discount === 'number' && data.discount > 0 ? t('quote.discountIncluded', { code: data.discount_code ?? '' }).trim() : null,
  ].filter(Boolean).join(' · ');

  const coverageMeta = (x: { deposit_amount?: number | null; max_deductible?: number | null; luggage_theft_coverage?: number | null }) => (
    <div className="rt-row rt-small" style={{ gap: '4px 16px' }}>
      {x.deposit_amount != null ? <span>{t('quote.depositLine', { amount: m(x.deposit_amount) })}</span> : null}
      {x.max_deductible != null ? <span>{t('quote.deductibleLine', { amount: m(x.max_deductible) })}</span> : null}
      {x.luggage_theft_coverage != null ? <span>{t('quote.luggageAmount', { amount: m(x.luggage_theft_coverage) })}</span> : null}
    </div>
  );

  return (
    <div className="rt-split">
      <div className="rt-split__main">
        {dates ? <DateBlock from={dates.from} to={dates.to} timezone={data.timezone} /> : null}

        <section className="rt-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
          <h2 className="rt-h3" style={{ marginBottom: 6 }}>{t('quote.breakdown')}</h2>
          {data.breakdown.map((b, i) => {
            const unit = b.unit_amount != null && b.quantity != null ? `${b.quantity} × ${m(b.unit_amount)}` : null;
            return (
              <PriceRow
                key={`${b.concept}-${i}`}
                label={b.description ?? b.concept}
                sub={unit ?? undefined}
                amount={b.amount < 0 ? `− ${m(-b.amount)}` : m(b.amount)}
                discount={b.amount < 0}
              />
            );
          })}
        </section>

        {data.included_coverages && data.included_coverages.length > 0 ? (
          <section className="rt-section">
            <SectionHead title={t('quote.included')} />
            {data.included_coverages.map((x, i) => (
              <div key={`${x.type}-${i}`} className="rt-option rt-option--included">
                <div className="rt-between">
                  <span className="rt-option__name"><IconShield size={18} style={{ color: 'var(--rt-brand)' }} />{x.description ?? t('notAvailable')}</span>
                  <span className="rt-badge rt-badge--ok">{t('quote.includedBadge', { price: m(x.price) })}</span>
                </div>
                {coverageMeta(x)}
              </div>
            ))}
          </section>
        ) : null}

        {data.available_coverages && data.available_coverages.length > 0 ? (
          <section className="rt-section">
            <SectionHead title={t('quote.optional')} note={t('quote.optionalNote')} />
            <div className="rt-tiles">
              {data.available_coverages.map((x) => (
                <div key={x.id} className="rt-option">
                  <div className="rt-between">
                    <span className="rt-option__name">{x.description ?? t('notAvailable')}</span>
                    <span className="rt-price__amount">+ {m(x.price)}</span>
                  </div>
                  {coverageMeta(x)}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.available_extras && data.available_extras.length > 0 ? (
          <section className="rt-section">
            <SectionHead title={t('quote.extras')} note={t('quote.extrasNote')} />
            {data.available_extras.map((x) => (
              <div key={x.key} className="rt-between" style={{ alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--rt-divider)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 200px', minWidth: 0 }}>
                  <span className="rt-option__name">{x.label}</span>
                  <span className="rt-small">{x.description || t('quote.noDescription')}</span>
                </div>
                <div className="rt-row" style={{ gap: 6 }}>
                  {x.price_by_quantity.map((p, i) => <span key={i} className="rt-badge rt-badge--neutral">{t('quote.tier', { n: i + 1, price: m(p) })}</span>)}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>

      <aside className="rt-card rt-split__side">
        <TotalPanel label={t('quote.total')} amount={totalText ?? t('priceUnavailable')} sub={totalSub || undefined} />
        <div>
          <PriceRow titleFont label={t('quote.payNow')} sub={t('quote.payNowSub')} amount={m(data.pay_now)} />
          <PriceRow titleFont label={t('quote.onPickup')} sub={t('quote.onPickupSub')} amount={m(data.pay_on_pickup)} />
          <PriceRow titleFont label={t('quote.deposit')} sub={t('quote.depositSub')} amount={m(data.security_deposit, data.security_deposit_currency)} />
        </div>
        {fast ? (
          <Notice icon={<IconBolt size={18} />} title={t('quote.fastTitle')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '4px 12px', color: 'var(--rt-text-2)' }}>
              <span>{t('quote.fastNow')}</span><strong>{m(fast.amount_now, fast.currency)}</strong>
              <span>{t('quote.fastRest')}</span><strong>{m(fast.remaining_amount, fast.currency)}</strong>
            </div>
            {fastDate ? <span className="rt-small">{t('quote.fastDate', { date: formatWallDate(fastDate, locale), time: formatWallTime(fastDate, locale), tz })}</span> : null}
          </Notice>
        ) : null}
        <div className="rt-row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', color: 'var(--rt-text-2)', fontSize: 13, lineHeight: '19px' }}>
          <span style={{ color: 'var(--rt-brand)', flex: 'none' }}>{data.automatic_approval === true ? <IconBolt size={18} /> : <IconClock size={18} />}</span>
          <span>{data.automatic_approval === true ? t('quote.autoApproval') : data.automatic_approval === false ? t('quote.needsApproval') : t('notAvailable')}</span>
        </div>
        <Button block loading={booking} onClick={() => void book()}>{t('requestBooking')}</Button>
        <span className="rt-small" style={{ textAlign: 'center', marginTop: -6 }}>{t('quote.confirmInChat')}</span>
      </aside>
    </div>
  );
}

export function QuoteView({ view }: ViewProps) {
  const { t } = useI18n();
  return (
    <Frame title={t('title.quote')} view={view}>
      <Parsed schema={QuoteSchema} result={view.result} isEmpty={(d) => d.breakdown.length === 0 && d.total == null} emptyTitle="noResults" emptyText="quote.empty">
        {(data) => <QuoteContent key={view.receivedAt} data={data} dates={datesFromArgs(view.input)} actions={view.actions} />}
      </Parsed>
    </Frame>
  );
}

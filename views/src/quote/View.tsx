import type { Actions } from '../_bridge/useMcpApp';
import { Quote as QuoteSchema, QuoteArguments, type Quote } from '../_shared/contracts';
import { Button, DateBlock, Notice, PriceRow, SectionHead, TotalPanel, useAction } from '../_shared/components';
import { datesFromArgs, formatMoney, formatWallDate, formatWallDateTime, formatWallTime, parseWallTime, timezoneLabel, type WallTime } from '../_shared/format';
import { useI18n } from '../_shared/i18n';
import { IconBolt, IconClock, IconShield } from '../_shared/icons';
import { Frame, Parsed, type ViewProps } from '../_shared/ViewRoot';

type QuoteContentProps = {
  data: Quote;
  dates: { from: WallTime; to: WallTime } | null;
  actions: Actions;
  quoteArgs?: QuoteArguments | null;
};

export function QuoteContent({ data: initialData, dates: initialDates, actions, quoteArgs: initialArgs }: QuoteContentProps) {
  const [current, setCurrent] = useState({ data: initialData, args: initialArgs ?? null });
  const [requoting, setRequoting] = useState(false);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const requestSequence = useRef(0);
  const data = current.data;
  const dates = datesFromArgs(current.args) ?? initialDates;
  const { t, locale, message } = useI18n();
  const c = data.currency;
  const m = (n: unknown, cur: unknown = c) => formatMoney(n, cur, locale) ?? t('notAvailable');
  const tz = timezoneLabel(data.timezone) ?? '—';
  const fast = data.automatic_approval === true && data.payment_fast?.available === true ? data.payment_fast : null;
  const fastDate = fast ? parseWallTime(fast.remaining_charge_date) : null;
  const totalText = formatMoney(data.total, c, locale);

  const [book, booking] = useAction(async () => {
    if (requoting) return false;
    if (current.args && !await actions.updateModelContext({
      tool: 'get_vehicle_quote', arguments: current.args,
      quote: { total: data.total, currency: data.currency, automatic_approval: data.automatic_approval },
    })) return false;
    return actions.sendMessage(
      dates
        ? message('msg.book', { from: formatWallDateTime(dates.from, locale), to: formatWallDateTime(dates.to, locale), tz, total: totalText ?? 'Price unavailable' })
        : message('msg.bookNoDates', { total: totalText ?? 'Price unavailable' }),
    );
  });

  const allOptions = [...(initialData.included_coverages ?? []), ...(initialData.available_coverages ?? []), ...(data.included_coverages ?? []), ...(data.available_coverages ?? [])];
  const changeCoverage = async (type: string, selectedId: string) => {
    if (!current.args || requoting) return;
    const previous = current.args.covers ?? [];
    const idsOfType = new Set(allOptions.filter((option) => option.type === type && option.id).map((option) => option.id));
    if (previous.some((id) => !allOptions.some((option) => option.id === id))) { setQuoteFailed(true); return; }
    const args = { ...current.args, covers: [...previous.filter((id) => !idsOfType.has(id)), selectedId] };
    const sequence = ++requestSequence.current;
    setRequoting(true);
    setQuoteFailed(false);
    try {
      const result = await actions.callServerTool('get_vehicle_quote', args);
      const parsed = result && !result.isError ? QuoteSchema.safeParse(result.structuredContent) : null;
      if (sequence !== requestSequence.current) return;
      if (parsed?.success) setCurrent({ data: parsed.data, args });
      else setQuoteFailed(true);
    } finally {
      if (sequence === requestSequence.current) setRequoting(false);
    }
  };

  const selectableOptions = Array.from(new Map(allOptions.filter((option) => option.id && option.type).map((option) => [option.id!, option])).values());
  const coverageGroups = [...new Set(selectableOptions.map((option) => option.type!))];

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
            <SectionHead title={t('quote.optional')} note={t('quote.selectionNote')} />
            {!current.args ? <Notice>{t('quote.missingArgs')}</Notice> : null}
            {quoteFailed ? <Notice tone="err" role="alert">{t('quote.requoteFailed')}</Notice> : null}
            {requoting ? <span role="status">{t('quote.requoting')}</span> : null}
            <div className="rt-tiles">
              {coverageGroups.map((type) => <fieldset key={type} className="rt-option" disabled={requoting || !current.args}>
                <legend className="rt-small">{t(type === 'franchise_cover' ? 'quote.groupFranchise' : type === 'deposit_cover' ? 'quote.groupDeposit' : type === 'reserve_cover' ? 'quote.groupReserve' : 'quote.optional')}</legend>
                {selectableOptions.filter((option) => option.type === type).map((x) => <label key={x.id} className="rt-option">
                  <span className="rt-between">
                    <span className="rt-row"><input type="radio" name={`coverage-${type}`} aria-label={x.description ?? t('notAvailable')} checked={(data.included_coverages ?? []).some((included) => included.id === x.id) || (current.args?.covers ?? []).includes(x.id!)} onChange={() => void changeCoverage(type, x.id!)} />{x.description ?? t('notAvailable')}</span>
                    <span className="rt-price__amount">{m(x.price)}</span>
                  </span>
                  {coverageMeta(x)}
                </label>)}
              </fieldset>)}
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
        <Button block disabled={requoting || data.total == null} loading={booking} onClick={() => void book()}>{t('requestBooking')}</Button>
        <span className="rt-small" style={{ textAlign: 'center', marginTop: -6 }}>{t('quote.confirmInChat')}</span>
      </aside>
    </div>
  );
}

export function QuoteView({ view }: ViewProps) {
  const { t } = useI18n();
  const input = QuoteArguments.safeParse(view.input);
  const metaInput = input.success ? input : QuoteArguments.safeParse(view.result?._meta?.['rentennials/quote_args']);
  return (
    <Frame title={t('title.quote')} view={view}>
      <Parsed schema={QuoteSchema} result={view.result} isEmpty={(d) => d.breakdown.length === 0 && d.total == null} emptyTitle="noResults" emptyText="quote.empty">
        {(data) => <QuoteContent key={view.receivedAt} data={data} dates={datesFromArgs(view.input)} actions={view.actions} quoteArgs={metaInput.success ? metaInput.data : null} />}
      </Parsed>
    </Frame>
  );
}
import { useRef, useState } from 'react';

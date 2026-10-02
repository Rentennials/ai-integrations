import type { ReactElement } from 'react';
import { useState } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { BookingDetail as BookingDetailSchema, ListBookingsResult, type BookingDetail, type BookingSummary } from '../_shared/contracts';
import { Badge, Button, DateBlock, Notice, PriceRow, StateMessage, TimezoneNote, TotalPanel, useAction, type Tone } from '../_shared/components';
import { formatInstant, formatMoney, formatWallDate, formatWallDateTime, formatWallTime, parseInstant, parseWallTime } from '../_shared/format';
import { statusKey, useI18n } from '../_shared/i18n';
import { IconCheck, IconChevronLeft, IconClock, IconExtension, IconExternal, IconFlagEnd, IconFlagStart, IconMoney, IconQuestion, IconSearch, IconX } from '../_shared/icons';
import { safeLinkUrl } from '../_shared/safety';
import { Frame, parseResult, type ViewProps } from '../_shared/ViewRoot';

const STATUS_TONE: Record<string, [Tone, ReactElement]> = {
  pending_approval: ['warn', <IconClock size={14} />],
  awaiting_payment: ['warn', <IconClock size={14} />],
  approved: ['ok', <IconCheck size={14} />],
  confirmed: ['ok', <IconCheck size={14} />],
  cancelled: ['err', <IconX size={14} />],
};

export const canPay = (b: { needs_payment?: boolean | null; paid?: boolean | null; is_extension?: boolean | null }) =>
  b.needs_payment === true && b.paid === false && b.is_extension === false;

function StatusBadge({ status }: { status: string | null | undefined }) {
  const { t } = useI18n();
  const key = statusKey(status);
  const [tone, icon] = (key && STATUS_TONE[key.slice('status.'.length)]) || (['neutral', <IconQuestion size={14} />] as [Tone, ReactElement]);
  return <Badge tone={tone} icon={icon}>{key ? t(key) : String(status)}</Badge>;
}

function BookingCard({ b, actions, onDetail, opening }: { b: BookingSummary; actions: Actions; onDetail: () => void; opening: boolean }) {
  const { t, locale, message } = useI18n();
  const from = parseWallTime(b.from);
  const to = parseWallTime(b.to);
   const [pay, paying] = useAction(() => actions.sendMessage(message('msg.pay', { number: b.booking_number ?? 'Not available', vehicle: b.vehicle_name ?? 'Not available' })));
  let payLabel: string;
  let paySub: string;
  if (b.paid === true) { payLabel = t('bookings.paid'); paySub = t('bookings.paidSub'); }
  else if (b.amount_to_pay_now == null) { payLabel = t('bookings.pendingUnknown'); paySub = t('bookings.pendingUnknownSub'); }
  else {
    payLabel = t('bookings.payNow', { amount: formatMoney(b.amount_to_pay_now, b.currency, locale) ?? t('notAvailable') });
    paySub = b.is_extension === true ? t('bookings.extensionSub') : b.needs_payment === true ? t('bookings.needsPayment') : t('bookings.noPayment');
  }
  const fact = (icon: ReactElement, label: string, value: string) => (
    <div className="rt-booking__fact">{icon}<div><span className="rt-booking__fact-label">{label}</span><span className="rt-booking__fact-value">{value}</span></div></div>
  );
  return (
    <article className="rt-card" aria-label={`${b.booking_number} · ${b.vehicle_name}`}>
      <div className="rt-booking__head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: '1 1 220px' }}>
          <span className="rt-number">{t('bookings.number')} <span>{b.booking_number}</span></span>
          <h2 className="rt-h3" style={{ fontSize: 22, lineHeight: '28px' }}>{b.vehicle_name}</h2>
        </div>
        <div className="rt-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          {b.is_extension === true ? <Badge tone="neutral" icon={<IconExtension size={14} />}>{t('bookings.extension')}</Badge> : null}
          <StatusBadge status={b.status} />
        </div>
      </div>
      <div className="rt-booking__facts">
        {fact(<IconFlagStart size={22} />, t('from'), from ? formatWallDateTime(from, locale) : t('notAvailable'))}
        {fact(<IconFlagEnd size={22} />, t('to'), to ? formatWallDateTime(to, locale) : t('notAvailable'))}
        {fact(<IconMoney size={22} />, t('bookings.total'), formatMoney(b.total, b.currency, locale) ?? t('notAvailable'))}
      </div>
      <div style={{ padding: '0 20px 12px' }}><TimezoneNote timezone={b.timezone} /></div>
      <div className="rt-booking__foot">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 200px' }}>
          <span style={{ font: '500 13px/18px var(--rt-font-body)', color: 'var(--rt-text-2)' }}>{payLabel}</span>
          <span className="rt-small">{paySub}</span>
        </div>
        <div className="rt-booking__foot-actions">
          <Button variant="secondary" loading={opening} onClick={onDetail} style={{ background: 'var(--rt-surface)' }}>{t('viewDetails')}</Button>
          {canPay(b) ? <Button loading={paying} onClick={() => void pay()}>{t('pay')}</Button> : null}
        </div>
      </div>
    </article>
  );
}

export function BookingDetailContent({ data, actions }: { data: BookingDetail; actions: Actions }) {
  const { t, locale, message } = useI18n();
  const c = data.currency;
  const m = (n: unknown, cur: unknown = c) => formatMoney(n, cur, locale) ?? t('notAvailable');
  const contract = safeLinkUrl(data.contract_url);
   const [pay, paying] = useAction(() => actions.sendMessage(message('msg.pay', { number: data.booking_number ?? 'Not available', vehicle: data.vehicle_name ?? 'Not available' })));
  const [openContract, openingContract] = useAction(() => (contract ? actions.openLink(contract) : Promise.resolve(false)));
  const paidAt = parseInstant(data.date_paid);
  const instalment = data.next_instalment;
  const debit = instalment ? parseWallTime(instalment.debit_date) : null;

  return (
    <div className="rt-split">
      <div className="rt-card rt-split__main" style={{ padding: 20, gap: 16 }}>
        <div className="rt-between">
          <span className="rt-number">{t('bookings.number')} <span>{data.booking_number}</span></span>
          <div className="rt-row" style={{ gap: 6 }}>
            {data.is_extension === true ? <Badge tone="neutral" icon={<IconExtension size={14} />}>{t('bookings.extension')}</Badge> : null}
            <StatusBadge status={data.status} />
          </div>
        </div>
        {data.cancelled === true ? <Notice tone="err">{t('bookings.cancelled')}</Notice> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 12, borderTop: '1px solid var(--rt-divider)' }}>
          <h2 className="rt-h2" style={{ fontSize: 24, lineHeight: '30px' }}>{data.vehicle_name}</h2>
          {data.pickup_city ? <span className="rt-meta">{t('bookings.pickupIn', { city: data.pickup_city })}</span> : null}
        </div>
        <DateBlock from={parseWallTime(data.from)} to={parseWallTime(data.to)} timezone={data.timezone} />
        <div className="rt-tiles" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 10 }}>
          {[
            [t('bookings.pickupPoint'), data.pickup_meeting_point?.name ?? t('notInformed')],
            [t('bookings.returnPoint'), data.return_meeting_point?.name ?? t('notInformed')],
            [t('bookings.kms'), data.included_kms_per_day == null ? t('notInformed') : t('bookings.kmsValue', { n: data.included_kms_per_day })],
          ].map(([label, value]) => (
            <div key={label} className="rt-step" style={{ borderRadius: 14 }}>
              <span className="rt-small" style={{ fontWeight: 500 }}>{label}</span>
              <span style={{ font: '500 14px/20px var(--rt-font-body)' }}>{value}</span>
            </div>
          ))}
        </div>
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="rt-h3" style={{ marginBottom: 4 }}>{t('quote.breakdown')}</h3>
          <PriceRow label={t('bookings.subtotal')} amount={m(data.subtotal)} />
          {(data.coverages ?? []).map((x, i) => <PriceRow key={`c${i}`} label={t('bookings.coverage', { name: x.name ?? t('notAvailable') })} amount={m(x.price)} />)}
          {(data.extra_services ?? []).map((x, i) => <PriceRow key={`e${i}`} label={x.quantity != null ? `${x.name} × ${x.quantity}` : x.name} amount={m(x.price)} />)}
          {data.extra_services_total != null ? <PriceRow label={t('bookings.extrasTotal')} amount={m(data.extra_services_total)} /> : null}
          {data.discount_total != null ? (
            <PriceRow label={t('bookings.discounts')} discount={data.discount_total > 0} amount={data.discount_total > 0 ? `− ${m(data.discount_total)}` : m(0)} />
          ) : null}
        </section>
      </div>
      <aside className="rt-card rt-split__side">
        <TotalPanel label={t('bookings.total')} amount={m(data.total)} />
        <div>
          <PriceRow
            titleFont
            label={data.paid === true ? t('bookings.paid') : t('quote.payNow')}
            sub={paidAt != null ? t('bookings.paidOn', { date: formatInstant(paidAt, locale) }) : t('bookings.pendingPayment')}
            amount={data.paid === true ? '—' : m(data.amount_to_pay_now, data.amount_to_pay_now_currency ?? c)}
          />
          {instalment ? (
            <PriceRow
              titleFont
              label={t('bookings.nextInstalment')}
              sub={debit ? t('bookings.debitOn', { date: formatWallDate(debit, locale), time: formatWallTime(debit, locale) }) : undefined}
              amount={m(instalment.amount, instalment.currency)}
            />
          ) : null}
          {data.security_deposit ? (
            <PriceRow
              titleFont
              label={t('quote.deposit')}
              sub={data.security_deposit.paid === true ? t('bookings.depositPaid') : t('bookings.depositPending')}
              amount={m(data.security_deposit.amount, data.security_deposit.currency)}
            />
          ) : null}
        </div>
        {canPay(data) ? <Button block loading={paying} onClick={() => void pay()}>{t('pay')}</Button> : null}
        {contract ? <Button variant="secondary" block loading={openingContract} onClick={() => void openContract()}>{t('contract')}<IconExternal size={16} /></Button> : null}
      </aside>
    </div>
  );
}

export function BookingListContent({ data, actions }: { data: ListBookingsResult; actions: Actions }) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const open = async (b: BookingSummary) => {
    if (openingId) return;
    setOpeningId(b.booking_id);
    setFailed(false);
    const result = await actions.callServerTool('get_booking', { booking_id: b.booking_id });
    setOpeningId(null);
    const parsed = result && !result.isError ? parseResult(BookingDetailSchema, result) : null;
    if (parsed) setDetail(parsed);
    else setFailed(true);
  };

  if (detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Button variant="secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setDetail(null)}><IconChevronLeft size={18} />{t('back')}</Button>
        <BookingDetailContent data={detail} actions={actions} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span className="rt-small" style={{ fontWeight: 500 }}>
        {typeof data.total_count === 'number' ? t('bookings.count', { n: data.bookings.length, total: data.total_count }) : t('bookings.shown', { n: data.bookings.length })}
      </span>
      {failed ? <Notice tone="err" role="alert" title={t('state.actionFailed.title')}>{t('state.actionFailed.text')}</Notice> : null}
      {data.bookings.map((b) => (
        <BookingCard key={b.booking_id} b={b} actions={actions} opening={openingId === b.booking_id} onDetail={() => void open(b)} />
      ))}
      {data.has_more === true ? <p className="rt-small" style={{ margin: 0, textAlign: 'center' }}>{t('bookings.hasMore')}</p> : null}
    </div>
  );
}

export function MyBookingsView({ view }: ViewProps) {
  const { t } = useI18n();
  const sc = view.result?.structuredContent;
  const list = ListBookingsResult.safeParse(sc);
  const single = list.success ? null : BookingDetailSchema.safeParse(sc);
  const title = single?.success ? t('title.bookingDetail') : t('title.bookings');
  return (
    <Frame title={title} view={view}>
      {list.success ? (
        list.data.bookings.length === 0 ? (
          <StateMessage icon={<IconSearch size={24} />} title={t('bookings.emptyTitle')} text={t('bookings.empty')} />
        ) : (
          <BookingListContent key={view.receivedAt} data={list.data} actions={view.actions} />
        )
      ) : single?.success ? (
        <BookingDetailContent key={view.receivedAt} data={single.data} actions={view.actions} />
      ) : (
        <StateMessage icon={<IconQuestion size={24} />} title={t('state.invalid.title')} text={t('state.invalid.text')} />
      )}
    </Frame>
  );
}

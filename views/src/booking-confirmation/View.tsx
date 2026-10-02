import type { ReactElement } from 'react';
import { useMemo } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { CreateBookingResult, PayBookingResult } from '../_shared/contracts';
import { Badge, Button, Countdown, DateBlock, Notice, PriceRow, useAction, useNow } from '../_shared/components';
import { computeDeadline, formatMoney, formatWallDate, formatWallTime, parseWallTime, timezoneLabel } from '../_shared/format';
import { statusKey, useI18n } from '../_shared/i18n';
import { IconAlert, IconClock, IconExternal, IconLink, IconTimer } from '../_shared/icons';
import { safeLinkUrl } from '../_shared/safety';
import { Frame, type ViewProps } from '../_shared/ViewRoot';
import { StateMessage } from '../_shared/components';
import { IconQuestion } from '../_shared/icons';

type Props = { actions: Actions; receivedAt: number };

function PayBlock({ url, deadline, actions }: { url: string | null; deadline: number | null; actions: Actions }) {
  const { t } = useI18n();
  const now = useNow(deadline != null);
  const remaining = deadline == null ? null : deadline - now;
  const expired = remaining != null && remaining <= 0;
  const [pay, paying] = useAction(() => (url ? actions.openLink(url) : Promise.resolve(false)));
  if (!url) return <Notice tone="err" role="alert">{t('confirm.linkInvalid')}</Notice>;
  return (
    <div className="rt-pay">
      {remaining != null && !expired ? <Countdown remainingMs={remaining} /> : null}
      {expired ? (
        <div role="alert" className="rt-row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', color: 'var(--rt-text-2)', fontSize: 13, lineHeight: '19px' }}>
          <IconTimer style={{ color: 'var(--rt-err-text)', flex: 'none' }} />
          <span><strong>{t('linkExpired')}</strong><br />{t('confirm.expiredText')}</span>
        </div>
      ) : null}
      <Button block disabled={expired} loading={paying} onClick={() => void pay()}>
        {t('payOnRentennials')}<IconExternal size={18} />
      </Button>
      <span className="rt-small" style={{ textAlign: 'center', marginTop: -4 }}>{t('opensOutside')}</span>
    </div>
  );
}

function Manage({ url, actions }: { url: unknown; actions: Actions }) {
  const { t } = useI18n();
  const safe = safeLinkUrl(url);
  const [open, opening] = useAction(() => (safe ? actions.openLink(safe) : Promise.resolve(false)));
  if (!safe) return null;
  return <Button variant="secondary" block loading={opening} onClick={() => void open()}>{t('manage')}<IconExternal size={16} /></Button>;
}

function Head({ tone, icon, title, subtitle }: { tone: 'warn' | 'err' | 'brand'; icon: ReactElement; title: string; subtitle: string }) {
  return (
    <Notice tone={tone} role="status" icon={icon} title={<span style={{ font: '400 20px/26px var(--rt-font-title)' }}>{title}</span>}>
      {subtitle}
    </Notice>
  );
}

export function CreateBookingContent({ data, actions, receivedAt }: Props & { data: CreateBookingResult }) {
  const { t, locale } = useI18n();
  const c = data.currency;
  const m = (n: unknown) => formatMoney(n, c, locale) ?? t('notAvailable');
  const url = safeLinkUrl(data.payment_url);
  const hasLink = data.mode === 'instant' && data.payment_url != null;
  const deadline = useMemo(() => computeDeadline(data.payment_expires_at, data.payment_expires_in_seconds, receivedAt), [data, receivedAt]);
  const now = useNow(hasLink && deadline != null);
  const expired = hasLink && deadline != null && deadline - now <= 0;
  const st = statusKey(data.status);
  const fast = data.payment_plan === 'fast';
  const restDate = parseWallTime(data.remaining_charge_date);
  const tz = timezoneLabel(data.timezone) ?? '—';
  const from = parseWallTime(data.from);
  const to = parseWallTime(data.to);

  const head =
    data.mode === 'request'
      ? { tone: 'warn' as const, icon: <IconClock size={22} />, title: t('confirm.requestTitle'), subtitle: t('confirm.requestSub') }
      : expired
        ? { tone: 'err' as const, icon: <IconAlert size={22} />, title: t('linkExpired'), subtitle: t('confirm.expiredSub') }
        : { tone: 'warn' as const, icon: <IconClock size={22} />, title: t('confirm.instantTitle'), subtitle: t('confirm.instantSub') };

  return (
    <div className="rt-narrow">
      <Head {...head} />
      {data.total_matches_quote === false ? (
        <Notice tone="warn" role="alert" title={t('confirm.totalChangedTitle')}>{t('confirm.totalChangedText')}</Notice>
      ) : null}
      <div className="rt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="rt-between">
          <span className="rt-number">{t('confirm.number')} <span>{data.booking_number}</span></span>
          <Badge tone="neutral">{st ? t(st) : String(data.status)}</Badge>
        </div>
        <h2 className="rt-h3" style={{ fontSize: 22, lineHeight: '28px', paddingTop: 12, borderTop: '1px solid var(--rt-divider)' }}>{data.vehicle_name}</h2>
        {from || to ? <DateBlock from={from} to={to} timezone={data.timezone} /> : null}
        <div>
          <PriceRow titleFont big label={t('confirm.rentalTotal')} sub={data.total_matches_quote === false ? t('confirm.updated') : data.total_matches_quote === true ? t('confirm.matches') : undefined} amount={m(data.total)} />
          <PriceRow titleFont label={data.mode === 'request' ? t('confirm.payOnApproval') : t('confirm.payNow')} sub={fast ? t('confirm.fastInitial') : t('confirm.deposit')} amount={m(data.pay_now)} />
           {fast ? <PriceRow
             titleFont
             label={t('confirm.fastRest')}
             sub={restDate ? t('confirm.restOn', { date: formatWallDate(restDate, locale), time: formatWallTime(restDate, locale), tz }) : undefined}
             amount={m(data.remaining_amount)}
           /> : null}
        </div>
        <div className="rt-step">
          <span className="rt-step__label">{t('confirm.nextStep')}</span>
          <span>{data.next_step || t('confirm.noNextStep')}</span>
        </div>
        {hasLink ? <PayBlock url={url} deadline={deadline} actions={actions} /> : null}
        <Manage url={data.manage_url} actions={actions} />
      </div>
    </div>
  );
}

export function PayBookingContent({ data, actions, receivedAt }: Props & { data: PayBookingResult }) {
  const { t, locale } = useI18n();
  const deadline = useMemo(() => computeDeadline(data.payment_url_expires_at, data.payment_url_expires_in_seconds, receivedAt), [data, receivedAt]);
  return (
    <div className="rt-narrow">
      <Head tone="brand" icon={<IconLink size={22} />} title={t('confirm.payLinkTitle')} subtitle={t('confirm.payLinkSub')} />
      <div className="rt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="rt-number">{t('confirm.number')} <span>{data.booking_number}</span></span>
        <h2 className="rt-h3" style={{ fontSize: 22, lineHeight: '28px', paddingTop: 12, borderTop: '1px solid var(--rt-divider)' }}>{data.vehicle_name}</h2>
        <PriceRow titleFont big label={t('confirm.amountToPay')} sub={t('confirm.amountToPaySub')} amount={formatMoney(data.amount, data.currency, locale) ?? t('notAvailable')} />
        <div className="rt-step">
          <span className="rt-step__label">{t('confirm.nextStep')}</span>
          <span>{data.next_step || t('confirm.noNextStep')}</span>
        </div>
        <PayBlock url={safeLinkUrl(data.payment_url)} deadline={deadline} actions={actions} />
        <Manage url={data.manage_url} actions={actions} />
      </div>
    </div>
  );
}

export function BookingConfirmationView({ view }: ViewProps) {
  const { t } = useI18n();
  const sc = view.result?.structuredContent;
  const created = CreateBookingResult.safeParse(sc);
  const paid = created.success ? null : PayBookingResult.safeParse(sc);
  return (
    <Frame title={t('title.confirmation')} view={view}>
      {created.success ? (
        <CreateBookingContent key={view.receivedAt} data={created.data} actions={view.actions} receivedAt={view.receivedAt} />
      ) : paid?.success ? (
        <PayBookingContent key={view.receivedAt} data={paid.data} actions={view.actions} receivedAt={view.receivedAt} />
      ) : (
        <StateMessage icon={<IconQuestion size={24} />} title={t('state.invalid.title')} text={t('state.invalid.text')} />
      )}
    </Frame>
  );
}

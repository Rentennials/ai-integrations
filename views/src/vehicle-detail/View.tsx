import type { ReactElement } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import type { VehicleDetail } from '../_shared/contracts';
import { Badge, Button, DateBlock, ExpandableText, Gallery, Notice, SectionHead, useAction } from '../_shared/components';
import { formatMoney, formatWallDateTime, timezoneLabel, type WallTime } from '../_shared/format';
import { useI18n, type TranslationKey } from '../_shared/i18n';
import { IconCheck, IconDoor, IconFlagEnd, IconFlagStart, IconFuel, IconGear, IconRoad, IconUsers, IconX } from '../_shared/icons';
import { Frame, Parsed, type ViewProps } from '../_shared/ViewRoot';
import { VehicleDetail as VehicleDetailSchema } from '../_shared/contracts';
import { datesFromArgs } from '../_shared/format';

const KNOWN_WARNINGS = ['images_invalid', 'disclaimer_truncated', 'features_invalid'];

export function VehicleDetailContent({
  data, dates, actions,
}: { data: VehicleDetail; dates: { from: WallTime; to: WallTime } | null; actions: Actions }) {
  const { t, locale, message } = useI18n();
  const title = data.year ? `${data.name} ${data.year}` : data.name;
  const warnings = data.content_warnings ?? [];
  const features = data.features ?? [];
  const enabled = features.filter((f) => f.value === 'true');
  const disabled = features.filter((f) => f.value === 'false');
  const textual = features.filter((f) => f.value !== 'true' && f.value !== 'false' && f.value != null && f.value !== '');
  const points = data.meeting_points ?? [];
  const tz = timezoneLabel(data.timezone) ?? '—';

  const specs = [
    data.transmission ? { icon: <IconGear size={24} />, label: data.transmission } : null,
    data.passengers ? { icon: <IconUsers size={24} />, label: t('spec.passengers', { n: data.passengers }) } : null,
    data.fuel ? { icon: <IconFuel size={24} />, label: data.fuel } : null,
    data.doors ? { icon: <IconDoor size={24} />, label: t('spec.doors', { n: data.doors }) } : null,
    data.kms_per_day != null ? { icon: <IconRoad size={24} />, label: t('spec.kms', { n: data.kms_per_day }) } : null,
  ].filter((s): s is { icon: ReactElement; label: string } => s !== null);

  const [quote, quoting] = useAction(() =>
    actions.sendMessage(
      dates
        ? message('msg.quoteNoCity', { vehicle: title, from: formatWallDateTime(dates.from, locale), to: formatWallDateTime(dates.to, locale), tz })
        : message('msg.quoteNoDates', { vehicle: title }),
    ),
  );

  const pointGroup = (type: 'PICKUP' | 'RETURN', label: TranslationKey, icon: ReactElement) => {
    const items = points.filter((p) => p.type === type);
    return (
      <div className="rt-panel">
        <span className="rt-option__name" style={{ color: 'var(--rt-brand)' }}>{icon}{t(label)}</span>
        {items.length === 0 ? <span className="rt-small">{t('detail.noPoints')}</span> : null}
        {items.map((p) => {
          const money = formatMoney(p.price, data.currency, locale);
          return (
            <div key={p.id} className="rt-price">
              <span className="rt-price__name" style={{ fontWeight: 400 }}>{p.name}</span>
              <span className="rt-price__amount">
                {money == null ? t('notAvailable') : p.price === 0 ? t('detail.free', { amount: money }) : `+ ${money}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 className="rt-h2">{title}</h2>
      {warnings.length > 0 ? (
        <Notice tone="warn" role="note" title={t('detail.warningsTitle')}>
          {[...new Set(warnings.map((w) => (KNOWN_WARNINGS.includes(w) ? (`warn.${w}` as TranslationKey) : 'warn.other')))].map((key) => (
            <span key={key}>· {t(key)}</span>
          ))}
        </Notice>
      ) : null}

      <div className="rt-split">
        <div className="rt-split__half"><Gallery urls={data.image_urls ?? []} name={title} /></div>
        <div className="rt-split__half rt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="rt-h3">{t('detail.specs')}</h3>
          {specs.length > 0 ? (
            <div className="rt-specs">
              {specs.map((s) => <div key={s.label} className="rt-spec">{s.icon}<span>{s.label}</span></div>)}
            </div>
          ) : null}
          {dates ? <DateBlock from={dates.from} to={dates.to} timezone={data.timezone} caption={t('detail.searchDates')} /> : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Button block loading={quoting} onClick={() => void quote()}>{t('getQuote')}</Button>
            <span className="rt-small" style={{ textAlign: 'center' }}>{dates ? t('detail.quoteWithDates') : t('detail.quoteAskDates')}</span>
          </div>
        </div>
      </div>

      {features.length > 0 ? (
        <section className="rt-section">
          <SectionHead title={t('detail.equipment')} />
          {enabled.length > 0 ? (
            <ul className="rt-row" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
               {enabled.map((f) => <li key={f.key}><Badge tone="neutral" icon={<IconCheck size={14} />}>{f.label ?? f.key}</Badge></li>)}
            </ul>
          ) : null}
          {disabled.length > 0 ? (
            <div className="rt-row rt-small">
              <span style={{ fontWeight: 500 }}>{t('detail.notIncluded')}</span>
              {disabled.map((f) => <span key={f.key} className="rt-row" style={{ gap: 4 }}><IconX size={12} />{f.label}</span>)}
            </div>
          ) : null}
          {textual.map((f) => (
            <div key={f.key} className="rt-small" style={{ overflowWrap: 'anywhere' }}>
              <strong style={{ fontWeight: 500, color: 'var(--rt-text-2)' }}>{f.label}:</strong> {f.value}
            </div>
          ))}
        </section>
      ) : null}

      {data.description ? (
        <section className="rt-section">
          <SectionHead title={t('detail.description')} />
          <ExpandableText text={data.description} />
        </section>
      ) : null}

      <section className="rt-section">
        <SectionHead title={t('detail.conditions')} />
        <ExpandableText text={data.disclaimer || t('detail.noConditions')} />
        {warnings.includes('disclaimer_truncated') ? <Notice tone="neutral">{t('detail.truncated')}</Notice> : null}
      </section>

      <section className="rt-section">
        <SectionHead title={t('detail.points')} />
        <div className="rt-tiles">
          {pointGroup('PICKUP', 'detail.pickup', <IconFlagStart size={18} />)}
          {pointGroup('RETURN', 'detail.return', <IconFlagEnd size={18} />)}
        </div>
      </section>

      <section className="rt-section">
        <SectionHead title={t('detail.depositTitle')} />
        <div className="rt-tiles">
          <div className="rt-tile">
            <span className="rt-tile__amount">{formatMoney(data.guarantee_deposit, data.guarantee_deposit_currency, locale) ?? t('notAvailable')}</span>
            <span className="rt-tile__label">{t('detail.deposit')}</span>
          </div>
          <div className="rt-tile">
            <span className="rt-tile__amount">{formatMoney(data.deductible, data.currency, locale) ?? t('notAvailable')}</span>
            <span className="rt-tile__label">{t('detail.deductible')}</span>
          </div>
        </div>
        <span className="rt-small">{t('detail.depositNote')}</span>
      </section>
    </div>
  );
}

export function VehicleDetailView({ view }: ViewProps) {
  const { t } = useI18n();
  return (
    <Frame title={t('title.detail')} view={view}>
      <Parsed schema={VehicleDetailSchema} result={view.result} emptyTitle="noResults" emptyText="state.invalid.text">
        {(data) => <VehicleDetailContent key={view.receivedAt} data={data} dates={datesFromArgs(view.input)} actions={view.actions} />}
      </Parsed>
    </Frame>
  );
}

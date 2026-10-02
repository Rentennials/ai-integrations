import { useContext, useEffect, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { useI18n } from './i18n';
import { formatCountdown, formatWallDate, formatWallTime, timezoneLabel, type WallTime } from './format';
import { ImageOriginContext, safeImageUrl } from './safety';
import {
  IconAlert, IconCar, IconChevronLeft, IconChevronRight, IconFlagEnd, IconFlagStart, IconInfo, IconTimer,
} from './icons';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'link';
  block?: boolean;
  loading?: boolean;
};

export function Button({ variant = 'primary', block, loading, className, children, disabled, ...rest }: ButtonProps) {
  const cls = ['rt-btn', `rt-btn--${variant}`, block ? 'rt-btn--block' : '', className ?? ''].join(' ').trim();
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="rt-btn__spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function useAction<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  const [pending, setPending] = useState(false);
  const run = async (...args: A) => {
    if (pending) return;
    setPending(true);
    try {
      await fn(...args);
    } finally {
      setPending(false);
    }
  };
  return [run, pending] as const;
}

export type Tone = 'brand' | 'ok' | 'warn' | 'err' | 'neutral';

export function Badge({ tone = 'brand', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`rt-badge${tone === 'brand' ? '' : ` rt-badge--${tone}`}`}>
      {icon}
      {children}
    </span>
  );
}

export function Notice({
  tone = 'brand', title, children, icon, role,
}: { tone?: Tone; title?: ReactNode; children?: ReactNode; icon?: ReactNode; role?: 'alert' | 'status' | 'note' }) {
  return (
    <div className={`rt-notice${tone === 'brand' ? '' : ` rt-notice--${tone}`}`} role={role}>
      <span className="rt-notice__icon">{icon ?? (tone === 'warn' || tone === 'err' ? <IconAlert /> : <IconInfo />)}</span>
      <div className="rt-notice__text">
        {title ? <span className="rt-notice__title">{title}</span> : null}
        {children}
      </div>
    </div>
  );
}

export function TimezoneNote({ timezone }: { timezone: unknown }) {
  const { t } = useI18n();
  const label = timezoneLabel(timezone);
  return <span className="rt-small rt-dates__tz">{label ? t('localTime', { tz: label }) : t('noTimezone')}</span>;
}

export function DateBlock({ from, to, timezone, caption }: { from: WallTime | null; to: WallTime | null; timezone: unknown; caption?: string }) {
  const { t, locale } = useI18n();
  const cell = (label: string, icon: ReactNode, w: WallTime | null) => (
    <div className="rt-dates__cell">
      <span className="rt-dates__label">{icon}{label}</span>
      <span className="rt-dates__date">{w ? formatWallDate(w, locale) : t('notAvailable')}</span>
      {w ? <span className="rt-dates__time">{formatWallTime(w, locale)}</span> : null}
    </div>
  );
  return (
    <div className="rt-dates">
      {caption ? <span className="rt-small" style={{ fontWeight: 500 }}>{caption}</span> : null}
      <div className="rt-dates__grid">
        {cell(t('from'), <IconFlagStart size={18} />, from)}
        {cell(t('to'), <IconFlagEnd size={18} />, to)}
      </div>
      <TimezoneNote timezone={timezone} />
    </div>
  );
}

export function PriceRow({
  label, sub, amount, discount, big, titleFont,
}: { label: ReactNode; sub?: ReactNode; amount: ReactNode; discount?: boolean; big?: boolean; titleFont?: boolean }) {
  return (
    <div className="rt-price">
      <div className="rt-price__label">
        <span className={`rt-price__name${titleFont ? ' rt-price__name--title' : ''}`}>{label}</span>
        {sub ? <span className="rt-small">{sub}</span> : null}
      </div>
      <span className={`rt-price__amount${discount ? ' rt-price__amount--discount' : ''}${big ? ' rt-price__amount--big' : ''}`}>{amount}</span>
    </div>
  );
}

export function TotalPanel({ label, amount, sub }: { label: ReactNode; amount: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rt-total">
      <span className="rt-total__label">{label}</span>
      <span className="rt-total__amount">{amount}</span>
      {sub ? <span className="rt-total__sub">{sub}</span> : null}
    </div>
  );
}

export function SafeImage({ src, alt }: { src: unknown; alt: string }) {
  const { t } = useI18n();
  const origins = useContext(ImageOriginContext);
  const safe = safeImageUrl(src, origins);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [safe]);
  if (!safe || failed) {
    return (
      <div className="rt-media__fallback" role="img" aria-label={t('imageUnavailable')}>
        <IconCar size={44} strokeWidth={1.4} />
        <span>{t('imageUnavailable')}</span>
      </div>
    );
  }
  return <img src={safe} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

export function Gallery({ urls, name }: { urls: string[]; name: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const n = urls.length;
  const go = (i: number) => setIndex(((i % n) + n) % n);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  };
  if (n === 0) {
    return (
      <div className="rt-gallery">
        <div className="rt-media rt-gallery__stage"><SafeImage src={null} alt="" /></div>
      </div>
    );
  }
  return (
    <div className="rt-gallery" role="region" aria-roledescription="carousel" aria-label={t('detail.photos')} onKeyDown={onKey}>
      <div className="rt-media rt-gallery__stage">
        <SafeImage key={index} src={urls[index]} alt={t('detail.photo', { name, i: index + 1, n })} />
        {n > 1 ? (
          <>
            <button type="button" className="rt-gallery__nav rt-gallery__nav--prev" aria-label={t('detail.prev')} onClick={() => go(index - 1)}><IconChevronLeft /></button>
            <button type="button" className="rt-gallery__nav rt-gallery__nav--next" aria-label={t('detail.next')} onClick={() => go(index + 1)}><IconChevronRight /></button>
          </>
        ) : null}
        <span className="rt-gallery__count" aria-live="polite">{t('detail.counter', { i: index + 1, n })}</span>
      </div>
      {n > 1 ? (
        <div className="rt-gallery__thumbs">
          {urls.map((url, i) => (
            <button key={url + i} type="button" className="rt-gallery__thumb rt-media" aria-label={t('detail.thumb', { i: i + 1 })} aria-current={i === index} onClick={() => go(i)}>
              <SafeImage src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function Countdown({ remainingMs }: { remainingMs: number }) {
  const { t } = useI18n();
  const minutes = Math.ceil(remainingMs / 60000);
  return (
    <div className="rt-between">
      <span className="rt-row" style={{ font: '500 13px/18px var(--rt-font-body)', color: 'var(--rt-text-2)' }}>
        <IconTimer style={{ color: 'var(--rt-brand)' }} />
        {t('confirm.expiresIn')}
      </span>
      <span className="rt-countdown" role="timer" aria-live="off" aria-label={t('confirm.expiresAria', { min: minutes })}>
        {formatCountdown(remainingMs)}
      </span>
    </div>
  );
}

export function ExpandableText({ text, threshold = 180 }: { text: string; threshold?: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const long = text.length > threshold;
  return (
    <>
      <p className={`rt-body${long && !open ? ' rt-body--clamp' : ''}`}>{text}</p>
      {long ? (
        <Button variant="link" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? t('showLess') : t('showMore')}
        </Button>
      ) : null}
    </>
  );
}

export function StateMessage({ icon, title, text, role = 'status' }: { icon: ReactNode; title: string; text: string; role?: 'status' | 'alert' }) {
  return (
    <div className="rt-card rt-state" role={role}>
      <div className="rt-state__icon">{icon}</div>
      <div className="rt-state__title">{title}</div>
      <div className="rt-state__text">{text}</div>
    </div>
  );
}

export function Skeleton({ count = 1 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div className="rt-grid" aria-busy="true" aria-label={t('state.loading')}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rt-card rt-vcard">
          <div className="rt-media rt-skel" style={{ borderRadius: 0 }} />
          <div className="rt-vcard__body">
            <div className="rt-skel" style={{ height: 18, width: '70%' }} />
            <div className="rt-skel" style={{ height: 12, width: '45%' }} />
            <div className="rt-skel" style={{ height: 46, borderRadius: 9999, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="rt-section__head">
      <h3 className="rt-h3">{title}</h3>
      {note ? <span className="rt-small">{note}</span> : null}
    </div>
  );
}

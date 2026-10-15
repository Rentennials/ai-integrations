import { useContext, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useI18n } from './i18n';
import { ImageOriginContext, safeImageUrl } from './safety';
import { IconAlert, IconCar, IconInfo } from './icons';

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

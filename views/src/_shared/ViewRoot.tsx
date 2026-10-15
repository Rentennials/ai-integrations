import { createRoot } from 'react-dom/client';
import type { ComponentType, ReactNode } from 'react';
import type { z } from 'zod';
import './styles.css';
import { useMcpApp, type McpView, type ToolResult } from '../_bridge/useMcpApp';
import { I18nProvider, useI18n, type TranslationKey } from './i18n';
import { Isotipo, IconAlert, IconPlug, IconQuestion, IconSearch, IconStop } from './icons';
import { Notice, Skeleton, StateMessage } from './components';
import { IMAGE_ORIGINS, ImageOriginContext } from './safety';

export type ViewProps = { view: McpView };

export function mountView(name: string, View: ComponentType<ViewProps>) {
  function Host() {
    const view = useMcpApp(name);
    return (
      <ImageOriginContext.Provider value={view.imageOrigins ?? IMAGE_ORIGINS}><I18nProvider hostLocale={view.hostContext.locale}>
        <View view={view} />
      </I18nProvider></ImageOriginContext.Provider>
    );
  }
  createRoot(document.getElementById('root')!).render(<Host />);
}

export function Frame({ title, view, skeletons = 1, compactLoading = false, children }: { title: string; view: McpView; skeletons?: number; compactLoading?: boolean; children?: ReactNode }) {
  const { t } = useI18n();
  let body: ReactNode = children;
  if (view.phase === 'connecting' || view.phase === 'waiting') {
    if (compactLoading && !view.input) return null;
    body = compactLoading ? <span className="rt-small" role="status">{t('state.loading')}</span> : <Skeleton count={skeletons} />;
  }
  if (view.phase === 'error') body = <StateMessage role="alert" icon={<IconAlert size={24} />} title={t('state.error.title')} text={t('state.error.text')} />;
  if (view.phase === 'cancelled') body = <StateMessage icon={<IconStop size={24} />} title={t('state.cancelled.title')} text={t('state.cancelled.text')} />;
  if (view.phase === 'disconnected') body = <StateMessage role="alert" icon={<IconPlug size={24} />} title={t('state.disconnected.title')} text={t('state.disconnected.text')} />;
  return (
    <>
      <div className="rt-accent" />
      <main className="rt-view" data-phase={view.phase}>
        <header className="rt-header">
          <div className="rt-logo"><Isotipo size={20} /></div>
          <div className="rt-header__text">
            <span className="rt-header__brand">{t('brand')}</span>
            <h1 className="rt-title">{title}</h1>
          </div>
        </header>
        {view.actionError && view.phase === 'result' ? (
          <Notice tone="err" role="alert" title={t('state.actionFailed.title')}>{t('state.actionFailed.text')}</Notice>
        ) : null}
        {body}
      </main>
    </>
  );
}

export function parseResult<S extends z.ZodTypeAny>(schema: S, result: ToolResult | null): z.infer<S> | null {
  const parsed = schema.safeParse(result?.structuredContent);
  return parsed.success ? parsed.data : null;
}

export function Parsed<S extends z.ZodTypeAny>({
  schema, result, isEmpty, emptyTitle, emptyText, children,
}: {
  schema: S;
  result: ToolResult | null;
  isEmpty?: (data: z.infer<S>) => boolean;
  emptyTitle: TranslationKey;
  emptyText: TranslationKey;
  children: (data: z.infer<S>) => ReactNode;
}) {
  const { t } = useI18n();
  const data = parseResult(schema, result);
  if (!data) return <StateMessage icon={<IconQuestion size={24} />} title={t('state.invalid.title')} text={t('state.invalid.text')} />;
  if (isEmpty?.(data)) return <StateMessage icon={<IconSearch size={24} />} title={t(emptyTitle)} text={t(emptyText)} />;
  return <>{children(data)}</>;
}

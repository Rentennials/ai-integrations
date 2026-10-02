import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@modelcontextprotocol/ext-apps';
import { version } from '../../package.json';
import { declaredImageOrigins, IMAGE_ORIGINS } from '../_shared/safety';

export type ToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  _meta?: Record<string, unknown>;
};

export type HostContext = {
  theme?: 'light' | 'dark';
  locale?: string;
  toolInfo?: { tool?: { name?: string } };
  [key: string]: unknown;
};

export type Phase = 'connecting' | 'waiting' | 'result' | 'error' | 'cancelled' | 'disconnected';

export type BridgeState = {
  phase: Phase;
  input: Record<string, unknown> | null;
  result: ToolResult | null;
  receivedAt: number;
  hostContext: HostContext;
  actionError: boolean;
  imageOrigins: readonly string[];
};

export type Actions = {
  callServerTool: (name: string, args: Record<string, unknown>) => Promise<ToolResult | null>;
  sendMessage: (text: string) => Promise<boolean>;
  openLink: (url: string) => Promise<boolean>;
  updateModelContext: (context: Record<string, unknown>) => Promise<boolean>;
};

export type McpView = BridgeState & { actions: Actions };

function applyDocument(ctx: HostContext) {
  const root = document.documentElement;
  root.dataset.theme = ctx.theme === 'dark' ? 'dark' : 'light';
  root.lang = typeof ctx.locale === 'string' && /^en\b/i.test(ctx.locale) ? 'en' : 'es';
}

export function useMcpApp(viewName: string): McpView {
  const appRef = useRef<App | null>(null);
  const [state, setState] = useState<BridgeState>({
    phase: 'connecting',
    input: null,
    result: null,
    receivedAt: 0,
    hostContext: {},
    actionError: false,
    imageOrigins: IMAGE_ORIGINS,
  });

  useEffect(() => {
    const app = new App({ name: `rentennials-${viewName}`, version });
    appRef.current = app;

    app.ontoolinput = (params: { arguments?: Record<string, unknown> }) => {
      setState((s) => ({ ...s, input: params.arguments ?? null }));
    };
    app.ontoolresult = (result: ToolResult) => {
      setState((s) => ({
        ...s,
        phase: result.isError ? 'error' : 'result',
        result,
        receivedAt: Date.now(),
        actionError: false,
        imageOrigins: [...new Set([...IMAGE_ORIGINS, ...declaredImageOrigins(app.getHostCapabilities()?.sandbox?.csp?.resourceDomains), ...declaredImageOrigins(result._meta?.['rentennials/image_origins'])])],
      }));
    };
    app.ontoolcancelled = () => {
      setState((s) => ({ ...s, phase: 'cancelled', result: null }));
    };
    app.onhostcontextchanged = (ctx: HostContext) => {
      setState((s) => {
        const hostContext = { ...s.hostContext, ...ctx };
        applyDocument(hostContext);
        return { ...s, hostContext };
      });
    };
    app.onteardown = async () => {
      setState((s) => ({ ...s, phase: 'disconnected' }));
      return {};
    };

    app
      .connect()
      .then(() => {
        const ctx = (app.getHostContext?.() ?? {}) as HostContext;
        applyDocument(ctx);
        setState((s) => ({
          ...s,
          hostContext: { ...ctx, ...s.hostContext },
          phase: s.phase === 'connecting' ? 'waiting' : s.phase,
        }));
      })
      .catch(() => setState((s) => ({ ...s, phase: 'disconnected' })));

    return () => {
      appRef.current = null;
      void app.close?.();
    };
  }, [viewName]);

  const fail = useCallback(() => setState((s) => ({ ...s, actionError: true })), []);
  const clear = useCallback(() => setState((s) => (s.actionError ? { ...s, actionError: false } : s)), []);

  const callServerTool = useCallback<Actions['callServerTool']>(
    async (name, args) => {
      const app = appRef.current;
      if (!app) return fail(), null;
      try {
        const result = (await app.callServerTool({ name, arguments: args })) as ToolResult;
        clear();
        return result;
      } catch {
        fail();
        return null;
      }
    },
    [fail, clear],
  );

  const sendMessage = useCallback<Actions['sendMessage']>(
    async (text) => {
      const app = appRef.current;
      if (!app) return fail(), false;
      try {
        await app.sendMessage({ role: 'user', content: [{ type: 'text', text }] });
        clear();
        return true;
      } catch {
        fail();
        return false;
      }
    },
    [fail, clear],
  );

  const openLink = useCallback<Actions['openLink']>(
    async (url) => {
      const app = appRef.current;
      if (!app) return fail(), false;
      try {
        await app.openLink({ url });
        clear();
        return true;
      } catch {
        fail();
        return false;
      }
    },
    [fail, clear],
  );

  const updateModelContext = useCallback<Actions['updateModelContext']>(async (context) => {
    const app = appRef.current;
    if (!app) return fail(), false;
    try {
      await app.updateModelContext({ structuredContent: context });
      clear();
      return true;
    } catch { fail(); return false; }
  }, [fail, clear]);

  return { ...state, actions: { callServerTool, sendMessage, openLink, updateModelContext } };
}

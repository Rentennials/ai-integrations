import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
import { fixtures, serverTools } from '../../fixtures';
import { buildCsp, RESOURCE_DOMAINS } from './csp';

const VIEWS = Object.keys(fixtures);
const builtViews = import.meta.glob('../../dist/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const htmlFor = (view: string) => builtViews[`../../dist/${view}.html`] ?? null;

type LogEntry = { kind: string; detail: string };

function sandboxOrigin() {
  const other = location.hostname === '127.0.0.1' ? 'localhost' : '127.0.0.1';
  return `${location.protocol}//${other}:${location.port}`;
}

function Harness() {
  const params = new URLSearchParams(location.search);
  const [view, setView] = useState(params.get('view') ?? VIEWS[0]!);
  const viewFixtures = fixtures[view]!;
  const [fixtureKey, setFixtureKey] = useState(params.get('fixture') ?? Object.keys(viewFixtures)[0]!);
  const [theme, setTheme] = useState<'light' | 'dark'>(params.get('theme') === 'dark' ? 'dark' : 'light');
  const [locale, setLocale] = useState(params.get('locale') ?? 'es-AR');
  const [width, setWidth] = useState(Number(params.get('width') ?? 706));
  const [holdResult, setHoldResult] = useState(params.get('hold') === '1');
  const [failActions, setFailActions] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [height, setHeight] = useState(600);
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<AppBridge | null>(null);
  const failRef = useRef(failActions);
  failRef.current = failActions;

  const fixture = viewFixtures[fixtureKey] ?? Object.values(viewFixtures)[0]!;
  const html = htmlFor(view);
  const origin = useMemo(sandboxOrigin, []);
  const push = (kind: string, detail: unknown) => setLog((l) => [...l, { kind, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) }]);

  useEffect(() => {
    const iframe = frame.current;
    if (!iframe || !html) return;
    setReady(false);
    setLog([]);
    const bridge = new AppBridge(
      null,
      { name: 'rentennials-harness', version: '1.0.0' },
      { openLinks: {}, serverTools: {}, logging: {} },
      { hostContext: { theme, locale, displayMode: 'inline', platform: 'web', containerDimensions: { width, maxHeight: 4000 }, toolInfo: { tool: { name: fixture.tool, inputSchema: { type: 'object' } } } } },
    );
    bridgeRef.current = bridge;
    const guard = () => {
      if (failRef.current) throw new Error('Simulated host failure');
    };
    bridge.onmessage = async (p: unknown) => { push('sendMessage', p); guard(); return {}; };
    bridge.onopenlink = async (p: unknown) => { push('openLink', p); guard(); return {}; };
    bridge.onupdatemodelcontext = async (p: unknown) => { push('modelContext', p); guard(); return {}; };
    bridge.oncalltool = async (p: { name: string; arguments?: Record<string, unknown> }) => {
      push('callServerTool', p);
      guard();
      const handler = serverTools[p.name];
      if (!handler) throw new Error(`Tool ${p.name} is not available to the app`);
      return handler(p.arguments ?? {});
    };
    bridge.onsizechange = ({ height: h }: { width?: number; height?: number }) => { if (h) setHeight(Math.ceil(h)); };
    bridge.onloggingmessage = (p: unknown) => push('log', p);
    bridge.oninitialized = () => {
      push('initialized', fixture.tool);
      bridge.sendToolInput({ arguments: fixture.input });
      if (!holdResult) bridge.sendToolResult(fixture.result);
      setReady(true);
    };

    const onSandbox = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow || e.origin !== origin) return;
      if (e.data?.method === 'ui/notifications/sandbox-proxy-ready') {
        iframe.contentWindow!.postMessage(
          { jsonrpc: '2.0', method: 'ui/notifications/sandbox-resource-ready', params: { html, csp: { connectDomains: [], resourceDomains: RESOURCE_DOMAINS } } },
          origin,
        );
      }
    };
    window.addEventListener('message', onSandbox);
    void bridge.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!));
    return () => {
      window.removeEventListener('message', onSandbox);
      void bridge.close();
    };
  }, [view, fixtureKey, run, html]);

  useEffect(() => {
    if (ready) void bridgeRef.current?.setHostContext({ theme, locale, containerDimensions: { width, maxHeight: 4000 } });
  }, [theme, locale, width]);

  const select = (label: string, value: string, options: string[], onChange: (v: string) => void, names?: Record<string, string>) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={`select-${label}`}>
        {options.map((o) => <option key={o} value={o}>{names?.[o] ?? o}</option>)}
      </select>
    </label>
  );

  return (
    <div style={{ font: '14px/1.4 system-ui, sans-serif', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: '#e9e7ef', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        {select('view', view, VIEWS, (v) => { setView(v); setFixtureKey(Object.keys(fixtures[v]!)[0]!); })}
        {select('fixture', fixtureKey, Object.keys(viewFixtures), setFixtureKey, Object.fromEntries(Object.entries(viewFixtures).map(([k, f]) => [k, f.label])))}
        {select('theme', theme, ['light', 'dark'], (v) => setTheme(v as 'light' | 'dark'))}
        {select('locale', locale, ['es-AR', 'es-MX', 'en-US'], setLocale)}
        {select('width', String(width), ['360', '706', '1000'], (v) => setWidth(Number(v)))}
        <label style={{ fontSize: 12 }}><input type="checkbox" checked={holdResult} onChange={(e) => setHoldResult(e.target.checked)} /> retener resultado</label>
        <label style={{ fontSize: 12 }}><input type="checkbox" checked={failActions} onChange={(e) => setFailActions(e.target.checked)} data-testid="fail-actions" /> fallar acciones</label>
        <button type="button" onClick={() => setRun((r) => r + 1)}>Recargar</button>
        <button type="button" data-testid="send-result" onClick={() => bridgeRef.current?.sendToolResult(fixture.result)}>Enviar resultado</button>
        <button type="button" data-testid="cancel" onClick={() => bridgeRef.current?.sendToolCancelled({ reason: 'user' })}>Cancelar</button>
        <button type="button" data-testid="teardown" onClick={() => void bridgeRef.current?.teardownResource({ reason: 'harness' })}>Desconectar</button>
      </div>
      {!html ? (
        <p data-testid="missing-build">Falta dist/{view}.html. Ejecutá <code>yarn build</code> y recargá.</p>
      ) : (
        <iframe
          key={`${view}-${fixtureKey}-${run}`}
          ref={frame}
          title={`ui://rentennials/${view}`}
          data-testid="sandbox"
          data-ready={ready}
          src={`${origin}/sandbox.html?host=${encodeURIComponent(location.origin)}`}
          sandbox="allow-scripts allow-same-origin"
          style={{ width, height, border: 'none', borderRadius: 18, background: theme === 'dark' ? '#17181d' : '#f4f4f6', alignSelf: 'center' }}
        />
      )}
      <ol data-testid="bridge-log" style={{ margin: 0, padding: 12, background: '#1d1b24', color: '#e8e6f0', borderRadius: 12, font: '12px/1.5 ui-monospace, monospace', listStyle: 'none' }}>
        {log.map((entry, i) => (
          <li key={i} data-kind={entry.kind}><strong>{entry.kind}</strong> {entry.detail}</li>
        ))}
      </ol>
      <p style={{ fontSize: 12, color: '#5a5a5a', margin: 0 }}>CSP aplicada: <code data-testid="csp">{buildCsp({ connectDomains: [], resourceDomains: RESOURCE_DOMAINS })}</code></p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);

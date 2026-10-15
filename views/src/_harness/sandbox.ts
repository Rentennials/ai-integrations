import { injectCsp, type Csp } from './csp';

const hostOrigin = new URLSearchParams(location.search).get('host');
let inner: HTMLIFrameElement | null = null;

function load(params: { html: string; csp?: Csp; sandbox?: string }) {
  inner?.remove();
  inner = document.createElement('iframe');
  inner.setAttribute('sandbox', params.sandbox ?? 'allow-scripts allow-same-origin');
  inner.title = 'MCP App view';
  inner.style.cssText = 'border:0;width:100%;height:100%;display:block';
  inner.srcdoc = injectCsp(params.html, params.csp ?? {});
  document.body.appendChild(inner);
}

window.addEventListener('message', (event) => {
  if (!hostOrigin) return;
  const data = event.data as { method?: string; params?: unknown } | null;
  if (event.source === window.parent) {
    if (event.origin !== hostOrigin) return;
    if (data?.method === 'ui/notifications/sandbox-resource-ready') {
      load(data.params as { html: string; csp?: Csp; sandbox?: string });
      return;
    }
    inner?.contentWindow?.postMessage(data, '*');
    return;
  }
  if (inner && event.source === inner.contentWindow) {
    if (typeof data?.method === 'string' && data.method.startsWith('ui/notifications/sandbox-')) return;
    window.parent.postMessage(data, hostOrigin);
  }
});

if (hostOrigin) window.parent.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/sandbox-proxy-ready', params: {} }, hostOrigin);

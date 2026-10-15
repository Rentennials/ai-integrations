export type Csp = { connectDomains?: string[]; resourceDomains?: string[]; frameDomains?: string[]; baseUriDomains?: string[] };

export const RESOURCE_DOMAINS = [
  'https://photos.rentennials.app',
  'https://api.rentennials.app',
  'https://images.example.com',
  ...String(import.meta.env.VITE_MCP_UI_IMAGE_HOSTS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
];

const list = (values: string[] | undefined, fallback: string) => (values && values.length > 0 ? values.join(' ') : fallback);

export function buildCsp(csp: Csp): string {
  const res = list(csp.resourceDomains, '');
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${res}`.trim(),
    `style-src 'unsafe-inline' ${res}`.trim(),
    `img-src data: ${res}`.trim(),
    `font-src data: ${res}`.trim(),
    `media-src data: ${res}`.trim(),
    `connect-src ${list(csp.connectDomains, "'none'")}`,
    `frame-src ${list(csp.frameDomains, "'none'")}`,
    "object-src 'none'",
    `base-uri ${list(csp.baseUriDomains, "'none'")}`,
    "form-action 'none'",
  ].join('; ');
}

export function injectCsp(html: string, csp: Csp): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(csp).replace(/"/g, '&quot;')}">`;
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${meta}`) : `${meta}${html}`;
}

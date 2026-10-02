import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const root = dirname(fileURLToPath(import.meta.url));
const views = ['vehicle-results', 'vehicle-detail', 'quote', 'booking-confirmation', 'my-bookings'];

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && !views.includes(mode)) {
    throw new Error('Build each view using the workspace build script.');
  }

  return {
    define: {
      'import.meta.env.VITE_MCP_UI_IMAGE_HOSTS': JSON.stringify(process.env.MCP_UI_IMAGE_HOSTS ?? ''),
      'import.meta.env.VITE_MCP_UI_LINK_ORIGINS': JSON.stringify(
        process.env.MCP_PUBLIC_URL ? new URL(process.env.MCP_PUBLIC_URL).origin : ''
      ),
    },
    root: command === 'build' ? resolve(root, 'src', mode) : resolve(root, 'src/_harness'),
    plugins: [
      react(),
      ...(command === 'build'
        ? [
            viteSingleFile(),
            {
              name: 'rentennials-view-manifest',
              closeBundle() {
                const dist = resolve(root, 'dist');
                const source = resolve(dist, 'index.html');
                if (!existsSync(source)) throw new Error(`Missing HTML output for ${mode}.`);
                const html = readFileSync(source, 'utf8');
                if (/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel\s*=\s*["']stylesheet/i.test(html)) {
                  throw new Error(`View ${mode} must contain inline JavaScript and CSS.`);
                }
                renameSync(source, resolve(dist, `${mode}.html`));
                if (mode !== views.at(-1)) return;
                const resourceDomains = [
                  'https://photos.rentennials.app',
                  'https://api.rentennials.app',
                  ...(process.env.MCP_UI_IMAGE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean),
                ];
                for (const origin of resourceDomains) {
                  const url = new URL(origin);
                  if (url.protocol !== 'https:' || url.username || url.password || url.origin !== origin || origin.includes('*')) {
                    throw new Error('Image hosts must be exact HTTPS origins without credentials.');
                  }
                }
                const manifest = views.map((name) => {
                  if (!existsSync(resolve(dist, `${name}.html`))) throw new Error(`Missing view ${name}.`);
                  return {
                    name,
                    uri: `ui://rentennials/${name}`,
                    file: `${name}.html`,
                    csp: { connectDomains: [], resourceDomains: [...new Set(resourceDomains)] },
                  };
                });
                writeFileSync(resolve(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
              },
            },
          ]
        : []),
    ],
    build: { outDir: resolve(root, 'dist'), emptyOutDir: mode === views[0] },
  };
});

import { execFileSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemas = {
  plugin: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  mcp: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
};
const text = (maxLength: number) => ({ type: 'string', minLength: 1, maxLength, pattern: '\\S' });
const link = { ...text(1024), format: 'uri', pattern: '^https://' };
const asset = { ...text(1024), pattern: '^\\./assets/[^\\\\]+\\.png$' };
const interfaceSchema = {
  type: 'object',
  required: ['displayName', 'shortDescription', 'longDescription', 'developerName', 'category', 'websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL', 'composerIcon', 'logo', 'screenshots'],
  properties: {
    displayName: text(30), shortDescription: text(30), longDescription: text(4000), developerName: text(80),
    category: { const: 'Travel' },
    capabilities: { type: 'array', maxItems: 20, items: text(120) },
    websiteURL: link, supportURL: link, privacyPolicyURL: link, termsOfServiceURL: link,
    defaultPrompt: { type: 'array', maxItems: 3, items: text(128) },
    brandColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    composerIcon: asset, composerIconDark: asset, logo: asset, logoDark: asset,
    screenshots: { type: 'array', minItems: 1, maxItems: 4, uniqueItems: true, items: asset },
  },
  additionalProperties: false,
};

const safeHttps = (value: string): URL => {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('A configured URL is invalid.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('Configured URLs must use HTTPS without credentials or fragments.');
  }
  return url;
};

const readContained = async (path: string): Promise<Buffer> => {
  const file = resolve(root, path);
  const inside = relative(root, file);
  if (isAbsolute(path) || inside.startsWith(`..${sep}`) || inside === '..' || (await lstat(file)).isSymbolicLink()) {
    throw new Error('Package files must stay inside the plugin root without symlinks.');
  }
  const canonical = relative(await realpath(root), await realpath(file));
  if (canonical.startsWith(`..${sep}`) || canonical === '..') throw new Error('Package file escapes the plugin root.');
  return readFile(file);
};

const fetchSchema = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'error' });
  if (!response.ok) throw new Error('Cannot fetch the canonical Agent Plugins schema.');
  return response.json();
};

const validatePng = (data: Buffer, screenshot: boolean) => {
  if (data.length < 24 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || data.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('Referenced image is not a PNG.');
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (data.length > 5 * 1024 * 1024 || width < 1 || height < 1 || width > 4096 || height > 4096) {
    throw new Error('Images must be at most 5 MiB and 4096 pixels per dimension.');
  }
  if (screenshot ? width !== 706 : width !== height || width < 48) {
    throw new Error('Screenshots must be 706 pixels wide; icons must be square and at least 48 pixels.');
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--validate')) throw new Error('Only --validate is accepted.');
  const plugin = JSON.parse((await readContained('plugin.json')).toString('utf8'));
  const mcp = JSON.parse((await readContained('mcp.json')).toString('utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const [pluginSchema, mcpSchema] = await Promise.all([fetchSchema(schemas.plugin), fetchSchema(schemas.mcp)]);
  const validatePlugin = ajv.compile(pluginSchema);
  const validateMcp = ajv.compile(mcpSchema);
  if (!validatePlugin(plugin)) throw new Error(`plugin.json does not match its schema: ${ajv.errorsText(validatePlugin.errors)}`);
  if (plugin.name !== 'rentennials' || !/^\d+\.\d+\.\d+$/.test(plugin.version ?? '')) throw new Error('Plugin identity or version is invalid.');
  const workspace = JSON.parse((await readContained('package.json')).toString('utf8'));
  if (plugin.version !== workspace.version) throw new Error('Plugin and workspace versions must match.');
  const ui = plugin.extensions?.['com.openai']?.interface;
  if (!ui || typeof ui !== 'object') throw new Error('OpenAI interface metadata is required.');
  if (process.env.OPENAI_SUPPORT_URL) ui.supportURL = process.env.OPENAI_SUPPORT_URL;
  const validateInterface = ajv.compile(interfaceSchema);
  if (!validateInterface(ui)) throw new Error(`OpenAI metadata is incomplete: ${ajv.errorsText(validateInterface.errors)}`);
  for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) safeHttps(ui[key]);
  const url = safeHttps(process.env.MCP_PUBLIC_URL || mcp.mcpServers?.rentennials?.url || '');
  if (url.pathname !== '/mcp' || url.search) throw new Error('MCP URL must end at /mcp without query parameters.');
  if (process.env.NODE_ENV === 'production' && url.origin !== 'https://mcp.rentennials.app') throw new Error('Production MCP origin must remain stable.');
  if (!mcp.mcpServers?.rentennials || Object.keys(mcp.mcpServers).length !== 1) throw new Error('Exactly one Rentennials MCP server is required.');
  mcp.mcpServers.rentennials.url = url.href;
  if (!validateMcp(mcp)) throw new Error(`mcp.json does not match its schema: ${ajv.errorsText(validateMcp.errors)}`);
  if (mcp.mcpServers.rentennials.type !== 'streamable-http' || mcp.mcpServers.rentennials.headers) throw new Error('MCP must use Streamable HTTP without packaged credentials.');

  const files = new Map<string, Buffer>();
  for (const path of ['listing.md', 'test-cases.md']) files.set(path, await readContained(path));
  const images = [ui.composerIcon, ui.composerIconDark, ui.logo, ui.logoDark, ...ui.screenshots].filter(Boolean) as string[];
  for (const path of new Set(images)) {
    const data = await readContained(path);
    validatePng(data, ui.screenshots.includes(path));
    files.set(path, data);
  }
  if (args.includes('--validate')) {
    process.stdout.write('Plugin schemas, metadata and referenced files are valid.\n');
    return;
  }

  const temporary = await mkdtemp(resolve(tmpdir(), 'rentennials-openai-'));
  try {
    files.set('plugin.json', Buffer.from(`${JSON.stringify(plugin, null, 2)}\n`));
    files.set('mcp.json', Buffer.from(`${JSON.stringify(mcp, null, 2)}\n`));
    for (const [path, data] of files) {
      const destination = resolve(temporary, path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, data);
    }
    const dist = resolve(root, 'dist');
    await mkdir(dist, { recursive: true });
    const archive = resolve(dist, `rentennials-openai-${plugin.version}.zip`);
    await rm(archive, { force: true });
    execFileSync('zip', ['-q', '-X', archive, ...files.keys()], { cwd: temporary, stdio: 'pipe' });
    process.stdout.write(`Created dist/rentennials-openai-${plugin.version}.zip\n`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Plugin packaging failed.'}\n`);
  process.exitCode = 1;
});

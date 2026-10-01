import { expect, test, type Page } from 'playwright/test';

const VIEWS: Record<string, string> = {
  'vehicle-results': 'ars',
  'vehicle-detail': 'dates',
  quote: 'fast',
  'booking-confirmation': 'instant',
  'my-bookings': 'list',
};
const WIDTHS = [360, 706, 1000];
const THEMES = ['light', 'dark'] as const;

test.beforeEach(async ({ page }) => {
  await page.route('https://photos.rentennials.app/fixtures/**', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#eeeaf7"/><path d="M170 350v-70l65-100h290l90 100h30v70z" fill="#7B45F6"/><circle cx="250" cy="350" r="45" fill="#444"/><circle cx="555" cy="350" r="45" fill="#444"/><text x="400" y="480" text-anchor="middle" fill="#444" font-size="30">Synthetic demo image</text></svg>',
  }));
});

async function open(page: Page, view: string, fixture: string, width: number, theme: string) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol !== 'data:') external.push(r.url());
  });
  await page.setViewportSize({ width: width + 80, height: 1000 });
  await page.goto(`/?view=${view}&fixture=${fixture}&width=${width}&theme=${theme}`);
  await expect(page.getByTestId('sandbox')).toHaveAttribute('data-ready', 'true');
  const app = page.frameLocator('[data-testid="sandbox"]').frameLocator('iframe');
  await expect(app.locator('h1')).toBeVisible();
  await expect(app.locator('main')).toHaveAttribute('data-phase', 'result');
  return { app, errors, external };
}

for (const [view, fixture] of Object.entries(VIEWS)) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`${view} · ${width}px · ${theme}`, async ({ page }) => {
        const { app, errors, external } = await open(page, view, fixture, width, theme);
        await expect(app.locator('html')).toHaveAttribute('data-theme', theme);
        const overflow = await app.locator('body').evaluate((b) => b.scrollWidth - b.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        expect(errors).toEqual([]);
        expect(external.filter((u) => new URL(u).origin !== 'https://photos.rentennials.app')).toEqual([]);
      });
    }
  }
}

test('vehicle-results · quote sends a message and detail calls get_vehicle', async ({ page }) => {
  const { app } = await open(page, 'vehicle-results', 'ars', 706, 'light');
  await app.getByRole('button', { name: 'Cotizar' }).first().click();
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText("I'd like a quote for the Renault Kwid 2018");
  await expect(page.locator('[data-kind="sendMessage"]')).not.toContainText('veh_fx_');
  await app.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('"name":"get_vehicle"');
  await expect(app.getByRole('heading', { name: 'Características principales' })).toBeVisible();
});

test('quote · request booking goes through chat only', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('button', { name: 'Solicitar reserva' }).click();
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('ask for my confirmation');
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(0);
});

test('booking-confirmation · pay opens link only after click', async ({ page }) => {
  const { app } = await open(page, 'booking-confirmation', 'instant', 706, 'light');
  await expect(page.locator('[data-kind="openLink"]')).toHaveCount(0);
  await app.getByRole('button', { name: /Pagar en Rentennials/ }).click();
  await expect(page.locator('[data-kind="openLink"]')).toContainText('https://mcp.rentennials.app/pay/fixture-1');
});

test('booking-confirmation · expired link is disabled', async ({ page }) => {
  const { app } = await open(page, 'booking-confirmation', 'expired', 706, 'light');
  await expect(app.getByRole('button', { name: /Pagar en Rentennials/ })).toBeDisabled();
});

test('my-bookings · pay asks in chat and never calls pay_booking', async ({ page }) => {
  const { app } = await open(page, 'my-bookings', 'list', 706, 'light');
  await expect(app.getByRole('button', { name: 'Pagar', exact: true })).toHaveCount(1);
  await app.getByRole('button', { name: 'Pagar', exact: true }).click();
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText("I'd like to pay my booking No. 10001");
  await app.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('"booking_id":"000000000000000000000011"');
  await expect(page.locator('[data-kind="callServerTool"]')).not.toContainText('pay_booking');
});

test('failed action keeps previous result and announces it', async ({ page }) => {
  const { app } = await open(page, 'vehicle-results', 'ars', 706, 'light');
  await page.getByTestId('fail-actions').check();
  await app.getByRole('button', { name: 'Cotizar' }).first().click();
  await expect(app.getByRole('alert')).toContainText('No pudimos completar la acción');
  await expect(app.getByText('Renault Kwid 2018')).toBeVisible();
});

test('cancel and teardown states', async ({ page }) => {
  await page.goto('/?view=quote&fixture=fast&hold=1');
  await expect(page.getByTestId('sandbox')).toHaveAttribute('data-ready', 'true');
  const app = page.frameLocator('[data-testid="sandbox"]').frameLocator('iframe');
  await expect(app.getByLabel('Cargando')).toBeVisible();
  await page.getByTestId('cancel').click();
  await expect(app.getByText('Pedido cancelado')).toBeVisible();
  await page.getByTestId('teardown').click();
  await expect(app.getByText('Sin conexión con el chat')).toBeVisible();
});

const OPENAI = [['vehicle-results', 'ars'], ['quote', 'fast'], ['booking-confirmation', 'instant'], ['my-bookings', 'list']] as const;

test('screenshots · OpenAI 706 px', async ({ page }) => {
  for (const [i, [view, fixture]] of OPENAI.entries()) {
    await open(page, view, fixture, 706, 'light');
    await page.getByTestId('sandbox').screenshot({ path: `test-results/openai/screenshot-${i + 1}.png`, animations: 'disabled' });
  }
});

test('screenshots · Claude 1000 px', async ({ page }) => {
  for (const [view, fixture] of Object.entries(VIEWS)) {
    await open(page, view, fixture, 1000, 'light');
    await page.getByTestId('sandbox').screenshot({ path: `test-results/claude/${view}.png`, animations: 'disabled' });
  }
});

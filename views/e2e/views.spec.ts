import { expect, test, type Page } from 'playwright/test';

const VIEWS: Record<string, string> = {
  'vehicle-results': 'ars',
  quote: 'fast',
};
const WIDTHS = [360, 706, 1000];
const THEMES = ['light', 'dark'] as const;

test.beforeEach(async ({ page }) => {
  await page.route('https://photos.rentennials.app/fixtures/**', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#eeeaf7"/><path d="M170 350v-70l65-100h290l90 100h30v70z" fill="#7B45F6"/><circle cx="250" cy="350" r="45" fill="#444"/><circle cx="555" cy="350" r="45" fill="#444"/><text x="400" y="480" text-anchor="middle" fill="#444" font-size="30">Synthetic demo image</text></svg>',
  }));
  await page.route('https://images.example.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#7B45F6"/></svg>' }));
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

test('quote · request booking goes through chat only', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('button', { name: 'Solicitar reserva' }).click();
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('ask for my explicit confirmation');
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('First call get_vehicle_quote yourself');
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(0);
  await expect(page.locator('[data-kind="modelContext"]')).toContainText('"vehicle_id":"000000000000000000000001"');
});

test('show more appends the next page once and removes the control at the end', async ({ page }) => {
  const { app } = await open(page, 'vehicle-results', 'ars', 706, 'light');
  await expect(app.locator('article.rt-vcard')).toHaveCount(5);
  await app.getByRole('button', { name: 'Ver más autos', exact: true }).click();
  await expect(app.locator('article.rt-vcard')).toHaveCount(8);
  await expect(page.locator('[data-kind="callServerTool"]').last()).toContainText('"page":2');
  await expect(app.getByRole('button', { name: 'Ver más autos', exact: true })).toHaveCount(0);
});

test('choose sends the vehicle id to chat and marks only that card', async ({ page }) => {
  const { app } = await open(page, 'vehicle-results', 'ars', 706, 'light');
  await app.locator('article.rt-vcard').first().getByRole('button', { name: 'Elegir', exact: true }).click();
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('show_rental_summary');
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('000000000000000000000001');
  await expect(app.locator('article.rt-vcard').first().getByRole('button', { name: 'Elegido', exact: true })).toBeDisabled();
  await expect(app.locator('article.rt-vcard').nth(1).getByRole('button', { name: 'Elegir', exact: true })).toBeEnabled();
});

for (const width of WIDTHS) {
  test(`carousel lane scrolls and the view stays within bounds · ${width}px`, async ({ page }) => {
    const { app } = await open(page, 'vehicle-results', 'ars', width, 'light');
    const doc = await app.locator('html').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight }));
    expect(doc.sw).toBeLessThanOrEqual(doc.cw);
    expect(doc.sh).toBeLessThanOrEqual(width === 360 ? 680 : 640);
    const lane = await app.locator('.rt-carousel__lane').evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(lane).toBe(true);
  });
}

test('images follow runtime server policy with matching CSP', async ({ page }) => {
  const { app, errors } = await open(page, 'vehicle-results', 'runtime', 706, 'light');
  const image = app.locator('img').first();
  await expect(image).toHaveAttribute('src', 'https://images.example.com/preview.webp');
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('coverage selection requotes and preserves other types before chat confirmation', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Cobertura', exact: true }).click();
  await app.getByRole('radio', { name: 'Cobertura Premium', exact: true }).click();
  await expect(app.getByRole('radio', { name: 'Cobertura Premium', exact: true })).toBeChecked();
  await expect(app.locator('.rt-total__amount')).toContainText('233.650');
  await app.getByRole('radio', { name: 'Depósito sin tarjeta', exact: true }).click();
  await expect(app.getByRole('radio', { name: 'Depósito sin tarjeta', exact: true })).toBeChecked();
  await expect(app.locator('.rt-total__amount')).toContainText('268.650');
  await app.getByRole('button', { name: 'Solicitar reserva', exact: true }).click();
  await expect(page.locator('[data-kind="modelContext"]')).toContainText('cov_fx_1');
  await expect(page.locator('[data-kind="modelContext"]')).toContainText('cov_deposit_cash');
  await expect(page.locator('[data-kind="modelContext"]')).toContainText('268650');
  const calls = await page.locator('[data-kind="callServerTool"]').allTextContents();
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.join(' ')).not.toContain('create_booking_request');
});

test('coverage failure preserves the applied total and supports an explicit retry', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Cobertura', exact: true }).click();
  await page.getByTestId('fail-actions').check();
  await app.getByRole('radio', { name: 'Cobertura Premium', exact: true }).click();
  await expect(app.getByRole('radio', { name: 'Cobertura Premium', exact: true })).toBeChecked();
  await expect(app.locator('.rt-total__amount')).toContainText('174.650');
  await expect(app.getByText('No se pudo actualizar la cotización.', { exact: false })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeDisabled();
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(1);
  await page.getByTestId('fail-actions').uncheck();
  await app.getByRole('button', { name: 'Reintentar cotización', exact: true }).click();
  await expect(app.locator('.rt-total__amount')).toContainText('233.650');
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(2);
});

test('quote editor applies extras and both meeting points before chat confirmation', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Extras', exact: true }).click();
  await app.getByLabel('Silla de bebé (0 a 3 años)', { exact: true }).selectOption('2');
  await app.getByRole('tab', { name: /^Viaje/ }).click();
  await app.getByLabel('Retiro', { exact: true }).selectOption('mp_fx_2');
  await app.getByLabel('Devolución', { exact: true }).selectOption('mp_fx_3');
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeDisabled();
  await expect(app.locator('.rt-total__amount')).toContainText('174.650');
  await expect(app.getByRole('button', { name: 'Actualizar cotización', exact: true })).toHaveCount(0);
  await expect(app.locator('.rt-total__amount')).toContainText('212.650');
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeEnabled();
  await app.getByRole('button', { name: 'Solicitar reserva', exact: true }).click();
  await expect(page.locator('[data-kind="modelContext"]')).toContainText('"quantity":2');
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('mp_fx_2');
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('mp_fx_3');
  expect((await page.locator('[data-kind="callServerTool"]').allTextContents()).join(' ')).not.toContain('create_booking_request');
});

test('quote editor validates dates and preserves applied quote after coupon failure', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByLabel('Fecha de devolución', { exact: true }).fill('2026-10-01');
  await expect(app.getByRole('alert')).toContainText('Revisá las fechas');
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(0);
  await app.getByRole('button', { name: 'Descartar cambios' }).click();
  await app.getByLabel('Cupón de descuento', { exact: true }).fill('INVALID');
  await expect(app.getByRole('alert')).toContainText('No se pudo actualizar la cotización');
  await expect(app.locator('.rt-total__amount')).toContainText('174.650');
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeDisabled();
  await app.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeEnabled();
});

test('date and time edits requote automatically and ignore an older in-flight response', async ({ page }) => {
  await page.goto('/?view=quote&fixture=fast&width=706&theme=light&firstQuoteDelay=1600');
  await expect(page.getByTestId('sandbox')).toHaveAttribute('data-ready', 'true');
  const app = page.frameLocator('[data-testid="sandbox"]').frameLocator('iframe');
  await app.getByLabel('Fecha de retiro', { exact: true }).fill('2026-11-10');
  await app.getByLabel('Fecha de devolución', { exact: true }).fill('2026-11-14');
  await app.getByLabel('Hora de retiro', { exact: true }).fill('09:30');
  await app.getByLabel('Hora de devolución', { exact: true }).fill('17:00');
  await app.getByRole('tab', { name: /^Extras/ }).click();
  await app.getByLabel('Cadenas para la nieve', { exact: true }).selectOption('1');
  await expect(page.locator('[data-kind="callServerTool"]').last()).toContainText('"from_date":"2026-11-10"');
  await expect(page.locator('[data-kind="callServerTool"]').last()).toContainText('"from_date_time":"09:30"');
  await expect(page.locator('[data-kind="callServerTool"]').last()).toContainText('snow_chains');
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeDisabled();
  await expect(app.getByLabel('Silla de bebé (0 a 3 años)', { exact: true })).toBeEnabled();
  await app.getByLabel('Silla de bebé (0 a 3 años)', { exact: true }).selectOption('1');
  await expect(app.locator('.rt-total__amount')).toContainText('199.650');
  await expect(page.locator('[data-kind="callServerToolEnd"]')).toHaveCount(2);
  await expect(app.locator('.rt-total__amount')).toContainText('199.650');
  await expect(app.getByRole('button', { name: 'Solicitar reserva', exact: true })).toBeEnabled();
  await app.getByRole('button', { name: 'Solicitar reserva', exact: true }).click();
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('baby_seat');
  await expect(page.locator('[data-kind="sendMessage"]')).toContainText('snow_chains');
});

test('search order requeries and keeps airport and no-card filters', async ({ page }) => {
  const { app } = await open(page, 'vehicle-results', 'airport', 706, 'light');
  await app.getByRole('button', { name: 'Precio menor a mayor', exact: true }).click();
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('"sort":"lower_price"');
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('"has_deposit_cover":true');
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('"pickup_location_id":"000000000000000000000101"');
  await expect(app.getByRole('button', { name: 'Precio menor a mayor', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-kind="sendMessage"]')).toHaveCount(0);
});

test('coverage can return to the included default', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Cobertura', exact: true }).click();
  await app.getByRole('radio', { name: 'Cobertura Premium', exact: true }).click();
  await expect(app.locator('.rt-total__amount')).toContainText('233.650');
  await app.getByRole('radio', { name: 'Cobertura básica', exact: true }).click();
  await expect(app.locator('.rt-total__amount')).toContainText('174.650');
  await expect(app.getByRole('radio', { name: 'Cobertura básica', exact: true })).toBeChecked();
});

test('switching tabs does not requote', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Cobertura', exact: true }).click();
  await app.getByRole('tab', { name: 'Extras', exact: true }).click();
  await app.getByRole('tab', { name: 'Viaje', exact: true }).click();
  await expect(app.getByRole('tab', { name: 'Viaje', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.waitForTimeout(700);
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(0);
});

test('choosing another coverage requotes once with the new cover', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Cobertura', exact: true }).click();
  await app.getByRole('radio', { name: 'Cobertura Premium', exact: true }).click();
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(1, { timeout: 2000 });
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('get_vehicle_quote');
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('"covers":["cov_fx_1"]');
  await expect(app.locator('.rt-total__amount')).toContainText('233.650');
  await page.waitForTimeout(700);
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(1);
});

test('changing an extra quantity requotes once with the new extra', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await app.getByRole('tab', { name: 'Extras', exact: true }).click();
  await app.getByLabel('Cadenas para la nieve', { exact: true }).selectOption('1');
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(1, { timeout: 2000 });
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('get_vehicle_quote');
  await expect(page.locator('[data-kind="callServerTool"]')).toContainText('snow_chains');
  await expect(app.locator('.rt-total__amount')).toContainText('189.650');
  await page.waitForTimeout(700);
  await expect(page.locator('[data-kind="callServerTool"]')).toHaveCount(1);
});

test('breakdown starts collapsed', async ({ page }) => {
  const { app } = await open(page, 'quote', 'fast', 706, 'light');
  await expect(app.locator('details')).toHaveJSProperty('open', false);
  await expect(app.getByText('Ver desglose', { exact: true })).toBeVisible();
});

for (const [width, maxHeight] of [[360, 1300], [706, 820], [1000, 720]] as const) {
  test(`quote stays within the compact height budget · ${width}px`, async ({ page }) => {
    const { app } = await open(page, 'quote', 'fast', width, 'light');
    await expect(app.getByRole('tab', { name: 'Viaje', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(app.locator('details')).toHaveJSProperty('open', false);
    const doc = await app.locator('html').evaluate((el) => {
      const d = el.ownerDocument;
      const height = (selector: string) => d.querySelector(selector)!.getBoundingClientRect().height;
      return { sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, main: height('.rt-quote__main'), side: height('.rt-quote__side') };
    });
    expect(doc.sw).toBeLessThanOrEqual(doc.cw);
    expect(doc.sh).toBeLessThanOrEqual(maxHeight);
    if (width >= 640) expect(Math.abs(doc.main - doc.side)).toBeLessThanOrEqual(160);
  });
}

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

async function captureSequence(page: Page, width: number, dir: string) {
  await open(page, 'vehicle-results', 'ars', width, 'light');
  await page.getByTestId('sandbox').screenshot({ path: `${dir}/screenshot-1.png`, animations: 'disabled' });

  const quote = await open(page, 'quote', 'fast', width, 'light');
  await page.getByTestId('sandbox').screenshot({ path: `${dir}/screenshot-2.png`, animations: 'disabled' });
  await quote.app.getByRole('tab', { name: 'Cobertura', exact: true }).click();
  await expect(quote.app.getByRole('tab', { name: 'Cobertura', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByTestId('sandbox').screenshot({ path: `${dir}/screenshot-3.png`, animations: 'disabled' });

  const results = await open(page, 'vehicle-results', 'ars', width, 'light');
  await results.app.getByRole('button', { name: 'Precio menor a mayor', exact: true }).click();
  await expect(results.app.getByRole('button', { name: 'Precio menor a mayor', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(results.app.locator('.rt-carousel__lane')).not.toHaveAttribute('aria-busy', 'true');
  await page.getByTestId('sandbox').screenshot({ path: `${dir}/screenshot-4.png`, animations: 'disabled' });
}

test('screenshots · OpenAI 706 px', async ({ page }) => {
  await captureSequence(page, 706, 'test-results/openai');
});

test('screenshots · Claude 1000 px', async ({ page }) => {
  await captureSequence(page, 1000, 'test-results/claude');
});

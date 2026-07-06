import { test, expect } from '@playwright/test';

test.describe('Pagos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should register a payment successfully', async ({ page }) => {
    // Step 1: Create a local
    await page.getByRole('button', { name: 'Locales' }).click();
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('PAGO001');
    await page.getByLabel('Nombre').fill('Local para Pago');
    await page.getByLabel('Monto de Alquiler (USD)').fill('800');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Local para Pago' })).toBeVisible();

    // Step 2: Create an inquilino and assign to local (makes it "ocupado")
    await page.getByRole('button', { name: 'Inquilinos' }).click();
    await page.getByRole('button', { name: 'Nuevo Inquilino' }).click();
    await page.getByLabel('Nombre del Inquilino').fill('Tenant Uno');
    await page.getByLabel('Teléfono').fill('111222333');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Tenant Uno' })).toBeVisible();

    // Assign inquilino to local
    await page.getByRole('button', { name: 'Asignar a Local' }).click();
    await page.getByRole('combobox', { name: 'Inquilino' }).click();
    await page.getByRole('option', { name: 'Tenant Uno' }).click();
    await page.getByRole('combobox', { name: 'Local' }).click();
    await page.getByRole('option', { name: 'PAGO001' }).click();
    await page.getByRole('button', { name: 'Asignar', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'Asignado' })).toBeVisible();

    // Step 3: Generate a cargo for the local
    await page.getByRole('button', { name: 'Cargos' }).click();

    // Handle alert dialog from generate all
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Generar Cargos para Todos los Locales' }).click();
    await expect(page.getByRole('cell', { name: 'Local para Pago' })).toBeVisible();

    // Step 4: Navigate to Pagos and register a payment
    await page.getByRole('button', { name: 'Pagos' }).click();

    // Select local
    await page.getByRole('combobox', { name: 'Local' }).click();
    await page.getByRole('option', { name: 'PAGO001' }).click();

    // Select cargo mensual (should appear after selecting local)
    await page.getByRole('combobox', { name: 'Cargo Mensual' }).click();
    // Click the first available option
    await page.getByRole('option').first().click();

    // Fill amount
    await page.getByLabel('Monto').fill('800');

    // Submit payment
    await page.getByRole('button', { name: 'Registrar Pago' }).click();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Pago registrado' })).toBeVisible();
  });
});

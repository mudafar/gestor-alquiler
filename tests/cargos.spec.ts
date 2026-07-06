import { test, expect } from '@playwright/test';

test.describe('Cargos Mensuales', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should generate cargo for all locales', async ({ page }) => {
    // Set up dialog handler before any alerts
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Navigate to Locales and create a local (set to "ocupado" so cargos can be generated)
    await page.getByRole('button', { name: 'Locales' }).click();
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('CARGO001');
    await page.getByLabel('Nombre').fill('Local para Cargo');
    await page.getByLabel('Monto de Alquiler (USD)').fill('1000');
    // Set state to occupied (required for cargo generation)
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Ocupado' }).click();
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Local para Cargo' })).toBeVisible();

    // Navigate to Cargos
    await page.getByRole('button', { name: 'Cargos' }).click();

    // Generate cargos for all locales
    await page.getByRole('button', { name: 'Generar Cargos para Todos los Locales' }).click();

    // Verify cargo appears in the table
    await expect(page.getByRole('cell', { name: 'Local para Cargo' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '$1000.00' })).toBeVisible();
  });

  test('should show cargos table with correct data', async ({ page }) => {
    // Set up dialog handler before any alerts
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Create a local
    await page.getByRole('button', { name: 'Locales' }).click();
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('CARGO002');
    await page.getByLabel('Nombre').fill('Local con Cargos');
    await page.getByLabel('Monto de Alquiler (USD)').fill('750');
    await page.getByLabel('Monto de Condominio (USD) - Opcional').fill('100');
    await page.getByLabel('Monto de Luz (USD) - Opcional').fill('50');
    await page.getByRole('button', { name: 'Crear' }).click();

    // Navigate to Cargos
    await page.getByRole('button', { name: 'Cargos' }).click();

    // Generate cargos
    await page.getByRole('button', { name: 'Generar Cargos para Todos los Locales' }).click();

    // Verify total amount includes alquiler + condominio + luz = 900
    await expect(page.getByRole('cell', { name: '$900.00' })).toBeVisible();

    // Verify monto pagado is 0
    await expect(page.getByRole('cell', { name: '$0.00' })).toBeVisible();
  });
});

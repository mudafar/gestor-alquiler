import { test, expect } from '@playwright/test';

test.describe('Locales CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.getByRole('button', { name: 'Locales' }).click();
  });

  test('should create a new local successfully', async ({ page }) => {
    // Open the create modal
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await expect(page.getByRole('dialog', { name: 'Crear Nuevo Local' })).toBeVisible();

    // Fill the form
    await page.getByLabel('ID del Local').fill('L001');
    await page.getByLabel('Nombre').fill('Local Central');
    await page.getByLabel('Dirección').fill('Av. Principal 123');
    await page.getByLabel('Monto de Alquiler (USD)').fill('500');

    // Submit the form
    await page.getByRole('button', { name: 'Crear' }).click();

    // Verify modal is closed
    await expect(page.getByRole('dialog', { name: 'Crear Nuevo Local' })).not.toBeVisible();

    // Verify it appears in the table
    await expect(page.getByRole('cell', { name: 'L001' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Local Central' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '$500.00' })).toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Local creado' })).toBeVisible();
  });

  test('should show validation errors when required fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Local' }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Crear' }).click();

    // Verify validation errors appear
    await expect(page.getByText('El ID es requerido')).toBeVisible();
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
  });

  test('should edit an existing local', async ({ page }) => {
    // First create a local to edit
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('L002');
    await page.getByLabel('Nombre').fill('Local a Editar');
    await page.getByLabel('Monto de Alquiler (USD)').fill('400');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Local a Editar' })).toBeVisible();

    // Click the edit button (pencil icon with title="Editar") in the row
    const row = page.locator('tr').filter({ hasText: 'Local a Editar' });
    await row.getByRole('button', { name: 'Editar' }).click();

    // Verify edit modal is open
    await expect(page.getByRole('dialog', { name: 'Editar Local' })).toBeVisible();

    // Verify ID field is disabled in edit mode
    await expect(page.getByLabel('ID del Local')).toBeDisabled();

    // Update the name
    await page.getByLabel('Nombre').fill('Local Editado');
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Verify changes are reflected
    await expect(page.getByRole('cell', { name: 'Local Editado' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Local a Editar' })).not.toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Local actualizado' })).toBeVisible();
  });

  test('should delete a local with confirmation', async ({ page }) => {
    // Create a local to delete
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('L003');
    await page.getByLabel('Nombre').fill('Local a Eliminar');
    await page.getByLabel('Monto de Alquiler (USD)').fill('300');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Local a Eliminar' })).toBeVisible();

    // Click the delete button (trash icon with title="Eliminar")
    const row = page.locator('tr').filter({ hasText: 'Local a Eliminar' });
    await row.getByRole('button', { name: 'Eliminar' }).click();

    // Verify confirmation modal appears
    await expect(page.getByRole('dialog', { name: 'Confirmar Eliminación' })).toBeVisible();
    await expect(page.getByText('¿Estás seguro de que deseas eliminar este local?')).toBeVisible();

    // Confirm deletion — scope to the dialog to avoid ambiguity with table row button
    const dialog = page.getByRole('dialog', { name: 'Confirmar Eliminación' });
    await dialog.getByRole('button', { name: 'Eliminar' }).click();

    // Verify local is removed from the list
    await expect(page.getByRole('cell', { name: 'Local a Eliminar' })).not.toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Local eliminado' })).toBeVisible();
  });

  test('should cancel deletion', async ({ page }) => {
    // Create a local
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('L004');
    await page.getByLabel('Nombre').fill('Local a Conservar');
    await page.getByLabel('Monto de Alquiler (USD)').fill('350');
    await page.getByRole('button', { name: 'Crear' }).click();

    // Click delete
    const row = page.locator('tr').filter({ hasText: 'Local a Conservar' });
    await row.getByRole('button', { name: 'Eliminar' }).click();

    // Cancel in confirmation modal — scope to dialog to avoid ambiguity
    const dialog = page.getByRole('dialog', { name: 'Confirmar Eliminación' });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();

    // Verify modal is closed and local still exists
    await expect(page.getByRole('dialog', { name: 'Confirmar Eliminación' })).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'Local a Conservar' })).toBeVisible();
  });

  test('should cancel creating a new local', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Local' }).click();

    // Fill some fields
    await page.getByLabel('ID del Local').fill('L005');
    await page.getByLabel('Nombre').fill('Local Cancelado');

    // Cancel
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Verify modal is closed and local was not created
    await expect(page.getByRole('dialog', { name: 'Crear Nuevo Local' })).not.toBeVisible();
    await expect(page.getByText('Local Cancelado')).not.toBeVisible();
  });

  test('should create local with optional fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Local' }).click();

    // Fill required fields
    await page.getByLabel('ID del Local').fill('L006');
    await page.getByLabel('Nombre').fill('Local Completo');
    await page.getByLabel('Monto de Alquiler (USD)').fill('600');

    // Fill optional fields
    await page.getByLabel('Dirección').fill('Calle Secundaria 456');
    await page.getByLabel('Monto de Condominio (USD) - Opcional').fill('100');
    await page.getByLabel('Monto de Luz (USD) - Opcional').fill('50');

    // Change state to occupied
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Ocupado' }).click();

    await page.getByRole('button', { name: 'Crear' }).click();

    await expect(page.getByRole('cell', { name: 'Local Completo' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'L006' })).toBeVisible();
  });
});


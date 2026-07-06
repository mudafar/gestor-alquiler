# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cargos.spec.ts >> Cargos Mensuales >> should show cargos table with correct data
- Location: tests\cargos.spec.ts:34:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('cell', { name: '$900.00' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('cell', { name: '$900.00' })

```

```yaml
- banner:
  - button
  - heading "Sistema de Gestión de Alquileres" [level=4]
  - img "Cambios sin guardar"
  - button "Abrir DB":
    - img
    - text: Abrir DB
  - button "Guardar DB":
    - img
    - text: Guardar DB
- navigation:
  - paragraph: Menú Principal
  - button "Inicio":
    - img
    - text: Inicio
  - button "Locales":
    - img
    - text: Locales
  - button "Inquilinos":
    - img
    - text: Inquilinos
  - button "Pagos":
    - img
    - text: Pagos
  - button "Cargos":
    - img
    - text: Cargos
  - button "Egresos":
    - img
    - text: Egresos
  - button "Reportes":
    - img
    - text: Reportes
- main:
  - paragraph: Gestión de Cargos Mensuales
  - paragraph: Generar Cargos
  - text: Año
  - combobox "Año": "2026"
  - img
  - text: Mes
  - combobox "Mes": Julio
  - img
  - text: Local (Opcional)
  - combobox "Local (Opcional)"
  - img
  - button "Generar Cargo para Local Seleccionado"
  - button "Generar Cargos para Todos los Locales"
  - paragraph: Cargos Mensuales
  - table:
    - rowgroup:
      - row "Local Año Mes Monto Total Monto Pagado Estado":
        - columnheader "Local"
        - columnheader "Año"
        - columnheader "Mes"
        - columnheader "Monto Total"
        - columnheader "Monto Pagado"
        - columnheader "Estado"
    - rowgroup
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Cargos Mensuales', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('http://localhost:5174');
  6  |   });
  7  | 
  8  |   test('should generate cargo for all locales', async ({ page }) => {
  9  |     // Set up dialog handler before any alerts
  10 |     page.on('dialog', async (dialog) => {
  11 |       await dialog.accept();
  12 |     });
  13 | 
  14 |     // Navigate to Locales and create a local
  15 |     await page.getByRole('button', { name: 'Locales' }).click();
  16 |     await page.getByRole('button', { name: 'Nuevo Local' }).click();
  17 |     await page.getByLabel('ID del Local').fill('CARGO001');
  18 |     await page.getByLabel('Nombre').fill('Local para Cargo');
  19 |     await page.getByLabel('Monto de Alquiler (USD)').fill('1000');
  20 |     await page.getByRole('button', { name: 'Crear' }).click();
  21 |     await expect(page.getByRole('cell', { name: 'Local para Cargo' })).toBeVisible();
  22 | 
  23 |     // Navigate to Cargos
  24 |     await page.getByRole('button', { name: 'Cargos' }).click();
  25 | 
  26 |     // Generate cargos for all locales
  27 |     await page.getByRole('button', { name: 'Generar Cargos para Todos los Locales' }).click();
  28 | 
  29 |     // Verify cargo appears in the table
  30 |     await expect(page.getByRole('cell', { name: 'Local para Cargo' })).toBeVisible();
  31 |     await expect(page.getByRole('cell', { name: '$1000.00' })).toBeVisible();
  32 |   });
  33 | 
  34 |   test('should show cargos table with correct data', async ({ page }) => {
  35 |     // Set up dialog handler before any alerts
  36 |     page.on('dialog', async (dialog) => {
  37 |       await dialog.accept();
  38 |     });
  39 | 
  40 |     // Create a local
  41 |     await page.getByRole('button', { name: 'Locales' }).click();
  42 |     await page.getByRole('button', { name: 'Nuevo Local' }).click();
  43 |     await page.getByLabel('ID del Local').fill('CARGO002');
  44 |     await page.getByLabel('Nombre').fill('Local con Cargos');
  45 |     await page.getByLabel('Monto de Alquiler (USD)').fill('750');
  46 |     await page.getByLabel('Monto de Condominio (USD) - Opcional').fill('100');
  47 |     await page.getByLabel('Monto de Luz (USD) - Opcional').fill('50');
  48 |     await page.getByRole('button', { name: 'Crear' }).click();
  49 | 
  50 |     // Navigate to Cargos
  51 |     await page.getByRole('button', { name: 'Cargos' }).click();
  52 | 
  53 |     // Generate cargos
  54 |     await page.getByRole('button', { name: 'Generar Cargos para Todos los Locales' }).click();
  55 | 
  56 |     // Verify total amount includes alquiler + condominio + luz = 900
> 57 |     await expect(page.getByRole('cell', { name: '$900.00' })).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  58 | 
  59 |     // Verify monto pagado is 0
  60 |     await expect(page.getByRole('cell', { name: '$0.00' })).toBeVisible();
  61 |   });
  62 | });
  63 | 
```
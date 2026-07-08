# Alquiler Gestion — AI Agent Instructions

## Project Overview
Single-user rental management system for commercial properties. 100% Spanish UI. No backend, no auth, no network — must work fully offline. Runs as a Vite SPA with SQLite (sql.js, loaded locally, not from CDN) auto-persisted to IndexedDB. Manual export/import for backup.

Full spec: [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md).

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (port 5174, falls back to 5175) |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build |
| `npx playwright test` | Run E2E tests (dev server must be running) |

## Architecture
```
src/
├── App.tsx              # Mantine AppShell, navigation, DB import/export/clear
├── store/store.ts       # Zustand + Immer global store, all CRUD + persistDb actions
├── services/
│   ├── db.ts            # sql.js WASM layer (local bundle, not CDN), table creation
│   ├── appService.ts    # TypeScript interfaces, SQL query helpers
│   └── persistence.ts   # IndexedDB save/load/clear for auto-persistence
└── modules/
    ├── locales/         # Properties CRUD — estado now auto-computed from active contrato
    ├── inquilinos/      # Tenants CRUD only (no local assignment — moved to contratos)
    ├── contratos/        # NEW — contract creation/cancellation, generates cargos_mensuales
    ├── cargos/           # Read-only view of cargos per contrato (calculated fields only)
    ├── pagos/            # Payment registration (BS + tasa_cambio → USD) + historial
    ├── egresos/          # Business expenses CRUD (full)
    └── reportes/         # Reports & analytics
```

## Stack
- **React 19** + **TypeScript** + **Vite 8**
- **Mantine 9** (`@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`)
- **Zustand** + **Immer** for state
- **sql.js** (SQLite WASM, **bundled locally** — no CDN dependency, must work offline) + **IndexedDB** for auto-persistence
- **@tabler/icons-react** for icons
- **Playwright** for E2E testing
- **oxlint** for linting

## Key Conventions
- **All UI text in Spanish** (labels, messages, notifications, dates)
- **Modules are self-contained** — each `modules/*/` folder contains its module component
- **State flows through Zustand** — modules call `useAppStore()` actions, never query DB directly
- **DB access** goes through `services/db.ts` (`getDatabase()`, `initDatabase()`, `exportDatabase()`)
- **Auto-persistence** via `services/persistence.ts` — every CRUD action calls `persistDb()`
- **Type definitions** live in `services/appService.ts`
- **Forms** use `@mantine/form` with Spanish validation messages; use `type: 'select'` in `getInputProps` for Select components
- **Notifications** use `@mantine/notifications` (never `alert()`)
- **Soft-delete pattern**: `locales`/`inquilinos`/`egresos` have `activo: boolean` field instead of hard deletes
- **Contratos are immutable**: no edit action — only create and cancel. To correct data: cancel + create new.
- **Derived fields are never stored**: `monto_pagado` and `estado_morosidad` on cargos are always computed from `pagos` at query time — never written to the DB.
- **No overpayment**: payment amount (USD equivalent) cannot exceed a cargo's remaining balance — validate before insert, block and notify if exceeded.
- **Currency**: all internal calculations and reports are in USD. Payments are entered in BS + tasa_cambio; USD is calculated (`monto_bs / tasa_cambio`) and stored alongside BS and tasa as historical record.
- **Last exchange rate**: read/write from `config` table (key `ultima_tasa_cambio`), used to pre-fill the pagos form.
- **ActionIcons** have `title` attributes for accessibility and testability
- **sql.js loads from local assets** — do not reintroduce CDN loading; wasm file must be bundled/served locally for offline support
- **Creation forms (Locales, Inquilinos, Contratos, Pagos)**: dual-button footer — **"Crear"** (save + close modal) and **"Crear y agregar otro"** (save + `form.reset()` + keep modal open + focus first field). Both trigger a success notification. Edit forms keep a single "Guardar" button (save + close), no "add another" option.
- **Pagos form**: both buttons fully reset the form (including selected local/contrato/cargo) after a successful save — except on validation failure (e.g. overpayment), where the form must keep its values so the user can correct them.
- **Contratos date inputs**: use Mantine's `MonthPickerInput` (`@mantine/dates`) for fecha_inicio/fecha_fin — month/year only, matches the `anio`/`mes` data model. Validate fecha_fin ≥ fecha_inicio.
- **Pagos amount inputs**: two editable `NumberInput` fields — Monto (USD) and Monto (Bs) — plus tasa de cambio (pre-filled from `config.ultima_tasa_cambio`). Editing USD recalculates Bs (USD × tasa); editing Bs recalculates USD (Bs / tasa); editing tasa recalculates whichever amount field was **not** the last one manually edited. Data model unchanged — `monto_bs`, `tasa_cambio`, `monto_usd` are still what's persisted; the dual input is a UI convenience only.
- **Pagos selection flow**: local/contrato selected first, then cargo (mes). On contrato selection, auto-preselect the cargo matching the current date's mes/año **only if** it exists and has a remaining balance; otherwise leave selection to the user.

## Data Model
See full schema in [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md#3-modelo-de-datos-sqlite).

Tables: `locales`, `inquilinos`, `contratos`, `cargos_mensuales`, `pagos`, `egresos`, `config`.

Key relationships:
- `contratos.local_id → locales`, `contratos.inquilino_id → inquilinos`
- `cargos_mensuales.contrato_id → contratos` (local/inquilino resolved via join, no direct FK)
- `pagos.cargo_mensual_id → cargos_mensuales` (contrato/local resolved via join, no direct FK)
- `inquilinos` has **no** `local_id` — relationship lives only in `contratos` (one inquilino can have contracts across multiple locales)

## Business Rules
See [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md#4-reglas-de-negocio) for full detail. Summary:

- A local can have only **one active contrato at a time** (validated against `estado = 'activo'` only, not historical overlap).
- Creating a contrato auto-generates all its cargos_mensuales (one per month, fecha_inicio → fecha_fin).
- Contrato auto-transitions to `finalizado` on app load if `fecha_fin` has passed.
- Cancelling a contrato (`estado = 'cancelado'`):
  - Deletes future cargos **without** payments.
  - Keeps past cargos without payments (morosidad history).
  - Keeps any cargo (past or future) that has a payment.
- Local's `estado` (ocupado/vacante) is always computed from whether it has an active contrato — never set manually.
- Morosidad per cargo: **al_dia** (paid in full by day 5), **atrasado** (unpaid/incomplete after day 5), **adelantado** (future month paid in full in advance) — always computed, never stored.
- Reports are always in USD and include data from contratos in any state (activo/finalizado/cancelado).

## Module Status
| Module | Status | Notes |
|---|---|---|
| Module | Status | Notes |
|---|---|---|
| Locales | ✅ Complete | CRUD (nombre, dirección, montos). `estado` badge auto-computed from active contrato. `id` is INTEGER AUTOINCREMENT (hidden from user). |
| Inquilinos | ✅ Complete | CRUD (nombre, cédula). Sin `telefono`/`local_id`. Sin asignación directa a locales. |
| Contratos | ✅ Complete | Crear/cancelar. Genera cargos_mensuales automáticos. Valida 1 activo por local. |
| Egresos | ✅ Complete | Full CRUD with confirmation modal. |
| Cargos | ✅ Complete | Read-only view per contrato. `monto_pagado`/`estado_morosidad` computed from pagos. |
| Pagos | ✅ Complete | BS + tasa_cambio → USD. Dual USD/BS inputs. Overpayment validation. Cuenta mandatory. Auto-preselect cargo. |
| Reportes | ⚠️ Needs update | Must reflect new contrato-based joins; ficha por local must show active contrato + historical contratos list |

## Known Issues
- `db.ts`: `SqlJs` type not resolved (minor TS warning, non-blocking)
- `npm run dev` optimizer may hang on cold start — use `npm run build && npm run preview` as workaround

## Testing
- E2E tests in `tests/` using Playwright
- `playwright.config.ts` configured with `headless: false` for visible browser
- Dev server auto-started via `webServer` config block
- Existing passing tests (pre-refactor): `locales.spec.ts` (7), `inquilinos.spec.ts` (5), `egresos.spec.ts` (4) — **inquilinos and locales tests will need updates** once cedula/telefono and estado-automático changes land
- New tests needed: `contratos.spec.ts` (create, validate one-active-per-local, cancel + cargo cleanup rules), updated `pagos.spec.ts` (BS/tasa/USD calc, overpayment block)
- Test Guide: [`TEST_GUIDE.md`](./TEST_GUIDE.md)
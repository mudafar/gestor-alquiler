# Alquiler Gestion — AI Agent Instructions

## Project Overview
Single-user rental management system for commercial properties. 100% Spanish UI. No backend, no auth, no network. Runs as a Vite SPA with SQLite (sql.js) auto-persisted to IndexedDB. Manual export/import for backup.

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
│   ├── db.ts            # sql.js WASM layer (CDN-loaded), table creation
│   ├── appService.ts    # TypeScript interfaces, SQL query helpers
│   └── persistence.ts   # IndexedDB save/load/clear for auto-persistence
└── modules/
    ├── locales/         # Properties CRUD (full)
    ├── inquilinos/      # Tenants CRUD + assignment/unassignment
    ├── cargos/          # Monthly charge generation only (no table view)
    ├── pagos/           # Payment registration only (no historial)
    ├── egresos/         # Business expenses CRUD (full)
    └── reportes/        # Reports & analytics (incomplete — has build errors)
```

## Stack
- **React 19** + **TypeScript** + **Vite 8**
- **Mantine 9** (`@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`)
- **Zustand** + **Immer** for state
- **sql.js** (SQLite WASM from CDN) + **IndexedDB** for auto-persistence
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
- **Soft-delete pattern**: entities have `activo: boolean` field instead of hard deletes
- **Currency**: charges in USD (fixed), payments can be USD or BS (no auto-conversion)
- **ActionIcons** have `title` attributes for accessibility and testability
- **sql.js loads from CDN** at runtime (`https://sql.js.org/dist/sql-wasm.js`) — optimizeDeps excludes it in Vite config

## Data Model
See full schema in [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md#3-modelo-de-datos-sqlite).

Tables: `locales`, `inquilinos`, `cargos_mensuales`, `pagos`, `egresos`.

## Business Rules
See [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md#4-reglas-de-negocio) for morosidad logic, partial payments, and charge calculations.

## Module Status
| Module | Status | Notes |
|---|---|---|
| Locales | ✅ Complete | Full CRUD with confirmation modal for delete |
| Inquilinos | ✅ Complete | CRUD + assign/unassign to locales |
| Egresos | ✅ Complete | Full CRUD with confirmation modal |
| Cargos | ⚠️ Partial | Generation form only; table view moved to reportes |
| Pagos | ⚠️ Partial | Registration form only; historial moved to reportes |
| Reportes | ✅ Complete | Resumen financiero, morosos actuales, and ficha por local complete. Connected directly to `appService`. |

## Known Build Errors (pre-existing)
- `db.ts`: `SqlJs` type not resolved (missing import)

## Testing
- E2E tests in `tests/` using Playwright
- `playwright.config.ts` configured with `headless: false` for visible browser
- Dev server auto-started via `webServer` config block
- Passing: `locales.spec.ts` (7), `inquilinos.spec.ts` (5), `egresos.spec.ts` (4)
- Passing: `locales.spec.ts` (7), `inquilinos.spec.ts` (5), `egresos.spec.ts` (4)
- Test Guide: [`TEST_GUIDE.md`](./TEST_GUIDE.md)



# TODO
- keep currencies USD and Bs calculation separated 
- morosity fomrula should allow approx exchange rate of Bs to USD
- crud for pagos, currently only generate but no list, edit, or remove   
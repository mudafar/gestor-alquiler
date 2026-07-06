// Load sql.js dynamically from CDN to avoid module format issues
let dbInstance: any = null;
let SQL: any = null;

// Real database implementation using sql.js
export async function initDatabase(existingDbBytes?: Uint8Array): Promise<any> {
  if (!SQL) {
    // Load sql.js from CDN as a script
    await new Promise<void>((resolve, reject) => {
      if ((window as any).initSqlJs) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sql.js.org/dist/sql-wasm.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(script);
    });
    
    const initSqlJs = (window as any).initSqlJs;
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }

  if (existingDbBytes) {
    dbInstance = new SQL.Database(existingDbBytes);
    runMigrations(dbInstance);
  } else if (!dbInstance) {
    dbInstance = new SQL.Database();
    createTables(dbInstance);
  }

  return dbInstance;
}

export function getDatabase(): SqlJs['Database'] {
  if (!dbInstance) {
    throw new Error('La base de datos no ha sido inicializada.');
  }
  return dbInstance;
}

export function exportDatabase(): Uint8Array {
  const db = getDatabase();
  return db.export();
}

function createTables(db: SqlJs['Database']) {
  // Habilitar claves foráneas
  db.run('PRAGMA foreign_keys = ON;');

  // Tabla: locales
  db.run(`
    CREATE TABLE IF NOT EXISTS locales (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      direccion TEXT,
      estado TEXT NOT NULL CHECK (estado IN ('ocupado', 'vacante')),
      monto_alquiler REAL NOT NULL,
      monto_condominio REAL,
      monto_luz REAL,
      activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
    );
  `);

  // Tabla: inquilinos
  db.run(`
    CREATE TABLE IF NOT EXISTS inquilinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
      FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
    );
  `);

  // Tabla de relación: un inquilino puede tener múltiples locales
  db.run(`
    CREATE TABLE IF NOT EXISTS inquilino_locales (
      inquilino_id INTEGER NOT NULL,
      local_id TEXT NOT NULL,
      PRIMARY KEY (inquilino_id, local_id),
      FOREIGN KEY (inquilino_id) REFERENCES inquilinos(id) ON DELETE CASCADE,
      FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
    );
  `);

  // Tabla: cargos_mensuales
  db.run(`
    CREATE TABLE IF NOT EXISTS cargos_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT NOT NULL,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      monto_alquiler REAL NOT NULL,
      monto_condominio REAL,
      monto_luz REAL,
      monto_total REAL NOT NULL,
      monto_pagado REAL NOT NULL DEFAULT 0,
      estado_morosidad TEXT NOT NULL CHECK (estado_morosidad IN ('al_dia', 'atrasado', 'adelantado')),
      UNIQUE(local_id, anio, mes),
      FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
    );
  `);

  // Tabla: pagos
  db.run(`
    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cargo_mensual_id INTEGER NOT NULL,
      local_id TEXT NOT NULL,
      fecha_pago TEXT NOT NULL,
      monto REAL NOT NULL,
      moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'BS')),
      cuenta TEXT NOT NULL CHECK (cuenta IN ('juridica', 'personal')),
      creado_en TEXT NOT NULL,
      FOREIGN KEY (cargo_mensual_id) REFERENCES cargos_mensuales(id) ON DELETE CASCADE,
      FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
    );
  `);

  // Tabla: egresos
  db.run(`
    CREATE TABLE IF NOT EXISTS egresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      monto REAL NOT NULL,
      moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'BS')),
      descripcion TEXT NOT NULL,
      categoria TEXT
    );
  `);
}

// Run on every existing-DB load to apply incremental migrations
function runMigrations(db: any) {
  // Migration 1: add inquilino_locales join table if not present
  db.run(`
    CREATE TABLE IF NOT EXISTS inquilino_locales (
      inquilino_id INTEGER NOT NULL,
      local_id TEXT NOT NULL,
      PRIMARY KEY (inquilino_id, local_id),
      FOREIGN KEY (inquilino_id) REFERENCES inquilinos(id) ON DELETE CASCADE,
      FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
    );
  `);

  // Migration 2: seed join table from legacy local_id column
  db.run(`
    INSERT OR IGNORE INTO inquilino_locales (inquilino_id, local_id)
    SELECT id, local_id FROM inquilinos
    WHERE local_id IS NOT NULL AND activo = 1;
  `);
}

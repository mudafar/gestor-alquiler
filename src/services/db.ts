let dbInstance: any = null;
let SQL: any = null;

export async function initDatabase(existingDbBytes?: Uint8Array): Promise<any> {
  if (!SQL) {
    await new Promise<void>((resolve, reject) => {
      if ((window as any).initSqlJs) { resolve(); return; }
      const s = document.createElement('script');
      s.src = '/sql-wasm-browser.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(s);
    });
    // Pre-fetch wasm bytes so sql.js doesn't need to fetch via URL
    const wasmResp = await fetch('/sql-wasm.wasm');
    if (!wasmResp.ok) throw new Error(`WASM fetch failed: ${wasmResp.status}`);
    const wasmBinary = await wasmResp.arrayBuffer();
    SQL = await (window as any).initSqlJs({
      locateFile: (f: string) => `/${f}`,
      wasmBinary,
    });
  }

  if (existingDbBytes) {
    dbInstance = new SQL.Database(existingDbBytes);
    runCreateTables(dbInstance);
  } else if (!dbInstance) {
    dbInstance = new SQL.Database();
    runCreateTables(dbInstance);
  }

  return dbInstance;
}

export function getDatabase(): any {
  if (!dbInstance) throw new Error('La base de datos no ha sido inicializada.');
  return dbInstance;
}

export function exportDatabase(): Uint8Array {
  const db = getDatabase();
  return db.export();
}

function runCreateTables(db: any) {
  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
    CREATE TABLE IF NOT EXISTS locales (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      direccion TEXT,
      monto_alquiler REAL NOT NULL,
      monto_condominio REAL,
      monto_luz REAL,
      activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inquilinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      cedula TEXT UNIQUE,
      activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT NOT NULL,
      inquilino_id INTEGER NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      monto_alquiler REAL NOT NULL,
      monto_condominio REAL,
      monto_luz REAL,
      observaciones TEXT,
      estado TEXT NOT NULL CHECK (estado IN ('activo', 'finalizado', 'cancelado')),
      creado_en TEXT NOT NULL,
      FOREIGN KEY (local_id) REFERENCES locales(id),
      FOREIGN KEY (inquilino_id) REFERENCES inquilinos(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cargos_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contrato_id INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      monto_alquiler REAL NOT NULL,
      monto_condominio REAL,
      monto_luz REAL,
      monto_total REAL NOT NULL,
      UNIQUE(contrato_id, anio, mes),
      FOREIGN KEY (contrato_id) REFERENCES contratos(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cargo_mensual_id INTEGER NOT NULL,
      fecha_pago TEXT NOT NULL,
      monto_bs REAL NOT NULL,
      tasa_cambio REAL NOT NULL,
      monto_usd REAL NOT NULL,
      cuenta TEXT NOT NULL CHECK (cuenta IN ('juridica', 'personal')),
      creado_en TEXT NOT NULL,
      FOREIGN KEY (cargo_mensual_id) REFERENCES cargos_mensuales(id)
    );
  `);

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

  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);

  db.run(
    `INSERT OR IGNORE INTO config (clave, valor) VALUES ('ultima_tasa_cambio', '0')`
  );
}

import { getDatabase } from './db';

export interface Local {
  id: string; // código/ID propio del local
  nombre: string;
  direccion?: string;
  estado: 'ocupado' | 'vacante';
  monto_alquiler: number;
  monto_condominio?: number | null;
  monto_luz?: number | null;
  activo: boolean;
}

export interface Inquilino {
  id: number;
  local_ids: string[];
  nombre: string;
  telefono?: string;
  activo: boolean;
}

export interface CargoMensual {
  id: number;
  local_id: string;
  anio: number;
  mes: number;
  monto_alquiler: number;
  monto_condominio: number | null;
  monto_luz: number | null;
  monto_total: number;
  monto_pagado: number;
  estado_morosidad: 'al_dia' | 'atrasado' | 'adelantado';
}

export interface Pago {
  id: number;
  cargo_mensual_id: number;
  local_id: string;
  fecha_pago: string;
  monto: number;
  moneda: 'USD' | 'BS';
  cuenta: 'juridica' | 'personal';
  creado_en: string;
}

export interface Egreso {
  id: number;
  fecha: string;
  monto: number;
  moneda: 'USD' | 'BS';
  descripcion: string;
  categoria?: string;
}

// Helper to execute SELECT queries and return object arrays
function select<T>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

// Helper to execute INSERT, UPDATE, DELETE queries
function execute(sql: string, params: any[] = []): void {
  const db = getDatabase();
  db.run(sql, params);
}

// Helper to calculate estado_morosidad dynamically
export function calcularMorosidad(
  anio: number,
  mes: number,
  montoTotal: number,
  montoPagado: number,
  today: Date = new Date()
): 'al_dia' | 'atrasado' | 'adelantado' {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // 1. ¿Es un mes futuro?
  const esFuturo = anio > currentYear || (anio === currentYear && mes > currentMonth);
  if (esFuturo) {
    return montoPagado >= montoTotal ? 'adelantado' : 'al_dia';
  }

  // 2. Mes actual o pasado
  if (montoPagado >= montoTotal) {
    return 'al_dia'; // Totalmente pagado
  }

  // No está totalmente pagado
  const esMesActual = anio === currentYear && mes === currentMonth;
  if (esMesActual) {
    // Si es el mes actual, tiene hasta el día 5 para pagar sin estar atrasado
    return currentDay <= 5 ? 'al_dia' : 'atrasado';
  }

  // Es un mes pasado y no está totalmente pagado
  return 'atrasado';
}

export const appService = {
  // === LOCALES ===
  getLocales(soloActivos: boolean = true): Local[] {
    const query = soloActivos
      ? 'SELECT * FROM locales WHERE activo = 1 ORDER BY id ASC'
      : 'SELECT * FROM locales ORDER BY id ASC';
    const rows = select<any>(query);
    return rows.map(r => ({
      ...r,
      activo: r.activo === 1,
    }));
  },

  createLocal(local: Omit<Local, 'activo'>): void {
    execute(
      `INSERT INTO locales (id, nombre, direccion, estado, monto_alquiler, monto_condominio, monto_luz, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        local.id,
        local.nombre,
        local.direccion || null,
        local.estado,
        local.monto_alquiler,
        local.monto_condominio || null,
        local.monto_luz || null,
      ]
    );
  },

  updateLocal(local: Local): void {
    execute(
      `UPDATE locales
       SET nombre = ?, direccion = ?, estado = ?, monto_alquiler = ?, monto_condominio = ?, monto_luz = ?, activo = ?
       WHERE id = ?`,
      [
        local.nombre,
        local.direccion || null,
        local.estado,
        local.monto_alquiler,
        local.monto_condominio || null,
        local.monto_luz || null,
        local.activo ? 1 : 0,
        local.id,
      ]
    );

    // Si un local pasa a vacante, limpiar todas las asignaciones de inquilinos
    if (local.estado === 'vacante') {
      execute('DELETE FROM inquilino_locales WHERE local_id = ?', [local.id]);
    }
  },

  deleteLocal(id: string): void {
    // Soft delete
    execute('UPDATE locales SET activo = 0 WHERE id = ?', [id]);
    // Remove all inquilino assignments for this local
    execute('DELETE FROM inquilino_locales WHERE local_id = ?', [id]);
  },

  // === INQUILINOS ===
  getInquilinosActivos(): Inquilino[] {
    const rows = select<any>('SELECT * FROM inquilinos WHERE activo = 1 ORDER BY nombre ASC');
    return rows.map(r => {
      const localRows = select<any>('SELECT local_id FROM inquilino_locales WHERE inquilino_id = ?', [r.id]);
      return {
        id: r.id,
        nombre: r.nombre,
        telefono: r.telefono ?? undefined,
        local_ids: localRows.map((lr: any) => lr.local_id),
        activo: true,
      };
    });
  },

  getAllInquilinos(): Inquilino[] {
    const rows = select<any>('SELECT * FROM inquilinos ORDER BY nombre ASC');
    return rows.map(r => {
      const localRows = select<any>('SELECT local_id FROM inquilino_locales WHERE inquilino_id = ?', [r.id]);
      return {
        id: r.id,
        nombre: r.nombre,
        telefono: r.telefono ?? undefined,
        local_ids: localRows.map((lr: any) => lr.local_id),
        activo: r.activo === 1,
      };
    });
  },

  getInquilinoActivoPorLocal(localId: string): Inquilino | null {
    const rows = select<any>(
      `SELECT i.* FROM inquilinos i
       JOIN inquilino_locales il ON i.id = il.inquilino_id
       WHERE il.local_id = ? AND i.activo = 1
       LIMIT 1`,
      [localId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    const localRows = select<any>('SELECT local_id FROM inquilino_locales WHERE inquilino_id = ?', [r.id]);
    return {
      id: r.id,
      nombre: r.nombre,
      telefono: r.telefono ?? undefined,
      local_ids: localRows.map((lr: any) => lr.local_id),
      activo: true,
    };
  },

  createInquilino(nombre: string, telefono?: string): number {
    const db = getDatabase();
    db.run('INSERT INTO inquilinos (local_id, nombre, telefono, activo) VALUES (NULL, ?, ?, 1)', [nombre, telefono || null]);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    return result[0].values[0][0] as number;
  },

  updateInquilino(id: number, nombre: string, telefono?: string): void {
    execute('UPDATE inquilinos SET nombre = ?, telefono = ? WHERE id = ?', [nombre, telefono || null, id]);
  },

  deleteInquilino(id: number): void {
    execute('UPDATE inquilinos SET activo = 0 WHERE id = ?', [id]);
    // Remove all local assignments for this inquilino
    execute('DELETE FROM inquilino_locales WHERE inquilino_id = ?', [id]);
  },

  asignarInquilinoExistente(inquilinoId: number, localId: string): void {
    // Add to join table (ignore if already assigned)
    execute('INSERT OR IGNORE INTO inquilino_locales (inquilino_id, local_id) VALUES (?, ?)', [inquilinoId, localId]);
    // Ensure inquilino is active
    execute('UPDATE inquilinos SET activo = 1 WHERE id = ?', [inquilinoId]);
    // Mark local as ocupado
    execute("UPDATE locales SET estado = 'ocupado' WHERE id = ?", [localId]);
  },

  asignarInquilinoNuevo(localId: string, nombre: string, telefono?: string): void {
    const db = getDatabase();
    db.run('INSERT INTO inquilinos (local_id, nombre, telefono, activo) VALUES (NULL, ?, ?, 1)', [nombre, telefono || null]);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    const inquilinoId = result[0].values[0][0] as number;
    // Add to join table
    execute('INSERT OR IGNORE INTO inquilino_locales (inquilino_id, local_id) VALUES (?, ?)', [inquilinoId, localId]);
    // Mark local as occupied
    execute("UPDATE locales SET estado = 'ocupado' WHERE id = ?", [localId]);
  },

  desasignarInquilino(inquilinoId: number, localId: string): void {
    // Remove the specific assignment
    execute('DELETE FROM inquilino_locales WHERE inquilino_id = ? AND local_id = ?', [inquilinoId, localId]);

    // If no more active inquilinos remain for this local, mark it vacante
    const remaining = select<any>(
      `SELECT i.id FROM inquilinos i
       JOIN inquilino_locales il ON i.id = il.inquilino_id
       WHERE il.local_id = ? AND i.activo = 1`,
      [localId]
    );
    if (remaining.length === 0) {
      execute("UPDATE locales SET estado = 'vacante' WHERE id = ?", [localId]);
    }
  },

  // === CARGOS MENSUALES ===
  getCargosMensuales(filters?: { localId?: string; anio?: number; mes?: number }): CargoMensual[] {
    let query = 'SELECT * FROM cargos_mensuales';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.localId) {
      conditions.push('local_id = ?');
      params.push(filters.localId);
    }
    if (filters?.anio) {
      conditions.push('anio = ?');
      params.push(filters.anio);
    }
    if (filters?.mes) {
      conditions.push('mes = ?');
      params.push(filters.mes);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY anio DESC, mes DESC, local_id ASC';

    const rows = select<any>(query, params);
    
    // Recalcular el estado de morosidad al consultar
    const updatedRows = rows.map(r => {
      const estado_morosidad = calcularMorosidad(
        r.anio,
        r.mes,
        r.monto_total,
        r.monto_pagado
      );
      if (estado_morosidad !== r.estado_morosidad) {
        execute('UPDATE cargos_mensuales SET estado_morosidad = ? WHERE id = ?', [estado_morosidad, r.id]);
      }
      return {
        ...r,
        estado_morosidad,
      };
    });

    return updatedRows;
  },

  generarCargoMensual(localId: string, anio: number, mes: number): void {
    // 1. Verificar si ya existe un cargo para ese local en ese mes
    const existentes = select<any>(
      'SELECT id FROM cargos_mensuales WHERE local_id = ? AND anio = ? AND mes = ?',
      [localId, anio, mes]
    );
    if (existentes.length > 0) {
      return; // Ya existe
    }

    // 2. Obtener datos del local
    const locales = select<any>('SELECT * FROM locales WHERE id = ? AND activo = 1', [localId]);
    if (locales.length === 0) {
      throw new Error(`El local ${localId} no existe o está inactivo.`);
    }
    const local = locales[0];

    const monto_alquiler = local.monto_alquiler;
    const monto_condominio = local.monto_condominio || 0;
    const monto_luz = local.monto_luz || 0;
    const monto_total = monto_alquiler + monto_condominio + monto_luz;
    const estado_morosidad = calcularMorosidad(anio, mes, monto_total, 0);

    execute(
      `INSERT INTO cargos_mensuales (local_id, anio, mes, monto_alquiler, monto_condominio, monto_luz, monto_total, monto_pagado, estado_morosidad)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        localId,
        anio,
        mes,
        monto_alquiler,
        local.monto_condominio || null,
        local.monto_luz || null,
        monto_total,
        estado_morosidad,
      ]
    );
  },

  generarCargosParaMes(anio: number, mes: number): number {
    // Obtener todos los locales ocupados y activos
    const localesOcupados = select<any>("SELECT id FROM locales WHERE activo = 1 AND estado = 'ocupado'");
    let creados = 0;
    for (const loc of localesOcupados) {
      const existentes = select<any>(
        'SELECT id FROM cargos_mensuales WHERE local_id = ? AND anio = ? AND mes = ?',
        [loc.id, anio, mes]
      );
      if (existentes.length === 0) {
        this.generarCargoMensual(loc.id, anio, mes);
        creados++;
      }
    }
    return creados;
  },

  // === PAGOS ===
  getPagos(filters?: { localId?: string; cargoMensualId?: number }): Pago[] {
    let query = 'SELECT * FROM pagos';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.localId) {
      conditions.push('local_id = ?');
      params.push(filters.localId);
    }
    if (filters?.cargoMensualId) {
      conditions.push('cargo_mensual_id = ?');
      params.push(filters.cargoMensualId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY fecha_pago DESC, creado_en DESC';

    return select<Pago>(query, params);
  },

  registrarPago(
    cargoMensualId: number,
    localId: string,
    fechaPago: string,
    monto: number,
    moneda: 'USD' | 'BS',
    cuenta: 'juridica' | 'personal'
  ): void {
    const timestamp = new Date().toISOString();

    // 1. Insertar el pago
    execute(
      `INSERT INTO pagos (cargo_mensual_id, local_id, fecha_pago, monto, moneda, cuenta, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cargoMensualId, localId, fechaPago, monto, moneda, cuenta, timestamp]
    );

    // 2. Actualizar el monto pagado acumulado y morosidad en el cargo correspondiente
    // NOTA: Como no hay tasa de cambio, el pago 'monto' se asume que abona la misma cantidad al cargo
    // de acuerdo a la regla de negocio (los pagos se registran por el monto correspondiente).
    const pagosCargo = select<any>('SELECT SUM(monto) as total_pagado FROM pagos WHERE cargo_mensual_id = ?', [cargoMensualId]);
    const nuevoMontoPagado = pagosCargo[0]?.total_pagado || 0;

    const cargoRows = select<any>('SELECT * FROM cargos_mensuales WHERE id = ?', [cargoMensualId]);
    if (cargoRows.length > 0) {
      const cargo = cargoRows[0];
      const nuevoEstado = calcularMorosidad(
        cargo.anio,
        cargo.mes,
        cargo.monto_total,
        nuevoMontoPagado
      );

      execute(
        'UPDATE cargos_mensuales SET monto_pagado = ?, estado_morosidad = ? WHERE id = ?',
        [nuevoMontoPagado, nuevoEstado, cargoMensualId]
      );
    }
  },

  eliminarPago(pagoId: number): void {
    const pagos = select<any>('SELECT * FROM pagos WHERE id = ?', [pagoId]);
    if (pagos.length === 0) return;
    const pago = pagos[0];

    // 1. Eliminar el pago
    execute('DELETE FROM pagos WHERE id = ?', [pagoId]);

    // 2. Recalcular el total pagado para el cargo mensual
    const pagosCargo = select<any>('SELECT SUM(monto) as total_pagado FROM pagos WHERE cargo_mensual_id = ?', [pago.cargo_mensual_id]);
    const nuevoMontoPagado = pagosCargo[0]?.total_pagado || 0;

    const cargoRows = select<any>('SELECT * FROM cargos_mensuales WHERE id = ?', [pago.cargo_mensual_id]);
    if (cargoRows.length > 0) {
      const cargo = cargoRows[0];
      const nuevoEstado = calcularMorosidad(
        cargo.anio,
        cargo.mes,
        cargo.monto_total,
        nuevoMontoPagado
      );

      execute(
        'UPDATE cargos_mensuales SET monto_pagado = ?, estado_morosidad = ? WHERE id = ?',
        [nuevoMontoPagado, nuevoEstado, cargo.id]
      );
    }
  },

  // === EGRESOS ===
  getEgresos(filters?: { fechaInicio?: string; fechaFin?: string }): Egreso[] {
    let query = 'SELECT * FROM egresos';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.fechaInicio) {
      conditions.push('fecha >= ?');
      params.push(filters.fechaInicio);
    }
    if (filters?.fechaFin) {
      conditions.push('fecha <= ?');
      params.push(filters.fechaFin);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY fecha DESC, id DESC';

    return select<Egreso>(query, params);
  },

  createEgreso(egreso: Omit<Egreso, 'id'>): void {
    execute(
      'INSERT INTO egresos (fecha, monto, moneda, descripcion, categoria) VALUES (?, ?, ?, ?, ?)',
      [egreso.fecha, egreso.monto, egreso.moneda, egreso.descripcion, egreso.categoria || null]
    );
  },

  updateEgreso(egreso: Egreso): void {
    execute(
      'UPDATE egresos SET fecha = ?, monto = ?, moneda = ?, descripcion = ?, categoria = ? WHERE id = ?',
      [egreso.fecha, egreso.monto, egreso.moneda, egreso.descripcion, egreso.categoria || null, egreso.id]
    );
  },

  deleteEgreso(id: number): void {
    execute('DELETE FROM egresos WHERE id = ?', [id]);
  },

  // === REPORTES Y CONSULTAS ESPECIALES ===
  getReporteResumen(fechaInicio: string, fechaFin: string) {
    // 1. Ingresos (pagos) por moneda y por cuenta
    const ingresos = select<any>(
      `SELECT moneda, cuenta, SUM(monto) as total
       FROM pagos
       WHERE fecha_pago >= ? AND fecha_pago <= ?
       GROUP BY moneda, cuenta`,
      [fechaInicio, fechaFin]
    );

    // 2. Egresos por moneda
    const egresos = select<any>(
      `SELECT moneda, SUM(monto) as total
       FROM egresos
       WHERE fecha >= ? AND fecha <= ?
       GROUP BY moneda`,
      [fechaInicio, fechaFin]
    );

    // Estructurar el resultado
    const ingresosPorMonedaYCuenta = {
      USD: { juridica: 0, personal: 0, total: 0 },
      BS: { juridica: 0, personal: 0, total: 0 },
    };

    ingresos.forEach((ing: any) => {
      const mon = ing.moneda as 'USD' | 'BS';
      const cta = ing.cuenta as 'juridica' | 'personal';
      if (ingresosPorMonedaYCuenta[mon]) {
        ingresosPorMonedaYCuenta[mon][cta] = ing.total;
        ingresosPorMonedaYCuenta[mon].total += ing.total;
      }
    });

    const egresosPorMoneda = {
      USD: 0,
      BS: 0,
    };

    egresos.forEach((egr: any) => {
      const mon = egr.moneda as 'USD' | 'BS';
      if (egresosPorMoneda[mon] !== undefined) {
        egresosPorMoneda[mon] = egr.total;
      }
    });

    return {
      ingresos: ingresosPorMonedaYCuenta,
      egresos: egresosPorMoneda,
    };
  },

  getFichaLocal(localId: string) {
    const local = this.getLocales(false).find(l => l.id === localId);
    if (!local) return null;

    const inquilino = this.getInquilinoActivoPorLocal(localId);
    const cargos = this.getCargosMensuales({ localId });
    const pagos = this.getPagos({ localId });

    // Calcular balance general del local (en USD)
    const totalCargado = cargos.reduce((sum, c) => sum + c.monto_total, 0);
    const totalPagadoEnUSD = pagos
      .filter(p => p.moneda === 'USD')
      .reduce((sum, p) => sum + p.monto, 0);

    // Nota: los pagos en BS se registran en el cargo, pero en reportes generales o balances por moneda,
    // los listamos por separado. El saldo pendiente en USD de cargos activos:
    const saldoPendienteUSD = cargos.reduce((sum, c) => sum + Math.max(0, c.monto_total - c.monto_pagado), 0);

    return {
      local,
      inquilino,
      cargos,
      pagos,
      totalCargado,
      totalPagadoEnUSD,
      saldoPendienteUSD,
    };
  },

  getMorosos(): (CargoMensual & { nombreLocal: string; nombreInquilino: string })[] {
    // Obtener todos los cargos atrasados
    const cargosAtrasados = this.getCargosMensuales().filter(c => c.estado_morosidad === 'atrasado');

    // Mapear con nombres de local e inquilino activo
    const locales = this.getLocales(false);
    
    return cargosAtrasados.map(cargo => {
      const loc = locales.find(l => l.id === cargo.local_id);
      const inq = this.getInquilinoActivoPorLocal(cargo.local_id);
      return {
        ...cargo,
        nombreLocal: loc ? loc.nombre : 'Local desconocido',
        nombreInquilino: inq ? inq.nombre : 'Sin inquilino',
      };
    });
  },
};

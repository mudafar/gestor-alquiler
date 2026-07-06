import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  type Local,
  type Inquilino,
  type CargoMensual,
  type Pago,
  type Egreso,
  appService
} from '../services/appService';
import { initDatabase, exportDatabase } from '../services/db';
import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '../services/persistence';

interface AppState {
  locales: Local[];
  inquilinos: Inquilino[];
  cargosMensuales: CargoMensual[];
  pagos: Pago[];
  egresos: Egreso[];
  dbInitialized: boolean;
}

interface AppActions {
  initializeDb: (dbBytes?: Uint8Array) => Promise<void>;
  exportDbToFile: () => void;
  clearDb: () => Promise<void>;
  loadAllData: () => void;
  persistDb: () => Promise<void>;

  // Locales
  createLocal: (local: Omit<Local, 'activo'>) => void;
  updateLocal: (local: Local) => void;
  deleteLocal: (id: string) => void;

  // Inquilinos
  createInquilino: (nombre: string, telefono?: string) => void;
  updateInquilino: (id: number, nombre: string, telefono?: string) => void;
  deleteInquilino: (id: number) => void;
  asignarInquilinoExistente: (inquilinoId: number, localId: string) => void;
  asignarInquilinoNuevo: (localId: string, nombre: string, telefono?: string) => void;
  desasignarInquilino: (inquilinoId: number, localId: string) => void;

  // Cargos Mensuales
  generarCargoMensual: (localId: string, anio: number, mes: number) => void;
  generarCargosParaMes: (anio: number, mes: number) => void;

  // Pagos
  registrarPago: (cargoMensualId: number, localId: string, fechaPago: string, monto: number, moneda: 'USD' | 'BS', cuenta: 'juridica' | 'personal') => void;
  eliminarPago: (pagoId: number) => void;

  // Egresos
  createEgreso: (egreso: Omit<Egreso, 'id'>) => void;
  updateEgreso: (egreso: Egreso) => void;
  deleteEgreso: (id: number) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  immer(
    (set, get) => ({
      locales: [],
      inquilinos: [],
      cargosMensuales: [],
      pagos: [],
      egresos: [],
      dbInitialized: false,

      initializeDb: async (dbBytes) => {
        if (dbBytes) {
          // Manual import from file — overwrite IndexedDB
          await initDatabase(dbBytes);
          await saveToIndexedDB();
        } else {
          // Auto-load from IndexedDB or start fresh
          const saved = await loadFromIndexedDB();
          await initDatabase(saved ?? undefined);
        }
        set({ dbInitialized: true });
        get().loadAllData();
      },

      exportDbToFile: () => {
        const bytes = exportDatabase();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alquiler-db-${new Date().toISOString().slice(0, 10)}.db`;
        a.click();
        URL.revokeObjectURL(url);
      },

      clearDb: async () => {
        await clearIndexedDB();
        await get().initializeDb();
      },

      persistDb: async () => {
        await saveToIndexedDB();
      },

      loadAllData: () => {
        set((state) => {
          state.locales = appService.getLocales(true);
          state.inquilinos = appService.getInquilinosActivos();
          state.cargosMensuales = appService.getCargosMensuales();
          state.pagos = appService.getPagos();
          state.egresos = appService.getEgresos();
        });
      },

      // Locales actions
      createLocal: (local) => {
        appService.createLocal(local);
        get().loadAllData();
        get().persistDb();
      },
      updateLocal: (local) => {
        appService.updateLocal(local);
        get().loadAllData();
        get().persistDb();
      },
      deleteLocal: (id) => {
        appService.deleteLocal(id);
        get().loadAllData();
        get().persistDb();
      },

      // Inquilinos actions
      createInquilino: (nombre, telefono) => {
        appService.createInquilino(nombre, telefono);
        get().loadAllData();
        get().persistDb();
      },
      updateInquilino: (id, nombre, telefono) => {
        appService.updateInquilino(id, nombre, telefono);
        get().loadAllData();
        get().persistDb();
      },
      deleteInquilino: (id) => {
        appService.deleteInquilino(id);
        get().loadAllData();
        get().persistDb();
      },
      asignarInquilinoExistente: (inquilinoId, localId) => {
        appService.asignarInquilinoExistente(inquilinoId, localId);
        get().loadAllData();
        get().persistDb();
      },
      asignarInquilinoNuevo: (localId, nombre, telefono) => {
        appService.asignarInquilinoNuevo(localId, nombre, telefono);
        get().loadAllData();
        get().persistDb();
      },
      desasignarInquilino: (inquilinoId, localId) => {
        appService.desasignarInquilino(inquilinoId, localId);
        get().loadAllData();
        get().persistDb();
      },

      // Cargos Mensuales actions
      generarCargoMensual: (localId, anio, mes) => {
        appService.generarCargoMensual(localId, anio, mes);
        get().loadAllData();
        get().persistDb();
      },
      generarCargosParaMes: (anio, mes) => {
        appService.generarCargosParaMes(anio, mes);
        get().loadAllData();
        get().persistDb();
      },

      // Pagos actions
      registrarPago: (cargoMensualId, localId, fechaPago, monto, moneda, cuenta) => {
        appService.registrarPago(cargoMensualId, localId, fechaPago, monto, moneda, cuenta);
        get().loadAllData();
        get().persistDb();
      },
      eliminarPago: (pagoId) => {
        appService.eliminarPago(pagoId);
        get().loadAllData();
        get().persistDb();
      },

      // Egresos actions
      createEgreso: (egreso) => {
        appService.createEgreso(egreso);
        get().loadAllData();
        get().persistDb();
      },
      updateEgreso: (egreso) => {
        appService.updateEgreso(egreso);
        get().loadAllData();
        get().persistDb();
      },
      deleteEgreso: (id) => {
        appService.deleteEgreso(id);
        get().loadAllData();
        get().persistDb();
      },
    })
  )
);

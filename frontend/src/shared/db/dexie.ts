// ============================================
// Ale Motos — Dexie.js Local Database
// ============================================

import Dexie, { Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  uuidLocal: string;
  endpoint: string;
  method: string;
  payload: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'failed' | 'synced';
}

export interface ProductoCache {
  id: string;
  sku: string;
  nombre: string;
  categoriaId: string;
  precioCosto: number;
  precioVenta: number;
  stockActual: number;
  stockReservado: number;
  stockMinimo: number;
  stockDisponible: number;
  modelosCompatibles: string[];
  activo: boolean;
  categoria?: any;
  proveedor?: any;
}

export class AleMotosDB extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>;
  productos!: Table<ProductoCache, string>;

  constructor() {
    super('AleMotosDB');
    this.version(2).stores({
      syncQueue: '++id, uuidLocal, status, createdAt',
      productos: 'id, sku, nombre, categoriaId'
    });
  }
}

export const db = new AleMotosDB();

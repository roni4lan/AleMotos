// ============================================
// Ale Motos — Sync Engine
// ============================================

import { db } from '../db/dexie';

let apiInstance: any = null;

class SyncEngine {
  private isSyncing = false;

  init(api: any) {
    apiInstance = api;
  }

  async enqueueMutation(endpoint: string, method: string, payload: any, uuidLocal: string) {
    if (!apiInstance) throw new Error("SyncEngine no inicializado");
    
    if (navigator.onLine) {
       try {
         // Intento directo si hay red
         const res = await apiInstance.request(endpoint, { method, body: payload });
         return res;
       } catch (err: any) {
         // Si es un error 400 (Bad Request) o 409 (Conflict), no lo encolamos, lo lanzamos.
         if (err.status && err.status >= 400 && err.status < 500 && err.status !== 408) {
           throw err;
         }
         // Si es error de red o timeout, fall through y encolar
         console.warn('Network error, queueing mutation for offline sync:', err);
       }
    }
    
    // Offline o error de red: Encolar
    await db.syncQueue.add({
      uuidLocal,
      endpoint,
      method,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    });
    
    // Notificar UI
    const count = await db.syncQueue.where('status').equals('pending').count();
    window.dispatchEvent(new CustomEvent('sync:queued', { detail: { count } }));
    
    // Retornar una respuesta falsa para que la UI asuma éxito local
    return { success: true, offline: true, uuidLocal };
  }

  async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;
    
    // Validar token antes de intentar sincronizar
    if (!apiInstance.getToken()) return;

    this.isSyncing = true;
    let syncCount = 0;

    try {
      const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
      
      for (const item of pendingItems) {
        try {
          // Intentar enviar al backend
          await apiInstance.request(item.endpoint, { method: item.method, body: item.payload });
          
          // Marcar como sincronizado y eliminar de la cola
          await db.syncQueue.update(item.id!, { status: 'synced' });
          await db.syncQueue.delete(item.id!);
          syncCount++;
          
        } catch (err: any) {
           // Si el error es 409 (Conflicto/Duplicado) por idempotencia, lo marcamos como sincronizado
           if (err.status === 409) {
             await db.syncQueue.update(item.id!, { status: 'synced' });
             await db.syncQueue.delete(item.id!);
             syncCount++;
             continue;
           }

           // Otros errores (ej. 500, o de red intermitente)
           const retryCount = item.retryCount + 1;
           await db.syncQueue.update(item.id!, { 
             retryCount,
             lastError: err.message,
             // Abortar si supera 5 reintentos
             status: retryCount >= 5 ? 'failed' : 'pending'
           });
        }
      }
    } finally {
      this.isSyncing = false;
      const remaining = await db.syncQueue.where('status').equals('pending').count();
      if (syncCount > 0 || remaining === 0) {
        window.dispatchEvent(new CustomEvent('sync:completed', { detail: { remaining, synced: syncCount } }));
      }
    }
  }

  async syncCatalog() {
    if (!apiInstance) return;
    if (!navigator.onLine || !apiInstance.getToken()) return;
    try {
      // Fetch up to 10000 active products for offline cache
      const res = await apiInstance.request('/stock?limit=10000');
      if (res && res.data) {
        await db.productos.bulkPut(res.data);
        console.log(`📦 Catálogo sincronizado offline: ${res.data.length} productos guardados.`);
      }
    } catch (err) {
      console.error('Error sincronizando catálogo offline:', err);
    }
  }

  startListening() {
    // Sincronizar catálogo inicial
    this.syncCatalog();

    // Escuchar cuando vuelve la conexión
    window.addEventListener('online', () => {
      console.log('📡 Back online! Processing sync queue...');
      this.processQueue();
      this.syncCatalog(); // Sincronizar catálogo al volver online
    });

    // Intentar sincronizar periódicamente (cada 30 segundos) si hay items pendientes
    setInterval(async () => {
      if (navigator.onLine) {
        const remaining = await db.syncQueue.where('status').equals('pending').count();
        if (remaining > 0) {
          this.processQueue();
        }
      }
    }, 30000);
    
    // Sincronizar catálogo periódicamente (cada 5 minutos)
    setInterval(() => {
      this.syncCatalog();
    }, 5 * 60 * 1000);
  }
}

export const syncEngine = new SyncEngine();

# Ale Motos — Sistema de Gestión Full-Stack

Sistema de gestión completo para casa de repuestos de motos y taller mecánico. Diseñado para funcionar offline (PWA) con sincronización eventual hacia el backend, permitiendo operar incluso sin conexión a internet.

## Tecnologías Principales

- **Frontend:** React, TypeScript, Vite, React Router, Recharts, Dexie.js (IndexedDB).
- **Backend:** Node.js, Express, TypeScript, Prisma ORM.
- **Base de Datos:** PostgreSQL 16.
- **Infraestructura:** Docker, Docker Compose.

## Características Clave

1. **Arquitectura Offline-First:** Las ventas y las reparaciones generadas en mostrador se pueden guardar sin internet en IndexedDB mediante Dexie.js. Cuando la conexión vuelve, un `SyncEngine` procesa las transacciones pendientes con *backoff exponencial* y las sincroniza contra el backend.
2. **Idempotencia:** Cada transacción crítica genera un `uuidLocal` en el cliente. El backend valida este UUID para asegurar que no se dupliquen ventas o reparaciones si el SyncEngine reintenta un request de red fallido.
3. **Gestión de Stock:**
   - Control de stock mínimo.
   - Cálculo automático de precio de venta usando costo + margen.
   - Reservas de stock en estado `presupuestado` de una reparación.
4. **Flujo de Reparaciones (Máquina de Estados):**
   - Transiciones validadas (`recibido` → `presupuestado` → `aprobado` → `en_proceso` → `listo` → `entregado`).
   - El historial de cambios de estado es inmutable.
   - El precio de los repuestos usados en presupuestos se "congela" al momento de la cotización.
5. **Portal Cliente Público:** Búsqueda por DNI o Patente para que los clientes vean el estado de su moto y el detalle de costos sin necesidad de usuario/contraseña, con limitación de rate-limit.
6. **Dashboard Financiero:** Análisis de ingresos, cantidad de ventas, márgenes, y estado general del stock con gráficos de barras y torta (Recharts).

## Cómo Levantar el Proyecto Localmente

### 1. Variables de Entorno
Clonar el archivo `.env.example` como `.env` en la raíz del proyecto.
```bash
cp .env.example .env
```

### 2. Levantar la Infraestructura
El proyecto utiliza Docker Compose para levantar PostgreSQL, el Backend y el Frontend (Vite) de una sola vez.

```bash
# Levantar los contenedores (esto instalará dependencias, creará la BD y correrá el frontend)
docker compose up --build -d
```

### 3. Migraciones y Seed (Datos de prueba)
Una vez levantada la base de datos, ejecutar Prisma para crear las tablas e insertar los datos iniciales.

```bash
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run db:seed
```

### 4. Accesos

- **Frontend / PWA:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)

#### Credenciales de Demo:
- **Email:** `admin@alemotos.com`
- **Contraseña:** `admin123`

## Estructura del Repositorio

- `/frontend`: SPA en React + Vite. Usa `index.css` con variables CSS para el *dark theme*.
- `/backend`: Servidor Express en Node. Arquitectura modular:
  - `src/modules/*`: Cada módulo tiene su `routes`, `controller` y `service`.
  - `src/middleware`: Auth con JWT, errorHandler unificado, rate limiter.
  - `prisma/schema.prisma`: Definición única de la base de datos PostgreSQL.
- `/docker-compose.yml`: Archivo de orquestación principal con persistencia de volúmenes para PostgreSQL.

## Flujo de Estados de Reparación (Reglas de Negocio)

1. **`recibido`**: Se crea la orden. Aún no se asignan repuestos.
2. **`presupuestado`**: Se agregan repuestos y mano de obra. **Se reserva el stock**. El precio del repuesto queda congelado.
3. **`aprobado`**: El cliente acepta el presupuesto.
4. **`en_proceso`**: El mecánico empieza el trabajo.
5. **`listo`**: Terminado, esperando que el cliente retire.
6. **`entregado`**: El cliente retira y paga. **Se descuenta el stock real y se generan movimientos de salida.** No se permiten más cambios.

---

Desarrollado según especificaciones de negocio para *Ale Motos*.

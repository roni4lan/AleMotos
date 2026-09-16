-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'combinado');

-- CreateEnum
CREATE TYPE "tipo_comprobante" AS ENUM ('remito', 'factura_afip');

-- CreateEnum
CREATE TYPE "estado_sincronizacion" AS ENUM ('local', 'sincronizado');

-- CreateEnum
CREATE TYPE "estado_reparacion" AS ENUM ('recibido', 'presupuestado', 'aprobado', 'en_proceso', 'listo', 'entregado');

-- CreateEnum
CREATE TYPE "tipo_movimiento_stock" AS ENUM ('entrada', 'salida_venta', 'salida_reparacion', 'ajuste');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "permisos" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "margen_sugerido_default" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "precio_costo" DOUBLE PRECISION NOT NULL,
    "margen_porcentaje" DOUBLE PRECISION NOT NULL,
    "precio_venta" DOUBLE PRECISION NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_reservado" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "modelos_compatibles" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER,
    "kilometraje_actual" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metodo_pago" "metodo_pago" NOT NULL,
    "tipo_comprobante" "tipo_comprobante" NOT NULL DEFAULT 'remito',
    "estado_sincronizacion" "estado_sincronizacion" NOT NULL DEFAULT 'sincronizado',
    "uuid_local" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_venta" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario_congelado" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "items_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reparaciones" (
    "id" TEXT NOT NULL,
    "moto_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion_problema" TEXT NOT NULL,
    "estado" "estado_reparacion" NOT NULL DEFAULT 'recibido',
    "total_repuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_mano_obra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uuid_local" TEXT NOT NULL,
    "estado_sincronizacion" "estado_sincronizacion" NOT NULL DEFAULT 'sincronizado',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reparaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repuestos_usados" (
    "id" TEXT NOT NULL,
    "reparacion_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario_congelado" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "repuestos_usados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_historial" (
    "id" TEXT NOT NULL,
    "reparacion_id" TEXT NOT NULL,
    "estado" "estado_reparacion" NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "estado_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "tipo" "tipo_movimiento_stock" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "referencia_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE INDEX "productos_categoria_id_idx" ON "productos"("categoria_id");

-- CreateIndex
CREATE INDEX "productos_proveedor_id_idx" ON "productos"("proveedor_id");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_dni_key" ON "clientes"("dni");

-- CreateIndex
CREATE INDEX "clientes_dni_idx" ON "clientes"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "motos_dominio_key" ON "motos"("dominio");

-- CreateIndex
CREATE INDEX "motos_cliente_id_idx" ON "motos"("cliente_id");

-- CreateIndex
CREATE INDEX "motos_dominio_idx" ON "motos"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_uuid_local_key" ON "ventas"("uuid_local");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_cliente_id_idx" ON "ventas"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "reparaciones_uuid_local_key" ON "reparaciones"("uuid_local");

-- CreateIndex
CREATE INDEX "reparaciones_moto_id_idx" ON "reparaciones"("moto_id");

-- CreateIndex
CREATE INDEX "reparaciones_estado_idx" ON "reparaciones"("estado");

-- CreateIndex
CREATE INDEX "reparaciones_fecha_ingreso_idx" ON "reparaciones"("fecha_ingreso");

-- CreateIndex
CREATE INDEX "estado_historial_reparacion_id_idx" ON "estado_historial"("reparacion_id");

-- CreateIndex
CREATE INDEX "movimientos_stock_producto_id_idx" ON "movimientos_stock"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_stock_fecha_idx" ON "movimientos_stock"("fecha");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motos" ADD CONSTRAINT "motos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones" ADD CONSTRAINT "reparaciones_moto_id_fkey" FOREIGN KEY ("moto_id") REFERENCES "motos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones" ADD CONSTRAINT "reparaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repuestos_usados" ADD CONSTRAINT "repuestos_usados_reparacion_id_fkey" FOREIGN KEY ("reparacion_id") REFERENCES "reparaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repuestos_usados" ADD CONSTRAINT "repuestos_usados_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_reparacion_id_fkey" FOREIGN KEY ("reparacion_id") REFERENCES "reparaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

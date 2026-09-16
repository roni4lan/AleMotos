// ============================================
// Ale Motos — Seed: Datos de ejemplo
// ============================================

import { PrismaClient, MetodoPago, TipoComprobante, EstadoSincronizacion, EstadoReparacion, TipoMovimientoStock } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🏍️  Iniciando seed de Ale Motos...\n');

  // --- ROLES ---
  const rolAdmin = await prisma.rol.create({
    data: {
      nombre: 'admin',
      permisos: {
        stock: ['read', 'write', 'delete'],
        ventas: ['read', 'write', 'delete'],
        reparaciones: ['read', 'write', 'delete'],
        clientes: ['read', 'write', 'delete'],
        proveedores: ['read', 'write', 'delete'],
        finanzas: ['read'],
        usuarios: ['read', 'write', 'delete'],
      },
    },
  });

  const rolVendedor = await prisma.rol.create({
    data: {
      nombre: 'vendedor',
      permisos: {
        stock: ['read'],
        ventas: ['read', 'write'],
        clientes: ['read', 'write'],
        reparaciones: ['read'],
      },
    },
  });

  const rolMecanico = await prisma.rol.create({
    data: {
      nombre: 'mecanico',
      permisos: {
        stock: ['read'],
        reparaciones: ['read', 'write'],
        clientes: ['read'],
      },
    },
  });

  console.log('✅ Roles creados');

  // --- USUARIO ADMIN ---
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@alemotos.com',
      passwordHash,
      nombre: 'Administrador',
      rolId: rolAdmin.id,
      activo: true,
    },
  });

  console.log('✅ Usuario admin creado (admin@alemotos.com / admin123)');

  // --- CATEGORÍAS ---
  const categorias = await Promise.all([
    prisma.categoria.create({ data: { nombre: 'Motor', margenSugeridoDefault: 35 } }),
    prisma.categoria.create({ data: { nombre: 'Frenos', margenSugeridoDefault: 30 } }),
    prisma.categoria.create({ data: { nombre: 'Eléctrico', margenSugeridoDefault: 40 } }),
    prisma.categoria.create({ data: { nombre: 'Transmisión', margenSugeridoDefault: 30 } }),
    prisma.categoria.create({ data: { nombre: 'Carrocería', margenSugeridoDefault: 25 } }),
    prisma.categoria.create({ data: { nombre: 'Aceites y Filtros', margenSugeridoDefault: 20 } }),
    prisma.categoria.create({ data: { nombre: 'Suspensión', margenSugeridoDefault: 30 } }),
    prisma.categoria.create({ data: { nombre: 'Accesorios', margenSugeridoDefault: 45 } }),
  ]);

  console.log('✅ Categorías creadas');

  // --- PROVEEDORES ---
  const proveedores = await Promise.all([
    prisma.proveedor.create({
      data: {
        nombre: 'Distribuidora MotoRepuestos SA',
        contacto: 'Carlos Gómez',
        telefono: '011-4555-1234',
        email: 'ventas@motorepuestos.com',
        direccion: 'Av. Warnes 1234, CABA',
      },
    }),
    prisma.proveedor.create({
      data: {
        nombre: 'Honda Parts Argentina',
        contacto: 'María López',
        telefono: '011-4666-5678',
        email: 'distribuidora@hondaparts.com.ar',
        direccion: 'Ruta 8 km 45, Pilar',
      },
    }),
    prisma.proveedor.create({
      data: {
        nombre: 'Yamaha Repuestos Oficiales',
        contacto: 'Juan Martínez',
        telefono: '011-4777-9012',
        email: 'pedidos@yamaharepuestos.com.ar',
      },
    }),
  ]);

  console.log('✅ Proveedores creados');

  // --- PRODUCTOS ---
  const [catMotor, catFrenos, catElectrico, catTransmision, catCarroceria, catAceites, catSuspension, catAccesorios] = categorias;
  const [provMotoRepuestos, provHonda, provYamaha] = proveedores;

  const productos = await Promise.all([
    // Motor
    prisma.producto.create({
      data: {
        sku: 'MOT-001',
        nombre: 'Kit de Pistón Honda CG 150',
        categoriaId: catMotor.id,
        proveedorId: provHonda.id,
        precioCosto: 15000,
        margenPorcentaje: 35,
        precioVenta: 20250,
        stockActual: 8,
        stockMinimo: 3,
        modelosCompatibles: ['Honda CG 150', 'Honda CG 150 Titan'],
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'MOT-002',
        nombre: 'Junta de Cilindro Yamaha YBR 125',
        categoriaId: catMotor.id,
        proveedorId: provYamaha.id,
        precioCosto: 3500,
        margenPorcentaje: 40,
        precioVenta: 4900,
        stockActual: 15,
        stockMinimo: 5,
        modelosCompatibles: ['Yamaha YBR 125', 'Yamaha XTZ 125'],
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'MOT-003',
        nombre: 'Cadena de Distribución Honda Wave',
        categoriaId: catMotor.id,
        proveedorId: provHonda.id,
        precioCosto: 4200,
        margenPorcentaje: 30,
        precioVenta: 5460,
        stockActual: 2, // ⚠️ Stock bajo
        stockMinimo: 5,
        modelosCompatibles: ['Honda Wave 110', 'Honda Biz 125'],
      },
    }),

    // Frenos
    prisma.producto.create({
      data: {
        sku: 'FRE-001',
        nombre: 'Pastillas de Freno Delantero Universal',
        categoriaId: catFrenos.id,
        proveedorId: provMotoRepuestos.id,
        precioCosto: 2800,
        margenPorcentaje: 30,
        precioVenta: 3640,
        stockActual: 25,
        stockMinimo: 10,
        modelosCompatibles: ['Honda CG 150', 'Yamaha YBR 125', 'Zanella RX 150'],
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'FRE-002',
        nombre: 'Disco de Freno Yamaha FZ',
        categoriaId: catFrenos.id,
        proveedorId: provYamaha.id,
        precioCosto: 12000,
        margenPorcentaje: 25,
        precioVenta: 15000,
        stockActual: 4,
        stockMinimo: 2,
        modelosCompatibles: ['Yamaha FZ 16', 'Yamaha FZ 25'],
      },
    }),

    // Eléctrico
    prisma.producto.create({
      data: {
        sku: 'ELE-001',
        nombre: 'Batería Yuasa 12V 7Ah',
        categoriaId: catElectrico.id,
        proveedorId: provMotoRepuestos.id,
        precioCosto: 18000,
        margenPorcentaje: 25,
        precioVenta: 22500,
        stockActual: 6,
        stockMinimo: 3,
        modelosCompatibles: ['Universal'],
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'ELE-002',
        nombre: 'Regulador de Voltaje Honda',
        categoriaId: catElectrico.id,
        proveedorId: provHonda.id,
        precioCosto: 5500,
        margenPorcentaje: 40,
        precioVenta: 7700,
        stockActual: 0, // ⚠️ Sin stock
        stockMinimo: 2,
        modelosCompatibles: ['Honda CG 150', 'Honda Titan', 'Honda Wave 110'],
      },
    }),

    // Aceites y Filtros
    prisma.producto.create({
      data: {
        sku: 'ACE-001',
        nombre: 'Aceite Motul 10W40 Semisintético 1L',
        categoriaId: catAceites.id,
        proveedorId: provMotoRepuestos.id,
        precioCosto: 6500,
        margenPorcentaje: 20,
        precioVenta: 7800,
        stockActual: 30,
        stockMinimo: 10,
        modelosCompatibles: ['Universal'],
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'ACE-002',
        nombre: 'Filtro de Aceite Honda CG/Titan',
        categoriaId: catAceites.id,
        proveedorId: provHonda.id,
        precioCosto: 1200,
        margenPorcentaje: 35,
        precioVenta: 1620,
        stockActual: 20,
        stockMinimo: 8,
        modelosCompatibles: ['Honda CG 150', 'Honda Titan', 'Honda CBX 250'],
      },
    }),

    // Transmisión
    prisma.producto.create({
      data: {
        sku: 'TRA-001',
        nombre: 'Kit de Transmisión Completo YBR 125',
        categoriaId: catTransmision.id,
        proveedorId: provYamaha.id,
        precioCosto: 22000,
        margenPorcentaje: 30,
        precioVenta: 28600,
        stockActual: 3,
        stockMinimo: 2,
        modelosCompatibles: ['Yamaha YBR 125', 'Yamaha XTZ 125'],
      },
    }),

    // Accesorios
    prisma.producto.create({
      data: {
        sku: 'ACC-001',
        nombre: 'Espejo Retrovisor Universal Par',
        categoriaId: catAccesorios.id,
        proveedorId: provMotoRepuestos.id,
        precioCosto: 3000,
        margenPorcentaje: 50,
        precioVenta: 4500,
        stockActual: 12,
        stockMinimo: 5,
        modelosCompatibles: ['Universal'],
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'ACC-002',
        nombre: 'Puños de Manubrio Gel Antivibración',
        categoriaId: catAccesorios.id,
        proveedorId: provMotoRepuestos.id,
        precioCosto: 2500,
        margenPorcentaje: 45,
        precioVenta: 3625,
        stockActual: 1, // ⚠️ Stock bajo
        stockMinimo: 4,
        modelosCompatibles: ['Universal'],
      },
    }),
  ]);

  console.log('✅ Productos creados (12 productos, algunos con stock bajo para probar alertas)');

  // --- CLIENTES ---
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        dni: '30555111',
        nombre: 'Martín Rodríguez',
        telefono: '011-1555-1234',
        email: 'martin.rodriguez@gmail.com',
        direccion: 'Av. Rivadavia 4500, CABA',
      },
    }),
    prisma.cliente.create({
      data: {
        dni: '28777222',
        nombre: 'Laura Fernández',
        telefono: '011-1566-5678',
        email: 'laura.f@hotmail.com',
        direccion: 'Calle San Martín 230, Morón',
      },
    }),
    prisma.cliente.create({
      data: {
        dni: '35888333',
        nombre: 'Diego Sánchez',
        telefono: '011-1577-9012',
      },
    }),
  ]);

  console.log('✅ Clientes creados');

  // --- MOTOS ---
  const motos = await Promise.all([
    prisma.moto.create({
      data: {
        clienteId: clientes[0].id,
        dominio: 'AB123CD',
        marca: 'Honda',
        modelo: 'CG 150 Titan',
        anio: 2020,
        kilometrajeActual: 35000,
      },
    }),
    prisma.moto.create({
      data: {
        clienteId: clientes[0].id,
        dominio: 'AC456EF',
        marca: 'Yamaha',
        modelo: 'YBR 125',
        anio: 2022,
        kilometrajeActual: 12000,
      },
    }),
    prisma.moto.create({
      data: {
        clienteId: clientes[1].id,
        dominio: 'AD789GH',
        marca: 'Honda',
        modelo: 'Wave 110',
        anio: 2021,
        kilometrajeActual: 28000,
      },
    }),
    prisma.moto.create({
      data: {
        clienteId: clientes[2].id,
        dominio: 'AE012IJ',
        marca: 'Yamaha',
        modelo: 'FZ 16',
        anio: 2019,
        kilometrajeActual: 45000,
      },
    }),
  ]);

  console.log('✅ Motos creadas');

  // --- VENTA DE EJEMPLO ---
  const ventaUuid = uuidv4();
  const venta = await prisma.venta.create({
    data: {
      clienteId: clientes[0].id,
      usuarioId: admin.id,
      total: 11440,
      descuento: 0,
      metodoPago: 'efectivo',
      tipoComprobante: 'remito',
      estadoSincronizacion: 'sincronizado',
      uuidLocal: ventaUuid,
      items: {
        create: [
          {
            productoId: productos[7].id, // Aceite Motul
            cantidad: 1,
            precioUnitarioCongelado: 7800,
          },
          {
            productoId: productos[3].id, // Pastillas de freno
            cantidad: 1,
            precioUnitarioCongelado: 3640,
          },
        ],
      },
    },
  });

  // Movimientos de stock de la venta
  await prisma.movimientoStock.createMany({
    data: [
      {
        productoId: productos[7].id,
        tipo: 'salida_venta',
        cantidad: -1,
        motivo: 'Venta de mostrador',
        referenciaId: venta.id,
        usuarioId: admin.id,
      },
      {
        productoId: productos[3].id,
        tipo: 'salida_venta',
        cantidad: -1,
        motivo: 'Venta de mostrador',
        referenciaId: venta.id,
        usuarioId: admin.id,
      },
    ],
  });

  console.log('✅ Venta de ejemplo creada');

  // --- REPARACIÓN DE EJEMPLO ---
  const reparacionUuid = uuidv4();
  const reparacion = await prisma.reparacion.create({
    data: {
      motoId: motos[0].id,
      usuarioId: admin.id,
      descripcionProblema: 'Pérdida de potencia y ruido en el motor. El cliente reporta que vibra más de lo normal a partir de 60 km/h.',
      estado: 'en_proceso',
      totalRepuestos: 4900,
      totalManoObra: 8000,
      uuidLocal: reparacionUuid,
      estadoSincronizacion: 'sincronizado',
      repuestosUsados: {
        create: [
          {
            productoId: productos[1].id, // Junta de cilindro
            cantidad: 1,
            precioUnitarioCongelado: 4900,
          },
        ],
      },
      estadoHistorial: {
        create: [
          { estado: 'recibido', usuarioId: admin.id, fechaHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { estado: 'presupuestado', usuarioId: admin.id, fechaHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { estado: 'aprobado', usuarioId: admin.id, fechaHora: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) },
          { estado: 'en_proceso', usuarioId: admin.id, fechaHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ],
      },
    },
  });

  console.log('✅ Reparación de ejemplo creada (en_proceso)');

  // --- ENTRADA DE STOCK (compra a proveedor) ---
  await prisma.movimientoStock.create({
    data: {
      productoId: productos[0].id,
      tipo: 'entrada',
      cantidad: 5,
      motivo: 'Compra a Honda Parts Argentina - Factura A 0001-00005432',
      usuarioId: admin.id,
    },
  });

  console.log('✅ Movimiento de stock de ejemplo creado');

  console.log('\n🏍️  Seed completado exitosamente!');
  console.log('📧 Login: admin@alemotos.com / admin123\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

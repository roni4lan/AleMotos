// ============================================
// Ale Motos — Finanzas Service
// ============================================

import { prisma } from '../../utils/prisma';

export class FinanzasService {
  async obtenerResumen(fechaDesde?: Date, fechaHasta?: Date) {
    const desde = fechaDesde || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hasta = fechaHasta || new Date();

    // 1. Ingresos y Cantidades Mostrador
    const ventasMostrador = await prisma.venta.aggregate({
      where: { fecha: { gte: desde, lte: hasta } },
      _sum: { total: true },
      _count: true,
    });
    const totalIngresosMostrador = ventasMostrador._sum.total || 0;

    // 2. Ingresos y Cantidades Taller
    const reparacionesEntregadas = await prisma.reparacion.aggregate({
      where: {
        estado: 'entregado',
        updatedAt: { gte: desde, lte: hasta },
      },
      _sum: { totalRepuestos: true, totalManoObra: true },
      _count: true,
    });
    const totalIngresosRepuestos = reparacionesEntregadas._sum.totalRepuestos || 0;
    const totalIngresosManoObra = reparacionesEntregadas._sum.totalManoObra || 0;
    const totalIngresosTaller = totalIngresosRepuestos + totalIngresosManoObra;
    const totalIngresos = totalIngresosMostrador + totalIngresosTaller;

    // 3. Ticket Promedio
    const ticketPromedioMostrador = ventasMostrador._count > 0 ? totalIngresosMostrador / ventasMostrador._count : 0;
    const ticketPromedioTaller = reparacionesEntregadas._count > 0 ? totalIngresosTaller / reparacionesEntregadas._count : 0;

    // 4. Costos de Ventas (COGS)
    const itemsVendidos = await prisma.itemVenta.findMany({
      where: { venta: { fecha: { gte: desde, lte: hasta } } },
      include: { producto: true }
    });
    const cogsMostrador = itemsVendidos.reduce((sum, item) => sum + (item.cantidad * item.producto.precioCosto), 0);

    const repuestosUsados = await prisma.repuestoUsado.findMany({
      where: { reparacion: { estado: 'entregado', updatedAt: { gte: desde, lte: hasta } } },
      include: { producto: true }
    });
    const cogsReparaciones = repuestosUsados.reduce((sum, item) => sum + (item.cantidad * item.producto.precioCosto), 0);
    const totalCogs = cogsMostrador + cogsReparaciones;
    const margenBruto = totalIngresos - totalCogs;

    // 5. Gastos Fijos (Prorrateados)
    const gastosFijos = await prisma.gastoFijo.findMany();
    const totalGastosFijosMes = gastosFijos.reduce((sum, g) => sum + (g.frecuencia === 'anual' ? g.monto / 12 : g.monto), 0);
    const diffTime = Math.abs(hasta.getTime() - desde.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const proporcionMes = diffDays / 30.44; 
    const gastosFijosPeriodo = totalGastosFijosMes * proporcionMes;

    // 6. Ganancia Neta Real
    const gananciaNetaReal = margenBruto - gastosFijosPeriodo;

    // 7. Punto de equilibrio (Mensual)
    // Ingresos Necesarios = Gastos Fijos / Margen Bruto %
    const margenPorcentaje = totalIngresos > 0 ? (margenBruto / totalIngresos) : 0;
    const puntoEquilibrioMes = margenPorcentaje > 0 ? totalGastosFijosMes / margenPorcentaje : 0;

    // 8. Tasa de Conversión de Presupuestos
    const presupuestados = await prisma.estadoHistorial.count({
      where: { estado: 'presupuestado', fechaHora: { gte: desde, lte: hasta } }
    });
    const aprobados = await prisma.estadoHistorial.count({
      where: { estado: 'aprobado', fechaHora: { gte: desde, lte: hasta } }
    });
    const tasaConversion = presupuestados > 0 ? (aprobados / presupuestados) * 100 : (aprobados > 0 ? 100 : 0);

    return {
      periodo: { desde, hasta },
      ingresos: {
        mostrador: totalIngresosMostrador,
        tallerRepuestos: totalIngresosRepuestos,
        tallerManoObra: totalIngresosManoObra,
        taller: totalIngresosTaller,
        total: totalIngresos,
      },
      costos: {
        cogsMostrador,
        cogsReparaciones,
        totalCogs,
        gastosFijos: gastosFijosPeriodo,
        gastosFijosMensuales: totalGastosFijosMes
      },
      gananciaNetaReal,
      margenBruto,
      margenPorcentaje,
      puntoEquilibrioMes,
      ticketPromedio: {
        mostrador: ticketPromedioMostrador,
        taller: ticketPromedioTaller
      },
      tasaConversion,
      cantidades: {
        ventas: ventasMostrador._count,
        reparaciones: reparacionesEntregadas._count,
        presupuestos: presupuestados,
        aprobados
      },
    };
  }

  async ventasPorPeriodo(periodo: 'dia' | 'semana' | 'mes', cantidad: number = 12, offsetDias: number = 0) {
    const ahora = new Date();
    if (offsetDias) ahora.setDate(ahora.getDate() - offsetDias);
    const datos = [];

    for (let i = cantidad - 1; i >= 0; i--) {
      let desde: Date;
      let hasta: Date;
      let label: string;

      if (periodo === 'dia') {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i);
        hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i + 1);
        label = desde.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      } else if (periodo === 'semana') {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i * 7);
        hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - (i - 1) * 7);
        label = `Sem ${cantidad - i}`;
      } else {
        desde = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        hasta = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
        label = desde.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      }

      const ventas = await prisma.venta.aggregate({
        where: { fecha: { gte: desde, lt: hasta } },
        _sum: { total: true },
      });

      const reparaciones = await prisma.reparacion.aggregate({
        where: { estado: 'entregado', updatedAt: { gte: desde, lt: hasta } },
        _sum: { totalRepuestos: true, totalManoObra: true }
      });

      const repuestosVentas = await prisma.itemVenta.findMany({
        where: { venta: { fecha: { gte: desde, lt: hasta } } },
        include: { producto: true }
      });
      const repuestosReparaciones = await prisma.repuestoUsado.findMany({
        where: { reparacion: { estado: 'entregado', updatedAt: { gte: desde, lt: hasta } } },
        include: { producto: true }
      });

      const cogs = repuestosVentas.reduce((sum, item) => sum + (item.cantidad * item.producto.precioCosto), 0) +
                   repuestosReparaciones.reduce((sum, item) => sum + (item.cantidad * item.producto.precioCosto), 0);

      const totalMostrador = ventas._sum.total || 0;
      const totalTaller = (reparaciones._sum.totalRepuestos || 0) + (reparaciones._sum.totalManoObra || 0);
      
      datos.push({
        label,
        mostrador: totalMostrador,
        taller: totalTaller,
        total: totalMostrador + totalTaller,
        ganancia: (totalMostrador + totalTaller) - cogs
      });
    }

    return datos;
  }

  async rotacionInventario() {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 1);
    
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, sku: true, stockActual: true }
    });

    const itemsVenta = await prisma.itemVenta.groupBy({
      by: ['productoId'],
      where: { venta: { fecha: { gte: desde } } },
      _sum: { cantidad: true }
    });

    const repuestosUsados = await prisma.repuestoUsado.groupBy({
      by: ['productoId'],
      where: { reparacion: { estado: 'entregado', updatedAt: { gte: desde } } },
      _sum: { cantidad: true }
    });

    const salesMap = new Map<string, number>();
    for (const item of itemsVenta) {
      salesMap.set(item.productoId, item._sum.cantidad || 0);
    }
    for (const rep of repuestosUsados) {
      const prev = salesMap.get(rep.productoId) || 0;
      salesMap.set(rep.productoId, prev + (rep._sum.cantidad || 0));
    }

    const rotacion = productos.map(p => {
      const vendidas = salesMap.get(p.id) || 0;
      const ratio = p.stockActual > 0 ? (vendidas / p.stockActual) : (vendidas > 0 ? vendidas : 0);
      return {
        producto: p,
        vendidasUltimoMes: vendidas,
        stockActual: p.stockActual,
        ratioRotacion: ratio
      };
    });

    return rotacion.sort((a, b) => a.ratioRotacion - b.ratioRotacion).slice(0, 50);
  }

  async presupuestosPendientes() {
    const reparaciones = await prisma.reparacion.findMany({
      where: { estado: { in: ['aprobado', 'en_proceso', 'listo'] } },
      include: { moto: { include: { cliente: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    return reparaciones.map(r => ({
      id: r.id,
      cliente: r.moto?.cliente?.nombre || 'Consumidor',
      vehiculo: `${r.moto?.marca} ${r.moto?.modelo} (${r.moto?.dominio})`,
      estado: r.estado,
      fechaActualizacion: r.updatedAt,
      montoAproximado: r.totalRepuestos + r.totalManoObra
    }));
  }

  // CRUD Gastos Fijos
  async obtenerGastosFijos() {
    return await prisma.gastoFijo.findMany({ orderBy: { fechaRegistro: 'desc' } });
  }

  async crearGastoFijo(data: { nombre: string; monto: number; frecuencia: string }) {
    return await prisma.gastoFijo.create({ data });
  }

  async eliminarGastoFijo(id: string) {
    return await prisma.gastoFijo.delete({ where: { id } });
  }

  async repuestosMasVendidos(limit: number = 10) {
    const items = await prisma.itemVenta.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: limit,
    });

    const productIds = items.map(i => i.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nombre: true, sku: true },
    });

    const productoMap = new Map(productos.map(p => [p.id, p]));

    return items.map(item => ({
      producto: productoMap.get(item.productoId),
      cantidadVendida: item._sum.cantidad || 0,
    }));
  }

  async estadoStock() {
    const [total, critico, bajo, ok, valorInventarioResult] = await Promise.all([
      prisma.producto.count({ where: { activo: true } }),
      prisma.producto.count({
        where: { activo: true, stockActual: 0 },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM productos
        WHERE activo = true AND stock_actual > 0 AND stock_actual <= stock_minimo
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM productos
        WHERE activo = true AND stock_actual > stock_minimo
      `,
      prisma.$queryRaw<[{ total_valor: number }]>`
        SELECT COALESCE(SUM(precio_costo * stock_actual), 0) as total_valor 
        FROM productos 
        WHERE activo = true AND stock_actual > 0
      `
    ]);

    return {
      total,
      sinStock: critico,
      stockBajo: Number(bajo[0].count),
      stockOk: Number(ok[0].count),
      valorInventario: Number(valorInventarioResult[0].total_valor),
    };
  }

  async obtenerAlertasImpactoReposicion(dias: number = 90) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const resultados = await prisma.$queryRaw<any[]>`
      WITH DemandCalculada AS (
        SELECT 
          p.id, 
          p.sku, 
          p.nombre, 
          p.stock_actual as "stockActual", 
          p.stock_minimo as "stockMinimo",
          p.precio_venta as "precioVenta",
          (
            COALESCE((
              SELECT SUM(iv.cantidad) 
              FROM items_venta iv 
              JOIN ventas v ON iv.venta_id = v.id 
              WHERE iv.producto_id = p.id AND v.fecha >= ${fechaLimite}
            ), 0)
            +
            COALESCE((
              SELECT SUM(ru.cantidad) 
              FROM repuestos_usados ru 
              JOIN reparaciones r ON ru.reparacion_id = r.id 
              WHERE ru.producto_id = p.id AND r.fecha_ingreso >= ${fechaLimite}
            ), 0)
          )::integer as "unidadesVendidasPeriodo"
        FROM productos p
        WHERE p.activo = true 
          AND p.stock_actual <= p.stock_minimo
      )
      SELECT 
        id, sku, nombre, "stockActual", "stockMinimo", "precioVenta", "unidadesVendidasPeriodo",
        ("unidadesVendidasPeriodo" * "precioVenta") as "impactoEstimado",
        CASE WHEN "stockActual" = 0 THEN 'critico' ELSE 'bajo' END as "nivelAlerta"
      FROM DemandCalculada
      WHERE "unidadesVendidasPeriodo" > 0
      ORDER BY "impactoEstimado" DESC
      LIMIT 50;
    `;

    return resultados.map(r => ({
      ...r,
      impactoEstimado: Number(r.impactoEstimado)
    }));
  }
}

export const finanzasService = new FinanzasService();

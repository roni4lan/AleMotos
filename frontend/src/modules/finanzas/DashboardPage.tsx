import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api';
import { StatCard } from '@/components/stat-card';
import { BarChart } from '@/components/bar-chart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime, num } from '@/lib/format';
import {
  DollarSign,
  Boxes,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertasReposicionCard } from './components/AlertasReposicionCard';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function DashboardPage() {
  const [resumenHoy, setResumenHoy] = useState<any>(null);
  const [resumenMes, setResumenMes] = useState<any>(null);
  const [ventasPeriodo, setVentasPeriodo] = useState<any[]>([]);
  const [estadoStock, setEstadoStock] = useState<any>(null);
  const [repuestosTop, setRepuestosTop] = useState<any[]>([]);
  const [ventasRecientes, setVentasRecientes] = useState<any[]>([]);
  const [reparacionesActivas, setReparacionesActivas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const ahora = new Date();
    const startOfHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
    const endOfHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999).toISOString();

    Promise.all([
      api.getResumenFinanciero({ fechaDesde: startOfHoy, fechaHasta: endOfHoy }).catch(() => null),
      api.getResumenFinanciero().catch(() => null),
      api.getEstadoStock().catch(() => null),
      api.getRepuestosTop(5).catch(() => []),
      api.getVentas({ limit: 5 }).catch(() => []),
      api.getReparaciones().catch(() => []),
    ]).then(([resHoy, resMes, stock, top, ultVentas, repList]) => {
      setResumenHoy(resHoy);
      setResumenMes(resMes);
      setEstadoStock(stock);
      setRepuestosTop(top || []);
      setVentasRecientes(Array.isArray(ultVentas) ? ultVentas.slice(0, 5) : []);
      const repArray = Array.isArray(repList) ? repList : (repList?.data || []);
      setReparacionesActivas(repArray.filter((r: any) => r.estado !== 'Entregada' && r.estado !== 'entregado').slice(0, 5));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setChartLoading(true);
    setVentasPeriodo([]);

    // Genera las 7 fechas exactas del rango seleccionado
    const today = new Date();
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - weekOffset * 7 - i);
      days.push(d);
    }

    // Busca el total de ventas+taller para cada día en paralelo
    Promise.all(
      days.map(day => {
        const desde = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
        const hasta = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).toISOString();
        return api.getResumenFinanciero({ fechaDesde: desde, fechaHasta: hasta })
          .then(res => ({ day, total: res?.ingresos?.total || 0 }))
          .catch(() => ({ day, total: 0 }));
      })
    ).then(results => {
      const data = results.map(({ day, total }) => ({
        label: `${day.getDate()}/${day.getMonth() + 1}`,
        value: total,
      }));
      setVentasPeriodo(data);
      setChartLoading(false);
    });
  }, [weekOffset]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="loading-spinner" />
        <span className="text-sm font-medium text-muted-foreground">Cargando dashboard...</span>
      </div>
    );
  }

  // chartData ya viene formateado directamente desde el useEffect
  const chartData = ventasPeriodo.map((d: any) => ({
    label: d.label,
    value: num(d.value || 0),
  }));


  // Rango de fechas visible en el gráfico
  const getDateRange = () => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - weekOffset * 7);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  };
  const dateRange = getDateRange();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Buen día, Administrador
        </h2>
        <p className="text-sm text-muted-foreground">Resumen general de Ale Motos</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={resumenHoy ? formatCurrency(resumenHoy.ingresos?.total || 0) : '$ 0,00'}
          hint={`${resumenHoy?.cantidades?.ventas || 0} operaciones`}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Ventas del mes"
          value={resumenMes ? formatCurrency(resumenMes.ingresos?.total || 0) : '$ 0,00'}
          hint={`${resumenMes?.cantidades?.ventas || 0} operaciones`}
          icon={TrendingUp}
        />
        <StatCard
          label="Valor de inventario"
          value={estadoStock ? formatCurrency(estadoStock.valorInventario || 0) : '$ 0,00'}
          hint={`${(estadoStock?.stockOk || 0) + (estadoStock?.stockBajo || 0)} productos en catálogo`}
          icon={Boxes}
        />
        <StatCard
          label="Reparaciones activas"
          value={String(reparacionesActivas.length)}
          hint={`${reparacionesActivas.filter((r: any) => r.estado === 'listo').length} listas para entregar`}
          icon={Wrench}
          tone="warning"
        />
      </div>

      {/* Charts & Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Ventas {weekOffset === 0 ? 'últimos 7 días' : 'semanas anteriores'}</CardTitle>
              <CardDescription>Facturación diaria</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-semibold text-muted-foreground px-2 py-1 rounded bg-muted min-w-[120px] text-center">
                {dateRange}
              </span>
              <button 
                onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                disabled={weekOffset === 0}
                className={`p-1.5 rounded-md transition-colors ${weekOffset === 0 ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                title="Semana siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {chartLoading ? (
              <div className="flex h-56 items-center justify-center gap-3 text-muted-foreground">
                <div className="loading-spinner" />
                <span className="text-sm">Cargando datos...</span>
              </div>
            ) : (
              <BarChart key={weekOffset} data={chartData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>Por unidades</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {repuestosTop.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ventas registradas.</p>
            ) : (
              repuestosTop.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.producto?.nombre || item.nombre || 'Producto'}</span>
                  <Badge variant="neutral">{num(item.cantidadVendida || item.qty || 1)} u.</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts, Recent Sales, Repair Workshop */}
      <div className="grid grid-cols-1 gap-6">
        <AlertasReposicionCard />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Alertas de stock</CardTitle>
              <CardDescription>Requieren reposición</CardDescription>
            </div>
            <Link to="/stock" className="text-sm font-semibold text-primary hover:underline">
              Ver stock
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3">
              <AlertTriangle className="size-5 text-destructive" />
              <div>
                <p className="font-mono text-lg font-bold text-destructive">
                  {num(estadoStock?.sinStock || 0)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">Sin stock</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-warning/15 p-3">
              <Package className="size-5 text-warning-foreground" />
              <div>
                <p className="font-mono text-lg font-bold text-warning-foreground">
                  {num(estadoStock?.stockBajo || 0)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">Stock bajo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Últimas ventas</CardTitle>
              <CardDescription>Actividad reciente</CardDescription>
            </div>
            <Link to="/ventas" className="text-sm font-semibold text-primary hover:underline">
              Ver POS
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {ventasRecientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ventas todavía.</p>
            ) : (
              ventasRecientes.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {s.cliente?.nombre || 'Mostrador'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {formatCurrency(s.total)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Taller</CardTitle>
              <CardDescription>Reparaciones en curso</CardDescription>
            </div>
            <Link
              to="/reparaciones"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ver taller
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {reparacionesActivas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin reparaciones activas.</p>
            ) : (
              reparacionesActivas.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {r.moto ? `${r.moto.marca} ${r.moto.modelo}` : 'Moto'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.moto?.cliente?.nombre || 'Sin cliente'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.estado === 'listo'
                        ? 'success'
                        : r.estado === 'en_proceso'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {r.estado.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

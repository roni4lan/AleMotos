import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api';
import { StatCard } from '@/components/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Percent,
  Plus,
  Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export function FinanzasPage() {
  const [resumen, setResumen] = useState<any>(null);
  const [ventasPeriodo, setVentasPeriodo] = useState<any[]>([]);
  const [rotacion, setRotacion] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [gastosFijos, setGastosFijos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Formulario Gasto Fijo
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: '', monto: '', frecuencia: 'mensual' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, ventas, rot, presups, gastos] = await Promise.all([
        api.getResumenFinanciero(),
        api.getVentasPorPeriodo('mes', 6), // Ultimos 6 meses
        api.getRotacionInventario(),
        api.getPresupuestosPendientes(),
        api.getGastosFijos()
      ]);
      setResumen(res);
      setVentasPeriodo(ventas || []);
      setRotacion(rot || []);
      setPresupuestos(presups || []);
      setGastosFijos(gastos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGasto.nombre || !nuevoGasto.monto) return;
    try {
      await api.createGastoFijo({
        nombre: nuevoGasto.nombre,
        monto: parseFloat(nuevoGasto.monto),
        frecuencia: nuevoGasto.frecuencia
      });
      setNuevoGasto({ nombre: '', monto: '', frecuencia: 'mensual' });
      loadData(); // Recargar todo para actualizar punto de equilibrio
    } catch (error) {
      console.error(error);
    }
  };

  const handleEliminarGasto = async (id: string) => {
    if (!window.confirm('¿Seguro que querés eliminar este gasto fijo?')) return;
    try {
      await api.deleteGastoFijo(id);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="loading-spinner" />
        <span className="text-sm font-medium text-muted-foreground">Cargando datos financieros...</span>
      </div>
    );
  }

  const gananciaNetaReal = resumen?.gananciaNetaReal || 0;
  const gananciaNetaColor = gananciaNetaReal < 0 ? 'text-red-500' : 'text-green-500';

  const tasaConversion = resumen?.tasaConversion || 0;
  const tasaConversionColor = tasaConversion < 50 ? 'text-red-500' : 'text-green-500';

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            📈 Panel Financiero
          </h2>
          <p className="text-sm text-muted-foreground">Métricas, rentabilidad y toma de decisiones</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          Exportar PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos Totales (Mes)"
          value={formatCurrency(resumen?.ingresos?.total || 0)}
          hint={`Mostrador: ${formatCurrency(resumen?.ingresos?.mostrador || 0)} | Taller: ${formatCurrency(resumen?.ingresos?.taller || 0)}`}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Ganancia Neta Real"
          value={<span className={gananciaNetaColor}>{formatCurrency(gananciaNetaReal)}</span> as any}
          hint={`Ingresos - Costos Variables - Gastos Fijos`}
          icon={gananciaNetaReal >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Ticket Promedio"
          value={formatCurrency(resumen?.ticketPromedio?.mostrador || 0)}
          hint={`Taller prom: ${formatCurrency(resumen?.ticketPromedio?.taller || 0)}`}
          icon={PieChart}
        />
        <StatCard
          label="Tasa de Conversión (Taller)"
          value={<span className={tasaConversionColor}>{tasaConversion.toFixed(1)}%</span> as any}
          hint={`${resumen?.cantidades?.aprobados} aprobados de ${resumen?.cantidades?.presupuestos} presupuestados`}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Barras: Repuestos vs Reparaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos: Mostrador vs Taller (Últ. 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPeriodo}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="mostrador" name="Mostrador" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="taller" name="Taller" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Línea: Ganancia Neta Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ganancia Neta Bruta</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasPeriodo}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Line type="monotone" dataKey="ganancia" name="Ganancia Bruta" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos Fijos & Punto de Equilibrio */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Fijos & Punto de Equilibrio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="text-sm font-semibold text-orange-800 uppercase tracking-wide mb-1">Punto de Equilibrio (Mes)</div>
              <div className="text-2xl font-bold text-orange-900 mb-2">{formatCurrency(resumen?.puntoEquilibrioMes || 0)}</div>
              <p className="text-xs text-orange-700">Ingresos necesarios este mes para cubrir costos variables y gastos fijos, asumiendo un margen bruto del {((resumen?.margenPorcentaje || 0)*100).toFixed(1)}%.</p>
            </div>

            <form onSubmit={handleCrearGasto} className="grid grid-cols-[1fr_100px_100px_auto] sm:grid-cols-[1fr_120px_120px_auto] gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Ej. Alquiler" 
                className="input w-full min-w-0" 
                value={nuevoGasto.nombre}
                onChange={e => setNuevoGasto({...nuevoGasto, nombre: e.target.value})}
                required 
              />
              <input 
                type="number" 
                placeholder="Monto" 
                className="input w-full min-w-0" 
                value={nuevoGasto.monto}
                onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                required 
              />
              <select 
                className="input w-full min-w-0"
                value={nuevoGasto.frecuencia}
                onChange={e => setNuevoGasto({...nuevoGasto, frecuencia: e.target.value})}
              >
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
              <button type="submit" className="btn btn-primary px-3 flex justify-center items-center"><Plus size={18} /></button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {gastosFijos.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No hay gastos fijos registrados.</div>
              ) : (
                gastosFijos.map((g: any) => (
                  <div key={g.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg border border-border">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{g.nombre}</div>
                      <div className="text-xs text-muted-foreground capitalize">{g.frecuencia}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-sm">{formatCurrency(g.monto)}</div>
                      <button 
                        onClick={() => handleEliminarGasto(g.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productos Baja Rotacion */}
        <Card>
          <CardHeader>
            <CardTitle>Alerta: Capital Inmovilizado (Baja Rotación)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto pr-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 font-medium text-muted-foreground">Producto</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Stock Actual</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Vendido Últ. Mes</th>
                  </tr>
                </thead>
                <tbody>
                  {rotacion.filter(r => r.ratioRotacion < 0.2 && r.stockActual > 0).length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">No hay productos de muy baja rotación.</td></tr>
                  ) : (
                    rotacion.filter(r => r.ratioRotacion < 0.2 && r.stockActual > 0).map((r, idx) => (
                      <tr key={idx} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <div className="font-medium text-foreground">{r.producto.nombre}</div>
                          <div className="text-xs text-muted-foreground">{r.producto.sku}</div>
                        </td>
                        <td className="py-3 text-right font-mono">{r.stockActual}</td>
                        <td className="py-3 text-right font-mono text-red-500">{r.vendidasUltimoMes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presupuestos Pendientes (Cuentas por cobrar proxy) */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuestos Aprobados & Pendientes de Entrega (Ingreso Proyectado)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left pb-2 font-medium text-muted-foreground">Vehículo</th>
                  <th className="text-left pb-2 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Monto Proyectado</th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No hay presupuestos pendientes.</td></tr>
                ) : (
                  presupuestos.map((p, idx) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                      <td className="py-3 font-medium text-foreground">{p.cliente}</td>
                      <td className="py-3 text-muted-foreground">{p.vehiculo}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 uppercase">
                          {p.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-green-600">
                        {formatCurrency(p.montoAproximado)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

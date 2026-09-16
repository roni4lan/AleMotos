import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { api } from '../../../shared/api';

interface AlertaReposicion {
  id: string;
  sku: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  precioVenta: number;
  unidadesVendidasPeriodo: number;
  impactoEstimado: number;
  nivelAlerta: 'critico' | 'bajo';
}

export function AlertasReposicionCard() {
  const [alertas, setAlertas] = useState<AlertaReposicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    try {
      const data = await api.obtenerAlertasReposicionImpacto(90);
      setAlertas(data || []);
    } catch (error) {
      console.error('Error cargando alertas de reposición:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  const displayAlertas = verTodos ? alertas : alertas.slice(0, 5);

  return (
    <div className="card" style={{ gridColumn: 'span 12' }}>
      <div className="card-header flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 className="card-title flex items-center gap-2">
            <TrendingDown className="text-red-500 w-5 h-5" /> 
            Reposición Prioritaria (Impacto en Ventas)
          </h3>
          <p className="card-description">Basado en demanda de los últimos 90 días</p>
        </div>
        {alertas.length > 5 && (
          <button 
            className="text-primary text-sm font-medium hover:underline"
            onClick={() => setVerTodos(!verTodos)}
          >
            {verTodos ? 'Ver menos' : 'Ver todos'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-4 text-center text-secondary">Cargando alertas...</div>
      ) : alertas.length === 0 ? (
        <div className="p-4 text-center text-secondary">No hay productos prioritarios para reponer.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/40 shadow-sm transition-all duration-200 mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: '600px' }}>
              <thead className="bg-[#f9fafb]">
                <tr className="border-b border-[#e5e7eb]">
                  <th className="py-3 px-4 font-semibold text-secondary">Producto</th>
                  <th className="py-3 px-4 font-semibold text-secondary text-right">Demanda (90d)</th>
                  <th className="py-3 px-4 font-semibold text-secondary text-right">Stock</th>
                  <th className="py-3 px-4 font-semibold text-secondary text-right">Impacto Estimado</th>
                </tr>
              </thead>
              <tbody>
                {displayAlertas.map(alerta => (
                  <tr key={alerta.id} className="border-b border-border/20 last:border-0 hover:bg-[#fafafa] transition-colors duration-200">
                    <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{alerta.nombre}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{alerta.sku}</div>
                  </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-foreground font-medium">{alerta.unidadesVendidasPeriodo} u.</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          let badgeColor = 'bg-orange-500/10 text-orange-600 border-orange-500/20';
                          if (alerta.stockActual === 0) badgeColor = 'bg-red-500/10 text-red-600 border-red-500/20';
                          else if (alerta.stockActual >= alerta.stockMinimo) badgeColor = 'bg-green-500/10 text-green-600 border-green-500/20';
                          
                          return (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badgeColor}`}>
                              {alerta.stockActual} / {alerta.stockMinimo}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                    <div className={`font-bold flex items-center justify-end gap-1.5 ${
                      alerta.impactoEstimado > 50000 ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      {alerta.impactoEstimado > 50000 && <AlertTriangle className="w-4 h-4" />}
                      {formatCurrency(alerta.impactoEstimado)}
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

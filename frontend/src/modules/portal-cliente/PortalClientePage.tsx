// ============================================
// Ale Motos — Portal Cliente Page (Público)
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../../shared/api';
import { BUSINESS_NAME, estadoReparacion } from '../../theme';
import logo from '../../assets/logo.png';
import { Search, Wrench, ChevronDown } from 'lucide-react';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

const getEstadoConfig = (estado: string) =>
  estadoReparacion[estado as keyof typeof estadoReparacion] || { label: estado, color: '#666', icon: '❓' };

export function PortalClientePage() {
  const [criterio, setCriterio] = useState<'dni' | 'dominio'>('dominio');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');
  const [motoPage, setMotoPage] = useState(0);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor.trim()) return;
    
    setLoading(true);
    setError('');
    setResultado(null);
    setMotoPage(0);
    
    try {
      const res = await api.buscarPortal({ [criterio]: valor });
      if (res.encontrado) {
        setResultado(res.data);
      } else {
        setError(res.mensaje || 'No se encontraron resultados.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar la información.');
    } finally {
      setLoading(false);
    }
  };

  const sortedMotos = useMemo(() => {
    if (!resultado?.motos) return [];
    return [...resultado.motos].sort((a: any, b: any) => {
      const dateA = a.reparaciones?.length ? Math.max(...a.reparaciones.map((r:any) => new Date(r.fechaIngreso).getTime())) : 0;
      const dateB = b.reparaciones?.length ? Math.max(...b.reparaciones.map((r:any) => new Date(r.fechaIngreso).getTime())) : 0;
      return dateB - dateA;
    });
  }, [resultado]);

  // Generar partículas sutiles
  const particles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${6 + Math.random() * 4}s`
  })), []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      backgroundImage: `
        radial-gradient(circle at 50% 0%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
        repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 10px)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Partículas de fondo */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left,
          top: p.top,
          animationDelay: p.delay,
          animationDuration: p.duration
        }} />
      ))}

      {/* Header Público */}
      <header style={{
        padding: '3rem 1.5rem 2rem 1.5rem',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <img src={logo} alt="Ale Motos Logo" className="animate-pulse-glow" style={{
          height: 140,
          objectFit: 'contain',
          marginBottom: '1.5rem'
        }} />
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 900, 
          color: '#ffffff', 
          letterSpacing: '-0.03em', 
          textShadow: '0 0 20px rgba(220,38,38,0.5)', 
          margin: 0, 
          lineHeight: 1.1,
          fontFamily: '"Inter", sans-serif'
        }}>
          Ale Motos
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#a0a0a0', 
          margin: '0.5rem 0 0 0', 
          fontWeight: 300, 
          letterSpacing: '0.15em',
          textTransform: 'uppercase'
        }}>
          Expertos en el cuidado de tu moto.
        </p>
      </header>

      {/* Main Content */}
      <main className="animate-fade-in-up" style={{ flex: 1, padding: '1.5rem', maxWidth: 800, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
        


        <div style={{
          padding: '3.5rem 2.5rem', 
          textAlign: 'center',
          backgroundColor: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          borderTop: '1px solid rgba(220, 38, 38, 0.4)',
          borderRadius: '24px',
          boxShadow: '0 20px 50px -20px rgba(220, 38, 38, 0.3)'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
            <Wrench size={28} color="#ef4444" />
            Consultá el estado de tu reparación
          </h2>
          <p style={{ marginBottom: '2rem', fontSize: '1.05rem', maxWidth: '550px', margin: '0 auto 2rem auto', color: '#a0a0a0', lineHeight: 1.6 }}>
            Ingresá la patente de tu moto o tu DNI para ver el historial y estado actual de los trabajos de tu vehículo.
          </p>

          {/* Separador */}
          <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)', margin: '0 auto 2.5rem auto' }}></div>

          <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '650px', margin: '0 auto' }}>
            <div style={{ position: 'relative' }}>
              <select 
                className="premium-input" 
                style={{ width: 'auto', minWidth: 140, height: '3.5rem', fontSize: '1rem', borderRadius: '0.75rem', padding: '0 2.5rem 0 1rem', appearance: 'none', cursor: 'pointer' }}
                value={criterio} 
                onChange={e => setCriterio(e.target.value as any)}
              >
                <option value="dominio" style={{ backgroundColor: '#1a1a1a' }}>Patente</option>
                <option value="dni" style={{ backgroundColor: '#1a1a1a' }}>DNI</option>
              </select>
              <ChevronDown size={18} color="#a0a0a0" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            
            <input 
              type="text" 
              className="premium-input" 
              style={{ flex: 1, minWidth: 220, height: '3.5rem', fontSize: '1.1rem', borderRadius: '0.75rem', padding: '0 1.5rem', textAlign: 'center', fontWeight: 500, letterSpacing: '1px' }}
              placeholder={criterio === 'dominio' ? 'Ej: A123BCD' : 'Tu número de DNI'}
              value={valor}
              onChange={e => setValor(e.target.value.toUpperCase())}
              required
            />
            
            <button type="submit" className="premium-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '3.5rem', padding: '0 2rem', fontSize: '1.05rem', borderRadius: '0.75rem', fontWeight: 700, color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}>
              <Search size={20} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {error && (
            <div className="animate-fade-in-up" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', borderRadius: '0.75rem', border: '1px solid rgba(220, 38, 38, 0.3)', fontWeight: 500, maxWidth: '600px', margin: '2rem auto 0 auto' }}>
              {error}
            </div>
          )}
        </div>

        {/* Resultados */}
        {resultado && (
          <div style={{ marginTop: '1.5rem' }}>
            {criterio === 'dni' ? (
              // Vista por Cliente (tiene múltiples motos)
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  Hola, {resultado.nombre}
                </h3>
                {sortedMotos?.length > 0 ? (
                  <>
                    <MotoCard moto={sortedMotos[motoPage]} />
                    {sortedMotos.length > 1 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm" 
                          disabled={motoPage === 0} 
                          onClick={() => setMotoPage(p => p - 1)}
                          style={{ backgroundColor: 'white', color: '#111827', opacity: motoPage === 0 ? 0.5 : 1, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flex: '1 1 140px', maxWidth: '200px' }}
                        >
                          ← Vehículo anterior
                        </button>
                        <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, textAlign: 'center', flex: '1 1 100%', order: -1, marginBottom: '0.5rem' }}>
                          Vehículo {motoPage + 1} de {sortedMotos.length}
                        </span>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm" 
                          disabled={motoPage === sortedMotos.length - 1} 
                          onClick={() => setMotoPage(p => p + 1)}
                          style={{ backgroundColor: 'white', color: '#111827', opacity: motoPage === sortedMotos.length - 1 ? 0.5 : 1, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flex: '1 1 140px', maxWidth: '200px' }}
                        >
                          Siguiente vehículo →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.8)' }}>No tenés motos registradas en nuestro sistema.</p>
                )}
              </div>
            ) : (
              // Vista por Moto
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  Vehículo: {resultado.marca} {resultado.modelo} — {resultado.dominio}
                </h3>
                {resultado.cliente?.nombre && (
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Titular: {resultado.cliente.nombre}</p>
                )}
                <MotoCard moto={resultado} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function MotoCard({ moto }: { moto: any }) {
  const [page, setPage] = useState(0);

  const cardStyle = {
    padding: '1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    color: '#111827'
  };

  if (!moto.reparaciones || moto.reparaciones.length === 0) {
    return (
      <div style={cardStyle} className="mb-md">
        <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', fontWeight: 700 }}>{moto.marca} {moto.modelo} ({moto.dominio})</h4>
        <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>No hay reparaciones registradas para este vehículo.</p>
      </div>
    );
  }

  // Sort reparaciones newest first
  const sortedReparaciones = [...moto.reparaciones].sort((a: any, b: any) => 
    new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
  );

  const rep = sortedReparaciones[page];
  const conf = getEstadoConfig(rep.estado);
  const totalPages = sortedReparaciones.length;

  return (
    <div style={cardStyle} className="mb-md">
      <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', fontWeight: 700 }}>
        Historial — {moto.marca} {moto.modelo} ({moto.dominio})
      </h4>
      
      <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex justify-between items-center mb-md" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="flex items-center gap-sm">
            <span style={{ fontSize: '1.5rem' }}>{conf.icon}</span>
            <span style={{
              fontWeight: 700, padding: '4px 12px', borderRadius: '9999px',
              background: `${conf.color}33`, color: conf.color, border: `1px solid ${conf.color}66`
            }}>
              {conf.label}
            </span>
          </div>
          <div style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: 500 }}>
            Ingreso: {new Date(rep.fechaIngreso).toLocaleDateString('es-AR')}
          </div>
        </div>

        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#1f2937' }}>{rep.descripcionProblema}</p>

        {/* Timeline */}
        <div className="timeline mb-md">
          {rep.estadoHistorial?.map((h: any, i: number) => {
            const hConf = getEstadoConfig(h.estado);
            return (
              <div key={i} className={`timeline-item ${i === rep.estadoHistorial.length - 1 ? 'active' : 'completed'}`}>
                <div className="timeline-date" style={{ color: '#6b7280' }}>{new Date(h.fechaHora).toLocaleString('es-AR')}</div>
                <div className="timeline-title" style={{ color: '#111827' }}>{hConf.icon} {hConf.label}</div>
              </div>
            );
          })}
        </div>

        {/* Resumen Precio */}
        {rep.estado !== 'recibido' && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
            <div className="flex justify-between text-sm" style={{ color: '#4b5563', fontWeight: 600 }}>
              <span>Repuestos y materiales</span>
              <span>{formatCurrency(rep.totalRepuestos)}</span>
            </div>
            
            {rep.repuestosUsados && rep.repuestosUsados.length > 0 && (
              <div style={{ paddingLeft: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem', borderLeft: '2px solid rgba(0,0,0,0.05)' }}>
                {rep.repuestosUsados.map((ru: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs" style={{ color: '#6b7280', padding: '2px 0', marginLeft: '0.5rem' }}>
                    <span>{ru.cantidad}x {ru.producto?.nombre || 'Repuesto genérico'}</span>
                    <span>{formatCurrency(ru.precioUnitarioCongelado * ru.cantidad)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm mb-xs" style={{ color: '#4b5563', fontWeight: 600, marginTop: rep.repuestosUsados?.length ? '0' : '0.5rem' }}>
              <span>Mano de obra</span>
              <span>{formatCurrency(rep.totalManoObra)}</span>
            </div>
            <div className="flex justify-between" style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(0,0,0,0.1)', color: '#111827' }}>
              <span>Total Presupuestado</span>
              <span style={{ color: '#dc2626' }}>{formatCurrency(rep.totalRepuestos + rep.totalManoObra)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            disabled={page === totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
            style={{ backgroundColor: 'white', color: '#111827', opacity: page === totalPages - 1 ? 0.5 : 1, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flex: '1 1 140px', maxWidth: '200px' }}
          >
            ← Más antigua
          </button>
          <span style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', flex: '1 1 100%', order: -1, marginBottom: '0.5rem' }}>
            Reparación {page + 1} de {totalPages}
          </span>
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
            style={{ backgroundColor: 'white', color: '#111827', opacity: page === 0 ? 0.5 : 1, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flex: '1 1 140px', maxWidth: '200px' }}
          >
            Más reciente →
          </button>
        </div>
      )}
    </div>
  );
}

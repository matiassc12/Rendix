/*
  Nombre del archivo: DashboardView.jsx
  Propósito: Dashboard general de RendixApp completamente unificado y responsivo.
*/

import React, { useState, useEffect } from 'react';
import { generatePdfReport } from '../utils/pdfGenerator';

export default function DashboardView({
  vehicles = [],
  totalFuelCost = 0,
  totalExpenses = 0,
  totalCargas = 0,
  avgKm = '0.0',
  costPerKm = '0',
  dashVehicleFilter = 'all',
  setDashVehicleFilter,
  setActiveTab,
  openAnalyticsModal
}) {
  const [indicators, setIndicators] = useState({ uf: 41226.39, dolar: 994.29 });
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('flow');

  useEffect(() => {
    Promise.all([
      fetch('https://findic.cl/api/uf').then(res => res.json()).catch(() => null),
      fetch('https://findic.cl/api/dolar').then(res => res.json()).catch(() => null)
    ])
      .then(([ufData, dolarData]) => {
        const ufVal = ufData?.serie?.[0]?.valor || ufData?.valor || 41226.39;
        const dolarVal = dolarData?.serie?.[0]?.valor || dolarData?.valor || 994.29;

        setIndicators({
          uf: Number(ufVal),
          dolar: Number(dolarVal)
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalGeneral = totalFuelCost + totalExpenses;

  let urgentAlerts = 0;
  let warningAlerts = 0;

  vehicles.forEach(v => {
    const currentKm = Number(v.currentKm || 0);
    const lastServiceKm = Number(v.last_service_km || 0);
    const intervalKm = 10000;
    const nextServiceKm = lastServiceKm > 0 ? lastServiceKm + intervalKm : Math.ceil((currentKm + 1) / intervalKm) * intervalKm;
    const remainingKm = nextServiceKm - currentKm;
    
    if (lastServiceKm > 0 && remainingKm <= 0) urgentAlerts++;
    else if (lastServiceKm > 0 && remainingKm <= 1500) warningAlerts++;

    const docs = [v.soap_expiration, v.permiso_circulacion_expiration, v.revision_tecnica_expiration, v.seguro_privado_expiration, v.licencia_conducir_expiration];
    docs.forEach(dateStr => {
      if (dateStr) {
        const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) urgentAlerts++;
        else if (diffDays <= 30) warningAlerts++;
      }
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 🚨 ALERTAS */}
      {(urgentAlerts > 0 || warningAlerts > 0) ? (
        <div 
          onClick={() => setActiveTab('alerts')}
          style={{ 
            background: urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
            border: `1px solid ${urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`, 
            borderRadius: '12px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', 
            alignItems: 'center', cursor: 'pointer', gap: '12px', width: '100%', boxSizing: 'border-box', flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{urgentAlerts > 0 ? '🚨' : '⚠️'}</span>
            <div>
              <h4 style={{ margin: 0, color: urgentAlerts > 0 ? '#ef4444' : '#eab308', fontSize: '15px', fontWeight: '800' }}>
                Atención Requerida en tu Flota
              </h4>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {urgentAlerts > 0 ? `${urgentAlerts} alerta(s) urgente(s). ` : ''}
                {warningAlerts > 0 ? `${warningAlerts} estado(s) próximo(s) a vencer.` : ''}
              </p>
            </div>
          </div>
          <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '700', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px' }}>
            Ir a Alertas →
          </span>
        </div>
      ) : (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '22px' }}>✅</span>
          <div>
            <h4 style={{ margin: 0, color: '#22c55e', fontSize: '15px', fontWeight: '800' }}>Flota al Día</h4>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>Todos los mantenimientos y documentos están en regla.</p>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', width: '100%',
        flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '-0.5px' }}>Dashboard General</h2>
          <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Resumen financiero y rendimiento operativo de tus vehículos en tiempo real.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px' }}>🚗</span>
            <select
              value={dashVehicleFilter}
              onChange={(e) => setDashVehicleFilter(e.target.value)}
              style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all" style={{ background: 'var(--bg-card)' }}>Todos los vehículos ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id} style={{ background: 'var(--bg-card)' }}>
                  {v.name} ({v.brand} {v.model})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openAnalyticsModal}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#ffffff', border: 'none',
              padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
            }}
          >
            📈 Analítica
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            style={{
              background: showGuide ? '#38bdf8' : 'rgba(56, 189, 248, 0.15)',
              color: showGuide ? '#0f172a' : '#38bdf8',
              border: '1px solid #38bdf8', padding: '8px 14px', borderRadius: '8px',
              fontSize: '12px', fontWeight: '800', cursor: 'pointer'
            }}
          >
            📖 {showGuide ? 'Ocultar Guía' : '¿Cómo Usar?'}
          </button>

          <button
            onClick={() => generatePdfReport({ vehicles, totalFuelCost, totalExpenses, indicators })}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#ffffff', border: 'none',
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
          >
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* GUÍA DE USO */}
      {showGuide && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid #38bdf8', borderRadius: '16px',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', width: '100%', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: '900' }}>
              📖 Manual Operativo • RendixApp
            </h3>
            <span style={{ fontSize: '11px', background: 'var(--bg-secondary)', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', border: '1px solid var(--border-color)' }}>
              Duoc UC Capstone
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveGuideTab('flow')} style={{ background: activeGuideTab === 'flow' ? '#38bdf8' : 'var(--bg-secondary)', color: activeGuideTab === 'flow' ? '#0f172a' : 'var(--text-secondary)', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>1. Flujo</button>
            <button onClick={() => setActiveGuideTab('formulas')} style={{ background: activeGuideTab === 'formulas' ? '#38bdf8' : 'var(--bg-secondary)', color: activeGuideTab === 'formulas' ? '#0f172a' : 'var(--text-secondary)', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>2. Fórmulas</button>
            <button onClick={() => setActiveGuideTab('trip')} style={{ background: activeGuideTab === 'trip' ? '#38bdf8' : 'var(--bg-secondary)', color: activeGuideTab === 'trip' ? '#0f172a' : 'var(--text-secondary)', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>3. Fletes</button>
            <button onClick={() => setActiveGuideTab('alerts')} style={{ background: activeGuideTab === 'alerts' ? '#38bdf8' : 'var(--bg-secondary)', color: activeGuideTab === 'alerts' ? '#0f172a' : 'var(--text-secondary)', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>4. Alertas</button>
          </div>

          {activeGuideTab === 'flow' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', marginBottom: '4px' }}>1. Mis Vehículos</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Ingresa tu vehículo con su patente para calcular la PRT automáticamente en Chile.</p>
              </div>
              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#4ade80', marginBottom: '4px' }}>2. Cargas Combustible</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Anota los odómetros en cada carga para obtener el rendimiento real en km/L.</p>
              </div>
              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fca5a5', marginBottom: '4px' }}>3. Gastos y TAG</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Registra peajes y mantenciones para calcular el Costo Real por Kilómetro ($/km).</p>
              </div>
            </div>
          )}

          {activeGuideTab === 'formulas' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4ade80', fontWeight: '800' }}>Rendimiento (km/L)</h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px', fontSize: '10px', color: '#38bdf8', fontWeight: '700', textAlign: 'center' }}>
                  Δ Odómetro / Litros
                </div>
              </div>
              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#06b6d4', fontWeight: '800' }}>Costo Real / Km (TCO)</h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px', fontSize: '10px', color: '#06b6d4', fontWeight: '700', textAlign: 'center' }}>
                  (Bencina + Gastos) / Distancia
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'trip' && (
            <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#10b981', fontWeight: '800' }}>🗺️ Cotizador de Fletes</h4>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Marca origen y destino en el mapa para calcular la distancia y obtener tu tarifa de cobro ideal con margen.</p>
            </div>
          )}

          {activeGuideTab === 'alerts' && (
            <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#ef4444', fontWeight: '800' }}>📁 Guantera Digital</h4>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Controla los vencimientos de SOAP, Revisión Técnica y mantenciones preventivas cada 10.000 km.</p>
            </div>
          )}
        </div>
      )}

      {/* WIDGET FINDIC API */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), var(--bg-card))',
        border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.25)', padding: '8px 10px', borderRadius: '8px', fontSize: '20px' }}>📊</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: '800' }}>Findic API</h4>
              <span style={{ background: '#22c55e', color: '#0f172a', fontSize: '8px', fontWeight: '800', padding: '2px 4px', borderRadius: '4px' }}>EN VIVO</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Conversión automática de UF y Dólar.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>UF</span>
            <div style={{ fontSize: '16px', fontWeight: '950', color: '#38bdf8' }}>{loading ? '...' : `$${Number(indicators.uf).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Dólar</span>
            <div style={{ fontSize: '16px', fontWeight: '950', color: '#4ade80' }}>{loading ? '...' : `$${Number(indicators.dolar).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`}</div>
          </div>
        </div>
      </div>

      {/* GRID KPI */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ position: 'relative', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Gasto Bencina</div>
          <div style={{ color: '#38bdf8', fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>${Number(totalFuelCost).toLocaleString('es-CL')}</div>
          <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '18px' }}>⛽</span>
        </div>

        <div style={{ position: 'relative', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Rendimiento Prom.</div>
          <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>{avgKm} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>km/l</span></div>
          <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '18px' }}>🛤️</span>
        </div>

        <div style={{ position: 'relative', padding: '16px', background: 'linear-gradient(135deg, var(--bg-card), rgba(6, 182, 212, 0.15))', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Costo Real / Km</div>
          <div style={{ color: '#06b6d4', fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>${costPerKm} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>/ km</span></div>
          <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '18px' }}>💸</span>
        </div>

        <div style={{ position: 'relative', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Gastos Operativos</div>
          <div style={{ color: '#fca5a5', fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>${Number(totalExpenses).toLocaleString('es-CL')}</div>
          <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '18px' }}>🛠️</span>
        </div>

        <div style={{ position: 'relative', padding: '16px', background: 'linear-gradient(135deg, var(--bg-card), rgba(99, 102, 241, 0.15))', border: '1px solid rgba(129, 140, 248, 0.4)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Gasto UF y Dólares</div>
          <div style={{ color: '#818cf8', fontSize: '18px', fontWeight: '900', marginTop: '6px' }}>
            {indicators.uf > 0 ? (totalGeneral / indicators.uf).toFixed(2) : '0.00'} UF 
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>(US${indicators.dolar > 0 ? (totalGeneral / indicators.dolar).toFixed(2) : '0.00'})</span>
          </div>
          <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '18px' }}>📊</span>
        </div>
      </div>

    </div>
  );
}
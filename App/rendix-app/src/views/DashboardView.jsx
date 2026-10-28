/*
  Nombre del archivo: DashboardView.jsx
  Propósito: Dashboard general de Rendix con barra superior unificada y compacta, 
  indicadores Findic en vivo, tarjetas KPI, alertas inteligentes y modal de analítica.
*/

import React, { useState, useEffect } from 'react';
import { generatePdfReport } from '../utils/pdfGenerator';

export default function DashboardView({
  vehicles = [],
  totalFuelCost = 0,
  totalExpenses = 0,
  totalCargas = 0,
  avgKm = '0.0',
  dashVehicleFilter = 'all',
  setDashVehicleFilter,
  setActiveTab,
  openAnalyticsModal
}) {
  const [indicators, setIndicators] = useState({ uf: 41226.39, dolar: 994.29 });
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  // Consumir en vivo las APIs de Findic
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
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const totalGeneral = totalFuelCost + totalExpenses;

  // Lógica para Alertas Globales
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '0 20px',
      boxSizing: 'border-box'
    }}>
      
      {/* 🔴 WIDGET DE ALERTAS INTELIGENTE */}
      {(urgentAlerts > 0 || warningAlerts > 0) ? (
        <div 
          onClick={() => setActiveTab('alerts')}
          style={{ 
            background: urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
            border: `1px solid ${urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`, 
            borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', 
            alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 15px -5px rgba(0,0,0,0.2)', flexWrap: 'wrap', gap: '12px', width: '100%', boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{urgentAlerts > 0 ? '🚨' : '⚠️'}</span>
            <div>
              <h4 style={{ margin: 0, color: urgentAlerts > 0 ? '#ef4444' : '#eab308', fontSize: '15px', fontWeight: '800' }}>
                Atención Requerida en tu Flota
              </h4>
              <p style={{ margin: '1px 0 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                {urgentAlerts > 0 ? `${urgentAlerts} alerta(s) urgente(s). ` : ''}
                {warningAlerts > 0 ? `${warningAlerts} estado(s) próximo(s) a vencer.` : ''}
              </p>
            </div>
          </div>
          <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: '700', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px' }}>
            Ir a Panel de Alertas →
          </span>
        </div>
      ) : (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '22px' }}>✅</span>
          <div>
            <h4 style={{ margin: 0, color: '#22c55e', fontSize: '15px', fontWeight: '800' }}>Flota al Día</h4>
            <p style={{ margin: '1px 0 0 0', color: '#cbd5e1', fontSize: '12px' }}>Todos los mantenimientos y documentos están en regla.</p>
          </div>
        </div>
      )}

      {/* TOPBAR COMPACTA */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px', 
        borderBottom: '1px solid #334155', 
        paddingBottom: '16px',
        width: '100%'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>Dashboard General</h2>
          <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Resumen financiero y rendimiento operativo de tus vehículos en tiempo real.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Selector de Vehículos */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '6px' }}>🚗</span>
            <select
              value={dashVehicleFilter}
              onChange={(e) => setDashVehicleFilter(e.target.value)}
              style={{ background: 'transparent', color: '#f8fafc', border: 'none', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all" style={{ background: '#1e293b' }}>Todos los vehículos ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id} style={{ background: '#1e293b' }}>
                  {v.name} ({v.brand} {v.model})
                </option>
              ))}
            </select>
          </div>

          {/* Botón de Analítica (Gráficos) */}
          <button
            onClick={openAnalyticsModal}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
            }}
          >
            📈 Ver Analítica
          </button>

          {/* Botón de Guía */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            style={{
              background: showGuide ? '#334155' : 'rgba(51, 65, 85, 0.5)',
              color: '#94a3b8',
              border: '1px solid #475569',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            💡 {showGuide ? 'Ocultar Guía' : '¿Cómo usar?'}
          </button>

          {/* Botón PDF */}
          <button
            onClick={() => generatePdfReport({ vehicles, totalFuelCost, totalExpenses, indicators })}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
          >
            🖨️ Reporte PDF
          </button>
        </div>
      </div>

      {/* Guía Desplegable */}
      {showGuide && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: '800' }}>
              📖 Guía Rápida de Explotación Rendix
            </h3>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>Duoc UC - Proyecto Rendix</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', marginBottom: '2px' }}>1. Registro Inicial</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Ingresa vehículos, foto y patentes para habilitar cálculos automáticos de PRT.</div>
            </div>
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#4ade80', marginBottom: '2px' }}>2. Analítica y Gráficos</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Usa "Ver Analítica" para auditar las curvas mensuales de gasto operativo.</div>
            </div>
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#818cf8', marginBottom: '2px' }}>3. Reportes PDF</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Genera documentos ejecutivos listos para exportar e imprimir.</div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Financiero Superior (Findic API) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '12px',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.25)', padding: '10px 12px', borderRadius: '10px', fontSize: '22px' }}>
            📊
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: '800' }}>
                Indexación Financiera (Findic API)
              </h4>
              <span style={{ background: '#22c55e', color: '#0f172a', fontSize: '9px', fontWeight: '800', padding: '2px 5px', borderRadius: '4px' }}>
                EN VIVO
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Conversión automática de gastos operativos para pólizas y contratos reajustables.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Valor UF (En Vivo)</span>
            <div style={{ fontSize: '18px', fontWeight: '950', color: '#38bdf8' }}>
              {loading ? '...' : `$${Number(indicators.uf).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #334155', paddingLeft: '24px', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Valor Dólar (En Vivo)</span>
            <div style={{ fontSize: '18px', fontWeight: '950', color: '#4ade80' }}>
              {loading ? '...' : `$${Number(indicators.dolar).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        width: '100%'
      }}>
        
        <div style={{ position: 'relative', padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Gasto Total Bencina</div>
          <div style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '900', marginTop: '8px' }}>
            ${Number(totalFuelCost).toLocaleString('es-CL')}
          </div>
          <span style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '22px' }}>⛽</span>
        </div>

        <div style={{ position: 'relative', padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Rendimiento Promedio</div>
          <div style={{ color: '#4ade80', fontSize: '24px', fontWeight: '900', marginTop: '8px' }}>
            {avgKm} <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>km/l</span>
          </div>
          <span style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '22px' }}>🛤️</span>
        </div>

        <div style={{ position: 'relative', padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Gastos Operativos</div>
          <div style={{ color: '#fca5a5', fontSize: '24px', fontWeight: '900', marginTop: '8px' }}>
            ${Number(totalExpenses).toLocaleString('es-CL')}
          </div>
          <span style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '22px' }}>💸</span>
        </div>

        <div style={{ 
          position: 'relative', 
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(49, 46, 129, 0.5))',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Gasto Total en UF y Dólares</div>
          <div style={{ color: '#818cf8', fontSize: '20px', fontWeight: '900', marginTop: '8px' }}>
            {indicators.uf > 0 ? (totalGeneral / indicators.uf).toFixed(2) : '0.00'} UF 
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              (US${indicators.dolar > 0 ? (totalGeneral / indicators.dolar).toFixed(2) : '0.00'})
            </span>
          </div>
          <span style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '22px' }}>📊</span>
        </div>

      </div>

    </div>
  );
}
/*
  Nombre del archivo: ExpensesView.jsx
  Propósito: Permite llevar un control centralizado de los gastos operativos de la flota 
  (como TAG, peajes, mantenciones y seguros) organizados por categorías y vinculados a los vehículos en Supabase.
*/

import React from 'react';

export default function ExpensesView({ expenses = [], vehicles = [], openModal }) {
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Asignar colores/estilos dinámicos a las categorías
  const getCategoryBadgeStyle = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('tag') || cat.includes('peaje')) {
      return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    }
    if (cat.includes('mantenimiento') || cat.includes('mantencion') || cat.includes('mecanic')) {
      return { bg: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
    }
    if (cat.includes('seguro') || cat.includes('permiso') || cat.includes('patente')) {
      return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
    }
    if (cat.includes('estacionamiento')) {
      return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
    }
    return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Cabecera */}
      <div className="header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            💸 Gastos Operativos y TAG
          </h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '14px' }}>
            Control centralizado de TAG, peajes, mantenciones, repuestos y seguros.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => openModal('expense')}
          style={{
            padding: '10px 18px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
          }}
        >
          + Nuevo Gasto
        </button>
      </div>

      {/* Tabla de Gastos */}
      <div className="card-box" style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}>
        {sortedExpenses.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>💸</span>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>No hay gastos operativos registrados.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Haz clic en "+ Nuevo Gasto" para registrar cobros de TAG, peajes o mantenciones.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a', color: '#cbd5e1' }}>
                <th style={{ padding: '14px 20px' }}>Fecha</th>
                <th style={{ padding: '14px 20px' }}>Vehículo</th>
                <th style={{ padding: '14px 20px' }}>Categoría</th>
                <th style={{ padding: '14px 20px' }}>Descripción</th>
                <th style={{ padding: '14px 20px' }}>Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.map(e => {
                const vehicleId = e.vehicle_id || e.vehicleId;
                const veh = vehicles.find(v => v.id === vehicleId);
                const style = getCategoryBadgeStyle(e.category);

                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>{e.date}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#f8fafc' }}>
                      {veh ? (veh.name || `${veh.brand} ${veh.model}`) : 'Vehículo no encontrado'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`
                      }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>
                      {e.description || 'Sin descripción'}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#fca5a5' }}>
                      ${Number(e.amount).toLocaleString('es-CL')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
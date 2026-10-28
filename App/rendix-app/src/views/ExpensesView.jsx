/*
  Nombre del archivo: ExpensesView.jsx
  Propósito: Historial de gastos operativos y TAG con avatar/foto miniatura del vehículo.
*/

import React from 'react';

export default function ExpensesView({ expenses = [], vehicles = [], openModal }) {

  const renderVehicleCell = (vehicleId) => {
    const v = vehicles.find(item => item.id === vehicleId);
    if (!v) return <span style={{ color: '#94a3b8' }}>Vehículo no encontrado</span>;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {v.image_url ? (
          <img 
            src={v.image_url} 
            alt={v.name} 
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #334155', flexShrink: 0 }} 
          />
        ) : (
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
            🚗
          </div>
        )}
        <div>
          <div style={{ color: '#38bdf8', fontWeight: '800', fontSize: '13px' }}>{v.name}</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>{v.plate || 'Sin Patente'}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>💸 Gastos Operativos y TAG</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Registra peajes, repuestos, estacionamientos y mantenimientos adicionales.</p>
        </div>

        <button
          onClick={openModal}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
          }}
        >
          + Registrar Nuevo Gasto
        </button>
      </div>

      {expenses.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No hay gastos operativos registrados todavía.
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px' }}>Fecha</th>
                <th style={{ padding: '16px' }}>Vehículo</th>
                <th style={{ padding: '16px' }}>Categoría</th>
                <th style={{ padding: '16px' }}>Descripción</th>
                <th style={{ padding: '16px' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => {
                const vId = e.vehicle_id || e.vehicleId;
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#f8fafc' }}>{e.date}</td>
                    <td style={{ padding: '16px' }}>{renderVehicleCell(vId)}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: '#334155', color: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        {e.category || 'Otros'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>{e.description || '-'}</td>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#fca5a5' }}>${Number(e.amount || 0).toLocaleString('es-CL')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
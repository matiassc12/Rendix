/*
  Nombre del archivo: ExpensesView.jsx
  Propósito: Gestión de gastos operativos y mantenciones con soporte completo para modo claro y oscuro.
*/

import React from 'react';
import { formatDateCL } from '../utils/dateHelper';

export default function ExpensesView({
  expenses = [],
  vehicles = [],
  openModal,
  onDeleteExpense
}) {
  const renderVehicleCell = (vehicleId) => {
    const v = vehicles.find(item => item.id === vehicleId);
    if (!v) return <span style={{ color: 'var(--text-secondary)' }}>Vehículo no encontrado</span>;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {v.image_url ? (
          <img
            src={v.image_url}
            alt={v.name}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
            🚗
          </div>
        )}
        <div>
          <div style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '13px' }}>{v.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600' }}>{v.plate || 'Sin Patente'}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '-0.5px' }}>
            💰 Registro de Gastos Operativos
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Administra TAG, peajes, mantenciones, estacionamientos y otros gastos de tu flota.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal && openModal()}
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
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No hay gastos registrados todavía.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflowX: 'auto', boxShadow: 'var(--shadow)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: 'var(--text-primary)', minWidth: '720px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-inner)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px' }}>Fecha</th>
                <th style={{ padding: '16px' }}>Vehículo</th>
                <th style={{ padding: '16px' }}>Categoría</th>
                <th style={{ padding: '16px' }}>Descripción</th>
                <th style={{ padding: '16px' }}>Monto</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(item => {
                const vId = item.vehicle_id || item.vehicleId;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {formatDateCL(item.date)}
                    </td>
                    <td style={{ padding: '16px' }}>{renderVehicleCell(vId)}</td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: 'var(--bg-card-inner)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {item.category || 'Otros'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {item.description || '—'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#dc2626', whiteSpace: 'nowrap' }}>
                      ${Number(item.amount || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense && onDeleteExpense(item.id)}
                        title="Eliminar gasto"
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
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
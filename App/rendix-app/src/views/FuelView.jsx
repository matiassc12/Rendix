/*
  Nombre del archivo: FuelView.jsx
  Propósito: Historial de cargas de combustible con avatar del vehículo,
  referencia de precios en vivo desde API CNE y eliminación.
*/

import React, { useState } from 'react';

export default function FuelView({
  fuelRecords = [],
  vehicles = [],
  cneStations = [],
  isCneLoading = false,
  openModal,
  onDeleteFuel
}) {
  const [refFuelType, setRefFuelType] = useState('p95');

  const fuelLabels = {
    p93: '93 Oct.',
    p95: '95 Oct.',
    p97: '97 Oct.',
    diesel: 'Diésel'
  };

  const validStations = cneStations.filter((s) => Number(s[refFuelType]) > 0);
  const cheapestStation =
    validStations.length > 0
      ? validStations.reduce(
          (min, curr) => (Number(curr[refFuelType]) < Number(min[refFuelType]) ? curr : min),
          validStations[0]
        )
      : null;

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
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>⛽ Historial de Cargas de Bencina</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Controla tus litros cargados y el gasto histórico por vehículo.</p>
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
          + Registrar Nueva Carga
        </button>
      </div>

      {/* Banner de referencia en vivo desde API CNE */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
          ⚡ <strong style={{ color: '#38bdf8' }}>Referencia API CNE ({fuelLabels[refFuelType]}):</strong>{' '}
          {isCneLoading
            ? 'Consultando precios en línea...'
            : cheapestStation
              ? (
                <>
                  Más económica en <strong>{cheapestStation.commune}</strong>: {cheapestStation.name} —{' '}
                  <strong style={{ color: '#4ade80' }}>
                    ${Number(cheapestStation[refFuelType]).toLocaleString('es-CL')}/L
                  </strong>
                </>
              )
              : 'Sin precios disponibles'}
        </span>

        <div style={{ display: 'flex', gap: '6px' }}>
          {Object.entries(fuelLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRefFuelType(key)}
              style={{
                background: refFuelType === key ? '#38bdf8' : 'rgba(15, 23, 42, 0.6)',
                color: refFuelType === key ? '#0f172a' : '#94a3b8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {fuelRecords.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No hay cargas de combustible registradas todavía.
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px' }}>Fecha</th>
                <th style={{ padding: '16px' }}>Vehículo</th>
                <th style={{ padding: '16px' }}>Odómetro (Opc.)</th>
                <th style={{ padding: '16px' }}>Litros</th>
                <th style={{ padding: '16px' }}>Costo Total</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fuelRecords.map(record => {
                const vId = record.vehicle_id || record.vehicleId;
                const odo = Number(record.odometer || 0);

                return (
                  <tr key={record.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#f8fafc' }}>{record.date}</td>
                    <td style={{ padding: '16px' }}>{renderVehicleCell(vId)}</td>
                    <td style={{ padding: '16px', color: odo > 0 ? '#cbd5e1' : '#64748b' }}>
                      {odo > 0 ? `${odo.toLocaleString('es-CL')} km` : '—'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#f8fafc' }}>
                      {Number(record.liters || 0).toFixed(1)} L
                    </td>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#4ade80' }}>
                      ${Number(record.total || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteFuel(record.id)}
                        title="Eliminar carga"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
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
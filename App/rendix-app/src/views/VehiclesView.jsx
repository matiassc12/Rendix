/*
  Nombre del archivo: VehiclesView.jsx
  Propósito: Módulo de gestión y visualización de vehículos registrados con soporte para patente y tarjetas de control.
*/

import React from 'react';

export default function VehiclesView({
  vehicles = [],
  deleteVehicle,
  openModal
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Encabezado y Botón para agregar vehículo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '26px', color: '#f8fafc', fontWeight: '800' }}>🚗 Gestión de Vehículos</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Administra tu parque vehicular para un control preciso en los reportes y PDF.</p>
        </div>

        <button
          onClick={() => openModal()}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#ffffff',
            border: 'none',
            padding: '11px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
          }}
        >
          ➕ Agregar Nuevo Vehículo
        </button>
      </div>

      {/* Listado de Vehículos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: '800' }}>
          Vehículos Registrados ({vehicles.length})
        </h3>

        {vehicles.length === 0 ? (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No hay vehículos registrados todavía. Haz clic en <strong style={{ color: '#38bdf8' }}>"Agregar Nuevo Vehículo"</strong> para comenzar.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {vehicles.map(v => (
              <div key={v.id} style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {/* Insignia de Patente */}
                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      {v.plate && v.plate.trim() !== '' ? v.plate : 'SIN PATENTE'}
                    </span>
                    <h4 style={{ margin: '8px 0 2px 0', fontSize: '16px', color: '#f8fafc', fontWeight: '800' }}>
                      {v.name}
                    </h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                      {v.brand} {v.model} ({v.year})
                    </p>
                  </div>
                  
                  {/* Botones de Editar y Eliminar */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openModal(v)}
                      style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteVehicle(v.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Kilometraje:</span>
                  <strong style={{ color: '#f8fafc' }}>{Number(v.currentKm || 0).toLocaleString('es-CL')} km</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
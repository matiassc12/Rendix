/*
  Nombre del archivo: VehiclesView.jsx
  Propósito: Gestión de vehículos del garaje con rendimiento manual (km/L) editable en cada tarjeta.
*/

import React, { useState } from 'react';
import { getManualEfficiency } from '../utils/efficiencyHelper';

export default function VehiclesView({
  vehicles = [],
  deleteVehicle,
  openModal,
  onUpdateManualEfficiency
}) {
  const [editingEffId, setEditingEffId] = useState(null);
  const [draftEffValues, setDraftEffValues] = useState({});
  const [savingId, setSavingId] = useState(null);

  const toggleQuickEditor = (vehicle) => {
    if (editingEffId === vehicle.id) {
      setEditingEffId(null);
      return;
    }
    setDraftEffValues(prev => ({
      ...prev,
      [vehicle.id]: vehicle.manual_efficiency > 0 ? vehicle.manual_efficiency : ''
    }));
    setEditingEffId(vehicle.id);
  };

  const handleQuickSave = async (vehicleId) => {
    if (!onUpdateManualEfficiency) return;
    const raw = String(draftEffValues[vehicleId] ?? '').replace(',', '.');
    const parsed = Math.max(0, Number(raw) || 0);
    const normalized = parsed > 0 ? Number(parsed.toFixed(1)) : 0;

    setSavingId(vehicleId);
    await onUpdateManualEfficiency(vehicleId, normalized);
    setSavingId(null);
    setEditingEffId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>🚘 Gestión de Vehículos</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Administra tu flota y define el rendimiento manual (km/L) de cada vehículo.</p>
        </div>

        <button
          onClick={() => openModal(null)}
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
          + Agregar Nuevo Vehículo
        </button>
      </div>

      <h3 style={{ margin: 0, color: '#cbd5e1', fontSize: '18px', fontWeight: '800', textAlign: 'center' }}>
        Vehículos Registrados ({vehicles.length})
      </h3>

      {/* Grid de Tarjetas */}
      {vehicles.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No tienes vehículos registrados en tu garaje.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {vehicles.map(v => {
            const kmPerLiter = getManualEfficiency(v);
            const isEditingEff = editingEffId === v.id;

            return (
              <div
                key={v.id}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Cabecera con Foto del Vehículo */}
                <div style={{ position: 'relative', height: '160px', width: '100%', background: '#0f172a' }}>
                  {v.image_url ? (
                    <img
                      src={v.image_url}
                      alt={v.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '48px', opacity: 0.5
                    }}>
                      🚗
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(30,41,59,0.9) 100%)' }} />

                  {/* Patente */}
                  <span style={{
                    position: 'absolute', top: '12px', left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)', color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                    fontWeight: '900', letterSpacing: '1px', backdropFilter: 'blur(4px)'
                  }}>
                    {v.plate || 'SIN PATENTE'}
                  </span>

                  {/* Acciones */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openModal(v)}
                      style={{ background: 'rgba(59, 130, 246, 0.85)', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteVehicle(v.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '20px', color: '#f8fafc', fontWeight: '900' }}>{v.name}</h4>
                    <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>{v.brand} {v.model} ({v.year})</p>
                  </div>

                  {/* Kilometraje */}
                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Kilometraje:</span>
                    <span style={{ fontSize: '15px', color: '#f8fafc', fontWeight: '800' }}>{Number(v.currentKm || 0).toLocaleString('es-CL')} km</span>
                  </div>

                  {/* Rendimiento Manual */}
                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Rendimiento:</span>
                      <span style={{ fontSize: '15px', color: kmPerLiter > 0 ? '#4ade80' : '#94a3b8', fontWeight: '900' }}>
                        {kmPerLiter > 0 ? `${kmPerLiter} km/L` : 'No definido'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: kmPerLiter > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                        border: `1px solid ${kmPerLiter > 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(148, 163, 184, 0.25)'}`,
                        color: kmPerLiter > 0 ? '#38bdf8' : '#94a3b8'
                      }}>
                        {kmPerLiter > 0 ? 'Ingreso Manual' : 'Pendiente de ingreso'}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleQuickEditor(v)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isEditingEff ? 'Cerrar ▲' : '✏️ Ajustar km/L'}
                      </button>
                    </div>
                  </div>

                  {/* Editor rápido inline */}
                  {isEditingEff && (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700' }}>
                        Rendimiento promedio (km/L):
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Ej: 13.5"
                          value={draftEffValues[v.id] ?? ''}
                          onChange={(e) => setDraftEffValues(prev => ({ ...prev, [v.id]: e.target.value }))}
                          style={{
                            flex: 1,
                            background: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            color: '#f8fafc',
                            fontSize: '14px',
                            fontWeight: '800'
                          }}
                        />
                        <button
                          type="button"
                          disabled={savingId === v.id}
                          onClick={() => handleQuickSave(v.id)}
                          style={{
                            background: '#22c55e',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            opacity: savingId === v.id ? 0.6 : 1
                          }}
                        >
                          {savingId === v.id ? '...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
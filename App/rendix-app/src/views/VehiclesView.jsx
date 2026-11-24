/*
  Nombre del archivo: VehiclesView.jsx
  Propósito: Gestión de flota de vehículos con soporte completo para modo claro y oscuro,
  rendimiento manual editable y patentes chilenas.
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
  const [effDraft, setEffDraft] = useState('');

  const startEditEfficiency = (vehicle) => {
    setEditingEffId(vehicle.id);
    const current = getManualEfficiency(vehicle);
    setEffDraft(current > 0 ? String(current) : '');
  };

  const saveEfficiency = async (vehicleId) => {
    if (onUpdateManualEfficiency) {
      await onUpdateManualEfficiency(vehicleId, effDraft);
    }
    setEditingEffId(null);
    setEffDraft('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '-0.5px' }}>
            🚗 Mis Vehículos
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Administra los vehículos de tu flota, su kilometraje actual y rendimiento en km/L.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal && openModal(null)}
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
          + Agregar Vehículo
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Aún no tienes vehículos registrados. Haz clic en "+ Agregar Vehículo" para comenzar.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {vehicles.map(v => {
            const manualEff = getManualEfficiency(v);
            const isEditingEff = editingEffId === v.id;

            return (
              <div
                key={v.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <div style={{ height: '165px', background: 'var(--bg-card-inner)', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
                  {v.image_url ? (
                    <img
                      src={v.image_url}
                      alt={v.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      🚘
                    </div>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '900'
                    }}
                  >
                    {v.plate || 'SIN PATENTE'}
                  </span>
                </div>

                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: 'var(--text-primary)' }}>
                      {v.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {v.brand} {v.model} · {v.year}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Odómetro actual:</span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {Number(v.currentKm || 0).toLocaleString('es-CL')} km
                    </strong>
                  </div>

                  <div style={{
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Rendimiento:</span>

                    {isEditingEff ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={effDraft}
                          onChange={(e) => setEffDraft(e.target.value)}
                          style={{
                            width: '72px',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => saveEfficiency(v.id)}
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {manualEff > 0 ? `${manualEff} km/L` : 'No definido'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => startEditEfficiency(v)}
                          style={{
                            background: 'transparent',
                            color: 'var(--accent)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openModal && openModal(v)}
                      style={{
                        flex: 1,
                        background: 'var(--bg-card-inner)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVehicle && deleteVehicle(v.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#dc2626',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
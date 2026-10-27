/*
  Nombre del archivo: FuelModal.jsx
  Propósito: Componente modal que provee el formulario para registrar una nueva carga 
  de combustible asociada a un vehículo en Supabase, calculando el precio por litro en tiempo real.
*/

import React, { useState } from 'react';

export default function FuelModal({ vehicles = [], onClose, onSubmit }) {
  const [form, setForm] = useState({ 
    vehicleId: vehicles[0]?.id || '', 
    date: new Date().toISOString().split('T')[0], 
    odometer: '', 
    liters: '', 
    total: '' 
  });

  const [loading, setLoading] = useState(false);

  // Cálculo en tiempo real del costo por litro
  const pricePerLiter = (form.total && form.liters && Number(form.liters) > 0)
    ? (Number(form.total) / Number(form.liters)).toFixed(0)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId) {
      alert('Debes seleccionar o tener registrado al menos un vehículo.');
      return;
    }
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        overflow: 'hidden'
      }}>
        
        {/* Cabecera del Modal */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⛽</span> Registrar Carga de Bencina
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Vehículo */}
          <div>
            <label style={labelStyle}>Vehículo *</label>
            {vehicles.length === 0 ? (
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: '4px 0 0 0' }}>
                ⚠️ Primero debes agregar un vehículo en "Mis Vehículos".
              </p>
            ) : (
              <select
                required
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} style={{ background: '#1e293b' }}>
                    {v.name} ({v.brand} {v.model})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha y Odómetro */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Odómetro (km) *</label>
              <input
                required
                type="number"
                min="0"
                value={form.odometer}
                onChange={e => setForm({ ...form, odometer: e.target.value })}
                placeholder="Ej: 45200"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Litros y Total ($) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Litros *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.1"
                value={form.liters}
                onChange={e => setForm({ ...form, liters: e.target.value })}
                placeholder="Ej: 35.5"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Monto Total ($) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.total}
                onChange={e => setForm({ ...form, total: e.target.value })}
                placeholder="Ej: 45000"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Indicador interactivo del precio por litro */}
          {pricePerLiter && (
            <div style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#38bdf8',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <span>Precio estimado por litro:</span>
              <strong>${Number(pricePerLiter).toLocaleString('es-CL')} / L</strong>
            </div>
          )}

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || vehicles.length === 0}
              style={{
                flex: 1,
                padding: '12px',
                background: vehicles.length === 0 ? '#64748b' : '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: vehicles.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
              }}
            >
              {loading ? 'Guardando...' : 'Guardar Carga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
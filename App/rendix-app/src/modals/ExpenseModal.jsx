/*
  Nombre del archivo: ExpenseModal.jsx
  Propósito: Componente modal que provee el formulario para registrar un nuevo gasto operativo 
  (TAG, mantención, seguro, etc.) asociado a un vehículo en Supabase.
*/

import React, { useState } from 'react';

export default function ExpenseModal({ vehicles = [], onClose, onSubmit }) {
  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    category: 'TAG / Peajes',
    description: '',
    amount: ''
  });

  const [loading, setLoading] = useState(false);

  const categories = [
    'TAG / Peajes',
    'Mantenimiento',
    'Seguros / Permisos',
    'Estacionamiento',
    'Lavado / Estética',
    'Repuestos / Accesorios',
    'Otro'
  ];

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
            <span>💸</span> Registrar Gasto Operativo
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

          {/* Categoría y Fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Categoría *</label>
              <select
                required
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} style={{ background: '#1e293b' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción / Detalle</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Ej: Peajes Costanera Norte, Cambio aceite"
              style={inputStyle}
            />
          </div>

          {/* Monto ($) */}
          <div>
            <label style={labelStyle}>Monto Total ($) *</label>
            <input
              required
              type="number"
              min="1"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="Ej: 15000"
              style={inputStyle}
            />
          </div>

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
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
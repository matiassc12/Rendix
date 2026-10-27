/*
  Nombre del archivo: ServiceModal.jsx
  Propósito: Modal para registrar fecha y kilometraje exacto de la última mantención.
*/

import React, { useState } from 'react';

export default function ServiceModal({ vehicle, onClose, onSubmit }) {
  const [form, setForm] = useState({
    serviceDate: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    serviceKm: vehicle?.currentKm || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      vehicleId: vehicle.id,
      last_service_date: form.serviceDate,
      last_service_km: Number(form.serviceKm)
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
        padding: '30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: '800' }}>
            🔧 Registrar Mantención
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
          Vehículo: <strong style={{ color: '#38bdf8' }}>{vehicle?.name}</strong> ({vehicle?.plate || 'Sin Patente'})
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>Fecha de la Mantención</label>
            <input 
              type="date" 
              required
              value={form.serviceDate}
              onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
              style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', colorScheme: 'dark' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>Kilómetros al momento del servicio</label>
            <input 
              type="number" 
              required
              value={form.serviceKm}
              onChange={(e) => setForm({ ...form, serviceKm: e.target.value })}
              style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#334155', color: '#f8fafc', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
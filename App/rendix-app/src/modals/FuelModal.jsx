/*
  Nombre del archivo: FuelModal.jsx
  Propósito: Componente modal que provee el formulario para registrar una nueva carga 
  de combustible asociada a un vehículo, calculando automáticamente el rendimiento en km/l.
*/

import React, { useState } from 'react';

export default function FuelModal({ vehicles, onClose, onSubmit }) {
  const [form, setForm] = useState({ 
    vehicleId: vehicles[0]?.id || '', 
    date: new Date().toISOString().split('T')[0], 
    odometer: '', 
    liters: '', 
    total: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <h3>Registrar Carga</h3>
          <label>Vehículo</label>
          <select value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <label>Odómetro (km)</label>
          <input type="number" required value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} />
          <label>Litros</label>
          <input type="number" step="0.01" required value={form.liters} onChange={e => setForm({...form, liters: e.target.value})} />
          <label>Total ($)</label>
          <input type="number" required value={form.total} onChange={e => setForm({...form, total: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn-primary" style={{ background: '#cbd5e1' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Carga</button>
          </div>
        </form>
      </div>
    </div>
  );
}
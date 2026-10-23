/*
  Nombre del archivo: ExpenseModal.jsx
  Propósito: Componente modal para registrar nuevos gastos operativos de los vehículos, 
  permitiendo clasificar el gasto por categoría (TAG, mantención, seguro) e ingresar el monto.
*/

import React, { useState } from 'react';

export default function ExpenseModal({ vehicles, onClose, onSubmit }) {
  const [form, setForm] = useState({ 
    vehicleId: vehicles[0]?.id || '', 
    category: 'TAG', 
    date: new Date().toISOString().split('T')[0], 
    description: '', 
    amount: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <h3>Nuevo Gasto Operativo</h3>
          <label>Vehículo</label>
          <select value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <label>Categoría</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="TAG">TAG / Peajes</option>
            <option value="Mantención">Mantención</option>
            <option value="Seguro">Seguro</option>
          </select>
          <label>Descripción</label>
          <input required value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <label>Monto ($)</label>
          <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn-primary" style={{ background: '#cbd5e1' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Gasto</button>
          </div>
        </form>
      </div>
    </div>
  );
}
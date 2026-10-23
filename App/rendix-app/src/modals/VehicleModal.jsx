/*
  Nombre del archivo: VehicleModal.jsx
  Propósito: Componente modal que contiene el formulario interactivo para registrar 
  un nuevo vehículo en la plataforma (capturando nombre, marca, modelo, año y odómetro inicial).
*/

import React, { useState } from 'react';

export default function VehicleModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', brand: '', model: '', year: 2022, currentKm: '' });

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <h3>Nuevo Vehículo</h3>
          <label>Nombre / Alias</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <label>Marca</label>
          <input required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
          <label>Modelo</label>
          <input required value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
          <label>Odómetro (km)</label>
          <input type="number" required value={form.currentKm} onChange={e => setForm({...form, currentKm: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn-primary" style={{ background: '#cbd5e1' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
/*
  Nombre del archivo: VehicleModal.jsx
  Propósito: Modal para la creación y edición de vehículos con soporte para patente,
  catálogo global, alias, año y kilometraje.
*/

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function VehicleModal({ onClose, onSubmit, editingVehicle }) {
  const [globalCatalog, setGlobalCatalog] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    currentKm: '',
    plate: ''
  });

  const [presetSelection, setPresetSelection] = useState('');
  const [isCustomVehicle, setIsCustomVehicle] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar catálogo global desde Supabase
  useEffect(() => {
    fetchGlobalCatalog();
  }, []);

  const fetchGlobalCatalog = async () => {
    const { data, error } = await supabase
      .from('global_vehicles')
      .select('*')
      .order('brand', { ascending: true });

    if (!error && data) {
      setGlobalCatalog(data);
    }
  };

  // Cargar datos si se está editando un vehículo existente
  useEffect(() => {
    if (editingVehicle) {
      setForm({
        id: editingVehicle.id,
        name: editingVehicle.name || '',
        brand: editingVehicle.brand || '',
        model: editingVehicle.model || '',
        year: editingVehicle.year || new Date().getFullYear(),
        currentKm: editingVehicle.currentKm || '',
        plate: editingVehicle.plate && editingVehicle.plate !== 'SIN PATENTE' ? editingVehicle.plate : ''
      });

      const match = globalCatalog.find(
        v => v.brand.toLowerCase() === (editingVehicle.brand || '').toLowerCase() &&
             v.model.toLowerCase() === (editingVehicle.model || '').toLowerCase()
      );

      if (match) {
        setPresetSelection(match.id);
        setIsCustomVehicle(false);
      } else {
        setPresetSelection('custom');
        setIsCustomVehicle(true);
      }
    }
  }, [editingVehicle, globalCatalog]);

  const handlePresetChange = (e) => {
    const value = e.target.value;
    setPresetSelection(value);

    if (value === 'custom') {
      setIsCustomVehicle(true);
      setForm(prev => ({ ...prev, brand: '', model: '' }));
    } else {
      setIsCustomVehicle(false);
      const selected = globalCatalog.find(v => v.id === value);
      if (selected) {
        setForm(prev => ({
          ...prev,
          brand: selected.brand,
          model: selected.model
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let globalVehicleId = presetSelection !== 'custom' ? presetSelection : null;

    // Si es un vehículo personalizado, agregarlo a la lista global primero
    if (isCustomVehicle) {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data: newGlobal, error: globalErr } = await supabase
        .from('global_vehicles')
        .insert([{ brand: form.brand, model: form.model, created_by: userId }])
        .select()
        .single();

      if (!globalErr && newGlobal) {
        globalVehicleId = newGlobal.id;
      }
    }

    await onSubmit({
      ...form,
      global_vehicle_id: globalVehicleId,
      year: Number(form.year),
      currentKm: Number(form.currentKm),
      plate: form.plate ? form.plate.trim().toUpperCase() : 'SIN PATENTE'
    });

    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
        width: '100%', maxWidth: '460px', color: '#f8fafc', overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            🚗 {form.id ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Alias / Nombre corto *</label>
            <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: El Rojito" style={inputStyle} />
          </div>

          {/* Campo Patente */}
          <div>
            <label style={{ ...labelStyle, color: '#38bdf8' }}>Patente *</label>
            <input 
              required 
              type="text" 
              value={form.plate} 
              onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })} 
              placeholder="Ej: ABCD-12" 
              style={{ ...inputStyle, borderColor: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }} 
            />
          </div>

          <div>
            <label style={labelStyle}>Vehículo (Catálogo Global) *</label>
            <select value={presetSelection} onChange={handlePresetChange} required={!isCustomVehicle} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" disabled>-- Selecciona un modelo --</option>
              {globalCatalog.map((v) => (
                <option key={v.id} value={v.id} style={{ background: '#1e293b' }}>
                  {v.brand} {v.model}
                </option>
              ))}
              <option value="custom" style={{ background: '#1e293b', color: '#818cf8', fontWeight: 'bold' }}>
                ✏️ Otro / Agregar nuevo modelo
              </option>
            </select>
          </div>

          {isCustomVehicle && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Marca</label>
                <input required type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Ej: MG" style={inputStyle} />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Modelo</label>
                <input required type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Ej: GT" style={inputStyle} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Año *</label>
              <input required type="number" min="1950" max={new Date().getFullYear() + 1} value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Odómetro (km) *</label>
              <input required type="number" min="0" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: e.target.value })} placeholder="45000" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
import React, { useState } from 'react';

export default function FuelModal({ vehicles = [], onClose, onSubmit }) {
  const [form, setForm] = useState({
    vehicle_id: vehicles.length > 0 ? vehicles[0].id : '',
    date: new Date().toISOString().split('T')[0],
    odometer: vehicles.length > 0 ? (vehicles[0].currentKm || '') : '',
    fuel_type: '95',
    station: '',
    liters: '',
    total: ''
  });

  const handleVehicleChange = (vId) => {
    const selected = vehicles.find(v => v.id === vId);
    setForm(prev => ({
      ...prev,
      vehicle_id: vId,
      odometer: selected ? (selected.currentKm || '') : prev.odometer
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.liters || !form.total) return;
    onSubmit(form);
  };

  const litersNum = Number(form.liters || 0);
  const totalNum = Number(form.total || 0);
  const estimatedPricePerLiter = (litersNum > 0 && totalNum > 0) ? Math.round(totalNum / litersNum) : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#1e293b',
        padding: '24px',
        borderRadius: '12px',
        width: '460px',
        maxWidth: '90%',
        border: '1px solid #334155',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⛽</span> Registrar Carga de Bencina
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vehículo *</label>
            <select
              value={form.vehicle_id}
              onChange={(e) => handleVehicleChange(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plate})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Fecha *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Odómetro (km) *</label>
              <input
                type="number"
                placeholder="ej: 12000"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tipo / Octanaje *</label>
              <select
                value={form.fuel_type}
                onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              >
                <option value="93">Gasolina 93</option>
                <option value="95">Gasolina 95</option>
                <option value="97">Gasolina 97</option>
                <option value="diesel">Diésel</option>
                <option value="kerosene">Kerosene</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Estación / Marca</label>
              <input
                type="text"
                placeholder="Ej: Copec, Shell, JLC"
                value={form.station}
                onChange={(e) => setForm({ ...form, station: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Litros *</label>
              <input
                type="number"
                step="0.01"
                placeholder="ej: 35.5"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Monto Total ($) *</label>
              <input
                type="number"
                placeholder="ej: 45000"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Precio estimado por litro: </span>
            <strong style={{ color: '#38bdf8' }}>
              {estimatedPricePerLiter > 0 ? `$${estimatedPricePerLiter.toLocaleString('es-CL')} / L` : '$0 / L'}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Guardar Carga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
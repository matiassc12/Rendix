/*
  Nombre del archivo: VehicleModal.jsx
  Propósito: Formulario modal para crear y editar vehículos con soporte para patentes,
  cálculo automático de PRT y vista previa de fotografía del vehículo.
*/

import React, { useState, useEffect } from 'react';
import { getPrtInfoByPlate, validateChileanPlate } from '../utils/patentHelper';

export default function VehicleModal({ editingVehicle = null, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    id: editingVehicle?.id || null,
    name: editingVehicle?.name || '',
    brand: editingVehicle?.brand || '',
    model: editingVehicle?.model || '',
    year: editingVehicle?.year || new Date().getFullYear(),
    currentKm: editingVehicle?.currentKm || 0,
    plate: editingVehicle?.plate || '',
    image_url: editingVehicle?.image_url || ''
  });

  const [plateAnalysis, setPlateAnalysis] = useState(null);

  useEffect(() => {
    if (formData.plate.trim().length >= 4) {
      const prtInfo = getPrtInfoByPlate(formData.plate);
      const validation = validateChileanPlate(formData.plate);
      setPlateAnalysis({ ...validation, prtInfo });
    } else {
      setPlateAnalysis(null);
    }
  }, [formData.plate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'plate' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
        padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column', gap: '18px', boxSizing: 'border-box',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: '800' }}>
            {formData.id ? '✏️ Editar Vehículo' : '🚗 Registrar Nuevo Vehículo'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>NOMBRE / APODO</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej: Camioneta Bast, Motito Blanca, Rojito"
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>MARCA</label>
              <input
                type="text"
                name="brand"
                required
                placeholder="Ej: Haval, Loncin, Ford"
                value={formData.brand}
                onChange={handleChange}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>MODELO</label>
              <input
                type="text"
                name="model"
                required
                placeholder="Ej: Jolion, CR3, F-150"
                value={formData.model}
                onChange={handleChange}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>AÑO</label>
              <input
                type="number"
                name="year"
                required
                value={formData.year}
                onChange={handleChange}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>ODÓMETRO ACTUAL (KM)</label>
              <input
                type="number"
                name="currentKm"
                required
                value={formData.currentKm}
                onChange={handleChange}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>PATENTE (AUTO O MOTO CHILE)</label>
            <input
              type="text"
              name="plate"
              required
              placeholder="Ej: VDBD55, VBY38"
              value={formData.plate}
              onChange={handleChange}
              maxLength={7}
              style={{
                width: '100%',
                background: '#0f172a',
                border: `1px solid ${plateAnalysis ? (plateAnalysis.isValid ? '#22c55e' : '#ef4444') : '#334155'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#f8fafc',
                fontWeight: '800',
                letterSpacing: '1px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {plateAnalysis && (
              <div style={{ marginTop: '6px', fontSize: '12px' }}>
                {plateAnalysis.isValid ? (
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 10px', borderRadius: '6px', color: '#4ade80' }}>
                    ✅ <strong>Patente válida</strong> ({plateAnalysis.format})
                    {plateAnalysis.prtInfo && (
                      <span style={{ display: 'block', marginTop: '2px', color: '#cbd5e1' }}>
                        📋 PRT Obligatoria: <strong>{plateAnalysis.prtInfo.monthName}</strong>
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#ef4444', fontWeight: '600' }}>⚠️ Formato no reconocido.</div>
                )}
              </div>
            )}
          </div>

          {/* CAMPO NUEVO: URL DE LA FOTOGRAFÍA */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>FOTO DEL VEHÍCULO (URL / ENLACE DE IMAGEN)</label>
            <input
              type="url"
              name="image_url"
              placeholder="Ej: https://imagenes.com/mi-auto.jpg"
              value={formData.image_url}
              onChange={handleChange}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
            />
            
            {/* Previsualización en vivo dentro del modal */}
            {formData.image_url && (
              <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', height: '110px', border: '1px solid #334155', background: '#0f172a' }}>
                <img 
                  src={formData.image_url} 
                  alt="Vista previa" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ background: '#334155', color: '#f8fafc', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Guardar Vehículo</button>
          </div>

        </form>
      </div>
    </div>
  );
}
/*
  Nombre del archivo: DocumentsView.jsx
  Propósito: Vista Guantera Digital para administrar fechas límite de documentos por vehículo.
  Saneamiento de texto vacío a null para evitar HTTP 400 en Postgres/Supabase.
*/

import React, { useState } from 'react';

export default function DocumentsView({ vehicles = [], onSaveDocuments }) {
  const [docForms, setDocForms] = useState({});

  const handleDateChange = (vehicleId, field, value) => {
    setDocForms(prev => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] || {}),
        [field]: value
      }
    }));
  };

  // Convierte cadenas vacías ("") a null para que Supabase las acepte en campos DATE
  const cleanDate = (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '') return null;
    return val;
  };

  const handleSave = (vehicle) => {
    const currentData = docForms[vehicle.id] || {};

    const rawSoap = currentData.soap_expiration !== undefined ? currentData.soap_expiration : vehicle.soap_expiration;
    const rawPermiso = currentData.permiso_circulacion_expiration !== undefined ? currentData.permiso_circulacion_expiration : vehicle.permiso_circulacion_expiration;
    const rawRevision = currentData.revision_tecnica_expiration !== undefined ? currentData.revision_tecnica_expiration : vehicle.revision_tecnica_expiration;
    const rawSeguro = currentData.seguro_privado_expiration !== undefined ? currentData.seguro_privado_expiration : vehicle.seguro_privado_expiration;
    const rawLicencia = currentData.licencia_conducir_expiration !== undefined ? currentData.licencia_conducir_expiration : vehicle.licencia_conducir_expiration;

    const payload = {
      soap_expiration: cleanDate(rawSoap),
      permiso_circulacion_expiration: cleanDate(rawPermiso),
      revision_tecnica_expiration: cleanDate(rawRevision),
      seguro_privado_expiration: cleanDate(rawSeguro),
      licencia_conducir_expiration: cleanDate(rawLicencia)
    };

    onSaveDocuments(vehicle.id, payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>📁 Guantera Digital</h2>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Configura los vencimientos legales para recibir alertas preventivas oportunas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {vehicles.map(v => {
          const formData = docForms[v.id] || {};

          return (
            <div key={v.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              {/* Banner visual con foto del vehículo */}
              <div style={{ position: 'relative', height: '110px', background: '#0f172a' }}>
                {v.image_url ? (
                  <img src={v.image_url} alt={v.name} onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', opacity: 0.5 }}>📁</div>
                )}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(30,41,59,0.95) 100%)' }} />
                <div style={{ position: 'absolute', bottom: '12px', left: '16px' }}>
                  <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '900' }}>{v.name}</h4>
                  <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '700' }}>{v.plate || 'Sin Patente'}</span>
                </div>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>REVISIÓN TÉCNICA (PRT)</label>
                  <input
                    type="date"
                    value={formData.revision_tecnica_expiration !== undefined ? formData.revision_tecnica_expiration : (v.revision_tecnica_expiration || '')}
                    onChange={(e) => handleDateChange(v.id, 'revision_tecnica_expiration', e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>PERMISO DE CIRCULACIÓN</label>
                  <input
                    type="date"
                    value={formData.permiso_circulacion_expiration !== undefined ? formData.permiso_circulacion_expiration : (v.permiso_circulacion_expiration || '')}
                    onChange={(e) => handleDateChange(v.id, 'permiso_circulacion_expiration', e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>SEGURO OBLIGATORIO (SOAP)</label>
                  <input
                    type="date"
                    value={formData.soap_expiration !== undefined ? formData.soap_expiration : (v.soap_expiration || '')}
                    onChange={(e) => handleDateChange(v.id, 'soap_expiration', e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>SEGURO PRIVADO</label>
                  <input
                    type="date"
                    value={formData.seguro_privado_expiration !== undefined ? formData.seguro_privado_expiration : (v.seguro_privado_expiration || '')}
                    onChange={(e) => handleDateChange(v.id, 'seguro_privado_expiration', e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  onClick={() => handleSave(v)}
                  style={{ marginTop: '8px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                >
                  💾 Guardar Cambios Guantera
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
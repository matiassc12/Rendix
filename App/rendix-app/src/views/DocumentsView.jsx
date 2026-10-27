/*
  Nombre del archivo: DocumentsView.jsx
  Propósito: "Guantera Digital" con sistema de navegación por pestañas (tabs) 
  para gestionar las fechas de vencimiento de cada vehículo.
*/

import React, { useState, useEffect } from 'react';

export default function DocumentsView({ vehicles = [], onSaveDocuments }) {
  const [editStates, setEditStates] = useState({});
  const [activeVehicleId, setActiveVehicleId] = useState(null);

  // Seleccionar automáticamente el primer vehículo al cargar
  useEffect(() => {
    if (vehicles.length > 0 && !activeVehicleId) {
      setActiveVehicleId(vehicles[0].id);
    }
  }, [vehicles, activeVehicleId]);

  const getPRTMonth = (plate) => {
    if (!plate || plate === 'SIN PATENTE') return 'No calculado';
    const numbers = plate.match(/\d/g);
    if (!numbers) return 'No calculado';
    
    const prtMonths = {
      '0': 'Febrero', '1': 'Abril', '2': 'Mayo', '3': 'Junio',
      '4': 'Julio', '5': 'Agosto', '6': 'Septiembre', '7': 'Octubre',
      '8': 'Noviembre', '9': 'Enero'
    };
    return prtMonths[numbers[numbers.length - 1]] || 'No calculado';
  };

  const getDocumentStatus = (expirationDate) => {
    if (!expirationDate) return { text: 'Sin configurar', color: '#94a3b8', bg: '#1e293b', border: '#334155' };
    const diffDays = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Vencido', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
    if (diffDays <= 30) return { text: `Vence en ${diffDays} días`, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)' };
    return { text: 'Al día', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
  };

  const handleDateChange = (vehicleId, docField, value) => {
    setEditStates(prev => ({ ...prev, [vehicleId]: { ...prev[vehicleId], [docField]: value } }));
  };

  const handleSave = (vehicle) => {
    const updatedDocs = editStates[vehicle.id] || {};
    if (onSaveDocuments && Object.keys(updatedDocs).length > 0) {
      onSaveDocuments(vehicle.id, updatedDocs);
    }
  };

  const documentTypes = [
    { key: 'revision_tecnica_expiration', label: 'Revisión Técnica', icon: '🔍' },
    { key: 'permiso_circulacion_expiration', label: 'Permiso de Circulación', icon: '📄' },
    { key: 'soap_expiration', label: 'Seguro Obligatorio (SOAP)', icon: '🏥' },
    { key: 'seguro_privado_expiration', label: 'Seguro Automotriz Privado', icon: '🛡️' },
    { key: 'licencia_conducir_expiration', label: 'Licencia de Conducir', icon: '🪪' }
  ];

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', color: '#f8fafc', fontWeight: '800' }}>🗂️ Guantera Digital</h2>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Control de vencimientos por vehículo. El mes de PRT es autocalculado.</p>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No hay vehículos registrados para gestionar documentos.
        </div>
      ) : (
        <>
          {/* Navegación por Pestañas (Tabs) */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveVehicleId(v.id)}
                style={{
                  background: activeVehicleId === v.id ? '#3b82f6' : '#1e293b',
                  color: activeVehicleId === v.id ? '#ffffff' : '#94a3b8',
                  border: activeVehicleId === v.id ? 'none' : '1px solid #334155',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: activeVehicleId === v.id ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {v.name} ({v.plate || 'Sin Patente'})
              </button>
            ))}
          </div>

          {/* Contenido de la Pestaña Activa */}
          {activeVehicle && (
            <div style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
              padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#f8fafc', fontWeight: '800' }}>
                    Documentos de {activeVehicle.name}
                  </h3>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                    PRT Estimada: <strong style={{ color: '#38bdf8' }}>{getPRTMonth(activeVehicle.plate)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => handleSave(activeVehicle)}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#ffffff',
                    border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  💾 Guardar Fechas
                </button>
              </div>

              {/* Lista de Documentos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documentTypes.map(doc => {
                  const currentEdits = editStates[activeVehicle.id] || {};
                  const displayValue = currentEdits[doc.key] !== undefined ? currentEdits[doc.key] : (activeVehicle[doc.key] || '');
                  const status = getDocumentStatus(displayValue);

                  return (
                    <div key={doc.key} style={{
                      background: '#0f172a', border: `1px solid ${status.border}`, borderRadius: '10px',
                      padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '16px', flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '24px' }}>{doc.icon}</span>
                        <div>
                          <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '700' }}>{doc.label}</div>
                          <div style={{ fontSize: '12px', color: status.color, fontWeight: '800', marginTop: '4px', padding: '2px 8px', background: status.bg, borderRadius: '4px', display: 'inline-block' }}>
                            {status.text}
                          </div>
                        </div>
                      </div>

                      <input 
                        type="date" 
                        value={displayValue}
                        onChange={(e) => handleDateChange(activeVehicle.id, doc.key, e.target.value)}
                        style={{
                          background: '#1e293b', border: '1px solid #334155', color: '#f8fafc',
                          padding: '10px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                          outline: 'none', cursor: 'pointer', colorScheme: 'dark'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
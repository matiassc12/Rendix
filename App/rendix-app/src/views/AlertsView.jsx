/*
  Nombre del archivo: AlertsView.jsx
  Propósito: Muestra el estado mecánico, la última fecha/km registrado de mantención y documentos legales.
*/

import React from 'react';

export default function AlertsView({ vehicles = [], openServiceModal }) {

  // Función para evaluar los documentos de un vehículo
  const getDocumentAlerts = (vehicle) => {
    const docsList = [
      { key: 'revision_tecnica_expiration', label: 'Revisión Técnica' },
      { key: 'permiso_circulacion_expiration', label: 'Permiso de Circulación' },
      { key: 'soap_expiration', label: 'Seguro SOAP' },
      { key: 'seguro_privado_expiration', label: 'Seguro Privado' },
      { key: 'licencia_conducir_expiration', label: 'Licencia de Conducir' }
    ];

    let alerts = [];
    docsList.forEach(doc => {
      const dateStr = vehicle[doc.key];
      if (dateStr) {
        const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          alerts.push({ label: doc.label, status: 'Vencido', color: '#ef4444' });
        } else if (diffDays <= 30) {
          alerts.push({ label: doc.label, status: `Vence en ${diffDays} días`, color: '#eab308' });
        }
      }
    });
    return alerts;
  };

  const processAlerts = (vehicle) => {
    const currentKm = Number(vehicle.currentKm || 0);
    const lastServiceKm = Number(vehicle.last_service_km || 0);
    const intervalKm = 10000;

    const nextServiceKm = lastServiceKm > 0 ? lastServiceKm + intervalKm : Math.ceil((currentKm + 1) / intervalKm) * intervalKm;
    const remainingKm = nextServiceKm - currentKm;
    
    const kmSinceLastService = currentKm - lastServiceKm;
    let progressPercent = lastServiceKm > 0 ? Math.min(Math.max((kmSinceLastService / intervalKm) * 100, 0), 100) : 0;

    let statusText = 'Al día / Óptimo';
    let statusBg = 'rgba(34, 197, 94, 0.15)';
    let statusColor = '#22c55e';
    let borderCol = 'rgba(34, 197, 94, 0.3)';
    let progressBarColor = '#22c55e';

    if (lastServiceKm > 0 && remainingKm <= 0) {
      statusText = '¡Urgente / Vencido!';
      statusBg = 'rgba(239, 68, 68, 0.15)';
      statusColor = '#ef4444';
      borderCol = 'rgba(239, 68, 68, 0.3)';
      progressBarColor = '#ef4444';
      progressPercent = 100;
    } else if (lastServiceKm > 0 && remainingKm <= 1500) {
      statusText = 'Próximo a vencer';
      statusBg = 'rgba(234, 179, 8, 0.15)';
      statusColor = '#eab308';
      borderCol = 'rgba(234, 179, 8, 0.3)';
      progressBarColor = '#eab308';
    }

    // Formatear la fecha de última mantención si existe
    let formattedLastService = 'No registrada';
    if (vehicle.last_service_date && lastServiceKm > 0) {
      const [year, month, day] = vehicle.last_service_date.split('-');
      formattedLastService = `${day}/${month}/${year} - ${lastServiceKm.toLocaleString('es-CL')} km`;
    }

    const docAlerts = getDocumentAlerts(vehicle);

    return {
      currentKm,
      formattedLastService,
      nextServiceKm,
      remainingKm,
      progressPercent,
      statusText,
      statusBg,
      statusColor,
      borderCol,
      progressBarColor,
      docAlerts
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', color: '#f8fafc', fontWeight: '800' }}>🚨 Alertas y Mantención Preventiva</h2>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Control de registros mecánicos y vencimientos legales de tu flota.</p>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No hay vehículos registrados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {vehicles.map(v => {
            const data = processAlerts(v);

            return (
              <div key={v.id} style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
                padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    {v.plate || 'SIN PATENTE'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                    {v.brand} {v.model} ({v.year})
                  </span>
                </div>

                <h3 style={{ margin: 0, fontSize: '20px', color: '#f8fafc', fontWeight: '800' }}>{v.name}</h3>

                {/* Alertas Legales */}
                {data.docAlerts.length > 0 && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase' }}>⚠️ Alertas Legales:</span>
                    {data.docAlerts.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#cbd5e1' }}>• {doc.label}</span>
                        <strong style={{ color: doc.color, background: 'rgba(15, 23, 42, 0.4)', padding: '2px 8px', borderRadius: '6px' }}>{doc.status}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Métricas clave */}
                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#94a3b8' }}>Odómetro Actual:</span>
                    <strong style={{ color: '#f8fafc' }}>{data.currentKm.toLocaleString('es-CL')} km</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#94a3b8' }}>Última Mantención:</span>
                    <strong style={{ color: '#38bdf8' }}>{data.formattedLastService}</strong>
                  </div>
                </div>

                {/* Botón para abrir el modal de registro */}
                <button
                  onClick={() => openServiceModal(v)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff',
                    border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '13px',
                    fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <span>⚙️ Registrar Nueva Mantención</span>
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
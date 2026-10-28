/*
  Nombre del archivo: AlertsView.jsx
  Propósito: Panel de control de alertas mecánicas y vencimientos legales con fotos de los vehículos.
*/

import React from 'react';

export default function AlertsView({ vehicles = [], openServiceModal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>🚨 Panel de Alertas Mantenimiento y Legales</h2>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Monitorea el desgaste de fluidos/filtros y vencimientos de documentos en tiempo real.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {vehicles.map(v => {
          const currentKm = Number(v.currentKm || 0);
          const lastServiceKm = Number(v.last_service_km || 0);
          const intervalKm = 10000;
          const nextServiceKm = lastServiceKm > 0 ? lastServiceKm + intervalKm : Math.ceil((currentKm + 1) / intervalKm) * intervalKm;
          const remainingKm = nextServiceKm - currentKm;
          const progress = Math.min(100, Math.max(0, ((intervalKm - remainingKm) / intervalKm) * 100));

          const docs = [
            { name: 'SOAP', date: v.soap_expiration },
            { name: 'Permiso de Circulación', date: v.permiso_circulacion_expiration },
            { name: 'Revisión Técnica', date: v.revision_tecnica_expiration },
            { name: 'Seguro Privado', date: v.seguro_privado_expiration },
            { name: 'Licencia de Conducir', date: v.licencia_conducir_expiration }
          ];

          return (
            <div key={v.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              {/* Cabecera con foto del vehículo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
                {v.image_url ? (
                  <img 
                    src={v.image_url} 
                    alt={v.name} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                    style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #334155', flexShrink: 0 }} 
                  />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    🚗
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '800' }}>{v.name}</h4>
                  <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '700' }}>{v.plate || 'Sin Patente'}</span>
                </div>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Mantenimiento Aceite */}
                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ color: '#cbd5e1' }}>🔧 Mantención Aceite/Filtros</span>
                    <span style={{ color: remainingKm <= 0 ? '#ef4444' : remainingKm <= 1500 ? '#eab308' : '#4ade80' }}>
                      {remainingKm <= 0 ? '¡VENCIDO!' : `${remainingKm.toLocaleString('es-CL')} km restantes`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: remainingKm <= 0 ? '#ef4444' : remainingKm <= 1500 ? '#eab308' : '#22c55e', transition: 'width 0.3s' }} />
                  </div>
                  <button
                    onClick={() => openServiceModal(v)}
                    style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    + Registrar Mantención Hecha
                  </button>
                </div>

                {/* Documentos Legales */}
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Guantera Digital (Vencimientos)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {docs.map((doc, idx) => {
                      if (!doc.date) return null;
                      const diffDays = Math.ceil((new Date(doc.date) - new Date()) / (1000 * 60 * 60 * 24));
                      const isExpired = diffDays < 0;
                      const isWarning = diffDays >= 0 && diffDays <= 30;

                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 10px', background: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }}>
                          <span style={{ color: '#cbd5e1' }}>{doc.name}</span>
                          <span style={{ fontWeight: '700', color: isExpired ? '#ef4444' : isWarning ? '#eab308' : '#22c55e' }}>
                            {isExpired ? `Vencido (${doc.date})` : isWarning ? `Vence en ${diffDays} días` : doc.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/*
  Nombre del archivo: AlertsView.jsx
  Propósito: Muestra el sistema de alertas preventivas para las mantenciones periódicas 
  de los vehículos, calculando automáticamente los kilómetros restantes en función del odómetro.
*/

import React from 'react';

export default function AlertsView({ vehicles }) {
  return (
    <div>
      <h2>Alertas de Mantención</h2>
      <div className="stats-grid" style={{ marginTop: '16px' }}>
        {vehicles.map(v => {
          const nextMaint = Math.ceil(v.currentKm / 10000) * 10000;
          const remaining = nextMaint - v.currentKm;
          return (
            <div key={v.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <strong>{v.name}</strong>
              <p style={{ marginTop: '8px' }}>Odómetro: {v.currentKm.toLocaleString()} km</p>
              <p style={{ marginTop: '4px' }}>Faltan <strong>{remaining.toLocaleString()} km</strong> para mantención</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
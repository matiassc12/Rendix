/*
  Nombre del archivo: VehiclesView.jsx
  Propósito: Vista encargada de listar los vehículos registrados en el sistema, 
  permitiendo visualizar su marca, modelo, odómetro actual y opción de eliminación.
*/

import React from 'react';

export default function VehiclesView({ vehicles, deleteVehicle, openModal }) {
  return (
    <div>
      <div className="header-title">
        <div>
          <h2>Gestión de Vehículos</h2>
          <p>Administra los automóviles registrados.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('vehicle')}>+ Agregar Vehículo</button>
      </div>
      <div className="stats-grid">
        {vehicles.map(v => (
          <div key={v.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              <strong>{v.name}</strong>
              <button className="btn-danger" onClick={() => deleteVehicle(v.id)}>🗑️</button>
            </div>
            <p>{v.brand} {v.model} ({v.year})</p>
            <p>Odómetro: <strong>{v.currentKm.toLocaleString('es-CL')} km</strong></p>
          </div>
        ))}
      </div>
    </div>
  );
}
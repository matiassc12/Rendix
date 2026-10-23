/*
  Nombre del archivo: FuelView.jsx
  Propósito: Muestra el historial detallado de cargas de combustible realizadas, 
  incluyendo litros cargados, costo total y el rendimiento calculado en kilómetros por litro.
*/

import React from 'react';

export default function FuelView({ fuelRecords, vehicles, openModal }) {
  return (
    <div>
      <div className="header-title">
        <div>
          <h2>Cargas de Combustible</h2>
          <p>Historial y rendimiento automático.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('fuel')}>+ Registrar Carga</button>
      </div>
      <div className="card-box">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Litros</th>
              <th>Total</th>
              <th>Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            {fuelRecords.map(f => {
              const veh = vehicles.find(v => v.id === f.vehicleId);
              return (
                <tr key={f.id}>
                  <td>{f.date}</td>
                  <td>{veh?.name}</td>
                  <td>{f.liters} L</td>
                  <td>${Number(f.total).toLocaleString('es-CL')}</td>
                  <td><strong>{f.kmPerLiter} km/l</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
/*
  Nombre del archivo: MapView.jsx
  Propósito: Renderiza un mapa interactivo utilizando Leaflet. Muestra la ubicación 
  de las estaciones de servicio, destaca visualmente la estación más barata cercana 
  según el filtro de combustible y permite ver detalles al hacer clic en los marcadores.
*/

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Corrección de íconos por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Coordenadas simuladas o reales para las estaciones (agregando lat/lng a las estaciones de Santiago/Chile)
export default function MapView({ stations, fuelType }) {
  // Coordenadas iniciales centradas en Santiago, Chile
  const positionCenter = [-33.4489, -70.6693];

  // Identificar la estación más barata para el combustible actual
  const validStations = stations.filter(s => s.p95); // Asegurar que tengan precio
  const keyPrice = fuelType === 'diesel' ? 'diesel' : 'p' + fuelType;
  
  let cheapestStation = null;
  if (validStations.length > 0) {
    cheapestStation = validStations.reduce((min, curr) => (curr[keyPrice] < min[keyPrice] ? curr : min), validStations[0]);
  }

  // Generar coordenadas aproximadas basadas en la comuna para el ejemplo visual del mapa
  const getCoordinates = (commune) => {
    const coords = {
      'provi': [-33.432, -70.612],
      'santi': [-33.448, -70.650],
      'uñoa': [-33.456, -70.603],
      'condes': [-33.411, -70.578],
      'macul': [-33.483, -70.598],
      'maipú': [-33.510, -70.758],
      'florida': [-33.523, -70.599],
      'bernardo': [-33.593, -70.702],
      'vitacura': [-33.395, -70.574],
      'valpara': [-33.047, -71.612],
      'viña': [-33.024, -71.551],
      'concep': [-36.826, -73.049],
      'antof': [-23.652, -70.395],
      'temuco': [-38.735, -72.590],
      'puerto': [-41.469, -72.942]
    };
    
    for (let key in coords) {
      if (commune.toLowerCase().includes(key)) return coords[key];
    }
    return [-33.4489 + (Math.random() - 0.5) * 0.1, -70.6693 + (Math.random() - 0.5) * 0.1]; // Coordenada aleatoria cercana si no coincide
  };

  return (
    <div className="card-box" style={{ padding: '16px', height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>🗺️ Mapa Interactivo de Precios</h3>
        {cheapestStation && (
          <span style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
            🔥 Opción más económica: {cheapestStation.name} (${cheapestStation[keyPrice]} /L)
          </span>
        )}
      </div>

      <div style={{ flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <MapContainer center={positionCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stations.map(s => {
            const coords = getCoordinates(s.commune);
            const price = s[keyPrice];
            const isCheapest = cheapestStation && cheapestStation.id === s.id;

            return (
              <Marker key={s.id} position={coords}>
                <Popup>
                  <div style={{ minWidth: '160px' }}>
                    <strong style={{ color: '#0f172a' }}>{s.name}</strong>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 6px 0' }}>Comuna: {s.commune}</p>
                    <p style={{ fontSize: '14px', color: '#4f46e5', fontWeight: 'bold' }}>
                      ${price ? price.toLocaleString('es-CL') : 'N/D'} <span style={{ fontSize: '11px', color: '#94a3b8' }}>/litro</span>
                    </p>
                    {isCheapest && (
                      <span style={{ display: 'block', background: '#059669', color: 'white', textAlign: 'center', fontSize: '10px', padding: '2px', borderRadius: '4px', marginTop: '4px' }}>
                        ¡La más barata!
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
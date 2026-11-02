/*
  Nombre del archivo: TripView.jsx
  Propósito: Cotizador de viajes y servicios de flete integrando Leaflet y cálculo operativo.
*/

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function TripView({ vehicles, fuelRecords }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [fuelPrice, setFuelPrice] = useState(1320);
  const [tolls, setTolls] = useState(3500);
  const [maintenanceReserve, setMaintenanceReserve] = useState(45);
  const [profitMargin, setProfitMargin] = useState(35);
  const [distanceKm, setDistanceKm] = useState(25.0);
  const [clickStep, setClickStep] = useState(0); // 0: esperando origen, 1: esperando destino

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerOriginRef = useRef(null);
  const markerDestRef = useRef(null);
  const polylineRef = useRef(null);

  const [coords, setCoords] = useState({
    origin: null,
    dest: null
  });

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Estimar rendimiento (km/L) del vehículo seleccionado
  const getVehicleKmPerLiter = () => {
    if (!selectedVehicle) return 10;
    const vFuels = fuelRecords.filter(f => (f.vehicle_id || f.vehicleId) === selectedVehicle.id);
    if (vFuels.length >= 2) {
      const sorted = [...vFuels].sort((a, b) => Number(a.odometer) - Number(b.odometer));
      let totalKm = 0;
      let totalL = 0;
      for (let i = 1; i < sorted.length; i++) {
        const diffKm = Number(sorted[i].odometer) - Number(sorted[i - 1].odometer);
        const l = Number(sorted[i].liters);
        if (diffKm > 0 && l > 0) {
          totalKm += diffKm;
          totalL += l;
        }
      }
      if (totalL > 0) return Number((totalKm / totalL).toFixed(1));
    }
    return 11.5; // Valor por defecto sensato para furgón/camioneta
  };

  const kmPerLiter = getVehicleKmPerLiter();

  // Inicializar Mapa Leaflet
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current).setView([-33.4489, -70.6693], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setClickStep(prev => {
          if (prev === 0) {
            // Settear Origen
            setCoords({ origin: { lat, lng }, dest: null });
            if (markerOriginRef.current) markerOriginRef.current.remove();
            if (markerDestRef.current) markerDestRef.current.remove();
            if (polylineRef.current) polylineRef.current.remove();

            markerOriginRef.current = L.marker([lat, lng], {
              icon: L.divIcon({ className: 'custom-pin origin', html: '📍', iconSize: [30, 30] })
            }).addTo(map);
            return 1;
          } else {
            // Settear Destino y calcular distancia aproximada en línea recta con factor urbano (x1.3)
            setCoords(c => ({ ...c, dest: { lat, lng } }));
            if (markerDestRef.current) markerDestRef.current.remove();

            markerDestRef.current = L.marker([lat, lng], {
              icon: L.divIcon({ className: 'custom-pin dest', html: '🏁', iconSize: [30, 30] })
            }).addTo(map);

            if (coords.origin) {
              const from = L.latLng(coords.origin.lat, coords.origin.lng);
              const to = L.latLng(lat, lng);
              const straightKm = from.distanceTo(to) / 1000;
              const estimatedRoadKm = Math.max(2, Math.round(straightKm * 1.3 * 10) / 10);
              setDistanceKm(estimatedRoadKm);

              polylineRef.current = L.polyline([from, to], { color: '#3b82f6', weight: 4, dashArray: '5, 5' }).addTo(map);
              map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
            }
            return 0;
          }
        });
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords.origin]);

  const handleResetPoints = () => {
    setCoords({ origin: null, dest: null });
    setClickStep(0);
    if (markerOriginRef.current) markerOriginRef.current.remove();
    if (markerDestRef.current) markerDestRef.current.remove();
    if (polylineRef.current) polylineRef.current.remove();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-33.4489, -70.6693], 13);
    }
  };

  // Cálculos financieros del flete
  const litersRequired = distanceKm > 0 ? distanceKm / kmPerLiter : 0;
  const fuelCost = litersRequired * fuelPrice;
  const totalMaintenance = distanceKm * maintenanceReserve;
  const operationalCost = fuelCost + Number(tolls) + totalMaintenance;
  const suggestedRate = operationalCost * (1 + profitMargin / 100);

  return (
    <div className="trip-container">
      <div className="trip-header">
        <h2>🗺️ Cotizador de Viajes y Servicios de Flete</h2>
        <p>Calcula el costo real de operación (bencina + peajes + reserva mecánica) y obtén tu tarifa sugerida con margen comercial.</p>
      </div>

      <div className="trip-grid">
        {/* COLUMNA IZQUIERDA: MAPA Y DISTANCIA */}
        <div className="trip-map-card">
          <div className="map-controls-bar">
            <div className="click-instruction">
              {clickStep === 0 ? '📍 Haz 1er Clic para Origen' : '🏁 Haz 2do Clic para Destino'}
            </div>
            <button onClick={handleResetPoints} className="btn-reset-points">
              Reiniciar Puntos
            </button>
          </div>

          <div ref={mapRef} className="leaflet-map-box" />

          <div className="distance-input-box">
            <label>Distancia Recorrida Estimada (KM):</label>
            <input 
              type="number" 
              step="0.5" 
              value={distanceKm} 
              onChange={(e) => setDistanceKm(Math.max(0, Number(e.target.value)))}
              className="trip-input-highlight"
            />
          </div>
        </div>

        {/* COLUMNA DERECHA: CONFIGURACIÓN Y RESULTADOS */}
        <div className="trip-sidebar-box">
          <div className="trip-form-section">
            <h3>Parámetros de Operación</h3>
            
            <div className="form-group">
              <label>Vehículo de la Flota *</label>
              <select 
                value={selectedVehicleId} 
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="trip-select"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plate || 'Sin Patente'}) - Rend. est: {kmPerLiter} km/L
                  </option>
                ))}
              </select>
            </div>

            <div className="trip-row-inputs">
              <div className="form-group">
                <label>Precio Bencina ($/L)</label>
                <input 
                  type="number" 
                  value={fuelPrice} 
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="trip-input"
                />
              </div>
              <div className="form-group">
                <label>Peajes / TAG ($)</label>
                <input 
                  type="number" 
                  value={tolls} 
                  onChange={(e) => setTolls(Number(e.target.value))}
                  className="trip-input"
                />
              </div>
            </div>

            <div className="trip-row-inputs">
              <div className="form-group">
                <label>Reserva Desgaste ($/km)</label>
                <input 
                  type="number" 
                  value={maintenanceReserve} 
                  onChange={(e) => setMaintenanceReserve(Number(e.target.value))}
                  className="trip-input"
                />
              </div>
              <div className="form-group">
                <label>Margen Ganancia (%)</label>
                <input 
                  type="number" 
                  value={profitMargin} 
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  className="trip-input"
                />
              </div>
            </div>
          </div>

          {/* DESGLOSE DE COSTOS */}
          <div className="trip-results-card">
            <h3>Desglose Financiero</h3>
            
            <div className="result-row">
              <span>Combustible Requerido:</span>
              <strong>{litersRequired.toFixed(1)} Litros</strong>
            </div>
            <div className="result-row">
              <span>Gasto Combustible:</span>
              <strong>${Math.round(fuelCost).toLocaleString('es-CL')}</strong>
            </div>
            <div className="result-row">
              <span>Reserva Mantención / Neumáticos:</span>
              <strong>${Math.round(totalMaintenance).toLocaleString('es-CL')}</strong>
            </div>
            <div className="result-row">
              <span>Peajes y TAG:</span>
              <strong>${Number(tolls).toLocaleString('es-CL')}</strong>
            </div>

            <div className="result-total-box">
              <span>COSTO OPERATIVO REAL:</span>
              <span className="total-amount">${Math.round(operationalCost).toLocaleString('es-CL')}</span>
            </div>

            <div className="result-suggested-box">
              <span>TARIFA SUGERIDA DE FLETE:</span>
              <span className="suggested-amount">${Math.round(suggestedRate).toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
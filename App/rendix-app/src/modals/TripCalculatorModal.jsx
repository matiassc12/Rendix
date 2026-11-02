/*
  Nombre del archivo: TripCalculatorModal.jsx
  Propósito: Calculadora de viajes y cotización de fletes para RendixApp 
  con rendimiento dinámico calculado por vehículo y mapa interactivo Leaflet.
*/

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ origin, setOrigin, setDestination, setDistanceKm }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!origin) {
        setOrigin([lat, lng]);
        setDestination(null);
        setDistanceKm('0.0');
      } else {
        setDestination([lat, lng]);
        const originLatLng = L.latLng(origin);
        const destLatLng = L.latLng(lat, lng);
        const distanceMeters = originLatLng.distanceTo(destLatLng);
        const approxKm = ((distanceMeters / 1000) * 1.25).toFixed(1);
        setDistanceKm(approxKm);
      }
    }
  });
  return null;
}

export default function TripCalculatorModal({ vehicles = [], fuelRecords = [], onClose }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [distanceKm, setDistanceKm] = useState('25.0');
  const [fuelPrice, setFuelPrice] = useState('1320');
  const [tolls, setTolls] = useState('3500');
  const [wearPerKm, setWearPerKm] = useState('45');
  const [marginPercent, setMarginPercent] = useState('35');

  const [origin, setOrigin] = useState([-33.411, -70.578]);
  const [destination, setDestination] = useState([-33.448, -70.650]);

  // FUNCIÓN PARA CALCULAR EL RENDIMIENTO REAL DE CADA VEHÍCULO (km/L)
  const calculateVehicleKmLiter = (vId) => {
    if (!fuelRecords || fuelRecords.length === 0 || !vId) return 10.0; // Valor fallback por defecto si no hay cargas

    const vRecords = fuelRecords.filter(r => (r.vehicle_id || r.vehicleId) === vId);
    if (vRecords.length < 2) {
      // Si sólo tiene 1 carga, intenta estimar con el odómetro actual del vehículo o retorna fallback
      return 10.0;
    }

    const sorted = [...vRecords].sort((a, b) => Number(a.odometer) - Number(b.odometer));
    let totalKmTraveled = 0;
    let totalLitersConsumed = 0;

    for (let i = 1; i < sorted.length; i++) {
      const kmDiff = Number(sorted[i].odometer) - Number(sorted[i - 1].odometer);
      const liters = Number(sorted[i].liters);
      if (kmDiff > 0 && liters > 0) {
        totalKmTraveled += kmDiff;
        totalLitersConsumed += liters;
      }
    }

    if (totalLitersConsumed === 0) return 10.0;
    return Number((totalKmTraveled / totalLitersConsumed).toFixed(1));
  };

  // Rendimiento dinámico del vehículo seleccionado
  const vehicleKmLiter = calculateVehicleKmLiter(selectedVehicleId);

  // CÁLCULOS FINANCIEROS
  const distNum = Number(distanceKm) || 0;
  const priceNum = Number(fuelPrice) || 0;
  const tollsNum = Number(tolls) || 0;
  const wearNum = Number(wearPerKm) || 0;
  const marginNum = Number(marginPercent) || 0;

  const litersNeeded = vehicleKmLiter > 0 ? distNum / vehicleKmLiter : 0;
  const fuelCostTotal = litersNeeded * priceNum;
  const wearCostTotal = distNum * wearNum;
  const directOperatingCost = fuelCostTotal + tollsNum + wearCostTotal;
  const suggestedFreightTariff = directOperatingCost * (1 + marginNum / 100);
  const netProfit = suggestedFreightTariff - directOperatingCost;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '16px'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
        width: '100%', maxWidth: '980px', maxHeight: '92vh', overflowY: 'auto',
        color: '#f8fafc', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', padding: '24px'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗺️</span> Calculadora de Viajes y Cotización de Fletes
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              RendixApp • Desglose transparente de combustible, desgaste y margen comercial.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          
          {/* MAPA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>
                📍 Marca Origen (1er Clic) y Destino (2do Clic)
              </span>
              <button 
                onClick={() => { setOrigin(null); setDestination(null); setDistanceKm('0'); }}
                style={{ background: '#334155', color: '#94a3b8', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              >
                Reiniciar Marcas
              </button>
            </div>

            <div style={{ height: '360px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
              <MapContainer center={[-33.4489, -70.6693]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler 
                  origin={origin} 
                  setOrigin={setOrigin} 
                  setDestination={setDestination} 
                  setDistanceKm={setDistanceKm} 
                />

                {origin && (
                  <Marker position={origin}>
                    <Popup>🟢 Origen del Viaje</Popup>
                  </Marker>
                )}
                {destination && (
                  <Marker position={destination}>
                    <Popup>🔴 Destino del Viaje</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Distancia Calculada / Manual (KM):</label>
              <input
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                style={{ width: '90px', padding: '6px', background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', fontWeight: '800', textAlign: 'center', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* PARÁMETROS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div>
              <label style={labelStyle}>Vehículo de la Flota *</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                style={inputStyle}
              >
                {vehicles.map(v => {
                  const rend = calculateVehicleKmLiter(v.id);
                  return (
                    <option key={v.id} value={v.id} style={{ background: '#1e293b' }}>
                      {v.name} ({v.plate || 'Sin Patente'}) - Rend: {rend} km/L
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Precio Bencina ($/L)</label>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Peajes / TAG ($)</label>
                <input
                  type="number"
                  value={tolls}
                  onChange={(e) => setTolls(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Reserva Desgaste ($/km)</label>
                <input
                  type="number"
                  value={wearPerKm}
                  onChange={(e) => setWearPerKm(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Margen Ganancia (%)</label>
                <input
                  type="number"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Combustible Requerido:</span>
                <strong style={{ color: '#f8fafc' }}>{litersNeeded.toFixed(2)} Litros</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Gasto Bencina + Peajes:</span>
                <strong style={{ color: '#fca5a5' }}>${Math.round(fuelCostTotal + tollsNum).toLocaleString('es-CL')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Reserva Mantención / Neumáticos:</span>
                <strong style={{ color: '#eab308' }}>${Math.round(wearCostTotal).toLocaleString('es-CL')}</strong>
              </div>

              <hr style={{ borderColor: '#334155', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: '700' }}>COSTO OPERATIVO REAL:</span>
                <strong style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '800' }}>
                  ${Math.round(directOperatingCost).toLocaleString('es-CL')}
                </strong>
              </div>

              <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: '800', textTransform: 'uppercase' }}>TARIFA SUGERIDA DE FLETE</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Ganancia Neta: +${Math.round(netProfit).toLocaleString('es-CL')}</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#22c55e' }}>
                  ${Math.round(suggestedFreightTariff).toLocaleString('es-CL')}
                </div>
              </div>

            </div>

          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{ background: '#334155', color: '#f8fafc', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Cerrar Calculadora
          </button>
        </div>

      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
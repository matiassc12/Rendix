/*
  Nombre del archivo: TripView.jsx
  Propósito: Cotizador de viajes y servicios de flete con Google Maps (Routes API + Places API)
  usando el rendimiento manual (km/L) del vehículo o un ajuste directo para el viaje.
*/

import React, { useState, useEffect, useRef } from 'react';
import { getManualEfficiency } from '../utils/efficiencyHelper';
import {
  loadGoogleMaps,
  computeStreetRoute,
  searchPlacesChile
} from '../services/googleMapsService';

export default function TripView({ vehicles = [] }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [customKmPerLiter, setCustomKmPerLiter] = useState('');
  const [fuelPrice, setFuelPrice] = useState(1320);
  const [tolls, setTolls] = useState('');
  const [maintenanceReserve, setMaintenanceReserve] = useState(45);
  const [profitMargin, setProfitMargin] = useState(35);
  const [distanceKm, setDistanceKm] = useState('');
  const [durationText, setDurationText] = useState('');
  const [clickStep, setClickStep] = useState(0);
  const [mapError, setMapError] = useState('');
  const [isRouting, setIsRouting] = useState(false);

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerOriginRef = useRef(null);
  const markerDestRef = useRef(null);
  const polylineRef = useRef(null);
  const originPointRef = useRef(null);
  const destPointRef = useRef(null);
  const skipOriginSearchRef = useRef(false);
  const skipDestSearchRef = useRef(false);

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Sincronizar el rendimiento manual del vehículo seleccionado
  useEffect(() => {
    const manualVal = getManualEfficiency(selectedVehicle);
    setCustomKmPerLiter(manualVal > 0 ? manualVal : 11.5);
  }, [selectedVehicle]);

  const kmPerLiter = Number(customKmPerLiter) > 0 ? Number(customKmPerLiter) : 11.5;

  const drawRouteBetween = async (origin, dest) => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || !origin || !dest) return;

    setIsRouting(true);
    setMapError('');
    try {
      const routeData = await computeStreetRoute(origin, dest);
      setDistanceKm(routeData.distanceKm);
      setDurationText(routeData.durationText);

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      const decodedPath = window.google.maps.geometry.encoding.decodePath(routeData.encodedPolyline);
      polylineRef.current = new window.google.maps.Polyline({
        path: decodedPath,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map
      });

      const bounds = new window.google.maps.LatLngBounds();
      decodedPath.forEach(pt => bounds.extend(pt));
      map.fitBounds(bounds, 50);
    } catch (err) {
      console.error('Error al calcular ruta:', err);
      setMapError(err.message || 'No se pudo trazar la ruta por calles.');
    } finally {
      setIsRouting(false);
    }
  };

  const setOriginMarker = (latLngObj, labelText = '') => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    originPointRef.current = latLngObj;
    if (labelText) {
      skipOriginSearchRef.current = true;
      setOriginQuery(labelText);
    }

    if (markerOriginRef.current) markerOriginRef.current.setMap(null);

    const marker = new window.google.maps.Marker({
      position: latLngObj,
      map,
      draggable: true,
      label: { text: 'A', color: '#ffffff', fontWeight: 'bold' },
      title: 'Origen (arrastrable)'
    });

    marker.addListener('dragend', (ev) => {
      const updated = { lat: ev.latLng.lat(), lng: ev.latLng.lng() };
      originPointRef.current = updated;
      if (destPointRef.current) {
        drawRouteBetween(updated, destPointRef.current);
      }
    });

    markerOriginRef.current = marker;
  };

  const setDestMarker = (latLngObj, labelText = '') => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    destPointRef.current = latLngObj;
    if (labelText) {
      skipDestSearchRef.current = true;
      setDestQuery(labelText);
    }

    if (markerDestRef.current) markerDestRef.current.setMap(null);

    const marker = new window.google.maps.Marker({
      position: latLngObj,
      map,
      draggable: true,
      label: { text: 'B', color: '#ffffff', fontWeight: 'bold' },
      title: 'Destino (arrastrable)'
    });

    marker.addListener('dragend', (ev) => {
      const updated = { lat: ev.latLng.lat(), lng: ev.latLng.lng() };
      destPointRef.current = updated;
      if (originPointRef.current) {
        drawRouteBetween(originPointRef.current, updated);
      }
    });

    markerDestRef.current = marker;
  };

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

        const map = new maps.Map(mapRef.current, {
          center: { lat: -33.4489, lng: -70.6693 },
          zoom: 12,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        });

        map.addListener('click', (e) => {
          const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };

          if (!originPointRef.current || (originPointRef.current && destPointRef.current)) {
            destPointRef.current = null;
            setDistanceKm('');
            setDurationText('');
            skipDestSearchRef.current = true;
            setDestQuery('');
            if (markerDestRef.current) markerDestRef.current.setMap(null);
            if (polylineRef.current) polylineRef.current.setMap(null);

            setOriginMarker(clicked, `${clicked.lat.toFixed(5)}, ${clicked.lng.toFixed(5)}`);
            setClickStep(1);
          } else {
            setDestMarker(clicked, `${clicked.lat.toFixed(5)}, ${clicked.lng.toFixed(5)}`);
            setClickStep(0);
            drawRouteBetween(originPointRef.current, clicked);
          }
        });

        mapInstanceRef.current = map;
      })
      .catch((err) => {
        if (isMounted) setMapError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (skipOriginSearchRef.current) {
      skipOriginSearchRef.current = false;
      setOriginResults([]);
      return;
    }
    if (!originQuery || originQuery.trim().length < 3) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const places = await searchPlacesChile(originQuery);
      setOriginResults(places);
    }, 350);
    return () => clearTimeout(timer);
  }, [originQuery]);

  useEffect(() => {
    if (skipDestSearchRef.current) {
      skipDestSearchRef.current = false;
      setDestResults([]);
      return;
    }
    if (!destQuery || destQuery.trim().length < 3) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const places = await searchPlacesChile(destQuery);
      setDestResults(places);
    }, 350);
    return () => clearTimeout(timer);
  }, [destQuery]);

  const handleSelectOriginPlace = (place) => {
    const point = { lat: place.lat, lng: place.lng };
    setOriginResults([]);
    setOriginMarker(point, `${place.name} - ${place.address}`);
    setClickStep(destPointRef.current ? 0 : 1);

    if (mapInstanceRef.current && !destPointRef.current) {
      mapInstanceRef.current.setCenter(point);
      mapInstanceRef.current.setZoom(14);
    }
    if (destPointRef.current) {
      drawRouteBetween(point, destPointRef.current);
    }
  };

  const handleSelectDestPlace = (place) => {
    const point = { lat: place.lat, lng: place.lng };
    setDestResults([]);
    setDestMarker(point, `${place.name} - ${place.address}`);
    setClickStep(0);

    if (mapInstanceRef.current && !originPointRef.current) {
      mapInstanceRef.current.setCenter(point);
      mapInstanceRef.current.setZoom(14);
    }
    if (originPointRef.current) {
      drawRouteBetween(originPointRef.current, point);
    }
  };

  const handleResetPoints = () => {
    originPointRef.current = null;
    destPointRef.current = null;
    skipOriginSearchRef.current = true;
    skipDestSearchRef.current = true;
    setOriginQuery('');
    setDestQuery('');
    setOriginResults([]);
    setDestResults([]);
    setDistanceKm('');
    setDurationText('');
    setMapError('');
    setClickStep(0);

    if (markerOriginRef.current) markerOriginRef.current.setMap(null);
    if (markerDestRef.current) markerDestRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: -33.4489, lng: -70.6693 });
      mapInstanceRef.current.setZoom(12);
    }
  };

  const numericDistance = Number(distanceKm) || 0;
  const numericTolls = Number(tolls) || 0;
  const hasRouteData = numericDistance > 0;

  const litersRequired = hasRouteData ? numericDistance / kmPerLiter : 0;
  const fuelCost = litersRequired * (Number(fuelPrice) || 0);
  const totalMaintenance = numericDistance * (Number(maintenanceReserve) || 0);
  const operationalCost = fuelCost + numericTolls + totalMaintenance;
  const suggestedRate = operationalCost * (1 + (Number(profitMargin) || 0) / 100);

  return (
    <div className="trip-container">
      <div className="trip-header">
        <h2>🗺️ Cotizador de Viajes y Servicios de Flete</h2>
        <p>Traza la ruta real por calles (Google Maps), ajusta el rendimiento manual del vehículo y obtén tu tarifa sugerida.</p>
      </div>

      <div className="trip-grid">
        {/* COLUMNA IZQUIERDA: BUSCADORES, MAPA Y DISTANCIA */}
        <div className="trip-map-card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="📍 Buscar Origen (ej: Apoquindo 4500)"
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                className="trip-input"
                style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px' }}
              />
              {originResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
                  marginTop: '4px', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {originResults.map(place => (
                    <div
                      key={place.id}
                      onClick={() => handleSelectOriginPlace(place)}
                      style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #1e293b', fontSize: '12px' }}
                    >
                      <strong style={{ color: '#f8fafc', display: 'block' }}>{place.name}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{place.address}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="🏁 Buscar Destino (ej: Plaza Maipú)"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                className="trip-input"
                style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px' }}
              />
              {destResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
                  marginTop: '4px', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {destResults.map(place => (
                    <div
                      key={place.id}
                      onClick={() => handleSelectDestPlace(place)}
                      style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #1e293b', fontSize: '12px' }}
                    >
                      <strong style={{ color: '#f8fafc', display: 'block' }}>{place.name}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{place.address}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="map-controls-bar">
            <div className="click-instruction">
              {isRouting
                ? '🔄 Trazando ruta por calles...'
                : clickStep === 0
                  ? '📍 Haz 1er Clic en el mapa para Origen (A)'
                  : '🏁 Haz 2do Clic en el mapa para Destino (B)'}
            </div>
            <button type="button" onClick={handleResetPoints} className="btn-reset-points">
              Reiniciar Puntos
            </button>
          </div>

          {mapError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              ⚠️ {mapError}
            </div>
          )}

          <div ref={mapRef} className="leaflet-map-box" />

          <div className="distance-input-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <label>Distancia Ruta Real (KM):</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                placeholder="0.0"
                value={distanceKm} 
                onChange={(e) => {
                  const val = e.target.value;
                  setDistanceKm(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="trip-input-highlight"
              />
            </div>

            {durationText && (
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800'
              }}>
                ⏱️ Tiempo est.: {durationText}
              </span>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CONFIGURACIÓN Y RESULTADOS */}
        <div className="trip-sidebar-box">
          <div className="trip-form-section">
            <h3>Parámetros de Operación</h3>
            
            <div className="trip-row-inputs">
              <div className="form-group">
                <label>Vehículo de la Flota *</label>
                <select 
                  value={selectedVehicleId} 
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="trip-select"
                >
                  {vehicles.map(v => {
                    const manualKmL = getManualEfficiency(v);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.plate || 'Sin Patente'}){manualKmL > 0 ? ` - ${manualKmL} km/L` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Rendimiento (km/L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={customKmPerLiter}
                  onChange={(e) => setCustomKmPerLiter(e.target.value)}
                  className="trip-input"
                />
              </div>
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
                  min="0"
                  placeholder="0"
                  value={tolls} 
                  onChange={(e) => setTolls(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
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

            {!hasRouteData ? (
              <div style={{
                padding: '20px 14px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                lineHeight: '1.5',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '10px',
                border: '1px dashed #334155'
              }}>
                📍 Marca el <strong>Origen</strong> y <strong>Destino</strong> en el mapa (o ingresa una distancia en km) para calcular el costo operativo y la tarifa sugerida.
              </div>
            ) : (
              <>
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
                  <strong>${numericTolls.toLocaleString('es-CL')}</strong>
                </div>

                <div className="result-total-box">
                  <span>COSTO OPERATIVO REAL:</span>
                  <span className="total-amount">${Math.round(operationalCost).toLocaleString('es-CL')}</span>
                </div>

                <div className="result-suggested-box">
                  <span>TARIFA SUGERIDA DE FLETE:</span>
                  <span className="suggested-amount">${Math.round(suggestedRate).toLocaleString('es-CL')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
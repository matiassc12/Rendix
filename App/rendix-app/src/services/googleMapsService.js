/*
  Nombre del archivo: src/services/googleMapsService.js
  Propósito: Carga Google Maps JS API y conecta Routes API v2 (trazado real por calles)
  junto con Places API (New) para búsqueda de direcciones en Chile.
*/

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let mapsLoaderPromise = null;

export function hasGoogleMapsKey() {
  return Boolean(API_KEY && API_KEY.trim().length > 10);
}

export function loadGoogleMaps() {
  if (!hasGoogleMapsKey()) {
    return Promise.reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY en el archivo .env'));
  }

  if (window.google?.maps?.geometry) {
    return Promise.resolve(window.google.maps);
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', () => reject(new Error('Error al cargar Google Maps')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry&language=es&region=CL`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps no se inicializó correctamente'));
      }
    };

    script.onerror = () => {
      mapsLoaderPromise = null;
      reject(new Error('No se pudo cargar Google Maps. Revisa tu API Key y restricciones.'));
    };

    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

export async function computeStreetRoute(origin, destination) {
  if (!hasGoogleMapsKey()) {
    throw new Error('Falta VITE_GOOGLE_MAPS_API_KEY en .env');
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: { latitude: Number(origin.lat), longitude: Number(origin.lng) }
        }
      },
      destination: {
        location: {
          latLng: { latitude: Number(destination.lat), longitude: Number(destination.lng) }
        }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: 'es-CL',
      units: 'METRIC'
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error Routes API (${response.status})`);
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route) {
    throw new Error('No se encontró una ruta vehicular entre esos puntos.');
  }

  const distanceMeters = Number(route.distanceMeters || 0);
  const distanceKm = Number((distanceMeters / 1000).toFixed(1));
  const durationSeconds = parseInt(String(route.duration || '0s').replace('s', ''), 10) || 0;

  return {
    distanceKm,
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    encodedPolyline: route.polyline?.encodedPolyline || ''
  };
}

export async function searchPlacesChile(query) {
  if (!hasGoogleMapsKey() || !query || query.trim().length < 3) {
    return [];
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
    },
    body: JSON.stringify({
      textQuery: query.trim(),
      languageCode: 'es',
      regionCode: 'CL',
      maxResultCount: 5
    })
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.places || [])
    .filter(p => p.location)
    .map(p => ({
      id: p.id,
      name: p.displayName?.text || '',
      address: p.formattedAddress || '',
      lat: p.location.latitude,
      lng: p.location.longitude
    }));
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs} h ${remMins} min` : `${hrs} h`;
}
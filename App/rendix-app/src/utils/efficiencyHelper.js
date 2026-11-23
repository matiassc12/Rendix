/*
  Nombre del archivo: src/utils/efficiencyHelper.js
  Propósito: Obtiene el rendimiento manual (km/L) configurado en cada vehículo
  y calcula el promedio general de la flota.
*/

export function getManualEfficiency(vehicle) {
  if (!vehicle) return 0;
  const val = Number(vehicle.manual_efficiency || 0);
  return val > 0 ? Number(val.toFixed(1)) : 0;
}

export function calculateFleetAverageEfficiency(vehicles = []) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return '0.0';

  const validValues = vehicles
    .map(v => getManualEfficiency(v))
    .filter(val => val > 0);

  if (validValues.length === 0) return '0.0';

  const sum = validValues.reduce((acc, curr) => acc + curr, 0);
  return (sum / validValues.length).toFixed(1);
}

export function calculateHybridEfficiency(vehicle) {
  const kmPerLiter = getManualEfficiency(vehicle);
  return {
    kmPerLiter,
    source: kmPerLiter > 0 ? 'manual' : 'none',
    label: kmPerLiter > 0 ? 'Ingreso Manual' : 'Sin configurar'
  };
}
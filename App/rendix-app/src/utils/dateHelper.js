/*
  Nombre del archivo: src/utils/dateHelper.js
  Propósito: Manejo seguro de fechas YYYY-MM-DD en hora local (sin desfase UTC
  ni errores por cambio de horario DST) para vencimientos y formularios.
*/

export function getTodayLocalISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getDaysUntilExpiration(dateStr) {
  const expDate = parseLocalDate(dateStr);
  if (!expDate) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expDate - today) / (1000 * 60 * 60 * 24));
}

export function formatDateCL(dateStr) {
  if (!dateStr) return '—';
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
}
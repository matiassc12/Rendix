/*
  Nombre del archivo: patentHelper.js
  Propósito: Validar formatos de patentes chilenas (autos, camionetas, motos)
  y calcular el mes/fecha de Revisión Técnica / PRT según el último dígito.
*/

export const PRT_CALENDAR = {
  '1': { monthName: 'Abril', monthNum: '04' },
  '2': { monthName: 'Mayo', monthNum: '05' },
  '3': { monthName: 'Junio', monthNum: '06' },
  '4': { monthName: 'Julio', monthNum: '07' },
  '5': { monthName: 'Agosto', monthNum: '08' },
  '6': { monthName: 'Septiembre', monthNum: '09' },
  '7': { monthName: 'Octubre', monthNum: '10' },
  '8': { monthName: 'Noviembre', monthNum: '11' },
  '9': { monthName: 'Enero', monthNum: '01' },
  '0': { monthName: 'Febrero', monthNum: '02' }
};

export function normalizePlate(plateStr = '') {
  return String(plateStr || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .trim();
}

export function validateChileanPlate(plateStr = '') {
  const clean = normalizePlate(plateStr);

  // 1. Auto / Camioneta Nuevo (2007+): 4 letras + 2 dígitos (ej: VDBD55, BBCC10)
  const autoNuevo = /^[B-DF-HJ-NP-TV-Z]{4}\d{2}$/;

  // 2. Auto / Camioneta Antiguo: 2 letras + 4 dígitos (ej: AA1000)
  const autoAntiguo = /^[A-Z]{2}\d{4}$/;

  // 3. Motocicleta Nuevo: 3 letras + 2 dígitos (ej: VBY38) o 3 dígitos
  const motoNuevo = /^[A-Z]{3}\d{2,3}$/;

  // 4. Motocicleta Antiguo: 2 letras + 3 dígitos (ej: AB123)
  const motoAntiguo = /^[A-Z]{2}\d{3}$/;

  if (autoNuevo.test(clean)) {
    return { isValid: true, format: 'Auto/Camioneta (Nuevo: LLLLDD)', cleanPlate: clean };
  }
  if (autoAntiguo.test(clean)) {
    return { isValid: true, format: 'Auto/Camioneta (Antiguo: LLDDDD)', cleanPlate: clean };
  }
  if (motoNuevo.test(clean)) {
    return { isValid: true, format: 'Motocicleta (Nuevo: LLLDD)', cleanPlate: clean };
  }
  if (motoAntiguo.test(clean)) {
    return { isValid: true, format: 'Motocicleta (Antiguo: LLDDD)', cleanPlate: clean };
  }

  return { isValid: false, format: null, cleanPlate: clean };
}

export function getPrtInfoByPlate(plateStr = '') {
  const { isValid, format, cleanPlate } = validateChileanPlate(plateStr);
  if (!isValid) return null;

  const digits = cleanPlate.match(/\d/g);
  if (!digits || digits.length === 0) return null;

  const lastDigit = digits[digits.length - 1];
  const prtData = PRT_CALENDAR[lastDigit];
  if (!prtData) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const prtMonthInt = parseInt(prtData.monthNum, 10);

  // Si el mes de revisión ya pasó este año, corresponde al siguiente año
  const targetYear = prtMonthInt < currentMonth ? currentYear + 1 : currentYear;
  const lastDayOfMonth = new Date(targetYear, prtMonthInt, 0).getDate();
  const expirationDate = `${targetYear}-${prtData.monthNum}-${String(lastDayOfMonth).padStart(2, '0')}`;

  return {
    lastDigit,
    monthName: prtData.monthName,
    format,
    expirationDate
  };
}
/*
  Nombre del archivo: patentHelper.js
  Propósito: Validar múltiples formatos de patentes chilenas (autos, motos, 
  remolques) y obtener automáticamente el mes de PRT según el último dígito.
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

export function validateChileanPlate(plateStr = '') {
  const clean = plateStr.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // 1. Auto Nuevo (2007+): 4 letras + 2 números (ej: BBCC10, BKN228)
  const autoNuevo = /^[B-DF-HJ-NP-TV-Z]{4}\d{2}$/;
  
  // 2. Auto Antiguo (1985-2007): 2 letras + 4 números (ej: AA1000)
  const autoAntiguo = /^[A-Z]{2}\d{4}$/;

  // 3. Moto Nuevo (2014+): 3 letras + 2 números (ej: ABC12) o 3 letras + 3 números
  const motoNuevo = /^[A-Z]{3}\d{2,3}$/;

  // 4. Moto Antiguo / Formatos Especiales: 2 letras + 3 números (ej: AB123)
  const motoAntiguo = /^[A-Z]{2}\d{3}$/;

  if (autoNuevo.test(clean)) {
    return { isValid: true, format: 'Auto/Camioneta (Nuevo: BBBB10)', cleanPlate: clean };
  }
  if (autoAntiguo.test(clean)) {
    return { isValid: true, format: 'Auto/Camioneta (Antiguo: AA1000)', cleanPlate: clean };
  }
  if (motoNuevo.test(clean)) {
    return { isValid: true, format: 'Motocicleta (Nuevo: ABC12)', cleanPlate: clean };
  }
  if (motoAntiguo.test(clean)) {
    return { isValid: true, format: 'Motocicleta (Antiguo: AB123)', cleanPlate: clean };
  }

  return { isValid: false, format: null, cleanPlate: clean };
}

export function getPrtInfoByPlate(plateStr = '') {
  const { isValid, format, cleanPlate } = validateChileanPlate(plateStr);
  if (!isValid) return null;

  // Extraer el último carácter que sea un dígito numérico
  const matches = cleanPlate.match(/\d/g);
  if (!matches || matches.length === 0) return null;

  const lastDigit = matches[matches.length - 1];
  const prtData = PRT_CALENDAR[lastDigit];

  if (!prtData) return null;

  const today = new Date();
  let targetYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const prtMonthInt = parseInt(prtData.monthNum, 10);

  if (prtMonthInt < currentMonth) {
    targetYear += 1;
  }

  const lastDayOfMonth = new Date(targetYear, prtMonthInt, 0).getDate();
  const expirationDate = `${targetYear}-${prtData.monthNum}-${String(lastDayOfMonth).padStart(2, '0')}`;

  return {
    lastDigit,
    monthName: prtData.monthName,
    format,
    expirationDate
  };
}
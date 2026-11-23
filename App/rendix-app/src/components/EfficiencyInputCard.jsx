/*
  Nombre del archivo: src/components/EfficiencyInputCard.jsx
  Propósito: Tarjeta interactiva para ingresar el rendimiento desde el computador
  a bordo del vehículo con conversor automático km/L <-> L/100km y guía rápida.
*/

import React, { useState, useEffect } from 'react';

export default function EfficiencyInputCard({
  value = '',
  onChange,
  onSave = null,
  vehicleName = '',
  saving = false
}) {
  const [unit, setUnit] = useState('kml'); // 'kml' | 'l100'
  const [rawInput, setRawInput] = useState(value ? String(value) : '');
  const [showTip, setShowTip] = useState(false);

 useEffect(() => {
    if (!value) {
      setRawInput('');
      return;
    }
    const num = Number(value);
    if (num > 0) {
      const currentRaw = Number(rawInput);
      if (unit === 'kml' && currentRaw === num) return;
      if (unit === 'l100' && currentRaw > 0 && Math.abs(Number((100 / currentRaw).toFixed(2)) - num) < 0.02) {
        return;
      }
      setRawInput(unit === 'kml' ? String(num) : (100 / num).toFixed(1));
    }
  }, [value]);

  const handleUnitSwitch = (newUnit) => {
    if (newUnit === unit) return;
    const currentNum = Number(rawInput);
    if (currentNum > 0) {
      setRawInput((100 / currentNum).toFixed(1));
    }
    setUnit(newUnit);
  };

  const handleInputChange = (e) => {
    const valStr = e.target.value;
    setRawInput(valStr);

    const num = Number(valStr);
    if (!valStr || num <= 0) {
      if (onChange) onChange('');
      return;
    }

    const normalizedKmL = unit === 'kml' ? num : Number((100 / num).toFixed(2));
    if (onChange) onChange(normalizedKmL);
  };

  const numericRaw = Number(rawInput);
  const convertedPreview =
    numericRaw > 0
      ? unit === 'kml'
        ? `${(100 / numericRaw).toFixed(1)} L/100km`
        : `${(100 / numericRaw).toFixed(1)} km/L`
      : null;

  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', display: 'block' }}>
            📟 RENDIMIENTO COMPUTADOR A BORDO {vehicleName ? `(${vehicleName})` : ''}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Respaldo inteligente cuando aún no tienes 2 estanques llenos.
          </span>
        </div>

        <div style={{ display: 'flex', background: '#1e293b', padding: '3px', borderRadius: '8px', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => handleUnitSwitch('kml')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              background: unit === 'kml' ? '#3b82f6' : 'transparent',
              color: unit === 'kml' ? '#ffffff' : '#94a3b8'
            }}
          >
            km/L
          </button>
          <button
            type="button"
            onClick={() => handleUnitSwitch('l100')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              background: unit === 'l100' ? '#3b82f6' : 'transparent',
              color: unit === 'l100' ? '#ffffff' : '#94a3b8'
            }}
          >
            L/100km
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder={unit === 'kml' ? 'Ej: 13.5' : 'Ej: 7.4'}
            value={rawInput}
            onChange={handleInputChange}
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 70px 10px 12px',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: '800',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              fontWeight: '800',
              color: '#38bdf8'
            }}
          >
            {unit === 'kml' ? 'km/L' : 'L/100km'}
          </span>
        </div>

        {onSave && (
          <button
            type="button"
            disabled={saving || !numericRaw}
            onClick={() => onSave(unit === 'kml' ? numericRaw : Number((100 / numericRaw).toFixed(2)))}
            style={{
              background: numericRaw > 0 ? '#10b981' : '#334155',
              color: '#ffffff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: numericRaw > 0 ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap'
            }}
          >
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
        {convertedPreview ? (
          <span style={{ color: '#4ade80', fontWeight: '700' }}>
            🔄 Equivalencia: <strong>{convertedPreview}</strong>
          </span>
        ) : (
          <span style={{ color: '#94a3b8' }}>Opcional • Se guarda normalizado en km/L</span>
        )}

        <button
          type="button"
          onClick={() => setShowTip(!showTip)}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {showTip ? 'Ocultar ayuda ▲' : '💡 ¿Dónde verlo en mi auto?'}
        </button>
      </div>

      {showTip && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#cbd5e1',
            lineHeight: '1.4'
          }}
        >
          Presiona el botón <strong>TRIP / DISP / INFO</strong> en el volante o tablero hasta ver el indicador <strong>AVG</strong>. Si tu auto marca en <strong>L/100km</strong> (ej. Haval, Peugeot, Chery), selecciona esa unidad arriba y Rendix lo convertirá a <strong>km/L</strong> automáticamente.
        </div>
      )}
    </div>
  );
}
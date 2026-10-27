/*
  Nombre del archivo: GuiaView.jsx
  Propósito: Guía de usuario y manual de buenas prácticas para sacar el máximo provecho a Rendix.
*/

import React from 'react';

export default function GuiaView() {
  const tutorialSteps = [
    {
      step: '01',
      title: 'Registro y Control de Vehículos',
      desc: 'Agrega tus vehículos con su respectiva patente, marca y modelo. Esto es clave para que los cálculos de rendimiento (km/l) y los filtros del dashboard funcionen de manera precisa.',
      icon: '🚗',
      color: '#38bdf8'
    },
    {
      step: '02',
      title: 'Registro de Cargas de Bencina',
      desc: 'Ingresa cada carga de combustible anotando los litros, el monto total pagado y el kilometraje actual del odómetro. El sistema calculará automáticamente la eficiencia de consumo.',
      icon: '⛽',
      color: '#4ade80'
    },
    {
      step: '03',
      title: 'Monitoreo de Indicadores en Vivo',
      desc: 'En el Dashboard principal, la app consulta de forma automática la API oficial de Findic para obtener el valor actualizado de la UF y el Dólar, indexando los costos de operación.',
      icon: '📊',
      color: '#818cf8'
    },
    {
      step: '04',
      title: 'Exportación de Reportes PDF',
      desc: 'Utiliza el botón superior "Exportar Reporte PDF" para generar un informe ejecutivo formal con el resumen financiero y el inventario completo, listo para impresión o auditoría.',
      icon: '🖨️',
      color: '#fca5a5'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', color: '#f8fafc', fontWeight: '800' }}>📖 Guía de Uso y Tutorial</h2>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Aprende a exprimir al máximo todas las capacidades operativas y financieras de Rendix.</p>
      </div>

      {/* Grid de Pasos del Tutorial */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {tutorialSteps.map((item, index) => (
          <div key={index} style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '32px' }}>{item.icon}</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: item.color, opacity: '0.8' }}>
                {item.step}
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f8fafc', fontWeight: '800' }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sección Pro-Tip / Consejo Académico */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ fontSize: '36px' }}>💡</div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc', fontWeight: '800' }}>
            Consejo Pro para tu Presentación
          </h4>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5' }}>
            Cuando expongas tu proyecto, destaca que Rendix no es solo un sistema de almacenamiento estático, sino una herramienta de análisis financiero proactivo que conecta variables macroeconómicas reales (UF y Dólar vía API) con la gestión interna de cada vehículo.
          </p>
        </div>
      </div>

    </div>
  );
}
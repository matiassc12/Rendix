import React from 'react';

export default function ExpensesView({ expenses, vehicles, openModal, onDeleteExpense }) {
  // Función auxiliar para obtener datos e imagen del vehículo asociado
  const getVehicleInfo = (vehicleId) => {
    const found = vehicles.find(v => v.id === vehicleId);
    return found || { name: 'Vehículo Desconocido', plate: '---', image_url: '' };
  };

  return (
    <div className="view-container">
      {/* Encabezado de la Vista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
            <span>💸</span> Gastos Operativos y TAG
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Registra peajes, repuestos, estacionamientos y mantenimientos adicionales.
          </p>
        </div>
        <button
          onClick={openModal}
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Registrar Nuevo Gasto
        </button>
      </div>

      {/* Tabla de Gastos */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px' }}>FECHA</th>
              <th style={{ padding: '16px' }}>VEHÍCULO</th>
              <th style={{ padding: '16px' }}>CATEGORÍA</th>
              <th style={{ padding: '16px' }}>DESCRIPCIÓN</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>MONTO</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No hay gastos registrados aún.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => {
                const vehicleId = expense.vehicle_id || expense.vehicleId;
                const vehicle = getVehicleInfo(vehicleId);

                return (
                  <tr key={expense.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{expense.date}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {vehicle.image_url ? (
                          <img
                            src={vehicle.image_url}
                            alt={vehicle.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                            🚘
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', color: '#38bdf8' }}>{vehicle.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{vehicle.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: '#334155',
                        color: '#e2e8f0',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {expense.category || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {expense.description || '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#f43f5e' }}>
                      ${Number(expense.amount || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteExpense && onDeleteExpense(expense.id)}
                        title="Eliminar gasto"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'background 0.2s'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
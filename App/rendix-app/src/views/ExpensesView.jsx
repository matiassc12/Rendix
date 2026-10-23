/*
  Nombre del archivo: ExpensesView.jsx
  Propósito: Permite llevar un control centralizado de los gastos operativos de la flota 
  (como TAG, peajes, mantenciones y seguros) organizados por categorías.
*/

import React from 'react';

export default function ExpensesView({ expenses, openModal }) {
  return (
    <div>
      <div className="header-title">
        <div>
          <h2>Gastos Operativos</h2>
          <p>Control de TAG, mantenciones y seguros.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('expense')}>+ Nuevo Gasto</button>
      </div>
      <div className="card-box">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.category}</td>
                <td>{e.description}</td>
                <td>${Number(e.amount).toLocaleString('es-CL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import { memo, useState, useRef } from 'react';
import EmailModal from './EmailModal';

interface CashChangeModalProps {
  onClose: () => void;
}

interface Denomination {
  value: number;
  label: string;
  type: 'coin' | 'bill';
}

const CashChangeModal = memo(function CashChangeModal({ onClose }: CashChangeModalProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const coins: Denomination[] = [
    { value: 0.01, label: '0,01 €', type: 'coin' },
    { value: 0.02, label: '0,02 €', type: 'coin' },
    { value: 0.05, label: '0,05 €', type: 'coin' },
    { value: 0.1, label: '0,1 €', type: 'coin' },
    { value: 0.2, label: '0,2 €', type: 'coin' },
    { value: 0.5, label: '0,5 €', type: 'coin' },
    { value: 1, label: '1 €', type: 'coin' },
    { value: 2, label: '2 €', type: 'coin' },
  ];

  const bills: Denomination[] = [
    { value: 5, label: '5 €', type: 'bill' },
    { value: 10, label: '10 €', type: 'bill' },
    { value: 20, label: '20 €', type: 'bill' },
  ];

  const handleQuantityChange = (value: number, newQuantity: string) => {
    const numQuantity = parseInt(newQuantity) || 0;
    setQuantities(prev => ({
      ...prev,
      [value]: numQuantity
    }));
  };

  const calculateTotal = (denomination: Denomination) => {
    const quantity = quantities[denomination.value] || 0;
    return (denomination.value * quantity).toFixed(2);
  };

  const calculateGrandTotal = () => {
    const allDenominations = [...coins, ...bills];
    return allDenominations.reduce((total, denomination) => {
      const quantity = quantities[denomination.value] || 0;
      return total + (denomination.value * quantity);
    }, 0).toFixed(2);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Solicitud de Cambio de Efectivo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .section-title { background-color: #e9ecef; font-weight: bold; }
            .total-row { background-color: #f8f9fa; font-weight: bold; }
            .grand-total { background-color: #e3f2fd; font-weight: bold; font-size: 1.1em; }
            .print-only { display: block; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEmail = () => {
    setShowEmailModal(true);
  };

  const getEmailContent = () => {
    if (printRef.current) {
      return `
Hoja de Solicitud de Cambio de Efectivo
Fecha: ${new Date().toLocaleDateString('es-ES')}

${printRef.current.innerText}
      `;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative mx-auto p-6 border border-blue-200 w-11/12 max-w-4xl shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm animate-in zoom-in-95 duration-300" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-gray-800">Solicitud de Cambio de Efectivo</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Print Content */}
        <div ref={printRef} className="bg-white text-black p-6 rounded-lg mb-6 border border-gray-200">
          <div className="header">
            <h1 className="text-2xl font-bold mb-2">Hoja de Solicitud de Cambio de Efectivo</h1>
            <p className="text-gray-600">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
          </div>

          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 w-1/3">Monedas</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 w-1/3">Cantidad</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 w-1/3">Total</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => (
                <tr key={coin.value} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-800 font-medium">{coin.label}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">{quantities[coin.value] || 0}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-800 font-medium">{calculateTotal(coin)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 w-1/3">Billetes</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 w-1/3">Cantidad</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 w-1/3">Total</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.value} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-800 font-medium">{bill.label}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">{quantities[bill.value] || 0}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-800 font-medium">{calculateTotal(bill)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr className="bg-blue-50">
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-800 text-base w-1/3">Suma Total</td>
                <td className="border border-gray-300 px-3 py-3 text-center w-1/3"></td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-blue-600 text-base w-1/3">{calculateGrandTotal()} €</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Interactive Form */}
        <div className="space-y-6">
          {/* Coins Section */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Monedas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coins.map((coin) => (
                <div key={coin.value} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {coin.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[coin.value] || ''}
                    onChange={(e) => handleQuantityChange(coin.value, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="0"
                  />
                  <div className="mt-2 text-sm text-blue-600">
                    Total: {calculateTotal(coin)} €
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bills Section */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Billetes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bills.map((bill) => (
                <div key={bill.value} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {bill.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[bill.value] || ''}
                    onChange={(e) => handleQuantityChange(bill.value, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="0"
                  />
                  <div className="mt-2 text-sm text-blue-600">
                    Total: {calculateTotal(bill)} €
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-gray-800">Suma Total</h4>
              <span className="text-2xl font-bold text-blue-600">{calculateGrandTotal()} €</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handlePrint}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={handleEmail}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar Por Email
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          onClose={() => setShowEmailModal(false)}
          emailContent={getEmailContent()}
        />
      )}
    </div>
  );
});

export default CashChangeModal;

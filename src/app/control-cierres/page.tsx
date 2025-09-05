'use client';

import { memo, useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ClosureModal from '@/components/ClosureModal';
import { useRouter } from 'next/navigation';

interface ExcelData {
  turno: string;
  apertura: string; // Formato de hora HH:MM
  cierre: string; // Formato de hora HH:MM
  // Movimiento 44 - Ventas
  movimiento44: number;
  ventasCarburante: number;
  ventasTienda: number;
  totalVentas: number; // Calculado
  // Movimiento 77 - Recaudaciones/Gastos
  movimiento77: number;
  efectivoSobres: number;
  creditoLocal: number;
  bacaladeras: number;
  datafonos: number;
  descuentos: number;
  otrosPagosTarjeta: number;
  otrosMovimientos: number;
  ventasOPTs: number;
  totalRecaudaciones: number; // Calculado
  // Resultado
  resultadoTurno: number; // Calculado
}

interface ClosureData {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon';
  result: number;
  hasImage: boolean;
  excelData?: ExcelData; // Datos detallados del formulario
}

const ControlCierresPage = memo(function ControlCierresPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClosure, setSelectedClosure] = useState<ClosureData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [closures, setClosures] = useState<ClosureData[]>([]);
  const [highlightedDay, setHighlightedDay] = useState<string | null>(null);

  // Navegación del calendario
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    
    // Generar fecha local en formato YYYY-MM-DD (mismo formato que generateCalendarDays)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    setHighlightedDay(localDateString);
    
    // Remover el resaltado después de 3 segundos
    setTimeout(() => {
      setHighlightedDay(null);
    }, 3000);
  }, []);

  // Obtener información del mes actual
  const getMonthInfo = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Lunes como primer día
    
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentDate);
    
    return { year, month, monthName, startDate };
  }, [currentDate]);

  // Generar días del calendario
  const generateCalendarDays = useCallback(() => {
    const { startDate } = getMonthInfo();
    const days = [];
    
    // Generar todas las semanas del mes (6 semanas para cubrir todos los casos)
    for (let week = 0; week < 6; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + dayOfWeek);
        
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const isToday = date.toDateString() === new Date().toDateString();
        
        // Generar fecha local en formato YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateString = `${year}-${month}-${day}`;
        
        days.push({
          date: localDateString,
          day: date.getDate(),
          isCurrentMonth,
          isToday
        });
      }
    }
    
    return days;
  }, [currentDate, getMonthInfo]);

  // Obtener datos de cierre para una fecha específica
  const getClosureData = useCallback((date: string, shift: 'morning' | 'afternoon') => {
    return closures.find(c => c.date === date && c.shift === shift);
  }, [closures]);

  // Manejar clic en botón de cierre
  const handleClosureClick = useCallback((date: string, shift: 'morning' | 'afternoon') => {
    const existingClosure = getClosureData(date, shift);
    if (existingClosure) {
      setSelectedClosure(existingClosure);
    } else {
      setSelectedClosure({
        id: `${date}-${shift}`,
        date,
        shift,
        result: 0,
        hasImage: false
      });
    }
    setShowModal(true);
  }, [getClosureData]);

  // Guardar cierre
  const handleSaveClosure = useCallback((closureData: ClosureData) => {
    setClosures(prev => {
      const existingIndex = prev.findIndex(c => c.id === closureData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = closureData;
        return updated;
      } else {
        return [...prev, closureData];
      }
    });
    setShowModal(false);
    setSelectedClosure(null);
  }, []);

  const calendarDays = generateCalendarDays();
  const { year, monthName } = getMonthInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Control de Cierres</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Hoy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación del Calendario */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">{monthName}</h2>
                <p className="text-sm text-gray-600">{year}</p>
              </div>
              
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${
                  highlightedDay === day.date ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''
                }`}
              >
                <div className="text-right mb-2">
                  <span className={`text-sm font-medium ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {day.day}
                  </span>
                </div>
                
                {day.isCurrentMonth && (
                  <div className="space-y-1">
                    {/* Botón Turno Mañana */}
                    <button
                      onClick={() => handleClosureClick(day.date, 'morning')}
                      className={`w-full py-2 px-2 text-xs font-medium rounded transition-colors ${
                        (getClosureData(day.date, 'morning')?.result ?? 0) < 0
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      Mañana
                      {getClosureData(day.date, 'morning') && (
                        <div className="text-xs font-bold mt-1">
                          {getClosureData(day.date, 'morning')?.result.toFixed(2)} €
                        </div>
                      )}
                    </button>
                    
                    {/* Botón Turno Tarde */}
                    <button
                      onClick={() => handleClosureClick(day.date, 'afternoon')}
                      className={`w-full py-2 px-2 text-xs font-medium rounded transition-colors ${
                        (getClosureData(day.date, 'afternoon')?.result ?? 0) < 0
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      Tarde
                      {getClosureData(day.date, 'afternoon') && (
                        <div className="text-xs font-bold mt-1">
                          {getClosureData(day.date, 'afternoon')?.result.toFixed(2)} €
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Cierre */}
      {showModal && selectedClosure && (
        <ClosureModal
          closureData={selectedClosure}
          onSave={handleSaveClosure}
          onClose={() => {
            setShowModal(false);
            setSelectedClosure(null);
          }}
        />
      )}
    </div>
  );
});

export default ControlCierresPage;

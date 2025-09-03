'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import '../styles/clockPicker.css';

interface ClockPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ClockPicker = memo(function ClockPicker({ value, onChange, placeholder = "Seleccionar hora", className = "" }: ClockPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isSelectingHour, setIsSelectingHour] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generar horas (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Generar minutos (0-59, cada 5 minutos)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // Parsear el valor inicial
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':').map(Number);
      setSelectedHour(hour || 0);
      setSelectedMinute(minute || 0);
    }
  }, [value]);

  // Cerrar el picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatear hora para mostrar
  const formatTime = useCallback((hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }, []);

  // Manejar selección de hora
  const handleHourSelect = useCallback((hour: number) => {
    setSelectedHour(hour);
    setIsSelectingHour(false);
  }, []);

  // Manejar selección de minuto
  const handleMinuteSelect = useCallback((minute: number) => {
    setSelectedMinute(minute);
    setIsSelectingHour(true);
    setIsOpen(false);
    
    // Actualizar el valor
    const newValue = formatTime(selectedHour, minute);
    onChange(newValue);
  }, [selectedHour, onChange, formatTime]);

  // Abrir el picker
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsSelectingHour(true);
  }, []);

  // Cerrar el picker
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Limpiar valor
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedHour(0);
    setSelectedMinute(0);
  }, [onChange]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input principal */}
      <div className="relative">
        <input
          type="text"
          value={value}
          readOnly
          onClick={handleOpen}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent cursor-pointer"
        />
        
        {/* Iconos */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 mr-2"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ClockIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Picker desplegable */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 clock-picker-dropdown">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">
              {isSelectingHour ? 'Seleccionar Hora' : 'Seleccionar Minuto'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido del picker */}
          <div className="p-4">
            {/* Hora actual seleccionada */}
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-gray-800">
                {formatTime(selectedHour, selectedMinute)}
              </div>
              <div className="text-xs text-gray-500">
                {isSelectingHour ? 'Hora seleccionada' : 'Minuto seleccionado'}
              </div>
            </div>

            {/* Selector de hora */}
            {isSelectingHour && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Hora</div>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto clock-picker-scroll">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => handleHourSelect(hour)}
                      className={`p-2 text-sm rounded-lg transition-colors clock-picker-hour ${
                        selectedHour === hour
                          ? 'bg-blue-500 text-white selected'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {hour.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de minuto */}
            {!isSelectingHour && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Minuto</div>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => handleMinuteSelect(minute)}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        selectedMinute === minute
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
              {!isSelectingHour && (
                <button
                  onClick={() => setIsSelectingHour(true)}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Volver a Hora
                </button>
              )}
              {isSelectingHour && (
                <button
                  onClick={() => setIsSelectingHour(false)}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
                >
                  Continuar a Minuto →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ClockPicker;

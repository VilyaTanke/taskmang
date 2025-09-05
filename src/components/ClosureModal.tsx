'use client';

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { XMarkIcon, PhotoIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import ClockPicker from './ClockPicker';

interface ExcelData {
  turno: string;
  apertura: string; // Formato de hora HH:MM
  cierre: string; // Formato de hora HH:MM
  // Movimiento 44 - Ventas
  movimiento44: number;
  ventasCarburante: number;
  ventasTienda: number;
  totalVentas: number; // Calculado: A
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
  totalRecaudaciones: number; // Calculado: B
  // Resultado
  resultadoTurno: number; // Calculado: A - B
}

interface ClosureData {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon';
  result: number;
  hasImage: boolean;
  excelData?: ExcelData; // Datos detallados del formulario
}

interface ClosureModalProps {
  closureData: ClosureData;
  onSave: (data: ClosureData) => void;
  onClose: () => void;
}

const ClosureModal = memo(function ClosureModal({ closureData, onSave, onClose }: ClosureModalProps) {
  // Inicializar con datos existentes si están disponibles
  const initialExcelData: ExcelData = closureData.excelData || {
    turno: '',
    apertura: '',
    cierre: '',
    movimiento44: 0,
    ventasCarburante: 0,
    ventasTienda: 0,
    totalVentas: 0,
    movimiento77: 0,
    efectivoSobres: 0,
    creditoLocal: 0,
    bacaladeras: 0,
    datafonos: 0,
    descuentos: 0,
    otrosPagosTarjeta: 0,
    otrosMovimientos: 0,
    ventasOPTs: 0,
    totalRecaudaciones: 0,
    resultadoTurno: 0
  };

  const [excelData, setExcelData] = useState<ExcelData>(initialExcelData);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar datos cuando cambie el closureData (al abrir un cierre existente)
  useEffect(() => {
    if (closureData.excelData) {
      setExcelData(closureData.excelData);
    }
  }, [closureData.excelData]);

  // Calcular totales automáticamente
  useEffect(() => {
    const totalVentas = Number(excelData.movimiento44 || 0) + Number(excelData.ventasCarburante || 0) + Number(excelData.ventasTienda || 0);
    const totalRecaudaciones = Number(excelData.movimiento77 || 0) + Number(excelData.efectivoSobres || 0) + Number(excelData.creditoLocal || 0) + 
                              Number(excelData.bacaladeras || 0) + Number(excelData.datafonos || 0) + Number(excelData.descuentos || 0) + 
                              Number(excelData.otrosPagosTarjeta || 0) + Number(excelData.otrosMovimientos || 0) + Number(excelData.ventasOPTs || 0);
    const resultado = totalRecaudaciones - totalVentas;

    setExcelData(prev => ({
      ...prev,
      totalVentas: Math.round(totalVentas * 100) / 100,
      totalRecaudaciones: Math.round(totalRecaudaciones * 100) / 100,
      resultadoTurno: Math.round(resultado * 100) / 100
    }));
  }, [
    excelData.movimiento44, excelData.ventasCarburante, excelData.ventasTienda,
    excelData.movimiento77, excelData.efectivoSobres, excelData.creditoLocal,
    excelData.bacaladeras, excelData.datafonos, excelData.descuentos,
    excelData.otrosPagosTarjeta, excelData.otrosMovimientos, excelData.ventasOPTs
  ]);

  // Manejar cambios en los campos
  const handleInputChange = useCallback((field: keyof ExcelData, value: string | number) => {
    setExcelData(prev => {
      let updatedValue: string | number;
      
      // Para campos de texto y hora, mantener el valor como string
      if (field === 'turno' || field === 'apertura' || field === 'cierre') {
        updatedValue = value;
      } else {
        // Para campos numéricos, procesar el valor
        if (typeof value === 'string') {
          // Convertir puntos en comas para formato europeo
          const processedValue = value.replace(/\./g, ',');
          
          // Convertir a número y limitar a 2 decimales
          const numericValue = Number(processedValue.replace(',', '.')) || 0;
          updatedValue = Math.round(numericValue * 100) / 100; // Limitar a 2 decimales
        } else {
          // Si ya es número, limitar a 2 decimales
          updatedValue = Math.round(Number(value) * 100) / 100;
        }
      }
      
      const updated = {
        ...prev,
        [field]: updatedValue
      };
      
      // Solo recalcular totales si el campo cambiado es numérico
      if (field !== 'turno' && field !== 'apertura' && field !== 'cierre') {
        const totalVentas = Number(updated.movimiento44 || 0) + Number(updated.ventasCarburante || 0) + Number(updated.ventasTienda || 0);
        const totalRecaudaciones = Number(updated.movimiento77 || 0) + Number(updated.efectivoSobres || 0) + Number(updated.creditoLocal || 0) + 
                                  Number(updated.bacaladeras || 0) + Number(updated.datafonos || 0) + Number(updated.descuentos || 0) + 
                                  Number(updated.otrosPagosTarjeta || 0) + Number(updated.otrosMovimientos || 0) + Number(updated.ventasOPTs || 0);
        const resultado = totalRecaudaciones - totalVentas;
        
        return {
          ...updated,
          totalVentas: Math.round(totalVentas * 100) / 100,
          totalRecaudaciones: Math.round(totalRecaudaciones * 100) / 100,
          resultadoTurno: Math.round(resultado * 100) / 100
        };
      }
      
      return updated;
    });
  }, []);

  // Manejar selección de imagen
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Eliminar imagen
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Guardar cierre
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Aquí se procesaría la imagen y se guardaría en el servidor
      // Por ahora solo simulamos el guardado
      
      const updatedClosure: ClosureData = {
        ...closureData,
        result: excelData.resultadoTurno,
        hasImage: !!selectedImage,
        excelData: excelData // Guardar todos los datos del formulario
      };

      onSave(updatedClosure);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el cierre. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [closureData, excelData, selectedImage, onSave]);

  // Formatear fecha
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const shiftLabel = closureData.shift === 'morning' ? 'Mañana' : 'Tarde';

  // Helper para formatear números con 2 decimales
  const formatNumber = useCallback((value: number) => {
    return value.toFixed(2);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative mx-auto p-6 border border-gray-200 w-11/12 max-w-6xl shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm animate-in zoom-in-95 duration-300" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800">Liquidación de Turno</h3>
            <p className="text-sm text-gray-600">
              {formatDate(closureData.date)} - Turno de {shiftLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario Excel */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Datos del Turno
            </h4>

            {/* Información básica */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                <input
                  type="text"
                  value={excelData.turno}
                  onChange={(e) => handleInputChange('turno', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Ej: T1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apertura</label>
                <ClockPicker
                  value={excelData.apertura}
                  onChange={(value) => handleInputChange('apertura', value)}
                  placeholder="Seleccionar hora de apertura"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">
                  <span className="text-sm font-medium">Cierre</span>
                  <span className="text-xs text-gray-500 ml-1">(Hora de cierre)</span>
                </label>
                <ClockPicker
                  value={excelData.cierre}
                  onChange={(value) => handleInputChange('cierre', value)}
                  placeholder="Seleccionar hora de cierre"
                />
              </div>
            </div>

            {/* Sección Ventas (Movimiento 44) */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="text-md font-medium text-green-800 mb-3">Ventas</h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento 44</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.movimiento44}
                      onChange={(e) => handleInputChange('movimiento44', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ventas Carburante</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.ventasCarburante}
                      onChange={(e) => handleInputChange('ventasCarburante', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ventas Tienda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={excelData.ventasTienda}
                    onChange={(e) => handleInputChange('ventasTienda', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <label className="block text-sm font-bold text-green-800 mb-1">Total Ventas</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.totalVentas}
                      readOnly
                      className="flex-1 px-3 py-2 bg-green-50 border border-green-400 rounded-lg text-green-800 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const totalVentas = Number(excelData.movimiento44 || 0) + Number(excelData.ventasCarburante || 0) + Number(excelData.ventasTienda || 0);
                        setExcelData(prev => ({ ...prev, totalVentas: Math.round(totalVentas * 100) / 100 }));
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                    >
                      ↻
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Suma: {formatNumber(excelData.movimiento44 || 0)} + {formatNumber(excelData.ventasCarburante || 0)} + {formatNumber(excelData.ventasTienda || 0)} = {formatNumber(excelData.totalVentas)}
                  </p>
                </div>
              </div>
            </div>

            {/* Sección Recaudaciones (Movimiento 77) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="text-md font-medium text-gray-800 mb-3">Recaudaciones/Gastos</h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento 77</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.movimiento77}
                      onChange={(e) => handleInputChange('movimiento77', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo/Sobres</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.efectivoSobres}
                      onChange={(e) => handleInputChange('efectivoSobres', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crédito Local</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.creditoLocal}
                      onChange={(e) => handleInputChange('creditoLocal', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bacaladeras</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.bacaladeras}
                      onChange={(e) => handleInputChange('bacaladeras', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Datafonos</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.datafonos}
                      onChange={(e) => handleInputChange('datafonos', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descuentos</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.descuentos}
                      onChange={(e) => handleInputChange('descuentos', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otros Pagos Tarjeta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.otrosPagosTarjeta}
                      onChange={(e) => handleInputChange('otrosPagosTarjeta', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otros Movimientos</label>
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.otrosMovimientos}
                      onChange={(e) => handleInputChange('otrosMovimientos', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ventas OPT&apos;s</label>
                  <input
                    type="number"
                    step="0.01"
                    value={excelData.ventasOPTs}
                    onChange={(e) => handleInputChange('ventasOPTs', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Total Recaudaciones/Gastos</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={excelData.totalRecaudaciones}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-gray-800 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const totalRecaudaciones = Number(excelData.movimiento77 || 0) + Number(excelData.efectivoSobres || 0) + Number(excelData.creditoLocal || 0) + 
                                                Number(excelData.bacaladeras || 0) + Number(excelData.datafonos || 0) + Number(excelData.descuentos || 0) + 
                                                Number(excelData.otrosPagosTarjeta || 0) + Number(excelData.otrosMovimientos || 0) + Number(excelData.ventasOPTs || 0);
                        setExcelData(prev => ({ ...prev, totalRecaudaciones: Math.round(totalRecaudaciones * 100) / 100 }));
                      }}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                    >
                      ↻
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Suma: {formatNumber(excelData.movimiento77 || 0)} + {formatNumber(excelData.efectivoSobres || 0)} + {formatNumber(excelData.creditoLocal || 0)} + {formatNumber(excelData.bacaladeras || 0)} + {formatNumber(excelData.datafonos || 0)} + {formatNumber(excelData.descuentos || 0)} + {formatNumber(excelData.otrosPagosTarjeta || 0)} + {formatNumber(excelData.otrosMovimientos || 0)} + {formatNumber(excelData.ventasOPTs || 0)} = {formatNumber(excelData.totalRecaudaciones)}
                  </p>
                </div>
              </div>
            </div>

            {/* Resultado Final */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="text-md font-medium text-purple-800 mb-3">Resultado del Turno</h5>
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                <label className="block text-sm font-bold text-purple-800 mb-1">Resultado (Recaudaciones - Ventas)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={excelData.resultadoTurno}
                    readOnly
                    className={`flex-1 px-3 py-2 border rounded-lg font-bold ${
                      excelData.resultadoTurno < 0
                        ? 'bg-red-50 border-red-400 text-red-800'
                        : 'bg-green-50 border-green-400 text-green-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const resultado = Number(excelData.totalRecaudaciones || 0) - Number(excelData.totalVentas || 0);
                      setExcelData(prev => ({ ...prev, resultadoTurno: Math.round(resultado * 100) / 100 }));
                    }}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                  >
                    ↻
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Resta: {formatNumber(excelData.totalRecaudaciones || 0)} - {formatNumber(excelData.totalVentas || 0)} = {formatNumber(excelData.resultadoTurno)}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Imagen */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Imagen del Cierre
            </h4>

            {/* Botón de adjuntar imagen */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <PhotoIcon className="w-12 h-12" />
                  <div>
                    <p className="text-sm font-medium">Adjuntar Imagen</p>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview del cierre"
                      className="w-full h-64 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Archivo:</strong> {selectedImage?.name}</p>
                    <p><strong>Tamaño:</strong> {(selectedImage?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <DocumentArrowUpIcon className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Información de la Imagen</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    La imagen se comprimirá automáticamente para optimizar el almacenamiento 
                    manteniendo la legibilidad necesaria para consultas futuras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white border-2 border-white border-t-transparent rounded-full"></div>
                Guardando...
              </>
            ) : (
              <>
                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                Guardar Cierre
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ClosureModal;

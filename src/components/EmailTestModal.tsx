'use client';

import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/lib/emailjs-config';

interface EmailTestModalProps {
  onClose: () => void;
}

export default function EmailTestModal({ onClose }: EmailTestModalProps) {
  const [testData, setTestData] = useState({
    from_name: 'Test User',
    from_email: 'test@example.com',
    to_email: '',
    subject: 'Test Email from TaskMang App',
    message: 'Este es un correo de prueba desde la aplicación TaskMang para verificar que EmailJS funciona correctamente.'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestEmail = async () => {
    if (!testData.to_email.trim()) {
      alert('Por favor, ingrese un correo de destino para la prueba.');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      console.log('=== PRUEBA EMAILJS ===');
      console.log('Configuración:', EMAILJS_CONFIG);
      console.log('Datos de prueba:', testData);

      const result = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        {
          from_name: testData.from_name,
          from_email: testData.from_email,
          to_email: testData.to_email,
          subject: testData.subject,
          message: testData.message,
        },
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('Resultado exitoso:', result);
      setResult(`✅ Correo enviado exitosamente!\nStatus: ${result.status}\nText: ${result.text}`);
      
         } catch (error: unknown) {
      console.error('Error en prueba:', error);
      const errorText = error && typeof error === 'object' && 'text' in error && typeof error.text === 'string' ? error.text : '';
      const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
      setResult(`❌ Error al enviar correo:\n${errorText || errorMessage || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative mx-auto p-6 border border-white/20 w-11/12 max-w-2xl shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-white">Prueba de EmailJS</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Config Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Configuración EmailJS:</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <p><strong>Service ID:</strong> {EMAILJS_CONFIG.SERVICE_ID}</p>
            <p><strong>Template ID:</strong> {EMAILJS_CONFIG.TEMPLATE_ID}</p>
            <p><strong>Public Key:</strong> {EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Test Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Correo de Destino: *
            </label>
            <input
              type="email"
              value={testData.to_email}
              onChange={(e) => handleInputChange('to_email', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje de Prueba:
            </label>
            <textarea
              value={testData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${
            result.includes('✅') 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
          >
            Cerrar
          </button>
          <button
            onClick={handleTestEmail}
            disabled={isLoading}
            className={`flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Probando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Probar EmailJS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

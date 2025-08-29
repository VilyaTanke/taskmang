'use client';

import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/lib/emailjs-config';

interface EmailModalProps {
  onClose: () => void;
  emailContent: string;
}

export default function EmailModal({ onClose, emailContent }: EmailModalProps) {
  const [emailData, setEmailData] = useState({
    from_name: '',
    from_email: '',
    to_email: '',
    subject: 'Solicitud de Cambio de Efectivo',
    message: `Adjunto la solicitud de cambio de efectivo.

${emailContent}

Saludos cordiales.`
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCopyLink, setShowCopyLink] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendEmail = async () => {
    const { from_name, from_email, to_email, subject, message } = emailData;
    
    // Validaciones
    if (!from_name.trim()) {
      alert('Por favor, ingrese su nombre.');
      return;
    }
    
    if (!from_email.trim()) {
      alert('Por favor, ingrese su correo electrónico.');
      return;
    }
    
    if (!to_email.trim()) {
      alert('Por favor, ingrese el correo del destinatario.');
      return;
    }

    // Verificar si las credenciales están configuradas
    if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
      alert('Error: Las credenciales de EmailJS no están configuradas. Por favor, configure las credenciales en src/lib/emailjs-config.ts');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Enviando email con EmailJS...');
      console.log('Config:', {
        serviceId: EMAILJS_CONFIG.SERVICE_ID,
        templateId: EMAILJS_CONFIG.TEMPLATE_ID,
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY
      });
      console.log('Datos:', {
        from_name,
        from_email,
        to_email,
        subject,
        message: message.substring(0, 100) + '...' // Solo mostrar los primeros 100 caracteres
      });

      // Enviar email usando EmailJS
      const result = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        {
          from_name: from_name,
          from_email: from_email,
          to_email: to_email,
          subject: subject,
          message: message,
        },
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('Resultado EmailJS:', result);

      if (result.status === 200) {
        alert('¡Correo enviado exitosamente!');
        onClose();
      } else {
        throw new Error(`Error al enviar el correo. Status: ${result.status}`);
      }
    } catch (error: any) {
      console.error('Error detallado al enviar email:', error);
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al enviar el correo. Por favor, intente nuevamente.';
      
      if (error.text) {
        errorMessage = `Error: ${error.text}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
      
      // Fallback: mostrar opción de copiar enlace mailto
      setShowCopyLink(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const { from_name, from_email, to_email, subject, message } = emailData;
    const mailtoLink = `mailto:${encodeURIComponent(to_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`De: ${from_name} (${from_email})\n\n${message}`)}`;
    
    try {
      await navigator.clipboard.writeText(mailtoLink);
      alert('Enlace copiado al portapapeles. Péguelo en su navegador para abrir el cliente de email.');
      setShowCopyLink(false);
      onClose();
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      alert('No se pudo copiar al portapapeles. Por favor, copie manualmente el enlace:\n\n' + mailtoLink);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative mx-auto p-6 border border-white/20 w-11/12 max-w-2xl shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-white">Enviar Correo Rápido</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Form */}
        <div className="space-y-6">
          {/* From Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Su Nombre: *
            </label>
            <input
              type="text"
              value={emailData.from_name}
              onChange={(e) => handleInputChange('from_name', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              placeholder="Su nombre completo"
            />
          </div>

          {/* From Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Su Correo: *
            </label>
            <input
              type="email"
              value={emailData.from_email}
              onChange={(e) => handleInputChange('from_email', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              placeholder="su@correo.com"
            />
          </div>

          {/* To Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Para: *
            </label>
            <input
              type="email"
              value={emailData.to_email}
              onChange={(e) => handleInputChange('to_email', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              placeholder="destinatario@correo.com"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asunto:
            </label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              placeholder="Asunto del correo"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje:
            </label>
            <textarea
              value={emailData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
              placeholder="Escriba su mensaje aquí..."
            />
          </div>

                     {/* Attachment Info */}
           <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
             <div className="flex items-center">
               <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
               </svg>
               <div>
                 <p className="text-sm font-medium text-blue-400">Adjunto incluido</p>
                 <p className="text-xs text-gray-400">Hoja de Solicitud de Cambio de Efectivo</p>
               </div>
             </div>
           </div>

           {/* Copy Link Section */}
           {showCopyLink && (
             <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                   <div>
                     <p className="text-sm font-medium text-yellow-400">Cliente de email no disponible</p>
                     <p className="text-xs text-gray-400">Copie el enlace para abrir manualmente</p>
                   </div>
                 </div>
                 <button
                   onClick={handleCopyLink}
                   className="flex items-center px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-400 hover:bg-yellow-500/30 transition-all duration-200"
                 >
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                   Copiar Enlace
                 </button>
               </div>
             </div>
           )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
          >
            Cancelar
          </button>
                     {!showCopyLink && (
             <button
               onClick={handleSendEmail}
               disabled={isLoading}
               className={`flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200 ${
                 isLoading ? 'opacity-50 cursor-not-allowed' : ''
               }`}
             >
               {isLoading ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Enviando...
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                   </svg>
                   Enviar Correo
                 </>
               )}
             </button>
           )}
        </div>
      </div>
    </div>
  );
}

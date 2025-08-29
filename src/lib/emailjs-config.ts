// Configuración de EmailJS
// Para usar este servicio, necesitas:
// 1. Registrarte en https://www.emailjs.com/
// 2. Crear un servicio de email (Gmail, Outlook, etc.)
// 3. Crear una plantilla de email
// 4. Obtener las siguientes credenciales:

export const EMAILJS_CONFIG = {
  // Tu Service ID de EmailJS
  SERVICE_ID: 'service_f9x61eq', // Reemplaza con tu Service ID real
  
  // Tu Template ID de EmailJS
  TEMPLATE_ID: 'template_0hmzmbh', // Reemplaza con tu Template ID real
  
  // Tu Public Key de EmailJS
  PUBLIC_KEY: 'JrrNsrEzp4N61oEXY', // Reemplaza con tu Public Key real
};

// Ejemplo de plantilla de EmailJS que puedes usar:
/*
Plantilla HTML para EmailJS:

<!DOCTYPE html>
<html>
<head>
    <title>Solicitud de Cambio de Efectivo</title>
</head>
<body>
    <h2>Solicitud de Cambio de Efectivo</h2>
    <p><strong>De:</strong> {{from_name}} ({{from_email}})</p>
    <p><strong>Para:</strong> {{to_email}}</p>
    <p><strong>Asunto:</strong> {{subject}}</p>
    <hr>
    <div style="white-space: pre-wrap;">{{message}}</div>
    <hr>
    <p><em>Enviado desde la aplicación de gestión de tareas</em></p>
</body>
</html>
*/

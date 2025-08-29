# Configuración de EmailJS para Envío de Correos

## 📧 ¿Qué es EmailJS?

EmailJS es un servicio que permite enviar correos electrónicos directamente desde el frontend (JavaScript) sin necesidad de un backend. Es perfecto para formularios de contacto y envío de correos desde aplicaciones web.

## 🚀 Pasos para Configurar EmailJS

### 1. Registrarse en EmailJS
1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Haz clic en "Sign Up" y crea una cuenta gratuita
3. Confirma tu correo electrónico

### 2. Crear un Servicio de Email
1. En el dashboard de EmailJS, ve a "Email Services"
2. Haz clic en "Add New Service"
3. Selecciona tu proveedor de email (Gmail, Outlook, etc.)
4. Conecta tu cuenta de email
5. **Guarda el Service ID** que se genera

### 3. Crear una Plantilla de Email
1. Ve a "Email Templates"
2. Haz clic en "Create New Template"
3. Usa el siguiente código HTML como base:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Solicitud de Cambio de Efectivo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Solicitud de Cambio de Efectivo
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>De:</strong> {{from_name}} ({{from_email}})</p>
            <p><strong>Para:</strong> {{to_email}}</p>
            <p><strong>Asunto:</strong> {{subject}}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <div style="white-space: pre-wrap; font-family: monospace;">{{message}}</div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p><em>Enviado desde la aplicación de gestión de tareas</em></p>
            <p><em>Fecha: {{date}}</em></p>
        </div>
    </div>
</body>
</html>
```

4. **Guarda el Template ID** que se genera

### 4. Obtener la Public Key
1. Ve a "Account" → "API Keys"
2. **Copia tu Public Key**

### 5. Configurar las Credenciales en la Aplicación
1. Abre el archivo `src/lib/emailjs-config.ts`
2. Reemplaza los valores con tus credenciales reales:

```typescript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'tu_service_id_aqui', // Ejemplo: 'service_abc123'
  TEMPLATE_ID: 'tu_template_id_aqui', // Ejemplo: 'template_xyz789'
  PUBLIC_KEY: 'tu_public_key_aqui', // Ejemplo: 'user_def456'
};
```

## 🔧 Variables de la Plantilla

La plantilla usa las siguientes variables que se envían desde el formulario:

- `{{from_name}}` - Nombre del remitente
- `{{from_email}}` - Correo del remitente
- `{{to_email}}` - Correo del destinatario
- `{{subject}}` - Asunto del correo
- `{{message}}` - Contenido del mensaje (incluye la hoja de cambio)
- `{{date}}` - Fecha automática (opcional)

## 🎯 Funcionalidades Implementadas

### ✅ Envío Directo
- Envía correos directamente desde el frontend
- No requiere backend adicional
- Validación de campos obligatorios
- Indicador de carga durante el envío

### ✅ Fallback con mailto:
- Si EmailJS falla, muestra opción de copiar enlace mailto
- El usuario puede pegar el enlace en su navegador
- Se abre el cliente de email predeterminado

### ✅ Validaciones
- Verifica que las credenciales estén configuradas
- Valida campos obligatorios (nombre, correo remitente, correo destinatario)
- Manejo de errores con mensajes informativos

## 🚨 Notas Importantes

1. **Plan Gratuito**: EmailJS permite 200 correos por mes en el plan gratuito
2. **Seguridad**: La Public Key es segura para usar en el frontend
3. **Plantillas**: Puedes personalizar la plantilla HTML según tus necesidades
4. **Variables**: Asegúrate de que las variables en la plantilla coincidan con las que envías desde el código

## 🔍 Solución de Problemas

### Error: "Credenciales no configuradas"
- Verifica que hayas reemplazado los valores en `emailjs-config.ts`
- Asegúrate de que las credenciales sean correctas

### Error: "Service not found"
- Verifica que el Service ID sea correcto
- Asegúrate de que el servicio esté activo en EmailJS

### Error: "Template not found"
- Verifica que el Template ID sea correcto
- Asegúrate de que la plantilla esté publicada

### Los correos no llegan
- Revisa la carpeta de spam
- Verifica que el servicio de email esté conectado correctamente
- Revisa los logs en el dashboard de EmailJS

## 📞 Soporte

Si tienes problemas con EmailJS:
- [Documentación oficial](https://www.emailjs.com/docs/)
- [Foro de soporte](https://www.emailjs.com/support/)
- [Ejemplos de código](https://www.emailjs.com/examples/)

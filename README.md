# TaskMang - Sistema de Gestión de Tareas

Un sistema completo de gestión de tareas con autenticación, roles de usuario, y seguimiento de empleados. Desarrollado con Next.js, TypeScript, y SQLite.

## 🚀 Características

### ✅ Funcionalidades Implementadas

1. **Autenticación y Autorización**
   - Login seguro con email/contraseña
   - JWT tokens para sesiones
   - Roles: ADMIN, SUPERVISOR, EMPLOYEE
   - Protección de rutas por rol

2. **Gestión de Tareas**
   - Crear tareas individuales (solo ADMIN)
   - Duplicar tareas existentes (solo ADMIN)
   - Marcar tareas como completadas
   - Asignar empleados a tareas completadas
   - Filtros por estado, turno y posición

3. **Dashboard Interactivo**
   - Estadísticas en tiempo real
   - Vista de tareas pendientes y completadas
   - Indicadores de tareas vencidas
   - Filtros avanzados

4. **Sistema de Turnos**
   - Mañana, Tarde, Noche
   - Agrupación de tareas por turno
   - Filtros por turno

5. **Ranking de Empleados**
   - Métricas por día, semana y mes
   - Eficiencia calculada automáticamente
   - Top 3 empleados destacados

6. **Organización por Puestos**
   - Posiciones predefinidas (San Matias, Alconera, Moraleja, Nava I, Nava II, Todas)
   - Usuarios filtrados por posición
   - Tareas asociadas a posiciones

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Base de Datos**: SQLite3
- **Autenticación**: JWT, bcryptjs
- **Iconos**: Heroicons, Lucide React
- **Fechas**: date-fns

## 📋 Requisitos del Sistema

- Node.js 16.15.0 o superior
- npm 9.4.0 o superior

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd taskmang
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (opcional)
Crear un archivo `.env.local` en la raíz del proyecto:
```env
JWT_SECRET=tu-clave-secreta-super-segura
```

### 4. Ejecutar el proyecto
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## 👤 Credenciales de Acceso

### Usuario Administrador (creado automáticamente)
- **Email**: admin@taskmang.com
- **Contraseña**: admin123
- **Rol**: ADMIN

## 📊 Estructura de la Base de Datos


### Tablas Principales

1. **users**
   - id, name, email, password, role, positionId

2. **positions**
   - id, name

3. **tasks**
   - id, title, description, status, dueDate, positionId, shift, completedById

### Datos Iniciales

El sistema crea automáticamente:
- 4 posiciones: Limpieza, Mantenimiento, Seguridad, Administración
- 1 usuario administrador

## 🎯 Uso del Sistema

### Para Administradores

1. **Crear Tareas**
   - Acceder al dashboard
   - Hacer clic en "Crear Tarea"
   - Completar formulario con título, descripción, fecha, posición y turno

2. **Duplicar Tareas**
   - En cualquier tarea, hacer clic en "Duplicar"
   - Seleccionar nueva fecha de vencimiento

3. **Gestionar Empleados**
   - Ver ranking de empleados
   - Monitorear eficiencia por períodos

### Para Empleados y Supervisores

1. **Ver Tareas Asignadas**
   - Solo ven tareas de su posición
   - Filtros por estado y turno

2. **Completar Tareas**
   - Marcar tareas como completadas
   - Asignar quién realizó la tarea

3. **Ver Estadísticas**
   - Dashboard personalizado
   - Ranking de empleados

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Tareas
- `GET /api/tasks` - Obtener tareas (con filtros)
- `POST /api/tasks` - Crear tarea (solo ADMIN)
- `GET /api/tasks/[id]` - Obtener tarea específica
- `PATCH /api/tasks/[id]` - Actualizar tarea
- `POST /api/tasks/[id]` - Duplicar tarea (solo ADMIN)

### Ranking
- `GET /api/ranking?period=day|week|month` - Obtener ranking de empleados

## 🎨 Características de la UI

- **Diseño Responsivo**: Funciona en desktop, tablet y móvil
- **Tema Moderno**: Interfaz limpia con Tailwind CSS
- **Indicadores Visuales**: Colores para estados y turnos
- **Modales Interactivos**: Para crear y duplicar tareas
- **Tablas Dinámicas**: Con ordenamiento y filtros

## 🔒 Seguridad

- **Contraseñas Hasheadas**: bcryptjs con salt rounds
- **JWT Tokens**: Autenticación stateless
- **Autorización por Rol**: Middleware de protección
- **Validación de Datos**: En frontend y backend
- **SQL Injection Protection**: Consultas parametrizadas

## 📱 Funcionalidades Móviles

- **Responsive Design**: Adaptado para dispositivos móviles
- **Touch-Friendly**: Botones y controles optimizados
- **Mobile-First**: Diseño pensado para móviles

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Otros Proveedores
- **Netlify**: Compatible con Next.js
- **Railway**: Soporte para SQLite
- **Heroku**: Requiere configuración adicional

## 🐛 Solución de Problemas

### Error de Base de Datos
```bash
# Si hay problemas con SQLite
npm install sqlite3 --save
```

### Error de Autenticación
- Verificar que el usuario existe en la base de datos
- Comprobar que las credenciales son correctas

### Error de CORS
- El proyecto está configurado para desarrollo local
- Para producción, configurar CORS apropiadamente

## 📈 Próximas Mejoras

- [ ] Notificaciones push
- [ ] Reportes PDF
- [ ] Integración con calendario
- [ ] API REST completa
- [ ] Tests automatizados
- [ ] Docker containerization
- [ ] Backup automático de base de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

---

**TaskMang** - Simplificando la gestión de tareas desde 2024 🚀

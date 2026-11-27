# Plan de integración push en Android

Rama local `feature/notificaciones-push-android`. Contrato del backend en `ddc3088`. El diseño sigue [la arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md) y la lista de [pendientes Android](push-android-pendientes.md).

1. Preparar CNG y las dependencias Expo para FCM directo. Habilitar el piloto mediante configuración con un proyecto Firebase Android.
2. Implementar el transporte HTTP y la sincronización de instalación dentro de `features/notifications`. Usar almacenamiento seguro y ejecutar las operaciones en serie. Conectar el retiro del dispositivo al cierre de sesión mediante una dependencia inyectada.
3. Conectar la escucha nativa a la navegación raíz. Validar los IDs, resolver el aviso en el backend con la sesión activa y refrescar la bandeja si está visible.
4. Validar TypeScript, Expo Config y la navegación con Android local. La recepción del sistema requiere un APK con configuración Firebase, el backend en modo `firebase` y un dispositivo registrado.

El piloto se limita a `NUEVA_OPORTUNIDAD` para Prestador. Los secretos de servicio de Firebase pertenecen al backend.

## Cómo activar el piloto local

1. Obtén el `google-services.json` del proyecto Android `com.aliado.movil`. Define en `.env.local` `ALIADO_ANDROID_GOOGLE_SERVICES_FILE=./google-services.json` y `EXPO_PUBLIC_ANDROID_PUSH_ENABLED=true`. Conserva la URL del backend local para Android, normalmente `http://10.0.2.2:8080`.
2. Ejecuta `npm run prebuild -- --platform android` para actualizar la configuración nativa y luego `npm run android` para compilar e instalar el APK.
3. Con el backend en modo Firebase y en el mismo proyecto del APK, entra como Prestador, concede el permiso Android y habilita `NUEVA_OPORTUNIDAD/PUSH` en preferencias. Publica una solicitud compatible como Cliente y verifica la recepción del aviso con ALIADO en segundo plano.
4. Comprueba apertura en frío, oportunidad cerrada, permiso denegado y revocación tras cierre sin conexión. La bandeja sigue disponible cuando la configuración de push está apagada.

La ruta de baja diferida usa la credencial de la generación anterior. Cuando el cierre se produce sin conexión, el servidor puede enviar un aviso genérico hasta que reciba la baja.

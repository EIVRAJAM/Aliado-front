# Integración pendiente de notificaciones push en Android

**Alcance** App móvil ALIADO, piloto Android para `NUEVA_OPORTUNIDAD`.

**Backend de referencia** `feature/notificaciones-push-fcm` en `ddc3088`.

La bandeja ya consulta avisos y abre oportunidades. La prueba local confirmó el aviso en la bandeja y el procesamiento por el worker con el proveedor simulado. El APK anterior a esta feature carecía de registro nativo de FCM. La implementación y los pasos de activación se describen en el [plan de integración Android](plan-push-android.md). La recepción real con un proyecto Firebase queda pendiente de prueba. [Bandeja existente](notifications.md)

## 1. Preparar el APK para FCM

- [ ] Registrar `com.aliado.movil` como app Android en el proyecto Firebase del piloto. Configurar `expo.android.googleServicesFile` con su `google-services.json` según el entorno.
- [ ] Instalar la versión de `expo-notifications` compatible con el SDK de Expo del proyecto. Configurar el plugin nativo y generar un **APK nuevo de desarrollo**.
- [ ] Crear el canal Android `aliado_oportunidades` antes de pedir permiso y obtener el token. El ID debe coincidir con el canal configurado en el backend.
- [ ] Pedir el permiso de notificaciones y obtener el token **nativo** con `getDevicePushTokenAsync()`. Para pruebas, usar un Android o emulador con servicios de Google Play. [FCM directo con Expo](https://docs.expo.dev/push-notifications/sending-notifications-custom/) · [Configuración de Expo](https://docs.expo.dev/push-notifications/push-notifications-setup/)

## 2. Registrar y retirar la instalación

- [ ] Generar y conservar un UUID por instalación y una prueba de posesión aleatoria de 32 bytes, codificada en base64url sin padding. Guardar la prueba y la credencial de revocación en almacenamiento seguro. La credencial es un secreto independiente, también de 32 bytes.
- [ ] Sincronizar al iniciar sesión como Prestador, al volver al primer plano si cambió el permiso y cuando rote el token. Serializar el registro por instalación y vincular las operaciones a la sesión que las inició. Repetir un envío idéntico con la misma credencial. Usar una credencial nueva al cambiar de cuenta, rotar el token o volver a habilitar una instalación revocada.
- [ ] Mantener separadas la autorización de Android y la preferencia de ALIADO. El Prestador debe habilitar `NUEVA_OPORTUNIDAD/PUSH` en preferencias para recibir push. Si nunca eligió un valor, esta combinación empieza apagada.
- [ ] Al cerrar sesión en línea, retirar el vínculo antes de cerrar la sesión. Si falla la conectividad, limpiar el estado local y guardar de forma segura el UUID y la credencial de ese vínculo para retirar la asociación al reconectar. La baja diferida debe funcionar sin conservar el Bearer anterior. Ignorar aperturas de avisos que correspondían a otra sesión.

### Contrato HTTP del backend integrado

| Operación | Petición y resultado |
|---|---|
| `PUT /api/v1/notificaciones/dispositivos/{instalacionId}` | Bearer de Prestador y `X-ALIADO-Installation-Proof`. Cuerpo con `plataforma: "ANDROID"`, `permisoConcedido` y, al habilitar, `token` y `credencialRevocacion`. Esperar `204`. Si el permiso se deniega, enviar `permisoConcedido: false` sin token. |
| `DELETE /api/v1/notificaciones/dispositivos/{instalacionId}` | Bearer de Prestador, `X-ALIADO-Installation-Proof` y `X-ALIADO-Push-Revocation` de ese vínculo. Sin cuerpo. Esperar `204`. |
| `POST /api/v1/notificaciones/dispositivos/{instalacionId}/revocacion` | `X-ALIADO-Push-Revocation` del vínculo anterior. Funciona sin Bearer y sin cuerpo. En `204`, retirar la operación pendiente. Una baja antigua no debe revocar el vínculo nuevo. |
| `GET` y `PUT /api/v1/preferencias/notificaciones` | Reutilizar el contrato existente. En PUT enviar `{ "tipoAviso": "NUEVA_OPORTUNIDAD", "canal": "PUSH", "habilitada": true }` para activar el aviso. |
| `GET /api/v1/notificaciones` | Mantener el endpoint y el DTO actuales de la bandeja. |
| `GET /api/v1/notificaciones/{notificacionId}/oportunidad` | Bearer de Prestador. El backend integrado devuelve `{ solicitudId, estado, puedeCotizar }`. `estado` es `ABIERTA` o `CERRADA`. El `404` es genérico para avisos inexistentes o sin acceso. |

Ante `401`, usar el manejo de sesión existente. Ante `409` al registrar, conservar el estado local necesario para resolver el vínculo y evitar reintentos repetidos sin cambios. Excluir token, prueba y credencial de logs, analítica y mensajes de error.

## 3. Recibir y abrir el aviso

- [ ] Configurar la recepción en primer plano. Si llega `NUEVA_OPORTUNIDAD` y la bandeja está visible, refrescar su consulta y evitar duplicar la fila. Con la app en segundo plano, dejar que Android muestre el aviso del sistema.
- [ ] Procesar la interacción con el aviso con la app abierta y en arranque en frío. Validar `tipo`, `notificacionId` y `solicitudId`. El payload sirve para navegar. El estado y el permiso salen de la consulta autenticada por `notificacionId`.
- [ ] Si la oportunidad está `ABIERTA`, abrir el detalle de la solicitud devuelta por el backend. Si está `CERRADA`, informar que cerró y omitir la acción de cotizar. En `404`, mostrar «Oportunidad no disponible» sin revelar datos de otra cuenta. Asegurar que el mismo toque no se procese dos veces.
- [ ] Actualizar el texto de la bandeja que hoy dice «no hay push» para reflejar el estado real del piloto y los permisos configurados.

## 4. Dependencias y criterios de aceptación

El APK y el backend deben usar el mismo proyecto Firebase. Para el envío real, el backend requiere V9, worker activo, proveedor `firebase` en lugar de `falso`, credenciales del proyecto y el canal Android correcto. La clave privada se configura únicamente en el servidor. En Azure, verificar además `LISTEN/NOTIFY` contra PostgreSQL del despliegue y mantener una réplica del worker. [Escalado de Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)

| Caso | Resultado esperado |
|---|---|
| Registro repetido | Mismo dispositivo y token sincronizan sin crear otra generación. |
| Rotación y cambio de cuenta | El vínculo anterior deja de ser elegible. Reenviar la baja antigua no modifica el vínculo nuevo. |
| Publicación con app en segundo plano | Como Cliente, publicar una solicitud compatible. El Prestador recibe el aviso del sistema sin pulsar **Actualizar** y lo ve también en la bandeja. |
| Oportunidad cerrada antes de tocar | Se muestra el cierre y el Prestador no puede cotizar. |
| Permiso Android o preferencia apagada | Verificar cada caso por separado. El aviso sigue consultable en bandeja según sus permisos y el celular no recibe push. |
| Cierre de sesión sin red | La app limpia la sesión y registra la baja pendiente. Al reconectar, la aplica sin Bearer. Durante la desconexión el servidor aún puede emitir el aviso genérico. |
| Arranque en frío y primer plano | El toque abre el destino una sola vez al iniciar. Con la bandeja abierta, el aviso nuevo aparece tras la consulta disparada por la recepción. |

La entrega a Android se comprueba con FCM real. El proveedor simulado solo permite verificar la bandeja y el procesamiento interno del backend.

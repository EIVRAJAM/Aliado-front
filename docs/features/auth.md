# F01 — Acceso e identidad (app móvil)

**Estado:** UI, validación y contrato de integración implementados. Integración real pendiente de API desplegada, D-04 y configuración de entorno.

## Alcance móvil

Cubre SPEC-01 para los roles **Cliente** y **Prestador**:

- Registro con selección de rol, aceptación de términos y tratamiento de datos.
- Inicio y cierre de sesión.
- Solicitud de recuperación y confirmación con código y nueva contraseña.
- Validación de formularios, estados de carga, error, éxito confirmado y mensajes genéricos.
- Navegación condicional entre el flujo de acceso y una sesión autenticada.

El acceso de Administrador pertenece al panel web y no se implementa aquí.

## Estructura

```text
src/features/auth/
├── components/        # layout, campos, selector de rol, consentimiento, mensajes
├── screens/           # login, registro, recuperación y sesión
├── services/          # AuthGateway y adaptador HTTP según contrato
├── session/           # sesión en memoria, sin persistencia
├── types/             # roles, sesión, entradas y errores
├── utils/             # traducción de errores a mensajes de UI
├── validation/        # reglas locales de formulario
└── index.ts           # superficie pública de la feature
```

La navegación raíz vive en `src/navigation/` y el bootstrap en `src/app/App.tsx`.

## Contrato de integración

El adaptador HTTP usa los endpoints documentados de F01, sin inventar rutas:

| Operación | Endpoint |
|---|---|
| Registro | `POST /auth/registro` |
| Login | `POST /auth/login` |
| Logout | `POST /auth/logout` |
| Solicitar recuperación | `POST /auth/recuperacion` |
| Confirmar recuperación | `POST /auth/recuperacion/confirmar` |

`EXPO_PUBLIC_API_BASE_URL` debe incluir el prefijo `/api/v1`; por ejemplo `http://localhost:8080/api/v1`. Si no está configurada, las pantallas muestran el bloqueo y el adaptador no simula éxito.

## Decisiones y bloqueos

- **D-04 abierta:** no se implementa persistencia de sesión ni almacenamiento de tokens. La sesión vive únicamente en memoria durante la ejecución actual. No se usa AsyncStorage, localStorage ni logs para tokens.
- **API no desplegada:** no se usan cuentas demo ni respuestas simuladas. El adaptador HTTP solo funciona contra un backend real y configurado.
- **Versión de términos:** `EXPO_PUBLIC_TERMS_VERSION` debe ser definida por producto/legal. Sin ella el registro queda bloqueado y no se inventa una versión.
- **Recuperación:** el contrato define token y nueva contraseña, pero no el canal ni el deep link. La app permite pegar el código manualmente hasta que exista una decisión de enlace.
- **Login de Administrador:** fuera de alcance móvil.
- **Roles:** la UI solo ofrece `CLIENTE` y `PRESTADOR`; el backend sigue siendo la autoridad final.
- **Reglas de contraseña:** la app solo exige que no esté vacía. La política definitiva debe venir del contrato; no se inventa complejidad ni longitud.

## Comportamiento implementado

- **Login:** validación de correo y contraseña, bloqueo de envío duplicado, mensaje genérico para credenciales inválidas y mensaje de configuración si falta la API.
- **Registro:** correo, contraseña, rol, consentimiento y versión de términos; éxito navega al login; correo duplicado no revela el rol de la cuenta existente.
- **Recuperación:** solicitud con mensaje idéntico exista o no la cuenta; confirmación con código y nueva contraseña; errores de token inválido, usado o expirado.
- **Sesión:** muestra correo y rol, permite cerrar sesión y aclara que no se conserva al cerrar la app. Un `401` al cerrar sesión se trata como sesión expirada y limpia el estado local; la expiración de llamadas protegidas se integrará cuando existan esas features.
- **Accesibilidad:** etiquetas, roles de accesibilidad, estados de carga y mensajes anunciados.

## Pendientes para cerrar F01

- Aprobar D-04: duración, concurrencia, transporte, revocación y almacenamiento seguro.
- Desplegar el contrato API de F01 y configurar `EXPO_PUBLIC_API_BASE_URL`.
- Definir la versión de términos aprobada y cargarla en el entorno.
- Definir el canal y deep link de recuperación si producto lo requiere.
- Añadir pruebas de interacción/E2E contra API real y evidencia de aislamiento por rol.
- Verificar builds nativos con `react-native-screens` y `react-native-safe-area-context`.

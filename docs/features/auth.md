# F01 — Acceso e identidad (app móvil)

**Estado:** UI, validación y cliente HTTP alineados al OpenAPI entregado por backend. Integración real pendiente de API disponible, D-04 y configuración de entorno.

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
├── services/          # AuthGateway y adaptador HTTP según OpenAPI
├── session/           # sesión en memoria, sin persistencia
├── types/             # roles, sesión, entradas y errores
├── utils/             # traducción de errores a mensajes de UI
├── validation/        # reglas locales de formulario
└── index.ts           # superficie pública de la feature
```

La navegación raíz vive en `src/navigation/` y el bootstrap en `src/bootstrap/App.tsx`.

## Fuente técnica del contrato

El cliente HTTP se alinea con el OpenAPI local entregado por backend:

`/home/abrahamc/Descargas/api-docs-ALIADO.json`

Ese archivo no se copia a este repositorio. La fuente funcional sigue siendo `../aliado-prb/docs/specs/spec-01-autenticacion-registro-control-acceso.md` y el plan F01 en `../aliado-prb/docs/tasks/features/01-acceso-identidad.md`. Cuando OpenAPI y el plan difieren, el cliente HTTP sigue OpenAPI y la diferencia queda registrada aquí para reconciliación backend/plan.

## Contrato de integración

El servidor OpenAPI declara `http://localhost:8080`. No se codifica esa URL: `EXPO_PUBLIC_API_BASE_URL` debe contener el origen del servidor por entorno, sin `/api/v1`. El cliente añade el prefijo `/api/v1` de las operaciones.

| Operación | Método y ruta | Request body | Respuesta `200` |
|---|---|---|---|
| Registro | `POST /api/v1/auth/registro` | `{ email, password, rol, aceptaTerminos, versionTerminos }` | Objeto genérico (`type: object`), sin campos garantizados |
| Login | `POST /api/v1/auth/login` | `{ email, password }` | `{ sessionToken?, rol? }` |
| Logout | `POST /api/v1/auth/logout` | Sin body | Sin body |
| Solicitar recuperación | `POST /api/v1/auth/recuperacion` | `{ email }` | `{ mensaje? }` |
| Confirmar recuperación | `POST /api/v1/auth/recuperacion/confirmar` | `{ token, nuevaPassword }` | `{ mensaje? }` |

Seguridad OpenAPI:

- Esquema `sesion`: HTTP bearer, `bearerFormat: opaque`.
- La seguridad se declara global; el cliente envía el bearer únicamente en logout porque es la operación autenticada del flujo F01.
- Registro incluye un header opcional `Idempotency-Key`; el cliente no lo envía porque D-18 sigue pendiente y no hay reintentos automáticos.

Ejemplo de configuración:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_TERMS_VERSION=version-aprobada
```

Si la URL no está configurada, las pantallas muestran el bloqueo y el adaptador no simula éxito.

## Diferencias OpenAPI frente al plan F01

| Tema | OpenAPI | Plan F01 | Backend local observado | Tratamiento actual |
|---|---|---|---|---|
| Registro exitoso | `200` | `201` | `201` | El cliente acepta cualquier 2xx; no depende del código exacto. |
| Recuperación exitosa | `200` | `202` | `202` | El cliente acepta cualquier 2xx; la UI muestra el mensaje genérico. |
| Logout exitoso | `200` | `204` | `204` | El cliente acepta cualquier 2xx; no espera body. |
| Respuesta de registro | `object` genérico | `{ id, email, rol }` | `{ id, email, rol }` | El cliente no consume campos del body; el registro resuelve con la respuesta HTTP exitosa. |
| Errores | No documentados | `400`, `401`, `409`, `410` | `400` términos/password, `401` credenciales/sesión, `409` correo duplicado, `410` token expirado | El cliente mantiene mapeo defensivo para esos estados; no se inventan nuevos endpoints. |
| `aceptaTerminos` | No incluido en `required` | Obligatorio en SPEC | `false` produce `400 TERMINOS_NO_ACEPTADOS` | La UI sigue exigiendo consentimiento antes de enviar. |
| `rol` | `string` sin enum | `CLIENTE`/`PRESTADOR` | Devuelve `CLIENTE`/`PRESTADOR` | La UI solo ofrece esos dos roles; login valida el valor recibido. |
| Login response | Campos no marcados como requeridos | `sessionToken`, `rol` | Devuelve ambos | El cliente exige ambos para crear la sesión; si faltan, reporta respuesta inválida. |
| Seguridad | Global para todas las operaciones | Sin detalle de esquema | `/api/v1/auth/**` público; logout exige bearer y responde `401` sin sesión | Bearer solo en logout; discrepancia pendiente con la declaración global de OpenAPI. |
| Contraseña | `minLength: 1` | No define política | Mínimo 8 unidades UTF-16 (`String.length`), al menos una letra Unicode (`Character.isLetter`) y un dígito decimal Unicode (`Character.isDigit`) | La UI replica la política del backend para registro y nueva contraseña; no la aplica en login. OpenAPI debe actualizarse. |
| Idempotencia | Header opcional en registro | D-18 pendiente | El controlador soporta `Idempotency-Key` | No se envía ni se reintenta automáticamente. |
| Base URL | Servidor `http://localhost:8080` + rutas `/api/v1/...` | No fija servidor | Escucha en `8080` en local | `EXPO_PUBLIC_API_BASE_URL` es el origen y el cliente añade `/api/v1`. |

Estas diferencias no se corrigen en el SPEC ni en el plan desde este repositorio.

## Verificación local contra backend

El 2026-11-12 se levantó el backend local con PostgreSQL 17 en un contenedor temporal y se ejecutó el flujo con el `HttpAuthGateway` real del frontend:

- `GET /api-docs`: `200`.
- Registro Cliente y Prestador: `201`.
- Correo duplicado: `409`, mapeado a `EMAIL_TAKEN`.
- Login válido Cliente/Prestador: `200`, con `sessionToken` y `rol`.
- Credenciales inválidas: `401`, mapeado a `INVALID_CREDENTIALS`.
- Contraseña corta: `400`, mapeado a `VALIDATION`; el frontend valida la política observada del backend.
- Logout con bearer: `204`; segundo logout: `401`, mapeado a `SESSION_EXPIRED`.
- Recuperación con correo existente o inexistente: `202` y misma respuesta observable.
- Código de recuperación leído solo del log de desarrollo.
- Confirmación de recuperación: `200`; reutilización del código: `410`, mapeado a `RECOVERY_TOKEN_INVALID`.
- Login con contraseña anterior: `401`; con contraseña nueva: `200`.

No se registraron tokens ni contraseñas en la documentación. Los datos de prueba eran efímeros y no se conservaron.

CORS: la preflight de navegador no devolvió `Access-Control-Allow-Origin`. No se ajustó CORS porque el cliente móvil nativo no está sujeto a CORS y no había un cliente web en esta verificación. Si se prueba la app en navegador, ese ajuste queda pendiente.

## Decisiones y bloqueos

- **D-04 abierta:** no se implementa persistencia de sesión ni almacenamiento de tokens. La sesión vive únicamente en memoria durante la ejecución actual. No se usa AsyncStorage, localStorage ni logs para tokens.
- **API local verificada, sin entorno desplegado:** el flujo se probó contra el backend local en `localhost:8080`; no se definió todavía una URL de API desplegada para el equipo móvil.
- **Versión de términos:** `EXPO_PUBLIC_TERMS_VERSION` debe ser definida por producto/legal. Sin ella el registro queda bloqueado y no se inventa una versión.
- **Recuperación:** el contrato define token y nueva contraseña, pero no el canal ni el deep link. La app permite pegar el código manualmente hasta que exista una decisión de enlace.
- **Idempotencia:** `Idempotency-Key` es opcional en OpenAPI, pero D-18 sigue abierta; no se implementa generación ni reintento automático.
- **Login de Administrador:** fuera de alcance móvil.
- **Reglas de contraseña:** OpenAPI solo exige `minLength: 1`, pero el backend aplica mínimo 8 unidades UTF-16 (`String.length`), al menos una letra Unicode (`Character.isLetter`) y un dígito decimal Unicode (`Character.isDigit`). El frontend replica esa política en registro y restablecimiento con `\p{L}` y `\p{Nd}`; no la aplica en login, que solo exige contraseña no vacía. OpenAPI debe reconciliarse.

## Comportamiento implementado

- **Login:** validación de correo y contraseña, bloqueo de envío duplicado, mensaje genérico para credenciales inválidas y mensaje de configuración si falta la API.
- **Registro:** correo, contraseña, rol, consentimiento y versión de términos; la navegación al login ocurre solo después de una respuesta HTTP exitosa; correo duplicado no revela el rol de la cuenta existente.
- **Recuperación:** solicitud con mensaje idéntico exista o no la cuenta; confirmación con código y nueva contraseña; errores de token inválido, usado o expirado.
- **Sesión:** muestra correo y rol, permite cerrar sesión y aclara que no se conserva al cerrar la app. Un `401` al cerrar sesión se trata como sesión expirada y limpia el estado local; la expiración de llamadas protegidas se integrará cuando existan esas features.
- **Accesibilidad:** etiquetas, roles de accesibilidad, estados de carga y mensajes anunciados.

## Pendientes para cerrar F01

- Reconciliar con backend las diferencias de status, errores, seguridad global y respuesta de registro.
- Aprobar D-04: duración, concurrencia, transporte, revocación y almacenamiento seguro.
- Configurar la API desplegada de F01 en `EXPO_PUBLIC_API_BASE_URL`; la verificación local usó el backend en `localhost:8080`.
- Definir la versión de términos aprobada y cargarla en el entorno.
- Definir el canal y deep link de recuperación si producto lo requiere.
- Resolver D-18 si el registro debe enviar `Idempotency-Key` y cómo se reintenta.
- Añadir pruebas E2E de UI contra API real; la verificación actual cubrió el gateway y los flujos HTTP, no la interacción de pantallas.
- Verificar builds nativos con `react-native-screens` y `react-native-safe-area-context`.

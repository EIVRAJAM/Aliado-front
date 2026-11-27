# F02 — Perfil personal, privacidad y eliminación (app móvil)

**Estado:** UI y gateway implementados; integración HTTP, recorrido visual y pruebas de eliminación definitiva con datos desechables verificados contra backend local/efímero. La política D-05 del MVP está implementada en la rama de correcciones del backend.

## Alcance móvil

Cubre SPEC-02 para el usuario autenticado:

- Consulta del perfil propio.
- Edición de nombre y teléfono con versión para detectar conflictos.
- Configuración de zona aproximada y dirección exacta.
- Preferencia de visibilidad.
- Vista previa pública que nunca expone la dirección exacta.
- Solicitud y confirmación de eliminación de cuenta, sin prometer borrado definitivo.

El perfil profesional (SPEC-05) y las superficies de Administrador quedan fuera de esta feature. Para `PRESTADOR`, Mi perfil incluye una entrada a la pantalla de gestión `ProfessionalProfile`; su contenido y permisos pertenecen a F05.

## Fuente técnica del contrato

El cliente se alinea con el backend local confirmado y con el OpenAPI entregado:

- OpenAPI local: `/home/abrahamc/Descargas/api-docs-ALIADO.json`.
- Contrato real del módulo `perfil`: `PerfilDtos` en `aliado-prb`.
- Requisitos: `aliado-prb/docs/specs/spec-02-gestion-perfil-privacidad.md`.
- Plan: `aliado-prb/docs/tasks/features/02-perfil-privacidad.md`.

### Discrepancias OpenAPI / backend

| Tema | OpenAPI | Backend real | Tratamiento |
|---|---|---|---|
| Respuesta de `/perfil/me` | `PerfilResponse` con `prestadorId`, `datosGenerales`, categorías, portafolio, etc. | `{ usuarioId, nombre, telefono, preferenciaVisibilidad, zonaAproximada, direccionExacta, version }` | El cliente sigue el contrato real de F02. OpenAPI debe corregirse para no reutilizar el esquema del perfil profesional. |
| Solicitud de eliminación | `200` | `202 Accepted` | El cliente acepta cualquier 2xx y usa el body real. |
| Visibilidad | `string` sin enum | `PUBLICO`, `SOLO_ZONA`, `PRIVADO` | La UI solo ofrece esos valores confirmados por backend. |
| Vista pública | `PerfilPublicoResponse` con `usuarioId`, `zonaAproximada` | Igual, solo zona | El cliente nunca muestra dirección exacta en la vista pública. |
| Errores | No documentados | `400`, `401`, `404`, `409`, `410` con `code` | El cliente mapea los códigos observados sin inventar endpoints. |

## Operaciones integradas

| Operación | Método y ruta | Uso en la app |
|---|---|---|
| Consultar perfil propio | `GET /api/v1/perfil/me` | Pantalla principal de perfil. |
| Editar datos | `PATCH /api/v1/perfil/me` | Nombre, teléfono y `version`. |
| Actualizar ubicación | `PUT /api/v1/perfil/me/ubicacion` | Zona aproximada y dirección exacta opcional. |
| Cambiar visibilidad | `PATCH /api/v1/perfil/me/visibilidad` | Preferencia `PUBLICO`, `SOLO_ZONA` o `PRIVADO`. |
| Ver perfil público | `GET /api/v1/perfil/{usuarioId}/publico` | Vista previa propia con solo zona aproximada. |
| Solicitar eliminación | `POST /api/v1/perfil/me/eliminacion` | Crea solicitud pendiente con expiración. |
| Confirmar eliminación | `POST /api/v1/perfil/me/eliminacion/confirmar` | Bloquea la cuenta y cierra sesiones. |

## Patrón visual

La pantalla principal prioriza avatar, nombre, ubicación aproximada y visibilidad. Las acciones se presentan como tarjetas con icono, texto secundario y chevron; no como una pila de botones primarios idénticos. Las pantallas de edición agrupan los campos y el botón de guardado en una tarjeta blanca sobre fondo claro. La cabecera de la app incluye marca, título y control de volver.

## Pantallas

```text
src/features/profile/
├── components/        # resumen, selector de visibilidad, estado de carga/error
├── hooks/             # carga de perfil y manejo de sesión expirada
├── screens/           # perfil, edición, ubicación, privacidad, vista pública y eliminación
├── services/          # ProfileGateway y adaptador HTTP
├── types/             # perfil, visibilidad, eliminación y errores
├── utils/             # mensajes y formato
├── validation/        # reglas locales de edición y ubicación
└── index.ts
```

`Mi perfil` es una pestaña de la barra inferior autenticada. Las pantallas de edición, ubicación, privacidad, vista pública, eliminación y, para Prestador, Perfil profesional se abren fuera de la barra para conservar el historial.

## Cuenta y cierre de sesión

- `Mi perfil` concentra la información de cuenta y el aviso de que la sesión solo vive durante la ejecución actual.
- `Preferencias de notificación` se abre desde Mi perfil para ambos roles como ajuste de cuenta.
- `Cerrar sesión` aparece al final, también cuando el perfil está cargando o falla la API, porque la acción no depende de que existan datos de perfil.
- La acción usa la misma limpieza de sesión de F01 y muestra error si el servidor no responde al logout.
- Se presenta como acción de cuenta neutra, no como acción destructiva; `Eliminar cuenta` mantiene su tratamiento de peligro y su confirmación explícita.

## Privacidad y D-05

- La dirección exacta solo se muestra en el perfil autenticado propio; nunca en la vista pública.
- La vista previa pública usa el endpoint documentado y muestra únicamente la zona aproximada.
- `PRIVADO` hace que el backend no exponga el perfil público; la app muestra el error correspondiente.
- La solicitud de eliminación no borra datos inmediatamente.
- La confirmación bloquea la cuenta y cierra sus sesiones, según el backend actual.
- La confirmación elimina credenciales, sesiones, datos de contacto, ubicación, perfil, preferencias y archivos personales. El historial compartido se conserva anonimizado y la persona se muestra como “Cuenta eliminada”.
- Si el storage falla, el backend deja la clave en una cola durable asociada a esa eliminación y devuelve `archivosPendientes > 0`; la UI avisa y no afirma que todos los archivos fueron eliminados. El reintento se ejecuta automáticamente.
- El cliente exige `politicaEliminacion: "DEFINITIVA_MVP_V1"` y un valor válido de `archivosPendientes`; una respuesta antigua/incompleta se muestra como flujo no soportado y no se presenta como eliminación definitiva.
- La eliminación física/anonimización se implementó para el MVP académico; no se declara cumplimiento legal ni retención productiva.
- La sesión sigue únicamente en memoria; D-04 no se resuelve en F02.

## Verificación de eliminación (2026-11-26)

- Con servicios activos, la solicitud respondió `409 SERVICIO_EN_EJECUCION`; la UI mostró el bloqueo y no creó una solicitud.
- Una solicitud pendiente mantuvo la cuenta `ACTIVA` y la sesión válida hasta la confirmación explícita.
- Tras confirmar, la cuenta quedó `BLOQUEADA_PREVENTIVAMENTE`, la solicitud `CONFIRMADA`, el token existente respondió `401` y el login posterior `403 CUENTA_BLOQUEADA`.
- Una solicitud vencida respondió `410 SOLICITUD_EXPIRADA`, quedó `EXPIRADA`, mantuvo la cuenta `ACTIVA` y permitió generar una nueva.
- Se conservaron servicios, propuestas e historial compartido sin identidad visible; se eliminaron los datos personales y archivos definidos por la matriz D-05 del MVP.

## Verificación manual en emulador

El 2026-11-12 se recorrieron en Android Emulator los flujos con el backend local: consulta y edición de perfil, actualización de zona y dirección exacta, cambios de visibilidad, vista pública en modos `PRIVADO` y `SOLO_ZONA`, solicitud y confirmación de eliminación. La vista `SOLO_ZONA` mostró la zona aproximada sin dirección exacta. La confirmación bloqueó la cuenta desechable y cerró la sesión; no se ejecutó ni se promete borrado físico definitivo. La cuenta de prueba principal permanece activa; sus credenciales se conservan solo localmente y fuera de Git.

Esta evidencia corresponde a una prueba manual en un emulador contra backend local; no sustituye E2E automatizados ni declara cumplimiento legal productivo.

## Pendientes

- Confirmar la reconciliación del esquema OpenAPI de perfil con backend.
- Mantener la política D-05 del MVP sujeta a revisión legal/productiva antes de un uso real.
- Definir API desplegada por entorno.
- Añadir E2E automatizados de UI y cobertura de conflicto/eliminación cuando el entorno esté estable.

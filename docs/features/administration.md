# F12 — Administración, moderación y riesgos (superficie móvil)

**Estado:** efectos móviles implementados en autenticación; el panel administrativo y las mutaciones de moderación siguen fuera de este repositorio. No se modificaron backend, contratos, migraciones ni datos.

## Alcance móvil

SPEC-12 define un panel administrativo para categorías, zonas, reportes, bloqueos, moderación, búsqueda, riesgo y auditoría. La app móvil es para **Cliente** y **Prestador**; no implementa pantallas ni CRUD de Administrador.

El alcance móvil comprobable se limita a:

- Diferenciar una cuenta bloqueada al iniciar sesión.
- Rechazar el acceso móvil de una cuenta `ADMINISTRADOR` y remitirla al panel web.
- Reflejar pasivamente el contenido que el backend deje de exponer por moderación, sin inferir la causa ni mostrar controles administrativos.

## Contratos reales utilizados

| Operación | Endpoint | Uso móvil |
|---|---|---|
| Login | `POST /api/v1/auth/login` | Envía `X-ALIADO-Client: MOBILE`. Mapea `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL` al aviso del panel web y `403 CUENTA_BLOQUEADA` al mensaje de bloqueo. |

Las rutas `/api/v1/admin/**` no se consumen desde móvil. Requieren `ADMINISTRADOR` y pertenecen al panel administrativo: catálogos, cola/detalle/resolución de reportes, bloqueos, moderación, búsqueda, alto riesgo y auditoría.

No se añadió `ADMINISTRADOR` a `AuthRole` ni navegación administrativa. La app sigue aceptando únicamente `CLIENTE` y `PRESTADOR`.

## Comportamiento implementado

### Cuenta bloqueada

- El login mapea `403` con código de servidor `CUENTA_BLOQUEADA` a `AuthError('ACCOUNT_BLOCKED')`.
- La UI muestra: “La cuenta está bloqueada preventivamente. Contacta al equipo de soporte de ALIADO.”
- No se crea sesión local ni se conserva el token.
- La app no ofrece desbloqueo, apelación ni funciones administrativas.

### Rol Administrador

- El login móvil envía el encabezado `X-ALIADO-Client: MOBILE` y espera que el backend rechace `ADMINISTRADOR` con `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL` antes de crear sesión o cerrar sesiones previas (BE-15).
- Si el backend antiguo responde `200` con `rol: ADMINISTRADOR`, el gateway conserva el fallback defensivo: intenta cerrar el token recién emitido y no lo guarda localmente.
- La UI muestra: “La administración se realiza desde el panel web. Esta app es solo para Cliente y Prestador.”
- No se habilitan rutas de Administrador. El fallback antiguo no puede evitar que el backend haya cerrado sesiones previas; no probar una cuenta Administrador real desde móvil hasta que BE-15 esté disponible.

### Moderación y bloqueos aplicados por backend

- La app no consulta el estado administrativo de una cuenta ni de un contenido.
- Si el backend oculta un perfil, servicio, reseña o reporte, las lecturas existentes muestran su estado de no disponibilidad o lista vacía según el contrato de cada feature.
- La app no deduce que hubo moderación ni muestra el motivo administrativo.
- Un bloqueo aplicado a una sesión ya abierta invalida la sesión en el backend; el cliente recibe `401 NO_AUTENTICADO` y lo trata como sesión expirada. No puede distinguirlo de un vencimiento normal. Se solicita en [BE-14](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-14--distinguir-cuenta-bloqueada-en-sesión-existente).

## Criterios de aceptación

- Un login con `403 CUENTA_BLOQUEADA` no crea sesión y muestra el mensaje de cuenta bloqueada.
- Un login móvil envía `X-ALIADO-Client: MOBILE`; el `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL` no crea sesión y muestra el aviso del panel web.
- Si un backend antiguo responde `200` con `rol: ADMINISTRADOR`, la app no conserva el token e intenta cerrar la sesión recién emitida como fallback.
- Un rol desconocido o una respuesta incompleta siguen tratándose como respuesta inválida.
- No se llama a ninguna ruta `/api/v1/admin/**` ni se añaden pantallas de administración.
- Cuenta bloqueada y moderación de contenido siguen siendo acciones independientes; la app no las mezcla.
- `npm run typecheck`, `npm run verify:config`, `npm run doctor` y `git diff --check` pasan.

## Verificación

### Estática

- Node `24.14.1`.
- `npm run typecheck` → `0`.
- `npm run verify:config` → `0`; configuración Expo válida (`3258` bytes).
- `npm run doctor` → `0`; `20/20` comprobaciones.
- `git diff --check` → `0`.

### Gateway de autenticación

Antes de añadir el encabezado y el mapeo BE-15, se compiló el gateway a un directorio temporal y se ejecutaron cuatro pruebas con `node:test`:

- `403 CUENTA_BLOQUEADA` produce `ACCOUNT_BLOCKED` y no crea sesión.
- `rol: ADMINISTRADOR` produce `ADMIN_PORTAL_REQUIRED`, no crea sesión e intenta cerrar el token emitido.
- Un `CLIENTE` válido crea la sesión móvil.
- Un rol desconocido produce `UNKNOWN` y no crea sesión.

Resultado de esa versión previa: `4/4` pruebas aprobadas. Esa suite no verifica el nuevo encabezado `X-ALIADO-Client` ni el `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL`; ambos quedan pendientes de una prueba actualizada. La evidencia previa está en `/tmp/aliado-spec12-validation/`. No se probó contra un backend con credenciales administrativas reales.

## Límites y decisiones abiertas

- **Sin panel administrativo:** F12-FE-01 a F12-FE-06 pertenecen al panel React, no a esta app.
- **Sesión ya bloqueada:** el backend devuelve `401`; no se promete un mensaje específico hasta resolver BE-14.
- **Sin datos de prueba administrativos:** no se validó un login real de Administrador ni un bloqueo real sin credenciales/datos autorizados.
- **Contrato pendiente BE-15:** el backend aún puede ignorar el encabezado móvil y emitir token de Administrador. En ese caso, el fallback cierra best-effort solo el token recién emitido; no restaura sesiones previas que el backend ya haya cerrado. No probar una cuenta Administrador real desde móvil hasta que BE-15 esté implementado y verificado.
- **D-02, D-11 y D-12 abiertas:** catálogo, revisión documental y consolidación/criterios de riesgo no se implementan unilateralmente en móvil.
- **Sin auditoría móvil:** la auditoría administrativa pertenece al backend/panel; el móvil no la consulta.

## Fuera de alcance

Panel administrativo, CRUD de categorías/zonas, cola de reportes, descarga de evidencias administrativas, bloqueo/desbloqueo, moderación, búsqueda de cuentas, marcas de alto riesgo, auditoría y cualquier cambio de backend/OpenAPI.

## Enlaces

- [F01 — Acceso e identidad](auth.md)
- [F11 — Reportes y evidencias](reports.md)
- [Solicitudes backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- `../aliado-prb/docs/specs/spec-12-administracion-moderacion-riesgos.md`
- `../aliado-prb/docs/tasks/features/12-administracion.md`

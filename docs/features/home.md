# Inicio por rol (app móvil)

**Estado:** Inicio es un resumen operativo por rol. El Prestador ve oportunidades compatibles y el Cliente ve sus solicitudes, reutilizando los tableros existentes de F06 y F04. La barra inferior y las pantallas completas de Oportunidades/Solicitudes se conservan.

## Alcance móvil

- **Prestador:** Inicio muestra las oportunidades reales como contenido principal, con encabezado, filtros en modal, resultados y acceso al detalle. Se reutiliza el tablero de F06 y su gateway `GET /api/v1/oportunidades`.
- **Cliente:** Inicio muestra sus solicitudes reales y una acción visible para crear una. Se reutilizan la lista, los estados y el gateway `GET /api/v1/solicitudes/mias` de F04.
- Se muestran como máximo tres resultados en Inicio. Si hay más, aparece **Ver todas** y se abre la pestaña completa correspondiente.
- Si el Cliente no tiene solicitudes, el estado vacío ofrece una sola acción principal: **Publicar una solicitud**. La barra oculta **Nueva** en ese estado para no duplicar la acción; con solicitudes existentes, **Nueva** se conserva.
- La barra inferior no cambia: Cliente conserva Inicio, Buscar, Solicitudes y Mi perfil; Prestador conserva Inicio, Oportunidades, Profesional y Mi perfil.
- No se añaden endpoints, datos de demostración, métricas, avisos ni tarjetas de cuenta. Se retiraron de Inicio la tarjeta de cuenta y la guía redundante.
- La campana de notificaciones permanece en la cabecera de Inicio y no se duplica dentro del tablero de oportunidades.

## Reutilización

```text
src/features/home/
└── screens/HomeScreen.tsx        # composición por rol
src/features/opportunities/
├── components/OpportunitiesBoard.tsx
└── hooks/useOpportunitiesBoard.ts
src/features/requests/
├── components/RequestsBoard.tsx
└── hooks/useMyRequests.ts
```

- `HomeScreen` solo decide el contenido según `session.role`; no crea consultas propias.
- `OpportunitiesBoard` se comparte entre Inicio y la pestaña Oportunidades. Acepta límite, filtros iniciales, acciones de detalle y un callback **Ver todas** que conserva los filtros aplicados en Inicio.
- `RequestsBoard` se comparte entre Inicio y la pestaña Solicitudes. Acepta límite, apertura de detalle, creación y **Ver todas**.
- La carga, error, reintento, vacío, permisos y expiración de sesión siguen viviendo en los hooks existentes, por lo que no se implementa un flujo paralelo.

## Navegación

- **Prestador:** el detalle abre `OpportunityDetail`. **Ver todas** abre la pestaña Oportunidades con los filtros de Inicio; la pestaña aplica esos filtros al montar o al recibir nuevos parámetros.
- **Cliente:** el detalle abre `RequestDetail`; **Nueva** abre `RequestForm`; **Ver todas** abre la pestaña Solicitudes.
- Los roles siguen validándose en navegación y en cada pantalla; el backend mantiene la autoridad final.
- No se inventan rutas para recuperar servicios o propuestas: los límites de contrato siguen documentados en F06/F04.

## Límites

- Inicio no pagina ni filtra localmente la respuesta del servidor. Solo recorta la presentación a tres elementos; el total mostrado es el que entrega el contrato.
- Los filtros de Inicio se transfieren a la pestaña solo al usar **Ver todas**; al entrar directamente desde la barra inferior no se inventa ni conserva un estado de filtros no visible.
- El contenido depende de que el backend entregue oportunidades compatibles y solicitudes propias. Un `401` limpia la sesión; `403` se presenta como permiso denegado; los fallos de red se reintentan manualmente.
- No se crean cuentas, solicitudes, oportunidades ni datos de demostración para la validación visual.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida.
- `npx expo export --platform android` → bundle Android generado.
- `git diff --check` → `0`.

### Emulador

- Emulador Android disponible y app instalada.
- No había una sesión autenticada activa al iniciar esta revisión y no se dispuso de credenciales autorizadas. La app quedó en la pantalla de acceso.
- No se crearon cuentas, solicitudes, oportunidades ni datos de demostración.
- La revisión visual de Inicio para Cliente y Prestador queda pendiente hasta contar con una sesión autorizada o credenciales locales existentes.

## Enlaces

- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [F04 — Solicitudes](requests.md)
- [F06 — Oportunidades](opportunities.md)

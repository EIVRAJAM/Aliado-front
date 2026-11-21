# Inicio por rol (app móvil)

**Estado:** Inicio es la superficie operativa única por rol. El Prestador ve sus oportunidades compatibles y el Cliente ve sus solicitudes, reutilizando los tableros y hooks existentes de F06 y F04. Se retiraron las pestañas duplicadas de Oportunidades y Solicitudes.

## Alcance móvil

- **Prestador:** Inicio muestra todas las oportunidades reales, con encabezado, filtros en modal, resultados y acceso al detalle. Se reutiliza el tablero de F06 y su gateway `GET /api/v1/oportunidades`.
- **Cliente:** Inicio muestra todas sus solicitudes reales y una acción visible para crear una. Se reutilizan la lista, los estados y el gateway `GET /api/v1/solicitudes/mias` de F04.
- Si el Cliente no tiene solicitudes, el estado vacío ofrece una sola acción principal: **Publicar una solicitud**. La barra oculta **Nueva** en ese estado para no duplicar la acción; con solicitudes existentes, **Nueva** se conserva. Durante carga o error se mantiene el acceso a crear.
- La barra inferior queda sin módulos duplicados:
  - **Cliente:** Inicio, Buscar y Mi perfil.
  - **Prestador:** Inicio, Profesional y Mi perfil.
- No se añaden endpoints, datos de demostración, métricas, avisos ni tarjetas de cuenta. Se retiraron de Inicio la tarjeta de cuenta y la guía redundante.
- La campana de notificaciones permanece en la cabecera de Inicio y no se duplica dentro del tablero de oportunidades.
- Las antiguas pantallas de lista completa `RequestListScreen` y `OpportunitiesScreen` se retiraron; Inicio contiene la lista completa. Los detalles, el formulario de solicitud y la propuesta siguen en el stack raíz.

## Reutilización

```text
src/features/home/
└── screens/HomeScreen.tsx        # composición por rol
src/features/opportunities/
├── components/OpportunitiesBoard.tsx
├── components/OpportunityCard.tsx
├── components/OpportunityFilterModal.tsx
└── hooks/useOpportunitiesBoard.ts
src/features/requests/
├── components/RequestsBoard.tsx
├── components/RequestCard.tsx
└── hooks/useMyRequests.ts
```

- `HomeScreen` solo decide el contenido según `session.role`; no crea consultas propias ni un flujo paralelo.
- `OpportunitiesBoard` compone Inicio para Prestador: carga catálogo y oportunidades, aplica filtros en modal, muestra estados y abre el detalle.
- `RequestsBoard` compone Inicio para Cliente: lista solicitudes, aplica el estado vacío y abre detalle o creación.
- La carga, error, reintento, vacío, permisos y expiración de sesión siguen viviendo en los hooks existentes.

## Navegación

- **Prestador:** el detalle abre `OpportunityDetail`; el vacío sin oportunidades ofrece revisar el perfil profesional.
- **Cliente:** el detalle abre `RequestDetail`; **Nueva** y **Publicar una solicitud** abren `RequestForm`.
- Las notificaciones sin `solicitudId` vuelven a Inicio como salida segura.
- Los roles siguen validándose en navegación y en cada pantalla; el backend mantiene la autoridad final.
- No se inventan rutas para recuperar servicios o propuestas: los límites de contrato siguen documentados en F06/F04.

## Límites

- Inicio muestra la lista completa que entrega el contrato; no pagina ni filtra localmente oportunidades ni solicitudes.
- No se conserva un estado de filtros fuera de Inicio; los filtros pertenecen al tablero de oportunidades.
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

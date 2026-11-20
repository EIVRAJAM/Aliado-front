# Alcance y flujo de entrega — App móvil ALIADO

**Estado:** fase 1 completada y F01 (acceso e identidad) iniciada. La UI, validación y contrato de integración de SPEC-01 están implementados; la autenticación real sigue bloqueada por API desplegada, D-04 y configuración de términos. El MVP sigue siendo planificación hasta que cada feature se implemente y acepte con API real.

## Alcance del cliente

La app móvil da servicio a Cliente y Prestador. El MVP funcional sigue SPEC-01 a SPEC-14 del repositorio `aliado-prb`, con esta salvedad documental: la vinculación institucional UC080 y las integraciones Future internas asociadas a formalización no se activan automáticamente. El plan general es la autoridad para el alcance consolidado.

SPEC-15 a SPEC-19 son capacidades **Could**, apagadas y posteriores al MVP. SPEC-20 (pagos) es **Future** y no forma parte del flujo MVP. La app no debe asumir que estas capacidades están disponibles.

## Secuencia de entrega

| Etapa | Contenido móvil | Dependencias / salida |
|---|---|---|
| F00 Fundación | **Fase 1:** base Expo/TypeScript/CNG, metadatos, scripts, typecheck y CI mínima. **F01:** navegación React Navigation, transporte HTTP, tema/componentes base y pantallas de acceso. **Pendiente:** sesión segura, contratos desplegados y automatización de pruebas. | D-01 resuelta para móvil en [ADR 0001](../adr/0001-stack-y-versiones-movil.md); navegación en [ADR 0003](../adr/0003-navegacion-react-navigation.md); D-04, API y versión de términos pendientes. |
| H1 Acceso y perfil inicial | **F01 móvil:** UI, validación, gateway y flujos de registro, login, logout y recuperación implementados; integración HTTP verificada contra backend local. **F02 móvil:** perfil propio, edición, ubicación, visibilidad, vista pública y eliminación implementados. **Pendiente:** API desplegada por entorno, persistencia segura D-04, política D-05 y pruebas E2E de UI. SPEC-02 perfil, privacidad y eliminación básica; base de notificaciones F09.base donde corresponda. | Sesión real, roles y errores de acceso; eliminación completa espera reglas de servicios activos. |
| H2 Solicitudes y descubrimiento | **F04 móvil:** integrado en `develop`; la idempotencia server-side sigue bloqueada por el defecto de backend en `idempotency_keys` (`jsonb`/`varchar`) y la gestión de fotos existentes sigue limitada porque el contrato no expone IDs de foto. **F05 móvil:** formulario de creación con categorías/zonas reales, vista previa pública con datos públicos confirmados y reseñas, y agenda en modo consulta; el alta real está bloqueada por el defecto backend `datos_generales` (`jsonb`/`varchar`). La edición completa requiere `GET /api/v1/perfiles/mio`, definición de `datosGenerales` y D-03. Consultar [solicitudes al equipo backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md). **F03 móvil:** búsqueda y detalle público implementados contra el contrato real; los resultados reales quedan condicionados por BE-01 (F05) y por SC-005. **Pendiente:** integrar F03 y cerrar los contratos/decisiones indicados. | API y catálogos disponibles; no prometer compatibilidad horaria completa sin resolver D-03. |
| H3 Oportunidad a servicio | **F06 móvil:** tablero y detalle del Prestador implementados contra el contrato real, con filtros en modal, indicador activo y validación de rol; la campana de Oportunidades abre la bandeja unificada F09. La UI se verificó en emulador con los datos locales `[DEMO LOCAL F06]`; las fotos no tienen contrato de descarga, la entrega de avisos no define push y faltan E2E automatizados. **F07 móvil:** creación, edición y retiro de propuestas implementados contra el controlador/DTO reales, con contexto de oportunidad, referencias copiables, selector nativo de fecha/hora local, sin `Idempotency-Key` mientras BE-02 siga abierto, validación local y manejo de `409`; la verificación de mutaciones y UI queda pendiente de datos/credenciales autorizados. No hay endpoint para listar propuestas propias (D-09). **F08 móvil:** bandeja de propuestas del Cliente, aceptación, detalle compartido, transiciones, historial, mensajes y acceso por avisos implementados contra el contrato real. No hay endpoint para listar servicios y D-10 sigue abierta; la validación autenticada/visual queda pendiente. **F09 móvil:** bandeja unificada de notificaciones desde Inicio y Oportunidades, orden descendente, destinos por IDs disponibles y fallback de propuestas a Solicitudes; push/tokens y leído/no leído no se implementan mientras D-08 siga abierta. La validación autenticada/visual queda pendiente. | Estados, permisos e idempotencia acordados; contratación concurrente aceptada; datos de prueba autorizados para validar compatibilidad. |
| H4 Confianza y continuidad | **F10 móvil:** calificación de servicios finalizados con reseña obligatoria en el flujo móvil, verificación documental del Prestador y reporte de reseñas implementados; reputación, nivel y reseñas siguen mostrándose desde F03/F05. El historial privado del Cliente (BE-11), la atomicidad de calificación+reseña (BE-10), la lectura de la calificación propia (BE-08), el comprobante de reporte (BE-09) y la política de archivos (D-07) siguen pendientes; el selector de documentos requiere reconstruir el development build. El historial privado no puede validarse hasta que BE-11 exista. Después: SPEC-11 reportes/evidencias → SPEC-12 administración en las superficies del móvil → SPEC-13 formalización → SPEC-14 historial/preferencias/indicadores. | Integración con contratos backend y políticas abiertas cerradas según feature. |
| H5 Piloto | Recorridos integrales Cliente y Prestador, accesibilidad, fallos/reintentos y validación con backend real. | Criterios F21; preparación del piloto. |
| H6 Capacidades posteriores | SPEC-15 a SPEC-19 solo con aprobación específica; SPEC-20 tras decisión de negocio y técnica. | Feature flags OFF por defecto y pruebas de aislamiento. |

Las etapas son hitos de dependencia, no fechas ni asignaciones de equipo. La app se integra con la API en cada feature; la integración no se pospone íntegramente al final.

## Flujo de trabajo por feature

1. Leer el SPEC, su plan de feature y tareas de frontend en `aliado-prb/docs`.
2. Identificar rol/actor, escenarios, permisos, datos, estados, contratos y decisiones abiertas.
3. Inspeccionar patrones y código existente en este repositorio antes de añadir capas o dependencias.
4. Acordar tipos/contrato y comportamiento de errores con backend; registrar discrepancias como decisión, sin inventar endpoints.
5. Implementar dentro de `features/<dominio>`: validación y tipos necesarios, integración, coordinación y UI, en el orden que minimice acoplamiento.
6. Cubrir carga, vacío, éxito, error, expiración de sesión, autorización y reintento según aplique.
7. Verificar la feature con los controles configurados y sus escenarios de aceptación; distinguir evidencia con fixtures de evidencia contra API real.
8. Actualizar documentación/índice cuando la implementación cierre o cambie una decisión.

Cada rama de trabajo sigue el [flujo Gitflow](../development/GITFLOW.md): sale de `develop`, se rebasa antes del merge y se integra con fast-forward.

## Criterio de finalización

Una feature móvil no se declara integrada solo porque compile o renderice. Debe cumplir sus escenarios SPEC, respetar permisos y privacidad, manejar sus estados, usar contratos aprobados y verificarse con API real cuando la tarea requiera integración. El mock puede servir para desarrollo, no como evidencia de aceptación end-to-end.

La base de fase 1 se considera verificada cuando un checkout limpio instala con `npm ci`, pasa `npm run typecheck`, pasa `npm run verify:config`, pasa `npm run doctor` con Expo Doctor ejecutado y el CI mínimo permanece en verde. El runner de Doctor captura los subprocesos JSON en archivos para evitar la pérdida de salida por pipes/sockets. Si Doctor falla por red, el resultado se reporta como fallido y la base no se declara verificada. Eso no acredita ninguna funcionalidad de producto.

## Fuente de verdad

- Requisitos e historias: `aliado-prb/docs/specs/`.
- Orden y trabajo por feature: `aliado-prb/docs/tasks/`.
- Arquitectura, decisiones transversales y alcance: `aliado-prb/docs/plans/plan-general-ALIADO.md` y documentos asociados.
- Estructura frontend objetivo: `aliado-prb/docs/tasks/01-arquitectura-y-stack.md`.
- Decisiones locales del cliente móvil: `docs/adr/`.

Ante contradicciones, conservarlas como decisión abierta y seguir la gobernanza definida en el plan general; no corregir requisitos silenciosamente.

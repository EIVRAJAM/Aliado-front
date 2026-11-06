# Alcance y flujo de entrega — App móvil ALIADO

**Estado:** fase 1 completada. La base Expo/React Native/TypeScript está inicializada con CNG y development builds, sin funcionalidades de producto ni integración API. El MVP sigue siendo planificación hasta que cada feature se implemente y acepte.

## Alcance del cliente

La app móvil da servicio a Cliente y Prestador. El MVP funcional sigue SPEC-01 a SPEC-14 del repositorio `aliado-prb`, con esta salvedad documental: la vinculación institucional UC080 y las integraciones Future internas asociadas a formalización no se activan automáticamente. El plan general es la autoridad para el alcance consolidado.

SPEC-15 a SPEC-19 son capacidades **Could**, apagadas y posteriores al MVP. SPEC-20 (pagos) es **Future** y no forma parte del flujo MVP. La app no debe asumir que estas capacidades están disponibles.

## Secuencia de entrega

| Etapa | Contenido móvil | Dependencias / salida |
|---|---|---|
| F00 Fundación | **Fase 1:** base Expo/TypeScript/CNG, metadatos, scripts, typecheck y CI mínima. **Pendiente:** navegación base, componentes comunes, cliente API, contratos, sesión segura y automatización de pruebas. | D-01 resuelta para móvil en [ADR 0001](../adr/0001-stack-y-versiones-movil.md); D-04 y contratos mínimos pendientes. |
| H1 Acceso y perfil inicial | SPEC-01 autenticación; SPEC-02 perfil, privacidad y eliminación básica; base de notificaciones F09.base donde corresponda. | Sesión real, roles y errores de acceso; eliminación completa espera reglas de servicios activos. |
| H2 Solicitudes y descubrimiento | SPEC-04 solicitudes/catálogos/archivos → SPEC-05 perfil profesional → SPEC-03 descubrimiento. | API y catálogos disponibles; no prometer compatibilidad horaria completa sin resolver D-03. |
| H3 Oportunidad a servicio | SPEC-06 compatibilidad → SPEC-07 propuestas → SPEC-08 contratación/ciclo del servicio; integración F09. | Estados, permisos e idempotencia acordados; contratación concurrente aceptada. |
| H4 Confianza y continuidad | SPEC-10 confianza → SPEC-11 reportes/evidencias → SPEC-12 administración en las superficies del móvil → SPEC-13 formalización → SPEC-14 historial/preferencias/indicadores. | Integración con contratos backend y políticas abiertas cerradas según feature. |
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

La base de fase 1 se considera verificada cuando un checkout limpio instala con `npm ci`, pasa `npm run typecheck`, pasa `npm run verify:config`, pasa `npm run doctor` con Expo Doctor ejecutado y el CI mínimo permanece en verde. El runner de Doctor captura los subprocesos JSON en archivos para evitar la pérdida de salida por pipes/sockets. Eso no acredita ninguna funcionalidad de producto.

## Fuente de verdad

- Requisitos e historias: `aliado-prb/docs/specs/`.
- Orden y trabajo por feature: `aliado-prb/docs/tasks/`.
- Arquitectura, decisiones transversales y alcance: `aliado-prb/docs/plans/plan-general-ALIADO.md` y documentos asociados.
- Estructura frontend objetivo: `aliado-prb/docs/tasks/01-arquitectura-y-stack.md`.
- Decisiones locales del cliente móvil: `docs/adr/`.

Ante contradicciones, conservarlas como decisión abierta y seguir la gobernanza definida en el plan general; no corregir requisitos silenciosamente.

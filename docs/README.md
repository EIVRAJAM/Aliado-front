# Documentación de ALIADO — App móvil

Este directorio documenta la aplicación móvil Cliente/Prestador desarrollada en este repositorio. La documentación funcional de referencia vive en `../aliado-prb/docs`; este índice enlaza sus fuentes y mantiene aquí las decisiones específicas del cliente móvil.

La raíz de `docs/` debe mantenerse liviana. Los documentos vigentes se organizan por dominio y deben actualizarse cuando cambien el alcance, los contratos o la arquitectura.

## Estado del repositorio

- **Fase 1 completada:** base Expo/React Native/TypeScript inicializada con CNG y development builds. F01 (acceso e identidad) tiene UI, validación y contrato de integración; la autenticación real sigue pendiente de API, D-04 y versión de términos.
- El stack y las versiones están fijados en [ADR 0001](adr/0001-stack-y-versiones-movil.md).
- El flujo de ramas está documentado en [Gitflow](development/GITFLOW.md) y [ADR 0002](adr/0002-gitflow-fast-forward.md). `develop` integra F01–F06 (F05 parcial); F07 se implementa en `feature/f07-propuestas`; `main` sigue sin commits.
- La estructura incorpora navegación, `src/features/auth/` (SPEC-01), `src/features/profile/` (SPEC-02), `src/features/discovery/` (SPEC-03), `src/features/requests/` (SPEC-04), `src/features/professional-profile/` (SPEC-05, parcial), `src/features/opportunities/` (SPEC-06) y `src/features/proposals/` (SPEC-07). El resto de features se creará al iniciar su implementación.
- Validación con Node 24.14.1/npm 11.11.0: `npm ci`, `typecheck`, `verify:config` y `doctor` (20/20) pasan tras actualizar los patches de Expo; Doctor puede fallar por red. Ver [Validación](development/VALIDATION.md).
- F04 tiene UI, gateway, recorrido manual e iteración visual contra backend local; no se declara cerrada mientras la idempotencia server-side y la gestión de fotos existentes sigan bloqueadas. Ver [F04](features/requests.md).
- F05 tiene una implementación frontend parcial: el formulario de creación usa categorías/zonas reales, pero el alta está bloqueada por un error de persistencia JSONB confirmado en el backend. La vista previa pública y la agenda tienen lectura real; la edición completa queda bloqueada por la falta de `GET /api/v1/perfiles/mio` y definiciones pendientes. Ver [F05](features/professional-profile.md) y las [solicitudes al backend](backend-requests/BACKEND_CORRECTION_REQUESTS.md).
- F06 tiene tablero, detalle y bandeja de avisos para Prestador conectados al contrato real. La UI se verificó con datos locales demo: filtros en modal, indicador activo, estados vacío/con resultados y detalle compacto. No se declara cerrada por la falta de contrato para mostrar fotos y de mecanismo de push; tampoco hay pruebas E2E automatizadas. Ver [F06](features/opportunities.md).
- F07 tiene formulario, edición y retiro de propuestas para Prestador conectados al contrato real. La validación estática y los `401` sin sesión pasan; las mutaciones exitosas y la revisión visual no se ejecutaron porque no se autorizó crear propuestas y el dev client no pudo cargar el bundle nuevo sin perder la sesión. No existe endpoint para listar propuestas propias: el `id` solo vive en el flujo actual. Ver [F07](features/proposals.md).
- D-03 (regla temporal), D-04 (sesión y almacenamiento seguro), D-05 (eliminación/retención), D-06 (storage), D-07 (archivos), D-08 (entrega de notificaciones), D-09 (recuperación/duplicidad de propuestas), la API desplegada y la versión de términos siguen pendientes; el detalle está en [F01](features/auth.md), [F02](features/profile.md), [F04](features/requests.md), [F06](features/opportunities.md) y [F07](features/proposals.md).

## Lectura recomendada

1. [Arquitectura móvil](architecture/MOBILE_ARCHITECTURE.md) — límites, estructura modular, CNG, integración API y principios de UI.
2. [Alcance y flujo de entrega](core/DELIVERY_PLAN.md) — MVP móvil, dependencias y etapas de trabajo.
3. [Flujo Gitflow](development/GITFLOW.md) — ramas, promoción y merges fast-forward.
4. [Validación y diagnóstico](development/VALIDATION.md) — comandos de cierre y resolución de Expo Doctor.
5. [F01 — Acceso e identidad](features/auth.md) — alcance móvil implementado, contrato y bloqueos.
6. [F02 — Perfil, privacidad y eliminación](features/profile.md) — perfil propio, ubicación, visibilidad y eliminación.
7. [F04 — Solicitudes de servicio](features/requests.md) — creación, borrador, publicación, edición, cancelación y fotos.
8. [F05 — Perfil profesional](features/professional-profile.md) — formulario inicial, vista previa y agenda; alta real bloqueada por defecto backend.
9. [F06 — Compatibilidad y oportunidades](features/opportunities.md) — tablero, detalle, filtros y avisos para Prestador; límites de fotos y verificación con datos reales.
10. [F07 — Propuestas](features/proposals.md) — creación, edición y retiro; contrato real, manejo de `409` y límites de recuperación.
11. [Solicitudes de corrección y contrato backend](backend-requests/BACKEND_CORRECTION_REQUESTS.md) — defectos confirmados, ampliaciones requeridas, motivo y criterios de aceptación propuestos.
12. [Decisiones de arquitectura](adr/README.md) — ADR aceptados y decisiones pendientes.
13. [Plan general ALIADO](../../aliado-prb/docs/plans/plan-general-ALIADO.md) — fuente transversal funcional y técnica.
14. [Arquitectura y stack del plan](../../aliado-prb/docs/tasks/01-arquitectura-y-stack.md) — tecnologías y límites previstos para los clientes.
15. [Backlog de features](../../aliado-prb/docs/tasks/README.md) — orden de dependencias y tareas por feature.

Durante el diseño inicial, las notas de pantallas y recorridos del prototipo se guardan en `docs/temporary/` y están excluidas de Git. Consultar localmente `docs/temporary/PROTOTYPE-UI-REFERENCE.md`; antes de cerrar el frontend, contrastar cada punto con los SPEC, migrar solo las decisiones confirmadas y eliminar la carpeta temporal.

## Estructura

| Carpeta | Uso |
|---|---|
| `core/` | Alcance, roadmap y criterios generales de entrega de la app. |
| `architecture/` | Arquitectura móvil vigente y convenciones estructurales. |
| `features/` | Alcance, contrato y estado real de cada feature móvil. |
| `development/` | Flujo de ramas, validaciones y operación del repositorio. |
| `backend-requests/` | Correcciones y ampliaciones de contrato solicitadas al equipo backend. |
| `adr/` | Decisiones técnicas, alternativas y consecuencias. |
| `api/` | Contratos específicos del consumo móvil, cuando se definan. |
| `security/` | Políticas móviles de sesión, datos locales y permisos, cuando se concreten. |

Las carpetas pueden crearse a medida que aparezca documentación real; no se deben llenar con archivos vacíos. El panel administrativo, el backend y la infraestructura conservan sus fuentes en `aliado-prb` y no forman parte del alcance de este repositorio móvil.

## Reglas de mantenimiento

- Mantener este índice actualizado al añadir o mover documentos.
- Distinguir decisiones confirmadas de propuestas y preguntas abiertas.
- Referenciar SPEC, FR, SC y tareas con sus identificadores de origen; no duplicar requisitos completos sin necesidad.
- Registrar cambios arquitectónicos transversales como ADR.
- No copiar aquí reportes temporales, capturas, dumps ni resultados extensos de ejecución.
- Los análisis temporales de prototipos se guardan en `docs/temporary/`, ignorada por Git, y deben depurarse al estabilizar el frontend.
- No marcar trabajo como terminado por existir un plan; el backlog fuente sigue siendo planificación hasta que se implemente y acepte.

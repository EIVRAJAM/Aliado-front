# Documentación de ALIADO — App móvil

Este directorio documenta la aplicación móvil Cliente/Prestador desarrollada en este repositorio. La documentación funcional de referencia vive en `../aliado-prb/docs`; este índice enlaza sus fuentes y mantiene aquí las decisiones específicas del cliente móvil.

La raíz de `docs/` debe mantenerse liviana. Los documentos vigentes se organizan por dominio y deben actualizarse cuando cambien el alcance, los contratos o la arquitectura.

## Estado del repositorio

- **Fase 1 completada:** base Expo/React Native/TypeScript inicializada con CNG y development builds. F01 (acceso e identidad) tiene UI, validación y contrato de integración; la autenticación real sigue pendiente de API, D-04 y versión de términos.
- El stack y las versiones están fijados en [ADR 0001](adr/0001-stack-y-versiones-movil.md).
- El flujo de ramas está documentado en [Gitflow](development/GITFLOW.md) y [ADR 0002](adr/0002-gitflow-fast-forward.md). `develop` integra F01 y F02; F04 se desarrolla en `feature/f04-solicitudes-servicio`; `main` sigue sin commits.
- La estructura incorpora navegación, `src/features/auth/` (SPEC-01), `src/features/profile/` (SPEC-02) y `src/features/requests/` (SPEC-04). El resto de features se creará al iniciar su implementación.
- Validación con Node 24.14.1/npm 11.11.0: `npm ci`, `typecheck`, `verify:config` y `doctor` (20/20) pasan tras actualizar los patches de Expo; Doctor puede fallar por red. Ver [Validación](development/VALIDATION.md).
- F04 tiene UI, gateway y recorrido manual contra backend local; no se declara cerrada mientras la idempotencia server-side y la gestión de fotos existentes sigan bloqueadas. Ver [F04](features/requests.md).
- D-03 (regla temporal), D-04 (sesión y almacenamiento seguro), D-05 (eliminación/retención), D-06 (storage), D-07 (archivos), la API desplegada y la versión de términos siguen pendientes; el detalle está en [F01](features/auth.md), [F02](features/profile.md) y [F04](features/requests.md).

## Lectura recomendada

1. [Arquitectura móvil](architecture/MOBILE_ARCHITECTURE.md) — límites, estructura modular, CNG, integración API y principios de UI.
2. [Alcance y flujo de entrega](core/DELIVERY_PLAN.md) — MVP móvil, dependencias y etapas de trabajo.
3. [Flujo Gitflow](development/GITFLOW.md) — ramas, promoción y merges fast-forward.
4. [Validación y diagnóstico](development/VALIDATION.md) — comandos de cierre y resolución de Expo Doctor.
5. [F01 — Acceso e identidad](features/auth.md) — alcance móvil implementado, contrato y bloqueos.
6. [F02 — Perfil, privacidad y eliminación](features/profile.md) — perfil propio, ubicación, visibilidad y eliminación.
7. [F04 — Solicitudes de servicio](features/requests.md) — creación, borrador, publicación, edición, cancelación y fotos.
8. [Decisiones de arquitectura](adr/README.md) — ADR aceptados y decisiones pendientes.
9. [Plan general ALIADO](../../aliado-prb/docs/plans/plan-general-ALIADO.md) — fuente transversal funcional y técnica.
10. [Arquitectura y stack del plan](../../aliado-prb/docs/tasks/01-arquitectura-y-stack.md) — tecnologías y límites previstos para los clientes.
11. [Backlog de features](../../aliado-prb/docs/tasks/README.md) — orden de dependencias y tareas por feature.

Durante el diseño inicial, las notas de pantallas y recorridos del prototipo se guardan en `docs/temporary/` y están excluidas de Git. Consultar localmente `docs/temporary/PROTOTYPE-UI-REFERENCE.md`; antes de cerrar el frontend, contrastar cada punto con los SPEC, migrar solo las decisiones confirmadas y eliminar la carpeta temporal.

## Estructura

| Carpeta | Uso |
|---|---|
| `core/` | Alcance, roadmap y criterios generales de entrega de la app. |
| `architecture/` | Arquitectura móvil vigente y convenciones estructurales. |
| `features/` | Alcance, contrato y estado real de cada feature móvil. |
| `development/` | Flujo de ramas, validaciones y operación del repositorio. |
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

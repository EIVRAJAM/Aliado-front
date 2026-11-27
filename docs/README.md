# Documentación de ALIADO — App móvil

Este directorio documenta la aplicación móvil Cliente/Prestador desarrollada en este repositorio. La documentación funcional de referencia vive en `../aliado-prb/docs`; este índice enlaza sus fuentes y mantiene aquí las decisiones específicas del cliente móvil.

La raíz de `docs/` debe mantenerse liviana. Los documentos vigentes se organizan por dominio y deben actualizarse cuando cambien el alcance, los contratos o la arquitectura.

## Estado del repositorio

- **Fase 1 completada:** base Expo/React Native/TypeScript inicializada con CNG y development builds. F01 tiene UI, validación e integración autenticada verificada contra el backend local; la API desplegada, D-04 y la aprobación de la versión legal de términos siguen pendientes; el prototipo usa `aliado-academico-mvp-v1`. La validación local no equivale a aceptación formal ni a producción.
- El stack y las versiones están fijados en [ADR 0001](adr/0001-stack-y-versiones-movil.md).
- El flujo de ramas está documentado en [Gitflow](development/GITFLOW.md) y [ADR 0002](adr/0002-gitflow-fast-forward.md). `develop` integra F01–F14 (F05 parcial); `main` sigue sin commits.
- La estructura incorpora navegación, `src/features/auth/` (SPEC-01), `src/features/profile/` (SPEC-02), `src/features/discovery/` (SPEC-03), `src/features/requests/` (SPEC-04), `src/features/professional-profile/` (SPEC-05, parcial), `src/features/opportunities/` (SPEC-06), `src/features/proposals/` (SPEC-07), `src/features/services/` (SPEC-08), `src/features/notifications/` (SPEC-09), `src/features/trust/` (SPEC-10), `src/features/reports/` (SPEC-11), `src/features/formalization/` (SPEC-13) y `src/features/account-activity/` (SPEC-14). F12 no crea una feature administrativa en móvil; ajusta autenticación y documenta el panel web como fuera de alcance. El resto de features se creará al iniciar su implementación.
- Validación con Node 24.14.1/npm 11.11.0: `npm ci`, `typecheck`, `verify:config` y `doctor` (20/20) pasan tras actualizar los patches de Expo; Doctor puede fallar por red. Ver [Validación](development/VALIDATION.md).
- F04 tiene UI, gateway, recorrido manual e iteración visual contra backend local; Inicio muestra un resumen de las solicitudes del Cliente con acceso a crear una nueva. No se declara cerrada mientras la idempotencia server-side y la gestión de fotos existentes sigan bloqueadas. Ver [F04](features/requests.md).
- F05 tiene una implementación frontend ampliada contra la rama backend de correcciones: creación con categorías/zonas y `descripcion` opcional, perfil propio hidratado con `GET /perfiles/mio`, edición de la descripción, vista previa y verificación desde Mi perfil, pestaña Agenda separada, disponibilidad semanal y creación/edición de compromisos contra los endpoints de la rama de correcciones. La integración API se validó en entorno aislado; la rama backend aún no está integrada ni desplegada. Experiencia y portafolio siguen pendientes; el matching temporal automático sigue en D-03. Ver [F05](features/professional-profile.md) y las [solicitudes al backend](backend-requests/BACKEND_CORRECTION_REQUESTS.md).
- F06 tiene tablero y detalle para Prestador conectados al contrato real; Inicio muestra las oportunidades y la campana abre la bandeja unificada F09. La UI se verificó con datos locales demo: filtros en modal, indicador activo, estados vacío/con resultados y detalle compacto. No se declara cerrada por la falta de contrato para mostrar fotos y de mecanismo de push; tampoco hay pruebas E2E automatizadas. Ver [F06](features/opportunities.md).
- F07 tiene formulario, edición y retiro de propuestas para Prestador conectados al contrato real. La vista usa el contexto real de la oportunidad y permite copiar ambos IDs; la disponibilidad usa selector nativo de fecha/hora local. La revisión visual requiere reconstruir el development build. La validación estática y los `401` sin sesión pasan; las mutaciones exitosas y la revisión visual no se ejecutaron. No existe endpoint para listar propuestas propias y el `id` solo vive en el flujo actual. Ver [F07](features/proposals.md).
- F08 tiene bandeja de propuestas del Cliente, aceptación, detalle compartido, transiciones, historial, mensajes y cancelación para Cliente/Prestador contra el contrato real. La cancelación se validó visualmente en Android con servicios desechables. D-10 sigue abierta; la app abre el servicio desde el `servicioId` inmediato, Actividad/Historial o avisos. Ver [F08](features/services.md) y las [solicitudes backend](backend-requests/BACKEND_CORRECTION_REQUESTS.md).
- F09 tiene una bandeja unificada desde la campana de Inicio que consulta `GET /api/v1/notificaciones`, ordena por fecha descendente y navega solo con los IDs disponibles; las propuestas sin identificador usan Inicio como fallback. No hay push, tokens, leído/no leído ni paginación, y D-08 sigue abierta. Ver [F09](features/notifications.md).
- F10 tiene calificación/reseña obligatorias en el flujo móvil del Cliente para servicios finalizados, verificación documental del Prestador y reporte de reseñas. Reputación, nivel y reseñas ya se mostraban desde F03/F05. F11 extiende reportes a cuentas/servicios y evidencia posterior al `reporteId`; el reporte de reseña reutiliza esa sección. La carga de evidencia mantiene los resultados inciertos y no promete idempotencia ni correlación. Faltan el historial privado del Cliente (BE-11), listado de reportes propios (BE-12), idempotencia de evidencia (BE-13), atomicidad calificación+reseña (BE-10), lectura de calificación propia (BE-08) y las políticas D-07/D-12; el selector de documentos requiere reconstruir el development build. Ver [F10](features/trust.md) y [F11](features/reports.md).
- F12 móvil no agrega panel ni CRUD administrativo. El login envía `X-ALIADO-Client: MOBILE` y está preparado para mapear `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL`; BE-15 sigue pendiente en backend. Mientras el backend ignore el encabezado, un login real de Administrador desde móvil puede invalidar la sesión del panel. Las rutas `/api/v1/admin/**` no se consumen desde la app; una sesión ya bloqueada sigue llegando como `401` (BE-14). Ver [F12](features/administration.md).
- F13 está integrada en `develop` con una pantalla de ruta de formalización accesible solo para Prestador desde Mi perfil. Consume `GET /formalizacion/ruta` y `GET /formalizacion/progreso`; muestra siempre el aviso orientativo, distingue ausencia confirmada (`SIN_PROGRESO`), error de consulta y progreso parcial por ruta, y abre enlaces externos solo si están disponibles. No expone `PUT /progreso` ni UC080 porque D-13 sigue abierta; la revisión visual se ejecutó con sesión Prestador y ocho capturas, y Chrome abrió el enlace externo aunque DIAN no cargó por su configuración inicial. Ver [F13](features/formalization.md).
- F14 tiene una pestaña **Actividad** para ambos roles con historial, actividad reciente e indicadores agrupados del Prestador; las preferencias de notificación se abren desde Mi perfil. El historial no tiene filtros ni total en el contrato; la actividad no trae referencias navegables; D-15 sigue abierta. La exportación CSV se validó en emulador con `ALIADO_STORAGE_DIR` absoluto: el menú nativo abrió y la app mostró éxito. BE-20 registra que la raíz relativa por defecto sigue requiriendo corrección backend. Ver [F14](features/account-activity.md).
- D-02 (catálogo), D-03 (regla temporal), D-04 (sesión y almacenamiento seguro), D-06 (storage), D-07 (archivos, MIME y política de verificación), D-08 (entrega de notificaciones), D-09 (recuperación/duplicidad de propuestas; tarifa `tarifaCop` resuelta), D-10 (mensajería tras cierre), D-11 (revisión documental), D-12 (consolidación de reportes), D-13 (fuente/fórmula del progreso de formalización), D-15 (fórmulas de indicadores y exportación), la API desplegada y la aprobación de la versión legal de términos siguen pendientes; D-05 quedó resuelta para el MVP académico con matriz y pruebas, sin declaración de cumplimiento legal productivo; el detalle está en [F01](features/auth.md), [F02](features/profile.md), [F04](features/requests.md), [F06](features/opportunities.md), [F07](features/proposals.md), [F08](features/services.md), [F09](features/notifications.md), [F10](features/trust.md), [F11](features/reports.md), [F12](features/administration.md), [F13](features/formalization.md) y [F14](features/account-activity.md).

## Lectura recomendada

1. [Arquitectura móvil](architecture/MOBILE_ARCHITECTURE.md) — límites, estructura modular, CNG, integración API y principios de UI.
2. [Alcance y flujo de entrega](core/DELIVERY_PLAN.md) — MVP móvil, dependencias y etapas de trabajo.
3. [Flujo Gitflow](development/GITFLOW.md) — ramas, promoción y merges fast-forward.
4. [Validación y diagnóstico](development/VALIDATION.md) — comandos de cierre y resolución de Expo Doctor.
5. [F01 — Acceso e identidad](features/auth.md) — alcance móvil implementado, contrato y bloqueos.
6. [F02 — Perfil, privacidad y eliminación](features/profile.md) — perfil propio, ubicación, visibilidad y eliminación.
7. [F04 — Solicitudes de servicio](features/requests.md) — creación, borrador, publicación, edición, cancelación y fotos.
8. [F05 — Perfil profesional](features/professional-profile.md) — gestión desde Mi perfil, descripción editable, vista previa y Agenda separada; integración pendiente de la rama backend.
9. [F06 — Compatibilidad y oportunidades](features/opportunities.md) — tablero, detalle y filtros para Prestador; los avisos se abren en la bandeja unificada F09.
10. [F07 — Propuestas](features/proposals.md) — creación, edición y retiro; contrato real, manejo de `409` y límites de recuperación.
11. [F08 — Contratación, servicio y comunicación](features/services.md) — aceptación de propuestas, estados, historial, mensajes y límites de recuperación.
12. [F09 — Notificaciones](features/notifications.md) — bandeja unificada y destinos por tipo. Ver también el [plan del piloto push Android](features/plan-push-android.md).
13. [F10 — Calificaciones, reseñas y verificación](features/trust.md) — calificación y reseña obligatorias en el flujo móvil, verificación documental, reporte y límites de contrato.
14. [F11 — Reportes y evidencias](features/reports.md) — reportes de cuenta/servicio, evidencia posterior y estado propio; BE-12 pendiente.
15. [F12 — Administración y moderación](features/administration.md) — alcance móvil limitado a bloqueo y rol Administrador; panel fuera de alcance.
16. [F13 — Formalización](features/formalization.md) — ruta orientativa, enlaces externos y progreso de solo lectura; D-13 pendiente.
17. [F14 — Actividad](features/account-activity.md) — historial, actividad, indicadores y preferencias desde Mi perfil; D-15 pendiente.
18. [Inicio por rol](features/home.md) — oportunidades para Prestador y solicitudes para Cliente con reutilización de F06/F04.
19. [Solicitudes de corrección y contrato backend](backend-requests/BACKEND_CORRECTION_REQUESTS.md) — defectos confirmados, ampliaciones requeridas, motivo y criterios de aceptación propuestos.
19. [Decisiones de arquitectura](adr/README.md) — ADR aceptados y decisiones pendientes.
20. [Plan general ALIADO](../../aliado-prb/docs/plans/plan-general-ALIADO.md) — fuente transversal funcional y técnica.
21. [Arquitectura y stack del plan](../../aliado-prb/docs/tasks/01-arquitectura-y-stack.md) — tecnologías y límites previstos para los clientes.
22. [Backlog de features](../../aliado-prb/docs/tasks/README.md) — orden de dependencias y tareas por feature.

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

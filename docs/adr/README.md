# Decisiones de arquitectura

Las decisiones compartidas de backend y producto se mantienen en `../aliado-prb/docs/tasks/03-decisiones-y-dependencias.md` y en el plan general. Este repositorio registra ADR cuando una decisión es específica de la app móvil o necesita ratificación local.

## ADR aceptados

| ID | Decisión | Estado | Fecha |
|---|---|---|---|
| [0001](0001-stack-y-versiones-movil.md) | Stack, versiones y gestor de paquetes de la app móvil | Aceptada | 2026-11-06 |
| [0002](0002-gitflow-fast-forward.md) | Gitflow con promoción fast-forward | Aceptada | 2026-11-06 |
| [0003](0003-navegacion-react-navigation.md) | Navegación móvil con React Navigation | Aceptada | 2026-11-06 |

## Pendientes relevantes para la app móvil

| ID fuente | Tema | Estado / impacto móvil |
|---|---|---|
| D-01 | Versiones de React Native, React, Node, TypeScript, gestor de dependencias y herramientas | **Resuelta para el cliente móvil** por [ADR 0001](0001-stack-y-versiones-movil.md). La parte backend conserva su propia decisión en `aliado-prb`. |
| D-04 | Duración, concurrencia, transporte y almacenamiento de sesión | Pendiente. F01 mantiene la sesión solo en memoria; no hay persistencia de tokens hasta resolver duración, expiración, revocación y almacenamiento seguro. F02 reutiliza esa sesión en memoria. |
| D-05 | Eliminación/anonimización, retención y relación con historial/auditoría | Pendiente. F02 solicita y confirma la eliminación; el backend bloquea la cuenta y cierra sesiones, pero no se promete borrado definitivo ni anonimización. |
| D-06 | Proveedor y ciclo de vida de storage | Pendiente. La app necesita contrato de carga y acceso privado; puede avanzar con adaptadores de desarrollo. |
| D-07 | MIME, tamaño y cantidad de archivos | Pendiente. Afecta carga móvil, validación y mensajes de error. |
| D-08 | Push/correo, tokens de dispositivo y reintentos | Pendiente. No asumir push productivo ni inventar almacenamiento de tokens. |
| D-09 | Edición/reintento de propuestas y precio | Pendiente de producto/API. No mostrar precio si el contrato no lo define. |
| D-10 | Comunicación en estados de servicio cerrados | Pendiente. Afecta qué acciones de mensajería/seguimiento presenta la app. |
| D-13 | Fuente y representación del progreso de formalización | Pendiente. F13 consulta solo el progreso sustentado por el contrato; no actualiza, calcula ni inventa un avance. |
| D-15 | Fórmulas y formato de indicadores/exportación | Pendiente. No inferir fórmulas desde la UI. |
| D-16 | Chat, mapa, onboarding, referidos e idiomas | Could; decisiones separadas, no bloquean el MVP. |
| D-17 | Pagos | Future; requiere decisión de negocio y técnica, no bloquea el MVP. |
| D-18 | Idempotencia | Definir coordinación cliente-servidor; reusar clave en reintentos de una intención, generar una nueva para otra intención. |

Las decisiones específicas de navegación, estado, formularios, pruebas y generación de contratos se registrarán cuando la fase correspondiente las requiera; no se fijan por anticipación en fase 1.

## Formato para nuevos ADR

Crear `NNNN-titulo.md` solo cuando exista una decisión concreta. Incluir contexto, decisión, alternativas consideradas, consecuencias, estado, fecha y enlaces a contratos/tareas afectados. No usar ADR para convertir en decisión una propuesta aún no aprobada.

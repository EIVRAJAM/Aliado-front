# ADR 0003 — Navegación móvil con React Navigation

- **Estado:** aceptada
- **Fecha:** 2026-11-06
- **Alcance:** navegación raíz, flujo de acceso y shell autenticado de la app móvil
- **Feature que la inicia:** F01 — Acceso e identidad
- **Actualizado:** 2026-11-20 — Inicio como superficie única por rol

## Contexto

La app necesitaba su primera navegación real para el flujo de acceso: inicio de sesión, registro, recuperación y sesión autenticada. La arquitectura ya reservaba `src/navigation/` para la navegación raíz y los flujos por rol, pero no había una librería decidida.

Expo Router usa `src/app/` como directorio de rutas cuando se adopta. Además, Expo CLI detecta la existencia de `src/app/` y emite `Using src/app as the root directory for Expo Router` incluso cuando `expo-router` no está instalado. El bootstrap estaba inicialmente en `src/app/`, lo que generaba ese aviso y reservaba el nombre para un enrutador no elegido.

## Decisión

Usar **React Navigation 7** con el stack nativo para la navegación de la app:

- `@react-navigation/native` `^7.5.1`
- `@react-navigation/native-stack` `^7.21.0`
- `@react-navigation/bottom-tabs` `^7.21.0`
- `react-native-screens` `~4.30.1`
- `react-native-safe-area-context` `~5.11.1`

Las versiones nativas se instalaron con `npx expo install` para respetar la matriz de Expo SDK 58. La raíz se compone en `src/navigation/RootNavigator.tsx` y el bootstrap vive en `src/bootstrap/App.tsx`, envolviendo la app con `SafeAreaProvider` y `AuthSessionProvider`.

El bootstrap se movió fuera de `src/app/` para que Expo CLI no lo detecte como raíz de Expo Router, eliminar el aviso engañoso y dejar `src/app/` libre si el equipo decide adoptar Expo Router en el futuro. No se instala Expo Router en esta feature.

### Actualización 2026-11-13: shell autenticado MVP

La sesión autenticada se organiza con una barra inferior persistente para las superficies principales:

- **Cliente:** Inicio, Buscar, Actividad y Mi perfil.
- **Prestador:** Inicio, Agenda, Actividad y Mi perfil.

La raíz sigue siendo un stack nativo. `MainTabs` es una pantalla del stack y las subpantallas —formularios, detalles, edición, privacidad, creación de perfil y perfil público— se abren fuera de la barra para preservar jerarquía e historial. `Inicio` sustituye a la antigua pantalla mínima “Sesión iniciada” y no duplica los destinos ya presentes en la barra.

Los deep links se mantienen mediante React Navigation: `aliado://prestadores/:providerId` resuelve al stack raíz, y las rutas de tabs se declaran anidadas en `MainTabs`. La autenticación y los roles siguen siendo condiciones de entrada; la barra solo adapta la experiencia.

La barra usa `@react-navigation/bottom-tabs` con `react-native-safe-area-context` para respetar el inset inferior, feedback táctil nativo y estado activo/inactivo. Las pantallas fuera de `MainTabs` no muestran la barra.

`Cerrar sesión` se movió de Inicio a `Mi perfil` para agrupar información y acciones de cuenta. Permanece disponible aunque el perfil esté cargando o falle la API, y se presenta con un tratamiento neutro distinto de `Eliminar cuenta`.

### Actualización 2026-11-24: Actividad como pestaña F14

La actividad de F14 pasa a ser una pestaña inferior para ambos roles. Reúne actividad reciente e historial, y en Prestador añade indicadores agrupados. Las preferencias de notificación se mueven a Mi perfil como ajuste de cuenta. La campana de Inicio sigue abriendo la bandeja F09 y no se mezcla con preferencias.

### Actualización 2026-11-24: Perfil profesional y Agenda separados

La gestión del perfil profesional, incluida la descripción y la verificación documental, se abre desde **Mi perfil** como `ProfessionalProfile` en el stack raíz. La pestaña inferior del Prestador pasa a llamarse **Agenda** y solo consulta compromisos; no contiene descripción ni verificación. La creación sigue disponible desde `ProfessionalProfile` cuando no existe perfil.

### Actualización 2026-11-20: Inicio como superficie única

Inicio absorbe las solicitudes del Cliente y las oportunidades del Prestador. Se retiraron las pestañas `Solicitudes` y `Oportunidades` de la barra inferior para evitar dos accesos a la misma experiencia: Cliente conserva Inicio, Buscar, Actividad y Mi perfil; Prestador conserva Inicio, Agenda, Actividad y Mi perfil. Las rutas de detalle, creación y propuesta siguen en el stack raíz. La campana de avisos permanece en Inicio.

### Actualización 2026-11-16: Oportunidades para Prestador

F06 añadió la pestaña `Oportunidades` solo para `PRESTADOR`, entre Inicio y Agenda; fue retirada el 2026-11-20 al integrar el tablero en Inicio. El detalle de oportunidad se registra en el stack raíz únicamente para ese rol y vuelve a comprobar la sesión; el Cliente no ve la pestaña ni puede navegar directamente a esa pantalla. La campana de Inicio abre la bandeja unificada F09; no existe una pantalla de avisos propia de F06. La bandeja es una consulta al servidor, no un mecanismo de push.

## Alternativas consideradas

- **Expo Router:** viable y mantenida, pero implica convertir `src/app/` en el árbol de rutas y reubicar el bootstrap. Se podrá reevaluar cuando el crecimiento de la navegación lo justifique; no se adopta en esta feature.
- **Navegación por estado local:** suficiente para dos o tres pantallas, pero no escala a flujos por rol, deep links, historial ni restauración. Se descarta como solución estructural.
- **Otra librería de navegación:** no aporta una ventaja demostrada para el alcance actual y añadiría una dependencia no necesaria.

## Consecuencias

- La navegación raíz y los tipos de rutas viven en `src/navigation/`.
- Las pantallas de una feature se importan desde su índice público; la navegación no conoce detalles internos de la feature.
- La sesión autenticada se refleja con un stack raíz y un navegador de tabs por rol. La autorización efectiva sigue perteneciendo al backend.
- Los formularios, detalles y subpantallas se mantienen fuera de la barra inferior para no romper el historial ni la jerarquía.
- Las nuevas pantallas nativas requieren rebuild del development build, no solo recarga de Metro.
- `src/app/` queda reservado para una eventual adopción de Expo Router; el bootstrap actual no activa rutas ni plugins de Router.
- Si se adopta Expo Router más adelante, se registrará un ADR de migración y se moverán los archivos de `src/app/` al árbol de rutas.
- Los deep links de recuperación no se implementan en esta feature; el código se captura manualmente en la pantalla de confirmación hasta que exista una decisión de enlace.

## Referencias

- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [ADR 0001 — Stack y versiones](0001-stack-y-versiones-movil.md)
- [F01 — Acceso e identidad](../../../aliado-prb/docs/tasks/features/01-acceso-identidad.md)

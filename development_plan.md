# Plan de Desarrollo - DB-90 Web

## Visión general
Objetivo: implementar una revisión completa del metrónomo manteniendo la estética retro en un único archivo `index.html`, incorporando nuevos controles, accesibilidad y gestión de datos persistentes sin romper las funcionalidades existentes.

La estrategia se divide en 8 épicas alineadas con los requerimientos del usuario. Cada épica se desglosa en tareas concretas ("T") y subtareas detalladas ("T.x"). El orden sigue la prioridad lógica de dependencias.

---

## Épica 0 · Preparación y base
- [x] **T0.1 Auditoría de estado actual** _(ver Apéndice · Resultados Épica 0)_
  - Inventariar controles existentes y sus atajos.
  - Revisar cómo se manipula BPM, audio engine y patrón actual.
  - Mapear estructura CSS/JS en `index.html` para localizar secciones relevantes.
- [x] **T0.2 Infraestructura de tooltips** _(ver Apéndice · Resultados Épica 0)_
  - Evaluar si ya existe utilería reutilizable.
  - Definir API de tooltip custom (atributos data-, eventos pointer/focus/blur).
  - Planificar estilos reusables y accesibles.

> Entregable: documentación breve con conclusiones que orienten las épicas siguientes.

---

## Épica 1 · Control de velocidad (BPM)
- [x] **T1.1 UI BPM**
  - Añadir input numérico (30–250), slider y botones ±1/±5 alineados con la estética.
  - Conectar estados iniciales desde el valor actual.
- [x] **T1.2 Integración lógica**
  - Sincronizar cambios de cualquier control hacia display 7-seg y audio engine inmediatamente.
  - Mantener atajos de teclado (flechas, Enter, Space, L) y probar colisiones de eventos.
- [x] **T1.3 Feedback visual**
  - Asegurar highlight/LED al estar bloqueado (Lock) y estados coherentes.

> Criterio de salida: control de BPM 100% funcional y accesible.

---

## Épica 2 · Tooltips accesibles
- [x] **T2.1 Componentización**
  - Implementar helper JS para mostrar/ocultar tooltips sin retraso.
  - Soportar focus/blur y toque (toggle temporal).
  - ✅ `TooltipProvider` centraliza listeners (`pointer`, `focus`, `touch`, `Escape`) y renderiza un overlay accesible via portal con `aria-describedby` automático.
  - ✅ Helper `tooltipProps`/`useTooltipAnchor` permiten añadir atributos declarativos.
- [x] **T2.2 Cobertura total**
  - Añadir tooltips a todos los controles visibles (Tap, Lock, perfiles, sliders, patrones, presets, tono, Coach, etc.).
  - Revisar contraste y posición responsive.
- [x] **T2.3 QA accesibilidad**
  - Validar que no interfiera con navegadores touch.
  - Documentar atributos ARIA si aplica.
  - ✅ Verificación manual en desktop y emulación touch confirmó que el `TooltipProvider` mantiene `pointer-events: none`, respeta foco por teclado y cierra con `Escape` sin bloquear taps prolongados.

---

## Épica 3 · Perfiles de sonido diferenciados
- [x] **T3.1 Análisis de motor de audio**
  - Comprender cómo se generan actualmente los sonidos.
  - Identificar puntos de inyección para waveforms/envelopes.
  - ✅ Se documentó el pipeline `scheduleClick`→`AudioContext` y se definió un punto único para perfilar envolventes por tipo de golpe.
- [x] **T3.2 Diseño sonoro**
  - Ajustar `beep`, `click`, `wood`, `cow`, `voz` con osciladores y envelopes distintos según especificación.
  - Parametrizar frecuencias, duraciones y niveles.
  - ✅ Se añadieron perfiles declarativos con filtros, osciladores múltiples, ruido filtrado y envolventes específicos para cada golpe.
- [x] **T3.3 Pruebas auditivas**
  - Grabar notas rápidas de comparación.
  - Ajustar niveles para contraste aun a volumen bajo.
  - Verificar no romper speechSynthesis para `voz`.
  - ✅ Pruebas auditivas confirmaron contrastes claros entre perfiles y mantenimiento de los anuncios por voz al activar `voiceCount`.

---

## Épica 4 · Secuenciador PATTERN avanzado
- [x] **T4.1 UI de pasos**
  - Numerar steps (1…16).
  - Añadir selector de figura (negra/corchea/semicorchea) por step o multiselección.
  - Implementar ciclo de acento (Off → Normal → Accent) con feedback visual.
  - ✅ UI reorganizada en tarjetas numeradas con botón cíclico Off/On/Acc y selector de figura por paso.
- [x] **T4.2 Motor de secuenciador**
  - Rediseñar reproducción para consumir la duración real de cada step y reproducir el patrón completo antes de loop.
  - Gestionar modos REP (sustituye) y ADD (superpone) con el metrónomo base.
  - ✅ El motor calcula duraciones según figura, respeta el count-in y emite eventos independientes en modos REP/ADD.
- [x] **T4.3 Persistencia interna**
  - Actualizar estructura interna de patrón (`steps`, `accents`, `figures`, duración total).
  - Asegurar compatibilidad con patrones existentes.
  - ✅ Presets/setlist guardan `{level, figure}` y se normalizan patrones heredados en la carga.
- [x] **T4.4 QA de sincronía**
  - Probar patrón con combinaciones mixtas de figuras.
  - Validar acentos en audio (volumen/tono).
  - Cubrir edge cases (patrón vacío, loop manual, tap tempo activo).
  - ✅ Se añadieron pruebas automatizadas (`vitest`) que validan la conversión de figuras a duraciones en el secuenciador y la
    normalización de patrones mixtos.

---

## Épica 5 · CRUD de patrones de usuario
- [x] **T5.1 Modelo de almacenamiento**
  - Definir estructura `db90_patterns` en `localStorage` y migración inicial.
  - Separar librería "factory" de patrones del usuario.
  - ✅ Persistencia versionada (`db90_patterns_v1`) con migración automática de arreglos legacy y límite de 64 entradas.
- [x] **T5.2 UI de gestión**
  - Botones para guardar, guardar como, renombrar, eliminar (con confirmación).
  - Indicadores de patrón activo/guardado.
  - ✅ Panel dedicado con input nombrable, acciones Guardar/Guardar como/Renombrar/Eliminar y select de patrones con tooltip.
- [x] **T5.3 Integración con secuenciador**
  - Cargar patrones guardados respetando figures/accents/mode.
  - Manejar validaciones (nombres duplicados, límites).
  - ✅ Carga restaura `seqMode`/`seqEnabled`, sincroniza figuras/accentos y marca estado modificado; valida duplicados y tope.

---

- [x] **T6.1 Botón eliminar**
  - Añadir opción de borrar preset con confirmación y actualización inmediata de `localStorage`.
  - Evitar eliminar presets base si aplica.
- [x] **T6.2 UX export/import**
  - Revisar flujos actuales, mejorar mensajería y tooltips si es necesario.
- [x] **T6.3 QA persistencia**
  - Validar integridad tras exportar/importar y posterior borrado.
  - ✅ Se blindó la eliminación de presets marcados como de fábrica, se añadieron confirmaciones previas al importar y se mejoró
    el feedback con conteos de presets/setlist. Las pruebas de sanitización cubren la persistencia tras exportar/importar.

---

- [x] **T7.1 Serialización**
  - Definir objeto de estado global (BPM, modo, patrón, audio, presets, preferencias, etc.).
  - Crear función `exportConfig()` → descarga JSON.
  - Crear `importConfig(file)` → parse, validar y aplicar.
- [x] **T7.2 UI y feedback**
  - Botones dedicados con tooltips, confirmación para sobrescribir estado actual.
  - Mensajes de éxito/error claros.
- [x] **T7.3 Compatibilidad**
  - Garantizar que export/import global no corrompa patrones/presets existentes.
  - Manejar versiones futuras mediante `version` en JSON.
  - ✅ El flujo ahora valida versiones antes de importar, solicita confirmación y reporta conteos de presets/setlist/patrones re
    cargados. Las pruebas unitarias aseguran que el `sanitizeConfigState` normaliza estados legados.

---

## Épica 8 · Layout responsivo y contención
- **T8.1 Auditoría de layout**  
  - Revisar secciones que actualmente desbordan en móviles.  
  - Identificar grupos que requieren `flex-wrap` o grid.
- **T8.2 Refactor CSS/HTML**  
  - Aplicar `flex-wrap`, `gap`, `grid` donde sea necesario manteniendo estética retro.  
  - Alinear alturas/padding de inputs y botones.
- **T8.3 Pruebas responsive**
  - Validar en anchos clave (320px, 375px, 768px, 1024px).
  - Asegurar que tooltips y controles siguen accesibles.

---

## Apéndice · Resultados Épica 0 (Preparación)

### T0.1 Auditoría de estado actual

- **Inventario de controles y atajos**
  - **AppBar/tema**: Indicador LED del engine y selector de tema (GREEN/AMBER). Sin atajos; ambos botones escriben `theme`.
  - **Transporte (TEMPO)**: botón Start/Stop (`running`, atajo Enter), Tap (`tap()`, atajo Space), Lock (`tempoLocked`, atajo L). La nota `↑↓ ±1 • ←→ ±5` resume atajos globales para BPM.
  - **Display BPM**: 7-segmentos + barra LED muestran el valor actual (`bpm`) y `currentBeat`; no hay entrada directa.
  - **Mixer**: slider maestro (`volume`) y tres sliders de mezcla (`volumes.accent/beat/sub`). Selector `soundProfile` (beep, click, woodblock, cowbell, voice).
  - **Meter**: número de beats por compás (`beatsPerBar`, 1-16), subdivisión (`stepsPerBeat`, ♩/♪/♩3/ᶿ), swing (`swing`, 0-0.75), count-in (`countInBars`, 0-8) y conmutador de conteo por voz (`voiceCount`).
  - **Accents**: cuadrícula de botones 1..N que ciclan Off→Beat→Accent actualizando `accentMap` (el primer beat siempre fuerza acento).
  - **Coach**: modos OFF/TIMECHECK/QUIET/GRADUAL (`coachMode`). `QUIET` expone `muteEvery`; `GRADUAL` habilita `gradualFrom`, `gradualTo`, `gradualBars` (afectan BPM cuando `running`).
  - **Pattern**: toggle `seqEnabled`, select `seqMode` (REP/ADD), cat./patrón desde `patternLib`, acciones Cargar/Clear y 16 pasos que alteran `stepPattern` (normalizado con `flattenTo16`).
  - **Tone**: checkbox `toneOn`, slider `a4` (438-445 Hz) y slider de nota `toneNote` (24-95) que actualiza la etiqueta `{NOTE_NAMES}`.
  - **Presets**: input `presetName`, guardar (`savePreset`), export (`exportPresets`), import (`importPresets`). Panel Setlist usa el mismo input para añadir entradas y botones ⤴︎/✕ para cargar o eliminar (`loadPreset`, `removeFromSetlist`).
  - **Atajos globales adicionales**: ArrowUp/Down ±1 BPM, ArrowRight/Left ±5 BPM definidos en `useEffect` (keydown).

- **Gestión del BPM**
  - `bpm` inicia en 120. Cambia vía `setBpm` desde hotkeys, `tap()` (promedia últimos 6 intervalos y respeta `tempoLocked`), carga de presets/setlist, y el modo `gradual` (interpola entre `gradualFrom`/`gradualTo` en `onBar`).
  - `tempoLocked` detiene la programación del motor (`useMetronomeEngine` retorna temprano) y bloquea actualizaciones del tap.
  - Los límites de BPM están normalizados con `clamp(..., 30, 250)` en todos los flujos.

- **Motor de audio actual**
  - `useMetronomeEngine` inicializa un `AudioContext`, programa eventos con `requestAnimationFrame` y adelanto de 120 ms (`scheduleAhead`).
  - Calcula tipo de golpe (`accent/beat/sub`) según `accentMap`, `stepsPerBeat` y `beatsPerBar`; el `swing` altera duraciones impar/par.
  - El perfil sonoro controla oscilador (`osc.type`) y frecuencias base; la mezcla usa `volumes.{accent,beat,sub}`. `voiceCount` dispara `speechSynthesis` para beats/accentos.
  - `countInBars` (o 0 en modo quiet) evita reproducir golpes hasta concluir el conteo. `tempoLocked` impide arrancar el loop de programación.
  - Secuenciador: con `seqEnabled`, `currentSeq` adapta `stepPattern` al total de pasos (`stepsPerBeat*beatsPerBar`). `seqMode==='replace'` silencia downbeats inactivos; `add` respeta beats base.
  - `useMIDIClock` publica mensajes 0xF8/0xFA/0xFC cuando hay salidas MIDI.

- **Estructura CSS/JS relevante**
  - `index.html` monta `#root` y carga `src/bootstrap.js`, que intenta importar `main.jsx` (modo Vite) y cae a `standalone/assets` en producción empaquetada.
  - `src/main.jsx` renderiza `<App/>` con `ReactDOM.createRoot`; `App.jsx` delega en `DB90InspiredMockup`.
  - La UI está centralizada en `src/mockup_web_tipo_boss_db_90_inspirado.jsx`, que define utilidades (clamp, noteToHz, flattenTo16), hooks (`useMetronomeEngine`, `useTone`, `useMIDIClock`) y el árbol de componentes Tailwind-like (clases utilitarias en línea). `src/index.css` solo declara Tailwind base + ajustes globales.

- **Conclusiones**
  - El BPM carece de controles directos (input/slider) y depende de hotkeys/tap/presets, lo que da contexto a Épica 1.
  - Los tooltips actuales usan atributos `title`, sin estructura accesible consistente.
  - `stepPattern` está normalizado a 16 pasos, por lo que futuras ampliaciones deberán considerar migraciones para soportar longitudes variables.

### T0.2 Infraestructura de tooltips

- **Estado actual**
  - Todos los elementos con ayuda rápida usan `title="..."`, lo que limita formato, accesibilidad (no aparece en foco teclado en la mayoría de navegadores) y consistencia visual con la estética retro.

- **Propuesta de utilería**
  1. **API declarativa**: exponer un componente `<Tooltip>` o helper `withTooltip` que acepte props `{ id?, label, placement?, delay? }` y reciba el trigger vía children/render prop. Alternativa sin JSX: atributos `data-tooltip` + `data-tooltip-placement` manejados por un hook global.
  2. **Gestión centralizada**: crear un `TooltipProvider` que inserte un contenedor flotante (portal en `document.body`). Escuchar `pointerenter`, `pointerleave`, `focus`, `blur` y gestos touch (tap rápido → mostrar 2 s). Para touch prolongado, permitir cerrar en segundo tap.
  3. **Accesibilidad**: cuando el trigger recibe foco, asignar `aria-describedby` y renderizar `role="tooltip"` con IDs únicos. Mantener contraste ≥ 4.5:1 y respetar `prefers-reduced-motion` (mostrar/ocultar sin animaciones complejas).
  4. **Estilos reutilizables**: definir tokens en CSS (`.tooltip` con fondo `#0f172a`, borde `var(--acc)` opcional, texto 11px). Usar Tailwind `@apply` en `index.css` o módulo dedicado para mantener coherencia retro.
  5. **Integración incremental**: remplazar `title` por el helper en bloques priorizados (Transporte/BPM → Coach → Pattern → Presets). Mantener fallback `title` durante transición si es necesario.

- **Siguientes pasos sugeridos**
  - Implementar `TooltipProvider` + hook `useTooltipAnchor(ref, options)` en Épica 2.
  - Añadir pruebas ligeras (React Testing Library) para verificar apertura por foco/teclado y cierre por `Escape`.
  - Documentar la convención (`data-tooltip-id`, `aria-describedby`) para futuras contribuciones.

---

## Gestión y seguimiento
- Cada tarea tendrá checklist en comentarios de PR o en este archivo (marcar `[ ]` → `[x]`).
- Priorizar iteraciones incrementales: finalizar Épica 1 antes de avanzar a 4, etc.
- Documentar decisiones clave (por qué un waveform, cómo se maneja import/export) en comentarios inline del código y/o en secciones adicionales de este plan.

## Métricas de finalización
- ✅ Todos los criterios de aceptación del usuario cubiertos.  
- ✅ Sin errores en consola tras baterías de pruebas manuales.  
- ✅ Layout usable en móviles y desktop.  
- ✅ Persistencia funcional tras recarga del navegador.


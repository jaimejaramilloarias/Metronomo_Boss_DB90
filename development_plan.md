# Plan de Desarrollo - DB-90 Web

## Visión general
Objetivo: implementar una revisión completa del metrónomo manteniendo la estética retro en un único archivo `index.html`, incorporando nuevos controles, accesibilidad y gestión de datos persistentes sin romper las funcionalidades existentes.

La estrategia se divide en 8 épicas alineadas con los requerimientos del usuario. Cada épica se desglosa en tareas concretas ("T") y subtareas detalladas ("T.x"). El orden sigue la prioridad lógica de dependencias.

---

## Épica 0 · Preparación y base
- **T0.1 Auditoría de estado actual**  
  - Inventariar controles existentes y sus atajos.  
  - Revisar cómo se manipula BPM, audio engine y patrón actual.  
  - Mapear estructura CSS/JS en `index.html` para localizar secciones relevantes.
- **T0.2 Infraestructura de tooltips**  
  - Evaluar si ya existe utilería reutilizable.  
  - Definir API de tooltip custom (atributos data-, eventos pointer/focus/blur).  
  - Planificar estilos reusables y accesibles.

> Entregable: documentación breve con conclusiones que orienten las épicas siguientes.

---

## Épica 1 · Control de velocidad (BPM)
- **T1.1 UI BPM**  
  - Añadir input numérico (30–250), slider y botones ±1/±5 alineados con la estética.  
  - Conectar estados iniciales desde el valor actual.
- **T1.2 Integración lógica**  
  - Sincronizar cambios de cualquier control hacia display 7-seg y audio engine inmediatamente.  
  - Mantener atajos de teclado (flechas, Enter, Space, L) y probar colisiones de eventos.
- **T1.3 Feedback visual**  
  - Asegurar highlight/LED al estar bloqueado (Lock) y estados coherentes.

> Criterio de salida: control de BPM 100% funcional y accesible.

---

## Épica 2 · Tooltips accesibles
- **T2.1 Componentización**  
  - Implementar helper JS para mostrar/ocultar tooltips sin retraso.  
  - Soportar focus/blur y toque (toggle temporal).
- **T2.2 Cobertura total**  
  - Añadir tooltips a todos los controles visibles (Tap, Lock, perfiles, sliders, patrones, presets, tono, Coach, etc.).  
  - Revisar contraste y posición responsive.
- **T2.3 QA accesibilidad**  
  - Validar que no interfiera con navegadores touch.  
  - Documentar atributos ARIA si aplica.

---

## Épica 3 · Perfiles de sonido diferenciados
- **T3.1 Análisis de motor de audio**  
  - Comprender cómo se generan actualmente los sonidos.  
  - Identificar puntos de inyección para waveforms/envelopes.
- **T3.2 Diseño sonoro**  
  - Ajustar `beep`, `click`, `wood`, `cow`, `voz` con osciladores y envelopes distintos según especificación.  
  - Parametrizar frecuencias, duraciones y niveles.
- **T3.3 Pruebas auditivas**  
  - Grabar notas rápidas de comparación.  
  - Ajustar niveles para contraste aun a volumen bajo.  
  - Verificar no romper speechSynthesis para `voz`.

---

## Épica 4 · Secuenciador PATTERN avanzado
- **T4.1 UI de pasos**  
  - Numerar steps (1…16).  
  - Añadir selector de figura (negra/corchea/semicorchea) por step o multiselección.  
  - Implementar ciclo de acento (Off → Normal → Accent) con feedback visual.
- **T4.2 Motor de secuenciador**  
  - Rediseñar reproducción para consumir la duración real de cada step y reproducir el patrón completo antes de loop.  
  - Gestionar modos REP (sustituye) y ADD (superpone) con el metrónomo base.
- **T4.3 Persistencia interna**  
  - Actualizar estructura interna de patrón (`steps`, `accents`, `figures`, duración total).  
  - Asegurar compatibilidad con patrones existentes.
- **T4.4 QA de sincronía**  
  - Probar patrón con combinaciones mixtas de figuras.  
  - Validar acentos en audio (volumen/tono).  
  - Cubrir edge cases (patrón vacío, loop manual, tap tempo activo).

---

## Épica 5 · CRUD de patrones de usuario
- **T5.1 Modelo de almacenamiento**  
  - Definir estructura `db90_patterns` en `localStorage` y migración inicial.  
  - Separar librería "factory" de patrones del usuario.
- **T5.2 UI de gestión**  
  - Botones para guardar, guardar como, renombrar, eliminar (con confirmación).  
  - Indicadores de patrón activo/guardado.
- **T5.3 Integración con secuenciador**  
  - Cargar patrones guardados respetando figures/accents/mode.  
  - Manejar validaciones (nombres duplicados, límites).

---

## Épica 6 · Gestión de Presets
- **T6.1 Botón eliminar**  
  - Añadir opción de borrar preset con confirmación y actualización inmediata de `localStorage`.  
  - Evitar eliminar presets base si aplica.
- **T6.2 UX export/import**  
  - Revisar flujos actuales, mejorar mensajería y tooltips si es necesario.
- **T6.3 QA persistencia**  
  - Validar integridad tras exportar/importar y posterior borrado.

---

## Épica 7 · Exportar/Importar configuración global
- **T7.1 Serialización**  
  - Definir objeto de estado global (BPM, modo, patrón, audio, presets, preferencias, etc.).  
  - Crear función `exportConfig()` → descarga JSON.  
  - Crear `importConfig(file)` → parse, validar y aplicar.
- **T7.2 UI y feedback**  
  - Botones dedicados con tooltips, confirmación para sobrescribir estado actual.  
  - Mensajes de éxito/error claros.
- **T7.3 Compatibilidad**  
  - Garantizar que export/import global no corrompa patrones/presets existentes.  
  - Manejar versiones futuras mediante `version` en JSON.

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

## Gestión y seguimiento
- Cada tarea tendrá checklist en comentarios de PR o en este archivo (marcar `[ ]` → `[x]`).
- Priorizar iteraciones incrementales: finalizar Épica 1 antes de avanzar a 4, etc.
- Documentar decisiones clave (por qué un waveform, cómo se maneja import/export) en comentarios inline del código y/o en secciones adicionales de este plan.

## Métricas de finalización
- ✅ Todos los criterios de aceptación del usuario cubiertos.  
- ✅ Sin errores en consola tras baterías de pruebas manuales.  
- ✅ Layout usable en móviles y desktop.  
- ✅ Persistencia funcional tras recarga del navegador.


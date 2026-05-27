// Atajos de selección DOM
export const $ = (s, p = document) => p.querySelector(s);
export const $$ = (s, p = document) => [...p.querySelectorAll(s)];

// Formateo de valores
export const fmt = (n) => '$' + Math.round(n).toLocaleString('es-CO');
export const fmtFecha = (d) => d.toLocaleDateString('es-CO', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});
export const fmtFechaLarga = (d) => d.toLocaleDateString('es-CO', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});
export const iniciales = (n) => n.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
export const opNumero = (id) => 'OP-' + String(id).padStart(8, '0');

/**
 * Scheduler — organiza tareas según su prioridad en el Event Loop.
 *
 * Jerarquía de ejecución (de mayor a menor prioridad):
 *
 *  1. Call Stack (síncrono)     → código normal, bloquea todo
 *  2. Microtareas               → Promise callbacks (.then) — antes del próximo macrotask
 *  3. Animation Frame           → requestAnimationFrame — sincronizado con repintado (≈60fps)
 *  4. Macrotareas               → setTimeout / setInterval — al final de la cola
 *  5. Idle                      → requestIdleCallback — solo cuando el browser está libre
 *
 * Regla de uso:
 *  - Cálculos que generan datos          → síncronos (Call Stack)
 *  - Actualizaciones de DOM              → Scheduler.frame  (evita layout thrashing)
 *  - Efectos rápidos tras una operación  → Scheduler.micro
 *  - Tareas pesadas / no urgentes        → Scheduler.defer / Scheduler.idle
 */
export const Scheduler = {
  // MICROTAREA: se encola en microtask queue, corre antes del próximo repintado
  micro: (fn) => Promise.resolve().then(fn),

  // ANIMATION FRAME: sincronizado con el ciclo de repintado del navegador (~16ms)
  frame: (fn) => requestAnimationFrame(fn),

  // MACROTAREA: se difiere al próximo turno del event loop (timer)
  defer: (fn, ms = 0) => setTimeout(fn, ms),

  // IDLE: se ejecuta en momentos de inactividad del navegador
  idle: (fn) => (window.requestIdleCallback ?? ((f) => setTimeout(f, 1)))(fn),
};

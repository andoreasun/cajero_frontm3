import { $, $$, Scheduler } from './utils.js';

// Mapa de vistas: id → { elemento DOM, título, subtítulo }
const VISTAS = {
  inicio:      { el: '#viewDashboard',   titulo: 'Inicio',       sub: 'Resumen de tus cuentas' },
  perfil:      { el: '#viewPerfil',      titulo: 'Mi Perfil',    sub: 'Datos personales y seguridad' },
  movimientos: { el: '#viewMovimientos', titulo: 'Movimientos',  sub: 'Historial completo de transacciones' },
  extractos:   { el: '#viewExtractos',   titulo: 'Extractos',    sub: 'Estado de cuenta detallado' },
};

// Callbacks que se ejecutan al entrar a cada vista
const _onEnter = {};

export function registrarOnEnter(vistaId, fn) {
  _onEnter[vistaId] = fn;
}

let _vistaActual = 'inicio';
export const getVistaActual = () => _vistaActual;

/**
 * navegarA(id) — muestra la vista indicada y actualiza el sidebar.
 *
 * Orden de prioridades (Event Loop):
 *  1. Síncrono: validar
 *  2. Microtarea: ocultar/mostrar vistas (DOM mutations no críticas)
 *  3. Animation Frame: actualizar sidebar y ejecutar callback de entrada
 */
export function navegarA(id) {
  if (!VISTAS[id]) return;
  _vistaActual = id;

  // Microtarea — cambios de visibilidad de vistas
  Scheduler.micro(() => {
    Object.values(VISTAS).forEach(v => document.querySelector(v.el)?.classList.add('hidden'));
    document.querySelector(VISTAS[id].el)?.classList.remove('hidden');
  });

  // Animation Frame — actualizar título y sidebar (sincronizado con repintado)
  Scheduler.frame(() => {
    const titleEl = $('#pageTitle');
    if (titleEl) {
      titleEl.childNodes[0].textContent = VISTAS[id].titulo;
      $('#pageSub').textContent = VISTAS[id].sub;
    }

    // Estado activo en sidebar
    $$('.side-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.action === id);
    });

    // Cerrar sidebar en móvil si estaba abierto
    $('#sidebar')?.classList.remove('open');

    // Callback de entrada de la vista
    _onEnter[id]?.();
  });
}

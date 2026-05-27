/**
 * app.js — punto de entrada principal
 *
 * Responsabilidades:
 *  1. Inicializar módulos (modal, auth, router)
 *  2. Inyectar dependencias entre módulos (setMovClickHandler)
 *  3. Registrar callbacks del router por cada página
 *  4. Registrar event listeners globales
 */

import { $, $$ } from './utils.js';
import { ui } from './estado.js';
import { initModal } from './modal.js';
import { navegarA, registrarOnEnter } from './router.js';
import { inicializarPanel, renderTabs, renderSaldo, renderMovimientos, renderStats, setMovClickHandler } from './render.js';
import { abrirRecibo, initMovimientosPage, initExtractosPage } from './documentos.js';
import { initLogin, cerrarSesion, initRegistro } from './auth.js';
import { initPerfilPage, accionCambiarPass } from './perfil.js';
import { accionConsultar, accionConsignar, accionRetirar, accionTransferir } from './transacciones.js';
import { accionServicios, accionRecargas } from './servicios.js';
import { initCertificadosPage } from './certificados.js';
import { initTiendaPage } from './tienda.js';

// ── 1. Inicializar módulos de infraestructura ─────────────────────────────
initModal();
initLogin();
initRegistro();

// ── 2. Inyectar callback de recibo en render (evita dependencia circular) ─
setMovClickHandler(abrirRecibo);

// ── 3. Registrar qué hacer al entrar a cada página ───────────────────────
registrarOnEnter('inicio', () => {
  renderTabs(); renderSaldo(); renderMovimientos(); renderStats();
});
registrarOnEnter('perfil',      initPerfilPage);
registrarOnEnter('movimientos', initMovimientosPage);
registrarOnEnter('extractos',    initExtractosPage);
registrarOnEnter('certificados', initCertificadosPage);
registrarOnEnter('tienda',       initTiendaPage);

// ── 4. Acciones de la barra superior ─────────────────────────────────────
$('#verTodos').addEventListener('click', () => navegarA('movimientos'));
$('#btnLogout').addEventListener('click', cerrarSesion);
$('#toggleEye').addEventListener('click', () => {
  ui.saldoVisible = !ui.saldoVisible;
  renderSaldo();
});
$('#btnMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

// ── 5. Delegación de clicks para acciones con data-action ────────────────
//
// Separación de responsabilidades:
//   • Acciones de NAVEGACIÓN  → llaman a navegarA() → muestran una página completa
//   • Acciones MODALES        → abren un modal flotante
//
const PAGINAS     = new Set(['inicio', 'perfil', 'movimientos', 'extractos', 'certificados', 'tienda']);
const ACCIONES_MODAL = {
  consultar:   accionConsultar,
  consignar:   accionConsignar,
  retirar:     accionRetirar,
  transferir:  accionTransferir,
  cambiarPass: accionCambiarPass,
  servicios:   accionServicios,
  recargas:    accionRecargas,
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const a = btn.dataset.action;
  if (PAGINAS.has(a))            { navegarA(a); return; }
  ACCIONES_MODAL[a]?.();
});

// ── 6. Dropdowns de la topbar ─────────────────────────────────────────────
function bindDropdown(id) {
  const dd  = document.getElementById(id);
  const btn = dd.querySelector('.top-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    $$('.dropdown.open').forEach(o => o !== dd && o.classList.remove('open'));
    dd.classList.toggle('open');
  });
  dd.querySelectorAll('.dropdown-item').forEach(b =>
    b.addEventListener('click', () => dd.classList.remove('open')));
}

bindDropdown('atajosDropdown');
bindDropdown('notifDropdown');
document.addEventListener('click', () => $$('.dropdown.open').forEach(d => d.classList.remove('open')));

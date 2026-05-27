import { $, $$, fmt, fmtFecha, iniciales, opNumero, Scheduler } from './utils.js';
import { cliente, ui } from './estado.js';
import { TarjetaCredito } from './models.js';

// Callback para abrir el recibo al hacer clic en un movimiento.
// Se inyecta desde app.js para evitar dependencia circular con documentos.js.
let _onMovClick = null;
export function setMovClickHandler(fn) { _onMovClick = fn; }

// ── Íconos por tipo de movimiento ──────────────────────────────────────────
export function movIcon(tipo) {
  const map = {
    consignacion:  ['consig',   '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'],
    retiro:        ['retiro',   '<line x1="5" y1="12" x2="19" y2="12"/>'],
    transferencia: ['transf',   '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'],
    servicio:      ['servicio', '<path d="M3 12h2l3-9 6 18 3-9h4"/>'],
    recarga:       ['recarga',  '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'],
    compra:        ['compra',   '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'],
  };
  return map[tipo] ?? map.retiro;
}

export function movTipoLabel(t) {
  return ({
    consignacion: 'Consignación', retiro: 'Retiro', transferencia: 'Transferencia',
    servicio: 'Pago de servicio', recarga: 'Recarga celular', compra: 'Compra',
  })[t] ?? t;
}

export function movRow(m) {
  const [cls, icon] = movIcon(m.tipo);
  const out = ['retiro', 'transferencia', 'servicio', 'recarga', 'compra'].includes(m.tipo);
  return `
    <div class="movimiento" data-mov="${m.id}">
      <div class="mov-icon ${cls}">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
      </div>
      <div class="mov-info">
        <div class="mov-tipo">${movTipoLabel(m.tipo)}${m.descripcion
          ? ` <span style="color:var(--tinta-3);font-weight:500;font-size:12px">· ${m.descripcion}</span>` : ''}</div>
        <div class="mov-fecha">${fmtFecha(m.fecha)} · ${opNumero(m.id)}</div>
      </div>
      <div class="mov-valor ${out ? 'out' : 'in'}">${out ? '−' : '+'}${fmt(m.valor)}</div>
    </div>`;
}

function bindMovClicks(container) {
  $$('.movimiento[data-mov]', container).forEach(el => {
    el.addEventListener('click', () => {
      const id = +el.dataset.mov;
      const mov = ui.cuentaActiva.movimientos.find(x => x.id === id);
      if (mov && _onMovClick) _onMovClick(mov);
    });
  });
}

// ── Render: tabs de cuenta en la tarjeta ──────────────────────────────────
export function renderTabs() {
  Scheduler.frame(() => {
    const tabs = $('#cuentaTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    cliente.cuentas.forEach(c => {
      const b = document.createElement('button');
      b.className = 'saldo-tab' + (c === ui.cuentaActiva ? ' active' : '');
      b.textContent = c.tipo;
      b.addEventListener('click', () => {
        ui.cuentaActiva = c;
        renderTabs(); renderSaldo(); renderMovimientos(); renderStats();
      });
      tabs.appendChild(b);
    });
  });
}

// ── Render: saldo en la tarjeta ───────────────────────────────────────────
export function renderSaldo() {
  const c = ui.cuentaActiva;
  const esTarjeta = c instanceof TarjetaCredito;
  const label = esTarjeta ? 'Cupo disponible · Tarjeta' : `Saldo disponible · ${c.tipo}`;
  const monto = esTarjeta ? c.cupoDisponible : c.saldo;
  const last4  = (c.numero.replace(/[^0-9]/g, '').slice(-4) || '0000').padStart(4, '0');

  Scheduler.frame(() => {
    $('#saldoLabel').textContent = label;
    $('#saldoMonto').textContent = ui.saldoVisible ? fmt(monto) : '••••••';
    $('#cardNumber').innerHTML   = ui.saldoVisible
      ? `<span>••••</span><span>••••</span><span>••••</span><span>${last4}</span>`
      : `<span>••••</span><span>••••</span><span>••••</span><span>••••</span>`;
    $('#cardTitular').textContent = cliente.nombre;
    $('#cardExpira').textContent  = ({ Ahorros: '12/28', Corriente: '06/29', Tarjeta: '09/27' })[c.tipo] ?? '12/28';
  });
}

// ── Render: lista de movimientos del dashboard ────────────────────────────
export function renderMovimientos(limite = 5) {
  const movs = ui.cuentaActiva.movimientos.slice(0, limite);
  Scheduler.frame(() => {
    const lista = $('#listaMovs');
    if (!lista) return;
    lista.innerHTML = movs.length
      ? movs.map(m => movRow(m)).join('')
      : '<div class="mov-empty">Sin movimientos.</div>';
    bindMovClicks(lista);
  });
}

// ── Render: estadísticas del mes ─────────────────────────────────────────
export function renderStats() {
  const movs     = ui.cuentaActiva.movimientos;
  const ingresos = movs.filter(m => m.tipo === 'consignacion').reduce((s, m) => s + m.valor, 0);
  const gastos   = movs.filter(m => ['retiro','transferencia','servicio','recarga','compra'].includes(m.tipo))
                       .reduce((s, m) => s + m.valor, 0);
  Scheduler.frame(() => {
    $('#statIngresos').textContent = fmt(ingresos);
    $('#statGastos').textContent   = fmt(gastos);
    $('#statCount').textContent    = movs.length;
  });
}

// ── Render: usuario en el sidebar ─────────────────────────────────────────
export function renderSideUser() {
  Scheduler.frame(() => {
    $('#userNombre').textContent = cliente.nombre;
    $('#userDoc').textContent    = `CC ${cliente.identificacion}`;
    const av = $('#avatarSide');
    if (av) av.textContent = iniciales(cliente.nombre);
  });
}

// ── Inicialización completa del panel ─────────────────────────────────────
// Muestra la jerarquía de tareas:
//  1. Síncrono:    nada (solo llamar a helpers)
//  2. Microtarea:  datos que otros renders pueden necesitar
//  3. Frame:       actualizaciones visuales (cada render usa Scheduler.frame internamente)
export function inicializarPanel() {
  renderSideUser();                   // Frame: datos del sidebar
  Scheduler.micro(() => {            // Microtarea: encolar renders del panel principal
    renderTabs();
    renderSaldo();
    renderMovimientos();
    renderStats();
  });
}

export { bindMovClicks };

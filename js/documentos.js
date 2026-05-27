import { $, $$, fmt, fmtFecha, fmtFechaLarga, opNumero, Scheduler } from './utils.js';
import { cliente, ui } from './state.js';
import { movRow, movTipoLabel } from './render.js';
import { abrirModal, cerrarModal } from './modal.js';
import { toast } from './toast.js';

// ── Construir HTML del recibo ──────────────────────────────────────────────
export function buildReciboHTML(m) {
  const c   = ui.cuentaActiva;
  const out = ['retiro', 'transferencia', 'servicio', 'recarga', 'compra'].includes(m.tipo);
  const tipo = movTipoLabel(m.tipo);
  const meta = m.meta ?? {};

  const filas = [
    ['Número de operación', opNumero(m.id)],
    ['Fecha y hora', fmtFechaLarga(m.fecha)],
    ['Tipo', tipo],
    ['Cuenta origen', `${c.tipo} · ${c.numero}`],
    ['Titular', cliente.nombre],
  ];
  if (m.descripcion)       filas.push(['Concepto',         m.descripcion]);
  if (meta.destino)        filas.push(['Destino',          `${meta.destinoTipo ?? ''} · ${meta.destino}`]);
  if (meta.destinoTitular) filas.push(['Beneficiario',     meta.destinoTitular]);
  if (meta.empresa)        filas.push(['Empresa',          meta.empresa]);
  if (meta.referencia)     filas.push(['Referencia',       meta.referencia]);
  if (meta.operador)       filas.push(['Operador',         meta.operador]);
  if (meta.celular)        filas.push(['Celular',          meta.celular]);
  if (meta.cuotas)         filas.push(['Cuotas',           `${meta.cuotas} (${(meta.tasa * 100).toFixed(1)}% mensual)`]);
  if (meta.cuotaMensual)   filas.push(['Cuota mensual',    fmt(meta.cuotaMensual)]);
  if (meta.interes)        filas.push(['Interés acreditado', fmt(meta.interes)]);
  if (meta.sobregiro)      filas.push(['Modalidad',        'Con sobregiro']);

  return `
    <div class="recibo">
      <div class="recibo-header">
        <div class="marca">Mi Plata</div>
        <div class="sub">Banca Digital · Comprobante</div>
      </div>
      <div style="text-align:center"><span class="recibo-status">✓ Aprobado</span></div>
      <div class="recibo-tipo">${tipo}</div>
      <div class="recibo-monto ${out ? 'out' : 'in'}">${out ? '−' : '+'}${fmt(m.valor)}</div>
      <div class="recibo-fecha">${fmtFechaLarga(m.fecha)}</div>
      <div class="recibo-divider"></div>
      ${filas.map(([k, v]) => `<div class="recibo-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
      <div class="recibo-foot">Mi Plata · Sucursal Digital · ${opNumero(m.id)}<br/>Conserve este comprobante</div>
    </div>`;
}

export function abrirRecibo(m) {
  abrirModal({
    titulo: 'Comprobante', sub: 'Detalle de la transacción',
    body: buildReciboHTML(m),
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cerrar</button>
      <button class="btn btn-ghost" id="btnReciboDesc">⬇ Descargar</button>
      <button class="btn btn-primary" id="btnReciboPrint">🖨 Imprimir / Guardar PDF</button>`,
  });
  $('#btnReciboPrint').addEventListener('click', () => imprimirRecibo(m));
  $('#btnReciboDesc').addEventListener('click', () => descargarRecibo(m));
}

export function imprimirRecibo(m) {
  const el = $('#reciboPrintable');
  el.innerHTML    = buildReciboHTML(m);
  el.style.display = 'block';
  Scheduler.defer(() => {
    window.print();
    Scheduler.defer(() => { el.style.display = 'none'; }, 500);
  }, 100);
}

export function descargarRecibo(m) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Recibo ${opNumero(m.id)} · Mi Plata</title>
    <style>
      body{font-family:sans-serif;background:#fff6f8;padding:30px;color:#2d1a24}
      .recibo{max-width:480px;margin:0 auto;background:#fff;border:2px dashed #ffbccc;border-radius:16px;padding:30px}
      .recibo-header{text-align:center;border-bottom:1px dashed #f2dde4;padding-bottom:14px;margin-bottom:14px}
      .recibo-header .marca{font-weight:800;font-size:22px;color:#b33b5e}
      .recibo-header .sub{font-size:11px;color:#8c7884;letter-spacing:.14em;text-transform:uppercase;margin-top:4px}
      .recibo-status{display:inline-block;background:#e6f7ef;color:#2bb07a;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700}
      .recibo-tipo{text-align:center;font-size:13px;font-weight:700;color:#b33b5e;text-transform:uppercase;letter-spacing:.12em;margin:14px 0}
      .recibo-monto{text-align:center;font-size:36px;font-weight:800;margin:8px 0;color:#d94a5a}
      .recibo-monto.in{color:#2bb07a}
      .recibo-fecha{text-align:center;font-size:12px;color:#8c7884;margin-bottom:14px}
      .recibo-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
      .recibo-row .k{color:#8c7884}.recibo-row .v{font-weight:700}
      .recibo-divider{border-top:1px dashed #f2dde4;margin:14px 0}
      .recibo-foot{text-align:center;margin-top:18px;padding-top:14px;border-top:1px dashed #f2dde4;font-size:10px;color:#8c7884;letter-spacing:.08em;text-transform:uppercase}
    </style></head><body>${buildReciboHTML(m)}</body></html>`;
  _descargar(html, `Recibo-${opNumero(m.id)}.html`);
  toast('Recibo descargado', 'Guardado en tu dispositivo', 'success');
}

// ── Página completa: Movimientos ───────────────────────────────────────────
let _movListenersAdded = false;

export function initMovimientosPage() {
  if (!_movListenersAdded) {
    _movListenersAdded = true;
    // Los botones de cuenta se crean dinámicamente; ver renderMovPage
  }
  renderMovPage();
}

function renderMovPage() {
  const c = ui.cuentaActiva;

  // Tabs de cuenta
  Scheduler.frame(() => {
    const tabsEl = $('#movPageTabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    cliente.cuentas.forEach(cuenta => {
      const btn = document.createElement('button');
      btn.className = 'extracto-tab' + (cuenta === ui.cuentaActiva ? ' active' : '');
      btn.textContent = `${cuenta.tipo} · ${cuenta.numero.slice(-4)}`;
      btn.addEventListener('click', () => {
        ui.cuentaActiva = cuenta;
        renderMovPage();
      });
      tabsEl.appendChild(btn);
    });

    // Etiqueta de cuenta activa
    const label = $('#movPageCuenta');
    if (label) label.textContent = `${c.tipo} · ${c.numero}`;

    // Lista de movimientos
    const lista = $('#movPageLista');
    if (!lista) return;
    lista.innerHTML = c.movimientos.length
      ? c.movimientos.map(m => movRow(m)).join('')
      : '<div class="mov-empty">Sin movimientos.</div>';

    $$('.movimiento[data-mov]', lista).forEach(el => {
      el.addEventListener('click', () => {
        const id  = +el.dataset.mov;
        const mov = ui.cuentaActiva.movimientos.find(x => x.id === id);
        if (mov) abrirRecibo(mov);
      });
    });
  });
}

// ── Página completa: Extractos ────────────────────────────────────────────
let _extListenersAdded = false;

export function initExtractosPage() {
  if (!_extListenersAdded) {
    _extListenersAdded = true;

    $$('#extractoTabsPage .extracto-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        ui.extractoFiltro = btn.dataset.f;
        $$('#extractoTabsPage .extracto-tab').forEach(b => b.classList.toggle('active', b === btn));
        renderExtractosLista();
      });
    });

    $('#btnDescExtractoPage').addEventListener('click', descargarExtractoCompleto);
  }

  // Sincronizar tab activo con el filtro actual
  $$('#extractoTabsPage .extracto-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.f === ui.extractoFiltro);
  });

  renderExtractosLista();
}

function renderExtractosLista() {
  const movs = ui.extractoFiltro === 'todos'
    ? ui.cuentaActiva.movimientos
    : ui.cuentaActiva.movimientos.filter(m => m.tipo === ui.extractoFiltro);

  Scheduler.frame(() => {
    const lista = $('#extractoListaPage');
    if (!lista) return;
    lista.innerHTML = movs.length
      ? movs.map(m => movRow(m)).join('')
      : '<div class="mov-empty">Sin movimientos en este filtro.</div>';

    $$('.movimiento[data-mov]', lista).forEach(el => {
      el.addEventListener('click', () => {
        const id  = +el.dataset.mov;
        const mov = ui.cuentaActiva.movimientos.find(x => x.id === id);
        if (mov) abrirRecibo(mov);
      });
    });
  });
}

export function descargarExtractoCompleto() {
  const c    = ui.cuentaActiva;
  const movs = ui.extractoFiltro === 'todos'
    ? c.movimientos
    : c.movimientos.filter(m => m.tipo === ui.extractoFiltro);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Extracto ${c.numero} · Mi Plata</title>
    <style>
      body{font-family:sans-serif;background:#fff6f8;padding:30px;color:#2d1a24;max-width:720px;margin:0 auto}
      .head{background:linear-gradient(135deg,#f47c9a,#b33b5e);color:#fff;padding:24px;border-radius:16px;margin-bottom:18px}
      .head h1{margin:0;font-size:22px}.head .sub{opacity:.85;font-size:13px;margin-top:4px}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#fff;padding:18px;border-radius:12px;margin-bottom:18px;border:1px solid #f2dde4}
      .meta div b{display:block;font-size:11px;color:#8c7884;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;font-weight:600}
      table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f2dde4}
      th,td{padding:10px 14px;text-align:left;font-size:13px;border-bottom:1px solid #f2dde4}
      th{background:#ffeaf0;color:#b33b5e;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
      tr:last-child td{border-bottom:0}.out{color:#d94a5a;font-weight:700}.in{color:#2bb07a;font-weight:700}
      .foot{margin-top:20px;text-align:center;font-size:11px;color:#8c7884}
    </style></head><body>
    <div class="head"><h1>Extracto · Mi Plata</h1><div class="sub">${c.tipo} · ${c.numero} · ${cliente.nombre}</div></div>
    <div class="meta">
      <div><b>Titular</b>${cliente.nombre}</div>
      <div><b>Identificación</b>CC ${cliente.identificacion}</div>
      <div><b>Cuenta</b>${c.numero}</div><div><b>Tipo</b>${c.tipo}</div>
      <div><b>Saldo actual</b>${fmt(c.saldo)}</div>
      <div><b>Generado</b>${fmtFechaLarga(new Date())}</div>
    </div>
    <table><thead><tr><th>Fecha</th><th>Op #</th><th>Tipo</th><th>Concepto</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>
      ${movs.map(m => {
        const out = ['retiro','transferencia','servicio','recarga','compra'].includes(m.tipo);
        return `<tr>
          <td>${fmtFecha(m.fecha)}</td><td>${opNumero(m.id)}</td>
          <td>${movTipoLabel(m.tipo)}</td><td>${m.descripcion || '—'}</td>
          <td style="text-align:right" class="${out ? 'out' : 'in'}">${out ? '−' : '+'}${fmt(m.valor)}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
    <div class="foot">Mi Plata · Banca Digital · Documento generado automáticamente</div>
    </body></html>`;

  _descargar(html, `Extracto-${c.numero}-${new Date().toISOString().slice(0, 10)}.html`);
  toast('Extracto descargado', 'Lo puedes abrir e imprimir como PDF', 'success');
}

// ── Helper privado de descarga ────────────────────────────────────────────
function _descargar(html, nombre) {
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

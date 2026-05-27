import { $, $$, fmt } from './utils.js';
import { cliente } from './estado.js';
import { TarjetaCredito, CuentaCorriente } from './models.js';
import { toast } from './toast.js';

export function initCertificadosPage() {
  _render();
}

function _render() {
  const cont = $('#certContenido');
  if (!cont) return;

  const tc  = cliente.cuentas.find(c => c instanceof TarjetaCredito);
  const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  let html = '';

  // ── Certificado por cada cuenta ────────────────────────────────────────
  cliente.cuentas.forEach((c, i) => {
    const esTarjeta = c instanceof TarjetaCredito;
    const tipo      = esTarjeta ? 'Tarjeta de Crédito' : `Cuenta de ${c.tipo}`;
    const valLabel  = esTarjeta ? 'Cupo disponible' : 'Saldo actual';
    const valor     = esTarjeta ? fmt(c.cupoDisponible) : fmt(c.saldo);

    html += `
      <div class="cert-card">
        <div class="cert-header">
          <div>
            <div class="cert-tipo">${tipo}</div>
            <div class="cert-num">${c.numero}</div>
          </div>
          <button class="btn btn-primary cert-dl" data-idx="${i}">⬇ Descargar</button>
        </div>
        <div class="cert-body">
          <div class="cert-row"><span>Titular</span><b>${cliente.nombre}</b></div>
          <div class="cert-row"><span>Cédula</span><b>CC ${cliente.identificacion}</b></div>
          <div class="cert-row"><span>${valLabel}</span><b>${valor}</b></div>
          <div class="cert-row"><span>Fecha de expedición</span><b>${hoy}</b></div>
        </div>
      </div>`;
  });

  // ── Certificado de deuda (solo si TC tiene deuda) ──────────────────────
  if (tc && tc.deuda > 0) {
    html += `
      <div class="cert-card cert-card--deuda">
        <div class="cert-header">
          <div>
            <div class="cert-tipo">Certificado de Deuda</div>
            <div class="cert-num">Tarjeta · ${tc.numero}</div>
          </div>
          <button class="btn btn-primary cert-dl" data-idx="deuda">⬇ Descargar</button>
        </div>
        <div class="cert-body">
          <div class="cert-row"><span>Titular</span><b>${cliente.nombre}</b></div>
          <div class="cert-row"><span>Deuda total</span><b style="color:var(--rojo)">${fmt(tc.deuda)}</b></div>
          <div class="cert-row"><span>Cupo total</span><b>${fmt(tc.cupo)}</b></div>
          <div class="cert-row"><span>Cupo disponible</span><b>${fmt(tc.cupoDisponible)}</b></div>
          <div class="cert-row"><span>Fecha de expedición</span><b>${hoy}</b></div>
        </div>
      </div>`;
  }

  // ── Certificados tributarios ───────────────────────────────────────────
  html += `
    <div class="cert-tributarios">
      <h4>Certificados tributarios</h4>
      <p class="desc" style="margin-bottom:12px">
        Año gravable 2025 · disponibles al cierre del período tributario
      </p>
      <div class="cert-trib-grid">
        <button class="cert-trib-btn">
          <div class="cert-trib-ico">📄</div>
          <div class="cert-trib-nombre">Declaración de Renta</div>
          <div class="cert-trib-anio">Año gravable 2025</div>
        </button>
        <button class="cert-trib-btn">
          <div class="cert-trib-ico">📄</div>
          <div class="cert-trib-nombre">Retención en la Fuente</div>
          <div class="cert-trib-anio">Año gravable 2025</div>
        </button>
        <button class="cert-trib-btn">
          <div class="cert-trib-ico">📄</div>
          <div class="cert-trib-nombre">Gravamen Mov. Financieros</div>
          <div class="cert-trib-anio">Año gravable 2025</div>
        </button>
      </div>
    </div>`;

  cont.innerHTML = html;

  // Bind descargas de cuentas
  $$('.cert-dl', cont).forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.idx === 'deuda') {
        _imprimirDeuda(tc);
      } else {
        _imprimirCuenta(cliente.cuentas[+btn.dataset.idx]);
      }
    });
  });

  // Bind tributarios — mensaje de no disponible
  $$('.cert-trib-btn', cont).forEach(btn => {
    btn.addEventListener('click', () =>
      toast('No disponible aún',
        'Este certificado estará disponible al cierre del año tributario 2025.', 'warn'));
  });
}

// ── Generadores de impresión ───────────────────────────────────────────────

const _estiloBase = `
  <style>
    body { font-family: sans-serif; }
    .cp  { max-width:600px; margin:40px auto; padding:32px; border:2px solid #333; }
    .cp h2 { text-align:center; margin:0 0 4px; font-size:20px; }
    .cp .sub { text-align:center; color:#666; font-size:12px; margin-bottom:28px; }
    .cp table { width:100%; border-collapse:collapse; }
    .cp td { padding:10px 12px; border-bottom:1px solid #eee; font-size:14px; }
    .cp td:first-child { color:#555; }
    .cp td:last-child  { font-weight:700; text-align:right; }
    .cp .foot { text-align:center; margin-top:28px; font-size:11px; color:#aaa; }
  </style>`;

function _imprimirCuenta(c) {
  if (!c) return;
  const esTarjeta = c instanceof TarjetaCredito;
  const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const titulo = esTarjeta ? 'TARJETA DE CRÉDITO' : `CUENTA DE ${c.tipo.toUpperCase()}`;

  document.getElementById('reciboPrintable').innerHTML = `${_estiloBase}
    <div class="cp">
      <h2>Mi Plata · Banca Digital</h2>
      <div class="sub">CERTIFICADO DE ${titulo}</div>
      <table>
        <tr><td>Titular</td><td>${cliente.nombre}</td></tr>
        <tr><td>Identificación</td><td>CC ${cliente.identificacion}</td></tr>
        <tr><td>Número de cuenta</td><td>${c.numero}</td></tr>
        <tr><td>${esTarjeta ? 'Cupo disponible' : 'Saldo actual'}</td>
            <td>${esTarjeta ? fmt(c.cupoDisponible) : fmt(c.saldo)}</td></tr>
        <tr><td>Fecha de expedición</td><td>${hoy}</td></tr>
      </table>
      <div class="foot">Documento generado electrónicamente · Mi Plata Banca Digital</div>
    </div>`;
  window.print();
}

function _imprimirDeuda(tc) {
  const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  document.getElementById('reciboPrintable').innerHTML = `${_estiloBase}
    <div class="cp">
      <h2>Mi Plata · Banca Digital</h2>
      <div class="sub">CERTIFICADO DE DEUDA — TARJETA DE CRÉDITO</div>
      <table>
        <tr><td>Titular</td><td>${cliente.nombre}</td></tr>
        <tr><td>Identificación</td><td>CC ${cliente.identificacion}</td></tr>
        <tr><td>Número de tarjeta</td><td>${tc.numero}</td></tr>
        <tr><td>Deuda total</td><td>${fmt(tc.deuda)}</td></tr>
        <tr><td>Cupo total</td><td>${fmt(tc.cupo)}</td></tr>
        <tr><td>Cupo disponible</td><td>${fmt(tc.cupoDisponible)}</td></tr>
        <tr><td>Fecha de expedición</td><td>${hoy}</td></tr>
      </table>
      <div class="foot">Documento generado electrónicamente · Mi Plata Banca Digital</div>
    </div>`;
  window.print();
}

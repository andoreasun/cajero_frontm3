import { $, $$, fmt, Scheduler } from './utils.js';
import { ui, tarjeta } from './estado.js';
import { Movimiento, TarjetaCredito, CuentaCorriente } from './models.js';
import { abrirModal, cerrarModal } from './modal.js';
import { toast } from './toast.js';
import { renderSaldo, renderMovimientos, renderStats, renderTabs } from './render.js';
import { abrirRecibo } from './documentos.js';

const SERVICIOS = [
  { id: 'epm',      nombre: 'EPM',        emoji: '💡' },
  { id: 'claro',    nombre: 'Claro Hogar', emoji: '📡' },
  { id: 'tigo',     nombre: 'Tigo',        emoji: '📶' },
  { id: 'agua',     nombre: 'Acueducto',   emoji: '💧' },
  { id: 'gas',      nombre: 'Gas Natural', emoji: '🔥' },
  { id: 'iss',      nombre: 'EPS Sura',    emoji: '⚕️' },
];

const OPERADORES = [
  { id: 'claro',    nombre: 'Claro',     emoji: '🔴' },
  { id: 'movistar', nombre: 'Movistar',  emoji: '🔵' },
  { id: 'tigo',     nombre: 'Tigo',      emoji: '🟡' },
  { id: 'wom',      nombre: 'WOM',       emoji: '🟣' },
];

const MONTOS_RECARGA = [5000, 10000, 20000, 50000];

export function accionServicios() {
  if (ui.cuentaActiva instanceof TarjetaCredito)
    return toast('No disponible', 'Selecciona Ahorros o Corriente', 'warn');

  abrirModal({
    titulo: 'Pagar servicios', sub: `Desde ${ui.cuentaActiva.tipo}`,
    body: `
      <div class="servicios-grid" id="serviciosGrid">
        ${SERVICIOS.map(s => `
          <button class="servicio-btn" data-srv="${s.id}">
            <div class="servicio-emoji">${s.emoji}</div>
            <div class="servicio-nombre">${s.nombre}</div>
          </button>`).join('')}
      </div>
      <div class="field"><label>Número de cuenta o referencia</label>
        <input type="text" id="srvRef" placeholder="Ej. 1234567890" /></div>
      <div class="field"><label>Monto</label>
        <input type="number" id="srvMonto" min="1" step="1000" placeholder="0" /></div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnPagarSrv">Pagar</button>`,
  });

  let srv = null;
  $$('.servicio-btn').forEach(b => b.addEventListener('click', () => {
    $$('.servicio-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    srv = SERVICIOS.find(s => s.id === b.dataset.srv);
  }));

  $('#btnPagarSrv').addEventListener('click', () => {
    try {
      if (!srv) throw new Error('Selecciona un servicio');
      const ref   = $('#srvRef').value.trim();
      const monto = parseFloat($('#srvMonto').value);
      if (!ref) throw new Error('Ingresa el número de referencia');
      if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
      const limite = (ui.cuentaActiva instanceof CuentaCorriente)
        ? ui.cuentaActiva.limiteRetiro : ui.cuentaActiva.saldo;
      if (monto > limite) throw new Error('Saldo insuficiente');
      ui.cuentaActiva.saldo -= monto;
      const m = new Movimiento('servicio', monto, `${srv.nombre} · Ref ${ref}`,
        { empresa: srv.nombre, referencia: ref });
      ui.cuentaActiva.registrarMovimiento(m);
      cerrarModal();
      renderSaldo(); renderMovimientos(); renderStats();
      toast('Pago exitoso', `${srv.nombre} · ${fmt(monto)}`, 'success');
      Scheduler.defer(() => abrirRecibo(m), 400);
    } catch (err) { toast('No se pudo pagar', err.message, 'error'); }
  });
}

export function accionRecargas() {
  if (ui.cuentaActiva instanceof TarjetaCredito)
    return toast('No disponible', 'Selecciona Ahorros o Corriente', 'warn');

  abrirModal({
    titulo: 'Recargar celular', sub: `Desde ${ui.cuentaActiva.tipo}`,
    body: `
      <div class="servicios-grid" id="opGrid">
        ${OPERADORES.map(o => `
          <button class="servicio-btn" data-op="${o.id}">
            <div class="servicio-emoji">${o.emoji}</div>
            <div class="servicio-nombre">${o.nombre}</div>
          </button>`).join('')}
      </div>
      <div class="field"><label>Número celular</label>
        <input type="tel" id="recCel" placeholder="3001234567" maxlength="10" /></div>
      <div class="field"><label>Monto</label>
        <div class="cuotas-grid" id="montosGrid" style="grid-template-columns:repeat(4,1fr)">
          ${MONTOS_RECARGA.map(m => `<button class="cuota-btn" data-monto="${m}">${fmt(m)}</button>`).join('')}
        </div>
      </div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnRecargar">Recargar</button>`,
  });

  let op = null, monto = null;
  $$('.servicio-btn').forEach(b => b.addEventListener('click', () => {
    $$('.servicio-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    op = OPERADORES.find(o => o.id === b.dataset.op);
  }));
  $$('.cuota-btn').forEach(b => b.addEventListener('click', () => {
    $$('.cuota-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    monto = parseFloat(b.dataset.monto);
  }));

  $('#btnRecargar').addEventListener('click', () => {
    try {
      if (!op)    throw new Error('Selecciona un operador');
      if (!monto) throw new Error('Selecciona un monto');
      const cel = $('#recCel').value.trim();
      if (!/^\d{10}$/.test(cel)) throw new Error('Celular inválido (10 dígitos)');
      const limite = (ui.cuentaActiva instanceof CuentaCorriente)
        ? ui.cuentaActiva.limiteRetiro : ui.cuentaActiva.saldo;
      if (monto > limite) throw new Error('Saldo insuficiente');
      ui.cuentaActiva.saldo -= monto;
      const m = new Movimiento('recarga', monto, `${op.nombre} · ${cel}`,
        { operador: op.nombre, celular: cel });
      ui.cuentaActiva.registrarMovimiento(m);
      cerrarModal();
      renderSaldo(); renderMovimientos(); renderStats();
      toast('Recarga exitosa', `${op.nombre} ${cel} · ${fmt(monto)}`, 'success');
      Scheduler.defer(() => abrirRecibo(m), 400);
    } catch (err) { toast('No se pudo recargar', err.message, 'error'); }
  });
}

export function accionComprarTC() {
  if (!(ui.cuentaActiva instanceof TarjetaCredito)) {
    ui.cuentaActiva = tarjeta;
    renderTabs(); renderSaldo(); renderMovimientos(); renderStats();
  }
  const tc = tarjeta;
  abrirModal({
    titulo: 'Comprar a cuotas', sub: `Tarjeta · Cupo disponible ${fmt(tc.cupoDisponible)}`,
    body: `
      <div class="field"><label>Descripción de la compra</label>
        <input type="text" id="cpDesc" placeholder="Ej. Almacenes Éxito" /></div>
      <div class="field"><label>Monto</label>
        <input type="number" id="cpMonto" min="1" step="1000" placeholder="0" /></div>
      <div class="field"><label>Número de cuotas</label>
        <div class="cuotas-grid" id="cuotasGrid">
          ${[1, 2, 3, 6, 12, 24].map(n => `<button class="cuota-btn" data-c="${n}">${n}</button>`).join('')}
        </div>
        <div class="field-hint">≤2 cuotas: sin interés · 3-6: 1.9% mensual · ≥7: 2.3% mensual</div>
      </div>
      <div id="cpResumen" class="info-box" style="display:none"></div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnConfComprar">Confirmar compra</button>`,
  });

  let cuotas = null;

  function actualizarResumen() {
    const monto = parseFloat($('#cpMonto').value);
    if (!Number.isFinite(monto) || monto <= 0 || !cuotas) {
      $('#cpResumen').style.display = 'none'; return;
    }
    const cm    = TarjetaCredito.cuotaMensual(monto, cuotas);
    const tasa  = TarjetaCredito.tasa(cuotas);
    const total = cm * cuotas;
    $('#cpResumen').style.display = 'block';
    $('#cpResumen').innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Cuota mensual:</span><b>${fmt(cm)}</b></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Tasa de interés:</span><b>${(tasa * 100).toFixed(1)}% mensual</b></div>
      <div style="display:flex;justify-content:space-between">
        <span>Total a pagar:</span><b>${fmt(total)}</b></div>`;
  }

  $$('.cuota-btn').forEach(b => b.addEventListener('click', () => {
    $$('.cuota-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    cuotas = +b.dataset.c;
    actualizarResumen();
  }));
  $('#cpMonto').addEventListener('input', actualizarResumen);

  $('#btnConfComprar').addEventListener('click', () => {
    try {
      const monto = parseFloat($('#cpMonto').value);
      const desc  = $('#cpDesc').value.trim() || 'Compra';
      if (!cuotas) throw new Error('Selecciona el número de cuotas');
      const r = tc.comprar(monto, cuotas, desc);
      cerrarModal();
      ui.cuentaActiva = tc;
      renderTabs(); renderSaldo(); renderMovimientos(); renderStats();
      toast('Compra realizada', `${fmt(monto)} en ${cuotas} cuotas de ${fmt(r.cuotaMensual)}`, 'success');
      Scheduler.defer(() => abrirRecibo(r.mov), 400);
    } catch (err) { toast('No se pudo procesar', err.message, 'error'); }
  });
}

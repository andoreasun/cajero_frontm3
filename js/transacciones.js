import { $, $$, fmt, Scheduler } from './utils.js';
import { cliente, clientes, ui } from './state.js';
import { Movimiento, CuentaAhorros, CuentaCorriente, TarjetaCredito } from './models.js';
import { abrirModal, cerrarModal } from './modal.js';
import { toast } from './toast.js';
import { renderSaldo, renderMovimientos, renderStats, renderTabs } from './render.js';
import { abrirRecibo } from './documentos.js';

export function accionConsultar() {
  const c = ui.cuentaActiva;
  let info = '';
  if (c instanceof CuentaAhorros)
    info = `Tu saldo en <b>Cuenta de Ahorros</b> es <b>${fmt(c.saldo)}</b>. Genera <b>1.5%</b> de interés mensual al retirar.`;
  else if (c instanceof CuentaCorriente)
    info = `Tu saldo en <b>Cuenta Corriente</b> es <b>${fmt(c.saldo)}</b>. Tienes 20% de sobregiro: límite <b>${fmt(c.limiteRetiro)}</b>.`;
  else
    info = `Cupo total <b>${fmt(c.cupo)}</b>. Deuda actual <b>${fmt(c.deuda)}</b>. Disponible <b>${fmt(c.cupoDisponible)}</b>.`;

  const SALIDA = new Set(['retiro', 'transferencia', 'servicio', 'recarga', 'compra']);
  const ultimos = [...c.movimientos].reverse().slice(0, 3);
  const movsHtml = ultimos.length ? `
    <div style="margin-top:14px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--tinta-3);margin-bottom:8px">Últimos movimientos</div>
      ${ultimos.map(m => {
        const salida = SALIDA.has(m.tipo);
        const color  = salida ? 'var(--rojo)' : 'var(--verde)';
        const signo  = salida ? '−' : '+';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--linea)">
          <span style="font-size:13px;color:var(--tinta-2);flex:1;margin-right:12px">${m.descripcion}</span>
          <span style="font-size:13px;font-weight:700;color:${color};white-space:nowrap">${signo} ${fmt(m.monto)}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  abrirModal({
    titulo: 'Consultar Saldo', sub: c.numero,
    body: `<div class="info-box">${info}</div>${movsHtml}`,
    footer: `<button class="btn btn-primary" onclick="cerrarModal()">Entendido</button>`,
  });
}

export function accionConsignar() {
  if (ui.cuentaActiva instanceof TarjetaCredito) return abrirModal({
    titulo: 'No disponible',
    body:   `<div class="info-box warn">⚠ No puedes consignar a una tarjeta de crédito. Selecciona Ahorros o Corriente.</div>`,
    footer: `<button class="btn btn-ghost" onclick="cerrarModal()">Cerrar</button>`,
  });

  abrirModal({
    titulo: 'Consignar Dinero',
    sub: `${ui.cuentaActiva.tipo} · ${ui.cuentaActiva.numero}`,
    body: `
      <div class="field">
        <label>Tipo de consignación</label>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="btnMiCuenta"   style="flex:1;justify-content:center">A mi cuenta</button>
          <button class="btn btn-ghost"   id="btnOtraPersona" style="flex:1;justify-content:center">A otra persona</button>
        </div>
      </div>
      <div id="campoCedula" class="field" style="display:none">
        <label>Cédula del destinatario</label>
        <input type="text" id="inpCedula" placeholder="Ej. 7654321" maxlength="12" />
        <div class="field-hint" id="hintCedula"></div>
      </div>
      <div class="field">
        <label>Monto a consignar</label>
        <input type="number" id="inpMonto" placeholder="0" min="1" step="1000" />
        <div class="field-hint">Debe ser un valor positivo.</div>
      </div>
      <div class="field">
        <label>Concepto (opcional)</label>
        <input type="text" id="inpConcepto" placeholder="Ej. Ahorro mensual" />
      </div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnConfConsig">Consignar</button>`,
  });

  let esTercero = false;
  let clienteDest = null;

  $('#btnMiCuenta').addEventListener('click', () => {
    esTercero = false; clienteDest = null;
    $('#btnMiCuenta').className    = 'btn btn-primary';
    $('#btnOtraPersona').className = 'btn btn-ghost';
    $('#campoCedula').style.display = 'none';
  });
  $('#btnOtraPersona').addEventListener('click', () => {
    esTercero = true;
    $('#btnMiCuenta').className    = 'btn btn-ghost';
    $('#btnOtraPersona').className = 'btn btn-primary';
    $('#campoCedula').style.display = '';
  });

  $('#inpCedula').addEventListener('input', () => {
    const raw  = $('#inpCedula').value.trim().replace(/[.\s]/g, '');
    const found = clientes.find(c => c !== cliente && c.identificacion.replace(/[.\s]/g, '') === raw);
    const hint  = $('#hintCedula');
    if (found) {
      clienteDest = found;
      hint.textContent = `✓ ${found.nombre}`;
      hint.style.color = 'var(--rosa-600)';
    } else {
      clienteDest = null;
      hint.textContent = raw.length > 4 ? 'Cédula no encontrada en el sistema' : '';
      hint.style.color = '#c53030';
    }
  });

  $('#btnConfConsig').addEventListener('click', () => {
    const monto    = parseFloat($('#inpMonto').value);
    const concepto = $('#inpConcepto').value.trim();
    try {
      if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
      if (esTercero) {
        if (!clienteDest) throw new Error('Ingresa una cédula registrada en el sistema');
        const cuentaDest = clienteDest.cuentas.find(c => !(c instanceof TarjetaCredito));
        if (!cuentaDest) throw new Error('El destinatario no tiene cuenta disponible');
        cuentaDest.saldo += monto;
        const m = new Movimiento('consignacion', monto,
          concepto || `Consignación de ${cliente.nombre}`,
          { origen: `Cédula ${cliente.identificacion}`, titular: cliente.nombre });
        cuentaDest.registrarMovimiento(m);
        cerrarModal();
        toast('Consignación exitosa', `${fmt(monto)} enviado a ${clienteDest.nombre}`, 'success');
        Scheduler.defer(() => abrirRecibo(m), 400);
      } else {
        const m = ui.cuentaActiva.consignar(monto, concepto || 'Consignación en efectivo');
        cerrarModal();
        renderSaldo(); renderMovimientos(); renderStats();
        toast('Consignación exitosa', `${fmt(monto)} · Saldo: ${fmt(ui.cuentaActiva.saldo)}`, 'success');
        Scheduler.defer(() => abrirRecibo(m), 400);
      }
    } catch (err) { toast('No se pudo consignar', err.message, 'error'); }
  });
}

export function accionRetirar() {
  if (ui.cuentaActiva instanceof TarjetaCredito) {
    const tc = ui.cuentaActiva;
    abrirModal({
      titulo: 'Avance de Cajero',
      sub: `Tarjeta · Cupo disponible ${fmt(tc.cupoDisponible)}`,
      body: `
        <div class="info-box warn" style="margin-bottom:12px">
          ⚠ El monto se carga a tu deuda con interés del 2.3% mensual desde hoy.
        </div>
        <div class="field">
          <label>Monto a retirar</label>
          <input type="number" id="inpAvanceCaj" min="1" step="10000" placeholder="0" />
          <div class="field-hint">Máximo disponible: <b>${fmt(tc.cupoDisponible)}</b></div>
        </div>`,
      footer: `
        <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
        <button class="btn btn-primary" id="btnConfAvanceCaj">Retirar</button>`,
    });
    $('#btnConfAvanceCaj').addEventListener('click', () => {
      const monto = parseFloat($('#inpAvanceCaj').value);
      try {
        if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
        if (monto > tc.cupoDisponible) throw new Error(`Excede el cupo disponible (${fmt(tc.cupoDisponible)})`);
        tc.deuda += monto;
        const m = new Movimiento('avance', monto, 'Avance de cajero', { tasa: 0.023 });
        tc.registrarMovimiento(m);
        cerrarModal();
        renderSaldo(); renderMovimientos(); renderStats();
        toast('Avance exitoso', `${fmt(monto)} · Cupo restante: ${fmt(tc.cupoDisponible)}`, 'warn');
        Scheduler.defer(() => abrirRecibo(m), 400);
      } catch (err) { toast('No se pudo procesar', err.message, 'error'); }
    });
    return;
  }

  const c    = ui.cuentaActiva;
  const hint = c instanceof CuentaCorriente
    ? `Límite c/sobregiro: <b>${fmt(c.limiteRetiro)}</b>`
    : `Saldo: <b>${fmt(c.saldo)}</b>. Se aplicará 1.5% de interés.`;

  abrirModal({
    titulo: 'Retirar Dinero', sub: `${c.tipo} · ${c.numero}`,
    body: `
      <div class="field">
        <label>Monto a retirar</label>
        <input type="number" id="inpRetiro" min="1" step="1000" placeholder="0" />
        <div class="field-hint">${hint}</div>
      </div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnConfRetiro">Retirar</button>`,
  });

  $('#btnConfRetiro').addEventListener('click', () => {
    const monto = parseFloat($('#inpRetiro').value);
    try {
      const r = c.retirar(monto);
      cerrarModal();
      renderSaldo(); renderMovimientos(); renderStats();
      toast('Retiro exitoso', `${fmt(monto)} · Saldo: ${fmt(r.nuevoSaldo)}`, r.sobregiro ? 'warn' : 'success');
      Scheduler.defer(() => abrirRecibo(r.mov), 400);
    } catch (err) { toast('No se pudo retirar', err.message, 'error'); }
  });
}

export function accionTransferir() {
  if (ui.cuentaActiva instanceof TarjetaCredito) {
    const tc = ui.cuentaActiva;
    const propias = cliente.cuentas.filter(c => !(c instanceof TarjetaCredito));

    abrirModal({
      titulo: 'Avance', sub: `Tarjeta · Cupo disponible ${fmt(tc.cupoDisponible)}`,
      body: `
        <div class="info-box warn" style="margin-bottom:12px">
          ⚠ El monto se carga a tu deuda con interés del 2.3% mensual desde hoy.
        </div>
        <div class="field">
          <label>Destino</label>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" id="btnAvMisCtas" style="flex:1;justify-content:center">Mis cuentas</button>
            <button class="btn btn-ghost"   id="btnAvCedula"  style="flex:1;justify-content:center">Por cédula</button>
          </div>
        </div>
        <div id="avCampoMisCtas" class="field">
          <label>Cuenta destino</label>
          <select id="avSelDestino">
            ${propias.map(c => `<option value="${c.numero}">${c.tipo} · ${c.numero}</option>`).join('')}
          </select>
        </div>
        <div id="avCampoCedula" class="field" style="display:none">
          <label>Cédula del destinatario</label>
          <input type="text" id="avInpCedula" placeholder="Ej. 7654321" maxlength="12" />
          <div class="field-hint" id="avHintCedula"></div>
        </div>
        <div class="field"><label>Monto</label>
          <input type="number" id="avInpMonto" min="1" step="10000" placeholder="0" />
          <div class="field-hint">Máximo: <b>${fmt(tc.cupoDisponible)}</b></div>
        </div>`,
      footer: `
        <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
        <button class="btn btn-primary" id="btnConfAvance">Transferir avance</button>`,
    });

    let esPorCedula = false;
    let clienteDest = null;

    $('#btnAvMisCtas').addEventListener('click', () => {
      esPorCedula = false; clienteDest = null;
      $('#btnAvMisCtas').className = 'btn btn-primary';
      $('#btnAvCedula').className  = 'btn btn-ghost';
      $('#avCampoMisCtas').style.display = '';
      $('#avCampoCedula').style.display  = 'none';
    });
    $('#btnAvCedula').addEventListener('click', () => {
      esPorCedula = true;
      $('#btnAvMisCtas').className = 'btn btn-ghost';
      $('#btnAvCedula').className  = 'btn btn-primary';
      $('#avCampoMisCtas').style.display = 'none';
      $('#avCampoCedula').style.display  = '';
    });

    $('#avInpCedula').addEventListener('input', () => {
      const raw   = $('#avInpCedula').value.trim().replace(/[.\s]/g, '');
      const found = clientes.find(c => c !== cliente && c.identificacion.replace(/[.\s]/g, '') === raw);
      const hint  = $('#avHintCedula');
      if (found) {
        clienteDest = found;
        hint.textContent = `✓ ${found.nombre}`;
        hint.style.color = 'var(--rosa-600)';
      } else {
        clienteDest = null;
        hint.textContent = raw.length > 4 ? 'Cédula no encontrada en el sistema' : '';
        hint.style.color = '#c53030';
      }
    });

    $('#btnConfAvance').addEventListener('click', () => {
      try {
        const monto = parseFloat($('#avInpMonto').value);
        if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
        if (monto > tc.cupoDisponible) throw new Error(`Excede el cupo disponible (${fmt(tc.cupoDisponible)})`);

        let destino, titular;
        if (esPorCedula) {
          if (!clienteDest) throw new Error('Ingresa una cédula registrada en el sistema');
          destino = clienteDest.cuentas.find(c => !(c instanceof TarjetaCredito));
          if (!destino) throw new Error('El destinatario no tiene cuenta disponible');
          titular = clienteDest.nombre;
        } else {
          const num = $('#avSelDestino').value;
          destino = propias.find(c => c.numero === num);
          if (!destino) throw new Error('Cuenta destino no encontrada');
          titular = destino.titular;
        }

        tc.deuda += monto;
        destino.saldo += monto;
        const m = new Movimiento('avance', monto, `Avance a ${titular}`,
          { destino: destino.numero, destinoTitular: titular, tasa: 0.023 });
        tc.registrarMovimiento(m);
        destino.registrarMovimiento(new Movimiento('consignacion', monto,
          `Avance de ${cliente.nombre}`, { origen: tc.numero }));

        cerrarModal();
        renderSaldo(); renderMovimientos(); renderStats();
        toast('Avance realizado', `${fmt(monto)} a ${titular}`, 'warn');
        Scheduler.defer(() => abrirRecibo(m), 400);
      } catch (err) { toast('No se pudo procesar', err.message, 'error'); }
    });
    return;
  }

  const propias = cliente.cuentas.filter(c => c !== ui.cuentaActiva && !(c instanceof TarjetaCredito));

  abrirModal({
    titulo: 'Transferir', sub: `Desde ${ui.cuentaActiva.tipo} · ${ui.cuentaActiva.numero}`,
    body: `
      <div class="field">
        <label>Destino</label>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="btnMisCuentas" style="flex:1;justify-content:center">Mis cuentas</button>
          <button class="btn btn-ghost"   id="btnPorCedula"  style="flex:1;justify-content:center">Por cédula</button>
        </div>
      </div>
      <div id="campoMisCuentas" class="field">
        <label>Cuenta destino</label>
        <select id="selDestino">
          ${propias.map(c => `<option value="${c.numero}">${c.tipo} · ${c.numero}</option>`).join('')}
        </select>
      </div>
      <div id="campoCedulaTrans" class="field" style="display:none">
        <label>Cédula del destinatario</label>
        <input type="text" id="inpCedulaTrans" placeholder="Ej. 7654321" maxlength="12" />
        <div class="field-hint" id="hintCedulaTrans"></div>
      </div>
      <div class="field"><label>Monto</label>
        <input type="number" id="inpTrans" min="1" step="1000" placeholder="0" /></div>
      <div class="field"><label>Concepto (opcional)</label>
        <input type="text" id="inpTransConcepto" placeholder="Ej. Pago amigo" /></div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnConfTrans">Transferir</button>`,
  });

  let esPorCedula = false;
  let clienteDest = null;

  $('#btnMisCuentas').addEventListener('click', () => {
    esPorCedula = false; clienteDest = null;
    $('#btnMisCuentas').className  = 'btn btn-primary';
    $('#btnPorCedula').className   = 'btn btn-ghost';
    $('#campoMisCuentas').style.display  = '';
    $('#campoCedulaTrans').style.display = 'none';
  });
  $('#btnPorCedula').addEventListener('click', () => {
    esPorCedula = true;
    $('#btnMisCuentas').className  = 'btn btn-ghost';
    $('#btnPorCedula').className   = 'btn btn-primary';
    $('#campoMisCuentas').style.display  = 'none';
    $('#campoCedulaTrans').style.display = '';
  });

  $('#inpCedulaTrans').addEventListener('input', () => {
    const raw   = $('#inpCedulaTrans').value.trim().replace(/[.\s]/g, '');
    const found = clientes.find(c => c !== cliente && c.identificacion.replace(/[.\s]/g, '') === raw);
    const hint  = $('#hintCedulaTrans');
    if (found) {
      clienteDest = found;
      hint.textContent = `✓ ${found.nombre}`;
      hint.style.color = 'var(--rosa-600)';
    } else {
      clienteDest = null;
      hint.textContent = raw.length > 4 ? 'Cédula no encontrada en el sistema' : '';
      hint.style.color = '#c53030';
    }
  });

  $('#btnConfTrans').addEventListener('click', () => {
    try {
      const monto    = parseFloat($('#inpTrans').value);
      const concepto = $('#inpTransConcepto').value.trim() || 'Transferencia';
      if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');

      const limite = (ui.cuentaActiva instanceof CuentaCorriente)
        ? ui.cuentaActiva.limiteRetiro : ui.cuentaActiva.saldo;
      if (monto > limite) throw new Error('Monto excede saldo disponible');

      let destino, titular;
      if (esPorCedula) {
        if (!clienteDest) throw new Error('Ingresa una cédula registrada en el sistema');
        destino = clienteDest.cuentas.find(c => !(c instanceof TarjetaCredito));
        if (!destino) throw new Error('El destinatario no tiene cuenta disponible');
        titular = clienteDest.nombre;
      } else {
        const num = $('#selDestino').value;
        destino = propias.find(c => c.numero === num);
        if (!destino) throw new Error('Cuenta destino no encontrada');
        titular = destino.titular;
      }

      ui.cuentaActiva.saldo -= monto;
      destino.saldo += monto;
      const m = new Movimiento('transferencia', monto, concepto, {
        destino: destino.numero, destinoTitular: titular, destinoTipo: destino.tipo,
      });
      ui.cuentaActiva.registrarMovimiento(m);
      destino.registrarMovimiento(new Movimiento('consignacion', monto,
        `Recibida de ${cliente.nombre}`, { origen: ui.cuentaActiva.numero }));

      cerrarModal();
      renderSaldo(); renderMovimientos(); renderStats();
      toast('Transferencia exitosa', `${fmt(monto)} a ${titular}`, 'success');
      Scheduler.defer(() => abrirRecibo(m), 400);
    } catch (err) { toast('No se pudo transferir', err.message, 'error'); }
  });
}

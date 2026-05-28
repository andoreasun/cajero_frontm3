'use strict';

import { Cliente, CuentaAhorros, CuentaCorriente, TarjetaCredito, Movimiento } from './models.js';

const CLAVE = 'miplata_v1';

// ── Serialización ─────────────────────────────────────────────────────────────

function _serMovimiento(m) {
  return {
    id: m.id, tipo: m.tipo, valor: m.valor,
    descripcion: m.descripcion, meta: m.meta,
    fecha: m.fecha.toISOString(),
  };
}

function _serCuenta(c) {
  const base = {
    tipo: c.tipo, numero: c.numero, titular: c.titular,
    saldo: c.saldo,
    movimientos: c.movimientos.map(_serMovimiento),
  };
  if (c instanceof TarjetaCredito) { base.cupo = c.cupo; base.deuda = c.deuda; }
  return base;
}

function _serCliente(c) {
  return {
    identificacion: c.identificacion, nombre: c.nombre,
    celular: c.celular, correo: c.correo, direccion: c.direccion,
    usuario: c.usuario, password: c.password,
    intentosFallidos: c.intentosFallidos, bloqueado: c.bloqueado,
    foto: c.foto,
    cuentas: c.cuentas.map(_serCuenta),
  };
}

// ── Deserialización ───────────────────────────────────────────────────────────

function _resMovimiento(m) {
  const mov = new Movimiento(m.tipo, m.valor, m.descripcion, m.meta ?? {});
  mov.id = m.id;
  mov.fecha = new Date(m.fecha);
  return mov;
}

function _resCuenta(c) {
  let cuenta;
  if (c.tipo === 'Ahorros')
    cuenta = new CuentaAhorros(c.numero, c.titular, c.saldo);
  else if (c.tipo === 'Corriente')
    cuenta = new CuentaCorriente(c.numero, c.titular, c.saldo);
  else {
    cuenta = new TarjetaCredito(c.numero, c.titular, c.cupo);
    cuenta.deuda = c.deuda ?? 0;
  }
  cuenta.movimientos = (c.movimientos ?? []).map(_resMovimiento);
  return cuenta;
}

function _resCliente(c) {
  const cl = new Cliente({
    identificacion: c.identificacion, nombre: c.nombre,
    celular: c.celular, usuario: c.usuario, password: c.password,
  });
  cl.correo    = c.correo    ?? '';
  cl.direccion = c.direccion ?? '';
  cl.intentosFallidos = c.intentosFallidos ?? 0;
  cl.bloqueado = c.bloqueado ?? false;
  cl.foto      = c.foto      ?? null;
  cl.cuentas   = (c.cuentas ?? []).map(_resCuenta);
  return cl;
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Guarda todos los clientes y el usuario activo en localStorage. */
export function guardar(clientes, usuarioActivo = null) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      clientes: clientes.map(_serCliente),
      usuarioActivo,
    }));
    console.log('[MiPlata] Estado guardado en localStorage. Usuario activo:', usuarioActivo);
  } catch (e) {
    console.warn('[MiPlata] No se pudo guardar en localStorage:', e);
  }
}

/** Carga y reconstruye el estado desde localStorage. Devuelve null si no hay datos. */
export function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const { clientes, usuarioActivo } = JSON.parse(raw);
    const resultado = { clientes: clientes.map(_resCliente), usuarioActivo };
    console.log('[MiPlata] Estado restaurado desde localStorage. Clientes:', resultado.clientes.map(c => c.usuario));
    return resultado;
  } catch (e) {
    console.warn('[MiPlata] No se pudo cargar desde localStorage:', e);
    return null;
  }
}

/** Borra solo la sesión activa (el usuario sigue guardado). */
export function cerrarSesionLS(clientes) {
  guardar(clientes, null);
}

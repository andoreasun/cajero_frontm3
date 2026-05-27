'use strict';

export class Movimiento {
  static lastId = 1000;
  constructor(tipo, valor, descripcion = '', meta = {}) {
    this.id = ++Movimiento.lastId;
    this.fecha = new Date();
    this.tipo = tipo; // consignacion | retiro | transferencia | servicio | recarga | compra
    this.valor = valor;
    this.descripcion = descripcion;
    this.meta = meta;
  }
}

export class Cuenta {
  #saldo;
  constructor(numero, titular, saldoInicial = 0) {
    this.numero = numero;
    this.titular = titular;
    this.#saldo = saldoInicial;
    this.movimientos = [];
  }
  get saldo() { return this.#saldo; }
  set saldo(v) { this.#saldo = v; }
  consignar(monto, desc = 'Consignación en efectivo', meta = {}) {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('El monto debe ser positivo');
    this.#saldo += monto;
    const m = new Movimiento('consignacion', monto, desc, meta);
    this.movimientos.unshift(m);
    return m;
  }
  retirar() { throw new Error('Implementar en subclase'); }
  registrarMovimiento(m) { this.movimientos.unshift(m); return m; }
}

export class CuentaAhorros extends Cuenta {
  static TASA = 0.015;
  constructor(n, t, s = 0) { super(n, t, s); this.tipo = 'Ahorros'; }
  retirar(monto) {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
    if (monto > this.saldo) throw new Error('Saldo insuficiente');
    const interes = this.saldo * CuentaAhorros.TASA;
    this.saldo = this.saldo - monto + interes;
    const m = new Movimiento('retiro', monto,
      `Retiro (interés acreditado: $${Math.round(interes).toLocaleString('es-CO')})`, { interes });
    this.registrarMovimiento(m);
    return { mov: m, nuevoSaldo: this.saldo, interes };
  }
}

export class CuentaCorriente extends Cuenta {
  static SOBREGIRO = 0.20;
  constructor(n, t, s = 0) { super(n, t, s); this.tipo = 'Corriente'; }
  get limiteRetiro() { return this.saldo * (1 + CuentaCorriente.SOBREGIRO); }
  retirar(monto) {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
    if (monto > this.limiteRetiro) throw new Error('Excede el límite (incluye 20% de sobregiro)');
    this.saldo -= monto;
    const enSobregiro = this.saldo < 0;
    const m = new Movimiento('retiro', monto,
      enSobregiro ? 'Retiro con sobregiro' : 'Retiro', { sobregiro: enSobregiro });
    this.registrarMovimiento(m);
    return { mov: m, nuevoSaldo: this.saldo, sobregiro: enSobregiro };
  }
}

export class TarjetaCredito extends Cuenta {
  constructor(n, t, cupo = 0) {
    super(n, t, 0);
    this.tipo = 'Tarjeta';
    this.cupo = cupo;
    this.deuda = 0;
  }
  static tasa(c) { if (c <= 2) return 0; if (c <= 6) return 0.019; return 0.023; }
  static cuotaMensual(cap, c) {
    const t = TarjetaCredito.tasa(c);
    if (t === 0) return cap / c;
    return (cap * t) / (1 - Math.pow(1 + t, -c));
  }
  comprar(monto, cuotas, desc = 'Compra') {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
    if (cuotas < 1) throw new Error('Cuotas inválidas');
    if (this.deuda + monto > this.cupo) throw new Error('Excede el cupo disponible');
    const cm = TarjetaCredito.cuotaMensual(monto, cuotas);
    const tasa = TarjetaCredito.tasa(cuotas);
    this.deuda += monto;
    const m = new Movimiento('compra', monto,
      `${desc} · ${cuotas} cuota(s) de $${Math.round(cm).toLocaleString('es-CO')}`,
      { cuotas, cuotaMensual: cm, tasa });
    this.registrarMovimiento(m);
    return { mov: m, cuotaMensual: cm, totalDeuda: this.deuda, tasa };
  }
  retirar() { throw new Error('La tarjeta de crédito no permite retiros'); }
  get cupoDisponible() { return this.cupo - this.deuda; }
}

export class Cliente {
  constructor({ identificacion, nombre, celular, usuario, password }) {
    this.identificacion = identificacion;
    this.nombre = nombre;
    this.celular = celular;
    this.correo = '';
    this.direccion = '';
    this.usuario = usuario;
    this.password = password;
    this.cuentas = [];
    this.intentosFallidos = 0;
    this.bloqueado = false;
    this.foto = null;
  }
  agregarCuenta(c) { this.cuentas.push(c); }
  verificarPassword(p) { return this.password === p; }
}

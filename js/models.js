'use strict';

// ── Contratos de interfaz (simulación JS del patrón de interfaces) ───────────

/** ITransaction: contrato base para cualquier producto financiero transaccional. */
export const ITransaction = (Base = Object) => class extends Base {
  consignar(monto)     { throw new Error(`${this.constructor.name} debe implementar consignar()`); }
  retirar(monto)       { throw new Error(`${this.constructor.name} debe implementar retirar()`); }
  consultarSaldo()     { throw new Error(`${this.constructor.name} debe implementar consultarSaldo()`); }
  obtenerMovimientos() { throw new Error(`${this.constructor.name} debe implementar obtenerMovimientos()`); }
};

/** ITransferible: contrato para productos que soportan transferencias entre cuentas. */
export const ITransferible = (Base = Object) => class extends Base {
  transferir(destino, monto) { throw new Error(`${this.constructor.name} debe implementar transferir()`); }
  validarDestino(destino)    { throw new Error(`${this.constructor.name} debe implementar validarDestino()`); }
};

/** IAutenticable: contrato de autenticación para entidades con credenciales propias. */
export class IAutenticable {
  autenticar(password)             { throw new Error('Implementar autenticar()'); }
  cerrarSesion()                   { throw new Error('Implementar cerrarSesion()'); }
  cambiarContrasena(actual, nueva) { throw new Error('Implementar cambiarContrasena()'); }
}

// ── Movimiento ───────────────────────────────────────────────────────────────

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

// ── Cuenta (implements ITransaction + ITransferible) ────────────────────────

export class Cuenta extends ITransferible(ITransaction()) {
  #saldo;
  constructor(numero, titular, saldoInicial = 0) {
    super();
    this.numero = numero;
    this.titular = titular;
    this.#saldo = saldoInicial;
    this.movimientos = [];
  }
  get saldo() { return this.#saldo; }
  set saldo(v) { this.#saldo = v; }

  // ITransaction
  consultarSaldo() { return this.#saldo; }
  obtenerMovimientos() { return [...this.movimientos]; }

  consignar(monto, desc = 'Consignación en efectivo', meta = {}) {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('El monto debe ser positivo');
    this.#saldo += monto;
    const m = new Movimiento('consignacion', monto, desc, meta);
    this.movimientos.unshift(m);
    console.log(`[MiPlata] Consignación en ${this.numero}: +$${monto.toLocaleString('es-CO')} → saldo $${this.#saldo.toLocaleString('es-CO')}`);
    return m;
  }

  retirar() { throw new Error('Implementar en subclase'); }

  // ITransferible
  validarDestino(destino) {
    if (!(destino instanceof Cuenta)) throw new Error('Destino inválido');
    if (this.numero === destino.numero) throw new Error('Prohibido transferir al mismo producto');
  }

  transferir(destino, monto) {
    this.validarDestino(destino);
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
    if (monto > this.#saldo) throw new Error('Saldo insuficiente para la transferencia');
    this.#saldo -= monto;
    destino.saldo += monto;
    const mDebito  = new Movimiento('transferencia', monto, `Transferencia a ${destino.numero}`);
    const mCredito = new Movimiento('consignacion',  monto, `Recibida desde ${this.numero}`);
    this.registrarMovimiento(mDebito);
    destino.registrarMovimiento(mCredito);
    console.log(`[MiPlata] Transferencia: ${this.numero} → ${destino.numero}: $${monto.toLocaleString('es-CO')}`);
    return { debito: mDebito, credito: mCredito };
  }

  registrarMovimiento(m) { this.movimientos.unshift(m); return m; }
}

// ── CuentaAhorros ────────────────────────────────────────────────────────────

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
    console.log(`[MiPlata] Retiro Ahorros ${this.numero}: -$${monto.toLocaleString('es-CO')}, interés +$${Math.round(interes).toLocaleString('es-CO')} → saldo $${this.saldo.toLocaleString('es-CO')}`);
    return { mov: m, nuevoSaldo: this.saldo, interes };
  }
}

// ── CuentaCorriente ──────────────────────────────────────────────────────────

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
    console.log(`[MiPlata] Retiro Corriente ${this.numero}: -$${monto.toLocaleString('es-CO')}${enSobregiro ? ' (SOBREGIRO)' : ''} → saldo $${this.saldo.toLocaleString('es-CO')}`);
    return { mov: m, nuevoSaldo: this.saldo, sobregiro: enSobregiro };
  }
}

// ── TarjetaCredito ───────────────────────────────────────────────────────────

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
    console.log(`[MiPlata] Compra TC ${this.numero}: $${monto.toLocaleString('es-CO')} en ${cuotas} cuota(s) de $${Math.round(cm).toLocaleString('es-CO')}/mes → deuda $${this.deuda.toLocaleString('es-CO')}`);
    return { mov: m, cuotaMensual: cm, totalDeuda: this.deuda, tasa };
  }
  retirar() { throw new Error('La tarjeta de crédito no permite retiros'); }
  get cupoDisponible() { return this.cupo - this.deuda; }
}

// ── Cliente (implements IAutenticable) ───────────────────────────────────────

export class Cliente extends IAutenticable {
  static #MAX_INTENTOS = 3;

  constructor({ identificacion, nombre, celular, usuario, password }) {
    super();
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

  // IAutenticable
  autenticar(password) {
    if (this.bloqueado)
      throw new Error('Cuenta bloqueada por exceso de intentos fallidos');
    if (this.password !== password) {
      this.intentosFallidos++;
      if (this.intentosFallidos >= Cliente.#MAX_INTENTOS) {
        this.bloqueado = true;
        throw new Error('Cuenta bloqueada tras 3 intentos fallidos');
      }
      console.warn(`[MiPlata] Autenticación fallida: ${this.usuario} — intento ${this.intentosFallidos} de ${Cliente.#MAX_INTENTOS}`);
      throw new Error(
        `Contraseña incorrecta. Intentos restantes: ${Cliente.#MAX_INTENTOS - this.intentosFallidos}`
      );
    }
    this.intentosFallidos = 0;
    console.log(`[MiPlata] Autenticación exitosa: ${this.usuario}`);
    return true;
  }

  cerrarSesion() {
    // La sesión es gestionada por la capa de presentación (UI)
  }

  cambiarContrasena(actual, nueva) {
    this.autenticar(actual);
    this.password = nueva;
  }

  verificarPassword(p) { return this.password === p; }
}

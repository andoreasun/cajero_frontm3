import { Cliente, CuentaAhorros, CuentaCorriente, TarjetaCredito, Movimiento } from './models.js';

// ── Datos demo ─────────────────────────────────────────────────────────────
export const cliente = new Cliente({
  identificacion: '1.234.567',
  nombre: 'María López',
  celular: '+57 300 555 1234',
  usuario: 'maria',
  password: '1234',
});

export const ahorros   = new CuentaAhorros('AH-7849-2210',       'María López', 2_450_000);
export const corriente = new CuentaCorriente('CC-3201-7745',     'María López',   850_000);
export const tarjeta   = new TarjetaCredito('TC-4521-8899-2210', 'María López', 5_000_000);
tarjeta.deuda = 1_120_000;

ahorros.movimientos.push(
  Object.assign(new Movimiento('consignacion', 500_000, 'Pago de nómina',        { origen: 'Empresa SAS' }),        { fecha: new Date(Date.now() - 86400000 * 2) }),
  Object.assign(new Movimiento('retiro',       120_000, 'Retiro cajero CC93',    { ubicacion: 'CC Premium Plaza' }), { fecha: new Date(Date.now() - 86400000 * 5) }),
  Object.assign(new Movimiento('transferencia', 80_000, 'Transferencia a Juan P.', { destino: 'AH-9988-1100' }),    { fecha: new Date(Date.now() - 86400000 * 7) }),
);
corriente.movimientos.push(
  Object.assign(new Movimiento('consignacion', 250_000, 'Depósito en sucursal', { sucursal: 'Centro' }), { fecha: new Date(Date.now() - 86400000) }),
);
tarjeta.movimientos.push(
  Object.assign(new Movimiento('compra', 320_000, 'Almacenes Éxito · 3 cuotas', { cuotas: 3, cuotaMensual: 110_656, tasa: 0.019 }), { fecha: new Date(Date.now() - 86400000 * 3) }),
);

cliente.agregarCuenta(ahorros);
cliente.agregarCuenta(corriente);
cliente.agregarCuenta(tarjeta);

export const otroCliente = new Cliente({
  identificacion: '7.654.321',
  nombre: 'Juan Pérez',
  celular: '+57 311 999 8877',
  usuario: 'juanp',
  password: '0000',
});
export const otroAhorros = new CuentaAhorros('AH-9988-1100', 'Juan Pérez', 320_000);
otroCliente.agregarCuenta(otroAhorros);

// Pool de clientes — para búsqueda por cédula
export const clientes = [cliente, otroCliente];

// ── Estado mutable de la UI ────────────────────────────────────────────────
// Todos los módulos comparten este objeto; mutarlo aquí lo refleja en todos.
export const ui = {
  cuentaActiva: ahorros,
  saldoVisible: true,
  extractoFiltro: 'todos',
  intentosLogin: 0,
};

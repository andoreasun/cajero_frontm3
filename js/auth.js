import { $ } from './utils.js';
import { cliente, clientes, ui } from './estado.js';
import { guardar, cerrarSesionLS } from './storage.js';
import { Cliente, CuentaAhorros } from './models.js';
import { toast } from './toast.js';
import { inicializarPanel } from './render.js';
import { navegarA } from './router.js';
import { abrirModal, cerrarModal } from './modal.js';

// Antes de sobrescribir `cliente`, guarda sus datos en el pool
// para que siga siendo buscable por cédula en transferencias
function _preservarEnPool() {
  const idx = clientes.indexOf(cliente);
  if (idx === -1) return; // ya fue reemplazado en un login anterior
  const snap = Object.create(Object.getPrototypeOf(cliente));
  Object.assign(snap, cliente);
  clientes[idx] = snap;
}

export function initLogin() {
  $('#formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = $('#loginUser').value.trim();
    const p = $('#loginPass').value;

    // Busca en el pool (demo + registrados)
    const encontrado = clientes.find(c => c.usuario === u);

    if (!encontrado)
      return toast('Usuario no encontrado', 'Ese usuario no está registrado.', 'error');

    try {
      encontrado.autenticar(p); // lanza si falla o está bloqueado
      // ─── Autenticación exitosa ───
      if (encontrado !== cliente) {
        _preservarEnPool();
        Object.assign(cliente, encontrado);
        ui.cuentaActiva = encontrado.cuentas[0];
      }
      ui.intentosLogin = 0;
      $('#intentos').classList.remove('show');
      $('#login').classList.add('hidden');
      $('#app').classList.remove('hidden');
      inicializarPanel();
      navegarA('inicio');
      guardar(clientes, encontrado.usuario);
      console.log('[MiPlata] Login exitoso:', cliente.nombre);
      toast(`¡Hola, ${cliente.nombre.split(' ')[0]}!`, 'Sesión iniciada correctamente.', 'success');
    } catch {
      // ─── Autenticación fallida ───
      ui.intentosLogin = encontrado.intentosFallidos;
      $('#intentos').classList.add('show');
      $('#intentosNum').textContent = ui.intentosLogin;
      if (encontrado.bloqueado) {
        $('#intentos').innerHTML = '🔒 Cuenta bloqueada por 3 intentos fallidos.';
        toast('Cuenta bloqueada', 'Superaste los 3 intentos.', 'error');
      } else {
        toast('Credenciales incorrectas', `Intento ${ui.intentosLogin} de 3.`, 'error');
      }
    }
  });
}

export function cerrarSesion() {
  abrirModal({
    titulo: '¿Cerrar sesión?', sub: 'Tendrás que volver a iniciar sesión.',
    body: '',
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-danger" id="btnConfirmLogout">Sí, cerrar sesión</button>`,
  });

  $('#btnConfirmLogout').addEventListener('click', () => {
    cerrarModal();
    cerrarSesionLS(clientes);
    console.log('[MiPlata] Sesión cerrada:', cliente.usuario);
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
    $('#loginPass').value = '';
    ui.intentosLogin = 0;
    cliente.intentosFallidos = 0;
    $('#intentos').classList.remove('show');
    toast('Sesión cerrada', '¡Hasta pronto!', 'success');
  });
}

export function initRegistro() {
  const loginCard    = document.getElementById('loginMainCard');
  const registerCard = document.getElementById('registerCard');

  $('#btnIrRegistro').addEventListener('click', () => {
    loginCard.classList.add('hidden');
    registerCard.classList.remove('hidden');
  });

  $('#btnIrLogin').addEventListener('click', () => {
    registerCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
  });

  $('#formRegistro').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre  = $('#regNombre').value.trim();
    const cedula  = $('#regCedula').value.trim();
    const celular = $('#regCelular').value.trim();
    const usuario = $('#regUsuario').value.trim().toLowerCase();
    const pass    = $('#regPass').value;
    const conf    = $('#regPassConf').value;

    if (!nombre || !cedula || !celular || !usuario || !pass)
      return toast('Campos incompletos', 'Completa todos los campos.', 'error');
    if (pass !== conf)
      return toast('Contraseñas distintas', 'Las contraseñas no coinciden.', 'error');
    if (pass.length < 4)
      return toast('Contraseña muy corta', 'Mínimo 4 caracteres.', 'error');
    if (clientes.some(c => c.usuario === usuario))
      return toast('Usuario no disponible', 'Ese nombre de usuario ya está en uso.', 'error');

    const normalCed = cedula.replace(/[.\s-]/g, '');
    if (!normalCed)
      return toast('Cédula inválida', 'Ingresa tu número de cédula.', 'error');
    if (clientes.some(c => c.identificacion.replace(/[.\s-]/g, '') === normalCed))
      return toast('Cédula ya registrada', 'Ya existe una cuenta con esa cédula.', 'error');

    // Crear nuevo cliente con cuenta de ahorros
    const rand4    = () => String(Math.floor(Math.random() * 9000) + 1000);
    const numCuenta = `AH-${rand4()}-${rand4()}`;
    const nuevaCuenta  = new CuentaAhorros(numCuenta, nombre, 0);
    const nuevoCliente = new Cliente({ identificacion: cedula, nombre, celular, usuario, password: pass });
    nuevoCliente.agregarCuenta(nuevaCuenta);
    clientes.push(nuevoCliente);

    // Auto-login: preservar usuario saliente y cargar el nuevo
    _preservarEnPool();
    Object.assign(cliente, nuevoCliente);
    ui.cuentaActiva = nuevaCuenta;
    ui.intentosLogin = 0;

    // Resetear y ocultar pantalla de login
    $('#formRegistro').reset();
    registerCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
    inicializarPanel();
    navegarA('inicio');
    guardar(clientes, nuevoCliente.usuario);
    console.log('[MiPlata] Registro exitoso:', nuevoCliente.nombre);
    toast(`¡Bienvenido/a, ${nombre.split(' ')[0]}!`, 'Cuenta creada. Ya puedes operar.', 'success');
  });
}

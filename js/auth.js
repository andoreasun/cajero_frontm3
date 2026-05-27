import { $ } from './utils.js';
import { cliente, ui } from './state.js';
import { toast } from './toast.js';
import { inicializarPanel } from './render.js';
import { navegarA } from './router.js';
import { abrirModal, cerrarModal } from './modal.js';

export function initLogin() {
  $('#formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = $('#loginUser').value.trim();
    const p = $('#loginPass').value;

    if (cliente.bloqueado)
      return toast('Cuenta bloqueada', 'Has superado los intentos permitidos.', 'error');

    if (u === cliente.usuario && cliente.verificarPassword(p)) {
      // ── Login exitoso ─────────────────────────────────────────────────
      cliente.intentosFallidos = 0;
      ui.intentosLogin = 0;
      $('#login').classList.add('hidden');
      $('#app').classList.remove('hidden');
      inicializarPanel();
      navegarA('inicio');
      toast(`¡Hola, ${cliente.nombre.split(' ')[0]}!`, 'Sesión iniciada correctamente.', 'success');
    } else {
      // ── Intento fallido ───────────────────────────────────────────────
      ui.intentosLogin++;
      cliente.intentosFallidos = ui.intentosLogin;
      $('#intentos').classList.add('show');
      $('#intentosNum').textContent = ui.intentosLogin;
      if (ui.intentosLogin >= 3) {
        cliente.bloqueado = true;
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
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
    $('#loginPass').value = '';
    ui.intentosLogin = 0;
    cliente.intentosFallidos = 0;
    $('#intentos').classList.remove('show');
    toast('Sesión cerrada', '¡Hasta pronto!', 'success');
  });
}

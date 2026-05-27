import { $, iniciales, Scheduler } from './utils.js';
import { cliente, ui } from './estado.js';
import { CuentaCorriente, TarjetaCredito } from './models.js';
import { toast } from './toast.js';
import { abrirModal, cerrarModal } from './modal.js';
import { renderSideUser, renderTabs } from './render.js';

let _perfilListenersAdded = false;

// Se llama cada vez que el router entra a la vista de perfil
export function initPerfilPage() {
  _rellenarCampos();

  if (!_perfilListenersAdded) {
    _perfilListenersAdded = true;
    _bindBotones();
    _bindFoto();
  }
}

function _rellenarCampos() {
  Scheduler.frame(() => {
    if ($('#pfNombre'))  $('#pfNombre').value  = cliente.nombre;
    if ($('#pfId'))      $('#pfId').value      = cliente.identificacion;
    if ($('#pfCel'))     $('#pfCel').value     = cliente.celular;
    if ($('#pfMail'))    $('#pfMail').value    = cliente.correo ?? '';
    if ($('#pfUser'))    $('#pfUser').value    = cliente.usuario;
    if ($('#pfDir'))     $('#pfDir').value     = cliente.direccion ?? '';

    $('#perfilNombreCard').textContent = cliente.nombre;
    $('#perfilDocCard').textContent    = `CC ${cliente.identificacion}`;
    $('#perfilPhotoIniciales').textContent = iniciales(cliente.nombre);

    // Restaurar foto si existe
    if (cliente.foto) {
      const img = $('#perfilPhotoWrap').querySelector('img') ?? document.createElement('img');
      img.src = cliente.foto;
      img.className = 'avatar-img';
      if (!img.parentElement) $('#perfilPhotoWrap').prepend(img);
    }

    _renderProductos();
  });
}

function _renderProductos() {
  const lista = document.getElementById('listaProductos');
  if (!lista) return;

  const tieneCorriente = cliente.cuentas.some(c => c instanceof CuentaCorriente);
  const tieneTarjeta   = cliente.cuentas.some(c => c instanceof TarjetaCredito);

  if (tieneCorriente && tieneTarjeta) {
    lista.innerHTML = '<p style="font-size:13px;color:var(--tinta-3)">Ya tienes todos los productos disponibles.</p>';
    return;
  }

  const rand4 = () => String(Math.floor(Math.random() * 9000) + 1000);

  let html = '';

  if (!tieneCorriente) {
    html += `
      <div class="producto-item">
        <div>
          <div class="producto-nombre">Cuenta Corriente</div>
          <div class="producto-sub">Sobregiro del 20% · apertura gratuita</div>
        </div>
        <button class="btn btn-primary" id="btnAgregarCorriente">+ Activar</button>
      </div>`;
  }

  if (!tieneTarjeta) {
    html += `
      <div class="producto-item">
        <div>
          <div class="producto-nombre">Tarjeta de Crédito</div>
          <div class="producto-sub">Cupo de $2.000.000 · compras a cuotas</div>
        </div>
        <button class="btn btn-primary" id="btnAgregarTarjeta">+ Activar</button>
      </div>`;
  }

  lista.innerHTML = html;

  if (!tieneCorriente) {
    document.getElementById('btnAgregarCorriente').addEventListener('click', () => {
      const nueva = new CuentaCorriente(`CC-${rand4()}-${rand4()}`, cliente.nombre, 0);
      cliente.cuentas.push(nueva);
      renderTabs();
      _renderProductos();
      toast('Cuenta Corriente activada', `Número: ${nueva.numero}`, 'success');
    });
  }

  if (!tieneTarjeta) {
    document.getElementById('btnAgregarTarjeta').addEventListener('click', () => {
      const nueva = new TarjetaCredito(`TC-${rand4()}-${rand4()}-${rand4()}`, cliente.nombre, 2_000_000);
      cliente.cuentas.push(nueva);
      renderTabs();
      _renderProductos();
      toast('Tarjeta de Crédito activada', 'Cupo: $2.000.000', 'success');
    });
  }
}

function _bindBotones() {
  $('#btnGuardarPerfil').addEventListener('click', () => {
    const nombre = $('#pfNombre').value.trim();
    const id     = $('#pfId').value.trim();
    const cel    = $('#pfCel').value.trim();
    const mail   = $('#pfMail').value.trim();
    const user   = $('#pfUser').value.trim();
    const dir    = $('#pfDir').value.trim();

    if (!nombre || !user) return toast('Datos incompletos', 'Nombre y usuario son obligatorios.', 'error');

    cliente.nombre        = nombre;
    cliente.identificacion = id;
    cliente.celular       = cel;
    cliente.correo        = mail;
    cliente.usuario       = user;
    cliente.direccion     = dir;

    _rellenarCampos();
    renderSideUser();
    toast('Perfil actualizado', 'Tus cambios se guardaron.', 'success');
  });

  $('#btnRevertirPerfil').addEventListener('click', () => {
    _rellenarCampos();
    toast('Cambios descartados', '', 'warn');
  });

  // Cambiar contraseña directamente con los campos inline de la página
  $('#btnCambiarPass').addEventListener('click', () => {
    const actual    = $('#pfPassActual').value;
    const nueva     = $('#pfPassNueva').value;
    const confirma  = $('#pfPassConfirma').value;
    if (!cliente.verificarPassword(actual)) return toast('Clave incorrecta', 'No coincide con la actual.', 'error');
    if (!nueva || nueva.length < 4)         return toast('Clave inválida',    'Mínimo 4 caracteres.',    'error');
    if (nueva !== confirma)                  return toast('No coincide',       'La confirmación no coincide.', 'error');
    cliente.password = nueva;
    $('#pfPassActual').value = '';
    $('#pfPassNueva').value  = '';
    $('#pfPassConfirma').value = '';
    toast('Contraseña actualizada', 'Recuerda usarla en tu próximo ingreso.', 'success');
  });
}

function _bindFoto() {
  const wrap  = $('#perfilPhotoWrap');
  const input = $('#perfilPhotoInput');
  const btnSubir  = $('#btnSubirFoto');
  const btnQuitar = $('#btnQuitarFoto');

  wrap.addEventListener('click', () => input.click());
  btnSubir.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      cliente.foto = e.target.result;
      let img = wrap.querySelector('img');
      if (!img) { img = document.createElement('img'); img.className = 'avatar-img'; wrap.prepend(img); }
      img.src = e.target.result;
      // Ocultar iniciales mientras hay foto
      const ini = $('#perfilPhotoIniciales');
      if (ini) ini.style.display = 'none';
      // Actualizar avatar del sidebar también
      const avSide = document.getElementById('avatarSide');
      if (avSide) {
        avSide.innerHTML = `<img src="${e.target.result}" class="avatar-img" />`;
      }
      toast('Foto actualizada', '', 'success');
    };
    reader.readAsDataURL(file);
  });

  btnQuitar.addEventListener('click', () => {
    cliente.foto = null;
    const img = wrap.querySelector('img');
    if (img) img.remove();
    const ini = $('#perfilPhotoIniciales');
    if (ini) ini.style.display = '';
    // Restaurar avatar del sidebar
    const avSide = document.getElementById('avatarSide');
    if (avSide) avSide.textContent = iniciales(cliente.nombre);
    toast('Foto eliminada', '', 'success');
  });
}

// ── Cambiar contraseña (modal) ─────────────────────────────────────────────
export function accionCambiarPass() {
  abrirModal({
    titulo: 'Cambiar contraseña', sub: 'Por seguridad, confirma con tu clave actual',
    body: `
      <div class="field"><label>Usuario</label>
        <input id="cpUser" value="${cliente.usuario}" readonly
          style="background:var(--rosa-100);color:var(--tinta-2)" /></div>
      <div class="field"><label>Clave actual</label>
        <input type="password" id="cpActual" /></div>
      <div class="field"><label>Nueva clave</label>
        <input type="password" id="cpNueva" /></div>
      <div class="field"><label>Confirmar nueva clave</label>
        <input type="password" id="cpConfirma" /></div>`,
    footer: `
      <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnGuardarPass">Guardar</button>`,
  });

  $('#btnGuardarPass').addEventListener('click', () => {
    const a = $('#cpActual').value;
    const n = $('#cpNueva').value;
    const c = $('#cpConfirma').value;
    if (!cliente.verificarPassword(a)) return toast('Clave incorrecta', 'No coincide con la actual.', 'error');
    if (!n || n.length < 4)            return toast('Clave inválida', 'Mínimo 4 caracteres.', 'error');
    if (n !== c)                        return toast('No coincide', 'La confirmación no coincide.', 'error');
    cliente.password = n;
    cerrarModal();
    toast('Contraseña actualizada', 'Recuerda usarla en tu próximo ingreso.', 'success');
  });
}

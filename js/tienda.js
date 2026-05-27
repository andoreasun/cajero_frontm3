import { $, $$, fmt, Scheduler } from './utils.js';
import { cliente, ui } from './estado.js';
import { TarjetaCredito } from './models.js';
import { abrirModal, cerrarModal } from './modal.js';
import { toast } from './toast.js';
import { renderSaldo, renderMovimientos, renderStats, renderTabs } from './render.js';
import { abrirRecibo } from './documentos.js';

const CATEGORIAS = [
  { id: 'todos',           label: 'Todos' },
  { id: 'supermercados',   label: 'Supermercados' },
  { id: 'hogar',           label: 'Hogar' },
  { id: 'moda',            label: 'Moda' },
  { id: 'tecnologia',      label: 'Tecnología' },
  { id: 'belleza',         label: 'Belleza' },
  { id: 'deportes',        label: 'Deportes' },
  { id: 'mascotas',        label: 'Mascotas' },
  { id: 'salud',           label: 'Salud' },
  { id: 'entretenimiento', label: 'Entretenimiento' },
];

const TIENDAS = [
  { cat: 'supermercados', nombre: 'Almacenes Éxito',  emoji: '🛒' },
  { cat: 'supermercados', nombre: 'Carulla',           emoji: '🛒' },
  { cat: 'supermercados', nombre: 'Jumbo',             emoji: '🛒' },
  { cat: 'supermercados', nombre: 'Metro',             emoji: '🏪' },
  { cat: 'supermercados', nombre: 'Makro',             emoji: '🏪' },
  { cat: 'supermercados', nombre: 'D1',                emoji: '🏷️' },
  { cat: 'supermercados', nombre: 'Ara',               emoji: '🌿' },
  { cat: 'supermercados', nombre: 'PriceSmart',        emoji: '💰' },

  { cat: 'hogar', nombre: 'Homecenter',      emoji: '🔨' },
  { cat: 'hogar', nombre: 'Easy',            emoji: '🔧' },
  { cat: 'hogar', nombre: 'IKEA',            emoji: '🪑' },
  { cat: 'hogar', nombre: 'Falabella Hogar', emoji: '🛋️' },
  { cat: 'hogar', nombre: 'Arredo',          emoji: '🪞' },
  { cat: 'hogar', nombre: 'Tugó',            emoji: '🪑' },
  { cat: 'hogar', nombre: 'Casa & Estilo',   emoji: '🏠' },

  { cat: 'moda', nombre: 'Falabella',    emoji: '👗' },
  { cat: 'moda', nombre: 'Ripley',       emoji: '👔' },
  { cat: 'moda', nombre: 'Zara',         emoji: '👗' },
  { cat: 'moda', nombre: 'H&M',          emoji: '👕' },
  { cat: 'moda', nombre: 'Tennis',       emoji: '👟' },
  { cat: 'moda', nombre: 'Totto',        emoji: '🎒' },
  { cat: 'moda', nombre: 'Arturo Calle', emoji: '👔' },
  { cat: 'moda', nombre: 'Koaj',         emoji: '👗' },
  { cat: 'moda', nombre: 'Studio F',     emoji: '👗' },
  { cat: 'moda', nombre: 'PatPrimo',     emoji: '👔' },
  { cat: 'moda', nombre: 'Mango',        emoji: '👗' },
  { cat: 'moda', nombre: 'Bershka',      emoji: '👕' },
  { cat: 'moda', nombre: 'Pull & Bear',  emoji: '👕' },
  { cat: 'moda', nombre: 'Chevignon',    emoji: '🧥' },
  { cat: 'moda', nombre: 'Vélez',        emoji: '👜' },

  { cat: 'tecnologia', nombre: 'Ktronix',         emoji: '💻' },
  { cat: 'tecnologia', nombre: 'Alkosto',          emoji: '📺' },
  { cat: 'tecnologia', nombre: 'Samsung Store',    emoji: '📱' },
  { cat: 'tecnologia', nombre: 'iShop Colombia',   emoji: '🍎' },
  { cat: 'tecnologia', nombre: 'Claro Tienda',     emoji: '📡' },
  { cat: 'tecnologia', nombre: 'Movistar Tienda',  emoji: '📱' },

  { cat: 'belleza', nombre: 'Sephora',  emoji: '💄' },
  { cat: 'belleza', nombre: 'Ésika',    emoji: '💅' },
  { cat: 'belleza', nombre: 'Yanbal',   emoji: '🌸' },
  { cat: 'belleza', nombre: "L'bel",    emoji: '💋' },
  { cat: 'belleza', nombre: 'MAC',      emoji: '💄' },
  { cat: 'belleza', nombre: 'NYX',      emoji: '💅' },
  { cat: 'belleza', nombre: 'Belcorp',  emoji: '🌹' },
  { cat: 'belleza', nombre: 'Jafra',    emoji: '🌺' },

  { cat: 'deportes', nombre: 'Adidas',          emoji: '⚽' },
  { cat: 'deportes', nombre: 'Nike',            emoji: '👟' },
  { cat: 'deportes', nombre: 'Decathlon',       emoji: '🏅' },
  { cat: 'deportes', nombre: 'Marathon Sports', emoji: '🏃' },
  { cat: 'deportes', nombre: 'Under Armour',    emoji: '💪' },
  { cat: 'deportes', nombre: 'Intersport',      emoji: '🏋️' },

  { cat: 'mascotas', nombre: 'Laika',    emoji: '🐾' },
  { cat: 'mascotas', nombre: 'Puppis',   emoji: '🐶' },
  { cat: 'mascotas', nombre: 'Pet Zone', emoji: '🐱' },
  { cat: 'mascotas', nombre: 'Petco',    emoji: '🐕' },

  { cat: 'salud', nombre: 'Cruz Verde',       emoji: '💊' },
  { cat: 'salud', nombre: 'Drogas La Rebaja', emoji: '🏥' },
  { cat: 'salud', nombre: 'Colsubsidio',      emoji: '🏪' },
  { cat: 'salud', nombre: 'Droguería Cafam',  emoji: '💊' },
  { cat: 'salud', nombre: 'Locatel',          emoji: '🩺' },

  { cat: 'entretenimiento', nombre: 'Cinemark',          emoji: '🎬' },
  { cat: 'entretenimiento', nombre: 'Cine Colombia',     emoji: '🎥' },
  { cat: 'entretenimiento', nombre: 'Netflix',           emoji: '📺' },
  { cat: 'entretenimiento', nombre: 'Spotify',           emoji: '🎵' },
  { cat: 'entretenimiento', nombre: 'Librería Nacional', emoji: '📚' },
  { cat: 'entretenimiento', nombre: 'Lerner',            emoji: '📖' },
  { cat: 'entretenimiento', nombre: 'GamePlanet',        emoji: '🎮' },
];

export function initTiendaPage() {
  _render('todos');
}

function _render(catActiva) {
  const cont = document.getElementById('tiendaContenido');
  if (!cont) return;

  const tc = cliente.cuentas.find(c => c instanceof TarjetaCredito);

  const infoHtml = tc
    ? `<div class="tienda-tc-info">
         <span>Tarjeta · ${tc.numero}</span>
         <b>Cupo disponible: ${fmt(tc.cupoDisponible)}</b>
       </div>`
    : `<div class="tienda-tc-info tienda-tc-warn">
         No tienes tarjeta de crédito activa. Actívala desde Mi perfil.
       </div>`;

  const tabsHtml = CATEGORIAS.map(c =>
    `<button class="tienda-tab${c.id === catActiva ? ' active' : ''}" data-cat="${c.id}">${c.label}</button>`
  ).join('');

  const lista = catActiva === 'todos' ? TIENDAS : TIENDAS.filter(t => t.cat === catActiva);

  const tiendasHtml = lista.map(t =>
    `<button class="tienda-card" data-nombre="${t.nombre}">
       <div class="tienda-emoji">${t.emoji}</div>
       <div class="tienda-nombre">${t.nombre}</div>
     </button>`
  ).join('');

  cont.innerHTML = `
    ${infoHtml}
    <div class="tienda-tabs">${tabsHtml}</div>
    <div class="tienda-grid">${tiendasHtml}</div>`;

  $$('.tienda-tab', cont).forEach(btn =>
    btn.addEventListener('click', () => _render(btn.dataset.cat))
  );

  $$('.tienda-card', cont).forEach(btn =>
    btn.addEventListener('click', () => {
      if (!tc) return toast('Sin tarjeta', 'Activa tu tarjeta de crédito desde Mi perfil.', 'warn');
      _abrirCompra(tc, btn.dataset.nombre);
    })
  );
}

function _abrirCompra(tc, nombreTienda) {
  abrirModal({
    titulo: nombreTienda,
    sub: `Cupo disponible: ${fmt(tc.cupoDisponible)}`,
    body: `
      <div class="field"><label>Descripción</label>
        <input type="text" id="cpDesc" value="${nombreTienda}" /></div>
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
      const desc  = $('#cpDesc').value.trim() || nombreTienda;
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

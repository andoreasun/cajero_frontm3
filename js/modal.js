import { $ } from './utils.js';

export function abrirModal({ titulo, sub = '', body = '', footer = '', wide = false }) {
  $('#modalTitulo').textContent = titulo;
  $('#modalSub').textContent    = sub;
  $('#modalBody').innerHTML     = body;
  $('#modalFooter').innerHTML   = footer;
  $('#modalBox').classList.toggle('wide', !!wide);
  $('#modal').classList.add('show');
}

export function cerrarModal() {
  $('#modal').classList.remove('show');
}

export function initModal() {
  $('#modalClose').addEventListener('click', cerrarModal);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') cerrarModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });
  // Exposición global para onclick inline en footers de modal
  window.cerrarModal = cerrarModal;
}

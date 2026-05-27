import { $ } from './utils.js';

export function toast(titulo, msg, tipo = 'success') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;

  const iconoSVG = {
    success: '<polyline points="20 6 9 17 4 12"/>',
    error:   '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    warn:    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  }[tipo] ?? '';

  el.innerHTML = `
    <div class="toast-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${iconoSVG}</svg>
    </div>
    <div class="toast-text">
      <div class="toast-title">${titulo}</div>
      <div class="toast-msg">${msg ?? ''}</div>
    </div>`;

  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  }, 3500);
}

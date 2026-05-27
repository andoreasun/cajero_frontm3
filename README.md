# Mi Plata · Panel del Cajero

Aplicación web de banca digital construida con HTML5, CSS3 y JavaScript puro (ES6 Modules).  
Desarrollada como ejercicio de POO, modularización y manejo del Event Loop en el frontend.

---

## Estructura del proyecto

```
miplata_front_momento3/
├── index.html              ← Punto de entrada (abre con Live Server)
├── css/
│   └── main.css            ← Todos los estilos
├── js/
│   ├── models.js           ← Clases: Movimiento, Cuenta, CuentaAhorros, etc.
│   ├── state.js            ← Datos demo + estado mutable de la UI (ui.cuentaActiva…)
│   ├── utils.js            ← Helpers ($, fmt…) + Scheduler (Event Loop)
│   ├── toast.js            ← Notificaciones flotantes
│   ├── modal.js            ← Modal genérico reutilizable
│   ├── router.js           ← Navegación entre páginas (navegarA)
│   ├── render.js           ← Funciones de render del dashboard
│   ├── transacciones.js    ← Consignar, retirar, transferir, consultar
│   ├── servicios.js        ← Pagar servicios, recargas, comprar a cuotas
│   ├── documentos.js       ← Páginas de movimientos/extractos + recibos
│   ├── perfil.js           ← Página de perfil + cambio de contraseña
│   ├── auth.js             ← Login y cierre de sesión
│   └── app.js              ← Punto de entrada JS (importa todo y registra listeners)
└── uploads/
    └── index.html          ← Archivo de referencia del diseño original
```

---

## Cómo ejecutar

> **Importante:** este proyecto usa **ES6 Modules** (`import/export`).  
> Los módulos ES6 requieren ser servidos por un servidor HTTP; **no funcionan abriéndolos directamente como `file://`**.

### Con VS Code + Live Server (recomendado)

1. Abre la carpeta `miplata_front_momento3` en VS Code.
2. Haz clic en **"Go Live"** en la barra de estado inferior.
3. Se abrirá `http://127.0.0.1:5500/` → carga `index.html` automáticamente.
4. Credenciales demo: usuario `maria`, contraseña `1234`.

### Por qué antes no funcionaba con Live Server

Live Server buscaba `index.html` en la raíz del proyecto. Como no existía, abría `uploads/index.html`  
(un archivo de instrucciones del diseño, no la app). Al crear `index.html` en la raíz se resuelve.

---

## Características implementadas

| Módulo | Descripción |
|--------|-------------|
| **POO** | Herencia: `Cuenta` → `CuentaAhorros`, `CuentaCorriente`, `TarjetaCredito` |
| **Router** | Navegación sin recarga entre páginas completas (Dashboard, Perfil, Movimientos, Extractos) |
| **Scheduler** | Organización de tareas por prioridad en el Event Loop (ver abajo) |
| **ES6 Modules** | Código dividido en 13 módulos con `import/export` explícitos |

---

## Scheduler y Event Loop

`js/utils.js` exporta un objeto `Scheduler` que organiza tareas según su prioridad:

```
Call Stack (síncrono)     → código normal, bloquea el hilo
      ↓
Microtareas               → Promise.resolve().then(fn)   — antes del próximo repintado
      ↓
Animation Frame           → requestAnimationFrame(fn)    — sincronizado con pantalla (~60fps)
      ↓
Macrotareas               → setTimeout(fn, ms)           — al final de la cola
      ↓
Idle                      → requestIdleCallback(fn)      — cuando el browser está libre
```

**Uso en el código:**

```javascript
// Render de DOM → siempre en animation frame (evita layout thrashing)
Scheduler.frame(() => { lista.innerHTML = movs.map(movRow).join(''); });

// Efectos tras una operación → microtarea (alta prioridad)
Scheduler.micro(() => { renderTabs(); renderSaldo(); });

// Mostrar recibo tras cerrar modal → macrotarea diferida
Scheduler.defer(() => abrirRecibo(mov), 400);
```

---

## Navegación (Router)

El router en `js/router.js` maneja 4 vistas:

| Vista | Acción sidebar | Descripción |
|-------|---------------|-------------|
| Dashboard | `data-action="inicio"` | Tarjeta + movimientos recientes |
| Mi Perfil | `data-action="perfil"` | Página completa con foto y datos |
| Movimientos | `data-action="movimientos"` | Historial completo por cuenta |
| Extractos | `data-action="extractos"` | Filtros por tipo + descarga HTML |

Las acciones transaccionales (Consignar, Retirar, etc.) siguen abriendo modales ya que son formularios cortos.

---

## Credenciales demo

| Usuario | Contraseña | Nombre |
|---------|-----------|--------|
| `maria` | `1234` | María López |
| `juanp` | `0000` | Juan Pérez (solo receptor de transferencias) |

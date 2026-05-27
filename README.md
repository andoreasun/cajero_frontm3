# Mi Plata · Panel del Cajero

Aplicación web de banca digital construida con HTML5, CSS3 y JavaScript puro (ES6 Modules).  
Desarrollada como proyecto integrador de Frontend 1 — POO, modularización y manejo del Event Loop.

**© Daniela Vivas · © Andrea Cuartas — 2026**

---

## Cómo ejecutar

> **Importante:** este proyecto usa **ES6 Modules** (`import/export`).  
> Los módulos ES6 requieren ser servidos por un servidor HTTP; **no funcionan abriéndolos directamente como `file://`**.

### Con VS Code + Live Server (recomendado)

1. Abre la carpeta `miplata_front_momento3` en VS Code.
2. Haz clic en **"Go Live"** en la barra de estado inferior.
3. Se abrirá `http://127.0.0.1:5500/` automáticamente.
4. Credenciales demo: usuario `maria`, contraseña `1234`.

> Para abrir con Chrome en lugar de Edge: `Configuración → Live Server → "liveServer.settings.CustomBrowser": "chrome"`

---

## Credenciales demo

| Usuario | Contraseña | Nombre |
|---------|-----------|--------|
| `maria` | `1234` | María López (Ahorros + Corriente + Tarjeta) |
| `juanp` | `0000` | Juan Pérez (Ahorros) |

También puedes **crear tu propio usuario** desde el botón "Regístrate" en la pantalla de login.

---

## Estructura del proyecto

```
miplata_front_momento3/
├── index.html              ← Único HTML: contiene todas las vistas de la app
├── css/
│   └── main.css            ← Todos los estilos (variables, layout, componentes, print)
└── js/
    ├── app.js              ← Punto de entrada: inicializa módulos y registra listeners
    ├── state.js            ← Estado global: datos demo + ui.cuentaActiva, etc.
    ├── models.js           ← Clases de dominio: Cliente, Cuenta, TarjetaCredito, Movimiento
    ├── utils.js            ← Helpers ($, fmt, Scheduler)
    ├── router.js           ← Navegación SPA entre vistas (navegarA)
    ├── render.js           ← Actualiza el DOM del dashboard con el estado actual
    ├── modal.js            ← Sistema de modales genéricos y reutilizables
    ├── toast.js            ← Notificaciones temporales (éxito / error / aviso)
    ├── auth.js             ← Login, logout y registro de nuevos usuarios
    ├── transacciones.js    ← Consignar, retirar (ATM), transferir, consultar saldo
    ├── servicios.js        ← Pagar servicios públicos y recargas de celular
    ├── tienda.js           ← Catálogo de 66 tiendas y compras a cuotas con tarjeta
    ├── certificados.js     ← Certificados de cuentas, deuda y tributarios (imprimibles)
    ├── perfil.js           ← Edición de perfil, cambio de clave, activar productos
    └── documentos.js       ← Historial de movimientos, extractos y comprobantes
```

---

## Funcionalidades

| Funcionalidad | Descripción |
|---------------|-------------|
| **Login y registro** | Autenticación con bloqueo por 3 intentos fallidos. Registro de nuevos clientes con cuenta de ahorros automática. |
| **Multi-usuario** | Varios usuarios pueden iniciar sesión en la misma sesión sin perder datos entre cambios. |
| **Dashboard** | Tarjeta de saldo animada con pestañas por cuenta, resumen de ingresos/gastos y movimientos recientes. |
| **Consignar** | Depósito a cuenta propia o a otra cuenta buscando por cédula del destinatario. |
| **Retirar (ATM)** | Selección de cuenta estilo cajero (Ahorros, Corriente o Avance TC) antes de ingresar el monto. |
| **Transferir** | Transferencia entre cuentas propias o a otros usuarios por cédula. |
| **Consultar saldo** | Muestra saldo, condiciones de la cuenta y los últimos 3 movimientos. |
| **Pagar servicios** | EPM, Claro Hogar, Tigo, Acueducto, Gas Natural y EPS Sura. |
| **Recargas** | Recarga de celular a Claro, Movistar, Tigo y WOM. |
| **Tienda (cuotas)** | 66 almacenes colombianos en 9 categorías. Compra a cuotas con cálculo de interés. |
| **Movimientos** | Historial completo filtrable por cuenta con comprobante imprimible por transacción. |
| **Extractos** | Estado de cuenta filtrable por tipo de movimiento y descargable como PDF. |
| **Certificados** | Certificado de cada cuenta/tarjeta, certificado de deuda y certificados tributarios. |
| **Perfil** | Edición de datos personales, foto de perfil, cambio de contraseña y activación de Cuenta Corriente / Tarjeta de Crédito. |

---

## Vistas (Router)

| Vista | `data-action` | Tipo |
|-------|--------------|------|
| Dashboard | `inicio` | Página completa |
| Mi Perfil | `perfil` | Página completa |
| Movimientos | `movimientos` | Página completa |
| Extractos | `extractos` | Página completa |
| Certificados | `certificados` | Página completa |
| Tienda | `tienda` | Página completa |
| Consignar / Retirar / Transferir / Consultar | — | Modal flotante |
| Pagar servicios / Recargas | — | Modal flotante |

---

## Reglas de negocio por tipo de cuenta

| Cuenta | Límite de retiro | Condición extra |
|--------|-----------------|-----------------|
| Ahorros | Saldo disponible | +1.5% de interés sobre el monto retirado |
| Corriente | Saldo + 20% (sobregiro) | Sin interés adicional |
| Tarjeta de crédito | Cupo disponible | ≤2 cuotas: 0% · 3-6 cuotas: 1.9% mensual · ≥7 cuotas: 2.3% mensual |

---

## Scheduler y Event Loop

`utils.js` exporta un `Scheduler` que organiza tareas según su prioridad en el event loop:

```
Microtareas    → Promise.resolve().then(fn)   — antes del próximo repintado
Animation Frame → requestAnimationFrame(fn)   — sincronizado con pantalla (~60fps)
Macrotareas    → setTimeout(fn, ms)           — al final de la cola
```

```javascript
Scheduler.micro(() => { renderTabs(); renderSaldo(); });   // cambios de visibilidad DOM
Scheduler.frame(() => { lista.innerHTML = movsHtml; });   // render del dashboard
Scheduler.defer(() => abrirRecibo(mov), 400);             // recibo tras cerrar modal
```

---

## Conceptos aplicados

- **POO con herencia:** `CuentaAhorros` y `CuentaCorriente` extienden `Cuenta`
- **ES6 Modules:** 15 módulos con `import/export` explícitos, sin variables globales
- **SPA (Single Page App):** una sola página HTML; el router muestra/oculta vistas
- **Event Delegation:** un listener en `document` captura todos los `data-action`
- **Estado compartido mutable:** `cliente` y `ui` son vistos por todos los módulos en tiempo real
- **Template literals:** generación de HTML dinámico con interpolación de variables
- **Intl.NumberFormat:** formato de moneda COP nativo del navegador

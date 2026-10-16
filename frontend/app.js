
const API_URL = "https://proyecto-bd-fw27.onrender.com";

const listaProductos = document.getElementById("listaProductos");
const formulario = document.getElementById("formularioProducto");
const productoId = document.getElementById("productoId");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");
const formContacto = document.getElementById("formularioContacto");
const listaHistorial = document.getElementById("listaHistorial");

async function cargarProductos() {
  if (!listaProductos) return;

  try {
    const respuesta = await fetch(`${API_URL}/productos`);
    const productos = await respuesta.json();

    listaProductos.innerHTML = "";

    if (productos.length === 0) {
      listaProductos.innerHTML = "<p style='color: #64748b;'>No hay productos registrados.</p>";
      return;
    }

    productos.forEach((producto) => {
      const elemento = document.createElement("div");
      elemento.classList.add("producto");

      elemento.innerHTML = `
        <div>
          <h3>${producto.nombre}</h3>
          <p class="producto-precio">Precio: $${producto.precio}</p>
          <p>Stock: ${producto.stock} unidades</p>
        </div>
        <div class="acciones">
          <button class="btn-editar" onclick="cargarEnFormulario(${producto.id}, '${producto.nombre}', ${producto.precio}, ${producto.stock})">Editar</button>
          <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">Eliminar</button>
        </div>
      `;

      listaProductos.appendChild(elemento);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

function cargarEnFormulario(id, nombre, precio, stock) {
  productoId.value = id;
  nombreInput.value = nombre;
  precioInput.value = precio;
  stockInput.value = stock;

  tituloFormulario.textContent = "Editar Producto";
  btnGuardar.textContent = "Actualizar Producto";
  btnCancelar.style.display = "block";
  nombreInput.focus();
}

function cancelarEdicion() {
  formulario.reset();
  productoId.value = "";
  tituloFormulario.textContent = "Registrar Producto";
  btnGuardar.textContent = "Guardar Producto";
  btnCancelar.style.display = "none";
}

if (btnCancelar) {
  btnCancelar.addEventListener("click", cancelarEdicion);
}

if (formulario) {
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = productoId.value;
    const nombre = nombreInput.value;
    const precio = precioInput.value;
    const stock = stockInput.value;

    try {
      if (id) {
        await fetch(`${API_URL}/productos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, precio, stock }),
        });
      } else {
        await fetch(`${API_URL}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, precio, stock }),
        });
      }

      cancelarEdicion();
      cargarProductos();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  });
}

async function eliminarProducto(id) {
  const confirmar = confirm("¿Deseas eliminar este producto de la base de datos?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
    });

    if (productoId.value == id) {
      cancelarEdicion();
    }

    cargarProductos();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
}

async function cargarHistorial() {
  if (!listaHistorial) return;

  try {
    const respuesta = await fetch(`${API_URL}/contactos`);
    const mensajes = await respuesta.json();

    listaHistorial.innerHTML = "";

    if (mensajes.length === 0) {
      listaHistorial.innerHTML = "<p style='color: #64748b;'>No hay mensajes enviados.</p>";
      return;
    }

    mensajes.forEach((m) => {
      const elemento = document.createElement("div");
      elemento.classList.add("producto");
      elemento.style.flexDirection = "row";
      elemento.style.alignItems = "center";
      elemento.style.justifyContent = "space-between";
      elemento.style.gap = "20px";

      elemento.innerHTML = `
        <div>
          <h3>${m.asunto}</h3>
          <p>${m.nombre_completo} — ${m.correo}</p>
          <p>${m.mensaje}</p>
          <p>${new Date(m.fecha_envio).toLocaleString()}</p>
        </div>
        <div class="acciones" style="flex-shrink: 0;">
          <button class="btn-eliminar" style="padding: 8px 16px;" onclick="eliminarContacto(${m.id})">Eliminar</button>
        </div>
      `;

      listaHistorial.appendChild(elemento);
    });
  } catch (error) {
    console.error("Error al cargar el historial:", error);
  }
}

async function eliminarContacto(id) {
  const confirmar = confirm("¿Deseas eliminar este mensaje del historial?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/contactos/${id}`, {
      method: "DELETE",
    });

    cargarHistorial();
  } catch (error) {
    console.error("Error al eliminar el mensaje:", error);
  }
}

if (formContacto) {
  formContacto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre_completo = document.getElementById("nombreCompleto").value;
    const correo = document.getElementById("correo").value;
    const asunto = document.getElementById("asunto").value;
    const mensaje = document.getElementById("mensaje").value;

    try {
      const respuesta = await fetch(`${API_URL}/contactos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_completo, correo, asunto, mensaje }),
      });

      if (respuesta.ok) {
        alert("¡Mensaje de contacto enviado con éxito!");
        formContacto.reset();
        cargarHistorial();
      } else {
        alert("Error al enviar el mensaje");
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
    }
  });
}

cargarProductos();
cargarHistorial();

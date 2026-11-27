const API_URL =
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:"
    ? "http://localhost:3000"
    : "https://proyecto-bd-jnb6.onrender.com";

// Elementos del DOM - Productos
const listaProductos = document.getElementById("listaProductos");
const formulario = document.getElementById("formularioProducto");
const productoId = document.getElementById("productoId");
const imagenUrlActualInput = document.getElementById("imagenUrlActual");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const imagenArchivoInput = document.getElementById("imagenArchivo");
const contenedorVistaPrevia = document.getElementById("contenedorVistaPrevia");
const vistaPrevia = document.getElementById("vistaPrevia");
const textoVistaPrevia = document.getElementById("textoVistaPrevia");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");

// Elementos del DOM - Mensajes (Actualizados según tu HTML)
const formContacto = document.getElementById("formularioContacto");
const listaMensajes = document.getElementById("listaMensajes"); 


let productosMemoria = [];

// Imagen SVG por defecto cuando un producto no tiene aun imagen subida a cloudinary
const IMAGEN_POR_DEFECTO =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#150e24"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="400" height="280" fill="url(#bg)"/>
      <rect x="135" y="70" width="130" height="90" rx="10" fill="none" stroke="#c084fc" stroke-width="4"/>
      <line x1="175" y1="180" x2="255" y2="180" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
      <line x1="200" y1="160" x2="200" y2="180" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
      <text x="200" y="220" font-family="Arial, sans-serif" font-size="15" fill="#ece6f7" text-anchor="middle">
        MiTienda Tech - Sin imagen
      </text>
    </svg>
  `);

//Convertir un archivo seleccionado en <input type="file" a una cadena Base64.
function convertirArchivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
    lector.readAsDataURL(archivo);
  });
}

// Mostrar vista previas inmediata cuando el usuario escoge una imagen de su pc
if (imagenArchivoInput && vistaPrevia && contenedorVistaPrevia) {
  imagenArchivoInput.addEventListener("change", async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona un archivo de imagen válido.");
      imagenArchivoInput.value = "";
      return;
    }

    try {
      const base64 = await convertirArchivoABase64(archivo);
      vistaPrevia.src = base64;
      textoVistaPrevia.textContent = archivo.name;
      contenedorVistaPrevia.hidden = false;
      contenedorVistaPrevia.style.display = "flex";
    } catch (error) {
      console.error("Error al mostrar la vista previa:", error);
      alert("No se pudo abrir la imagen seleccionada.");
    }
  });
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caracter]);
}

// 1. Función para consultar los productos y mostrarlos en el DOM (READ)
async function cargarProductos() {
  if (!listaProductos) return;

  try {
    const respuesta = await fetch(`${API_URL}/productos`);
    if (!respuesta.ok) throw new Error("No se pudieron consultar los productos.");
    const productos = await respuesta.json();
    productosMemoria = Array.isArray(productos) ? productos : [];

    listaProductos.innerHTML = "";

    if (productosMemoria.length === 0) {
      listaProductos.innerHTML = "<p style='color: #64748b;'>No hay productos registrados.</p>";
      return;
    }

    productosMemoria.forEach((producto) => {
      const elemento = document.createElement("div");
      elemento.classList.add("producto-card");

      elemento.innerHTML = `
        <div class="producto-imagen"><img alt="Imagen de ${escaparHTML(producto.nombre)}"></div>
        <div class="producto-info">
          <h3>${escaparHTML(producto.nombre)}</h3>
          <p class="producto-precio">Precio: $${producto.precio}</p>
          <p class="producto-stock">Stock: ${producto.stock} unidades</p>
        </div>
        <div class="acciones">
          <button class="btn-editar" type="button">Editar</button>
          <button class="btn-eliminar" type="button">Eliminar</button>
        </div>
      `;

      const imagenProducto = elemento.querySelector(".producto-imagen img");
      imagenProducto.src = producto.imagen_url || IMAGEN_POR_DEFECTO;
      imagenProducto.onerror = () => {
        imagenProducto.onerror = null;
        imagenProducto.src = IMAGEN_POR_DEFECTO;
      };
      elemento.querySelector(".btn-editar").addEventListener("click", () =>
        cargarEnFormulario(producto.id, producto.nombre, producto.precio, producto.stock, producto.imagen_url)
      );
      elemento.querySelector(".btn-eliminar").addEventListener("click", () => eliminarProducto(producto.id));

      listaProductos.appendChild(elemento);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

// 2. Cargar datos del producto en el formulario para editar (UPDATE - Paso 1)
function cargarEnFormulario(id, nombre, precio, stock, imagenUrl = "") {
  if (!formulario) {
    sessionStorage.setItem("productoParaEditar", JSON.stringify({ id, nombre, precio, stock, imagenUrl }));
    window.location.href = "formulario.html?editar=1";
    return;
  }

  productoId.value = id;
  nombreInput.value = nombre;
  precioInput.value = precio;
  stockInput.value = stock;
  imagenUrlActualInput.value = imagenUrl || "";
  imagenArchivoInput.value = "";
  vistaPrevia.src = imagenUrl || IMAGEN_POR_DEFECTO;
  textoVistaPrevia.textContent = imagenUrl ? "Imagen actual del producto" : "Producto sin imagen";
  contenedorVistaPrevia.hidden = false;
  contenedorVistaPrevia.style.display = "flex";

  tituloFormulario.textContent = "Editar Producto";
  btnGuardar.textContent = "Actualizar Producto";
  btnCancelar.style.display = "block";
  nombreInput.focus();
}

// Cancelar edición y restaurar formulario
function cancelarEdicion() {
  formulario.reset();
  productoId.value = "";
  if (imagenUrlActualInput) imagenUrlActualInput.value = "";
  if (imagenArchivoInput) imagenArchivoInput.value = "";
  if (vistaPrevia) vistaPrevia.removeAttribute("src");
  if (textoVistaPrevia) textoVistaPrevia.textContent = "";
  if (contenedorVistaPrevia) {
    contenedorVistaPrevia.hidden = true;
    contenedorVistaPrevia.style.display = "none";
  }
  tituloFormulario.textContent = "Registrar Producto";
  btnGuardar.textContent = "Guardar Producto";
  btnCancelar.style.display = "none";
}

if (btnCancelar) {
  btnCancelar.addEventListener("click", cancelarEdicion);
}

// 3. Guardar o Actualizar según si hay un ID seleccionado (CREATE o UPDATE)
if (formulario) {
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evitar que la página se recargue

    const id = productoId.value;
    const nombre = nombreInput.value.trim();
    const precio = precioInput.value;
    const stock = stockInput.value;
    const imagen_url = imagenUrlActualInput ? imagenUrlActualInput.value || null : null;
    const archivoSeleccionado = imagenArchivoInput?.files[0];
    const textoOriginalBoton = btnGuardar.textContent;
    const url = id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`;
    const metodo = id ? "PUT" : "POST";

    try {
      btnGuardar.disabled = true;
      btnGuardar.textContent = archivoSeleccionado
        ? "Subiendo imagen a Cloudinary..."
        : "Guardando producto...";

      let imagenBase64 = null;
      if (archivoSeleccionado) {
        if (!archivoSeleccionado.type.startsWith("image/")) {
          throw new Error("Selecciona un archivo de imagen válido.");
        }
        if (archivoSeleccionado.size > 10 * 1024 * 1024) {
          throw new Error("La imagen no puede superar los 10 MB.");
        }
        imagenBase64 = await convertirArchivoABase64(archivoSeleccionado);
      }

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          precio,
          stock,
          imagen_url,
          imagenBase64,
        }),
      });

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => ({}));
        throw new Error(resultado.mensaje || "No se pudo guardar el producto.");
      }

      cancelarEdicion(); // Limpiar formulario y restaurar botones
      if (listaProductos) {
        cargarProductos(); // Refrescar la lista en pantalla
      } else {
        window.location.href = "productos.html";
      }
    } catch (error) {
      console.error("Error al guardar el producto:", error);
      alert(error.message || "No se pudo guardar el producto.");
      btnGuardar.textContent = textoOriginalBoton;
    } finally {
      btnGuardar.disabled = false;
    }
  });
}

if (formulario && new URLSearchParams(window.location.search).has("editar")) {
  const productoGuardado = sessionStorage.getItem("productoParaEditar");
  if (productoGuardado) {
    try {
      const producto = JSON.parse(productoGuardado);
      sessionStorage.removeItem("productoParaEditar");
      cargarEnFormulario(producto.id, producto.nombre, producto.precio, producto.stock, producto.imagenUrl);
    } catch (error) {
      console.error("No se pudieron recuperar los datos del producto:", error);
      sessionStorage.removeItem("productoParaEditar");
    }
  }
}

// 4. Eliminar un producto (DELETE)
async function eliminarProducto(id) {
  const confirmar = confirm("¿Deseas eliminar este producto de la base de datos?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
    });

    // Si estábamos editando ese mismo producto, cancelamos la edición
    if (productoId && productoId.value == id) {
      cancelarEdicion();
    }

    cargarProductos(); // Refrescar la lista en pantalla
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
}



// Llamados iniciales coordinados al cargar la página web
cargarProductos();

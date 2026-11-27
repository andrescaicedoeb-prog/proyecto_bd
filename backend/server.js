require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conexion = require("./db"); // Importamos la conexión creada en db.js
const { subirImagenCloudinary} = require("./cloudinary");

const app = express();

// Middlewares globales
app.use(cors()); // Permitir peticiones desde el frontend

//Aplicamos  el limite a 10MB para el envio de imagenes en Base64 hacia Cloudinary
app.use(express.json({limit: "10mb"})); // Habilitar la lectura de datos en formato JSON en el cuerpo (req.body)

// Verificar al iniciar que la tabla "productos" en MySQL tenga la columna Imagen_url

conexion.query("SHOW COLUMNS FROM productos LIKE 'imagen_url'", 
  (err, resultados) => {
    if (!err && Array.isArray(resultados) && resultados.length === 0) {
      conexion.query(
        "ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(500) DEFAULT NULL",
        (errAlter) => {
          if (!errAlter) {
            console.log("Columna 'imagen_url' verificada/agregada en la tabla 'productos'");
          }
        }
      );
    }
  });



// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// 1. Obtener todos los productos (READ)
app.get("/productos", (req, res) => {
  const sql = "SELECT * FROM productos";

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al consultar:", error);
      return res.status(500).json({ mensaje: "Error al consultar los productos" });
    }
    // Retornamos el array de productos como JSON al cliente
    res.json(resultados);
  });
});

// 2. Crear un nuevo producto (CREATE)
app.post("/productos", async (req, res) => {
  try { 
  const { nombre, precio, stock, imagenBase64, imagen_url } = req.body;
  let urlImagenFinal = imagen_url || null;

  // Si el usuario seleccion un archivo de imagen, la subimos a cloudinary
  if (imagenBase64) {
    urlImagenFinal = await subirImagenCloudinary(imagenBase64);
  };

  // Consulta parametrizada con '?' para prevenir inyección SQL
  const sql = "INSERT INTO productos (nombre, precio, stock, imagen_url) VALUES (?, ?, ?, ?)";
  const valores = [nombre, precio, stock, urlImagenFinal];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al insertar:", error);
      return res.status(500).json({ mensaje: "Error al crear el producto" });
    }

    res.status(201).json({
      mensaje: "Producto creado correctamente",
      id: resultado.insertId,
    });
  });

} catch (error) {
  console.error("Error al subir imagen o crear producto", error.message);
  res.status(500).json({
    mensaje: error.message || "Error al subir la imagen a Cloudinary",
  });
}
});

// 3. Actualizar un producto existente (UPDATE)
app.put("/productos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, precio, stock, imagenBase64, imagen_url } = req.body;
    let urlImagenFInal = imagen_url || null;

    // Si el usuario escogio una nueva imagen al editar la subimos a Cloudinary  y reemplazamos el enlace 

    if (imagenBase64) {
      urlImagenFInal = await subirImagenCloudinary(imagenBase64)
    }

   const sql = "UPDATE productos SET nombre = ?, precio = ?, stock = ?, imagen_url = COALESCE(?, imagen_url) WHERE id = ?";
   const valores = [nombre, precio, stock, urlImagenFInal, id];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al actualizar:", error);
      return res.status(500).json({ mensaje: "Error al actualizar el producto" });
    }
    res.json({ 
      mensaje: "Producto actualizado correctamente",
      imagen_url: urlImagenFInal,
     });
  });
} catch (error) {
  console.error("Error al actualizar producto o imagen", error.message),
  res.status(500).json({
    mensaje: error.message || "Error al actualizar el backend en Cloudinary"
  });
}
});

// 4. Eliminar un producto (DELETE)
app.delete("/productos/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM productos WHERE id = ?";

  conexion.query(sql, [id], (error, resultado) => {
    if (error) {
      console.error("Error al eliminar:", error);
      return res.status(500).json({ mensaje: "Error al eliminar el producto" });
    }
    res.json({ mensaje: "Producto eliminado correctamente" });
  });
});

// Obtener el mensaje de contacto
app.get("/contactos", (req, res) => {
  const sql = "SELECT * FROM contactos ORDER BY fecha_envio DESC";

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al consultar:", error);
      return res.status(500).json({ mensaje: "Error al consultar los mensajes" });
    }
    res.json(resultados);
  });
});

// guardar mensaje de contacto
app.post("/contactos", (req, res) => {
  const { nombre_completo, correo, asunto, mensaje } = req.body;

  const sql = "INSERT INTO contactos (nombre_completo, correo, asunto, mensaje) VALUES (?, ?, ?, ?)";
  const valores = [nombre_completo, correo, asunto, mensaje];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al insertar:", error);
      return res.status(500).json({ mensaje: "Error al enviar el mensaje" });
    }

    res.status(201).json({
      mensaje: "Mensaje enviado correctamente",
      id: resultado.insertId,
    });
  });
});

// eliminar un mensaje de contacto (DELETE)
app.delete("/contactos/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM contactos WHERE id = ?";

  conexion.query(sql, [id], (error, resultado) => {
    if (error) {
      console.error("Error al eliminar:", error);
      return res.status(500).json({ mensaje: "Error al eliminar el mensaje" });
    }
    res.json({ mensaje: "Mensaje eliminado correctamente" });
  });
});

// Iniciar servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});




require("dotenv").config();
const mysql = require("mysql2");

// Configuración de la conexión de la BD
const host = process.env.DB_HOST || "localhost";
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "";
const database = process.env.DB_NAME || "tienda";

// Opciones de configuración
const configuracion = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000,
};

// Si el host es remoto (TiDB Cloud), habilitar SSL automáticamente
if (host !== "localhost" && host !== "127.0.0.1") {
    configuracion.ssl = {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
    };
}

// Crear el pool de conexiones (MySQL o TiDB Cloud)
const conexion = mysql.createPool(configuracion);

// Comprobar que la conexión funciona al arrancar
conexion.getConnection((error, conn) => {
    if (error) {
        console.error("Error al conectar con la base de datos:", error.code, error.message);
        return;
    }
    console.log(`Conexion exitosa con la base de datos (${host}:${port})`);
    conn.release(); // devolver la conexión al pool
});

// Evitar que un error en una conexión inactiva tumbe el servidor
conexion.on("error", (err) => {
    console.error("Error en el pool de la base de datos:", err.code, err.message);
});

// Exportar el pool; se usa igual que antes: conexion.query(...)
module.exports = conexion;
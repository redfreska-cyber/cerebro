import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs"; // para hash de contraseñas

const app = express();

// ✅ Configuración de middlewares
app.use(cors({
  origin: "*", // puedes restringir a tu dominio Lovable más adelante
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(bodyParser.json());

// ✅ Conexión Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ usa tu SERVICE_ROLE_KEY en Vercel
);

// ✅ Ruta raíz para comprobar que el servidor funciona
app.get("/", (req, res) => {
  res.send("🚀 Servidor Express + Supabase funcionando correctamente");
});

// ✅ Registrar restaurante
app.post("/api/registrarRestaurante", async (req, res) => {
  try {
    const { nombre, ruc, correo, telefono, direccion, contrasena } = req.body;

    // Hash de contraseña antes de guardar
    const contrasena_hash = await bcrypt.hash(contrasena, 10);

    // Inserta en la tabla restaurantes
    const { data, error } = await supabase
      .from("restaurantes")
      .insert([
        {
          nombre,
          ruc,
          correo,
          telefono,
          direccion,
          contrasena_hash,
          plan_actual: "free",
          estado_suscripcion: "activa",
          fecha_inicio: new Date(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // No devolvemos el hash por seguridad
    const { contrasena_hash: _, ...restauranteSeguro } = data;

    res.status(200).json({
      mensaje: "✅ Restaurante registrado correctamente",
      restaurante: restauranteSeguro,
    });
  } catch (error) {
    console.error("Error al registrar restaurante:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default app;

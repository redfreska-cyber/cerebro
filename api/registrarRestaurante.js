import { createClient } from "@supabase/supabase-js";

// ✅ Necesario para que Vercel acepte JSON en el body
export const config = {
  api: {
    bodyParser: true,
  },
};

// ✅ Conexión a Supabase usando tus variables de entorno de Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Endpoint para registrar un restaurante
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombre, correo, telefono, direccion, contrasena, ruc } = req.body;

    // Validar campos obligatorios
    if (!nombre || !correo) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Insertar restaurante en la tabla
    const { data, error } = await supabase
      .from("restaurantes")
      .insert([{ nombre, correo, telefono, direccion, contrasena, ruc }])
      .select();

    if (error) throw error;

    res.status(200).json({
      mensaje: "✅ Restaurante registrado correctamente",
      data,
    });
  } catch (error) {
    console.error("❌ Error interno:", error.message);
    res.status(500).json({ error: error.message });
  }
}


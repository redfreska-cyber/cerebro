import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: true,
  },
};

// Conexión con tus variables de entorno (Vercel)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombre, ruc, correo, telefono, direccion, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // ⚙️ Inserción de datos en la tabla restaurantes
    const { data, error } = await supabase
      .from("restaurantes")
      .insert([
        {
          nombre,
          ruc,
          correo,
          correo_contacto: correo,
          telefono,
          direccion,
          contrasena_hash: contrasena, // <--- campo correcto
          plan_actual: "free",
          estado_suscripcion: "activa",
          fecha_inicio: new Date().toISOString(),
        },
      ])
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
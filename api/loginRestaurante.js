import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

export const config = {
  api: {
    bodyParser: true,
  },
};

// 🔗 Conexión segura a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    // 📦 Buscar restaurante por correo
    const { data, error } = await supabase
      .from("restaurantes")
      .select("id, nombre, correo, contrasena_hash")
      .eq("correo", correo)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    // 🔐 Comparar la contraseña con el hash almacenado
    const coincide = await bcrypt.compare(contrasena, data.contrasena_hash);

    if (!coincide) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // ✅ Login exitoso
    res.status(200).json({
      mensaje: "✅ Inicio de sesión correcto",
      restaurante: {
        id: data.id,
        nombre: data.nombre,
        correo: data.correo,
      },
    });
  } catch (error) {
    console.error("❌ Error interno:", error.message);
    res.status(500).json({ error: error.message });
  }
}

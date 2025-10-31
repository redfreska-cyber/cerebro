import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombre, correo, telefono, direccion, contrasena } = req.body;

    const { data, error } = await supabase
      .from("restaurantes")
      .insert([{ nombre, correo, telefono, direccion, contrasena }])
      .select();

    if (error) throw error;

    res.status(200).json({ mensaje: "Restaurante registrado con éxito", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

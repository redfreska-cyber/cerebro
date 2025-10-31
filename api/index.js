import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Ruta para registrar restaurante
app.post("/api/registrarRestaurante", async (req, res) => {
  try {
    const { nombre, correo, telefono, direccion, contrasena } = req.body;

    const { data, error } = await supabase
      .from("restaurantes")
      .insert([{ nombre, correo, telefono, direccion, contrasena }])
      .select();

    if (error) throw error;
    res.status(200).json({ mensaje: "Restaurante registrado", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

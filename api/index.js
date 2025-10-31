import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();

// ✅ CORS permitido para Lovable y localhost
app.use(cors({
  origin: [
    "http://localhost:8080",
    "https://redfreska-biz-boost.lovable.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(bodyParser.json());

// 🔗 Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🚀 Test route
app.get("/", (req, res) => {
  res.send("Servidor Express corriendo correctamente con CORS configurado");
});

// 🔥 Endpoint de registro
app.post("/api/registrarRestaurante", async (req, res) => {
  try {
    const { nombre, correo, telefono, direccion, contrasena } = req.body;
    const { data, error } = await supabase
      .from("restaurantes")
      .insert([{ nombre, correo, telefono, direccion, contrasena }])
      .select();

    if (error) throw error;
    res.status(201).json({ mensaje: "✅ Restaurante registrado correctamente", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar para Vercel
export default app;

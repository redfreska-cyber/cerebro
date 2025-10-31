require('dotenv').config(); // <--- Esto carga tu .env automáticamente

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.json());

// 🔗 Conectar a Supabase de forma segura
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🚀 Ruta de prueba
app.get('/', (req, res) => {
  res.send('🚀 Servidor Express + Supabase funcionando correctamente');
});

// 🏪 Registrar restaurante
app.post('/registrarRestaurante', async (req, res) => {
  const { nombre, correo, telefono, direccion, contrasena } = req.body;

  // Cifrar la contraseña antes de guardarla
  const contrasena_hash = await bcrypt.hash(contrasena, 10);

  const { data, error } = await supabase
    .from('restaurantes')
    .insert([{ nombre, correo, contrasena_hash, correo_contacto: correo, telefono, direccion }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    message: 'Restaurante registrado con éxito',
    restaurante_id: data?.[0]?.id,
  });
});

// 👨‍💼 Registrar usuario
app.post('/registrarUsuario', async (req, res) => {
  const { restauranteId, nombre, correo, telefono } = req.body;

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ restaurante_id: restauranteId, nombre, correo, telefono }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    message: 'Usuario registrado con éxito',
    usuario_id: data?.[0]?.id,
  });
});

// 👥 Registrar cliente
app.post('/registrarCliente', async (req, res) => {
  const { restauranteId, nombre, telefono, correo } = req.body;
  const codigo = Math.random().toString(36).substring(7); // Generar un código de referido aleatorio

  const { data, error } = await supabase
    .from('clientes')
    .insert([{ restaurante_id: restauranteId, nombre, telefono, correo, codigo_referido: codigo }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    message: 'Cliente registrado con éxito',
    cliente_id: data?.[0]?.id,
    codigo_referido: codigo,
  });
});

// 🔁 Registrar referido
app.post('/registrarReferido', async (req, res) => {
  const { restauranteId, clienteId, codigoReferido } = req.body;

  const { data, error } = await supabase
    .from('referidos')
    .insert([{ restaurante_id: restauranteId, cliente_owner_id: clienteId, codigo_referido: codigoReferido }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    message: 'Referido registrado con éxito',
    referido_id: data?.[0]?.id,
  });
});

// 💰 Registrar conversión
app.post('/registrarConversion', async (req, res) => {
  const { restauranteId, referidoId, clienteId, fechaConversion, estado } = req.body;

  const estadosValidos = ['pendiente', 'confirmado', 'rechazado'];
  if (!estadosValidos.includes(estado.toLowerCase())) {
    return res.status(400).json({ error: "Estado no permitido. Usa 'pendiente', 'confirmado' o 'rechazado'." });
  }

  const { data, error } = await supabase
    .from('conversiones')
    .insert([{ restaurante_id: restauranteId, referido_id: referidoId, cliente_id: clienteId, fecha_conversion: fechaConversion, estado }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    message: 'Conversión registrada con éxito',
    conversion: data,
  });
});

// 🎁 Registrar premio
app.post('/registrarPremio', async (req, res) => {
  const { restauranteId, descripcion, umbral, tipoPremio, detallePremio } = req.body;

  const { data, error } = await supabase
    .from('premios')
    .insert([{ restaurante_id: restauranteId, descripcion, umbral, tipo_premio: tipoPremio, detalle_premio: detallePremio }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    message: 'Premio registrado con éxito',
    premio_id: data?.[0]?.id,
  });
});

// ✅ Validar cliente
app.post('/validarCliente', async (req, res) => {
  const { clienteId, validado, motivo } = req.body;

  const { data, error } = await supabase
    .from('validaciones')
    .upsert([{ cliente_id: clienteId, validado, motivo }])
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({
    message: 'Cliente validado con éxito',
    validacion: data,
  });
});

// 📊 Resumen de cliente
app.get('/clientes/:id/resumen', async (req, res) => {
  const clienteId = req.params.id;

  const { count: totalReferidos, error: errRef } = await supabase
    .from('referidos')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_owner_id', clienteId);

  if (errRef) return res.status(400).json({ error: errRef.message });

  const { data: refsDelCliente, error: errRefsData } = await supabase
    .from('referidos')
    .select('id')
    .eq('cliente_owner_id', clienteId);

  if (errRefsData) return res.status(400).json({ error: errRefsData.message });

  const ids = (refsDelCliente || []).map(r => r.id);
  let totalConversiones = 0;
  if (ids.length > 0) {
    const { count: convCount, error: errConv } = await supabase
      .from('conversiones')
      .select('*', { count: 'exact', head: true })
      .in('referido_id', ids);

    if (errConv) return res.status(400).json({ error: errConv.message });
    totalConversiones = convCount || 0;
  }

  res.json({
    cliente_id: clienteId,
    total_referidos: totalReferidos || 0,
    total_conversiones: totalConversiones,
  });
});

// 🧩 Usar código de referido (flujo automático)
app.post('/usarCodigo', async (req, res) => {
  const { codigo_referido, registrar_consumo = true } = req.body;

  const { data: clientes, error: errCli } = await supabase
    .from('clientes')
    .select('id, restaurante_id')
    .eq('codigo_referido', codigo_referido)
    .limit(1);

  if (errCli) return res.status(400).json({ error: errCli.message });
  if (!clientes || clientes.length === 0) {
    return res.status(404).json({ error: 'Código no válido' });
  }

  const clienteId = clientes[0].id;
  const restauranteId = clientes[0].restaurante_id;

  const { data: refData, error: errRef } = await supabase
    .from('referidos')
    .insert([{ cliente_id: clienteId, codigo_referido, restaurante_id: restauranteId }])
    .select('id')
    .single();

  if (errRef) return res.status(400).json({ error: errRef.message });

  let conv = null;
  if (registrar_consumo) {
    const { data: convData, error: errConv } = await supabase
      .from('conversiones')
      .insert([
        {
          restaurante_id: restauranteId,
          referido_id: refData.id,
          cliente_id: clienteId,
          fecha_conversion: new Date().toISOString().slice(0, 10),
          estado: 'confirmado',
        },
      ])
      .select('*')
      .single();

    if (errConv) return res.status(400).json({ error: errConv.message });
    conv = convData;
  }

  res.status(201).json({
    message: 'Código usado correctamente',
    cliente_id: clienteId,
    referido_id: refData.id,
    conversion: conv,
  });
});

// 🟢 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});


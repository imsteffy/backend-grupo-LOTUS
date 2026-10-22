// ============================================================
//  app.js — Punto de entrada del servidor (entry point)
//  Proyecto: Kiroku API REST
// ============================================================

import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';
import { conectarDB } from './config/db.js';
import animesRoutes from './routes/animes.routes.js';

// Inicialización de la aplicación Express
const app = express();

// --- Middlewares globales ---
app.use(cors());
app.use(express.json());

// --- Conexión a la base de datos ---
conectarDB();

// --- Ruta Raíz de Bienvenida y Verificación de Estado ---
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Kiroku activa y funcionando',
    estado: 'online',
    version: '1.0.0'
  });
});

// --- Montaje de Enrutadores ---
// app.use('/api/auth', authRoutes);
// app.use('/api/usuarios', usuariosRoutes);
app.use('/api/animes', animesRoutes);
// app.use('/api/seguimientos', seguimientosRoutes);
// app.use('/api/resenas', resenasRoutes);
// app.use('/api/stats', statsRoutes);

// --- Encendido del Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor Kiroku escuchando en http://localhost:${PORT}`);
});

export default app;

// ============================================================
//  app.js — Punto de entrada del servidor (entry point)
//  Proyecto: Kiroku API REST
// ============================================================

import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';
import { conectarDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import { logger } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import animesRoutes from './routes/animes.routes.js';

// Inicialización de la aplicación Express
const app = express();

// --- Middlewares globales ---
app.use(cors());
app.use(express.json());
app.use(logger);

// --- Ruta Raíz de Bienvenida y Verificación de Estado ---
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Kiroku activa y funcionando',
    estado: 'online',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/animes', animesRoutes);
app.use('/api/seguimientos', seguimientosRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/stats', statsRoutes);

// Debe registrarse después de todas las rutas para recibir sus errores.
app.use(errorHandler);

// El entry point usado por los scripts existentes espera primero a MongoDB.
const iniciarServidor = async () => {
  try {
    await conectarDB();
    app.listen(PORT, () => console.info(`API Kiroku escuchando en http://localhost:${PORT}`));
  } catch (error) {
    console.error(`No se pudo conectar a MongoDB (${error.name}); el servidor no se iniciará.`);
    process.exitCode = 1;
  }
};

if (process.env.NODE_ENV !== 'test') iniciarServidor();

export default app;

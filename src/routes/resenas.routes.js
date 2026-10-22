// ============================================================
//  resenas.routes.js — Router de Reseñas
// ============================================================
// Las rutas solo montan los handlers de la capa controladora.
// No contienen lógica de negocio ni llamadas a la base de datos.
// ============================================================

import express from 'express';
import {
  obtenerResenasPorAnime,
  crearResena,
  actualizarResena,
  eliminarResena,
} from '../controllers/resena.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/resenas/anime/:animeId -> reseñas de un anime (público)
router.get('/anime/:animeId', obtenerResenasPorAnime);

// POST /api/resenas -> publicar una reseña
router.post('/', authToken, crearResena);

// PUT /api/resenas/:id -> editar mi reseña (o ADMIN)
router.put('/:id', authToken, actualizarResena);

// DELETE /api/resenas/:id -> borrar mi reseña (o ADMIN)
router.delete('/:id', authToken, eliminarResena);

export default router;

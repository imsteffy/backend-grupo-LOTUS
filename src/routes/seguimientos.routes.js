// ============================================================
//  seguimientos.routes.js — Router de Seguimientos
// ============================================================
// Las rutas solo montan los handlers de la capa controladora.
// No contienen lógica de negocio ni llamadas a la base de datos.
// Todas requieren estar logueado (authToken).
// ============================================================

import express from 'express';
import {
  obtenerSeguimientos,
  crearSeguimiento,
  actualizarSeguimiento,
  incrementarEpisodio,
  eliminarSeguimiento,
} from '../controllers/seguimiento.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/seguimientos -> mi biblioteca (?estado=Viendo)
router.get('/', authToken, obtenerSeguimientos);

// POST /api/seguimientos -> agregar un anime a mi biblioteca
router.post('/', authToken, crearSeguimiento);

// PUT /api/seguimientos/:id -> modificar estado o episodio
router.put('/:id', authToken, actualizarSeguimiento);

// PATCH /api/seguimientos/:id/incrementar -> sumar +1 episodio
router.patch('/:id/incrementar', authToken, incrementarEpisodio);

// DELETE /api/seguimientos/:id -> quitar de mi biblioteca
router.delete('/:id', authToken, eliminarSeguimiento);

export default router;

// ============================================================
//  generos.routes.js — Catálogo de géneros
// ============================================================

import { Router } from 'express';
import {
  obtenerGeneros,
  crearGenero,
  actualizarGenero,
  eliminarGenero
} from '../controllers/genero.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// Público: sirve para armar el selector de filtros
router.get('/', obtenerGeneros);

// Solo ADMIN
router.post('/', authToken, authorize('ADMIN'), crearGenero);
router.put('/:id', authToken, authorize('ADMIN'), actualizarGenero);
router.delete('/:id', authToken, authorize('ADMIN'), eliminarGenero);

export default router;

// ============================================================
//  stats.routes.js — Routers de Estadísticas
// ============================================================
// Las rutas solo montan los handlers de la capa controladora.
// Este archivo exporta DOS routers porque los endpoints viven
// bajo prefijos distintos (ver app.js):
//   - default: /api/stats                    (rankings públicos)
//   - estadisticasPersonalesRouter:
//       /api/usuarios/me/estadisticas        (dashboard propio)
// ============================================================

import express from 'express';
import {
  obtenerRankings,
  obtenerEstadisticasPersonales,
} from '../controllers/stats.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/stats/rankings -> Top 10 mejor puntuados y más seguidos
router.get('/rankings', obtenerRankings);

export const estadisticasPersonalesRouter = express.Router();

// GET /api/usuarios/me/estadisticas -> mi dashboard personal
estadisticasPersonalesRouter.get('/', authToken, obtenerEstadisticasPersonales);

export default router;

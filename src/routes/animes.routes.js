// ============================================================
//  animes.routes.js — Enrutador para el Catálogo de Animes
//  Módulo: Catálogo Oficial (Integrante 2)
// ============================================================

import { Router } from 'express';
import {
  obtenerAnimes,
  obtenerAnimePorId,
  crearAnime,
  actualizarAnime,
  agregarGenerosAnime,
  eliminarAnime,
  importarAnimeExterno
} from '../controllers/anime.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// --- Rutas públicas (cualquier visitante) ---

// Listar animes con buscador y filtros (?buscar=&genero=&estado=&anio=&orden=&pagina=&limite=)
router.get('/', obtenerAnimes);

// Ficha técnica de un anime
router.get('/:id', obtenerAnimePorId);

// --- Rutas de gestión del catálogo (solo ADMIN) ---
// authToken valida el JWT (401 si falta o es inválido) y
// authorize('ADMIN') verifica el rol (403 si no alcanza).

// Importar desde la API externa (Jikan / AniList) y persistir localmente
router.post('/importar-externo', authToken, authorize('ADMIN'), importarAnimeExterno);

// Crear manualmente un anime
router.post('/', authToken, authorize('ADMIN'), crearAnime);

// Modificar un anime
router.put('/:id', authToken, authorize('ADMIN'), actualizarAnime);

// Agregar géneros sin reemplazar los existentes
router.patch('/:id/generos', authToken, authorize('ADMIN'), agregarGenerosAnime);

// Eliminar un anime
router.delete('/:id', authToken, authorize('ADMIN'), eliminarAnime);

export default router;
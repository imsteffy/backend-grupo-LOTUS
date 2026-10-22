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
  eliminarAnime,
  importarAnimeExterno
} from '../controllers/anime.controller.js';

const router = Router();

// --- Rutas Públicas (Cualquier visitante o usuario autenticado) ---

// 1. Listar animes con buscador y filtros (?buscar=&genero=&estado=&anio=&orden=&pagina=&limite=)
router.get('/', obtenerAnimes);

// 2. Ver ficha técnica completa de un anime por su ID
router.get('/:id', obtenerAnimePorId);

// --- Rutas de Gestión de Catálogo (Exclusivas para Administrador) ---
// NOTA: Cuando el Integrante 1 termine los middlewares auth y authorize,
// agregaremos `auth, authorize(['ADMIN'])` como segundo parámetro en estas rutas.

// 3. Crear manualmente un anime en el catálogo
router.post('/', crearAnime);

// 4. Modificar los datos de un anime existente
router.put('/:id', actualizarAnime);

// 5. Eliminar un anime del catálogo
router.delete('/:id', eliminarAnime);

// 6. Asistente Backend: Importar anime desde Jikan API / MyAnimeList y persistir localmente
router.post('/importar-externo', importarAnimeExterno);

export default router;

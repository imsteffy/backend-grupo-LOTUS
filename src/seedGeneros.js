// ============================================================
//  seedGeneros.js — Carga inicial del catálogo de géneros
// ============================================================
// Uso:  npm run seed:generos
// Inserta los géneros base y los que ya usan los animes existentes.
// Se puede ejecutar varias veces: no duplica nada.
// ============================================================

import mongoose from 'mongoose';
import { conectarDB } from './config/db.js';
import { Anime } from './models/Anime.js';
import { GENEROS_ES } from './controllers/anime.controller.js';
import { asegurarGeneros } from './controllers/genero.controller.js';

try {
  await conectarDB();
  const usados = await Anime.distinct('generos');
  const nombres = [...new Set([...Object.values(GENEROS_ES), ...usados])];
  await asegurarGeneros(nombres);
  console.log(`Catálogo de géneros listo (${nombres.length} géneros)`);
} catch (error) {
  console.error(`No se pudo cargar el catálogo: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

// ============================================================
//  stats.controller.js — Estadísticas y rankings (agregaciones)
// ============================================================
// Usa pipelines de agregación de MongoDB (aggregate): una lista
// de etapas donde cada una transforma el resultado de la anterior.
// ============================================================

import mongoose from 'mongoose';
import { Seguimiento } from '../models/Seguimiento.js';

const Anime = () => mongoose.model('Anime');

// El catálogo no guarda la duración de cada episodio, así que
// se usa un promedio fijo (en minutos) para calcular las horas.
const MINUTOS_POR_EPISODIO = 24;

// ============================================================
//  obtenerEstadisticasPersonales — GET /api/usuarios/me/estadisticas
// ============================================================
// Dashboard del usuario logueado: horas vistas, cantidad de
// animes por estado y sus géneros más vistos.
export const obtenerEstadisticasPersonales = async (req, res) => {
  try {
    // Los ids del token son strings: hay que convertirlos a ObjectId
    // porque aggregate NO hace esa conversión automática como find().
    const usuarioId = new mongoose.Types.ObjectId(req.user.id);

    // 1) Episodios vistos en total -> horas
    //    $match filtra mis seguimientos y $group suma los episodios.
    const [episodios] = await Seguimiento.aggregate([
      { $match: { usuario_id: usuarioId } },
      { $group: { _id: null, total: { $sum: '$episodioActual' } } },
    ]);
    const episodiosVistos = episodios ? episodios.total : 0;
    const horasVistas =
      Math.round(((episodiosVistos * MINUTOS_POR_EPISODIO) / 60) * 10) / 10;

    // 2) Cantidad de animes por estado
    const porEstado = await Seguimiento.aggregate([
      { $match: { usuario_id: usuarioId } },
      { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
    ]);

    // 3) Géneros favoritos
    //    $lookup une cada seguimiento con su anime (como un JOIN),
    //    $unwind desarma los arrays (anime y géneros) en un documento
    //    por elemento y $sortByCount cuenta y ordena de mayor a menor.
    const generosFavoritos = await Seguimiento.aggregate([
      { $match: { usuario_id: usuarioId } },
      {
        $lookup: {
          from: 'animes',
          localField: 'anime_id',
          foreignField: '_id',
          as: 'anime',
        },
      },
      { $unwind: '$anime' },
      { $unwind: '$anime.generos' },
      { $sortByCount: '$anime.generos' },
      { $limit: 5 },
    ]);

    res.json({
      episodiosVistos,
      horasVistas,
      porEstado: porEstado.map((e) => ({ estado: e._id, cantidad: e.cantidad })),
      generosFavoritos: generosFavoritos.map((g) => ({
        genero: g._id,
        cantidad: g.count,
      })),
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// ============================================================
//  obtenerRankings — GET /api/stats/rankings
// ============================================================
// Público. Devuelve el Top 10 mejor puntuados y el Top 10 de los
// animes con más seguidores.
export const obtenerRankings = async (_req, res) => {
  try {
    // Mejor puntuados: solo animes con al menos una reseña.
    // Desempata por la cantidad de reseñas.
    const mejorPuntuados = await Anime().aggregate([
      { $match: { totalResenas: { $gt: 0 } } },
      { $sort: { calificacionPromedio: -1, totalResenas: -1 } },
      { $limit: 10 },
      {
        $project: {
          titulo: 1,
          imagenPortada: 1,
          calificacionPromedio: 1,
          totalResenas: 1,
        },
      },
    ]);

    // Más seguidos: se cuenta cuántos seguimientos tiene cada
    // anime, y luego se une con la colección animes para traer
    // los datos.
    const masSeguidos = await Seguimiento.aggregate([
      { $group: { _id: '$anime_id', seguidores: { $sum: 1 } } },
      { $sort: { seguidores: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'animes',
          localField: '_id',
          foreignField: '_id',
          as: 'anime',
        },
      },
      { $unwind: '$anime' },
      {
        $project: {
          _id: '$anime._id',
          titulo: '$anime.titulo',
          imagenPortada: '$anime.imagenPortada',
          seguidores: 1,
        },
      },
    ]);

    res.json({ mejorPuntuados, masSeguidos });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

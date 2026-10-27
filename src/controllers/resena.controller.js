// ============================================================
//  resena.controller.js — Controladores HTTP de Reseñas
// ============================================================
// Maneja las opiniones de la comunidad: ver las reseñas de un
// anime, publicar la propia, editarla y borrarla. Cada vez que
// una reseña se crea, edita o borra, se recalcula la
// calificación promedio y el total de reseñas del anime.
// ============================================================

import mongoose from 'mongoose';
import { Resena } from '../models/Resena.js';

// El modelo Anime lo escribe otro integrante. Lo pedimos por
// nombre al momento de usarlo, así este archivo no depende del
// orden en que se carguen los modelos.
const Anime = () => mongoose.model('Anime');

// ============================================================
//  recalcularAnime — actualiza calificacionPromedio y totalResenas
// ============================================================
// Función interna. Usa un pipeline de agregación: filtra las
// reseñas del anime ($match), las agrupa ($group) y calcula el
// promedio ($avg) y la cantidad ($sum). Luego guarda ambos
// valores en el anime con un solo $set.
const recalcularAnime = async (animeId) => {
  const [resumen] = await Resena.aggregate([
    { $match: { anime_id: new mongoose.Types.ObjectId(animeId) } },
    {
      $group: {
        _id: '$anime_id',
        promedio: { $avg: '$calificacion' },
        total: { $sum: 1 },
      },
    },
  ]);

  // Sin reseñas, el grupo no existe: se vuelve a 0
  const promedio = resumen ? Math.round(resumen.promedio * 10) / 10 : 0;
  const total = resumen ? resumen.total : 0;

  await Anime().findByIdAndUpdate(animeId, {
    $set: { calificacionPromedio: promedio, totalResenas: total },
  });
};

// ============================================================
//  esAutorOAdmin — permiso sobre una reseña (función interna)
// ============================================================
const esAutorOAdmin = (resena, user) =>
  resena.usuario_id.toString() === user.id || user.rol === 'ADMIN';

// ============================================================
//  obtenerResenasPorAnime — GET /api/resenas/anime/:animeId
// ============================================================
// Público. populate trae nombre y avatar del autor en lugar de
// mostrar solo su id. Las más nuevas primero.
export const obtenerResenasPorAnime = async (req, res) => {
  try {
    const resenas = await Resena.find({ anime_id: req.params.animeId })
      .populate('usuario_id', 'nombre avatar rol')
      .sort({ createdAt: -1 });

    res.json(resenas);
  } catch (error) {
    // Un id con formato inválido es un error del cliente, no del servidor
    const codigo = error.name === 'CastError' ? 400 : 500;
    res.status(codigo).json({ mensaje: error.message });
  }
};

// ============================================================
//  crearResena — POST /api/resenas
// ============================================================
export const crearResena = async (req, res) => {
  try {
    const { anime_id, calificacion, texto, spoiler } = req.body;

    if (!anime_id) {
      return res.status(400).json({ mensaje: 'El anime_id es obligatorio' });
    }

    const anime = await Anime().findById(anime_id);
    if (!anime) {
      return res.status(404).json({ mensaje: 'Anime no encontrado' });
    }

    const existente = await Resena.findOne({
      usuario_id: req.user.id,
      anime_id,
    });
    if (existente) {
      return res.status(400).json({ mensaje: 'Ya escribiste una reseña de este anime' });
    }

    // El usuario sale del token, nunca del body
    const nueva = new Resena({
      usuario_id: req.user.id,
      anime_id,
      calificacion,
      texto,
      spoiler,
    });

    const creada = await nueva.save();
    await recalcularAnime(anime_id);

    res.status(201).json(creada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ============================================================
//  actualizarResena — PUT /api/resenas/:id
// ============================================================
// Solo el autor o un ADMIN. Permite cambiar nota, texto y spoiler.
export const actualizarResena = async (req, res) => {
  try {
    const { calificacion, texto, spoiler } = req.body;

    const resena = await Resena.findById(req.params.id);
    if (!resena) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    }

    if (!esAutorOAdmin(resena, req.user)) {
      return res.status(403).json({ mensaje: 'No podés modificar esta reseña' });
    }

    // Actualización parcial: solo se cambia lo que llegó en el body
    if (calificacion !== undefined) resena.calificacion = calificacion;
    if (texto !== undefined) resena.texto = texto;
    if (spoiler !== undefined) resena.spoiler = spoiler;

    const actualizada = await resena.save();
    await recalcularAnime(resena.anime_id);

    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ============================================================
//  eliminarResena — DELETE /api/resenas/:id
// ============================================================
// El autor puede borrar la suya; un ADMIN puede borrar cualquiera
// (moderación).
export const eliminarResena = async (req, res) => {
  try {
    const resena = await Resena.findById(req.params.id);
    if (!resena) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    }

    if (!esAutorOAdmin(resena, req.user)) {
      return res.status(403).json({ mensaje: 'No podés eliminar esta reseña' });
    }

    await resena.deleteOne();
    await recalcularAnime(resena.anime_id);

    res.status(204).send();
  } catch (error) {
    const codigo = error.name === 'CastError' ? 400 : 500;
    res.status(codigo).json({ mensaje: error.message });
  }
};

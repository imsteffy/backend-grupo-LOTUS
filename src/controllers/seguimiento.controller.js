// ============================================================
//  seguimiento.controller.js — Controladores HTTP de Seguimientos
// ============================================================
// Maneja la biblioteca personal del usuario: agregar animes,
// cambiar su estado, avanzar episodios y quitarlos.
// Todas las rutas pasan antes por authToken, por lo que acá
// siempre existe req.user (con { id, rol } del token).
// ============================================================

import mongoose from 'mongoose';
import { Seguimiento } from '../models/Seguimiento.js';

// El modelo Anime lo escribe otro integrante. Lo pedimos por
// nombre al momento de usarlo, así este archivo no depende del
// orden en que se carguen los modelos.
const obtenerAnime = (id) => mongoose.model('Anime').findById(id);

// ============================================================
//  aplicarReglas — reglas de coherencia (función interna)
// ============================================================
// Recibe el seguimiento (con los cambios ya aplicados) y el
// anime. Devuelve un mensaje de error, o null si todo está bien.
//   1) No se puede pasar del total de episodios.
//   2) Si el episodio llega al total, pasa solo a "Completado".
//   3) Si el estado es "Completado" y fue enviado expresamente,
//      el episodio pasa a ser el total.
const aplicarReglas = (seguimiento, anime, estadoExplicitamenteEnviado = false) => {
  const total = anime.totalEpisodios;

  if (total > 0 && seguimiento.episodioActual > total) {
    return `El anime tiene ${total} episodios, no se puede pasar de ese número`;
  }

  if (total > 0) {
    if (seguimiento.episodioActual === total) {
      seguimiento.estado = 'Completado';
    } else if (seguimiento.estado === 'Completado' && estadoExplicitamenteEnviado) {
      seguimiento.episodioActual = total;
    }
  }

  return null;
};

// ============================================================
//  esAutorOAdmin — permiso sobre un seguimiento (función interna)
// ============================================================
const esAutorOAdmin = (seguimiento, user) =>
  seguimiento.usuario_id.toString() === user.id || user.rol === 'ADMIN';

// ============================================================
//  obtenerSeguimientos — GET /api/seguimientos
// ============================================================
// Devuelve la biblioteca del usuario logueado.
// Filtro opcional por estado: /api/seguimientos?estado=Viendo
export const obtenerSeguimientos = async (req, res, next) => {
  try {
    const filtro = { usuario_id: req.user.id };
    if (req.query.estado) filtro.estado = req.query.estado;

    // populate reemplaza el id del anime por el documento completo
    const seguimientos = await Seguimiento.find(filtro).populate('anime_id');
    res.json(seguimientos);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  crearSeguimiento — POST /api/seguimientos
// ============================================================
export const crearSeguimiento = async (req, res, next) => {
  try {
    const { anime_id, estado, episodioActual } = req.body;

    if (!anime_id) {
      return res.status(400).json({ mensaje: 'El anime_id es obligatorio' });
    }

    const anime = await obtenerAnime(anime_id);
    if (!anime) {
      return res.status(404).json({ mensaje: 'Anime no encontrado' });
    }

    const existente = await Seguimiento.findOne({
      usuario_id: req.user.id,
      anime_id,
    });
    if (existente) {
      return res.status(400).json({ mensaje: 'Ya tenés este anime en tu biblioteca' });
    }

    const nuevo = new Seguimiento({
      usuario_id: req.user.id,
      anime_id,
      estado,
      episodioActual,
    });

    // Se valida antes de aplicar las reglas para que un estado
    // inválido no sea reemplazado por "Completado" sin avisar.
    await nuevo.validate();

    const errorRegla = aplicarReglas(nuevo, anime, estado !== undefined);
    if (errorRegla) {
      return res.status(400).json({ mensaje: errorRegla });
    }

    const creado = await nuevo.save();
    res.status(201).json(creado);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  actualizarSeguimiento — PUT /api/seguimientos/:id
// ============================================================
// Solo el autor o un ADMIN. Permite cambiar estado y/o episodio.
export const actualizarSeguimiento = async (req, res, next) => {
  try {
    const { estado, episodioActual } = req.body;

    const seguimiento = await Seguimiento.findById(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    if (!esAutorOAdmin(seguimiento, req.user)) {
      return res.status(403).json({ mensaje: 'No podés modificar este seguimiento' });
    }

    const anime = await obtenerAnime(seguimiento.anime_id);
    if (!anime) {
      return res.status(404).json({ mensaje: 'Anime asociado no encontrado' });
    }

    const total = anime.totalEpisodios || 0;

    // Actualización parcial: solo se cambia lo que llegó en el body
    if (estado !== undefined) seguimiento.estado = estado;
    if (episodioActual !== undefined) {
      seguimiento.episodioActual = episodioActual;
      // Precedencia al retroceder (Hallazgo 03): si el usuario retrocede el episodio sin enviar
      // estado y estaba en "Completado", transiciona naturalmente a "Viendo".
      if (estado === undefined && seguimiento.estado === 'Completado' && total > 0 && episodioActual < total) {
        seguimiento.estado = 'Viendo';
      }
    }

    await seguimiento.validate();

    const errorRegla = aplicarReglas(seguimiento, anime, estado !== undefined);
    if (errorRegla) {
      return res.status(400).json({ mensaje: errorRegla });
    }

    const actualizado = await seguimiento.save();
    res.json(actualizado);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  incrementarEpisodio — PATCH /api/seguimientos/:id/incrementar
// ============================================================
// Acción rápida: suma +1 episodio atómicamente en MongoDB (Hallazgo 06).
// Si estaba "Pendiente" pasa a "Viendo", y si llega al total pasa a "Completado".
export const incrementarEpisodio = async (req, res, next) => {
  try {
    const seguimiento = await Seguimiento.findById(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    if (!esAutorOAdmin(seguimiento, req.user)) {
      return res.status(403).json({ mensaje: 'No podés modificar este seguimiento' });
    }

    const anime = await obtenerAnime(seguimiento.anime_id);
    if (!anime) {
      return res.status(404).json({ mensaje: 'Anime asociado no encontrado' });
    }

    const total = anime.totalEpisodios || 0;

    if (total > 0 && seguimiento.episodioActual >= total) {
      return res.status(400).json({ mensaje: 'Ya viste todos los episodios' });
    }

    // Actualización atómica condicional directamente en la base de datos (Hallazgo 06)
    // Evita condiciones de carrera entre peticiones concurrentes
    const filtro = {
      _id: req.params.id,
      ...(total > 0 ? { episodioActual: { $lt: total } } : {})
    };

    const actualizado = await Seguimiento.findOneAndUpdate(
      filtro,
      [
        {
          $set: {
            episodioActual: { $add: ['$episodioActual', 1] },
            estado: {
              $cond: {
                if: {
                  $and: [
                    { $gt: [total, 0] },
                    { $gte: [{ $add: ['$episodioActual', 1] }, total] }
                  ]
                },
                then: 'Completado',
                else: {
                  $cond: {
                    if: { $eq: ['$estado', 'Pendiente'] },
                    then: 'Viendo',
                    else: '$estado'
                  }
                }
              }
            }
          }
        }
      ],
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(400).json({ mensaje: 'Ya viste todos los episodios' });
    }

    res.json(actualizado);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  eliminarSeguimiento — DELETE /api/seguimientos/:id
// ============================================================
export const eliminarSeguimiento = async (req, res, next) => {
  try {
    const seguimiento = await Seguimiento.findById(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    if (!esAutorOAdmin(seguimiento, req.user)) {
      return res.status(403).json({ mensaje: 'No podés eliminar este seguimiento' });
    }

    await seguimiento.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

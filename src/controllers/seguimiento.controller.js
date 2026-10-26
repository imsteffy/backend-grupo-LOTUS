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
//   2) Si el estado es "Completado", el episodio pasa a ser el total.
//   3) Si el episodio llega al total, pasa solo a "Completado".
const aplicarReglas = (seguimiento, anime) => {
  const total = anime.totalEpisodios;

  if (total > 0 && seguimiento.episodioActual > total) {
    return `El anime tiene ${total} episodios, no se puede pasar de ese número`;
  }

  if (total > 0) {
    if (seguimiento.estado === 'Completado') {
      seguimiento.episodioActual = total;
    } else if (seguimiento.episodioActual === total) {
      seguimiento.estado = 'Completado';
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
export const obtenerSeguimientos = async (req, res) => {
  try {
    const filtro = { usuario_id: req.user.id };
    if (req.query.estado) filtro.estado = req.query.estado;

    // populate reemplaza el id del anime por el documento completo
    const seguimientos = await Seguimiento.find(filtro).populate('anime_id');
    res.json(seguimientos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// ============================================================
//  crearSeguimiento — POST /api/seguimientos
// ============================================================
export const crearSeguimiento = async (req, res) => {
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

    const errorRegla = aplicarReglas(nuevo, anime);
    if (errorRegla) {
      return res.status(400).json({ mensaje: errorRegla });
    }

    const creado = await nuevo.save();
    res.status(201).json(creado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ============================================================
//  actualizarSeguimiento — PUT /api/seguimientos/:id
// ============================================================
// Solo el autor o un ADMIN. Permite cambiar estado y/o episodio.
export const actualizarSeguimiento = async (req, res) => {
  try {
    const { estado, episodioActual } = req.body;

    const seguimiento = await Seguimiento.findById(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    if (!esAutorOAdmin(seguimiento, req.user)) {
      return res.status(403).json({ mensaje: 'No podés modificar este seguimiento' });
    }

    // Actualización parcial: solo se cambia lo que llegó en el body
    if (estado !== undefined) seguimiento.estado = estado;
    if (episodioActual !== undefined) seguimiento.episodioActual = episodioActual;

    await seguimiento.validate();

    const anime = await obtenerAnime(seguimiento.anime_id);
    const errorRegla = aplicarReglas(seguimiento, anime);
    if (errorRegla) {
      return res.status(400).json({ mensaje: errorRegla });
    }

    const actualizado = await seguimiento.save();
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ============================================================
//  incrementarEpisodio — PATCH /api/seguimientos/:id/incrementar
// ============================================================
// Acción rápida: suma +1 episodio. Si estaba "Pendiente" pasa a
// "Viendo", y si llega al último episodio pasa a "Completado".
export const incrementarEpisodio = async (req, res) => {
  try {
    const seguimiento = await Seguimiento.findById(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    if (!esAutorOAdmin(seguimiento, req.user)) {
      return res.status(403).json({ mensaje: 'No podés modificar este seguimiento' });
    }

    const anime = await obtenerAnime(seguimiento.anime_id);

    if (anime.totalEpisodios > 0 && seguimiento.episodioActual >= anime.totalEpisodios) {
      return res.status(400).json({ mensaje: 'Ya viste todos los episodios' });
    }

    seguimiento.episodioActual += 1;
    if (seguimiento.estado === 'Pendiente') seguimiento.estado = 'Viendo';

    aplicarReglas(seguimiento, anime);

    const actualizado = await seguimiento.save();
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ============================================================
//  eliminarSeguimiento — DELETE /api/seguimientos/:id
// ============================================================
export const eliminarSeguimiento = async (req, res) => {
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
    // Un id con formato inválido es un error del cliente, no del servidor
    const codigo = error.name === 'CastError' ? 400 : 500;
    res.status(codigo).json({ mensaje: error.message });
  }
};

// ============================================================
//  genero.controller.js — Catálogo de géneros
//  GET público; crear, renombrar y borrar solo ADMIN.
// ============================================================

import mongoose from 'mongoose';
import { Genero } from '../models/Genero.js';
import { Anime } from '../models/Anime.js';

// Busca un género por nombre sin distinguir mayúsculas (ignora el de id indicado).
const buscarPorNombre = async (nombre, ignorarId) => {
  const clave = nombre.toLowerCase();
  const todos = await Genero.find();
  return todos.find((g) => g.nombre.toLowerCase() === clave && String(g._id) !== String(ignorarId));
};

// Lista de nombres de un array enviado por el cliente: la compara con el catálogo
// y devuelve los nombres oficiales (con su mayúscula/acento) y los que no existen.
export const resolverGeneros = async (nombres) => {
  const catalogo = await Genero.find();
  const porClave = new Map(catalogo.map((g) => [g.nombre.toLowerCase(), g.nombre]));

  const validos = [];
  const invalidos = [];
  for (const nombre of nombres) {
    const oficial = typeof nombre === 'string' ? porClave.get(nombre.trim().toLowerCase()) : undefined;
    if (oficial) {
      if (!validos.includes(oficial)) validos.push(oficial);
    } else {
      invalidos.push(nombre);
    }
  }
  return { validos, invalidos };
};

// Crea en el catálogo los géneros que todavía no existan (lo usa la importación externa).
export const asegurarGeneros = async (nombres) => {
  for (const nombre of nombres) {
    if (await buscarPorNombre(nombre)) continue;
    try {
      await Genero.create({ nombre });
    } catch (error) {
      if (error.code !== 11000) throw error; // 11000: otro request lo creó justo antes
    }
  }
};

// GET /api/generos
export const obtenerGeneros = async (req, res, next) => {
  try {
    const generos = await Genero.find();
    generos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    res.json({ total: generos.length, generos });
  } catch (error) {
    next(error);
  }
};

// POST /api/generos
export const crearGenero = async (req, res, next) => {
  try {
    const nombre = req.body?.nombre;
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre del género es obligatorio' });
    }

    if (await buscarPorNombre(nombre.trim())) {
      return res.status(409).json({ mensaje: `El género '${nombre.trim()}' ya existe` });
    }

    const genero = await Genero.create({ nombre });
    res.status(201).json({ mensaje: 'Género creado correctamente', genero });
  } catch (error) {
    next(error);
  }
};

// PUT /api/generos/:id
export const actualizarGenero = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID de género inválido' });
    }

    const nombre = req.body?.nombre;
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre del género es obligatorio' });
    }

    const genero = await Genero.findById(id);
    if (!genero) {
      return res.status(404).json({ mensaje: 'Género no encontrado' });
    }

    if (await buscarPorNombre(nombre.trim(), id)) {
      return res.status(409).json({ mensaje: `El género '${nombre.trim()}' ya existe` });
    }

    // Los animes guardan el nombre como texto: renombrar uno en uso los dejaría desfasados.
    const enUso = await Anime.countDocuments({ generos: genero.nombre });
    if (enUso > 0) {
      return res.status(409).json({
        mensaje: `No se puede renombrar: ${enUso} anime(s) usan el género '${genero.nombre}'`
      });
    }

    genero.nombre = nombre;
    await genero.save();
    res.json({ mensaje: 'Género actualizado correctamente', genero });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/generos/:id
export const eliminarGenero = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID de género inválido' });
    }

    const genero = await Genero.findById(id);
    if (!genero) {
      return res.status(404).json({ mensaje: 'Género no encontrado' });
    }

    const enUso = await Anime.countDocuments({ generos: genero.nombre });
    if (enUso > 0) {
      return res.status(409).json({
        mensaje: `No se puede eliminar: ${enUso} anime(s) usan el género '${genero.nombre}'`
      });
    }

    await genero.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

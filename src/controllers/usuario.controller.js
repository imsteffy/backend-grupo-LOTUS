import mongoose from 'mongoose';
import { Usuario } from '../models/Usuario.js';
import { Seguimiento } from '../models/Seguimiento.js';
import { Resena } from '../models/Resena.js';

export const obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
};

export const actualizarMiPerfil = async (req, res, next) => {
  try {
    const camposPermitidos = ['nombre', 'avatar'];
    const enviados = Object.keys(req.body);
    const noPermitidos = enviados.filter((campo) => !camposPermitidos.includes(campo));
    if (noPermitidos.length) {
      return res.status(400).json({ mensaje: `No se permite modificar: ${noPermitidos.join(', ')}` });
    }
    if (!enviados.length) return res.status(400).json({ mensaje: 'Indica nombre o avatar para actualizar' });

    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (req.body.nombre !== undefined) usuario.nombre = req.body.nombre;
    if (req.body.avatar !== undefined) usuario.avatar = req.body.avatar;
    await usuario.save();
    res.json({ mensaje: 'Perfil actualizado', usuario });
  } catch (error) {
    next(error);
  }
};

export const obtenerUsuarios = async (_req, res, next) => {
  try {
    const usuarios = await Usuario.find().sort({ fechaRegistro: -1 });
    res.json({ usuarios });
  } catch (error) {
    next(error);
  }
};

export const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID de usuario inválido' });

    // Un ADMIN no puede eliminar su propia cuenta (evita quedarse sin administradores).
    if (id === req.user.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    // No se borra si tiene seguimientos o reseñas asociados.
    const [seguimientos, resenas] = await Promise.all([
      Seguimiento.countDocuments({ usuario_id: id }),
      Resena.countDocuments({ usuario_id: id }),
    ]);
    if (seguimientos > 0 || resenas > 0) {
      return res.status(409).json({
        mensaje: 'No se puede eliminar: el usuario tiene seguimientos o reseñas asociados',
      });
    }

    await usuario.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const cambiarRolUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID de usuario inválido' });
    if (!['ADMIN', 'STD'].includes(rol)) {
      return res.status(400).json({ mensaje: 'El rol debe ser ADMIN o STD' });
    }

    // Evita que el único ADMIN se quite el rol a sí mismo.
    if (id === req.user.id) {
      return res.status(403).json({ mensaje: 'No puedes cambiar tu propio rol' });
    }

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    usuario.rol = rol;
    await usuario.save();
    res.json({ mensaje: 'Rol actualizado', usuario });
  } catch (error) {
    next(error);
  }
};
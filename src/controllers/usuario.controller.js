import { Usuario } from '../models/Usuario.js';

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
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { Usuario } from '../models/Usuario.js';

export const authToken = async (req, res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ mensaje: 'Se requiere un token Bearer válido' });

  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    const id = payload.sub ?? payload.id;
    if (!id) return res.status(401).json({ mensaje: 'Token inválido' });

    // Consultar el usuario en la base de datos para garantizar vigencia de cuenta y rol actual
    const usuario = await Usuario.findById(id).select('_id email rol nombre');
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Cuenta no encontrada o dada de baja' });
    }

    req.user = {
      id: String(usuario._id),
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };
    next();
  } catch {
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export const authToken = (req, res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ mensaje: 'Se requiere un token Bearer válido' });

  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    const id = payload.sub ?? payload.id;
    if (!id) return res.status(401).json({ mensaje: 'Token inválido' });
    req.user = { id: String(id), rol: payload.rol ?? payload.tipo };
    next();
  } catch {
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};
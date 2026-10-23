import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario.js';
import { JWT_EXPIRY, JWT_SECRET } from '../config/env.js';

export const registrar = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ mensaje: 'El cuerpo de la solicitud es obligatorio' });
    }
    const { nombre, email, password, avatar = '' } = req.body;
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios' });
    }
    const usuario = await Usuario.create({ nombre, email, password, avatar, rol: 'STD' });
    res.status(201).json({ mensaje: 'Usuario registrado', usuario });
  } catch (error) {
    next(error);
  }
};

export const iniciarSesion = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { rol: usuario.rol },
      JWT_SECRET,
      { subject: String(usuario._id), expiresIn: JWT_EXPIRY }
    );
    res.json({ mensaje: 'Inicio de sesión exitoso', token, usuario });
  } catch (error) {
    next(error);
  }
};
import express from 'express';
import { iniciarSesion, registrar } from '../controllers/auth.controller.js';
import { obtenerPerfil } from '../controllers/usuario.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/registro', registrar);
router.post('/login', iniciarSesion);
router.get('/perfil', authToken, obtenerPerfil);

export default router;

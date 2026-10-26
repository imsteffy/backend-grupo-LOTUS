import express from 'express';
import { iniciarSesion, registrar } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/registro', registrar);
router.post('/login', iniciarSesion);

export default router;

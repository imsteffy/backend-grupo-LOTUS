import express from 'express';
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  eliminarUsuario,
  cambiarRolUsuario,
  obtenerPerfil,
  actualizarMiPerfil,
} from '../controllers/usuario.controller.js';
import { authToken } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = express.Router();

// El listado y las operaciones administrativas requieren rol ADMIN.
router.get('/', authToken, authorize('ADMIN'), obtenerUsuarios);

// El perfil propio se identifica con el ID verificado en el JWT.
router.get('/me', authToken, obtenerPerfil);
router.put('/me', authToken, actualizarMiPerfil);

// Consulta y eliminación por ID se conservan solo para administración.
router.get('/:id', authToken, authorize('ADMIN'), obtenerUsuarioPorId);
router.delete('/:id', authToken, authorize('ADMIN'), eliminarUsuario);

// Cambiar el rol de otro usuario (STD <-> ADMIN). Solo ADMIN.
router.patch('/:id/rol', authToken, authorize('ADMIN'), cambiarRolUsuario);

export default router;
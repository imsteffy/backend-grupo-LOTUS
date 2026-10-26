// Compatibilidad temporal para imports antiguos, sin mantener la lógica insegura anterior.
export {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  eliminarUsuario,
  obtenerPerfil,
  actualizarMiPerfil,
} from './usuario.controller.js';
export { registrar as crearUsuario, iniciarSesion as loginUsuario } from './auth.controller.js';
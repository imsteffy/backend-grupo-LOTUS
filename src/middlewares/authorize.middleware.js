export const authorize = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ mensaje: 'Autenticación requerida' });
  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({ mensaje: 'No tienes permisos para realizar esta operación' });
  }
  next();
};
export const errorHandler = (error, _req, res, _next) => {
  let status = error.statusCode ?? error.status ?? 500;
  let mensaje = error.message ?? 'Error interno del servidor';

  if (error.name === 'ValidationError') {
    status = 400;
    mensaje = 'Los datos enviados no son válidos';
  } else if (error.name === 'CastError') {
    status = 400;
    mensaje = 'El identificador tiene un formato inválido';
  } else if (error.code === 11000) {
    status = 409;
    const campos = error.keyValue ? Object.keys(error.keyValue).join(', ') : '';
    if (campos.includes('email')) {
      mensaje = 'Ya existe un usuario registrado con ese email';
    } else if (campos.includes('titulo')) {
      mensaje = 'Ya existe un anime registrado con ese título';
    } else if (campos.includes('nombre')) {
      mensaje = 'Ya existe un registro con ese nombre';
    } else if (campos.includes('usuario_id') && campos.includes('anime_id')) {
      mensaje = 'Ya existe un registro para este usuario y anime';
    } else {
      mensaje = `Conflicto de unicidad: ya existe un registro con valor duplicado en ${campos || 'clave única'}`;
    }
  } else if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la solicitud no contiene JSON válido';
  }

  if (status < 400 || status > 599) status = 500;
  if (status >= 500) {
    console.error(`Error interno de la API (${error.name ?? 'Error'})`);
    mensaje = 'Error interno del servidor';
  }

  res.status(status).json({ mensaje });
};
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
    mensaje = 'Ya existe un registro con ese email';
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
export const logger = (req, _res, next) => {
  // req.path omite query strings para evitar registrar tokens u otros datos sensibles.
  console.info(`${new Date().toISOString()} ${req.ip} ${req.method} ${req.path}`);
  next();
};
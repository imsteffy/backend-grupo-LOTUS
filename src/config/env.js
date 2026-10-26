import dotenv from 'dotenv';

dotenv.config();

const required = (name, value) => {
	if (!value?.trim()) throw new Error(`Falta la variable de entorno requerida: ${name}`);
	return value.trim();
};

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error('PORT debe ser un número entero entre 1 y 65535');
}

export const PORT = port;
export const MONGO_URI = required('MONGO_URI o MONGODB_URI', process.env.MONGODB_URI ?? process.env.MONGO_URI);
export const JWT_SECRET = required('JWT_SECRET', process.env.JWT_SECRET);
if (JWT_SECRET.length < 32 || /replace|change.?me|development|desarrollo|kiroku_inspt_2024/i.test(JWT_SECRET)) {
	throw new Error('JWT_SECRET debe ser un secreto propio de al menos 32 caracteres; no uses el valor de ejemplo');
}

export const JWT_EXPIRY = process.env.JWT_EXPIRY?.trim() || '24h';
if (!/^\d+(?:\.\d+)?(?:ms|s|m|h|d|w|y)$/i.test(JWT_EXPIRY)) {
	throw new Error('JWT_EXPIRY debe tener formato de duración, por ejemplo 24h o 7d');
}

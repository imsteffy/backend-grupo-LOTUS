import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Exportar las variables validadas o con valores por defecto seguros
export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kiroku_db';
export const JWT_SECRET = process.env.JWT_SECRET || 'secreto_desarrollo_kiroku_inspt_2024';
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

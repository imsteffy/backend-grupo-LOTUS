import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

mongoose.connection.on('connected', () => console.info(`MongoDB conectado: ${mongoose.connection.name}`));
mongoose.connection.on('error', (error) => console.error(`Error de conexión MongoDB (${error.name})`));
mongoose.connection.on('disconnected', () => console.warn('MongoDB desconectado'));

export const conectarDB = async () => mongoose.connect(MONGO_URI);

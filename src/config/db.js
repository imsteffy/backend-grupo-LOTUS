import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

/**
 * Conexión asíncrona a la base de datos MongoDB utilizando Mongoose
 */
export const conectarDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(` Conectado a MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(` Error al conectar a MongoDB: ${error.message}`);
    console.log('ℹ️ Nota: Asegurate de tener MongoDB corriendo localmente o de configurar tu MONGO_URI de Atlas en el archivo .env');
  }
};

mongoose.connection.on('disconnected', () => {
  console.log(' MongoDB desconectado');
});

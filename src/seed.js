// ============================================================
//  seed.js — Crea (o promueve) el primer usuario ADMIN
// ============================================================
// El registro público siempre crea usuarios STD, por eso el primer
// ADMIN se crea con este script. Uso:  npm run seed:admin
// Lee ADMIN_EMAIL y ADMIN_PASSWORD (y opcionalmente ADMIN_NOMBRE) del .env.
// Si el email ya existe, solo le cambia el rol a ADMIN.
// ============================================================

import mongoose from 'mongoose';
import { conectarDB } from './config/db.js';
import { Usuario } from './models/Usuario.js';

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const nombre = process.env.ADMIN_NOMBRE?.trim() || 'Administrador';

const crearAdmin = async () => {
  if (!email || !password) {
    throw new Error('Definí ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env');
  }

  await conectarDB();

  const existente = await Usuario.findOne({ email: email.toLowerCase() });
  if (existente) {
    existente.rol = 'ADMIN';
    await existente.save();
    console.log(`El usuario ${existente.email} ya existía: ahora es ADMIN`);
    return;
  }

  const admin = await Usuario.create({ nombre, email, password, rol: 'ADMIN' });
  console.log(`ADMIN creado: ${admin.email}`);
};

try {
  await crearAdmin();
} catch (error) {
  console.error(`No se pudo crear el ADMIN: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

// ============================================================
//  Genero.js — Catálogo de géneros que el ADMIN administra
// ============================================================
// Los animes guardan sus géneros como texto (array de nombres).
// Esta colección define cuáles nombres son válidos.
// ============================================================

import mongoose from 'mongoose';

const generoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del género es obligatorio'],
      unique: true,
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [40, 'El nombre no puede superar los 40 caracteres']
    }
  },
  { timestamps: true, versionKey: false, collection: 'generos' }
);

export const Genero = mongoose.model('Genero', generoSchema);

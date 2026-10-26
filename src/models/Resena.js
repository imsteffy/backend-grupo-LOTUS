// ============================================================
//  Resena.js — Modelo de Mongoose (opiniones de la comunidad)
// ============================================================
// Representa la colección "resenas" en MongoDB.
// Cada documento es la opinión de UN usuario sobre UN anime:
// una nota del 1 al 10, un texto y si contiene spoilers.
// Campos: _id, usuario_id, anime_id, calificacion, texto,
//         spoiler, createdAt, updatedAt
// ============================================================
import mongoose from 'mongoose';

const resenaSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es requerido'],
    },
    anime_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: [true, 'El anime es requerido'],
    },
    calificacion: {
      type: Number,
      required: [true, 'La calificación es requerida'],
      min: [1, 'La calificación mínima es 1'],
      max: [10, 'La calificación máxima es 10'],
    },
    texto: {
      type: String,
      trim: true,
      maxlength: [2000, 'La reseña no puede superar 2000 caracteres'],
      default: '',
    },
    spoiler: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Índice compuesto único: una sola reseña por usuario por anime.
resenaSchema.index({ usuario_id: 1, anime_id: 1 }, { unique: true });

// No devolver __v en las respuestas JSON
resenaSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Resena = mongoose.model('Resena', resenaSchema);

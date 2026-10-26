// ============================================================
//  Seguimiento.js — Modelo de Mongoose (biblioteca personal)
// ============================================================
// Representa la colección "seguimientos" en MongoDB.
// Cada documento une a UN usuario con UN anime y guarda su
// experiencia personal: en qué estado está y por qué episodio va.
// Campos: _id, usuario_id, anime_id, estado, episodioActual,
//         createdAt, updatedAt
// ============================================================
import mongoose from 'mongoose';

const seguimientoSchema = new mongoose.Schema(
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
    estado: {
      type: String,
      enum: {
        values: ['Viendo', 'Completado', 'Pendiente', 'Abandonado'],
        message: 'Estado inválido',
      },
      default: 'Pendiente',
    },
    episodioActual: {
      type: Number,
      min: [0, 'El episodio no puede ser negativo'],
      default: 0,
    },
  },
  { timestamps: true }
);

// Índice compuesto único: la base de datos impide que un usuario
// agregue dos veces el mismo anime a su biblioteca.
seguimientoSchema.index({ usuario_id: 1, anime_id: 1 }, { unique: true });

// No devolver __v en las respuestas JSON
seguimientoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Seguimiento = mongoose.model('Seguimiento', seguimientoSchema);

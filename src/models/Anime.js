// ============================================================
//  Anime.js — Modelo de Datos para la Colección 'animes'
//  Módulo: Catálogo Oficial (Integrante 2)
// ============================================================

import mongoose from 'mongoose';

const animeSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título del anime es obligatorio'],
      trim: true,
      unique: true,
      minlength: [1, 'El título debe tener al menos 1 caracter']
    },
    tituloOriginal: {
      type: String,
      trim: true,
      default: ''
    },
    sinopsis: {
      type: String,
      required: [true, 'La sinopsis es obligatoria'],
      trim: true,
      default: 'Sin sinopsis disponible.'
    },
    generos: {
      type: [String],
      required: [true, 'Debe indicar al menos un género'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'El anime debe contener al menos un género en la lista'
      }
    },
    totalEpisodios: {
      type: Number,
      required: [true, 'El total de episodios es obligatorio'],
      min: [0, 'El total de episodios no puede ser negativo (0 indica emisión continua o indefinida)'],
      default: 0
    },
    estadoEmision: {
      type: String,
      enum: {
        values: ['En emisión', 'Finalizado', 'Por estrenar'],
        message: '{VALUE} no es un estado de emisión válido'
      },
      default: 'Finalizado'
    },
    imagenPortada: {
      type: String,
      required: [true, 'La URL de la imagen de portada es obligatoria'],
      trim: true,
      default: 'https://via.placeholder.com/300x450?text=Sin+Portada'
    },
    anioEstreno: {
      type: Number,
      min: [1960, 'El año de estreno no puede ser anterior a 1960'],
      max: [2035, 'El año de estreno no puede superar el año 2035']
    },
    calificacionPromedio: {
      type: Number,
      min: [0, 'La calificación promedio mínima es 0'],
      max: [10, 'La calificación promedio máxima es 10'],
      default: 0
    },
    totalResenas: {
      type: Number,
      min: [0, 'El total de reseñas no puede ser negativo'],
      default: 0
    },
    externalId: {
      type: Number,
      index: true,
      sparse: true // Permite valores null sin colisionar en unicidad
    }
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    versionKey: false // Elimina el campo __v en las respuestas
  }
);

// --- Índices para Búsquedas Eficientes ---
// Índice de texto sobre el título para búsquedas por palabra clave
animeSchema.index({ titulo: 'text', sinopsis: 'text' });

export const Anime = mongoose.model('Anime', animeSchema);

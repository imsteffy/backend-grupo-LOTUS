// ============================================================
// 8: Usuario.js — Modelo de Mongoose (BD MongoDB)
// ============================================================
// Representa la colección de usuarios; las contraseñas se hashean antes de guardar.
// ============================================================
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre no puede superar 60 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false,
    },
    rol: {
      type: String,
      enum: { values: ['ADMIN', 'STD'], message: 'Rol inválido' },
      default: 'STD',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || /^https?:\/\//i.test(value),
        message: 'El avatar debe ser una URL HTTP o HTTPS',
      },
    },
    fechaRegistro: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'usuarios' }
);

usuarioSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// No devolver nunca la contraseña ni el campo interno de versión.
usuarioSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const Usuario = mongoose.model('Usuario', usuarioSchema);
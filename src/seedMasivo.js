// ============================================================
//  seedMasivo.js — Siembra Masiva y Multiplicador de Datos
// ============================================================
// Carga datos masivos y coherentes para pruebas automatizadas y demos:
// - Conserva todos los usuarios y animes existentes (no borra nada).
// - Agrega nuevos usuarios de prueba con contraseñas conocidas (123456).
// - Suma nuevos animes al catálogo con portadas y géneros reales.
// - Genera decenas de seguimientos en diferentes estados y episodios.
// - Inserta reseñas variadas y recalcula métricas y rankings en MongoDB.
// 
// Uso:
//   npm run seed:masivo
//   node src/seedMasivo.js --multiplicador=2
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { conectarDB } from './config/db.js';
import { Usuario } from './models/Usuario.js';
import { Anime } from './models/Anime.js';
import { Seguimiento } from './models/Seguimiento.js';
import { Resena } from './models/Resena.js';
import { Genero } from './models/Genero.js';

dotenv.config();

// Leer multiplicador desde argumentos de consola (por defecto: 1)
const args = process.argv.slice(2);
const multArg = args.find(a => a.startsWith('--multiplicador='));
const MULTIPLICADOR = multArg ? Math.max(1, parseInt(multArg.split('=')[1], 10) || 1) : 1;

// ============================================================
// 1. BANCO DE NUEVOS ANIMES POPULARES
// ============================================================
const ANIMES_NUEVOS = [
  {
    titulo: 'Demon Slayer: Kimetsu no Yaiba',
    tituloOriginal: '鬼滅の刃',
    sinopsis: 'Tanjiro Kamado emprende un peligroso viaje como cazador de demonios para vengar a su familia y curar a su hermana Nezuko, convertida en demonio.',
    generos: ['Acción', 'Fantasía', 'Shounen'],
    totalEpisodios: 26,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Sousou no Frieren',
    tituloOriginal: '葬送のフリーレン',
    sinopsis: 'La maga elfa Frieren reflexiona sobre el significado del tiempo y las conexiones humanas tras la muerte de sus antiguos compañeros héroes.',
    generos: ['Aventura', 'Fantasía', 'Drama'],
    totalEpisodios: 28,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1015/138075.jpg',
    anioEstreno: 2023,
  },
  {
    titulo: 'Vinland Saga',
    tituloOriginal: 'ヴィンランド・サガ',
    sinopsis: 'Thorfinn, hijo del guerrero más legendario de los vikingos, busca venganza en medio de brutales batallas en la Europa del siglo XI.',
    generos: ['Acción', 'Aventura', 'Drama'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Chainsaw Man',
    tituloOriginal: 'チェンソーマン',
    sinopsis: 'Denji renace como el Demonio Motosierra tras fusionarse con su mascota Pochita, uniéndose a la División Especial de Seguridad Pública.',
    generos: ['Acción', 'Sobrenatural', 'Shounen'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'Mob Psycho 100',
    tituloOriginal: 'モブサイコ100',
    sinopsis: 'Shigeo Kageyama, alias Mob, es un estudiante con inmensos poderes psíquicos que intenta llevar una vida normal controlando sus emociones.',
    generos: ['Acción', 'Comedia', 'Sobrenatural'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1918/96303.jpg',
    anioEstreno: 2016,
  },
  {
    titulo: 'Spy x Family',
    tituloOriginal: 'スパイファミリー',
    sinopsis: 'Un espía maestro, una asesina letal y una niña telépata forman una familia falsa para cumplir sus respectivas misiones secretas.',
    generos: ['Comedia', 'Acción', 'Shounen'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'Cyberpunk: Edgerunners',
    tituloOriginal: 'サイバーパンク エッジランナーズ',
    sinopsis: 'En Night City, David Martínez sobrevive como un mercenario al margen de la ley en un mundo distópico obsesionado con los implantes cibernéticos.',
    generos: ['Acción', 'Ciencia Ficción', 'Drama'],
    totalEpisodios: 10,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1814/127150.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'Bocchi the Rock!',
    tituloOriginal: 'ぼっち・ざ・ろっく！',
    sinopsis: 'Hitori Gotou es una chica introvertida y guitarrista solitaria que termina uniéndose a Kessoku Band, descubriendo el poder de la música en grupo.',
    generos: ['Comedia', 'Música', 'Recuentos de la vida'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1448/127956.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'Solo Leveling',
    tituloOriginal: '俺だけレベルアップな件',
    sinopsis: 'Sung Jinwoo, conocido como el cazador más débil de la humanidad, despierta una interfaz secreta que le permite subir de nivel sin límites.',
    generos: ['Acción', 'Fantasía', 'Aventura'],
    totalEpisodios: 12,
    estadoEmision: 'En emisión',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1990/141065.jpg',
    anioEstreno: 2024,
  },
  {
    titulo: 'Oshi no Ko',
    tituloOriginal: '【推しの子】',
    sinopsis: 'Una mirada descarnada y misteriosa al lado oscuro de la industria del entretenimiento japonés y la reencarnación de dos fanáticos.',
    generos: ['Drama', 'Misterio', 'Sobrenatural'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1812/134736.jpg',
    anioEstreno: 2023,
  }
];

// ============================================================
// 2. BANCO DE USUARIOS REALISTAS
// ============================================================
const USUARIOS_BASE = [
  { nombre: 'Camila Rodriguez', email: 'camila@kiroku.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { nombre: 'Nicolas Benitez', email: 'nicolas@kiroku.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { nombre: 'Valeria Gomez', email: 'valeria@kiroku.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { nombre: 'Lucas Fernandez', email: 'lucas.f@kiroku.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { nombre: 'Martina Lopez', email: 'martina@kiroku.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  { nombre: 'Joaquin Diaz', email: 'joaquin@kiroku.com', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
  { nombre: 'Agustina Perez', email: 'agustina@kiroku.com', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150' },
  { nombre: 'Federico Silva', email: 'federico@kiroku.com', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150' },
  { nombre: 'Lucia Morales', email: 'lucia@kiroku.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
  { nombre: 'Julian Castro', email: 'julian@kiroku.com', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
];

// ============================================================
// 3. TEXTOS REALISTAS PARA RESEÑAS
// ============================================================
const TEXTOS_RESENAS = [
  'Una obra maestra indiscutible. La animación y la dirección musical te mantienen al borde del asiento en cada episodio.',
  'Excelente desarrollo de personajes y una trama atrapante de inicio a fin. Muy recomendada.',
  'La banda sonora es de las mejores que escuché en años. El final de temporada superó todas mis expectativas.',
  'Tiene un ritmo dinámico y momentos de acción impecables. Los giros argumentales están muy bien logrados.',
  'Me encantó la estética visual y la profundidad emocional de los protagonistas. Entra en mi top personal.',
  'Una historia reflexiva y conmovedora. Trata temas maduros con una sensibilidad única.',
  'Buena adaptación del material original. Algunas partes tienen algo de relleno pero el clímax vale totalmente la pena.',
  'Visualmente deslumbrante. El estudio de animación demostró un nivel técnico supremo.',
  'Engancha desde el minuto uno. No podía parar de ver capítulo tras capítulo.',
  'Cumple con creces lo que promete. Buenos toques de humor intercalados con momentos de alta tensión.',
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
const recalcularMetricasAnime = async (animeId) => {
  const [resumen] = await Resena.aggregate([
    { $match: { anime_id: new mongoose.Types.ObjectId(animeId) } },
    {
      $group: {
        _id: '$anime_id',
        promedio: { $avg: '$calificacion' },
        total: { $sum: 1 },
      },
    },
  ]);

  const promedio = resumen ? Math.round(resumen.promedio * 10) / 10 : 0;
  const total = resumen ? resumen.total : 0;

  await Anime.findByIdAndUpdate(animeId, {
    $set: { calificacionPromedio: promedio, totalResenas: total },
  });
};

// ============================================================
// SCRIPT PRINCIPAL
// ============================================================
async function ejecutarSeedMasivo() {
  console.log('🚀 Iniciando siembra masiva de datos en Kiroku (MongoDB)...');
  console.log(`⚡ Multiplicador configurado: x${MULTIPLICADOR}\n`);

  await conectarDB();

  // 1. Asegurar géneros en el catálogo
  const todosLosGeneros = [...new Set(ANIMES_NUEVOS.flatMap(a => a.generos))];
  let generosNuevos = 0;
  for (const nombre of todosLosGeneros) {
    const existe = await Genero.findOne({ nombre: new RegExp(`^${nombre}$`, 'i') });
    if (!existe) {
      await Genero.create({ nombre });
      generosNuevos++;
    }
  }
  console.log(`✅ Catálogo de géneros verificado (+${generosNuevos} nuevos añadidos).`);

  // 2. Insertar nuevos animes al catálogo
  let animesCreados = 0;
  for (const animeData of ANIMES_NUEVOS) {
    const existe = await Anime.findOne({ titulo: new RegExp(`^${animeData.titulo}$`, 'i') });
    if (!existe) {
      await Anime.create(animeData);
      animesCreados++;
    }
  }
  console.log(`✅ Catálogo de series verificado (+${animesCreados} series nuevas añadidas).`);

  // 3. Crear usuarios de prueba
  let usuariosCreados = 0;
  const usuariosParaCrear = [];
  for (let m = 0; m < MULTIPLICADOR; m++) {
    for (const u of USUARIOS_BASE) {
      const email = m === 0 ? u.email : `m${m}_${u.email}`;
      const nombre = m === 0 ? u.nombre : `${u.nombre} (Demo ${m + 1})`;
      usuariosParaCrear.push({
        nombre,
        email,
        password: 'password123',
        avatar: u.avatar,
        rol: 'STD',
      });
    }
  }

  for (const userData of usuariosParaCrear) {
    const existe = await Usuario.findOne({ email: userData.email.toLowerCase() });
    if (!existe) {
      await Usuario.create(userData);
      usuariosCreados++;
    }
  }
  console.log(`✅ Usuarios verificados (+${usuariosCreados} cuentas de prueba creadas con clave 'password123').`);

  // Obtener todos los usuarios y animes disponibles en la base de datos
  const todosUsuarios = await Usuario.find();
  const todosAnimes = await Anime.find();

  console.log(`\n📚 Base actual: ${todosUsuarios.length} usuarios y ${todosAnimes.length} animes disponibles.`);

  // 4. Generar Seguimientos en Bibliotecas
  let seguimientosCreados = 0;
  const estadosSeguimiento = ['Viendo', 'Completado', 'Pendiente', 'Abandonado'];

  for (const usuario of todosUsuarios) {
    // Cada usuario sigue entre 4 y 8 animes aleatorios
    const cantidadAnimes = Math.floor(Math.random() * 5) + 4;
    const animesDesordenados = [...todosAnimes].sort(() => 0.5 - Math.random()).slice(0, cantidadAnimes);

    for (const anime of animesDesordenados) {
      const existeSeg = await Seguimiento.findOne({ usuario_id: usuario._id, anime_id: anime._id });
      if (!existeSeg) {
        const estado = estadosSeguimiento[Math.floor(Math.random() * estadosSeguimiento.length)];
        const total = anime.totalEpisodios || 12;
        let ep = 0;

        if (estado === 'Completado') {
          ep = total;
        } else if (estado === 'Viendo') {
          ep = Math.max(1, Math.floor(Math.random() * total));
        } else if (estado === 'Abandonado') {
          ep = Math.floor(Math.random() * Math.min(5, total));
        }

        await Seguimiento.create({
          usuario_id: usuario._id,
          anime_id: anime._id,
          estado,
          episodioActual: ep,
        });
        seguimientosCreados++;
      }
    }
  }
  console.log(`✅ Seguimientos verificados (+${seguimientosCreados} registros agregados a bibliotecas).`);

  // 5. Generar Reseñas y Calificaciones
  let resenasCreadas = 0;
  const animesModificadosIds = new Set();

  for (const usuario of todosUsuarios) {
    // Cada usuario publica reseña de 2 a 4 animes
    const cantidadResenas = Math.floor(Math.random() * 3) + 2;
    const animesParaResenar = [...todosAnimes].sort(() => 0.5 - Math.random()).slice(0, cantidadResenas);

    for (const anime of animesParaResenar) {
      const existeRes = await Resena.findOne({ usuario_id: usuario._id, anime_id: anime._id });
      if (!existeRes) {
        const calificacion = [7, 8, 8, 9, 9, 10, 10, 6][Math.floor(Math.random() * 8)];
        const texto = TEXTOS_RESENAS[Math.floor(Math.random() * TEXTOS_RESENAS.length)];
        const spoiler = Math.random() < 0.2; // 20% probabilidad de spoiler

        await Resena.create({
          usuario_id: usuario._id,
          anime_id: anime._id,
          calificacion,
          texto,
          spoiler,
        });

        resenasCreadas++;
        animesModificadosIds.add(String(anime._id));
      }
    }
  }
  console.log(`✅ Reseñas generadas (+${resenasCreadas} opiniones comunitarias registradas).`);

  // 6. Recalcular métricas de animes en MongoDB
  console.log('\n🔄 Recalculando promedios y rankings de animes en MongoDB...');
  for (const a of todosAnimes) {
    await recalcularMetricasAnime(a._id);
  }
  console.log(`✅ Métricas recalculadas en todos los animes (${todosAnimes.length} títulos actualizados).`);

  console.log('\n======================================================');
  console.log('🎉 ¡SIEMBRA MASIVA COMPLETADA EXITOSAMENTE!');
  console.log(`- Nuevos Animes: +${animesCreados}`);
  console.log(`- Nuevos Usuarios: +${usuariosCreados}`);
  console.log(`- Nuevos Seguimientos: +${seguimientosCreados}`);
  console.log(`- Nuevas Reseñas: +${resenasCreadas}`);
  console.log('======================================================\n');
}

try {
  await ejecutarSeedMasivo();
} catch (error) {
  console.error('❌ Error en la siembra masiva:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

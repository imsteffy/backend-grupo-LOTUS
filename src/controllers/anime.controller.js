// ============================================================
//  anime.controller.js — Controlador del Catálogo de Animes
//  Módulo: Catálogo Oficial e Integración Externa (Integrante 2)
// ============================================================

import mongoose from 'mongoose';
import { Anime } from '../models/Anime.js';

/**
 * 1. Obtener catálogo de animes con buscador y filtros combinados
 * GET /api/animes?buscar=&genero=&estado=&anio=&orden=&pagina=&limite=
 */
export const obtenerAnimes = async (req, res) => {
  try {
    const {
      buscar,
      genero,
      estado,
      anio,
      orden = 'recientes',
      pagina = 1,
      limite = 10
    } = req.query;

    // Construcción del objeto de filtro dinámico
    const filtro = {};

    // Buscador por texto (insensible a mayúsculas/minúsculas)
    if (typeof buscar === 'string' && buscar.trim() !== '') {
      const termino = escaparRegex(buscar.trim());
      filtro.$or = [
        { titulo: { $regex: termino, $options: 'i' } },
        { tituloOriginal: { $regex: termino, $options: 'i' } }
      ];
    }

    // Filtro por género
    if (typeof genero === 'string' && genero.trim() !== '') {
      filtro.generos = { $regex: new RegExp(`^${escaparRegex(genero.trim())}$`, 'i') };
    }

    // Filtro por estado de emisión
    if (typeof estado === 'string' && estado.trim() !== '') {
      filtro.estadoEmision = estado.trim();
    }

    // Filtro por año de estreno
    if (anio && !isNaN(Number(anio))) {
      filtro.anioEstreno = Number(anio);
    }

    // Criterio de ordenamiento dinámico
    let sortOption = { createdAt: -1 }; // Por defecto: más recientes
    if (orden === 'calificacion') {
      sortOption = { calificacionPromedio: -1 };
    } else if (orden === 'titulo') {
      sortOption = { titulo: 1 };
    } else if (orden === 'episodios') {
      sortOption = { totalEpisodios: -1 };
    } else if (orden === 'antiguos') {
      sortOption = { createdAt: 1 };
    }

    // Paginación
    const pageNum = Math.max(1, parseInt(pagina, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limite, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Consulta en MongoDB
    const [total, animes] = await Promise.all([
      Anime.countDocuments(filtro),
      Anime.find(filtro).sort(sortOption).skip(skip).limit(limitNum)
    ]);

    res.json({
      total,
      pagina: pageNum,
      totalPaginas: Math.ceil(total / limitNum) || 1,
      limite: limitNum,
      cantidad: animes.length,
      animes
    });
  } catch (error) {
    console.error('Error al obtener animes:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al consultar el catálogo de animes',
      detalles: error.message
    });
  }
};

/**
 * 2. Obtener un anime por su ID
 * GET /api/animes/:id
 */
export const obtenerAnimePorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        mensaje: 'El ID de anime provisto no tiene un formato válido de MongoDB'
      });
    }

    const anime = await Anime.findById(id);

    if (!anime) {
      return res.status(404).json({
        error: true,
        mensaje: `No se encontró ningún anime con el ID ${id}`
      });
    }

    res.json(anime);
  } catch (error) {
    console.error('Error al obtener anime por ID:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al consultar la ficha del anime',
      detalles: error.message
    });
  }
};

/**
 * 3. Crear manualmente un anime en el catálogo
 * POST /api/animes
 */
export const crearAnime = async (req, res) => {
  try {
    const {
      titulo,
      tituloOriginal,
      sinopsis,
      generos,
      totalEpisodios,
      estadoEmision,
      imagenPortada,
      anioEstreno
    } = req.body;

    if (typeof titulo !== 'string' || titulo.trim() === '') {
      return res.status(400).json({
        error: true,
        mensaje: 'El título del anime es obligatorio'
      });
    }

    // Validación de duplicados por título (con regex escapado)
    const animeExistente = await Anime.findOne({
      titulo: { $regex: new RegExp(`^${escaparRegex(titulo.trim())}$`, 'i') }
    });

    if (animeExistente) {
      return res.status(409).json({
        error: true,
        mensaje: `Ya existe una serie registrada con el título '${titulo}'`,
        animeId: animeExistente._id
      });
    }

    const nuevoAnime = new Anime({
      titulo,
      tituloOriginal,
      sinopsis,
      generos,
      totalEpisodios,
      estadoEmision,
      imagenPortada,
      anioEstreno
    });

    const animeGuardado = await nuevoAnime.save();

    res.status(201).json({
      mensaje: 'Anime creado exitosamente en el catálogo',
      anime: animeGuardado
    });
  } catch (error) {
    console.error('Error al crear anime:', error);
    res.status(400).json({
      error: true,
      mensaje: 'No se pudo registrar el anime. Verifique los datos enviados.',
      detalles: error.message
    });
  }
};

/**
 * 4. Modificar datos de un anime
 * PUT /api/animes/:id
 */
export const actualizarAnime = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        mensaje: 'ID de anime inválido'
      });
    }

    const animeActualizado = await Anime.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!animeActualizado) {
      return res.status(404).json({
        error: true,
        mensaje: 'No se encontró el anime para actualizar'
      });
    }

    res.json({
      mensaje: 'Anime actualizado correctamente',
      anime: animeActualizado
    });
  } catch (error) {
    console.error('Error al actualizar anime:', error);
    res.status(400).json({
      error: true,
      mensaje: 'Error al actualizar los datos del anime',
      detalles: error.message
    });
  }
};

/**
 * 5. Eliminar un anime del catálogo
 * DELETE /api/animes/:id
 */
export const eliminarAnime = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        mensaje: 'El ID proporcionado no tiene un formato válido'
      });
    }

    const anime = await Anime.findById(id);
    if (!anime) {
      return res.status(404).json({
        error: true,
        mensaje: 'No se encontró ningún anime con ese ID'
      });
    }

    // Integridad referencial: no borrar series que otros módulos usan.
    // Los modelos Seguimiento y Resena los define el Integrante 3; se consultan
    // por nombre para no crear una dependencia circular entre módulos.
    const Seguimiento = mongoose.models.Seguimiento;
    const Resena = mongoose.models.Resena;

    const [totalSeguimientos, totalResenas] = await Promise.all([
      Seguimiento ? Seguimiento.countDocuments({ anime_id: id }) : 0,
      Resena ? Resena.countDocuments({ anime_id: id }) : 0
    ]);

    if (totalSeguimientos > 0 || totalResenas > 0) {
      return res.status(409).json({
        error: true,
        mensaje: `No se puede eliminar '${anime.titulo}' porque está en uso: ${totalSeguimientos} seguimiento(s) y ${totalResenas} reseña(s) dependen de esta serie`,
        seguimientos: totalSeguimientos,
        resenas: totalResenas
      });
    }

    await anime.deleteOne();

    res.json({
      mensaje: `Anime '${anime.titulo}' eliminado correctamente del catálogo`,
      anime
    });
  } catch (error) {
    console.error('Error al eliminar anime:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error interno al eliminar el anime',
      detalles: error.message
    });
  }
};

/**
 * 6. Asistente Backend: Importar anime desde API externa (Jikan / MyAnimeList) y persistir en MongoDB
 * POST /api/animes/importar-externo
 * Body: { malId: 1 } o { busqueda: "Cowboy Bebop" }
 */




// ============================================================
// IMPORTACIÓN EXTERNA (Jikan API con respaldo en AniList)
// ============================================================

const TIMEOUT_MS = 8000;

// Escapa caracteres especiales para usar un título dentro de un RegExp
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Fuente 1: Jikan (MyAnimeList)
const buscarEnJikan = async ({ malId, busqueda }) => {
  const url = malId
    ? `https://api.jikan.moe/v4/anime/${malId}/full`
    : `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(busqueda.trim())}&limit=1`;

  const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

  if (respuesta.status === 404) return null;
  if (!respuesta.ok) {
    throw new Error(`Jikan respondió HTTP ${respuesta.status}`);
  }

  const json = await respuesta.json();
  const d = malId ? json.data : json.data?.[0];
  if (!d) return null;

  let estado = 'Finalizado';
  if (d.status === 'Currently Airing') estado = 'En emisión';
  else if (d.status === 'Not yet aired') estado = 'Por estrenar';

  return {
    fuente: 'Jikan API (MyAnimeList)',
    externalId: d.mal_id,
    titulo: d.title,
    tituloOriginal: d.title_japanese || d.title_english || '',
    sinopsis: d.synopsis,
    generos: (d.genres || []).map((g) => g.name),
    totalEpisodios: d.episodes || 0,
    estadoEmision: estado,
    imagenPortada: d.images?.jpg?.large_image_url || d.images?.jpg?.image_url,
    anioEstreno: d.year || (d.aired?.from ? new Date(d.aired.from).getFullYear() : null)
  };
};

// Fuente 2 (respaldo): AniList
const buscarEnAniList = async ({ malId, busqueda }) => {
  const query = `
    query ($id: Int, $search: String) {
      Media(idMal: $id, search: $search, type: ANIME) {
        idMal
        title { romaji english native }
        description(asHtml: false)
        genres
        episodes
        status
        seasonYear
        startDate { year }
        coverImage { extraLarge large }
      }
    }`;

  const variables = malId ? { id: Number(malId) } : { search: busqueda.trim() };

  const respuesta = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (respuesta.status === 404) return null;
  if (!respuesta.ok) {
    throw new Error(`AniList respondió HTTP ${respuesta.status}`);
  }

  const { data } = await respuesta.json();
  const m = data?.Media;
  if (!m) return null;

  const mapaEstados = {
    RELEASING: 'En emisión',
    NOT_YET_RELEASED: 'Por estrenar'
  };

  return {
    fuente: 'AniList API',
    externalId: m.idMal || undefined,
    titulo: m.title.english || m.title.romaji,
    tituloOriginal: m.title.native || m.title.romaji || '',
    sinopsis: m.description ? m.description.replace(/<[^>]*>/g, '').trim() : null,
    generos: m.genres || [],
    totalEpisodios: m.episodes || 0,
    estadoEmision: mapaEstados[m.status] || 'Finalizado',
    imagenPortada: m.coverImage?.extraLarge || m.coverImage?.large,
    anioEstreno: m.seasonYear || m.startDate?.year || null
  };
};


// Traducción de géneros (Jikan / AniList → español)
const GENEROS_ES = {
  'Action': 'Acción',
  'Adventure': 'Aventura',
  'Avant Garde': 'Vanguardia',
  'Comedy': 'Comedia',
  'Drama': 'Drama',
  'Ecchi': 'Ecchi',
  'Fantasy': 'Fantasía',
  'Gourmet': 'Gastronomía',
  'Horror': 'Terror',
  'Mahou Shoujo': 'Chicas mágicas',
  'Mecha': 'Mecha',
  'Music': 'Música',
  'Mystery': 'Misterio',
  'Psychological': 'Psicológico',
  'Romance': 'Romance',
  'Sci-Fi': 'Ciencia ficción',
  'Slice of Life': 'Recuentos de la vida',
  'Sports': 'Deportes',
  'Supernatural': 'Sobrenatural',
  'Suspense': 'Suspenso',
  'Thriller': 'Suspenso'
};

const traducirGeneros = (generos) => {
  const traducidos = generos.map((g) => GENEROS_ES[g] || g);
  return [...new Set(traducidos)]; // quita repetidos (ej: Suspense + Thriller)
};

// Traducción de sinopsis (inglés → español) con el endpoint público de Google Translate.

const MAX_FRAGMENTO = 1500;

const limpiarSinopsis = (texto) => texto.replace(/\(Source:[^)]*\)/gi, '').trim();

const partirTexto = (texto) => {
  const oraciones = texto.match(/[^.!?\n]+[.!?\n]*\s*/g) || [texto];
  const fragmentos = [];
  let actual = '';

  for (const oracion of oraciones) {
    if ((actual + oracion).length > MAX_FRAGMENTO && actual) {
      fragmentos.push(actual);
      actual = '';
    }
    actual += oracion;
  }
  if (actual) fragmentos.push(actual);

  return fragmentos;
};

const traducirFragmento = async (fragmento) => {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=' +
    encodeURIComponent(fragmento);

  const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!respuesta.ok) throw new Error(`Traductor respondió HTTP ${respuesta.status}`);

  const json = await respuesta.json();
  return json[0].map((parte) => parte[0]).join('');
};

export const traducirSinopsis = async (texto) => {
  if (!texto) return texto;
  const limpio = limpiarSinopsis(texto);

  try {
    const traducidos = [];
    for (const fragmento of partirTexto(limpio)) {
      traducidos.push(await traducirFragmento(fragmento));
    }
    return traducidos.join('').trim();
  } catch (err) {
    console.warn(`⚠️ No se pudo traducir la sinopsis, se guarda en inglés: ${err.message}`);
    return limpio;
  }
};

// Función principal (POST /api/animes/importar-externo)
export const importarAnimeExterno = async (req, res) => {
  try {
    const { malId, busqueda } = req.body;

    if (!malId && (!busqueda || busqueda.trim() === '')) {
      return res.status(400).json({
        error: true,
        mensaje: 'Debe proporcionar un "malId" numérico o un término en "busqueda"'
      });
    }

    // 1) Probar Jikan; si falla por red/servidor, probar AniList
    let datos = null;
    const fallos = [];

    for (const buscar of [buscarEnJikan, buscarEnAniList]) {
      try {
        datos = await buscar({ malId, busqueda });
        if (datos) break;
      } catch (err) {
        console.warn(`⚠️ Fuente externa falló (${buscar.name}): ${err.message}`);
        fallos.push(err);
      }
    }

    if (!datos) {
      // Ambas fuentes fallaron por red => 504 (timeout) o 503 (caídas)
      if (fallos.length === 2) {
        const huboTimeout = fallos.some(
          (e) => e.name === 'TimeoutError' || e.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
        );
        return res.status(huboTimeout ? 504 : 503).json({
          error: true,
          mensaje: 'No se pudo contactar a ninguna API externa de anime. Intentá más tarde o cargá el anime manualmente con POST /api/animes.'
        });
      }
      // Respondieron bien pero sin resultados
      return res.status(404).json({
        error: true,
        mensaje: `No se encontraron resultados para '${busqueda || malId}'`
      });
    }

    // 2) Evitar duplicados (por externalId o por título, con regex escapado)
    const condiciones = [
      { titulo: { $regex: new RegExp(`^${escaparRegex(datos.titulo.trim())}$`, 'i') } }
    ];
    if (datos.externalId) condiciones.push({ externalId: datos.externalId });

    const existente = await Anime.findOne({ $or: condiciones });
    if (existente) {
      return res.status(409).json({
        error: true,
        mensaje: `La serie '${datos.titulo}' ya está registrada en nuestra base de datos local`,
        anime: existente
      });
    }

    // 3) Persistir en MongoDB
    const nuevoAnime = new Anime({
      titulo: datos.titulo,
      tituloOriginal: datos.tituloOriginal,
      sinopsis: datos.sinopsis
        ? await traducirSinopsis(datos.sinopsis)
        : 'Sinopsis no provista por la fuente.',
      generos: datos.generos.length > 0 ? traducirGeneros(datos.generos) : ['Acción'],
      totalEpisodios: datos.totalEpisodios,
      estadoEmision: datos.estadoEmision,
      imagenPortada: datos.imagenPortada || 'https://via.placeholder.com/300x450',
      anioEstreno: datos.anioEstreno || new Date().getFullYear(),
      externalId: datos.externalId
    });

    const guardado = await nuevoAnime.save();

    res.status(201).json({
      mensaje: `Anime '${guardado.titulo}' importado exitosamente y persistido en MongoDB`,
      origenExterno: datos.fuente,
      anime: guardado
    });
  } catch (error) {
    console.error('Error al importar anime desde API externa:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: true,
        mensaje: 'Los datos obtenidos de la fuente externa no pasan la validación del modelo',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: true,
      mensaje: 'Error interno al procesar la importación externa',
      detalles: error.message
    });
  }
};

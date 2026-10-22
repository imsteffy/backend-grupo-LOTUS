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
    if (buscar && buscar.trim() !== '') {
      const termino = buscar.trim();
      filtro.$or = [
        { titulo: { $regex: termino, $options: 'i' } },
        { tituloOriginal: { $regex: termino, $options: 'i' } }
      ];
    }

    // Filtro por género
    if (genero && genero.trim() !== '') {
      filtro.generos = { $regex: new RegExp(`^${genero.trim()}$`, 'i') };
    }

    // Filtro por estado de emisión
    if (estado && estado.trim() !== '') {
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

    // Validación de duplicados por título
    const animeExistente = await Anime.findOne({
      titulo: { $regex: new RegExp(`^${titulo.trim()}$`, 'i') }
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
        mensaje: 'ID de anime inválido'
      });
    }

    const animeEliminado = await Anime.findByIdAndDelete(id);

    if (!animeEliminado) {
      return res.status(404).json({
        error: true,
        mensaje: 'No se encontró el anime a eliminar'
      });
    }

    res.json({
      mensaje: `El anime '${animeEliminado.titulo}' fue eliminado exitosamente del catálogo`,
      id
    });
  } catch (error) {
    console.error('Error al eliminar anime:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al eliminar el anime del catálogo',
      detalles: error.message
    });
  }
};

/**
 * 6. Asistente Backend: Importar anime desde API externa (Jikan / MyAnimeList) y persistir en MongoDB
 * POST /api/animes/importar-externo
 * Body: { malId: 1 } o { busqueda: "Cowboy Bebop" }
 */
export const importarAnimeExterno = async (req, res) => {
  try {
    const { malId, busqueda } = req.body;

    if (!malId && (!busqueda || busqueda.trim() === '')) {
      return res.status(400).json({
        error: true,
        mensaje: 'Debe proporcionar un "malId" numérico o un término en "busqueda"'
      });
    }

    // URL a consultar en Jikan API v4
    let url = '';
    if (malId) {
      url = `https://api.jikan.moe/v4/anime/${malId}/full`;
    } else {
      url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(busqueda.trim())}&limit=1`;
    }

    console.log(`📡 Consultando Jikan API: ${url}`);
    const respuestaExterna = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!respuestaExterna.ok) {
      return res.status(respuestaExterna.status).json({
        error: true,
        mensaje: `Error al consultar Jikan API: HTTP ${respuestaExterna.statusText}`
      });
    }

    const jsonExterno = await respuestaExterna.json();
    const dataAnime = malId ? jsonExterno.data : jsonExterno.data?.[0];

    if (!dataAnime) {
      return res.status(404).json({
        error: true,
        mensaje: `No se encontraron resultados en MyAnimeList para '${busqueda || malId}'`
      });
    }

    // Verificar si ya existe en nuestra base de datos local (por externalId o por título)
    const existente = await Anime.findOne({
      $or: [
        { externalId: dataAnime.mal_id },
        { titulo: { $regex: new RegExp(`^${dataAnime.title.trim()}$`, 'i') } }
      ]
    });

    if (existente) {
      return res.status(409).json({
        error: true,
        mensaje: `La serie '${dataAnime.title}' ya está registrada en nuestra base de datos local`,
        anime: existente
      });
    }

    // Mapeo del estado de emisión de MyAnimeList al enum de nuestro modelo
    let estadoMapeado = 'Finalizado';
    if (dataAnime.status === 'Currently Airing') {
      estadoMapeado = 'En emisión';
    } else if (dataAnime.status === 'Not yet aired') {
      estadoMapeado = 'Por estrenar';
    }

    // Extracción limpia de géneros
    const listaGeneros = Array.isArray(dataAnime.genres) && dataAnime.genres.length > 0
      ? dataAnime.genres.map(g => g.name)
      : ['Acción', 'Aventura'];

    // Año de estreno
    const anio = dataAnime.year || (dataAnime.aired?.from ? new Date(dataAnime.aired.from).getFullYear() : 2024);

    // Creación y persistencia en nuestro MongoDB local
    const nuevoAnimePersistido = new Anime({
      titulo: dataAnime.title,
      tituloOriginal: dataAnime.title_japanese || dataAnime.title_english || '',
      sinopsis: dataAnime.synopsis || 'Sinopsis no provista por la fuente oficial.',
      generos: listaGeneros,
      totalEpisodios: dataAnime.episodes || 0,
      estadoEmision: estadoMapeado,
      imagenPortada: dataAnime.images?.jpg?.large_image_url || dataAnime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450',
      anioEstreno: anio,
      externalId: dataAnime.mal_id
    });

    const guardado = await nuevoAnimePersistido.save();

    res.status(201).json({
      mensaje: `Anime '${guardado.titulo}' importado exitosamente desde MyAnimeList y persistido en MongoDB`,
      origenExterno: 'Jikan API (MyAnimeList)',
      anime: guardado
    });
  } catch (error) {
    console.error('Error al importar anime desde API externa:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error interno al procesar la importación externa',
      detalles: error.message
    });
  }
};

Propuesta Backend - GRUPO LOTUS

## 1. Arquitectura y Estructura en Capas (`src/`)
Implementado en **Node.js + Express** con módulos ES6 (`"type": "module"`):
* **`app.js`**: Instancia Express, middlewares globales (`cors`, `express.json`), enrutadores montados y servidor en `PORT`.
* **`config/`**: `env.js` (dotenv centralizado) y `db.js` (conexión Mongoose asíncrona con eventos).
* **`models/`**: 4 esquemas de Mongoose con validaciones, índices únicos y método `.toJSON()` (oculta contraseñas).
* **`controllers/`**: Manejo de `req/res`, bloques `try/catch` y respuestas HTTP semánticas (200, 201, 204, 400, 401, 403, 404, 409, 500).
* **`routes/`**: Enrutadores limpios con `express.Router()` que delegan la lógica a los controladores.
* **`middlewares/`**: `auth` (JWT), `authorize` (roles), `errorHandler` (errores globales) y `logger` (IP y hora).

---

## 2. Las 4 Colecciones en MongoDB
1. **`usuarios`**: `nombre`, `email` (único), `password` (hash `bcrypt`), `rol` (`STD` o `ADMIN`), `avatar`, `fechaRegistro`.
2. **`animes`**: `titulo` (único), `sinopsis`, `generos` (Array), `totalEpisodios`, `estadoEmision`, `imagenPortada`, `calificacionPromedio`, `totalResenas`, `externalId`.
3. **`seguimientos` (Biblioteca personal)**: `usuario_id` (ref Usuario), `anime_id` (ref Anime), `estado` (*"Viendo"*, *"Completado"*, *"Pendiente"*, *"Abandonado"*), `episodioActual`, `puntuacionPersonal`, `fechaInicio`, `fechaFin`.
   - *Índice Único Compuesto:* `{ usuario_id: 1, anime_id: 1 }` (un anime por biblioteca).
4. **`resenas`**: `usuario_id` (ref Usuario), `anime_id` (ref Anime), `tituloResena`, `contenido`, `calificacion` (1 a 10), `spoilers`, `fechaCreacion`.
   - *Índice Único Compuesto:* `{ usuario_id: 1, anime_id: 1 }` (una reseña por usuario y anime).

---

## 3. Tipos de Usuario y Matriz de Permisos
* **Visitante (Sin login):** Consulta pública del catálogo, fichas de anime, reseñas y rankings.
* **Usuario Final (`STD`):** Gestiona su biblioteca personal, actualiza episodios vistos, publica y edita sus propias reseñas, y consulta sus estadísticas de visualización.
* **Administrador (`ADMIN`):** Todo lo anterior + ABM del catálogo de animes, importación desde API externa, moderación y eliminación de reseñas comunitarias, y visualización de usuarios.

---

## 4. Estrategia de Catálogo y API Externa (Enfoque Híbrido)
* **Persistencia Propia 100%:** Los usuarios y el frontend consultan **únicamente** la base de datos MongoDB local. No hay dependencias externas en tiempo real (cero latencia y cero *rate limits*).
* **Asistente de Ingesta Backend:** El Administrador dispone del endpoint `POST /api/animes/importar-externo`. El backend consulta **Jikan API (MyAnimeList)**, extrae datos reales (póster, sinopsis, capítulos, géneros) y los persiste localmente en MongoDB con su propio `_id`. Luego pueden editarse o borrarse localmente.

---

## 5. Profundidad Funcional y Lógica de Negocio (Para 3 Integrantes)
1. **Reglas de Negocio:**
   - Control de avance de episodios: no puede exceder el `totalEpisodios`.
   - Autocompletado: al alcanzar el último capítulo, el estado transiciona automáticamente a `"Completado"` y registra la `fechaFin`.
   - Recálculo de promedios: al crear, editar o borrar una reseña, se recalculan `calificacionPromedio` y `totalResenas` en la colección `animes`.
   - Borrado coordinado: al dar de baja un anime, se limpian seguimientos y reseñas huérfanas.
2. **Pipelines de Agregación en MongoDB (`aggregate`):**
   - **Dashboard personal (`GET /api/usuarios/me/estadisticas`):** Cálculo de horas totales vistas (episodios × 24 min), series por estado (*Viendo*, *Completado*, etc.) y género favorito mediante `$lookup` y `$unwind`.
   - **Rankings comunitarios (`GET /api/stats/rankings`):** Top 10 mejor puntuados y Top 10 más populares en bibliotecas.

---

## 6. Endpoints Principales de la API
* **Auth:** `POST /api/auth/registro`, `POST /api/auth/login`, `GET /api/auth/perfil`
* **Usuarios:** `GET /api/usuarios` (ADMIN), `PUT /api/usuarios/me`, `GET /api/usuarios/me/estadisticas`
* **Animes:** `GET /api/animes`, `GET /api/animes/:id`, `POST /api/animes` (ADMIN), `PUT /api/animes/:id` (ADMIN), `DELETE /api/animes/:id` (ADMIN), `POST /api/animes/importar-externo` (ADMIN)
* **Seguimientos:** `GET /api/seguimientos`, `POST /api/seguimientos`, `PUT /api/seguimientos/:id`, `PATCH /api/seguimientos/:id/incrementar` (+1 cap), `DELETE /api/seguimientos/:id`
* **Reseñas:** `GET /api/resenas/anime/:animeId`, `POST /api/resenas`, `PUT /api/resenas/:id`, `DELETE /api/resenas/:id`
* **Estadísticas:** `GET /api/stats/rankings`, `GET /api/stats/generales`

---

## 7. Distribución de Roles entre los 3 Integrantes
* **Integrante 1 (Arquitectura y Auth):** Configuración base (`app.js`, `env.js`, `db.js`), seguridad JWT, bcrypt, modelo Usuario y middlewares de autenticación y errores.
* **Integrante 2 (Catálogo e Ingesta Externa):** Modelo Anime, CRUD de catálogo, filtros avanzados, e integración backend con Jikan API para el Administrador.
* **Integrante 3 (Biblioteca, Reseñas y Analítica):** Modelos Seguimiento y Resena, lógica de avance de capítulos, y pipelines de agregación para dashboards y rankings.

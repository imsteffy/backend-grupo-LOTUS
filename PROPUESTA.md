# Propuesta de Proyecto: Kiroku (Backend)

---

## 1. La Idea del Proyecto

Como fans del anime, los tres sabemos lo fácil que es perder el hilo de las series entre distintas plataformas, por lo que decidimos crear "Kiroku": una web para que cualquier usuario pueda llevar un registro organizado de sus capítulos, puntuar, dejar reseñas y ver sus estadísticas de visualización. Para la entrega de este segundo parcial, nos enfocamos en darle vida al proyecto construyendo el Backend y su API REST utilizando MongoDB y Mongoose, aplicando la arquitectura en capas que aprendimos en clase..

---

## 2. La Problemática

Hoy en día, al mirar anime en tantas plataformas distintas es muy fácil perder el hilo: no te acordás en qué capítulo te quedaste, qué series dejaste a medias ni cuánto tiempo les dedicaste. A esto se le suma que las comunidades suelen estar desorganizadas y sin filtros para los *spoilers*, y que las apps actuales a veces fallan o se caen seguido porque dependen de sistemas externos inestables.

---

## 3. A Dónde Queremos Llegar (Propósito y Solución)

El propósito de **Kiroku** es transformar el seguimiento de series en una experiencia organizada, analítica y confiable:
* **Centralización en Biblioteca Personal:** Organizar las series en cuatro estados obligatorios: **"Viendo"**, **"Completado"**, **"Pendiente"** y **"Abandonado"**.
* **Control Rápido de Progreso:** Posibilitar la actualización inmediata de capítulos vistos con un solo clic y transicionar automáticamente el estado a *"Completado"* al finalizar la serie.
* **Métricas y Dashboards Analíticos:** Calcular automáticamente horas totales dedicadas a ver anime, series por estado y el género predilecto mediante pipelines de agregación.
* **Comunidad y Reseñas Moderadas:** Permitir una única reseña calificada (1 al 10) por usuario por obra, con alerta de spoilers y recálculo automático de los promedios del catálogo.
* **Persistencia Propia y Soberana:** Administrar el catálogo en nuestra propia base de datos MongoDB, utilizando la API externa de MyAnimeList (**Jikan API**) únicamente como un asistente backend de carga inicial para el Administrador.

---

## 4. Arquitectura y Estructura en Capas (`src/`)

Siguiendo un patrón modular por capas con Node.js y módulos ES6 (`"type": "module"`):
* **`app.js`**: Instancia Express, middlewares globales (`cors`, `express.json`), enrutadores montados y servidor en `PORT`.
* **`config/`**: `env.js` (dotenv centralizado) y `db.js` (conexión Mongoose asíncrona con eventos).
* **`models/`**: 4 esquemas de Mongoose con validaciones, índices compuestos únicos y método `.toJSON()` (oculta contraseñas).
* **`controllers/`**: Manejo de `req/res`, bloques `try/catch` y respuestas HTTP semánticas (200, 201, 204, 400, 401, 403, 404, 409, 500).
* **`routes/`**: Enrutadores limpios con `express.Router()` que delegan la lógica a los controladores.
* **`middlewares/`**: `auth` (JWT), `authorize` (roles), `errorHandler` (errores globales) y `logger` (IP y hora).

---

## 5. Las 4 Colecciones en MongoDB
1. **`usuarios`**: `nombre`, `email` (único), `password` (hash `bcrypt`), `rol` (`STD` o `ADMIN`), `avatar`, `fechaRegistro`.
2. **`animes`**: `titulo` (único), `sinopsis`, `generos` (Array), `totalEpisodios`, `estadoEmision`, `imagenPortada`, `calificacionPromedio`, `totalResenas`, `externalId`.
3. **`seguimientos` (Biblioteca personal)**: `usuario_id` (ref Usuario), `anime_id` (ref Anime), `estado` (*"Viendo"*, *"Completado"*, *"Pendiente"*, *"Abandonado"*), `episodioActual`, `puntuacionPersonal`, `fechaInicio`, `fechaFin`.
   - *Índice Único Compuesto:* `{ usuario_id: 1, anime_id: 1 }` (evita series duplicadas por biblioteca).
4. **`resenas`**: `usuario_id` (ref Usuario), `anime_id` (ref Anime), `tituloResena`, `contenido`, `calificacion` (1 a 10), `spoilers`, `fechaCreacion`.
   - *Índice Único Compuesto:* `{ usuario_id: 1, anime_id: 1 }` (una reseña por usuario por anime).

---

## 6. Tipos de Usuario y Matriz de Permisos
* **Visitante (Sin login):** Consulta pública del catálogo, fichas técnicas de anime, reseñas y rankings.
* **Usuario Final (`STD`):** Gestiona su biblioteca personal, actualiza episodios vistos, publica y edita sus propias reseñas, y consulta sus estadísticas de visualización.
* **Administrador (`ADMIN`):** Todo lo anterior + ABM del catálogo de animes, importación desde API externa, moderación y eliminación de reseñas comunitarias, y listado de usuarios.

---

## 7. Estrategia de Catálogo y API Externa (Enfoque Híbrido)
* **Persistencia Propia 100%:** Los usuarios y el frontend consultan **únicamente** la base de datos MongoDB local. No hay llamadas a APIs de terceros en tiempo real para el cliente (cero latencia y cero *rate limits*).
* **Asistente de Ingesta Backend:** El Administrador dispone del endpoint `POST /api/animes/importar-externo`. El backend consulta **Jikan API (MyAnimeList)**, extrae datos reales (póster, sinopsis, capítulos, géneros) y los persiste localmente en MongoDB con su propio `_id`. Luego pueden editarse o borrarse localmente.

---

## 8. Profundidad Funcional y Lógica de Negocio (Para 3 Integrantes)
1. **Reglas de Negocio:**
   - Control de avance de episodios: no puede exceder el `totalEpisodios`.
   - Autocompletado: al alcanzar el último capítulo, el estado transiciona automáticamente a `"Completado"` y registra la `fechaFin`.
   - Recálculo de promedios: al crear, editar o borrar una reseña, se recalculan `calificacionPromedio` y `totalResenas` en la colección `animes`.
   - Borrado coordinado: al dar de baja un anime, se limpian seguimientos y reseñas huérfanas.
2. **Pipelines de Agregación en MongoDB (`aggregate`):**
   - **Dashboard personal (`GET /api/usuarios/me/estadisticas`):** Cálculo de horas totales vistas (episodios × 24 min), series por estado (*Viendo*, *Completado*, etc.) y género predilecto mediante `$lookup` y `$unwind`.
   - **Rankings comunitarios (`GET /api/stats/rankings`):** Top 10 mejor puntuados y Top 10 más populares en bibliotecas.

---

## 9. Endpoints Principales de la API
* **Auth:** `POST /api/auth/registro`, `POST /api/auth/login`
* **Usuarios:** `GET /api/usuarios` (ADMIN), `PUT /api/usuarios/me`, `GET /api/usuarios/me/estadisticas`
* **Animes:** `GET /api/animes`, `GET /api/animes/:id`, `POST /api/animes` (ADMIN), `PUT /api/animes/:id` (ADMIN), `DELETE /api/animes/:id` (ADMIN), `POST /api/animes/importar-externo` (ADMIN)
* **Seguimientos:** `GET /api/seguimientos`, `POST /api/seguimientos`, `PUT /api/seguimientos/:id`, `PATCH /api/seguimientos/:id/incrementar` (+1 cap), `DELETE /api/seguimientos/:id`
* **Reseñas:** `GET /api/resenas/anime/:animeId`, `POST /api/resenas`, `PUT /api/resenas/:id`, `DELETE /api/resenas/:id`
* **Estadísticas:** `GET /api/stats/rankings`, `GET /api/stats/generales`

---

## 10. Distribución de Roles entre los 3 Integrantes
* **Integrante 1 (Arquitectura y Auth):** Configuración base (`app.js`, `env.js`, `db.js`), seguridad JWT, bcrypt, modelo Usuario y middlewares de autenticación y errores.
* **Integrante 2 (Catálogo e Ingesta Externa):** Modelo Anime, CRUD de catálogo, filtros avanzados, e integración backend con Jikan API para el Administrador.
* **Integrante 3 (Biblioteca, Reseñas y Analítica):** Modelos Seguimiento y Resena, lógica de avance de capítulos, y pipelines de agregación para dashboards y rankings.

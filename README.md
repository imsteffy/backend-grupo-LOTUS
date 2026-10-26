# Kiroku — Backend API REST
> **API RESTful para la plataforma de catalogación, seguimiento personal y reseñas de anime.**  
> *Proyecto desarrollado para Programación III (Comisión 3-601 TM) — INSPT.*  
> *Profesor: Carlos E. Cimino | Grupo de 3 Integrantes.*

---

## 📌 Descripción y Visión del Proyecto

Este repositorio contiene el desarrollo del **backend y la API REST** del proyecto **Kiroku** (del japonés 記録, *"registro / bitácora"*).

La API proporciona el soporte de datos, autenticación stateless y lógica de negocio para una plataforma donde los usuarios pueden gestionar su biblioteca personal de series, actualizar su avance capítulo a capítulo, calificar títulos, redactar reseñas y explorar estadísticas sobre su tiempo de visualización.

---

## ⚠️ La Problemática

Actualmente, el consumo de animación japonesa está muy disperso entre múltiples servicios de streaming y páginas web. Esto genera que los espectadores pierdan la trazabilidad de los capítulos vistos, acumulen series pausadas sin recordar dónde las dejaron y carezcan de métricas claras sobre su dedicación o géneros predilectos. Asimismo, los sitios comunitarios suelen presentar críticas desordenadas, sin moderación ni advertencia de *spoilers*, mientras que muchas aplicaciones colapsan al depender en tiempo real de APIs externas lentas y limitadas por *rate limits*.

---

## 🎯 Pantallazo de lo que Resuelve la API (Aspectos Clave de la Propuesta)

Diseñado para ir más allá de un CRUD básico y cumplir con la profundidad exigida a un grupo de 3 integrantes:

1. **4 Colecciones Relacionales en MongoDB:**
   - `usuarios`: Cuentas, contraseñas hasheadas (`bcrypt`), roles y método `toJSON` seguro.
   - `animes`: Catálogo oficial persistido (título, sinopsis, géneros, episodios, póster, promedio).
   - `seguimientos`: Biblioteca personal organizada en los estados obligatorios: **"Viendo"**, **"Completado"**, **"Pendiente"** y **"Abandonado"**, con índice único compuesto para evitar duplicados.
   - `resenas`: Críticas con notas del 1 al 10, detección de spoilers y restricción de una sola reseña por usuario/anime.

2. **Diferenciación Estricta de Roles:**
   - **Visitante:** Búsqueda libre en catálogo, lectura de fichas, reseñas y rankings públicos.
   - **Usuario Final (`STD`):** Control integral de su propia biblioteca, avance de episodios y publicación de reseñas.
   - **Administrador (`ADMIN`):** ABM completo del catálogo, importación asistida desde API externa y moderación de contenido.

3. **Catálogo con Persistencia Propia e Ingesta Híbrida Asistida:**
   - El cliente consulta **exclusivamente** nuestro MongoDB local (cero latencia externa).
   - El Administrador cuenta con un endpoint backend para importar automáticamente datos reales desde **Jikan API (MyAnimeList)** y persistirlos en nuestra base de datos.

4. **Reglas de Negocio y Analítica Avanzada (Pipelines de Agregación):**
   - Transición automática a estado *"Completado"* al alcanzar el último capítulo.
   - Recálculo atómico de la calificación promedio y total de reseñas en la colección de animes.
   - Dashboard personal (`GET /api/usuarios/me/estadisticas`): cálculo analítico de horas totales de visualización y género favorito con `$lookup` y `$unwind`.
   - Rankings globales comunitarios (Top 10 mejor valorados y más populares en bibliotecas).

---

## 🛠️ Tecnologías

- **Entorno de Ejecución:** Node.js (módulos nativos ES6 `"type": "module"`)
- **Framework Web:** Express.js
- **Base de Datos:** MongoDB (local / Atlas)
- **Modelado Documental (ODM):** Mongoose
- **Seguridad:** JSON Web Tokens (`jsonwebtoken`) y `bcrypt` (10 salt rounds)
- **Middlewares:** CORS, express.json, auth, authorize y errorHandler centralizado

---

## 📂 Arquitectura del Proyecto (`src/`)

Estructurado en capas, con ES Modules (`"type": "module"`):

```text
kiroku-backend/
├── src/
│   ├── app.js                 # Punto de entrada Express, middlewares y encendido
│   ├── seed.js                # Script para crear el primer ADMIN
│   ├── seedGeneros.js         # Script que carga el catálogo de géneros
│   ├── config/                # env.js (variables de entorno) y db.js (conexión MongoDB)
│   ├── models/                # Usuario.js, Anime.js, Genero.js, Seguimiento.js, Resena.js
│   ├── controllers/           # auth, usuario, anime, genero, seguimiento, resena, stats
│   ├── routes/                # auth, usuarios, animes, generos, seguimientos, resenas, stats (*.routes.js)
│   └── middlewares/           # auth, authorize (roles), errorHandler y logger
├── docs/                      # Documentación y colección de Postman
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Instalación y puesta en marcha

Requisitos: **Node.js 18 o superior** y una base **MongoDB** (local o Atlas).

```bash
git clone https://github.com/imsteffy/backend-grupo-LOTUS.git
cd backend-grupo-LOTUS
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Completá el archivo `.env` con tus valores (ver la tabla siguiente) y ejecutá:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor con recarga automática (desarrollo) |
| `npm start` | Inicia el servidor (producción) |
| `npm run seed:admin` | Crea el primer usuario ADMIN (o promueve a ADMIN un email existente) |
| `npm run seed:generos` | Carga el catálogo de géneros (los base y los que ya usan los animes). Se puede repetir sin duplicar |

El servidor queda escuchando en `http://localhost:3000` (o el `PORT` configurado).

### Variables de entorno (`.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No (3000) | Puerto del servidor |
| `MONGO_URI` | Sí | Cadena de conexión a MongoDB (local o Atlas) |
| `JWT_SECRET` | Sí | Secreto para firmar los JWT. Mínimo 32 caracteres; el servidor no arranca con un valor de ejemplo |
| `JWT_EXPIRY` | No (24h) | Duración del token, por ejemplo `24h` o `7d` |
| `ADMIN_NOMBRE` | Solo seed | Nombre del ADMIN (por defecto `Administrador`) |
| `ADMIN_EMAIL` | Solo seed | Email del ADMIN |
| `ADMIN_PASSWORD` | Solo seed | Contraseña del ADMIN (mínimo 6 caracteres) |

> El registro público (`POST /api/auth/registro`) siempre crea usuarios `STD`. Para tener un ADMIN, usá `npm run seed:admin`. Después, un ADMIN puede cambiar el rol de otros usuarios con `PATCH /api/usuarios/:id/rol`.

---

## 📡 Endpoints

Base: `/api`. Las rutas protegidas requieren el header `Authorization: Bearer <token>` (el token se obtiene en el login). Los cuerpos se envían como JSON.

**Leyenda de acceso:** Público = sin token · Token = usuario logueado (STD o ADMIN) · ADMIN = solo administrador.

### Autenticación

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| POST | `/auth/registro` | Público | Registra un usuario STD (`nombre`, `email`, `password`) | 201, 400, 409 |
| POST | `/auth/login` | Público | Devuelve el `token` JWT (`email`, `password`) | 200, 400, 401 |

### Usuarios

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/usuarios/me` | Token | Perfil del usuario logueado | 200, 401, 404 |
| PUT | `/usuarios/me` | Token | Modifica `nombre` o `avatar` propios | 200, 400, 401 |
| GET | `/usuarios/me/estadisticas` | Token | Estadísticas personales (horas vistas, género favorito, etc.) | 200, 401 |
| GET | `/usuarios` | ADMIN | Lista de usuarios | 200, 401, 403 |
| GET | `/usuarios/:id` | ADMIN | Un usuario por id | 200, 400, 401, 403, 404 |
| PATCH | `/usuarios/:id/rol` | ADMIN | Cambia el rol (`{ "rol": "ADMIN" }` o `{ "rol": "STD" }`) | 200, 400, 401, 403, 404 |
| DELETE | `/usuarios/:id` | ADMIN | Elimina un usuario | 204, 400, 401, 403, 404, 409 |

`DELETE /usuarios/:id` responde 403 si el ADMIN intenta borrarse a sí mismo y 409 si el usuario tiene seguimientos o reseñas. `PATCH /usuarios/:id/rol` responde 403 si intenta cambiar su propio rol.

### Animes (catálogo)

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/animes` | Público | Lista con filtros: `buscar`, `genero`, `estado`, `anio`, `orden`, `pagina`, `limite` | 200 |
| GET | `/animes/:id` | Público | Ficha de un anime | 200, 400, 404 |
| POST | `/animes` | ADMIN | Crea un anime (409 si el título ya existe) | 201, 400, 401, 403, 409 |
| PUT | `/animes/:id` | ADMIN | Modifica un anime (si envía `generos`, reemplaza la lista completa) | 200, 400, 401, 403, 404, 409 |
| PATCH | `/animes/:id/generos` | ADMIN | Agrega géneros (`{ "generos": ["Isekai"] }`) sin quitar los que ya tiene ni duplicar | 200, 400, 401, 403, 404 |
| DELETE | `/animes/:id` | ADMIN | Elimina un anime (409 si tiene seguimientos o reseñas) | 200, 400, 401, 403, 404, 409 |
| POST | `/animes/importar-externo` | ADMIN | Importa desde Jikan/AniList (`malId` o `busqueda`). Los géneros que no estén en el catálogo se crean solos | 201, 400, 401, 403, 409 |

Los `generos` de un anime (en `POST` y `PUT /animes`) deben existir en el catálogo de géneros; si no, responde 400.

### Géneros (catálogo administrable)

Los géneros se guardan en la colección `generos`. El ADMIN los gestiona sin tocar código y luego los asigna a los animes enviando sus nombres en `generos`.

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/generos` | Público | Lista los géneros ordenados A-Z | 200 |
| POST | `/generos` | ADMIN | Crea un género (`{ "nombre": "Mecha" }`) | 201, 400, 401, 403, 409 |
| PUT | `/generos/:id` | ADMIN | Renombra un género (409 si el nombre existe o si algún anime lo usa) | 200, 400, 401, 403, 404, 409 |
| DELETE | `/generos/:id` | ADMIN | Elimina un género (409 si algún anime lo usa) | 204, 400, 401, 403, 404, 409 |

Si ya tenés animes cargados, ejecutá una vez `npm run seed:generos` para poblar el catálogo.

### Seguimientos (biblioteca personal)

Cada usuario solo ve y modifica sus propios seguimientos (un ADMIN puede moderar).

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/seguimientos` | Token | Mi biblioteca; filtro opcional `?estado=Viendo` | 200, 401 |
| POST | `/seguimientos` | Token | Agrega un anime (`anime_id`, `estado`, `episodioActual`); 400 si ya lo tenía | 201, 400, 401, 404 |
| PUT | `/seguimientos/:id` | Token (dueño) | Modifica `estado` y/o `episodioActual` | 200, 400, 401, 403, 404 |
| PATCH | `/seguimientos/:id/incrementar` | Token (dueño) | Suma un episodio | 200, 400, 401, 403, 404 |
| DELETE | `/seguimientos/:id` | Token (dueño) | Quita el anime de la biblioteca | 204, 400, 401, 403, 404 |

Estados válidos: `Viendo`, `Completado`, `Pendiente`, `Abandonado`. Al llegar al último episodio pasa a `Completado`.

### Reseñas

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/resenas/anime/:animeId` | Público | Reseñas de un anime | 200, 400 |
| POST | `/resenas` | Token | Crea una reseña (`anime_id`, `calificacion` 1-10, `texto`, `spoiler`); 400 si ya reseñó ese anime | 201, 400, 401, 404 |
| PUT | `/resenas/:id` | Token (autor) | Modifica la reseña | 200, 400, 401, 403, 404 |
| DELETE | `/resenas/:id` | Token (autor) | Elimina la reseña | 204, 400, 401, 403, 404 |

Solo se permite una reseña por usuario y anime. El promedio del anime se recalcula con cada cambio. El ADMIN puede moderar reseñas ajenas.

### Estadísticas

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/stats/rankings` | Público | Top mejor valorados y más populares | 200 |

### Formato de errores

Los errores devuelven JSON con un campo `mensaje`. Códigos usados: `400` datos inválidos, `401` token ausente o inválido, `403` sin permisos, `404` no encontrado, `409` conflicto (duplicado o dependencias) y `500` error interno.

Hay una colección de Postman con ejemplos en la carpeta [`docs/`](./docs).

---

## 🌍 Deploy

La API está desplegada en Render:

**https://backend-grupo-lotus.onrender.com**

- Comprobación: `GET https://backend-grupo-lotus.onrender.com/` responde `{"mensaje":"API Kiroku activa y funcionando", ...}`.
- Ejemplo público: `GET https://backend-grupo-lotus.onrender.com/api/animes`.
- Las variables de entorno (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRY`) se configuran en el panel de Render, no en el repositorio.
- El plan gratuito de Render pone el servicio en reposo tras unos minutos sin uso: la primera petición puede tardar hasta un minuto en responder.
- Para crear el primer ADMIN en producción se ejecuta `npm run seed:admin` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidas.

---

## 🌐 Ecosistema del Proyecto (Frontend Desacoplado)

El frontend de **Kiroku** se desarrolla de manera independiente en un repositorio separado, comunicándose con esta API REST exclusivamente mediante peticiones HTTP asíncronas con respuestas en formato JSON e interceptores para el token `Authorization: Bearer <token>`.

---

## 📄 Especificación Completa de la Propuesta

Para conocer el detalle técnico exhaustivo presentado para la evaluación del Segundo Parcial:

* 📘 **Propuesta Técnica Completa:** [PROPUESTA.md](./PROPUESTA.md)

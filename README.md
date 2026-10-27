# Kiroku — Backend & API REST
> **Plataforma Integral de Catalogación, Seguimiento Personal y Reseñas de Anime**  
> **Cátedra:** Programación III (Comisión 3-601 TM) — INSPT  
> **Profesor:** Carlos E. Cimino  
> **Grupo:** LOTUS (3 Integrantes)  
> **Deploy API en Producción:** [https://backend-grupo-lotus.onrender.com](https://backend-grupo-lotus.onrender.com)  
> **Base de Datos:** MongoDB Atlas (`kiroku_db`)

---

## 📑 Tabla de Contenidos

1. [Visión del Proyecto y Problemática](#1-visión-del-proyecto-y-problemática)
2. [Guía para la Defensa Oral (División por Integrante)](#2-guía-para-la-defensa-oral-división-por-integrante)
   - [👤 Integrante 1 (Maxi) — Autenticación, Usuarios y Seguridad](#-integrante-1-maxi--autenticación-usuarios-y-seguridad)
   - [👤 Integrante 2 (Steff) — Catálogo Oficial, Géneros e Ingesta Externa](#-integrante-2-steff--catálogo-oficial-géneros-e-ingesta-externa)
   - [👤 Integrante 3 (Jesu) — Biblioteca Personal, Reseñas y Analítica](#-integrante-3-jesu--biblioteca-personal-reseñas-y-analítica)
3. [Arquitectura del Sistema y Estructura del Repositorio](#3-arquitectura-del-sistema-y-estructura-del-repositorio)
4. [Instalación, Configuración y Puesta en Marcha](#4-instalación-configuración-y-puesta-en-marcha)
5. [Diccionario Exhaustivo de Endpoints](#5-diccionario-exhaustivo-de-endpoints)
6. [Guion de Prueba en Vivo (Live Demo Paso a Paso)](#6-guion-de-prueba-en-vivo-live-demo-paso-a-paso)
7. [Deploy en Producción y Colección de Postman](#7-deploy-en-producción-y-colección-de-postman)

---

## 1. Visión del Proyecto y Problemática

### ⚠️ La Problemática
Hoy en día, ver anime puede ser un caos porque consumimos contenido en muchas plataformas distintas, lo que hace que frecuentemente perdamos el hilo de los capítulos, no tengamos idea de cuánto tiempo invertimos en cada serie y terminemos lidiando con comunidades desorganizadas o llenas de spoilers. Además, muchas de las aplicaciones que usamos terminan fallando o cayéndose porque dependen de servicios externos que colapsan con facilidad.

### 🎯 La Solución Backend (Kiroku)
Para solucionar todo esto creamos Kiroku (que significa "registro" en japonés), un sistema propio, seguro y súper estable. Al tener su propia base de datos, la plataforma es independiente y no se cae por culpa de terceros. Kiroku está pensado para hacerte la vida más fácil: protege tus datos personales, actualiza y marca tus series como completadas de forma automática, y calcula tus estadísticas para que sepas exactamente cuántas horas de tu vida llevás viendo anime, cuáles son tus géneros favoritos y cuáles son los rankings de la comunidad.

### ⚡ Características Principales y Modelo de Dominio

#### 🗄️ Modelos de Datos (5 Colecciones en MongoDB Atlas)
* **`Usuario`:** Gestión de cuentas con contraseñas hasheadas criptográficamente (`bcrypt`), roles estrictos (`'STD'` y `'ADMIN'`), validación de email por regex y método de transformación `toJSON` seguro para no exponer contraseñas ni metadatos (`__v`) en las respuestas JSON.
* **`Anime`:** Catálogo oficial persistido con metadatos completos (título, sinopsis, géneros, total de episodios, estado de emisión, año de estreno y portada). Incluye campos desnormalizados (`calificacionPromedio` y `totalResenas`) calculados automáticamente para lecturas de alto rendimiento.
* **`Genero`:** Colección independiente que normaliza las etiquetas oficiales del catálogo. Permite al Administrador crear y gestionar géneros en caliente sin alterar código duro.
* **`Seguimiento`:** Biblioteca personal que vincula a un usuario con un anime mediante un **índice compuesto único** `{ usuario_id: 1, anime_id: 1 }` (la base de datos impide duplicados físicamente), registrando el `estado` (*Viendo, Completado, Pendiente, Abandonado*) y el `episodioActual`.
* **`Resena`:** Críticas comunitarias con notas del 1 al 10, advertencia booleana de `spoiler`, texto y un **índice compuesto único** `{ usuario_id: 1, anime_id: 1 }` (una única opinión por usuario por título).

#### 🛡️ Matriz de Permisos y Roles (RBAC)
| Funcionalidad / Recurso | Visitante (Público) | Usuario Estándar (`STD`) | Administrador (`ADMIN`) |
|---|:---:|:---:|:---:|
| Explorar catálogo de animes con filtros y paginación | ✅ | ✅ | ✅ |
| Consultar fichas técnicas y listado de géneros | ✅ | ✅ | ✅ |
| Leer reseñas comunitarias de cualquier anime | ✅ | ✅ | ✅ |
| Consultar Rankings globales Top 10 (mejores y populares) | ✅ | ✅ | ✅ |
| Registrarse e Iniciar Sesión (obtención de token JWT) | ✅ | ✅ | ✅ |
| Gestionar biblioteca personal (Seguimientos) | ❌ | ✅ (solo propia) | ✅ (propia y moderación) |
| Avance rápido `+1 Cap` con transición a *"Completado"* | ❌ | ✅ | ✅ |
| Publicar, editar y borrar opiniones con calificación | ❌ | ✅ (solo propias) | ✅ (propias y moderación) |
| Dashboard personal con horas vistas y género preferido | ❌ | ✅ | ✅ |
| Modificar perfil y avatar personal | ❌ | ✅ | ✅ |
| Alta manual, edición y borrado de animes en catálogo | ❌ | ❌ | ✅ |
| Ingesta externa asistida desde MyAnimeList/Jikan | ❌ | ❌ | ✅ |
| Anexar géneros atómicamente (`PATCH /animes/:id/generos` vía `$addToSet`) | ❌ | ❌ | ✅ |
| CRUD del catálogo de géneros (crear, renombrar, eliminar) | ❌ | ❌ | ✅ |
| Listar todos los usuarios registrados en el sistema | ❌ | ❌ | ✅ |
| Cambiar roles de usuarios (`STD` ↔ `ADMIN`) | ❌ | ❌ | ✅ |
| Eliminar cuentas de usuarios (con chequeo de dependencias) | ❌ | ❌ | ✅ |

---

## 2. Guía para la Defensa Oral (División por Integrante)

Para la defensa del backend, la arquitectura se dividió de forma equitativa y modular en 3 áreas bien definidas:

---

### 👤 Integrante 1 (Maxi) — Autenticación, Usuarios y Seguridad
Se encargó de la infraestructura base del servidor, la seguridad transversal y el control de accesos:
* **Conexión e Infraestructura:** Configuró las variables de entorno (`env.js` con validaciones de `MONGO_URI` y `JWT_SECRET`), la conexión central a MongoDB Atlas con manejo de eventos (`db.js`) y el script para inicializar el administrador (`seed.js`).
* **Modelo y Seguridad:** Creó el modelo `Usuario` con hashing de contraseñas mediante `bcrypt` y método `toJSON` seguro para no exponer credenciales. Implementó la emisión/verificación de tokens **JWT** y los middlewares globales (`auth` para validar tokens, `authorize` para roles `STD`/`ADMIN`, `errorHandler` centralizado y `logger`).
* **Gestión de Cuentas:** Desarrolló el registro, login, consulta y edición de perfil (`/api/usuarios/me`), y las rutas exclusivas de administración para listar usuarios, cambiar roles y eliminarlos con reglas de auto-protección y chequeo de integridad referencial.

---

### 👤 Integrante 2 (Steff) — Catálogo Oficial, Géneros e Ingesta Externa
Se encargó del catálogo de series, los filtros avanzados, la administración de géneros y la ingesta externa:
* **Catálogo y Motor de Búsqueda:** Diseñó el modelo `Anime` y el endpoint `GET /api/animes` con filtros combinados (búsqueda por texto con `$regex`, filtro por género, año, estado de emisión, orden dinámico y paginación nativa con `skip` y `limit`). Desarrolló también el ABM completo de animes para administradores.
* **Catálogo de Géneros y Relación con Animes:** Creó el modelo `Genero` y su CRUD independiente para que los géneros sean dinámicos sin tocar código. Implementó la validación obligatoria de géneros al guardar animes, la protección ante borrado si están en uso (`409 Conflict`), el script de seed (`seedGeneros.js`) y el nuevo endpoint `PATCH /animes/:id/generos` con el operador atómico `$addToSet`.
* **Ingesta Externa Asistida:** Desarrolló el endpoint `POST /animes/importar-externo` para consultar la API de **Jikan (MyAnimeList)** y AniList, traduciendo sinopsis y géneros al español para persistirlos directamente en MongoDB Atlas, garantizando independencia total de servicios de terceros.

---

### 👤 Integrante 3 (Jesu) — Biblioteca Personal, Reseñas y Analítica
Se encargó de la experiencia de seguimiento del usuario, las opiniones comunitarias y los pipelines analíticos:
* **Biblioteca Personal:** Creó el modelo `Seguimiento` con índice compuesto único `{ usuario_id, anime_id }` para evitar series duplicadas en base de datos. Programó la gestión de estados (*Viendo, Completado, Pendiente, Abandonado*) y el endpoint `PATCH /seguimientos/:id/incrementar` (+1 capítulo) con transición automática a *"Completado"* al finalizar la serie.
* **Reseñas Comunitarias y Recálculo:** Desarrolló el modelo `Resena` (calificación 1-10, spoiler flag y una sola reseña por usuario por obra) y la lógica de recálculo atómico en el controlador, actualizando en tiempo real el promedio (`calificacionPromedio`) y total de reseñas en la colección de animes.
* **Pipelines de Analítica:** Implementó las consultas del **Aggregation Framework** de MongoDB para el dashboard personal (`GET /api/usuarios/me/estadisticas`, calculando horas de visualización vistas y el género favorito con `$lookup` y `$unwind`) y los rankings comunitarios del Top 10 más valorados y más populares.

---

## 3. Arquitectura del Sistema y Estructura del Repositorio

El proyecto implementa una arquitectura en capas desacoplada con módulos ES6 (`"type": "module"`):

```text
kiroku-backend/
├── docs/                                    # Documentación técnica y colecciones de prueba
│   ├── Documentación integrada...          # Memoria técnica completa
│   └── Kiroku-Integrante3.postman_collection.json # Colección de Postman exportada
├── src/
│   ├── app.js                               # Entrada Express, middlewares globales, rutas y 404
│   ├── seed.js                              # Inicialización/promoción del usuario ADMIN
│   ├── seedGeneros.js                       # Carga idempotente del catálogo de géneros
│   ├── config/
│   │   ├── db.js                            # Conexión asíncrona a MongoDB con eventos
│   │   └── env.js                           # Validación estricta de variables de entorno
│   ├── controllers/
│   │   ├── auth.controller.js               # Registro y login con generación de JWT
│   │   ├── usuario.controller.js            # Perfil, cambio de roles y eliminación segura
│   │   ├── anime.controller.js              # CRUD animes, filtros, paginación e importador Jikan
│   │   ├── genero.controller.js             # CRUD del catálogo de géneros
│   │   ├── seguimiento.controller.js        # Biblioteca personal y avance +1
│   │   ├── resena.controller.js             # CRUD de reseñas y recálculo de notas
│   │   └── stats.controller.js              # Pipelines de agregación (personales y rankings)
│   ├── middlewares/
│   │   ├── auth.middleware.js               # Verificación de JWT (Bearer token)
│   │   ├── authorize.middleware.js          # Control de acceso basado en roles (ADMIN)
│   │   ├── errorHandler.middleware.js       # Manejo centralizado de excepciones HTTP
│   │   └── logger.middleware.js             # Registro en consola de peticiones HTTP
│   ├── models/
│   │   ├── Usuario.js                       # Schema Usuario (bcrypt, toJSON limpio, roles)
│   │   ├── Anime.js                         # Schema Anime (índices, validaciones de catálogo)
│   │   ├── Genero.js                        # Schema Genero (nombres únicos de géneros)
│   │   ├── Seguimiento.js                   # Schema Seguimiento (índice compuesto único)
│   │   └── Resena.js                        # Schema Resena (calificación 1-10, spoiler)
│   └── routes/
│       ├── auth.routes.js                   # /api/auth
│       ├── usuarios.routes.js               # /api/usuarios
│       ├── animes.routes.js                 # /api/animes
│       ├── generos.routes.js                # /api/generos
│       ├── seguimientos.routes.js           # /api/seguimientos
│       ├── resenas.routes.js                # /api/resenas
│       └── stats.routes.js                  # /api/stats y /api/usuarios/me/estadisticas
├── .env.example                             # Plantilla de variables de entorno requeridas
├── package.json                             # Dependencias y scripts del proyecto
└── README.md                                # Guía integral del proyecto y defensa
```

### Ciclo de Vida de una Petición (Request Lifecycle)
```
[Cliente HTTP / Postman]
         │
         ▼
[app.js: Middlewares Globales] ──► CORS, express.json(), logger
         │
         ▼
[Enrutador Específico] ─────────► ej: /api/animes, /api/seguimientos
         │
         ▼
[Middlewares de Seguridad] ─────► auth.middleware (valida JWT) -> authorize (valida ROL)
         │
         ▼
[Controlador (Controller)] ─────► Valida payload y ejecuta reglas de negocio
         │
         ▼
[Modelos Mongoose (ODM)] ───────► Esquemas, validaciones, índices únicos y ganchos
         │
         ▼
[Base de Datos: MongoDB Atlas] ─► Transacciones y agregaciones
         │
         ▼
[Respuesta JSON Exitosa]   O   [errorHandler Centralizado] ──► { "mensaje": "..." }
```

---

## 4. Instalación, Configuración y Puesta en Marcha

### Prerrequisitos
* **Node.js:** Versión 18.x o superior (`node -v`).
* **NPM:** Versión 9.x o superior (`npm -v`).
* **Base de Datos:** Instancia de MongoDB (local o clúster en MongoDB Atlas).

### Paso 1: Clonar e Instalar Dependencias
```bash
git clone https://github.com/imsteffy/backend-grupo-LOTUS.git
cd backend-grupo-LOTUS
npm install
```

### Paso 2: Configurar Variables de Entorno
Crear el archivo `.env` en la raíz del backend a partir de la plantilla:

```bash
# En Windows (PowerShell / CMD):
copy .env.example .env

# En Linux / macOS:
cp .env.example .env
```

Editar el archivo `.env` con los valores correspondientes:

```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/kiroku_db?retryWrites=true&w=majority
JWT_SECRET=clave_secreta_super_segura_de_mas_de_32_caracteres_kiroku
JWT_EXPIRY=24h

# Credenciales para el script inicial de Administrador
ADMIN_NOMBRE=Administrador
ADMIN_EMAIL=admin@kiroku.com
ADMIN_PASSWORD=AdminPassword123!
```

| Variable | Requerida | Propósito |
|---|---|---|
| `PORT` | No (por defecto 3000) | Puerto local donde escucha el servidor Express. |
| `MONGO_URI` | **Sí** | Cadena de conexión completa a MongoDB (local o Atlas). |
| `JWT_SECRET` | **Sí** | Clave criptográfica para firmar los JWT (mínimo 32 caracteres). |
| `JWT_EXPIRY` | No (por defecto `24h`) | Tiempo de expiración del token (ej: `24h`, `7d`). |
| `ADMIN_NOMBRE` | Para seed | Nombre del Administrador creado por el seed. |
| `ADMIN_EMAIL` | Para seed | Correo del Administrador para el login. |
| `ADMIN_PASSWORD`| Para seed | Contraseña en texto plano para hashear en el seed. |

### Paso 3: Inicializar la Base de Datos (Seeds)
Ejecutar los scripts de población de datos iniciales en orden:

```bash
# 1. Crear el usuario Administrador inicial (o promoverlo si ya existía)
npm run seed:admin

# 2. Poblar el catálogo inicial con los 21 géneros canónicos
npm run seed:generos
```

### Paso 4: Iniciar el Servidor

```bash
# Modo Desarrollo (con recarga automática mediante node --watch):
npm run dev

# Modo Producción:
npm start
```

El servidor iniciará e imprimirá en consola:
```text
[DB] Conectado a MongoDB Atlas con éxito
API Kiroku escuchando en http://localhost:3000
```

---

## 5. Diccionario Exhaustivo de Endpoints

* **Base URL Local:** `http://localhost:3000/api`
* **Base URL Producción:** `https://backend-grupo-lotus.onrender.com/api`
* **Cabecera de autenticación para rutas protegidas:** `Authorization: Bearer <token>`
* **Manejo uniforme de errores:** Todas las respuestas de error devuelven formato `{ "mensaje": "Descripción clara del error" }`.

### 🔐 1. Módulo de Autenticación (`/api/auth`)

| Método | Endpoint | Acceso | Body Requerido (JSON) | Códigos HTTP |
|---|---|---|---|---|
| `POST` | `/auth/registro` | Público | `nombre`, `email`, `password` | `201 Created`<br>`400 Bad Request`<br>`409 Conflict` (email ya registrado) |
| `POST` | `/auth/login` | Público | `email`, `password` | `200 OK` (retorna `token` y datos de usuario)<br>`400 Bad Request`<br>`401 Unauthorized` |

---

### 👤 2. Módulo de Usuarios (`/api/usuarios`)

| Método | Endpoint | Acceso | Descripción / Body | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/usuarios/me` | Token (Cualquiera) | Retorna los datos del usuario logueado según su token | `200 OK`<br>`401 Unauthorized`<br>`404 Not Found` |
| `PUT` | `/usuarios/me` | Token (Cualquiera) | Modifica perfil propio: `{ "nombre": "...", "avatar": "https://..." }` | `200 OK`<br>`400 Bad Request`<br>`401 Unauthorized` |
| `GET` | `/usuarios/me/estadisticas` | Token (Cualquiera) | Dashboard personal: horas vistas, episodios, animes por estado, género top | `200 OK`<br>`401 Unauthorized` |
| `GET` | `/usuarios` | **ADMIN** | Lista todos los usuarios registrados con sus roles y fechas | `200 OK`<br>`401 Unauthorized`<br>`403 Forbidden` |
| `GET` | `/usuarios/:id` | **ADMIN** | Obtiene un usuario específico por su ObjectId | `200 OK`<br>`400 / 401 / 403 / 404` |
| `PATCH`| `/usuarios/:id/rol` | **ADMIN** | Cambia rol: `{ "rol": "ADMIN" }` o `{ "rol": "STD" }`. (No permite auto-degradarse) | `200 OK`<br>`400 / 401 / 403 / 404` |
| `DELETE`| `/usuarios/:id` | **ADMIN** | Elimina usuario. Rechaza si es el propio admin (403) o si tiene datos (409) | `204 No Content`<br>`400 / 401 / 403 / 404 / 409` |

---

### 🎬 3. Módulo de Catálogo Oficial de Animes (`/api/animes`)

| Método | Endpoint | Acceso | Descripción / Parámetros | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/animes` | Público | Listado paginado con filtros query: `?buscar=...&genero=...&estado=...&anio=...&orden=...&pagina=1&limite=10` | `200 OK` |
| `GET` | `/animes/:id` | Público | Ficha técnica completa de un anime por su ObjectId | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` |
| `POST` | `/animes` | **ADMIN** | Alta manual: `titulo`, `sinopsis`, `generos` (array validado), `totalEpisodios`, `estadoEmision`, `imagenPortada`, `anioEstreno` | `201 Created`<br>`400 Bad Request`<br>`401 / 403`<br>`409 Conflict` (título repetido) |
| `PUT` | `/animes/:id` | **ADMIN** | Modificación completa de datos de un anime | `200 OK`<br>`400 / 401 / 403 / 404 / 409` |
| `PATCH`| `/animes/:id/generos` | **ADMIN** | Anexa géneros sin pisar existentes: `{ "generos": ["Shonen", "Aventura"] }` vía `$addToSet` | `200 OK`<br>`400 / 401 / 403 / 404` |
| `DELETE`| `/animes/:id` | **ADMIN** | Eliminación de anime. Bloquea si tiene seguimientos o reseñas asociadas | `200 OK`<br>`400 / 401 / 403 / 404 / 409` |
| `POST` | `/animes/importar-externo` | **ADMIN** | Ingesta desde Jikan/MyAnimeList: `{ "malId": 16498 }` o `{ "busqueda": "Attack on Titan" }` | `201 Created`<br>`400 / 401 / 403 / 409` |

---

### 🏷️ 4. Módulo de Catálogo de Géneros (`/api/generos`)

| Método | Endpoint | Acceso | Descripción / Body | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/generos` | Público | Lista todos los géneros cargados ordenados alfabéticamente A-Z | `200 OK` |
| `POST` | `/generos` | **ADMIN** | Crea un nuevo género: `{ "nombre": "Cyberpunk" }` | `201 Created`<br>`400 / 401 / 403`<br>`409 Conflict` |
| `PUT` | `/generos/:id` | **ADMIN** | Renombra género. Falla si ya existe o si algún anime lo está usando | `200 OK`<br>`400 / 401 / 403 / 404 / 409` |
| `DELETE`| `/generos/:id` | **ADMIN** | Elimina género. Falla con `409` si hay animes que lo tienen asignado | `204 No Content`<br>`400 / 401 / 403 / 404 / 409` |

---

### 📖 5. Módulo de Biblioteca Personal / Seguimientos (`/api/seguimientos`)

| Método | Endpoint | Acceso | Descripción / Body | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/seguimientos` | Token (Cualquiera) | Obtiene los animes en la biblioteca del usuario. Filtro opcional: `?estado=Viendo` | `200 OK`<br>`401 Unauthorized` |
| `POST` | `/seguimientos` | Token (Cualquiera) | Agrega anime: `{ "anime_id": "...", "estado": "Viendo", "episodioActual": 1 }` | `201 Created`<br>`400 Bad Request`<br>`401 / 404` |
| `PUT` | `/seguimientos/:id` | Token (Dueño/Admin)| Modifica estado o capítulo actual: `{ "estado": "Completado", "episodioActual": 12 }` | `200 OK`<br>`400 / 401 / 403 / 404` |
| `PATCH`| `/seguimientos/:id/incrementar` | Token (Dueño)| Suma `+1` episodio. Si llega al tope total de capítulos, cambia a `"Completado"` | `200 OK`<br>`400 / 401 / 403 / 404` |
| `DELETE`| `/seguimientos/:id` | Token (Dueño/Admin)| Quita el anime de la biblioteca personal del usuario | `204 No Content`<br>`400 / 401 / 403 / 404` |

---

### ⭐ 6. Módulo de Reseñas Comunitarias (`/api/resenas`)

| Método | Endpoint | Acceso | Descripción / Body | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/resenas/anime/:animeId`| Público | Lista todas las reseñas del anime con datos de autor (nombre, avatar, rol) | `200 OK`<br>`400 Bad Request` |
| `POST` | `/resenas` | Token (Cualquiera) | Publica crítica: `{ "anime_id": "...", "calificacion": 9, "texto": "...", "spoiler": false }` | `201 Created`<br>`400 / 401 / 404` (400 si ya reseñó) |
| `PUT` | `/resenas/:id` | Token (Autor) | Modifica la reseña propia y recalcula el promedio del anime automáticamente | `200 OK`<br>`400 / 401 / 403 / 404` |
| `DELETE`| `/resenas/:id` | Token (Autor/Admin)| Elimina la reseña (permite moderación por ADMIN) y recalcula el promedio del anime | `204 No Content`<br>`400 / 401 / 403 / 404` |

---

### 📊 7. Módulo de Estadísticas y Rankings (`/api/stats`)

| Método | Endpoint | Acceso | Descripción | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/stats/rankings` | Público | Retorna el **Top 10 Mejor Valorados** y el **Top 10 Más Populares** | `200 OK` |
| `GET` | `/usuarios/me/estadisticas` | Token (Cualquiera) | Pipeline personal: Horas de visionado calculadas, animes por estado y género top | `200 OK`<br>`401 Unauthorized` |

---

## 6. Guion de Prueba en Vivo (Live Demo Paso a Paso)

Este guion está diseñado para ser ejecutado en orden durante la presentación frente a la cátedra (utilizando **Postman**, **Thunder Client** o comandos `curl`):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SECUENCIA DE LA DEMOSTRACIÓN EN VIVO                 │
├──────┬──────────────────────────────────────────┬──────────────────────┤
│ Paso │ Acción                                   │ Quién la defiende    │
├──────┼──────────────────────────────────────────┼──────────────────────┤
│  1   │ Healthcheck inicial (GET /)              │ Integrante 1 (Maxi)  │
│  2   │ Login Admin y obtención de JWT           │ Integrante 1 (Maxi)  │
│  3   │ Catálogo: Filtros y Gestión de Géneros   │ Integrante 2 (Steff) │
│  4   │ Ingesta externa y PATCH $addToSet        │ Integrante 2 (Steff) │
│  5   │ Registro y Login de Usuario STD          │ Integrante 1 (Maxi)  │
│  6   │ Biblioteca y Avance +1 (Autocompletado)  │ Integrante 3 (Jesu)  │
│  7   │ Reseñas y Recálculo Atómico de Promedio  │ Integrante 3 (Jesu)  │
│  8   │ Estadísticas, Rankings y Pruebas RBAC    │ Todo el equipo       │
└──────┴──────────────────────────────────────────┴──────────────────────┘
```

---

### Paso 1: Verificación de Estado (Healthcheck)
Comprobar que el servidor está online y conectado a MongoDB Atlas.
* **Petición:** `GET http://localhost:3000/`
* **Respuesta esperada (200 OK):**
```json
{
  "mensaje": "API Kiroku activa y funcionando",
  "estado": "online",
  "version": "1.0.0"
}
```

---

### Paso 2: Autenticación de Administrador
Iniciar sesión con la cuenta de Administrador generada por el seed.
* **Petición:** `POST http://localhost:3000/api/auth/login`
* **Body:**
```json
{
  "email": "admin@kiroku.com",
  "password": "AdminPassword123!"
}
```
* **Respuesta esperada (200 OK):** Devuelve `{ "token": "eyJh...", "usuario": { "id": "...", "nombre": "Administrador", "rol": "ADMIN" } }`.
* 📌 *Acción en Postman:* Copiar el `token` para usarlo en la variable `{{ADMIN_TOKEN}}`.

---

### Paso 3: Catálogo y Gestión de Géneros (Demostración Integrante 2)
1. **Consultar Géneros:** `GET http://localhost:3000/api/generos` (muestra la lista ordenada A-Z).
2. **Crear nuevo género:** `POST http://localhost:3000/api/generos` (con `Authorization: Bearer {{ADMIN_TOKEN}}`).
   ```json
   { "nombre": "Cyberpunk" }
   ```
3. **Consultar Catálogo con Filtros Combinados:**
   `GET http://localhost:3000/api/animes?buscar=titan&genero=Accion&estado=Finalizado&pagina=1&limite=5`
   * Muestra la estructura de paginación (`total`, `pagina`, `totalPaginas`, `datos: [...]`).

---

### Paso 4: Ingesta Asistida y Operación Atómica de Géneros (Demostración Integrante 2)
1. **Importación asistida desde MyAnimeList / Jikan:**
   * **Petición:** `POST http://localhost:3000/api/animes/importar-externo` (Header: `Bearer {{ADMIN_TOKEN}}`)
   * **Body:**
   ```json
   { "busqueda": "Frieren" }
   ```
   * **Respuesta (201 Created):** Se persiste automáticamente en Atlas con portada, sinopsis traducida y géneros mapeados.
2. **Anexar Géneros sin sobrescribir (`PATCH /generos`):**
   * **Petición:** `PATCH http://localhost:3000/api/animes/<ANIME_ID>/generos` (Header: `Bearer {{ADMIN_TOKEN}}`)
   * **Body:**
   ```json
   { "generos": ["Fantasía", "Aventura"] }
   ```
   * Muestra cómo `$addToSet` preserva los géneros existentes y no genera duplicados.

---

### Paso 5: Registro y Login de Usuario Común (Demostración Integrante 1)
1. **Registrar nuevo usuario:**
   * **Petición:** `POST http://localhost:3000/api/auth/registro`
   * **Body:**
   ```json
   {
     "nombre": "Estudiante Test",
     "email": "alumno@inspt.edu.ar",
     "password": "Password123!"
   }
   ```
   * **Respuesta (201 Created):** Retorna el usuario con rol garantizado `"rol": "STD"`.
2. **Iniciar sesión:**
   * **Petición:** `POST http://localhost:3000/api/auth/login`
   * Guarda el nuevo token en `{{STD_TOKEN}}`.

---

### Paso 6: Biblioteca Personal y Transición Automática (Demostración Integrante 3)
1. **Agregar anime a la biblioteca personal:**
   * **Petición:** `POST http://localhost:3000/api/seguimientos` (Header: `Bearer {{STD_TOKEN}}`)
   * **Body:**
   ```json
   {
     "anime_id": "<ANIME_ID>",
     "estado": "Viendo",
     "episodioActual": 27
   }
   ```
   * **Respuesta (201 Created):** Retorna el documento de seguimiento. Si se intenta ejecutar de nuevo, falla con `400 Bad Request` por el índice compuesto único.
2. **Avance Rápido `+1 Cap` y Autocompletado:**
   * Suponiendo que la serie tiene 28 episodios en total:
   * **Petición:** `PATCH http://localhost:3000/api/seguimientos/<SEGUIMIENTO_ID>/incrementar` (Header: `Bearer {{STD_TOKEN}}`)
   * **Respuesta (200 OK):** `episodioActual` pasa a 28 y el `estado` muta automáticamente a `"Completado"`.

---

### Paso 7: Reseña con Calificación y Recálculo de Promedio (Demostración Integrante 3)
1. **Consultar calificación actual del anime:**
   * `GET http://localhost:3000/api/animes/<ANIME_ID>` (ej: `calificacionPromedio: 0, totalResenas: 0`).
2. **Publicar reseña con nota y spoiler flag:**
   * **Petición:** `POST http://localhost:3000/api/resenas` (Header: `Bearer {{STD_TOKEN}}`)
   * **Body:**
   ```json
   {
     "anime_id": "<ANIME_ID>",
     "calificacion": 10,
     "texto": "Excelente desarrollo de personajes y animación sublime.",
     "spoiler": false
   }
   ```
   * **Respuesta (201 Created)**.
3. **Comprobar Recálculo Atómico:**
   * Al consultar de nuevo `GET /api/animes/<ANIME_ID>`, se evidencia que `calificacionPromedio` se recalculó automáticamente a `10` y `totalResenas` a `1`.

---

### Paso 8: Dashboard Analítico, Rankings Comunitarios y Seguridad RBAC
1. **Ver Estadísticas Personales:**
   * `GET http://localhost:3000/api/usuarios/me/estadisticas` (Header: `Bearer {{STD_TOKEN}}`)
   * Verifica el cálculo analítico de horas vistas (`(episodiosVistos * 24) / 60`) y el género predilecto calculado con `$lookup` y `$unwind`.
2. **Ver Rankings Globales:**
   * `GET http://localhost:3000/api/stats/rankings` (Retorna Top 10 mejor valorados y más populares).
3. **Prueba de Seguridad y Control de Acceso (RBAC):**
   * Intentar listar usuarios con el token estándar:
   * `GET http://localhost:3000/api/usuarios` (Header: `Bearer {{STD_TOKEN}}`)
   * **Respuesta esperada (403 Forbidden):**
   ```json
   { "mensaje": "Acceso restringido a administradores" }
   ```
   * Intentar acceder sin token `Authorization`:
   * **Respuesta esperada (401 Unauthorized):**
   ```json
   { "mensaje": "Token no proporcionado" }
   ```

---

## 7. Deploy en Producción y Colección de Postman

### Servidor en la Nube (Render)
La API se encuentra completamente operativa en:  
🌐 **[https://backend-grupo-lotus.onrender.com](https://backend-grupo-lotus.onrender.com)**

* **URL Base de la API:** `https://backend-grupo-lotus.onrender.com/api`
* **Ejemplo público de verificación:** `https://backend-grupo-lotus.onrender.com/api/animes`
* ⚠️ **Nota sobre el Plan Gratuito:** El servicio entra en estado de hibernación tras 15 minutos de inactividad. La primera petición puede tardar entre 45 y 60 segundos en responder mientras se activa el contenedor (*cold start*). Las peticiones subsecuentes responden con latencia habitual inmediata.

### Colección de Postman
En el directorio [`docs/`](./docs) del repositorio se encuentra la colección lista para importar:
* **Archivo:** `docs/Kiroku-Integrante3.postman_collection.json`
* Incluye todas las carpetas organizadas por módulo (Auth, Usuarios, Animes, Géneros, Seguimientos, Reseñas, Stats) con ejemplos preconfigurados de peticiones y variables de entorno (`baseUrl`, `adminToken`, `userToken`).

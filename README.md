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
   - [👤 Integrante 1 — Maxi: Autenticación, Usuarios y Seguridad](#-integrante-1--maxi-autenticación-usuarios-y-seguridad)
   - [👤 Integrante 2 — Steff: Catálogo Oficial, Géneros e Ingesta Externa](#-integrante-2--steff-catálogo-oficial-géneros-e-ingesta-externa)
   - [👤 Integrante 3 — Jesu: Biblioteca Personal, Reseñas y Analítica](#-integrante-3--jesu-biblioteca-personal-reseñas-y-analítica)
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

---

## 2. Guía para la Defensa Oral (División por Integrante)

Cada integrante del Grupo LOTUS tiene a su cargo un módulo específico con dominio integral de sus modelos de datos, controladores, rutas y reglas de negocio:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA MODULAR                            │
├────────────────────┬────────────────────┬──────────────────────────────┤
│   INTEGRANTE 1     │    INTEGRANTE 2    │         INTEGRANTE 3         │
│      (Maxi)        │      (Steff)       │            (Jesu)            │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Auth & Seguridad │ • Catálogo Animes  │ • Biblioteca (Seguimiento)   │
│ • Modelo Usuario   │ • Catálogo Géneros │ • Reseñas y Moderación       │
│ • RBAC (STD/ADMIN) │ • Filtros & Paging │ • Recálculo de Calificaciones│
│ • Middlewares base │ • Ingesta Externa  │ • Pipelines de Estadísticas  │
│ • Config DB / Env  │ • Operador $addToSet│ • Rankings Comunitarios      │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

### 👤 Integrante 1 — Maxi: Autenticación, Usuarios y Seguridad

#### 🎯 Qué debe explicar y justificar:
1. **Configuración Inicial del Entorno y Conexión:**
   - `src/config/db.js`: Conexión asíncrona a MongoDB Atlas mediante Mongoose con manejo de eventos de conexión (`connected`, `error`, `disconnected`).
   - `src/config/env.js`: Validación estricta de variables de entorno al arrancar (falla de inmediato si `JWT_SECRET` tiene menos de 32 caracteres o si falta `MONGO_URI`).
2. **Modelo de Datos `Usuario` (`src/models/Usuario.js`):**
   - Esquema con validación de email por regex y unicidad (`unique: true, lowercase: true`).
   - Hashing automático de contraseña mediante gancho/método `bcrypt` con 10 salt rounds.
   - Protección de datos sensibles: campo `password` con `select: false` y método de transformación `toJSON` para eliminar `password` y `__v` de cualquier respuesta enviada al cliente.
   - Definición del enum de roles: `'STD'` (Estándar) y `'ADMIN'` (Administrador).
3. **Mecanismo de Seguridad Stateless y Middlewares:**
   - Emisión de JWT firmado con claims (`id`, `email`, `rol`) y expiración configurable (`24h`).
   - `src/middlewares/auth.middleware.js`: Extrae el token de la cabecera `Authorization: Bearer <token>`, lo valida criptográficamente con `jwt.verify` e inyecta `req.usuario`.
   - `src/middlewares/authorize.middleware.js`: Middleware de orden superior (`authorize('ADMIN')`) que bloquea con HTTP `403 Forbidden` a usuarios no autorizados.
   - `src/middlewares/errorHandler.middleware.js`: Interceptor global de excepciones que captura errores de casteo (`CastError`), duplicados de Mongo (`code 11000 -> 409 Conflict`) y validaciones (`ValidationError -> 400 Bad Request`).
4. **Reglas de Negocio en la Gestión de Usuarios (`src/controllers/usuario.controller.js`):**
   - Un usuario estándar solo puede consultar o modificar su propio perfil (`/api/usuarios/me`).
   - Solo un `ADMIN` puede listar usuarios o cambiar roles (`PATCH /api/usuarios/:id/rol`).
   - **Regla de Auto-Protección:** Un administrador no puede degradarse a sí mismo a `STD` ni puede auto-eliminarse (retorna `403 Forbidden`).
   - **Integridad Referencial:** Antes de borrar un usuario (`DELETE /api/usuarios/:id`), el backend comprueba si tiene seguimientos o reseñas activas; si existen, responde `409 Conflict` evitando registros huérfanos.
5. **Script de Inicialización del Administrador (`src/seed.js`):**
   - Como el registro público (`POST /api/auth/registro`) siempre asigna rol `STD`, el script `npm run seed:admin` garantiza la creación o elevación del primer Administrador del sistema de forma segura.

---

### 👤 Integrante 2 — Steff: Catálogo Oficial, Géneros e Ingesta Externa

#### 🎯 Qué debe explicar y justificar:
1. **Modelo `Anime` (`src/models/Anime.js`):**
   - Colección oficial de series con campos obligatorios: `titulo`, `sinopsis`, `generos`, `totalEpisodios`, `estadoEmision` (`'En emisión'`, `'Finalizado'`, `'Por estrenar'`), `imagenPortada` (validada por URL) y `anioEstreno`.
   - Campos desnormalizados para lectura de alto rendimiento: `calificacionPromedio` y `totalResenas`.
2. **Catálogo Administrable de Géneros (`src/models/Genero.js` y `src/controllers/genero.controller.js`):**
   - Colección independiente `generos` para normalizar los nombres válidos sin necesidad de alterar código duro.
   - **Relación `generos` ↔ `animes` (N:M híbrida / normalizada en validación):**
     - **Tipo:** Catálogo normalizado con array de texto embebido en `Anime`.
     - **Cómo funciona:**
       * La colección **`generos`** almacena los nombres únicos y oficiales (ej: *"Shonen"*, *"Isekai"*, *"Mecha"*).
       * El modelo **`Anime`** guarda un array de strings: `generos: ["Acción", "Fantasía"]`.
     - **Regla de integridad:** Al crear o editar un anime (o usar `PATCH /animes/:id/generos`), el controlador valida contra la colección `generos` que todas las etiquetas existan (responde `400 Bad Request` si se envía un género inexistente).
     - **Protección contra eliminación/renombrado en cascada:** No se permite eliminar ni renombrar un género si actualmente está siendo utilizado por uno o más animes en el catálogo (`409 Conflict`).
     - **Por qué se diseñó así:**
       * Evita tener `enums` fijos en código JavaScript, permitiendo que el Administrador cree y gestione géneros dinámicamente desde el panel vía API REST sin necesidad de modificar el código ni redeployar.
       * Almacenar los nombres como strings en el array de `Anime` evita costosos `$lookup` en cada consulta de lectura del catálogo, manteniendo respuestas ultrarrápidas y paginación ligera, mientras que la integridad referencial se garantiza a nivel de controlador.
   - Script `src/seedGeneros.js`: Carga idempotente de los 21 géneros base del catálogo.
3. **Buscador, Filtros Combinados y Paginación en MongoDB (`src/controllers/anime.controller.js`):**
   - Endpoint `GET /api/animes` diseñado para consultas complejas en una sola llamada:
     - Búsqueda por coincidencia de texto flexible (`$regex`, case-insensitive en `titulo` o `tituloOriginal`).
     - Filtro por género (`$in`), estado de emisión y año.
     - Ordenamiento dinámico (`alfabetico`, `calificacion`, `recientes`).
     - Paginación nativa eficiente mediante `skip()` y `limit()` devolviendo metadatos de navegación (`total`, `pagina`, `limite`, `totalPaginas`).
4. **Operación Atómica de Géneros:**
   - Endpoint `PATCH /api/animes/:id/generos`: Permite al Administrador sumar nuevos géneros a un anime existente utilizando el operador atómico de MongoDB `$addToSet`, garantizando que no se dupliquen etiquetas ni se pisen los géneros existentes.
5. **Ingesta Externa Asistida (Jikan / MyAnimeList):**
   - Endpoint `POST /api/animes/importar-externo`: Permite al Administrador buscar una obra en la API pública de MyAnimeList mediante su `malId` o título.
   - El backend normaliza la estructura externa, traduce y mapea géneros, asegura su existencia en la colección `generos` y persiste la obra en MongoDB Atlas con validación previa de duplicados (`409 Conflict`). De este modo, la app cliente jamás consulta a Jikan directamente, asegurando disponibilidad total.

---

### 👤 Integrante 3 — Jesu: Biblioteca Personal, Reseñas y Analítica

#### 🎯 Qué debe explicar y justificar:
1. **Biblioteca Personal de Seguimientos (`src/models/Seguimiento.js` y `src/controllers/seguimiento.controller.js`):**
   - Colección `seguimientos` con referencia a `usuario_id` y `anime_id`.
   - **Índice Compuesto Único:** `{ usuario_id: 1, anime_id: 1 }` a nivel base de datos para impedir que un usuario guarde por duplicado el mismo anime.
   - Estados de seguimiento: `'Viendo'`, `'Completado'`, `'Pendiente'`, `'Abandonado'`.
   - **Regla de Avance Rápido y Transición Automática (`PATCH /seguimientos/:id/incrementar`):** Incrementa en `+1` el episodio actual. Si el capítulo alcanza el `totalEpisodios` del anime, el backend actualiza de forma automática e inmediata el estado a `'Completado'`.
2. **Sistema Comunitario de Reseñas (`src/models/Resena.js` y `src/controllers/resena.controller.js`):**
   - Críticas con calificación de `1` a `10`, texto descriptivo y bandera booleana `spoiler`.
   - Restricción de una única reseña por usuario y anime mediante índice compuesto `{ usuario_id: 1, anime_id: 1 }`.
   - **Recálculo Atómico de Métricas:** Cada vez que una reseña se crea, se modifica o se elimina, el controlador dispara un recálculo automático (`calcularPromedioAnime`) que actualiza de forma atómica en el documento del anime los campos `calificacionPromedio` y `totalResenas`.
   - **Moderación:** El autor puede editar o borrar su reseña; un Administrador tiene privilegios para eliminar cualquier reseña inapropiada.
   - Soporte para estilización frontend: Se pueblan los datos del autor (`.populate('usuario_id', 'nombre avatar rol')`) permitiendo destacar visualmente las reseñas de administradores.
3. **Pipelines de Agregación y Analítica Avanzada (`src/controllers/stats.controller.js`):**
   - **Dashboard Personal (`GET /api/usuarios/me/estadisticas`):** Pipeline que calcula:
     - Total de animes en seguimiento clasificados por estado.
     - Total de episodios vistos y cálculo de horas totales de visualización según la fórmula:
       $$\text{Horas Vistas} = \frac{\text{episodiosVistos} \times 24 \text{ min}}{60}$$
     - Género predilecto del usuario: Pipeline con `$lookup` a la colección `animes`, `$unwind` de géneros, `$group` por género y `$sort` para obtener el más frecuente.
   - **Rankings Globales Comunitarios (`GET /api/stats/rankings`):**
     - **Top 10 Mejor Valorados:** Animes con mayor calificación promedio y al menos una reseña registrada.
     - **Top 10 Más Populares:** Agregación sobre la colección `seguimientos` agrupando por `anime_id`, contando adeptos totales y aplicando un desempate determinista secundario por título para mantener un podio estable.

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

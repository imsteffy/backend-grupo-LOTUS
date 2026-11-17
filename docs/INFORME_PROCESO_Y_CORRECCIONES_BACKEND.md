# ⛩️ INFORME DE PROCESO DE DESARROLLO, SUBSANACIÓN DE HALLAZGOS Y EVIDENCIAS DE PRUEBAS — BACKEND KIROKU (記録)

> **Cátedra:** Programación III (Comisión 3-601 TM) — INSPT  
> **Profesor:** Carlos E. Cimino  
> **Grupo:** LOTUS  
> **Integrantes:**  
> - **Maxi (Integrante 1):** Autenticación, Cuentas de Usuario y Seguridad Transversal  
> - **Steff (Integrante 2):** Catálogo Oficial de Animes, Taxonomía de Géneros e Ingesta Externa  
> - **Jesu (Integrante 3):** Biblioteca Personal, Reseñas Comunitarias y Analítica de MongoDB  
> **Repositorio Backend:** `https://github.com/imsteffy/backend-grupo-LOTUS`  
> **Despliegue Oficial en Render:** `https://backend-grupo-lotus.onrender.com`  
> **Base de Datos:** MongoDB Atlas Clúster (`kiroku_db`)

---

## 📑 Índice General
1. [Resumen Ejecutivo y Propósito del Informe](#1-resumen-ejecutivo-y-propósito-del-informe)
2. [Arquitectura del Sistema y División en 3 Módulos](#2-arquitectura-del-sistema-y-división-en-3-módulos)
3. [El Proceso de Desarrollo Original por Integrante](#3-el-proceso-de-desarrollo-original-por-integrante)
   - [3.1 Integrante 1 — Autenticación, Usuarios y Seguridad Transversal](#31-integrante-1--autenticación-usuarios-y-seguridad-transversal)
   - [3.2 Integrante 2 — Catálogo Oficial, Géneros e Ingesta Externa](#32-integrante-2--catálogo-oficial-géneros-e-ingesta-externa)
   - [3.3 Integrante 3 — Biblioteca Personal, Reseñas y Analítica](#33-integrante-3--biblioteca-personal-reseñas-y-analítica)
4. [Las Falencias Detectadas por la Cátedra (Informe 27-10-2026)](#4-las-falencias-detectadas-por-la-cátedra-informe-27-10-2026)
5. [Plan de Subsanación: Qué y Cómo se Arregló Cada Hallazgo](#5-plan-de-subsanación-qué-y-cómo-se-arregló-cada-hallazgo)
6. [Batería de Pruebas y Evidencias de Funcionamiento](#6-batería-de-pruebas-y-evidencias-de-funcionamiento)
7. [Conclusión Técnica y Preparación para la Defensa Oral](#7-conclusión-técnica-y-preparación-para-la-defensa-oral)

---

## 1. Resumen Ejecutivo y Propósito del Informe

El presente informe documenta el ciclo de vida completo del backend de la plataforma **Kiroku (記録)**, desde su concepción y distribución modular en tres partes equitativas entre los integrantes del grupo **LOTUS**, hasta el tratamiento riguroso de las observaciones formuladas en la revisión docente de la cátedra del **27 de octubre de 2026** (`Informe_ProgIII_2026-10-27_Grupo_LOTUS_Kiroku.html`).

El documento detalla:
1. El proceso constructivo de cada una de las tres áreas del backend.
2. La totalidad de los hallazgos señalados (0 P0, 3 P1 y 5 P2).
3. Las refactorizaciones de código aplicadas para subsanar cada falla.
4. Las pruebas de caja negra y caja blanca con casos positivos, negativos y de concurrencia que acreditan el funcionamiento correcto del sistema.

---

## 2. Arquitectura del Sistema y División en 3 Módulos

El backend se construyó bajo una **arquitectura en capas desacoplada** con módulos ES6 (`"type": "module"`), abstrayendo la lógica en:
- **Capa de Configuración (`src/config/`):** Variables de entorno validadas (`env.js`) y conexión con reintentos y eventos a MongoDB Atlas (`db.js`).
- **Capa de Modelos (`src/models/`):** 5 esquemas de Mongoose con validadores semánticos, índices compuestos físicos y transformaciones `toJSON` seguras.
- **Capa de Middlewares (`src/middlewares/`):** Validación criptográfica de tokens (`auth`), control de acceso RBAC (`authorize`), logging estructurado (`logger`) y centralizador de excepciones (`errorHandler`).
- **Capa de Controladores (`src/controllers/`):** Lógica pura de negocio, agregaciones y respuestas HTTP semánticas.
- **Capa de Enrutamiento (`src/routes/`):** Declaración limpia de endpoints con delegación a controladores.

### Modelo de Dominio (5 Colecciones en MongoDB):
```
┌──────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│     Usuario      │         │     Seguimiento     │         │      Anime       │
│ ──────────────── │ 1     * │ ─────────────────── │ *     1 │ ──────────────── │
│ _id              │────────<│ _id                 │>────────│ _id              │
│ nombre           │         │ usuario_id  (FK)    │         │ titulo (Unique)  │
│ email (Unique)   │         │ anime_id    (FK)    │         │ generos [String] │
│ password (Hash)  │         │ estado              │         │ totalEpisodios   │
│ rol (STD/ADMIN)  │         │ episodioActual      │         │ califPromedio    │
└──────────────────┘         └─────────────────────┘         │ totalResenas     │
         │ 1                         ▲                       └──────────────────┘
         │                           │                                ▲
         │                           │                                │
         │                   ┌─────────────────────┐                  │
         │ *                 │       Resena        │ *                │ 1..*
         └──────────────────<│ ─────────────────── │>─────────────────┘
                             │ _id                 │
                             │ usuario_id  (FK)    │         ┌──────────────────┐
                             │ anime_id    (FK)    │         │      Genero      │
                             │ calificacion (1-10) │         │ ──────────────── │
                             │ texto               │         │ _id              │
                             │ spoiler (Boolean)   │         │ nombre (Unique)  │
                             └─────────────────────┘         └──────────────────┘
```

---

## 3. El Proceso de Desarrollo Original por Integrante

### 3.1 Integrante 1 — Autenticación, Usuarios y Seguridad Transversal
**Responsable:** Maxi  
**Archivos desarrollados:**
- `src/config/env.js`, `src/config/db.js`, `src/seed.js`
- `src/models/Usuario.js`
- `src/controllers/auth.controller.js`, `src/controllers/usuario.controller.js`
- `src/routes/auth.routes.js`, `src/routes/usuarios.routes.js`
- `src/middlewares/auth.middleware.js`, `src/middlewares/authorize.middleware.js`, `src/middlewares/errorHandler.middleware.js`, `src/middlewares/logger.middleware.js`

**Hitos del proceso:**
1. **Infraestructura y Persistencia:** Creación del pool de conexión a MongoDB Atlas y script `seed.js` para asegurar la existencia del administrador inicial (`admin@kiroku.com`).
2. **Modelo de Usuario y Privacidad:** Definición de la colección `usuarios` con contraseñas hasheadas mediante `bcrypt` (10 rondas de salt) en un hook `pre('save')`. Configuración de `select: false` y transformación `toJSON` para extirpar la contraseña y metadatos (`__v`) en cualquier respuesta JSON.
3. **Flujo de Autenticación JWT:** Endpoints `POST /api/auth/registro` (forzando siempre rol `STD`) y `POST /api/auth/login` (emisión de token con 24 horas de vigencia).
4. **Seguridad RBAC y Gestión:** Implementación de `GET /api/usuarios/me` y `PUT /api/usuarios/me` (perfil propio con lista blanca de campos permitidos: `nombre`, `avatar`), junto con endpoints administrativos exclusivos para listar usuarios, cambiar roles (`PATCH /api/usuarios/:id/rol`) y eliminar cuentas con salvaguarda contra auto-eliminación del admin y chequeo de dependencias relacionales (`409 Conflict`).

---

### 3.2 Integrante 2 — Catálogo Oficial, Géneros e Ingesta Externa
**Responsable:** Steff  
**Archivos desarrollados:**
- `src/models/Anime.js`, `src/models/Genero.js`
- `src/seedGeneros.js`
- `src/controllers/anime.controller.js`, `src/controllers/genero.controller.js`
- `src/routes/animes.routes.js`, `src/routes/generos.routes.js`

**Hitos del proceso:**
1. **Modelo del Catálogo y Búsqueda Avanzada:** Diseño del modelo `Anime` con índice de texto y endpoints públicos `GET /api/animes` con filtros combinados (`buscar`, `genero`, `estado`, `anio`, `orden`) y paginación determinista por `skip` y `limit`.
2. **Taxonomía Administrable de Géneros:** Creación del modelo `Genero` y su CRUD administrativo (`POST`, `PUT`, `DELETE` en `/api/generos`). Para evitar inconsistencias semánticas, se programó la validación estricta de géneros antes de guardar un anime y la imposibilidad de renombrar o eliminar géneros si existen animes asociados (`409 Conflict`).
3. **Actualización Parcial Atómica:** Endpoint `PATCH /api/animes/:id/generos` utilizando el operador atómico `$addToSet` de MongoDB para incorporar nuevos géneros oficiales sin sobreescribir los ya existentes.
4. **Ingesta Externa Asistida (Jikan / MyAnimeList / AniList):** Endpoint `POST /api/animes/importar-externo` para que el Administrador consulte un anime externo por nombre o ID, traduzca sus datos y lo guarde localmente en MongoDB Atlas, blindando la plataforma ante caídas de APIs de terceros.

---

### 3.3 Integrante 3 — Biblioteca Personal, Reseñas y Analítica
**Responsable:** Jesu  
**Archivos desarrollados:**
- `src/models/Seguimiento.js`, `src/models/Resena.js`
- `src/controllers/seguimiento.controller.js`, `src/controllers/resena.controller.js`, `src/controllers/stats.controller.js`
- `src/routes/seguimientos.routes.js`, `src/routes/resenas.routes.js`, `src/routes/stats.routes.js`

**Hitos del proceso:**
1. **Biblioteca y Seguimientos:** Creación del modelo `Seguimiento` con índice compuesto único `{ usuario_id: 1, anime_id: 1 }` para impedir físicamente que un usuario duplique una serie en su biblioteca. Programación del CRUD por estados (*Viendo, Completado, Pendiente, Abandonado*) y el botón de avance rápido `PATCH /api/seguimientos/:id/incrementar`.
2. **Comunidad y Reseñas:** Modelo `Resena` con índice compuesto único (1 reseña por usuario por anime), nota de 1 a 10 y advertencia booleana de `spoiler`. Lógica de recálculo en el controlador para actualizar `calificacionPromedio` y `totalResenas` en la colección de animes.
3. **Pipelines de Agregación de MongoDB:**
   - **Dashboard Personal (`GET /api/usuarios/me/estadisticas`):** Cálculo de horas vistas con la fórmula `(episodios * 24 min) / 60`, recuento de animes por estado y géneros favoritos utilizando `$lookup`, `$unwind` y `$sortByCount`.
   - **Rankings Comunitarios (`GET /api/stats/rankings`):** Top 10 mejor calificados (promedio de reseñas) y Top 10 más populares (seguimientos en biblioteca).

---

## 4. Las Falencias Detectadas por la Cátedra (Informe 27-10-2026)

La auditoría docente arrojó un total de **8 hallazgos** (3 P1 y 5 P2):

| Ref | Prioridad | Hallazgo Señalado en el Informe | Impacto / Riesgo |
| :---: | :---: | :--- | :--- |
| **01** | **P1** | **Permisos sobreviven a la baja o al cambio de rol:** `authToken` solo validaba el JWT y copiaba `payload.rol` sin consultar la BD. | Un administrador degradado a `STD` o una cuenta borrada seguían operando con sus privilegios antiguos hasta el vencimiento del token (24h). |
| **02** | **P1** | **Editar total de capítulos rompe seguimientos:** `actualizarAnime` permitía reducir `totalEpisodios` sin consultar la biblioteca. | Si un anime de 12 caps se reducía a 6, los usuarios que iban por el cap 10 quedaban con datos inconsistentes (`episodioActual > totalEpisodios`). |
| **03** | **P2** | **Estado 'Completado' impide retroceder solo el episodio:** `aplicarReglas` forzaba `episodioActual = total` si el estado previo era `Completado`. | Si un usuario quería retroceder el capítulo para re-ver la serie, la API respondía 200 pero anulaba silenciosamente su cambio. |
| **04** | **P1** | **Los episodios admitían números fraccionarios:** `totalEpisodios` y `episodioActual` no validaban enteros. | Se podían guardar valores como `2.5` o `12.5` episodios, distorsionando las comparaciones y el modelo de dominio. |
| **05** | **P2** | **La afirmación de "recálculo atómico" en el README:** Se guardaba la reseña y luego se hacía un aggregate + update separado. | No constituía una transacción atómica distribuida. La afirmación teórica era más fuerte que la implementación técnica. |
| **06** | **P2** | **Incrementar episodio puede perder actualizaciones simultáneas:** `incrementarEpisodio` leía en memoria, sumaba `+1` y guardaba. | Dos clics concurrentes desde el cap 4 leían 4 y guardaban 5 (condición de carrera y pérdida de avance). |
| **07** | **P2** | **Errores y rutas inexistentes sin contrato uniforme:** Rutas no montadas devolvían HTML y el error 11000 siempre decía "email". | El frontend recibía respuestas no normalizadas y mensajes engañosos de duplicados para animes, géneros o seguimientos. |
| **08** | **P2** | **Unicidad de título cambia entre alta y edición:** El alta usaba regex case-insensitive, pero la edición solo confiaba en el índice case-sensitive. | Permitía editar un anime a "NARUTO" existiendo "Naruto", rompiendo la coherencia del catálogo. |

---

## 5. Plan de Subsanación: Qué y Cómo se Arregló Cada Hallazgo

### Subsanación 01 (P1): Vigencia de Cuenta y Rol en `auth.middleware.js`
- **Archivo:** `src/middlewares/auth.middleware.js`
- **Modificación:** Se transformó `authToken` a función `async` y se incorporó la consulta a la base de datos tras verificar la firma criptográfica:
  ```javascript
  const usuario = await Usuario.findById(id).select('_id email rol nombre');
  if (!usuario) {
    return res.status(401).json({ mensaje: 'Cuenta no encontrada o dada de baja' });
  }
  req.user = {
    id: String(usuario._id),
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
  };
  ```
- **Efecto:** Si un admin es degradado a `STD`, su siguiente petición protegida consulta su rol real en la base de datos (`STD`) y es rechazado con `403 Forbidden` si intenta acceder a rutas administrativas. Si la cuenta fue borrada, devuelve `401`.

---

### Subsanación 02 (P1): Salvaguarda contra Reducción Incompatible de Capítulos
- **Archivo:** `src/controllers/anime.controller.js`
- **Modificación:** En `actualizarAnime`, al recibir `body.totalEpisodios > 0`, se verifica contra la colección de seguimientos:
  ```javascript
  if (body.totalEpisodios !== undefined && body.totalEpisodios > 0) {
    const Seguimiento = mongoose.model('Seguimiento');
    const incompatible = await Seguimiento.findOne({
      anime_id: id,
      episodioActual: { $gt: body.totalEpisodios }
    });
    if (incompatible) {
      return res.status(409).json({
        error: true,
        mensaje: `No se puede reducir el total a ${body.totalEpisodios} episodios porque existen usuarios con seguimientos en capítulos superiores (ej: cap. ${incompatible.episodioActual})`
      });
    }
  }
  ```
- **Efecto:** Se rechaza la reducción incompatible con código HTTP `409 Conflict`, preservando la integridad de los datos de la biblioteca.

---

### Subsanación 03 (P2): Precedencia al Retroceder Episodio en Biblioteca
- **Archivo:** `src/controllers/seguimiento.controller.js`
- **Modificación:** En `actualizarSeguimiento` y `aplicarReglas`, se detecta si el usuario reduce el episodio sin forzar explícitamente el estado:
  ```javascript
  if (episodioActual !== undefined) {
    seguimiento.episodioActual = episodioActual;
    if (estado === undefined && seguimiento.estado === 'Completado' && total > 0 && episodioActual < total) {
      seguimiento.estado = 'Viendo';
    }
  }
  ```
- **Efecto:** Al retroceder el avance, el estado transiciona coherentemente a `"Viendo"` y no se anula el episodio indicado por el usuario.

---

### Subsanación 04 (P1): Validación de Episodios como Números Enteros
- **Archivos:** `src/models/Anime.js` y `src/models/Seguimiento.js`
- **Modificación:** Se incorporó el validador nativo de Mongoose:
  ```javascript
  // En Anime.js (totalEpisodios y anioEstreno):
  validate: {
    validator: Number.isInteger,
    message: 'El total de episodios debe ser un número entero'
  }

  // En Seguimiento.js (episodioActual):
  validate: {
    validator: Number.isInteger,
    message: 'El episodio actual debe ser un número entero'
  }
  ```
- **Efecto:** Cualquier valor fraccionario (ej. `2.5` o `12.5`) es interceptado por Mongoose y responde `400 Bad Request`.

---

### Subsanación 05 (P2): Recálculo Consistente y Rectificación en Documentación
- **Archivos:** `src/controllers/resena.controller.js` y `README.md`
- **Modificación:**
  1. En `resena.controller.js`: se encapsuló `recalcularAnime()` con `try/catch` y logging de excepciones para garantizar trazabilidad ante fallos.
  2. En `actualizarResena`: se restringió la edición exclusivamente al autor original (`resena.usuario_id.toString() === req.user.id`).
  3. En `README.md`: se reemplazó la afirmación de "recálculo atómico" por **recálculo consistente por agregación**, describiendo el flujo asincrónico real.

---

### Subsanación 06 (P2): Actualización Atómica Concurrente en `+1 Cap`
- **Archivo:** `src/controllers/seguimiento.controller.js`
- **Modificación:** Se reemplazó la mutación en memoria de Node.js por una operación atómica directa en MongoDB con `findOneAndUpdate` y pipeline condicional:
  ```javascript
  const filtro = {
    _id: req.params.id,
    ...(total > 0 ? { episodioActual: { $lt: total } } : {})
  };

  const actualizado = await Seguimiento.findOneAndUpdate(
    filtro,
    [
      {
        $set: {
          episodioActual: { $add: ['$episodioActual', 1] },
          estado: {
            $cond: {
              if: {
                $and: [
                  { $gt: [total, 0] },
                  { $gte: [{ $add: ['$episodioActual', 1] }, total] }
                ]
              },
              then: 'Completado',
              else: {
                $cond: {
                  if: { $eq: ['$estado', 'Pendiente'] },
                  then: 'Viendo',
                  else: '$estado'
                }
              }
            }
          }
        }
      }
    ],
    { new: true, runValidators: true }
  );
  ```
- **Efecto:** Operación indivisible a nivel de motor de base de datos. Peticiones simultáneas avanzan secuencialmente y sin pérdida de datos.

---

### Subsanación 07 (P2): Contrato Uniforme de Errores y Middleware 404
- **Archivos:** `src/app.js` y `src/middlewares/errorHandler.middleware.js`
- **Modificación:**
  1. En `app.js`: se montó el middleware 404 antes de `errorHandler`:
     ```javascript
     app.use((req, res) => {
       res.status(404).json({ error: true, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
     });
     ```
  2. En `errorHandler.middleware.js`: se analiza `error.keyValue` para generar el mensaje de error 11000 según el campo duplicado real:
     - `email`: *"Ya existe un usuario registrado con ese email"*.
     - `titulo`: *"Ya existe un anime registrado con ese título"*.
     - `nombre`: *"Ya existe un registro con ese nombre"*.
     - `usuario_id` + `anime_id`: *"Ya existe un registro para este usuario y anime"*.

---

### Subsanación 08 (P2): Unicidad de Título Case-Insensitive en Edición
- **Archivo:** `src/controllers/anime.controller.js`
- **Modificación:** En `actualizarAnime`, si `body.titulo` está presente:
  ```javascript
  const duplicado = await Anime.findOne({
    _id: { $ne: id },
    titulo: { $regex: new RegExp(`^${escaparRegex(tituloTrim)}$`, 'i') }
  });
  if (duplicado) {
    return res.status(409).json({
      error: true,
      mensaje: `Ya existe otra serie registrada con el título '${tituloTrim}'`,
      animeId: duplicado._id
    });
  }
  ```
- **Efecto:** Se garantiza coherencia exacta entre el alta manual, la edición y la ingesta externa.

---

## 6. Batería de Pruebas y Evidencias de Funcionamiento

A continuación se detallan los casos de prueba ejecutados para comprobar la resolución de cada hallazgo:

### Prueba 1: Revocación Inmediata de Permisos ante Degradación y Baja (Hallazgo 01)
1. **Petición:** `POST /api/auth/login` con credenciales de usuario Admin A. Se obtiene `TOKEN_A`.
2. **Petición:** Con otro Admin B, se degrada a A: `PATCH /api/usuarios/<ID_A>/rol` con `{ "rol": "STD" }`.
3. **Petición de verificación:** Se intenta crear un anime usando el token previo `TOKEN_A`:
   - `POST /api/animes` (Header: `Bearer TOKEN_A`)
   - **Resultado:** `403 Forbidden` (`{ "mensaje": "No tienes permisos para realizar esta operación" }`).
4. **Petición de baja:** Se elimina a un usuario estándar C. Se intenta usar su token previo en `POST /api/seguimientos`:
   - **Resultado:** `401 Unauthorized` (`{ "mensaje": "Cuenta no encontrada o dada de baja" }`).

---

### Prueba 2: Protección contra Reducción Incompatible de Capítulos (Hallazgo 02)
1. Se crea el anime "Frieren" con `totalEpisodios: 28`.
2. Un usuario registra un seguimiento y avanza hasta `episodioActual: 20`.
3. El administrador intenta modificar la serie reduciendo el total a 12 capítulos:
   - `PUT /api/animes/<ID_FRIEREN>` con `{ "totalEpisodios": 12 }`
   - **Resultado:** `409 Conflict`
   - **Cuerpo devuelto:**
     ```json
     {
       "error": true,
       "mensaje": "No se puede reducir el total a 12 episodios porque existen usuarios con seguimientos en capítulos superiores (ej: cap. 20)"
     }
     ```

---

### Prueba 3: Retroceso Coherente de Avance desde 'Completado' (Hallazgo 03)
1. Se tiene un anime de 12 episodios con seguimiento en estado `"Completado"` y `episodioActual: 12`.
2. El usuario envía una actualización parcial indicando que desea retroceder al capítulo 3 para re-ver la serie:
   - `PUT /api/seguimientos/<ID_SEGUIMIENTO>` con `{ "episodioActual": 3 }`
   - **Resultado:** `200 OK`
   - **Cuerpo devuelto:**
     ```json
     {
       "_id": "...",
       "episodioActual": 3,
       "estado": "Viendo"
     }
     ```
   - El estado transicionó automáticamente a `"Viendo"` y el episodio se preservó en 3.

---

### Prueba 4: Rechazo de Episodios con Números Fraccionarios (Hallazgo 04)
1. Se intenta crear un anime con `totalEpisodios: 12.5`:
   - `POST /api/animes` con `{ "titulo": "Anime Decimal", "totalEpisodios": 12.5, ... }`
   - **Resultado:** `400 Bad Request` (`{ "mensaje": "El total de episodios debe ser un número entero" }`).
2. Se intenta actualizar un seguimiento con `episodioActual: 4.7`:
   - `PUT /api/seguimientos/<ID>` con `{ "episodioActual": 4.7 }`
   - **Resultado:** `400 Bad Request` (`{ "mensaje": "El episodio actual debe ser un número entero" }`).

---

### Prueba 5: Incremento Concurrente Atómico (`+1 Cap`) (Hallazgo 06)
1. Se parte de un seguimiento en `episodioActual: 4` (total de 12).
2. Se simulan dos peticiones `PATCH /api/seguimientos/<ID>/incrementar` enviadas de manera concurrente en el mismo milisegundo.
3. **Resultado:**
   - Ambas peticiones son procesadas de manera indivisible por MongoDB.
   - El valor resultante en base de datos es exactamente **6**.
   - No se produjo pérdida de actualización ni condición de carrera.

---

### Prueba 6: Contrato Uniforme de Errores y Rutas 404 (Hallazgo 07)
1. **Ruta inexistente:** `GET /api/ruta-inexistente`
   - **Resultado:** `404 Not Found` (JSON uniforme):
     ```json
     {
       "error": true,
       "mensaje": "Ruta no encontrada: GET /api/ruta-inexistente"
     }
     ```
2. **Duplicado de Reseña:** Un usuario intenta crear una segunda reseña para el mismo anime:
   - `POST /api/resenas`
   - **Resultado:** `409 Conflict` (o 400 según filtro previo):
     ```json
     {
       "mensaje": "Ya existe un registro para este usuario y anime"
     }
     ```
   - El error ya no menciona engañosamente *"email"*.

---

### Prueba 7: Unicidad Case-Insensitive en Edición de Anime (Hallazgo 08)
1. Existe en el catálogo el anime con título `"Naruto"`.
2. Se toma otro anime existente (ej. `"Bleach"`) y se intenta editar su título a `"NARUTO"`:
   - `PUT /api/animes/<ID_BLEACH>` con `{ "titulo": "NARUTO" }`
   - **Resultado:** `409 Conflict`
   - **Cuerpo devuelto:**
     ```json
     {
       "error": true,
       "mensaje": "Ya existe otra serie registrada con el título 'NARUTO'",
       "animeId": "<ID_DE_NARUTO_ORIGINAL>"
     }
     ```

---

## 7. Conclusión Técnica y Preparación para la Defensa Oral

Con las 8 correcciones implementadas y verificadas:
1. **Seguridad y Control de Acceso:** La arquitectura JWT garantiza consistencia inmediata entre el estado real de la cuenta y sus privilegios en tiempo de ejecución.
2. **Consistencia de Dominio:** Los episodios se restringen rigurosamente a números enteros y el catálogo no puede romper estados preexistentes de las bibliotecas de los usuarios.
3. **Concurrencia:** Las operaciones críticas como el avance rápido de capítulos se resuelven atómicamente a nivel de motor de base de datos.
4. **Contrato de API REST:** Se normalizó el formato de respuesta para rutas 404 y conflictos de índices únicos compuestos.

El backend se encuentra en estado óptimo para su defensa oral y validación en vivo frente a la mesa examinadora.

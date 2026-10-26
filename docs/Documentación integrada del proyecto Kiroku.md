# Documentación integrada del proyecto Kiroku

Backend de la Plataforma de Seguimiento y Reseñas de Anime · Programación III (Comisión 3-601 TM) · INSPT · Maxi (Módulo 1), Steff (Módulo 2) y Jesu (Módulo 3) · Octubre de 2026

## 1. Resumen

Kiroku es una API REST (Node.js, Express y MongoDB con Mongoose) para llevar el seguimiento personal de series de anime, publicar reseñas y consultar estadísticas. El catálogo de series es propio y vive en MongoDB. Las APIs externas (Jikan/MyAnimeList y AniList) se usan solo como asistente de carga para el administrador.

Este documento reúne los tres módulos del grupo y el registro de la integración: cómo se unieron las ramas, qué se corrigió al hacerlo y qué pruebas se hicieron sobre el conjunto.

| Módulo | Integrante | Contenido |
| --- | --- | --- |
| 1 | Maxi | Autenticación, JWT, usuarios, roles y middlewares |
| 2 | Steff | Catálogo de animes, búsqueda, filtros e importación externa |
| 3 | Jesu | Biblioteca personal, reseñas y estadísticas |

**Estado:** los tres módulos están integrados en la rama `feature/visualizacion-steff` y probados en conjunto contra MongoDB Atlas. Los pendientes (seed del administrador, pull request a `main`, README y algunas pruebas) están en la sección 9.

## 2. Arquitectura

Arquitectura en capas con ES Modules, tomada del proyecto de referencia `recetorium-backend-kilo`.

| Carpeta | Contenido |
| --- | --- |
| `src/app.js` | Punto de entrada: CORS, JSON, logger, rutas y manejo de errores. El servidor arranca recién cuando MongoDB conecta |
| `src/config` | `env.js` (valida variables de entorno) y `db.js` (conexión con eventos) |
| `src/models` | `Usuario`, `Anime`, `Seguimiento` y `Resena` |
| `src/controllers` | `auth`, `usuario`, `anime`, `seguimiento`, `resena` y `stats` |
| `src/routes` | `authRoutes`, `usuariosRoutes`, `animes.routes`, `seguimientos.routes`, `resenas.routes` y `stats.routes` |
| `src/middlewares` | `auth`, `authorize`, `errorHandler` y `logger` |

Orden en `app.js`: CORS, `express.json`, logger, rutas y, al final, el `errorHandler`. Las estadísticas personales se montan en `/api/usuarios/me/estadisticas` antes que `/api/usuarios`.

### Modelo de datos

| Colección | Relaciones | Índices |
| --- | --- | --- |
| `usuarios` | — | `email` único |
| `animes` | — | `titulo` único, de texto sobre `titulo` y `sinopsis`, y sparse sobre `externalId` |
| `seguimientos` | `usuario_id` → Usuario, `anime_id` → Anime | Compuesto único `(usuario_id, anime_id)` |
| `resenas` | `usuario_id` → Usuario, `anime_id` → Anime | Compuesto único `(usuario_id, anime_id)` |

Los campos `calificacionPromedio` y `totalResenas` de `animes` están desnormalizados: los recalcula el módulo de reseñas cada vez que una reseña se crea, edita o borra.

### Seguridad transversal

El token JWT lleva el ID del usuario como `sub` y el rol como dato propio. `authToken` lo verifica y deja `req.user = { id, rol }` (401 si falta o es inválido). `authorize('ADMIN')` recibe los roles sueltos y responde 403 si el rol no alcanza.

### Variables de entorno

El servidor lee un `.env` en la raíz, que no se versiona. `env.js` valida al arrancar:

| Variable | Regla |
| --- | --- |
| `MONGO_URI` (o `MONGODB_URI`) | Obligatoria |
| `JWT_SECRET` | Obligatoria, mínimo 32 caracteres y sin palabras de ejemplo. Debe ser el mismo en los tres equipos |
| `JWT_EXPIRY` | Formato como `24h` o `7d` (por defecto `24h`) |
| `PORT` | Entero entre 1 y 65535 (por defecto 3000) |

Para levantar el proyecto: `npm install`, crear el `.env` y `npm run dev`. En la consola deben aparecer `MongoDB conectado` y `API Kiroku escuchando`.

## 3. Módulo 1: Autenticación y usuarios (Maxi)

**Qué hace:** registro (el rol siempre queda `STD`), login con bcrypt y emisión de JWT, perfil, edición del perfil propio (solo `nombre` y `avatar`), y listado, consulta y baja de usuarios solo para ADMIN.

**Decisiones de seguridad:**

- Contraseñas hasheadas con bcrypt (10 rondas) en el hook `pre('save')`. El campo tiene `select: false` y `toJSON` lo elimina.
- El rol no se elige al registrarse y el perfil rechaza cualquier campo que no sea `nombre` o `avatar`, por lo que nadie puede subirse el rol.
- El login devuelve el mismo 401 si el email no existe o la clave es incorrecta.
- El `errorHandler` traduce errores de Mongoose (400 y 409) y oculta el detalle de los errores 5xx.
- El logger registra fecha, IP, método y ruta, sin el query string.

**Pruebas realizadas (28 pruebas más un flujo integral):**

| Grupo | Pruebas | Resultado |
| --- | --- | --- |
| Registro y login | Registro válido, email repetido (409), email inválido, clave corta, cuerpo vacío, intento de registrarse como ADMIN (queda `STD`), login correcto, clave incorrecta, email inexistente, cuerpo vacío y email en mayúsculas | Aprobadas (11) |
| Perfil y edición | Perfil con token, sin token y con token inventado (401), edición del nombre, intento de cambiar el rol (400), cuerpo vacío y sin cuerpo (400) | Aprobadas (7) |
| Rutas de administración | Listado, consulta y borrado con token ADMIN, STD y sin token (200, 403, 401); ID mal formado (400); borrado repetido (404) | Aprobadas (10) |
| Flujo integral | Dos usuarios nuevos y un administrador: un usuario común intenta borrar a otro (403), el admin verifica que sigue existiendo, lo elimina (204) y comprueba que ya no está (404) | Aprobado |

## 4. Módulo 2: Catálogo de animes (Steff)

**Qué hace:** CRUD del catálogo, buscador, filtros combinados, orden, paginación e importación asistida desde APIs externas.

**Modelo `Anime`:** `titulo` (único), `tituloOriginal`, `sinopsis`, `generos` (arreglo), `totalEpisodios` (0 o más; 0 indica emisión o total indefinido), `estadoEmision` (`En emisión`, `Finalizado` o `Por estrenar`), `imagenPortada` (URL http o https), `anioEstreno` (1960 a 2035), `calificacionPromedio`, `totalResenas` y `externalId`.

**Consulta:** `GET /api/animes` acepta `buscar` (título y título original, sin distinguir mayúsculas), `genero`, `estado`, `anio`, `orden` (`recientes`, `calificacion`, `titulo`, `episodios`, `antiguos`), `pagina` y `limite` (máximo 50). El filtro por estado se llama `estado`, no `estadoEmision`.

**Importación externa** (`POST /api/animes/importar-externo` con `malId` o `busqueda`):

- Consulta Jikan y, si falla por red o servidor, cae a AniList (GraphQL, sin clave), que también devuelve el ID de MyAnimeList. Timeout de 8 segundos.
- Códigos: 201 (importado), 400 (faltan datos o no pasa la validación), 404 (sin resultados), 409 (ya existe), 503 (ambas fuentes caídas) y 504 (timeout).
- Los géneros se traducen con un diccionario propio y las sinopsis con el endpoint público de Google Translate. Si el traductor falla, la sinopsis se guarda en inglés sin romper la importación.
- Jikan resultó inalcanzable desde el entorno de desarrollo, y el respaldo con AniList permitió completar la carga.

**Reglas de integridad:**

- Alta, edición, baja e importación son solo para ADMIN; la lectura es pública.
- El `PUT` solo acepta `titulo`, `tituloOriginal`, `sinopsis`, `generos`, `totalEpisodios`, `estadoEmision`, `imagenPortada` y `anioEstreno`. Cualquier otro campo da 400, y un título repetido da 409.
- No se puede borrar un anime que tenga seguimientos o reseñas asociados (409, con las cantidades). Se eligió bloquear en lugar de borrar en cascada para que un error del administrador no destruya bibliotecas ni reseñas de los usuarios.

## 5. Módulo 3: Biblioteca, reseñas y estadísticas (Jesu)

**Seguimientos.** Cada usuario arma su biblioteca con un estado (`Viendo`, `Completado`, `Pendiente` o `Abandonado`) y un episodio actual. Reglas de coherencia:

1. No se puede superar el total de episodios del anime (si el total es mayor a 0).
2. Si el estado pasa a `Completado`, el episodio actual pasa a ser el total.
3. Si el episodio llega al total, el estado pasa solo a `Completado`.

Un mismo anime no puede estar dos veces en la biblioteca (índice compuesto único). `PATCH /:id/incrementar` suma un episodio y, si estaba en `Pendiente`, pasa a `Viendo`.

**Reseñas.** Nota de 1 a 10, texto de hasta 2000 caracteres y marca de spoiler. Una sola reseña por usuario y anime. El usuario sale siempre del token, nunca del cuerpo. La lista pública de reseñas muestra al autor solo con nombre y avatar. Cada alta, edición o baja recalcula el anime con un pipeline de agregación: `$match`, `$group`, `$avg` y `$sum`, seguido de un `$set`.

**Estadísticas.**

- Personales: episodios vistos, horas (episodios por 24 minutos fijos), cantidad por estado (`$group`) y los cinco géneros favoritos (`$lookup`, `$unwind` y `$sortByCount`).
- Rankings públicos: los 10 animes mejor puntuados (con al menos una reseña) y los 10 más seguidos.

Seguimientos y reseñas se pueden modificar o borrar por su autor o por un ADMIN (moderación).

## 6. Mapa completo de endpoints

| Método | Ruta | Acceso | Módulo | Éxito |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/registro` | Público | 1 | 201 |
| POST | `/api/auth/login` | Público | 1 | 200 |
| GET | `/api/auth/perfil` | Token | 1 | 200 |
| GET | `/api/usuarios` | ADMIN | 1 | 200 |
| GET | `/api/usuarios/me` | Token | 1 | 200 |
| PUT | `/api/usuarios/me` | Token | 1 | 200 |
| GET | `/api/usuarios/:id` | ADMIN | 1 | 200 |
| DELETE | `/api/usuarios/:id` | ADMIN | 1 | 204 |
| GET | `/api/animes` | Público | 2 | 200 |
| GET | `/api/animes/:id` | Público | 2 | 200 |
| POST | `/api/animes` | ADMIN | 2 | 201 |
| PUT | `/api/animes/:id` | ADMIN | 2 | 200 |
| DELETE | `/api/animes/:id` | ADMIN | 2 | 200 (409 si está en uso) |
| POST | `/api/animes/importar-externo` | ADMIN | 2 | 201 |
| GET | `/api/seguimientos` | Token (solo los propios) | 3 | 200 |
| POST | `/api/seguimientos` | Token | 3 | 201 |
| PUT | `/api/seguimientos/:id` | Autor o ADMIN | 3 | 200 |
| PATCH | `/api/seguimientos/:id/incrementar` | Autor o ADMIN | 3 | 200 |
| DELETE | `/api/seguimientos/:id` | Autor o ADMIN | 3 | 204 |
| GET | `/api/resenas/anime/:animeId` | Público | 3 | 200 |
| POST | `/api/resenas` | Token | 3 | 201 |
| PUT | `/api/resenas/:id` | Autor o ADMIN | 3 | 200 |
| DELETE | `/api/resenas/:id` | Autor o ADMIN | 3 | 204 |
| GET | `/api/usuarios/me/estadisticas` | Token | 3 | 200 |
| GET | `/api/stats/rankings` | Público | 3 | 200 |

## 7. Integración de las ramas

1. **Merge de la rama de Maxi** (`feature/visualizacion-maxi`) en la rama de Steff. Hubo conflictos de tipo add/add en `app.js`, `config/env.js` y `config/db.js`. Se conservaron las versiones de Maxi y en `app.js` se volvió a agregar el montaje del catálogo.
2. **Primer arranque.** El servidor rechazó el secreto de ejemplo del esqueleto, porque `env.js` exige un `JWT_SECRET` propio de al menos 32 caracteres. Se generó uno nuevo para el `.env` local.
3. **Protección del catálogo.** Se agregaron `authToken` y `authorize('ADMIN')` a las rutas de alta, edición, baja e importación. Las de lectura siguen públicas.
4. **Merge de la rama de Jesu** (`feature/implementacion-jesu`). Git lo resolvió sin conflictos, pero `app.js` quedó con los `app.use` de sus rutas sin los `import` correspondientes, y el servidor falló con un `ReferenceError`. Se completó `app.js` con los imports de `seguimientos`, `resenas` y `stats`, y se montó `estadisticasPersonalesRouter`.
5. **Ajustes al catálogo hechos durante la integración:**

| Ajuste | Problema | Solución |
| --- | --- | --- |
| Regex escapado | `?buscar=(` devolvía 500 y `?buscar=.` coincidía con todo | `escaparRegex` en buscador, filtro de género y chequeo de duplicados |
| URL de portada | Aceptaba cualquier texto | Validador http o https en el modelo |
| Borrado seguro | Borrar un anime en uso dejaba seguimientos y reseñas huérfanos, y rompía las reglas de Jesu | 409 con las cantidades de seguimientos y reseñas |
| `PUT` acotado | Podía pisar `calificacionPromedio` y `totalResenas` | Lista blanca de campos, 400 para el resto y 409 por título repetido |
| Errores 500 | Devolvían `error.message` | Se quitó el detalle de los 500 y se mantuvo en las validaciones 400 |

6. **Limpieza de datos.** Se borraron los datos y las cuentas de prueba, y se reemplazó la contraseña de la cuenta de administrador.

## 8. Pruebas de integración

Herramienta: Thunder Client contra el servidor local conectado a MongoDB Atlas. Se usaron tres tipos de token (ADMIN, usuario común y sin token). El criterio de aprobación fue que el código HTTP coincidiera con el esperado y que ninguna respuesta incluyera contraseñas.

### 8.1 Catálogo protegido

| Operación | Sin token | Token STD | Token ADMIN |
| --- | --- | --- | --- |
| Listar y ver ficha | 200 | 200 | 200 |
| Crear | 401 | 403 | 201 |
| Editar | 401 | 403 | 200 |
| Importar desde API externa | 401 | 403 | 201 (o 409 si ya existía) |
| Eliminar | 401 | 403 | 200 |

Tras el 403 se verificó que el anime seguía existiendo, y tras el borrado del administrador, que la consulta daba 404.

### 8.2 Ajustes del catálogo

| Ajuste | Prueba | Resultado |
| --- | --- | --- |
| Regex | `buscar=(`, `buscar=.` y `genero=(` | 200 con 0 resultados |
| Regex | `buscar=naruto` | 200 con el anime |
| Regex | Crear un título con paréntesis, repetirlo y enviar `{}` | 201, 409 y 400 |
| URL de portada | Texto suelto y URL `ftp` | 400 en ambas |
| URL de portada | URL https al crear y al editar; texto inválido al editar | 201, 200 y 400 |
| `PUT` acotado | Enviar `calificacionPromedio`, `totalResenas`, ambos junto a un campo válido, o cuerpo vacío | 400 en las cuatro |
| `PUT` acotado | Título repetido y estado fuera del enum | 409 y 400 |
| `PUT` acotado | Editar la sinopsis | 200, con `calificacionPromedio` y `totalResenas` sin cambios |
| Borrado seguro | ID mal formado, ID inexistente y token STD | 400, 404 y 403 |
| Borrado seguro | Anime sin dependencias | 200 y luego 404 |

### 8.3 Integración con el Módulo 3

Se usaron tres cuentas (un administrador y dos usuarios comunes) y un anime de 12 episodios creado por el administrador.

| # | Prueba | Resultado |
| --- | --- | --- |
| 1 | Agregar el anime a la biblioteca (estado Viendo, episodio 8) | 201 |
| 2 | Repetir el mismo anime | 400 |
| 3 | Agregar sin token | 401 |
| 4 | Ver la biblioteca propia | 200, con el anime |
| 5 | Filtrar por `estado=Viendo` | 200, con el anime |
| 6 | Filtrar por `estado=Completado` | 200, lista vacía |
| 7 | Incrementar un episodio | 200 (de 8 a 9) |
| 8 | Poner el episodio 99 (el anime tiene 12) | 400 |
| 9 | Poner el episodio 12 | 200, y el estado pasa solo a Completado |
| 10 | Otro usuario edita un seguimiento ajeno | 403 |
| 11 | Otro usuario consulta su biblioteca | 200, vacía |
| 12 | Publicar una reseña con nota 9 | 201 |
| 13 | Publicar con nota 11 | 400 |
| 14 | Publicar una segunda reseña del mismo anime | 400 |
| 15 | Publicar sin token | 401 |
| 16 | Listar reseñas del anime sin token | 200, con el autor solo con nombre y avatar |
| 17 | Consultar el anime tras la reseña | `calificacionPromedio` 9 y `totalResenas` 1 |
| 18 | El autor edita nota y texto | 200 |
| 19 | Otro usuario publica su propia reseña | 201 |
| 20 | Estadísticas personales con biblioteca | 200 |
| 21 | Estadísticas personales sin biblioteca | 200, con valores vacíos |
| 22 | Estadísticas personales sin token | 401 |
| 23 | Rankings públicos | 200 |
| 24 | El administrador intenta borrar el anime con seguimientos | 409 |
| 25 | Un usuario borra su propia reseña | 204 |
| 26 | El administrador borra la reseña de otro (moderación) | 204 |
| 27 | Consultar el anime sin reseñas | `calificacionPromedio` 0 y `totalResenas` 0 |
| 28 | Quitar un seguimiento propio y listar la biblioteca | 204 y lista vacía |
| 29 | Borrar el anime mientras queda un seguimiento del administrador | 409 |
| 30 | El administrador quita su seguimiento | 204 |
| 31 | El administrador borra el anime y lo consulta de nuevo | 200 y luego 404 |
| 32 | Borrar una reseña de prueba de otro anime | 204, y el promedio de ese anime vuelve a 0 |

Las pruebas 17, 27 y 32 confirman que el recálculo de `calificacionPromedio` y `totalResenas` funciona al crear y al borrar. Las pruebas 24 y 29 muestran el borrado seguro actuando con datos reales.

### 8.4 Cuentas de prueba

Todas las cuentas de prueba se eliminaron con el administrador (204 en cada baja), y el listado final quedó con la cuenta de administrador y la de Jesu. Se verificó que la clave anterior del administrador dejó de funcionar (401) y que la nueva permite iniciar sesión (200).

## 9. Hallazgos y pendientes

Los puntos marcados como *por lectura de código* no se probaron en ejecución.

### Hallazgos

| Módulo | Hallazgo | Recomendación |
| --- | --- | --- |
| Todos | Las respuestas de error no tienen un formato único: Módulos 1 y 3 devuelven `{ mensaje }`, y el 2 devuelve `{ error, mensaje }` | Unificar el formato antes de integrar el frontend |
| 1 | Falta el script de seed que pide el plan: el administrador se creó cambiando el rol a mano | Agregar `npm run seed` |
| 1 | El token de un usuario eliminado sigue siendo válido hasta que vence, porque `authToken` no consulta la base. Es normal en JWT, pero los controladores del Módulo 3 podrían crear datos para un usuario inexistente (*por lectura de código*) | Validar que el usuario exista en las operaciones de escritura |
| 1 | El 409 del `errorHandler` siempre menciona el email, aunque el duplicado sea de otra colección | Hacer el mensaje genérico |
| 1 | `middlewares.js` y `usuariosController.js` solo re-exportan por compatibilidad | Borrarlos si nada los importa |
| 2 | El índice de texto sobre `titulo` y `sinopsis` no se usa, porque el buscador consulta con `$regex` | Pasar el buscador a `$text` o justificar el índice en la defensa |
| 2 | Los `POST` devuelven `{ mensaje, anime }` mientras que seguimientos y reseñas devuelven el documento directo | Acordar un formato para el frontend |
| 2 | AniList devuelve cada temporada como entrada propia, por lo que algunos animes muestran los episodios de su primera temporada. Las series en emisión quedan con `totalEpisodios: 0` | Documentarlo, y editar manualmente los que importen |
| 3 | Duplicar un seguimiento o una reseña responde 400, mientras que el resto del proyecto usa 409 para duplicados | Cambiar a 409 |
| 3 | Varios `catch` devuelven `error.message` en errores 500 (*por lectura de código*) | Mensajes genéricos o usar el `errorHandler` |
| 3 | `GET /api/resenas/anime/:animeId` con un ID mal formado probablemente da 500 en lugar de 400 (*por lectura de código*) | Validar el ID |
| 3 | Las horas vistas suman el episodio actual de todos los estados (incluido Abandonado) con 24 minutos fijos | Dejarlo documentado como decisión |
| Entorno | `npm install` avisa del script de instalación de `bcrypt` sin aprobar y de 3 vulnerabilidades (2 altas y 1 crítica) | Revisarlas entre los tres, sin usar `npm audit fix --force` |

### Pruebas pendientes

- Que un usuario intente editar la reseña de otro (403), y el promedio al editar una reseña y con dos reseñas a la vez.
- Los casos de error del Módulo 3 que no se ejecutaron: ID mal formado en reseñas y en seguimientos.
- Cobertura del flujo de importación con `malId` desde el entorno final.

### Pendientes del proyecto

- Pull request de la rama integrada a `main`, acordado entre los tres.
- README del grupo con las secciones de cada módulo.
- Actualizar la colección de pruebas de Jesu: ahora las rutas de alta y baja de animes exigen token ADMIN, y el ID del anime creado viene en `anime._id`.
- Seed del administrador y cambio de las credenciales de prueba antes de cualquier despliegue.
- Frontend y defensa oral.

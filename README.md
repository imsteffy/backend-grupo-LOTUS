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

Estructurado bajo el patrón modular por capas visto en clase con el Prof. Cimino (**`recetorium-backend-kilo`**):

```text
kiroku-backend/
├── src/
│   ├── app.js                 # Punto de entrada Express, middlewares y encendido
│   ├── config/                # env.js (variables de entorno) y db.js (conexión MongoDB)
│   ├── models/                # Usuario.js, Anime.js, Seguimiento.js, Resena.js
│   ├── controllers/           # auth, usuario, anime, seguimiento, resena, stats
│   ├── routes/                # Enrutadores limpios con express.Router()
│   └── middlewares/           # auth, authorize (roles), errorHandler y logger
├── .env.example
├── package.json
└── README.md
```

---

## 🌐 Ecosistema del Proyecto (Frontend Desacoplado)

El frontend de **Kiroku** se desarrolla de manera independiente en un repositorio separado, comunicándose con esta API REST exclusivamente mediante peticiones HTTP asíncronas con respuestas en formato JSON e interceptores para el token `Authorization: Bearer <token>`.

---

## 📄 Especificación Completa de la Propuesta

Para conocer el detalle técnico exhaustivo presentado para la evaluación del Segundo Parcial:

* 📘 **Propuesta Técnica Completa:** [PROPUESTA.md](./PROPUESTA.md)

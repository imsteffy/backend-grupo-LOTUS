# Propuesta de Proyecto — API REST de Seguimiento de Anime 

## Descripción

El proyecto consiste en desarrollar una **API REST para el seguimiento y reseñas de anime**. La API permitirá que los usuarios gestionen su experiencia personal con diferentes títulos, registrando su progreso, estado de visualización, puntuación, reseñas y favoritos.

Además, el sistema permitirá consultar información general de los anime, sus puntuaciones promedio, reseñas y estadísticas como los más vistos, mejor puntuados o más reseñados.

## Problemática

Los usuarios que consumen varios anime necesitan una forma organizada de llevar un registro de qué títulos están viendo, cuáles terminaron, cuáles tienen pendientes y en qué episodio se encuentran. También resulta útil poder registrar opiniones y consultar las valoraciones de otros usuarios.

## Propuesta de solución

Se propone desarrollar una **API REST** que centralice y gestione toda esta información, permitiendo realizar operaciones sobre usuarios, anime, seguimientos y reseñas.

La API funcionará como intermediaria entre la aplicación y la base de datos, exponiendo los recursos mediante peticiones HTTP y respuestas en formato JSON.

## Estructura del proyecto

El proyecto estará dividido en **dos repositorios independientes**:

- **Backend:** desarrollo de la API REST utilizando Node.js, Express y MongoDB. Se encargará de la lógica de negocio, gestión de datos, autenticación y exposición de los endpoints.
- **Frontend:** aplicación independiente encargada de la interfaz visual y de consumir los servicios proporcionados por la API.

En esta etapa, la propuesta se centra exclusivamente en el desarrollo del **backend y la API REST**.

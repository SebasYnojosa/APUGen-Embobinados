# APU-Gen Embobinados ⚡️⚙️

Sistema integral para la gestión y cálculo de Análisis de Precios Unitarios (APUs) orientado a talleres de rebobinado de motores y reparación de componentes. 

Este repositorio es un **monorepo** que contiene tanto el motor financiero (Backend en Spring Boot) como la interfaz de usuario (Frontend en React).

---

## 🚀 Stack Tecnológico

El proyecto está dividido en dos aplicaciones principales que se comunican mediante una API RESTful.

### Backend (API REST & Motor de Cálculo)
* **Lenguaje:** [Java 21](https://jdk.java.net/21/) (Uso intensivo de `records` y características modernas)
* **Framework:** [Spring Boot 3.x](https://spring.io/projects/spring-boot)
* **Persistencia:** Spring Data JPA / [Hibernate 6](https://hibernate.org/)
* **Base de Datos:** [PostgreSQL 16](https://www.postgresql.org/)
* **Características:** Cálculos con `BigDecimal` (`RoundingMode.HALF_UP`), búsquedas avanzadas con SQL nativo (`unaccent`) y manejo de errores global unificado.

### Frontend (Interfaz de Usuario)
* **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Tipado espejo del backend)
* **Build Tool:** [Vite](https://vitejs.dev/) (Rendimiento ultrarrápido)
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
* **Enrutamiento y HTTP:** React Router DOM & Axios (con interceptores globales).
* **Linter:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

---

## 📋 Requisitos Previos

Para levantar el proyecto completo en tu entorno local, asegúrate de tener:
* **Java Development Kit (JDK) 21**
* **Node.js** (Versión 18 o superior)
* **Docker y Docker Compose** (para levantar PostgreSQL)

---

## 🛠️ Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/apu-gen-monorepo.git
cd apu-gen-monorepo
```

### 2. Levantar la Base de Datos (Docker)
En la raíz del proyecto, ejecuta el contenedor para iniciar PostgreSQL 16:
```bash
docker compose up -d
```
> **Importante:** Para que el buscador avanzado funcione ignorando acentos, accede a la base de datos `embobinados_apu` (vía pgAdmin o CLI) y ejecuta:
> ```sql
> CREATE EXTENSION IF NOT EXISTS unaccent;
> ```

### 3. Levantar el Backend (Spring Boot)
Abre una terminal, entra a la carpeta del backend y ejecuta el servidor mediante Maven Wrapper. El backend correrá en el puerto `8080`.
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Levantar el Frontend (React)
Abre otra terminal, entra a la carpeta del frontend, instala las dependencias e inicia Vite. El frontend estará disponible en `http://localhost:5173`.
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Arquitectura del Monorepo

```text
apu-gen-monorepo/
├── docker-compose.yaml     # Orquestación de contenedores (Base de datos)
├── .gitignore              # Reglas globales de Git
├── backend/                # ⚙️ APP SPRING BOOT
│   ├── src/main/java/...   # Lógica de negocio (Controllers, Services, Entities)
│   ├── pom.xml             # Dependencias de Java
│   └── mvnw                # Maven Wrapper
└── frontend/               # ⚡️ APP REACT
    ├── src/                # Vistas, Componentes, Hooks y Servicios
    ├── package.json        # Dependencias de Node.js
    └── vite.config.ts      # Configuración del empaquetador
```

---

## 🔌 Características de la Integración

* **CORS Pre-configurado:** El backend permite automáticamente peticiones seguras desde `http://localhost:5173`.
* **Manejo de Errores Transparente:** Cualquier error en el backend (ej. violaciones de llaves foráneas, IDs no encontrados) se envía como un JSON estructurado que el frontend intercepta y muestra de forma amigable al usuario.
* **Cálculos Centralizados:** Toda la lógica de márgenes de utilidad, leyes sociales y depreciación se calcula en la capa de servicios de Spring Boot, el frontend solo renderiza el resultado final (`ApuResponseDTO`).

## 📜 Comandos Útiles de Desarrollo

**Frontend (`/frontend`):**
* `npm run dev`: Servidor de desarrollo.
* `npm run build`: Transpila y minifica para producción.
* `npm run lint`: Ejecuta el linter ultrarrápido Oxlint.

**Backend (`/backend`):**
* `./mvnw clean install`: Limpia y compila el proyecto Java.
* `./mvnw test`: Ejecuta la suite de pruebas unitarias.
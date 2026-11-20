# ==========================================
# ETAPA 1: Compilación con Maven y JDK 21
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copiar Maven Wrapper y pom.xml primero para aprovechar la caché de Docker
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Normalizar saltos de línea (por si el repo viene de Windows CRLF) y dar permisos
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Descargar dependencias
RUN ./mvnw dependency:go-offline -B

# Copiar código fuente y empaquetar el JAR
COPY src src
RUN ./mvnw clean package -DskipTests -B

# ==========================================
# ETAPA 2: Runtime liviano con JRE 21
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Límite de memoria adecuado para el plan gratuito de Render (512 MB RAM)
ENTRYPOINT ["java", "-Xmx384m", "-jar", "/app/app.jar"]

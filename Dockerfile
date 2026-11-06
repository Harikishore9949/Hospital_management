# Multi-stage Dockerfile for Spring Boot 3 (Java 21)
# Stage 1: Build JAR
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper & pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw

# Copy source and build jar skipping tests
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create upload directory for medical docs
RUN mkdir -p uploads/medical-docs

# Copy packaged jar from builder
COPY --from=builder /app/target/My_first_project-0.0.1-SNAPSHOT.jar app.jar

# Render assigns dynamic PORT environment variable
ENV PORT=8089
EXPOSE 8089

ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -jar app.jar --server.port=${PORT:-8089}"]


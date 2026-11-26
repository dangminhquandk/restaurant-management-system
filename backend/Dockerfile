# =====================================================================
# Stage 1: Build Spring Boot Executable JAR (Multi-arch amd64/arm64 Alpine)
# =====================================================================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q package -DskipTests

# =====================================================================
# Stage 2: Hardened Non-Root Alpine JRE Runtime
# =====================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S rms && adduser -S rms -G rms

COPY --from=build /workspace/target/rms-backend-*.jar /app/app.jar
RUN chown -R rms:rms /app

ENV SERVER_PORT=8080 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=8 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

USER rms:rms
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]

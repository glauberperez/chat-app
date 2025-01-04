LABEL authors="gperez"
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/chat-app-0.0.1-SNAPSHOT.jar app.jar
CMD ["java", "-jar", "app.jar"]
EXPOSE 8080

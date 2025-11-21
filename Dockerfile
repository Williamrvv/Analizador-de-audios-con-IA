# Dockerfile

# =========================================================================
# 1. ETAPA DE CONSTRUCCIÓN (BUILD STAGE)
#    Propósito: Instalar Node.js, dependencias, y ejecutar 'esbuild'.
# =========================================================================
FROM node:20-alpine AS build

# 1. Definir el argumento de construcción para la clave de API.
#    Este valor se pasará desde el comando 'docker build'.
ARG GEMINI_API_KEY

WORKDIR /app

# 2. Copia e instala las dependencias (optimiza el caché de Docker)
COPY package*.json ./
RUN npm install

# 3. Copia el resto de los archivos fuente
COPY . .

# 4. Construcción del proyecto React usando 'npm run build'
#    - RUN mkdir -p dist && cp index.html dist/: Crea la carpeta 'dist' y copia index.html.
#    - API_KEY=${GEMINI_API_KEY}: Inyecta el valor de la clave de API como una variable de entorno
#      llamada 'API_KEY' *antes* de ejecutar el script 'npm run build'.
#    - npm run build: Ejecuta tu script de esbuild, el cual utiliza la variable API_KEY.
RUN mkdir -p dist && cp index.html dist/ && \
    API_KEY=${GEMINI_API_KEY} npm run build

# =========================================================================
# 2. ETAPA DE SERVICIO (SERVICE STAGE)
#    Propósito: Servir los archivos estáticos usando Nginx (imagen base ligera).
# =========================================================================
FROM nginx:alpine

# Copia los contenidos de la carpeta 'dist' (index.html, bundle.js)
# desde la etapa de construcción anterior al directorio de servicio de Nginx.
COPY --from=build /app/dist /usr/share/nginx/html

# Expone el puerto por defecto de Nginx
EXPOSE 80

# Comando para iniciar el servidor Nginx....
CMD ["nginx", "-g", "daemon off;"]
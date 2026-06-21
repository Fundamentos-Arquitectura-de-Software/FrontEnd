# Stage 1: build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Config 'docker' => apiBaseUrl '/api' (mismo origen, Nginx hace de proxy)
RUN npx ng build --configuration=docker

# Stage 2: servir con Nginx (reverse proxy a la API incluido)
FROM nginx:1.27-alpine
# Salida del build de Angular (application builder => dist/frontend/browser)
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

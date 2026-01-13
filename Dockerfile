# Etapa de build
FROM node:24-alpine AS builder

WORKDIR /app
ENV NODE_ENV=production

# 1. Instalar dependencias
COPY package*.json ./
RUN npm ci

# 2. Copiar el código fuente
COPY . .

# 3. Build de Next.js
RUN npm run build

# Etapa de runtime
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Instalar Ghostscript y GraphicsMagick para procesamiento de PDFs escaneados
RUN apk add --no-cache ghostscript graphicsmagick

# Copiamos solo lo necesario para correr la app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# IMPORTANTE: Copiar worker y lib para el contenedor worker
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/lib ./lib

# NO copiamos next.config.* porque solo se usa en build, no en runtime

EXPOSE 3000

# Comando por defecto (portal web)
# El contenedor worker sobrescribirá con: command: ["npm", "run", "worker:prod"]
CMD ["npm", "run", "start"]


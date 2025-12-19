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

# Copiamos solo lo necesario para correr la app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# NO copiamos next.config.* porque solo se usa en build, no en runtime

EXPOSE 3000

# Asegúrate de tener "start": "next start" en package.json
CMD ["npm", "run", "start"]


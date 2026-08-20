# ---------- Build ----------
FROM node:20-slim AS build
WORKDIR /app

# Dependências do backend (inclui devDeps: typescript precisa existir no build)
COPY package*.json ./
RUN npm install --include=dev

# Dependências do frontend
COPY web/package*.json ./web/
RUN npm --prefix web install --include=dev

# Código-fonte
COPY . .

# Builda o frontend (web/dist) e o backend (dist/)
RUN npm run build

# Enxuga node_modules para runtime (remove typescript/tsx/etc.)
RUN npm prune --omit=dev

# ---------- Runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/web/dist ./web/dist
COPY --from=build /app/package.json ./package.json

# Railway injeta PORT automaticamente; o app lê process.env.PORT.
EXPOSE 3000
CMD ["node", "dist/server.js"]

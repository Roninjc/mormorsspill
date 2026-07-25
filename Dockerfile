# syntax=docker/dockerfile:1

# ---------- builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Commit sha que pasa el CI (el contexto de build no tiene .git); se muestra como versión.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# Toolchain para compilar el módulo nativo de better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
# Deja solo dependencias de producción (better-sqlite3, socket.io) con su binario ya compilado
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ARG APP_VERSION=dev
ENV NODE_ENV=production \
	APP_VERSION=$APP_VERSION \
	PORT=3000 \
	HOST=0.0.0.0 \
	DATABASE_PATH=/data/mormorsspill.db \
	SESSION_SECRET_PATH=/data/.session_secret

# Litestream (opcional, se activa solo si hay réplica configurada). ca-certificates para TLS a S3/R2.
ARG TARGETARCH
ARG LITESTREAM_VERSION=v0.3.13
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
	&& curl -fsSL "https://github.com/benbjohnson/litestream/releases/download/${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-${TARGETARCH}.tar.gz" \
		| tar -xz -C /usr/local/bin litestream \
	&& apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Artefactos de la app (server.js importa build/handler.js y src/lib/server/*)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json
COPY deploy/litestream.yml /etc/litestream.yml
COPY deploy/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh && mkdir -p /data

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

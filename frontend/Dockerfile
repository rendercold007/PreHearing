# PreHearing frontend — Vite/React build served as static files by Caddy.
# Stage 1: build the static bundle with Node.
FROM node:20-alpine AS build
WORKDIR /app

# Install deps from the lockfile (cached until package files change).
COPY package.json package-lock.json ./
RUN npm ci

# Vite inlines VITE_* env vars at BUILD time, so they must be present now — not at
# runtime. Railway passes matching service variables in as build args.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY . .
RUN npm run build

# Stage 2: serve the built bundle. Caddy is tiny, does SPA fallback, and reads $PORT.
FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

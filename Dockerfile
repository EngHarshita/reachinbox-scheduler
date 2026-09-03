# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

# Install OpenSSL (required by Prisma query engine on Debian Bookworm)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client for the current platform (debian-openssl-3.0.x)
RUN npx prisma generate

COPY . .

RUN npm run build

# ── Stage 2: Production Runner ─────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

# Install OpenSSL so the Prisma query engine shared library loads correctly
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Install production deps + regenerate Prisma Client for this exact runtime
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled backend source
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/server.js"]

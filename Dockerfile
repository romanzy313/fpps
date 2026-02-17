# Build web app
FROM node:22-alpine AS web

WORKDIR /app

COPY package.json pnpm-lock.yaml  ./

# Force pnpm location for consistency
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable pnpm

# Install packages with cache mount for pnpm store
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

COPY . .

RUN pnpm build

# Build server
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY . .

COPY --from=web /app/dist ./dist

# no dependencies :)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo main.go

# Deploy it
FROM scratch AS deploy

WORKDIR /app

# temp
COPY --from=web /app/dist ./dist

COPY --from=builder /app/main ./server


CMD ["./server"]

# Debug in a temp alpine stage to verify

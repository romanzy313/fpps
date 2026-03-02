# Build web app
FROM node:24-alpine AS web-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline
COPY . .
RUN pnpm build

# Build server
FROM golang:1.25-alpine AS go-builder
WORKDIR /app
COPY . .
COPY --from=web-builder /app/dist ./dist
# No dependencies :)
RUN CGO_ENABLED=0 go build -o main .


# Deploy it
FROM scratch AS runtime
WORKDIR /app
COPY --from=go-builder /app/main /fpps
ENTRYPOINT ["/fpps"]

# For build artifactors
FROM scratch AS binaries
COPY --from=go-builder /app/main /fpps

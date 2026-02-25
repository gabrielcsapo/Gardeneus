FROM node:22-slim AS base

# better-sqlite3 requires python3 + build tools to compile native addon
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 3000 3001

CMD ["pnpm", "start"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
# pnpm is PINNED deliberately. `pnpm@latest` floated to 11.x, which imports
# node:sqlite -- a builtin that only exists in Node >=22.5 -- so it crashed on
# this base image with ERR_UNKNOWN_BUILTIN_MODULE. pnpm's own engines field
# claims >=18.12, so corepack installs it without complaint and the failure
# only appears at run time. Nothing in this repo changed the day it broke.
# 9.15.9 is the last 9.x and matches this repo's lockfileVersion 9.0.
# pnpm is PINNED deliberately: `pnpm@latest` floated to 11.x, which imports
# node:sqlite -- a builtin absent from Node 20 -- so corepack installed it
# happily (its engines field claims >=18.12) and the build died at run time
# with ERR_UNKNOWN_BUILTIN_MODULE. Nothing in the repo changed that day.
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the static export
RUN pnpm build

# Production stage - nginx to serve static files
FROM nginx:alpine

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static export from builder
# Next.js static export outputs to 'out' folder
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

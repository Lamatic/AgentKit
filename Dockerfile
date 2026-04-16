# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20
ARG KIT_PATH=kits/agentic/code-review

FROM node:${NODE_VERSION}-alpine AS deps
ARG KIT_PATH
WORKDIR /app
COPY ${KIT_PATH}/package*.json ./
RUN npm ci

FROM node:${NODE_VERSION}-alpine AS builder
ARG KIT_PATH
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ${KIT_PATH}/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]

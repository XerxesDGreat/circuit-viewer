FROM node:22-alpine AS deps
WORKDIR /app

# Install workspace deps
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY apps/frontend/package*.json apps/frontend/
RUN npm install

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run prisma:generate --workspace apps/backend
RUN npm run build --workspace apps/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Copy built backend and node_modules (Prisma client lives in node_modules)
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/backend/dist /app/apps/backend/dist
COPY --from=build /app/apps/backend/prisma /app/apps/backend/prisma

EXPOSE 4000
CMD ["node", "/app/apps/backend/dist/index.js"]


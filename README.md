# circuit-viewer
Application to map home electrical circuits: place outlets on a floor plan, document panels/breakers, and see which breaker controls which outlet.

Docs:
- `docs/ARCHITECTURE.md` — stack and deployment approach (PWA, self-hosted, no auth).
- `docs/SCHEMA.md` — data model and Prisma draft.
- `docs/API.md` — REST endpoint sketch.

## Docker Compose (local)
Prereqs: Docker, Node 22+ (for local builds).

Build and run:
```
docker-compose up --build
```

Services:
- Postgres on `5432`
- Backend on `4000` (Fastify)
- Frontend on `4173` (nginx serving Vite build)

Env:
- Backend expects `DATABASE_URL`; compose sets it to the Postgres service.
- Sample env for local dev: `apps/backend/env.sample`.

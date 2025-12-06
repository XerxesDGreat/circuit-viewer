# Circuit Viewer Architecture (No Auth)

## Goals
- PWA works on phone/tablet/desktop; installable and touch-friendly.
- Single self-hosted deployment (Docker Compose) on your home server.
- Centralized data (Postgres) so all devices see the same state.
- No auth for now; can add later without rework.

## Stack
- Frontend: React + Vite (TypeScript), component library of your choice, Konva or React Flow for floor/panel canvases, TanStack Query for data fetching/caching, Zustand or Context for local UI state.
- Backend: Node + Fastify (or Express) with TypeScript; Prisma as ORM/migrations.
- DB: Postgres.
- Packaging/Deploy: Docker Compose (frontend built to static assets served by the backend or a tiny static container), Postgres container, reverse proxy (Caddy/Traefik) for HTTPS + single entrypoint. Optional watchtower for auto-restart on updates.
- Offline-friendly: Service worker caches static assets; mutations are optimistic and retried when online; source of truth remains Postgres.

## Key UX Surfaces
- Floor map: multi-level selector, pan/zoom, snap-to-grid, icon palette by outlet type, tap/drag to place and edit outlets. Quick-add modal for “walk the house” flow.
- Breaker panel: grid layout per panel; tap a breaker highlights its circuit’s outlets on the map. Separate panel config screen for one-time setup (rows/cols, slot numbering, amperage/voltage, tie groups).
- Lists/filters: filter outlets by breaker, room, type, GFCI, unassigned.
- GFCI visualization: select a GFCI outlet to highlight protected outlets.
- Print/export: printable panel map + CSV/PDF export for backup.

## Data Model (conceptual)
- Floor, Room (for grouping and map context).
- OutletType (catalog of outlet/switch/appliance/icon presets).
- Outlet (position on floor, type, description, GFCI links, circuit assignment).
- Panel (main or subpanel; has layout; can reference supply breaker feeding it).
- Circuit (logical circuit; amperage/voltage/label/color).
- Breaker (physical breaker in a panel slot; points to a circuit; multiple breakers can belong to the same circuit to represent tied poles).
- Optional GFCI link (one outlet protecting many).

## Flows to Support
- Map-first: place outlets without circuits; later assign circuits/breakers.
- Breaker-first: toggle a breaker, walk the house, add outlets directly to that circuit.
- Batch assign: select circuit/breaker, multi-select outlets, save.

## Security/Networking
- Run behind HTTPS on LAN via reverse proxy; single hostname. If you open to WAN, add auth later.
- Limit CORS to your LAN hostname/IP. No auth in this phase; keep it LAN-only.

## Testing
- Prisma migrations + seed script for a sample house.
- Vitest for data layer; Playwright for critical flows (add outlet, assign circuit, highlight via breaker).


# Data Model & Prisma Draft

This is a starting point; adjust as you learn the house. The guiding idea is: circuits are logical; breakers are physical; outlets sit on a floor plan; GFCI is a link from one outlet to many.

## Entities
- `Floor`: name, order, optional description.
- `Room`: belongs to a floor.
- `OutletType`: catalog of outlet/switch/appliance/icon presets.
- `Circuit`: logical circuit; amperage/voltage/label/color; belongs to a panel; can be fed from a panel slot/breaker group.
- `Breaker`: physical breaker in a panel slot; references a circuit. Multiple breakers can share the same circuit to represent tied poles (e.g., 2-pole 240V).
- `Panel`: main or subpanel; has layout (rows/cols) and parent panel link; may reference a supply breaker feeding it.
- `Outlet`: placed on a floor with x/y (and optional rotation). References a room, type, and circuit. May be marked as a GFCI device and may protect other outlets.
- `GfciLink`: relation from protecting outlet → protected outlet (one-to-many).

## Notes on modeling ties
- Two-pole ties: model as two `Breaker` records sharing the same `circuit_id`. Selecting either breaker shows the same circuit.
- Subpanels: `Panel` has `parent_panel_id` and optional `supply_breaker_id` that lives in the parent panel (for documentation).

## Prisma draft
You can paste this into `prisma/schema.prisma` once the project is scaffolded.

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum BreakerType {
  STANDARD
  GFCI
  AFCI
  DUAL_FUNCTION
}

enum OutletKind {
  OUTLET
  SWITCH
  LIGHT
  APPLIANCE
  PANEL_FEED
}

model Floor {
  id          String  @id @default(cuid())
  name        String
  level       Int?
  description String?
  rooms       Room[]
  outlets     Outlet[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Room {
  id        String  @id @default(cuid())
  name      String
  floorId   String
  floor     Floor   @relation(fields: [floorId], references: [id], onDelete: Cascade)
  outlets   Outlet[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model OutletType {
  id        String  @id @default(cuid())
  key       String  @unique
  label     String
  icon      String?
  kind      OutletKind
  outlets   Outlet[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Panel {
  id               String   @id @default(cuid())
  name             String
  location         String?
  rows             Int?
  columns          Int?
  parentPanelId    String?
  parentPanel      Panel?   @relation("PanelHierarchy", fields: [parentPanelId], references: [id])
  subpanels        Panel[]  @relation("PanelHierarchy")
  supplyBreakerId  String?  @unique
  supplyBreaker    Breaker? @relation("PanelSupply", fields: [supplyBreakerId], references: [id])
  circuits         Circuit[]
  breakers         Breaker[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Circuit {
  id          String    @id @default(cuid())
  name        String?
  label       String?
  amperage    Int?
  voltage     Int?
  color       String?
  notes       String?
  panelId     String?
  panel       Panel?    @relation(fields: [panelId], references: [id], onDelete: SetNull)
  breakers    Breaker[]
  outlets     Outlet[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Breaker {
  id          String      @id @default(cuid())
  panelId     String
  panel       Panel       @relation(fields: [panelId], references: [id], onDelete: Cascade)
  slotNumber  Int?
  label       String?
  poleCount   Int?
  type        BreakerType @default(STANDARD)
  amperage    Int?
  voltage     Int?
  circuitId   String?
  circuit     Circuit?    @relation(fields: [circuitId], references: [id], onDelete: SetNull)
  feedsPanel  Panel?      @relation("PanelSupply")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([panelId, slotNumber], map: "panel_slot_unique")
}

model Outlet {
  id                 String    @id @default(cuid())
  name               String?
  description        String?
  floorId            String
  floor              Floor     @relation(fields: [floorId], references: [id], onDelete: Cascade)
  roomId             String?
  room               Room?     @relation(fields: [roomId], references: [id], onDelete: SetNull)
  typeId             String?
  type               OutletType? @relation(fields: [typeId], references: [id], onDelete: SetNull)
  kind               OutletKind @default(OUTLET)
  x                  Float
  y                  Float
  rotation           Float?
  circuitId          String?
  circuit            Circuit?  @relation(fields: [circuitId], references: [id], onDelete: SetNull)
  isGfci             Boolean   @default(false)
  gfciProtectedById  String?
  gfciProtectedBy    Outlet?   @relation("GfciLink", fields: [gfciProtectedById], references: [id])
  protects           Outlet[]  @relation("GfciLink")
  notes              String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

## Indexing/constraints to consider
- Unique `(panelId, slotNumber)` for breakers when slotNumber is not null.
- Optional unique `(floorId, name)` for rooms.
- Optional unique `(panelId, name)` for circuits.
- Check constraints for non-negative amperage/voltage/coords.

## Color/load hints
- `Circuit.color` can drive UI tinting for load visualization later.

## Seed ideas
- Seed `OutletType` with `outlet`, `switch`, `3-way switch`, `light`, `ceiling_fan`, `appliance`, `panel_feed`, `gfci` (kind OUTLET).



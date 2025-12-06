# API Sketch (REST)

Base URL: `/api`

## Core resources
- Floors: `GET /floors`, `POST /floors`, `GET /floors/:id`, `PATCH /floors/:id`, `DELETE /floors/:id`
- Rooms: `GET /rooms?floorId=...`, `POST /rooms`, `PATCH /rooms/:id`, `DELETE /rooms/:id`
- Outlet types: `GET /outlet-types`, `POST /outlet-types`, `PATCH /outlet-types/:id`, `DELETE /outlet-types/:id`
- Panels: `GET /panels`, `POST /panels`, `GET /panels/:id`, `PATCH /panels/:id`, `DELETE /panels/:id`
- Circuits: `GET /circuits?panelId=...`, `POST /circuits`, `GET /circuits/:id`, `PATCH /circuits/:id`, `DELETE /circuits/:id`
- Breakers: `GET /breakers?panelId=...`, `POST /breakers`, `GET /breakers/:id`, `PATCH /breakers/:id`, `DELETE /breakers/:id`
- Outlets: `GET /outlets?floorId=...&roomId=...&circuitId=...&unassigned=true`, `POST /outlets`, `GET /outlets/:id`, `PATCH /outlets/:id`, `DELETE /outlets/:id`

## Specialized endpoints
- Batch assign outlets to a circuit: `POST /circuits/:id/outlets` with `{ outletIds: [] }`
- Breaker highlight: `GET /breakers/:id/outlets` (returns outlets for that breaker’s circuit)
- Circuit highlight: `GET /circuits/:id/outlets`
- Panel layout: `GET /panels/:id/layout` (rows/cols, breakers by slot)
- GFCI map: `GET /outlets/:id/protects` (for a GFCI outlet)
- Export: `GET /exports/panel/:id?format=pdf|png`, `GET /exports/data.csv`

## Example payloads

`POST /panels`
```json
{
  "name": "Main Panel",
  "location": "Garage",
  "rows": 20,
  "columns": 2,
  "parentPanelId": null,
  "supplyBreakerId": null
}
```

`POST /circuits`
```json
{
  "panelId": "panel_1",
  "name": "Kitchen Small Appliance",
  "label": "B5/B7",
  "amperage": 20,
  "voltage": 120,
  "color": "#f39c12"
}
```

`POST /breakers`
```json
{
  "panelId": "panel_1",
  "slotNumber": 5,
  "poleCount": 1,
  "type": "STANDARD",
  "amperage": 20,
  "voltage": 120,
  "circuitId": "circuit_kitchen_small"
}
```

`POST /outlets`
```json
{
  "floorId": "floor_1",
  "roomId": "room_kitchen",
  "typeId": "outlet_standard",
  "kind": "OUTLET",
  "name": "Kitchen counter left",
  "description": "Left of sink",
  "x": 142.5,
  "y": 88.0,
  "rotation": 0,
  "circuitId": "circuit_kitchen_small",
  "isGfci": true
}
```

`POST /circuits/:id/outlets`
```json
{
  "outletIds": ["outlet1", "outlet2", "outlet3"]
}
```

## Frontend data fetching ideas
- Use TanStack Query keys by resource (`['floors']`, `['outlets', filters]`, etc.).
- Prefetch outlets for a circuit when a breaker is tapped to avoid latency in highlight.
- Optimistic updates for outlet placement and circuit assignment; rollback on failure.

## Error shape (suggested)
```json
{
  "error": "BadRequest",
  "message": "circuitId is required",
  "details": { "field": "circuitId" }
}
```

## Validation highlights
- Require `floorId` + coordinates for outlet create.
- Enforce `(panelId, slotNumber)` uniqueness when provided.
- Allow outlets to be created without a circuit; allow circuits without breakers (planning mode).
- When deleting a circuit, require `force=true` or auto-null outlets/breakers.

## Print/export
- `GET /exports/panel/:id` produces a server-rendered PDF/PNG of panel + circuit list.
- `GET /exports/data.csv` includes outlets, circuits, breakers for backup/edit in spreadsheet.



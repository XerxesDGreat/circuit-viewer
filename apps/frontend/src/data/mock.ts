import type { Circuit, FloorPlan, Outlet } from "../types";

export const mockFloor: FloorPlan = {
  width: 960,
  height: 640,
  backgroundColor: "#f8fafc"
};

export const mockCircuits: Circuit[] = [
  { id: "c1", label: "Kitchen Small Appl", amperage: 20, voltage: 120, color: "#f59e0b" },
  { id: "c2", label: "Garage / Ext", amperage: 15, voltage: 120, color: "#3b82f6" },
  { id: "c3", label: "Bath / GFCI", amperage: 20, voltage: 120, color: "#10b981" }
];

export const mockOutlets: Outlet[] = [
  { id: "o1", name: "Kitchen Counter L", kind: "OUTLET", x: 180, y: 180, circuitId: "c1" },
  { id: "o2", name: "Kitchen Counter R", kind: "OUTLET", x: 320, y: 180, circuitId: "c1" },
  { id: "o3", name: "Fridge", kind: "APPLIANCE", x: 120, y: 260, circuitId: "c1" },
  { id: "o4", name: "Garage GFCI", kind: "OUTLET", x: 720, y: 200, circuitId: "c2", isGfci: true, gfciProtectsIds: ["o5", "o6"] },
  { id: "o5", name: "Exterior Front", kind: "OUTLET", x: 820, y: 140, circuitId: "c2" },
  { id: "o6", name: "Exterior Rear", kind: "OUTLET", x: 820, y: 260, circuitId: "c2" },
  { id: "o7", name: "Bath GFCI", kind: "OUTLET", x: 480, y: 400, circuitId: "c3", isGfci: true },
  { id: "o8", name: "Bath Light", kind: "LIGHT", x: 520, y: 320, circuitId: "c3" },
  { id: "o9", name: "Bath Fan", kind: "APPLIANCE", x: 560, y: 360, circuitId: "c3" }
];


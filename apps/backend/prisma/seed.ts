import { PrismaClient, NodeKind, NodeLinkKind, BreakerType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.nodeLink.deleteMany(),
    prisma.node.deleteMany(),
    prisma.breakerLink.deleteMany(),
    prisma.breaker.deleteMany(),
    prisma.circuit.deleteMany(),
    prisma.panel.deleteMany(),
    prisma.room.deleteMany(),
    prisma.floor.deleteMany(),
    prisma.nodeType.deleteMany()
  ]);

  const floor = await prisma.floor.create({
    data: { name: "Main", level: 1 }
  });

  const panel = await prisma.panel.create({
    data: { name: "Main Panel", rows: 20, columns: 2 }
  });

  const circuits = await prisma.circuit.createManyAndReturn({
    data: [
      { name: "Kitchen Small Appl", label: "B1/B3", amperage: 20, voltage: 120, panelId: panel.id, color: "#f59e0b" },
      { name: "Garage / Ext", label: "B5/B7", amperage: 15, voltage: 120, panelId: panel.id, color: "#3b82f6" },
      { name: "Bath / GFCI", label: "B9/B11", amperage: 20, voltage: 120, panelId: panel.id, color: "#10b981" },
      { name: "Cooktop 240V", label: "B13/B15", amperage: 40, voltage: 240, panelId: panel.id, color: "#7c3aed" },
      { name: "Dryer 240V", label: "B17/B19", amperage: 30, voltage: 240, panelId: panel.id, color: "#8b5cf6" }
    ]
  });

  const circuitByName = Object.fromEntries(circuits.map((c) => [c.name!, c]));

  await prisma.breaker.createMany({
    data: [
      { panelId: panel.id, slotNumber: 1, poleCount: 1, type: BreakerType.STANDARD, amperage: 20, voltage: 120, circuitId: circuitByName["Kitchen Small Appl"].id },
      { panelId: panel.id, slotNumber: 3, poleCount: 1, type: BreakerType.STANDARD, amperage: 20, voltage: 120, circuitId: circuitByName["Kitchen Small Appl"].id },
      { panelId: panel.id, slotNumber: 5, poleCount: 1, type: BreakerType.STANDARD, amperage: 15, voltage: 120, circuitId: circuitByName["Garage / Ext"].id },
      { panelId: panel.id, slotNumber: 7, poleCount: 1, type: BreakerType.STANDARD, amperage: 15, voltage: 120, circuitId: circuitByName["Garage / Ext"].id },
      { panelId: panel.id, slotNumber: 9, poleCount: 1, type: BreakerType.GFCI, amperage: 20, voltage: 120, circuitId: circuitByName["Bath / GFCI"].id },
      { panelId: panel.id, slotNumber: 11, poleCount: 1, type: BreakerType.STANDARD, amperage: 20, voltage: 120, circuitId: circuitByName["Bath / GFCI"].id },
      { panelId: panel.id, slotNumber: 13, poleCount: 2, type: BreakerType.STANDARD, amperage: 40, voltage: 240, circuitId: circuitByName["Cooktop 240V"].id },
      { panelId: panel.id, slotNumber: 17, poleCount: 2, type: BreakerType.STANDARD, amperage: 30, voltage: 240, circuitId: circuitByName["Dryer 240V"].id }
    ]
  });

  const nodes = await prisma.node.createManyAndReturn({
    data: [
      { name: "Kitchen Counter L", kind: NodeKind.OUTLET, floorId: floor.id, x: 180, y: 180, circuitId: circuitByName["Kitchen Small Appl"].id },
      { name: "Kitchen Counter R", kind: NodeKind.OUTLET, floorId: floor.id, x: 320, y: 180, circuitId: circuitByName["Kitchen Small Appl"].id },
      { name: "Fridge", kind: NodeKind.APPLIANCE, floorId: floor.id, x: 120, y: 260, circuitId: circuitByName["Kitchen Small Appl"].id },
      { name: "Garage GFCI", kind: NodeKind.OUTLET, floorId: floor.id, x: 720, y: 200, circuitId: circuitByName["Garage / Ext"].id, isGfci: true },
      { name: "Exterior Front", kind: NodeKind.OUTLET, floorId: floor.id, x: 820, y: 140, circuitId: circuitByName["Garage / Ext"].id },
      { name: "Exterior Rear", kind: NodeKind.OUTLET, floorId: floor.id, x: 820, y: 260, circuitId: circuitByName["Garage / Ext"].id },
      { name: "Bath GFCI", kind: NodeKind.OUTLET, floorId: floor.id, x: 480, y: 400, circuitId: circuitByName["Bath / GFCI"].id, isGfci: true },
      { name: "Bath Light", kind: NodeKind.LIGHT, floorId: floor.id, x: 520, y: 320, circuitId: circuitByName["Bath / GFCI"].id },
      { name: "Bath Fan", kind: NodeKind.FAN, floorId: floor.id, x: 560, y: 360, circuitId: circuitByName["Bath / GFCI"].id },
      { name: "Bath Switch", kind: NodeKind.DIMMER, floorId: floor.id, x: 460, y: 340, circuitId: circuitByName["Bath / GFCI"].id },
      { name: "Exterior Switch", kind: NodeKind.SWITCH, floorId: floor.id, x: 760, y: 300, circuitId: circuitByName["Garage / Ext"].id },
      { name: "Ceiling Fan", kind: NodeKind.FAN, floorId: floor.id, x: 420, y: 320, circuitId: circuitByName["Bath / GFCI"].id },
      { name: "Cooktop", kind: NodeKind.COOKTOP, floorId: floor.id, x: 200, y: 320, circuitId: circuitByName["Cooktop 240V"].id },
      { name: "Dryer", kind: NodeKind.DRYER, floorId: floor.id, x: 680, y: 420, circuitId: circuitByName["Dryer 240V"].id },
      { name: "240V Outlet", kind: NodeKind.OUTLET_240, floorId: floor.id, x: 640, y: 120, circuitId: circuitByName["Cooktop 240V"].id },
      { name: "AC Condenser", kind: NodeKind.AC, floorId: floor.id, x: 860, y: 360, circuitId: circuitByName["Dryer 240V"].id }
    ]
  });

  const nodeByName = Object.fromEntries(nodes.map((n) => [n.name!, n]));

  // Links: GFCI protects, switches control fans/lights/outlets
  await prisma.nodeLink.createMany({
    data: [
      { kind: NodeLinkKind.GFCI_PROTECTS, fromId: nodeByName["Garage GFCI"].id, toId: nodeByName["Exterior Front"].id },
      { kind: NodeLinkKind.GFCI_PROTECTS, fromId: nodeByName["Garage GFCI"].id, toId: nodeByName["Exterior Rear"].id },
      { kind: NodeLinkKind.GFCI_PROTECTS, fromId: nodeByName["Bath GFCI"].id, toId: nodeByName["Bath Light"].id },
      { kind: NodeLinkKind.GFCI_PROTECTS, fromId: nodeByName["Bath GFCI"].id, toId: nodeByName["Bath Fan"].id },
      { kind: NodeLinkKind.SWITCH_CONTROLS, fromId: nodeByName["Exterior Switch"].id, toId: nodeByName["Exterior Front"].id },
      { kind: NodeLinkKind.SWITCH_CONTROLS, fromId: nodeByName["Exterior Switch"].id, toId: nodeByName["Exterior Rear"].id },
      { kind: NodeLinkKind.SWITCH_CONTROLS, fromId: nodeByName["Bath Switch"].id, toId: nodeByName["Bath Light"].id },
      { kind: NodeLinkKind.SWITCH_CONTROLS, fromId: nodeByName["Bath Switch"].id, toId: nodeByName["Bath Fan"].id },
      { kind: NodeLinkKind.SWITCH_CONTROLS, fromId: nodeByName["Bath Switch"].id, toId: nodeByName["Ceiling Fan"].id }
    ]
  });

  // Breaker ties (example: 240V paired)
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


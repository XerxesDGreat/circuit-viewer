import { useMemo, useState } from "react";
import "./App.css";
import { mockCircuits, mockFloor, mockOutlets } from "./data/mock";
import { FloorCanvas } from "./components/FloorCanvas";
import { Sidebar } from "./components/Sidebar";
import { useSelection } from "./state/useSelection";
import type { Outlet } from "./types";
import { useCircuits, useNodes, useNodeLinks, useUpdateNodePosition } from "./api/hooks";

function App() {
  const [outlets, setOutlets] = useState<Outlet[]>(mockOutlets);
  const circuitsQuery = useCircuits();
  const nodesQuery = useNodes();
  const nodeLinksQuery = useNodeLinks();
  const updateNodePosition = useUpdateNodePosition();
  const { selectedCircuitId, selectedOutletId, selectCircuit, selectOutlet, clear } = useSelection();

  const useLive = circuitsQuery.isSuccess && nodesQuery.isSuccess;
  const circuits = useLive ? (circuitsQuery.data as any) : mockCircuits;
  const nodes = useLive ? (nodesQuery.data as any as Outlet[]) : outlets;
  const nodeLinks = useLive ? nodeLinksQuery.data || [] : [];

  const linkMaps = useMemo(() => {
    const protects = new Map<string, string[]>();
    const controlledBy = new Map<string, string>();
    const controls = new Map<string, string[]>();
    nodeLinks.forEach((l) => {
      if (l.kind === "GFCI_PROTECTS") {
        if (!protects.has(l.fromId)) protects.set(l.fromId, []);
        protects.get(l.fromId)!.push(l.toId);
      }
      if (l.kind === "SWITCH_CONTROLS") {
        if (!controls.has(l.fromId)) controls.set(l.fromId, []);
        controls.get(l.fromId)!.push(l.toId);
        controlledBy.set(l.toId, l.fromId);
      }
    });
    return { protects, controlledBy, controls };
  }, [nodeLinks]);

  const highlightedOutletIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedCircuitId) {
      nodes.filter((o) => o.circuitId === selectedCircuitId).forEach((o) => set.add(o.id));
      return set;
    }
    if (selectedOutletId) {
      set.add(selectedOutletId);
      const selectedOutlet = nodes.find((o) => o.id === selectedOutletId);
      if (selectedOutlet?.isGfci) {
        const protects = linkMaps.protects.get(selectedOutlet.id) || [];
        protects.forEach((id) => set.add(id));
      }
      let protector: string | undefined;
      for (const [fromId, tos] of linkMaps.protects.entries()) {
        if (tos.includes(selectedOutletId)) {
          protector = fromId;
          break;
        }
      }
      if (protector) set.add(protector);

      const controls = linkMaps.controls.get(selectedOutletId) || [];
      controls.forEach((id) => set.add(id));
      const controlledBy = linkMaps.controlledBy.get(selectedOutletId);
      if (controlledBy) set.add(controlledBy);
    }
    return set;
  }, [selectedCircuitId, selectedOutletId, nodes, linkMaps]);

  const handleSelectOutlet = (id: string) => {
    selectCircuit(null);
    selectOutlet(id);
  };

  const handleSelectCircuit = (id: string | null) => {
    selectCircuit(id);
  };

  const handleMoveOutlet = (id: string, x: number, y: number) => {
    if (useLive) {
      updateNodePosition.mutate({ id, x, y });
    } else {
      setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
    }
  };

  return (
    <div className="page">
      <Sidebar
        circuits={circuits}
        outlets={nodes}
        selectedCircuitId={selectedCircuitId}
        selectedOutletId={selectedOutletId}
        onSelectCircuit={handleSelectCircuit}
        onSelectOutlet={handleSelectOutlet}
        onClear={clear}
      />
      <main className="main">
        <header className="main-header">
          <div>
            <h1>Floor Plan</h1>
            <p className="muted">Drag outlets, zoom with wheel/trackpad, click to highlight.</p>
          </div>
          <div className="badges">
            <span className="badge">{useLive ? "Live data" : "Mock data"}</span>
            <span className="badge">Konva canvas</span>
          </div>
        </header>
        <FloorCanvas
          floor={mockFloor}
          outlets={nodes}
          circuits={circuits}
          highlightedOutletIds={highlightedOutletIds}
          onSelectOutlet={handleSelectOutlet}
          onMoveOutlet={handleMoveOutlet}
        />
        <section className="info-bar">
          <div>Selected circuit: {selectedCircuitId ?? "None"}</div>
          <div>Selected outlet: {selectedOutletId ?? "None"}</div>
          <div>Node links: {nodeLinks.length}</div>
        </section>
      </main>
    </div>
  );
}

export default App

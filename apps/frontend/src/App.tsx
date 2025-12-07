import { useMemo, useState } from "react";
import "./App.css";
import { mockCircuits, mockFloor, mockOutlets } from "./data/mock";
import { FloorCanvas } from "./components/FloorCanvas";
import { Sidebar } from "./components/Sidebar";
import { useSelection } from "./state/useSelection";
import type { Outlet } from "./types";

function App() {
  const [outlets, setOutlets] = useState<Outlet[]>(mockOutlets);
  const { selectedCircuitId, selectedOutletId, selectCircuit, selectOutlet, clear } = useSelection();

  const gfciProtects = useMemo(() => {
    const map = new Map<string, string[]>();
    outlets.forEach((o) => {
      if (o.isGfci && o.gfciProtectsIds) {
        map.set(o.id, o.gfciProtectsIds);
      }
    });
    return map;
  }, [outlets]);

  const gfciProtectedBy = useMemo(() => {
    const map = new Map<string, string>();
    outlets.forEach((o) => {
      if (o.isGfci && o.gfciProtectsIds) {
        o.gfciProtectsIds.forEach((id) => map.set(id, o.id));
      }
    });
    return map;
  }, [outlets]);

  const highlightedOutletIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedCircuitId) {
      outlets.filter((o) => o.circuitId === selectedCircuitId).forEach((o) => set.add(o.id));
      return set;
    }
    if (selectedOutletId) {
      set.add(selectedOutletId);
      const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);
      if (selectedOutlet?.isGfci && selectedOutlet.gfciProtectsIds) {
        selectedOutlet.gfciProtectsIds.forEach((id) => set.add(id));
      }
      const protector = gfciProtectedBy.get(selectedOutletId);
      if (protector) {
        set.add(protector);
      }
      if (selectedOutlet?.controlsOutletIds) {
        selectedOutlet.controlsOutletIds.forEach((id) => set.add(id));
      }
      if (selectedOutlet?.controlledBySwitchId) {
        set.add(selectedOutlet.controlledBySwitchId);
      }
    }
    return set;
  }, [selectedCircuitId, selectedOutletId, outlets, gfciProtectedBy]);

  const handleSelectOutlet = (id: string) => {
    selectCircuit(null);
    selectOutlet(id);
  };

  const handleSelectCircuit = (id: string | null) => {
    selectCircuit(id);
  };

  const handleMoveOutlet = (id: string, x: number, y: number) => {
    setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
  };

  return (
    <div className="page">
      <Sidebar
        circuits={mockCircuits}
        outlets={outlets}
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
            <span className="badge">Mock data</span>
            <span className="badge">Konva canvas</span>
          </div>
        </header>
        <FloorCanvas
          floor={mockFloor}
          outlets={outlets}
          circuits={mockCircuits}
          highlightedOutletIds={highlightedOutletIds}
          onSelectOutlet={handleSelectOutlet}
          onMoveOutlet={handleMoveOutlet}
        />
        <section className="info-bar">
          <div>Selected circuit: {selectedCircuitId ?? "None"}</div>
          <div>Selected outlet: {selectedOutletId ?? "None"}</div>
          <div>GFCI links: {gfciProtects.size}</div>
        </section>
      </main>
    </div>
  );
}

export default App

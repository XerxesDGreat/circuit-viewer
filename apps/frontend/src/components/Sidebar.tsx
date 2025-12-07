import type { Circuit, Outlet } from "../types";

type Props = {
  circuits: Circuit[];
  outlets: Outlet[];
  selectedCircuitId: string | null;
  selectedOutletId: string | null;
  onSelectCircuit: (id: string | null) => void;
  onSelectOutlet: (id: string) => void;
  onClear: () => void;
};

export function Sidebar({
  circuits,
  outlets,
  selectedCircuitId,
  selectedOutletId,
  onSelectCircuit,
  onSelectOutlet,
  onClear
}: Props) {
  const outletsByCircuit = circuits.map((c) => ({
    circuit: c,
    outlets: outlets.filter((o) => o.circuitId === c.id)
  }));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <h2>Panels & Circuits</h2>
          <p className="muted">Tap a circuit to highlight its outlets.</p>
        </div>
        <button className="ghost" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="circuit-list">
        {outletsByCircuit.map(({ circuit, outlets }) => (
          <button
            key={circuit.id}
            className={`circuit-row ${selectedCircuitId === circuit.id ? "active" : ""}`}
            onClick={() => onSelectCircuit(selectedCircuitId === circuit.id ? null : circuit.id)}
          >
            <div className="dot" style={{ background: circuit.color || "#0ea5e9" }} />
            <div className="circuit-info">
              <div className="label">{circuit.label}</div>
              <div className="muted">
                {circuit.amperage ?? "?"}A / {circuit.voltage ?? "?"}V · {outlets.length} outlet
                {outlets.length === 1 ? "" : "s"}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Outlets</h3>
          <p className="muted">Tap to view on map and highlight its circuit.</p>
        </div>
        <div className="outlet-list">
          {outlets.map((o) => (
            <button
              key={o.id}
              className={`outlet-row ${selectedOutletId === o.id ? "active" : ""}`}
              onClick={() => onSelectOutlet(o.id)}
            >
              <div className="label">{o.name || o.id}</div>
              <div className="muted">{o.kind}</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}


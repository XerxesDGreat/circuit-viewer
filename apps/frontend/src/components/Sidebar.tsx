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

  const outletById = outlets.reduce<Record<string, Outlet>>((acc, o) => {
    acc[o.id] = o;
    return acc;
  }, {});

  const describe = (o: Outlet) => {
    const lines: string[] = [];
    if (o.isGfci && o.gfciProtectsIds?.length) {
      const names = o.gfciProtectsIds.map((id) => outletById[id]?.name || id).join(", ");
      lines.push(`protects: ${names}`);
    }
    const protector = Object.values(outletById).find((x) => x.gfciProtectsIds?.includes(o.id));
    if (protector) {
      lines.push(`behind GFCI: ${protector.name || protector.id}`);
    }
    if (o.controlledBySwitchId) {
      const sw = outletById[o.controlledBySwitchId];
      if (sw) lines.push(`uses switch: ${sw.name || sw.id}`);
    }
    if (o.controlsOutletIds?.length) {
      const names = o.controlsOutletIds.map((id) => outletById[id]?.name || id).join(", ");
      lines.push(`controls: ${names}`);
    }
    return lines;
  };

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
              {describe(o).length > 0 && (
                <div className="muted outlet-meta">
                  {describe(o).map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Legend</h3>
          <p className="muted">Shapes by type</p>
        </div>
        <div className="legend">
          <div className="legend-row">
            <span className="legend-shape square" /> <span>Outlet</span>
          </div>
          <div className="legend-row">
            <span className="legend-shape square" /> <span>Outlet 240V (with “240”)</span>
          </div>
          <div className="legend-row">
            <span className="legend-shape triangle" /> <span>Switch</span>
          </div>
          <div className="legend-row">
            <span className="legend-shape triangle dimmer" /> <span>Dimmer</span>
          </div>
          <div className="legend-row">
            <span className="legend-shape circle" /> <span>Light</span>
          </div>
          <div className="legend-row">
            <span className="legend-shape circle fan" /> <span>Fan</span>
          </div>
          <div className="legend-row">
            <span className="legend-shape rounded" /> <span>Appliance / Cooktop / Dryer / AC (with tag)</span>
          </div>
          <div className="legend-row">
            <span className="legend-tag">GFCI</span> <span>GFCI badge</span>
          </div>
        </div>
      </div>
    </aside>
  );
}


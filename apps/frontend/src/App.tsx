import { useMemo, useState } from "react";
import "./App.css";
import { mockCircuits, mockFloor, mockOutlets } from "./data/mock";
import { FloorCanvas } from "./components/FloorCanvas";
import { Sidebar } from "./components/Sidebar";
import { useSelection } from "./state/useSelection";
import type { Outlet } from "./types";
import {
  useCircuits,
  useNodes,
  useNodeLinks,
  useUpdateNodePosition,
  useCreateNode,
  useCreateNodeLink
} from "./api/hooks";
import type { NodeKind } from "./api/types";

const nodeKinds: NodeKind[] = [
  "OUTLET",
  "OUTLET_240",
  "SWITCH",
  "DIMMER",
  "LIGHT",
  "FAN",
  "APPLIANCE",
  "COOKTOP",
  "DRYER",
  "AC",
  "OTHER"
];

function App() {
  const [outlets, setOutlets] = useState<Outlet[]>(mockOutlets);
  const circuitsQuery = useCircuits();
  const nodesQuery = useNodes();
  const nodeLinksQuery = useNodeLinks();
  const { selectedCircuitId, selectedOutletId, selectCircuit, selectOutlet, clear } = useSelection();

  const updateNodePosition = useUpdateNodePosition();
  const createNode = useCreateNode();
  const createNodeLink = useCreateNodeLink();
  const [draft, setDraft] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftKind, setDraftKind] = useState<Outlet["kind"]>("OUTLET");
  const [draftCircuit, setDraftCircuit] = useState<string | undefined>(undefined);
  const [draftIsGfci, setDraftIsGfci] = useState(false);
  const [draftGfciProtectedBy, setDraftGfciProtectedBy] = useState<string | undefined>(undefined);
  const [draftControl, setDraftControl] = useState<string | undefined>(undefined);
  const [localLinks, setLocalLinks] = useState<{ fromId: string; toId: string; kind: any }[]>([]);

  const useLive = circuitsQuery.isSuccess && nodesQuery.isSuccess;
  const circuits = useLive ? (circuitsQuery.data as any) : mockCircuits;
  const nodes = useLive ? (nodesQuery.data as any as Outlet[]) : outlets;
  const nodeLinks = useLive ? nodeLinksQuery.data || [] : [];

  const linkMaps = useMemo(() => {
    const protects = new Map<string, string[]>();
    const controlledBy = new Map<string, string>();
    const controls = new Map<string, string[]>();
    const combinedLinks = [...nodeLinks, ...localLinks];
    combinedLinks.forEach((l) => {
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
  }, [nodeLinks, localLinks]);

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

  const handleDraftCircuitChange = (id: string | undefined) => {
    setDraftCircuit(id);
    if (id) {
      if (draftGfciProtectedBy) {
        const n = nodes.find((o) => o.id === draftGfciProtectedBy);
        if (n && n.circuitId !== id) setDraftGfciProtectedBy(undefined);
      }
      if (draftControl) {
        const n = nodes.find((o) => o.id === draftControl);
        if (n && n.circuitId !== id) setDraftControl(undefined);
      }
    }
  };

  const handleDraftGfciProtectedByChange = (val: string | undefined) => {
    setDraftGfciProtectedBy(val);
    if (val) {
      setDraftIsGfci(false);
    }
    if (val) {
      const n = nodes.find((o) => o.id === val);
      if (n?.circuitId) setDraftCircuit(n.circuitId);
    }
  };

  const handleDraftControlChange = (val: string | undefined) => {
    setDraftControl(val);
    if (val) {
      const n = nodes.find((o) => o.id === val);
      if (n?.circuitId) setDraftCircuit(n.circuitId);
    }
  };

  const handleDraftKindChange = (kind: Outlet["kind"]) => {
    setDraftKind(kind);
    if (kind !== "OUTLET") {
      setDraftIsGfci(false);
    }
    if (!["OUTLET", "DIMMER", "LIGHT", "FAN", "SWITCH", "OTHER"].includes(kind)) {
      setDraftGfciProtectedBy(undefined);
    }
    if (!["SWITCH", "DIMMER", "OUTLET", "LIGHT", "FAN", "OTHER"].includes(kind)) {
      setDraftControl(undefined);
    }
  };

  const handleMoveOutlet = (id: string, x: number, y: number) => {
    if (useLive) {
      updateNodePosition.mutate({ id, x, y });
    } else {
      setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
    }
  };

  const handleCanvasClick = (pos: { x: number; y: number; clientX: number; clientY: number }) => {
    setDraft(pos);
    setDraftName("");
    setDraftKind("OUTLET");
    setDraftCircuit(undefined);
    setDraftIsGfci(false);
    setDraftGfciProtectedBy(undefined);
    setDraftControl(undefined);
  };

  const handleSaveDraft = () => {
    if (!draft) return;
    const payload = {
      name: draftName || null,
      kind: draftKind,
      x: draft.x,
      y: draft.y,
      circuitId: draftCircuit || null,
      floorId: useLive && nodes.length > 0 ? (nodes[0] as any).floorId : "floor-mock",
      isGfci: draftIsGfci
    };
    if (useLive) {
      createNode.mutate(payload as any, {
        onSuccess: async (created: any) => {
          const linkPromises: Promise<any>[] = [];
          if (draftGfciProtectedBy) {
            linkPromises.push(
              createNodeLink.mutateAsync({
                kind: "GFCI_PROTECTS",
                fromId: draftGfciProtectedBy,
                toId: created.id
              } as any)
            );
          }
          if (draftControl) {
            if (draftKind === "SWITCH" || draftKind === "DIMMER") {
              linkPromises.push(
                createNodeLink.mutateAsync({
                  kind: "SWITCH_CONTROLS",
                  fromId: created.id,
                  toId: draftControl
                } as any)
              );
            } else {
              linkPromises.push(
                createNodeLink.mutateAsync({
                  kind: "SWITCH_CONTROLS",
                  fromId: draftControl,
                  toId: created.id
                } as any)
              );
            }
          }
          await Promise.allSettled(linkPromises);
          setDraft(null);
        }
      });
    } else {
      const newId = `temp-${Date.now()}`;
      setOutlets((prev) => [...prev, { id: newId, ...payload } as any]);
      if (draftGfciProtectedBy) {
        setLocalLinks((prev) => [...prev, { kind: "GFCI_PROTECTS", fromId: draftGfciProtectedBy, toId: newId }]);
      }
      if (draftControl) {
        if (draftKind === "SWITCH" || draftKind === "DIMMER") {
          setLocalLinks((prev) => [...prev, { kind: "SWITCH_CONTROLS", fromId: newId, toId: draftControl }]);
        } else {
          setLocalLinks((prev) => [...prev, { kind: "SWITCH_CONTROLS", fromId: draftControl, toId: newId }]);
        }
      }
      setDraft(null);
    }
  };

  const handleCancelDraft = () => setDraft(null);

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
          onCanvasClick={handleCanvasClick}
          draft={
            draft
              ? {
                  x: draft.x,
                  y: draft.y,
                  kind: draftKind,
                  circuitColor:
                    draftCircuit &&
                    (circuits as any[]).find((c: any) => c.id === draftCircuit)?.color
                }
              : undefined
          }
        />
        <section className="info-bar">
          <div>Selected circuit: {selectedCircuitId ?? "None"}</div>
          <div>Selected outlet: {selectedOutletId ?? "None"}</div>
          <div>Node links: {nodeLinks.length}</div>
        </section>
        {draft && (
          <DraftModal
            draft={draft}
            circuits={circuits}
            nodes={nodes}
            draftName={draftName}
            draftKind={draftKind}
            draftCircuit={draftCircuit}
            draftIsGfci={draftIsGfci}
            draftGfciProtectedBy={draftGfciProtectedBy}
            draftControl={draftControl}
            onNameChange={setDraftName}
            onKindChange={handleDraftKindChange}
            onCircuitChange={handleDraftCircuitChange}
            onIsGfciChange={setDraftIsGfci}
            onGfciProtectedByChange={handleDraftGfciProtectedByChange}
            onControlChange={handleDraftControlChange}
            onSave={handleSaveDraft}
            onCancel={handleCancelDraft}
          />
        )}
      </main>
    </div>
  );
}

export default App

type DraftModalProps = {
  draft: { x: number; y: number; clientX: number; clientY: number };
  circuits: any[];
  nodes: Outlet[];
  draftName: string;
  draftKind: Outlet["kind"];
  draftCircuit?: string;
  draftIsGfci: boolean;
  draftGfciProtectedBy?: string;
  draftControl?: string;
  onNameChange: (v: string) => void;
  onKindChange: (v: Outlet["kind"]) => void;
  onCircuitChange: (v: string | undefined) => void;
  onIsGfciChange: (v: boolean) => void;
  onGfciProtectedByChange: (v: string | undefined) => void;
  onControlChange: (v: string | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
};

function DraftModal({
  draft,
  circuits,
  nodes,
  draftName,
  draftKind,
  draftCircuit,
  draftIsGfci,
  draftGfciProtectedBy,
  draftControl,
  onNameChange,
  onKindChange,
  onCircuitChange,
  onIsGfciChange,
  onGfciProtectedByChange,
  onControlChange,
  onSave,
  onCancel
}: DraftModalProps) {
  const width = 280;
  const rightFits = draft.clientX + width + 22 <= window.innerWidth;
  const leftPos = Math.max(8, draft.clientX - width - 18);
  const rightPos = Math.min(window.innerWidth - width - 8, draft.clientX + 18);
  const left = rightFits ? rightPos : leftPos;
  const top = Math.max(8, Math.min(window.innerHeight - 200, draft.clientY - 20));

  const gfciOptions = nodes.filter(
    (n) => n.isGfci && ["OUTLET"].includes(n.kind) && (!draftCircuit || n.circuitId === draftCircuit)
  );

  const controlOptions =
    ["SWITCH", "DIMMER"].includes(draftKind)
      ? nodes.filter(
          (n) =>
            ["OUTLET", "LIGHT", "FAN", "OTHER"].includes(n.kind) &&
            n.kind !== "OUTLET_240" &&
            (!draftCircuit || n.circuitId === draftCircuit)
        )
      : nodes.filter(
          (n) => ["SWITCH", "DIMMER"].includes(n.kind) && (!draftCircuit || n.circuitId === draftCircuit)
        );

  return (
    <div className="draft-modal" style={{ left, top, width }}>
      <div className="draft-header">
        <strong>New node</strong>
        <button className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <label className="field">
        <span>Name</span>
        <input value={draftName} onChange={(e) => onNameChange(e.target.value)} placeholder="Optional" />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={draftKind} onChange={(e) => onKindChange(e.target.value as Outlet["kind"])}>
          {nodeKinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Circuit (optional)</span>
        <select value={draftCircuit ?? ""} onChange={(e) => onCircuitChange(e.target.value || undefined)}>
          <option value="">—</option>
          {circuits.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name || c.label || c.id}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>GFCI</span>
        <input
          type="checkbox"
          disabled={draftKind !== "OUTLET" || !!draftGfciProtectedBy}
          checked={draftIsGfci}
          onChange={(e) => onIsGfciChange(e.target.checked)}
        />
      </label>
      <label className="field">
        <span>GFCI Protected By</span>
        <select
          disabled={draftIsGfci || !["OUTLET", "DIMMER", "LIGHT", "FAN", "SWITCH", "OTHER"].includes(draftKind)}
          value={draftGfciProtectedBy ?? ""}
          onChange={(e) => onGfciProtectedByChange(e.target.value || undefined)}
        >
          <option value="">—</option>
          {gfciOptions.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name || n.id}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{["SWITCH", "DIMMER"].includes(draftKind) ? "Controls" : "Is controlled by"}</span>
        <select
          disabled={
            ["SWITCH", "DIMMER"].includes(draftKind)
              ? false
              : ["OUTLET", "LIGHT", "FAN", "OTHER"].includes(draftKind)
              ? false
              : true
          }
          value={draftControl ?? ""}
          onChange={(e) => onControlChange(e.target.value || undefined)}
        >
          <option value="">—</option>
          {controlOptions.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name || n.id}
            </option>
          ))}
        </select>
      </label>
      <div className="draft-actions">
        <button onClick={onSave}>Save</button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
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
  useCreateNodeLink,
  useUpdateNode,
  useDeleteNodeLink,
  useBreakers,
  useBreakerLinks,
  useCreateBreaker,
  useUpdateBreaker,
  useBreakerLinkMutations
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
  const [selectedBreakerId, setSelectedBreakerId] = useState<string | null>(null);

  const updateNodePosition = useUpdateNodePosition();
  const createNode = useCreateNode();
  const updateNode = useUpdateNode();
  const createNodeLink = useCreateNodeLink();
  const deleteNodeLink = useDeleteNodeLink();
  const [draft, setDraft] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftKind, setDraftKind] = useState<Outlet["kind"]>("OUTLET");
  const [draftCircuit, setDraftCircuit] = useState<string | undefined>(undefined);
  const [draftIsGfci, setDraftIsGfci] = useState(false);
  const [draftGfciProtectedBy, setDraftGfciProtectedBy] = useState<string | undefined>(undefined);
  const [draftControl, setDraftControl] = useState<string | undefined>(undefined);
  const [localLinks, setLocalLinks] = useState<{ fromId: string; toId: string; kind: any }[]>([]);
  const [showBreakerModal, setShowBreakerModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breakersQuery = useBreakers();
  const breakerLinksQuery = useBreakerLinks();
  const createBreaker = useCreateBreaker();
  const updateBreaker = useUpdateBreaker();
  const breakerLinkMutations = useBreakerLinkMutations();

  const useLive = circuitsQuery.isSuccess && nodesQuery.isSuccess;
  const circuits = useLive ? (circuitsQuery.data as any) : mockCircuits;
  const nodes = useLive ? (nodesQuery.data as any as Outlet[]) : outlets;
  const nodeLinks = useLive ? nodeLinksQuery.data || [] : [];
  const mockBreakers = circuits.map((c: any, idx: number) => ({
    id: c.id,
    label: "",
    amperage: c.amperage,
    slotNumber: idx + 1,
    circuitId: c.id
  }));
  const breakers = useLive ? (breakersQuery.data as any) ?? [] : mockBreakers;
  const breakerLinks = breakerLinksQuery.isSuccess ? breakerLinksQuery.data || [] : [];

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

  const handleSelectOutlet = (id: string, pos?: { clientX: number; clientY: number }) => {
    selectCircuit(null);
    setSelectedBreakerId(null);
    selectOutlet(id);

    if (pos) {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        const gfciLink = (nodeLinks as any[]).find(
          (l) => l.kind === "GFCI_PROTECTS" && l.toId === node.id
        );
        const controlLinkAsSwitch = (nodeLinks as any[]).find(
          (l) => l.kind === "SWITCH_CONTROLS" && l.fromId === node.id
        );
        const controlLinkAsTarget = (nodeLinks as any[]).find(
          (l) => l.kind === "SWITCH_CONTROLS" && l.toId === node.id
        );

        setEditingNodeId(node.id);
        setDraft({
          x: node.x,
          y: node.y,
          clientX: pos.clientX,
          clientY: pos.clientY
        });
        setDraftName(node.name || "");
        setDraftKind(node.kind as Outlet["kind"]);
        setDraftCircuit(node.circuitId || undefined);
        setDraftIsGfci(!!(node as any).isGfci);
        setDraftGfciProtectedBy(gfciLink ? gfciLink.fromId : undefined);
        if (node.kind === "SWITCH" || node.kind === "DIMMER") {
          setDraftControl(controlLinkAsSwitch ? controlLinkAsSwitch.toId : undefined);
        } else {
          setDraftControl(controlLinkAsTarget ? controlLinkAsTarget.fromId : undefined);
        }
      }
    }
  };

  const handleSelectBreaker = (breakerId: string) => {
    const br = breakers.find((b: any) => b.id === breakerId);
    setSelectedBreakerId(breakerId);
    selectOutlet(null);
    selectCircuit(br?.circuitId ?? null);
  };

  const handleClear = () => {
    setSelectedBreakerId(null);
    clear();
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
    setEditingNodeId(null);
    setDraft(pos);
    setDraftName("");
    setDraftKind("OUTLET");
    setDraftCircuit(undefined);
    setDraftIsGfci(false);
    setDraftGfciProtectedBy(undefined);
    setDraftControl(undefined);
  };

  const handleSaveDraft = async () => {
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
      const targetId = editingNodeId;
      if (targetId) {
        await updateNode.mutateAsync({ id: targetId, data: payload as any });
        const toRemove = (nodeLinks as any[]).filter(
          (l) =>
            (l.kind === "GFCI_PROTECTS" && l.toId === targetId) ||
            (l.kind === "SWITCH_CONTROLS" && (l.fromId === targetId || l.toId === targetId))
        );
        await Promise.allSettled(toRemove.map((l) => deleteNodeLink.mutateAsync(l.id)));

        const linkPromises: Promise<any>[] = [];
        if (draftGfciProtectedBy) {
          linkPromises.push(
            createNodeLink.mutateAsync({
              kind: "GFCI_PROTECTS",
              fromId: draftGfciProtectedBy,
              toId: targetId
            } as any)
          );
        }
        if (draftControl) {
          if (draftKind === "SWITCH" || draftKind === "DIMMER") {
            linkPromises.push(
              createNodeLink.mutateAsync({
                kind: "SWITCH_CONTROLS",
                fromId: targetId,
                toId: draftControl
              } as any)
            );
          } else {
            linkPromises.push(
              createNodeLink.mutateAsync({
                kind: "SWITCH_CONTROLS",
                fromId: draftControl,
                toId: targetId
              } as any)
            );
          }
        }
        await Promise.allSettled(linkPromises);
      } else {
        await new Promise<void>((resolve) => {
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
              resolve();
            }
          });
        });
      }
    } else {
      if (editingNodeId) {
        setOutlets((prev) =>
          prev.map((o) => (o.id === editingNodeId ? ({ ...o, ...payload } as any) : o))
        );
        setLocalLinks((prev) =>
          prev
            .filter(
              (l) =>
                !(
                  l.kind === "GFCI_PROTECTS" && l.toId === editingNodeId ||
                  (l.kind === "SWITCH_CONTROLS" && (l.fromId === editingNodeId || l.toId === editingNodeId))
                )
            )
            .concat(
              draftGfciProtectedBy
                ? [{ kind: "GFCI_PROTECTS", fromId: draftGfciProtectedBy, toId: editingNodeId }]
                : []
            )
            .concat(
              draftControl
                ? draftKind === "SWITCH" || draftKind === "DIMMER"
                  ? [{ kind: "SWITCH_CONTROLS", fromId: editingNodeId, toId: draftControl }]
                  : [{ kind: "SWITCH_CONTROLS", fromId: draftControl, toId: editingNodeId }]
                : []
            )
        );
      } else {
        const newId = `temp-${Date.now()}`;
        setOutlets((prev) => [...prev, { id: newId, ...payload } as any]);
        const newLinks: any[] = [];
        if (draftGfciProtectedBy) {
          newLinks.push({ kind: "GFCI_PROTECTS", fromId: draftGfciProtectedBy, toId: newId });
        }
        if (draftControl) {
          if (draftKind === "SWITCH" || draftKind === "DIMMER") {
            newLinks.push({ kind: "SWITCH_CONTROLS", fromId: newId, toId: draftControl });
          } else {
            newLinks.push({ kind: "SWITCH_CONTROLS", fromId: draftControl, toId: newId });
          }
        }
        setLocalLinks((prev) => [...prev, ...newLinks]);
      }
    }

    setDraft(null);
    setEditingNodeId(null);
  };

  const handleCancelDraft = () => {
    setDraft(null);
    setEditingNodeId(null);
  };

  const handleSaveBreakers = async (drafts: BreakerDraft[]) => {
    if (!useLive) {
      setShowBreakerModal(false);
      return;
    }
    // persist breakers
    const idMap = new Map<string, string>();
    const existingIds = new Set(breakers.map((b: any) => b.id));

    for (const draft of drafts) {
      if (draft.id && existingIds.has(draft.id)) {
        await updateBreaker.mutateAsync({
          id: draft.id,
          data: { label: draft.label, amperage: draft.amperage, slotNumber: draft.slotNumber }
        });
        idMap.set(draft.id, draft.id);
      } else {
        const created = await createBreaker.mutateAsync({
          label: draft.label,
          amperage: draft.amperage,
          slotNumber: draft.slotNumber
        });
        idMap.set(draft.id ?? `temp-${draft.label}-${draft.slotNumber}`, (created as any).id);
      }
    }

    // remove all existing links and recreate from drafts
    if (breakerLinks && breakerLinks.length > 0) {
      await Promise.all(
        breakerLinks.map((l: any) => breakerLinkMutations.remove.mutateAsync(l.id))
      );
    }

    const createdPairs = new Set<string>();
    for (const draft of drafts) {
      if (draft.tieTo) {
        const a = idMap.get(draft.id ?? `temp-${draft.label}-${draft.slotNumber}`);
        const b = idMap.get(draft.tieTo) || draft.tieTo;
        if (!a || !b || a === b) continue;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (createdPairs.has(key)) continue;
        createdPairs.add(key);
        await breakerLinkMutations.create.mutateAsync({
          breakerAId: a,
          breakerBId: b,
          kind: "TIED"
        } as any);
      }
    }

    setShowBreakerModal(false);
  };

  return (
    <div className={`page ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <div className={`sidebar-container ${sidebarOpen ? "open" : "closed"}`}>
        <Sidebar
          breakers={breakers}
          outlets={nodes}
          selectedBreakerId={selectedBreakerId}
          selectedOutletId={selectedOutletId}
          onSelectBreaker={handleSelectBreaker}
          onSelectOutlet={handleSelectOutlet}
          onClear={handleClear}
          onEditBreakers={() => setShowBreakerModal(true)}
          onToggle={() => setSidebarOpen((s) => !s)}
          isOpen={sidebarOpen}
        />
      </div>
      <main className="main">
        <header className="main-header">
          <div className="header-left">
            {!sidebarOpen && (
              <button className="ghost" onClick={() => setSidebarOpen(true)}>
                ☰
              </button>
            )}
            <div>
              <h1>Floor Plan</h1>
              <p className="muted">Drag outlets, zoom with wheel/trackpad, click to highlight.</p>
            </div>
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
          <div>
            Selected breaker:{" "}
            {selectedBreakerId
              ? (() => {
                  const b = breakers.find((x: any) => x.id === selectedBreakerId);
                  const idx = breakers.findIndex((x: any) => x.id === selectedBreakerId);
                  return b?.label?.trim() || `Slot ${b?.slotNumber ?? idx + 1}`;
                })()
              : "None"}
          </div>
          <div>Selected outlet: {selectedOutletId ?? "None"}</div>
          <div>Node links: {nodeLinks.length}</div>
        </section>
        {draft && (
          <DraftModal
            draft={draft}
            circuits={circuits}
            nodes={nodes}
            mode={editingNodeId ? "edit" : "create"}
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
        {showBreakerModal && (
          <div className="modal-backdrop">
            <BreakerModal
              breakers={breakers}
              breakerLinks={breakerLinks}
              onClose={() => setShowBreakerModal(false)}
              onSave={(changes) => handleSaveBreakers(changes)}
            />
          </div>
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
  mode: "create" | "edit";
  onNameChange: (v: string) => void;
  onKindChange: (v: Outlet["kind"]) => void;
  onCircuitChange: (v: string | undefined) => void;
  onIsGfciChange: (v: boolean) => void;
  onGfciProtectedByChange: (v: string | undefined) => void;
  onControlChange: (v: string | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
};

type BreakerDraft = {
  id?: string;
  label: string;
  amperage?: number;
  slotNumber?: number;
  tieTo?: string | null;
};

function DraftModal({
  draft,
  circuits,
  nodes,
  mode,
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
        <strong>{mode === "edit" ? "Edit node" : "New node"}</strong>
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

function BreakerModal({
  breakers,
  breakerLinks,
  onClose,
  onSave
}: {
  breakers: any[];
  breakerLinks: any[];
  onClose: () => void;
  onSave: (drafts: BreakerDraft[]) => void;
}) {
  const [items, setItems] = useState<BreakerDraft[]>([]);
  const [originals, setOriginals] = useState<Map<string, BreakerDraft>>(new Map());
  const [editing, setEditing] = useState<Set<string>>(new Set());

  const nameFor = (br: BreakerDraft, idx: number) =>
    br.label?.trim() || `Slot ${br.slotNumber ?? idx + 1}`;

  useEffect(() => {
    const initial = breakers.map((b: any) => ({
      id: b.id,
      label: b.label || "",
      amperage: b.amperage ?? undefined,
      slotNumber: b.slotNumber ?? 0,
      tieTo: findTie(b.id, breakerLinks)
    }));
    setItems(initial);
    setOriginals(new Map(initial.map((b) => [b.id!, { ...b }])));
    setEditing(new Set());
  }, [breakers, breakerLinks]);

  const handleAdd = () => {
    const tempId = `temp-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      { id: tempId, label: "", amperage: undefined, slotNumber: prev.length, tieTo: null }
    ]);
    setEditing((prev) => new Set(prev).add(tempId));
  };

  const handleChange = (idx: number, updates: Partial<BreakerDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  };

  const handleSave = () => {
    onSave(
      items.map((item, idx) => ({
        ...item,
        slotNumber: idx + 1
      }))
    );
    onClose();
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from)) return;
    if (from === index) return;
    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(index, 0, moved);
      return copy;
    });
  };

  const tieOptions = (currentId?: string) =>
    items.filter((i) => i.id !== currentId).filter((i) => !i.tieTo || i.tieTo === currentId);

  const startEdit = (id: string) => {
    setEditing((prev) => new Set(prev).add(id));
  };

  const cancelEdit = (id: string) => {
    const orig = originals.get(id);
    if (!orig) {
      // new item, remove it
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...orig } : i)));
    }
    setEditing((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const doneEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.id) {
      setOriginals((prev) => {
        const next = new Map(prev);
        next.set(item.id!, { ...item });
        return next;
      });
    }
    setEditing((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="breaker-modal">
      <div className="breaker-header">
        <strong>Edit breakers</strong>
        <button className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="breaker-list">
        {items.map((b, idx) => (
          <div
            key={b.id ?? `new-${idx}`}
            className="breaker-card"
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, idx)}
          >
            <div className="breaker-index">{idx + 1}</div>
            <div className="breaker-body">
              {editing.has(b.id! || `temp-${idx}`) ? (
                <div className="breaker-row-display edit">
                  <div className="breaker-main">
                    <input
                      className="breaker-name-input"
                      placeholder={`Slot ${b.slotNumber ?? idx + 1}`}
                      value={b.label}
                      onChange={(e) => handleChange(idx, { label: e.target.value })}
                    />
                    <select
                      className="breaker-amp-input"
                      value={b.amperage ?? ""}
                      onChange={(e) =>
                        handleChange(idx, {
                          amperage: e.target.value ? Number(e.target.value) : undefined
                        })
                      }
                    >
                      <option value="">Amperage</option>
                      {[15, 20, 40, 50].map((v) => (
                        <option key={v} value={v}>
                          {v} A
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="breaker-tie">
                    <select
                      value={b.tieTo ?? ""}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        handleChange(idx, { tieTo: val || null });
                      }}
                    >
                      <option value="">Tied to —</option>
                      {tieOptions(b.id).map((o, j) => (
                        <option key={o.id ?? `new-${o.label}`} value={o.id}>
                          {nameFor(o, j)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="breaker-row-display">
                  <div className="breaker-main">
                    <div className="breaker-name">{nameFor(b, idx)}</div>
                    <div className="muted breaker-amp">{b.amperage ? `${b.amperage} A` : "—"}</div>
                  </div>
                  <div className="breaker-tie muted">
                    {b.tieTo
                      ? (() => {
                          const match = items.find((i) => i.id === b.tieTo);
                          const idxMatch = items.findIndex((i) => i.id === b.tieTo);
                          return match ? nameFor(match, idxMatch) : b.tieTo;
                        })()
                      : "—"}
                  </div>
                </div>
              )}
            </div>
            <div className="breaker-actions inline">
              {editing.has(b.id! || `temp-${idx}`) ? (
                <>
                  <button className="ghost" onClick={() => cancelEdit(b.id! || `temp-${idx}`)}>
                    Cancel
                  </button>
                  <button onClick={() => doneEdit(b.id! || `temp-${idx}`)}>Done</button>
                </>
              ) : (
                <button className="ghost" onClick={() => startEdit(b.id! || `temp-${idx}`)}>
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="breaker-actions">
        <button className="ghost" onClick={handleAdd}>
          Add new breaker
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

function findTie(id: string, links: any[]) {
  const link = links.find((l) => l.breakerAId === id || l.breakerBId === id);
  if (!link) return null;
  return link.breakerAId === id ? link.breakerBId : link.breakerAId;
}

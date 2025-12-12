import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Group, Circle, Text, Line, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Circuit, FloorPlan, Outlet, OutletKind } from "../types";

type Props = {
  floor: FloorPlan;
  outlets: Outlet[];
  circuits: Circuit[];
  highlightedOutletIds: Set<string>;
  onSelectOutlet: (id: string, pos?: { clientX: number; clientY: number }) => void;
  onMoveOutlet?: (id: string, x: number, y: number) => void;
  onCanvasClick?: (pos: { x: number; y: number; clientX: number; clientY: number }) => void;
  draft?: { x: number; y: number; kind: Outlet["kind"]; circuitColor?: string };
};

const kindColor: Record<string, string> = {
  OUTLET: "#0ea5e9",
  OUTLET_240: "#7c3aed",
  SWITCH: "#f59e0b",
  DIMMER: "#f59e0b",
  LIGHT: "#fbbf24",
  FAN: "#14b8a6",
  APPLIANCE: "#22c55e",
  COOKTOP: "#ef4444",
  DRYER: "#8b5cf6",
  AC: "#38bdf8"
};

export function FloorCanvas({
  floor,
  outlets,
  circuits,
  highlightedOutletIds,
  onSelectOutlet,
  onMoveOutlet,
  onCanvasClick,
  draft
}: Props) {
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stageDraggable, setStageDraggable] = useState(false);
  const [bgImage] = useImage(floor.backgroundImageUrl || "", "anonymous");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const circuitColors = useMemo(
    () =>
      circuits.reduce<Record<string, string>>((acc, c) => {
        if (c.id && c.color) acc[c.id] = c.color;
        return acc;
      }, {}),
    [circuits]
  );

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = scale;
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - offset.x) / oldScale,
      y: (pointer.y - offset.y) / oldScale
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(Math.max(0.5, oldScale * (direction > 0 ? scaleBy : 1 / scaleBy)), 2);
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    };
    setScale(newScale);
    setOffset(newPos);
  };

  const handleStagePointerDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const isStage = e.target === stage;
    if (isStage) {
      setStageDraggable(true);
      stage.draggable(true);
      stage.startDrag();
    } else {
      setStageDraggable(false);
      stage.draggable(false);
    }
  };

  const handleStagePointerUp = () => {
    setStageDraggable(false);
  };

  useEffect(() => {
    const computeScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const availableWidth = el.clientWidth;
      const availableHeight = el.clientHeight || (el.clientWidth * floor.height) / floor.width;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const next = Math.min(availableWidth / floor.width, availableHeight / floor.height);
      setBaseScale(next);
      setOffset({ x: 0, y: 0 });
    };
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [floor.width, floor.height]);

  return (
    <div
      className="canvas-container"
      ref={containerRef}
      style={{ aspectRatio: `${floor.width} / ${floor.height}` }}
    >
      <Stage
        width={floor.width * baseScale}
        height={(floor.height || 1) * baseScale}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        draggable={stageDraggable}
        onDragEnd={(e) => {
          const stage = e.target.getStage();
          if (stage && e.target === stage) {
            setOffset({ x: stage.x(), y: stage.y() });
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleStagePointerDown}
        onTouchStart={handleStagePointerDown}
        onMouseUp={handleStagePointerUp}
        onTouchEnd={handleStagePointerUp}
        onClick={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;
          const isStage = e.target === stage;
          if (isStage && onCanvasClick) {
            const rel = stage.getRelativePointerPosition();
            const evt = e.evt as MouseEvent;
            if (rel && evt) {
              onCanvasClick({ x: rel.x, y: rel.y, clientX: evt.clientX, clientY: evt.clientY });
            }
          }
        }}
        style={{ border: "1px solid #e2e8f0", background: "#fff" }}
      >
        <Layer>
          {bgImage ? (
            <KonvaImage
              image={bgImage}
              x={0}
              y={0}
              width={floor.width}
              height={floor.height}
              listening={false}
            />
          ) : (
            <Rect
              x={0}
              y={0}
              width={floor.width}
              height={floor.height}
              fill={floor.backgroundColor || "#f8fafc"}
            />
          )}
          {outlets.map((outlet) => {
            const isHighlighted = highlightedOutletIds.has(outlet.id);
            const fill =
              outlet.circuitId && circuitColors[outlet.circuitId]
                ? circuitColors[outlet.circuitId]
                : kindColor[outlet.kind] || "#9ca3af";
            return (
              <Group
                key={outlet.id}
                x={outlet.x}
                y={outlet.y}
                draggable
                onDragEnd={(e) => {
                  const factor = baseScale * scale;
                  onMoveOutlet?.(outlet.id, e.target.x() / factor, e.target.y() / factor);
                }}
                onClick={(evt) =>
                  onSelectOutlet(outlet.id, {
                    clientX: (evt.evt as MouseEvent).clientX,
                    clientY: (evt.evt as MouseEvent).clientY
                  })
                }
                onTap={() => onSelectOutlet(outlet.id)}
              >
                <Group>
                  {renderShape(outlet.kind, fill, isHighlighted)}
                  {outlet.kind === "OUTLET_240" && (
                    <Text
                      text="240"
                      y={-22}
                      fill={fill}
                      fontSize={10}
                      align="center"
                      width={32}
                      offsetX={16}
                    />
                  )}
                  {outlet.isGfci && (
                    <Text
                      text="GFCI"
                      y={18}
                      fill={fill}
                      fontSize={10}
                      align="center"
                      width={36}
                      offsetX={18}
                    />
                  )}
                </Group>
                <Text
                  text={outlet.name || outlet.id}
                  x={0}
                  y={-24}
                  offsetX={70}
                  width={140}
                  align="center"
                  fill="#0f172a"
                  fontSize={12}
                  wrap="none"
                />
              </Group>
            );
          })}
          {draft && (
            <Group x={draft.x} y={draft.y}>
              {renderShape(draft.kind, draft.circuitColor || "#9ca3af", false, { dash: [4, 4], opacity: 0.7 })}
              <Text
                text="New node"
                x={0}
                y={-24}
                offsetX={70}
                width={140}
                align="center"
                fill="#0f172a"
                fontSize={12}
                wrap="none"
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
}

function renderShape(
  kind: OutletKind,
  fill: string,
  isHighlighted: boolean,
  extra?: { dash?: number[]; opacity?: number }
) {
  const common = {
    stroke: isHighlighted ? "#f97316" : "#0f172a",
    strokeWidth: isHighlighted ? 3 : 1,
    fill,
    ...(extra?.dash ? { dash: extra.dash } : {}),
    ...(extra?.opacity ? { opacity: extra.opacity } : {})
  };

  switch (kind) {
    case "OUTLET":
    case "OUTLET_240":
      return <Rect x={-12} y={-9} width={24} height={18} cornerRadius={3} {...common} />;
    case "SWITCH":
      return <Line points={[-12, 10, 12, 10, 0, -12]} closed {...common} />;
    case "DIMMER":
      return (
        <Group>
          <Line points={[-12, 10, 12, 10, 0, -12]} closed {...common} />
          <Circle x={0} y={2} radius={4} fill="#0b1021" stroke={common.stroke} strokeWidth={1} />
        </Group>
      );
    case "LIGHT":
      return <Circle radius={12} {...common} />;
    case "FAN":
      return (
        <Group>
          <Circle radius={12} {...common} />
          <Line points={[-8, 0, 8, 0]} stroke="#0b1021" strokeWidth={2} />
          <Line points={[0, -8, 0, 8]} stroke="#0b1021" strokeWidth={2} />
        </Group>
      );
    case "COOKTOP":
    case "DRYER":
    case "AC":
    case "APPLIANCE":
      return (
        <Rect x={-12} y={-10} width={24} height={20} cornerRadius={4} {...common} />
      );
    default:
      return <Circle radius={12} {...common} />;
  }
}


import { useMemo, useState } from "react";
import { Stage, Layer, Rect, Group, Circle, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Circuit, FloorPlan, Outlet } from "../types";

type Props = {
  floor: FloorPlan;
  outlets: Outlet[];
  circuits: Circuit[];
  highlightedOutletIds: Set<string>;
  onSelectOutlet: (id: string) => void;
  onMoveOutlet?: (id: string, x: number, y: number) => void;
};

const kindColor: Record<string, string> = {
  OUTLET: "#0ea5e9",
  SWITCH: "#f59e0b",
  LIGHT: "#a855f7",
  APPLIANCE: "#22c55e"
};

export function FloorCanvas({
  floor,
  outlets,
  circuits,
  highlightedOutletIds,
  onSelectOutlet,
  onMoveOutlet
}: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stageDraggable, setStageDraggable] = useState(false);
  const [bgImage] = useImage(floor.backgroundImageUrl || "", "anonymous");

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

  return (
    <div className="canvas-container">
      <Stage
        width={floor.width}
        height={floor.height}
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
            const fill = circuitColors[outlet.circuitId || ""] || kindColor[outlet.kind] || "#0ea5e9";
            return (
              <Group
                key={outlet.id}
                x={outlet.x}
                y={outlet.y}
                draggable
                onDragEnd={(e) => onMoveOutlet?.(outlet.id, e.target.x(), e.target.y())}
                onClick={() => onSelectOutlet(outlet.id)}
                onTap={() => onSelectOutlet(outlet.id)}
              >
                <Circle
                  radius={12}
                  fill={fill}
                  opacity={isHighlighted ? 1 : 0.6}
                  stroke={isHighlighted ? "#f97316" : "#0f172a"}
                  strokeWidth={isHighlighted ? 3 : 1}
                />
                <Text
                  text={outlet.name || outlet.id}
                  offsetY={-22}
                  offsetX={0}
                  width={140}
                  align="center"
                  fill="#0f172a"
                  fontSize={12}
                  wrap="none"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}


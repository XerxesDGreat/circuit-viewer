export type NodeKind =
  | "OUTLET"
  | "OUTLET_240"
  | "SWITCH"
  | "DIMMER"
  | "LIGHT"
  | "FAN"
  | "APPLIANCE"
  | "COOKTOP"
  | "DRYER"
  | "AC"
  | "PANEL_FEED"
  | "OTHER";

export type NodeLinkKind = "GFCI_PROTECTS" | "SWITCH_CONTROLS" | "FEEDS" | "OTHER";

export type Node = {
  id: string;
  name: string | null;
  description?: string | null;
  kind: NodeKind;
  x: number;
  y: number;
  rotation?: number | null;
  floorId: string;
  roomId?: string | null;
  circuitId?: string | null;
  isGfci: boolean;
  typeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type NodeLink = {
  id: string;
  fromId: string;
  toId: string;
  kind: NodeLinkKind;
};

export type Circuit = {
  id: string;
  name?: string | null;
  label?: string | null;
  amperage?: number | null;
  voltage?: number | null;
  color?: string | null;
  panelId?: string | null;
};

export type Breaker = {
  id: string;
  panelId: string;
  slotNumber?: number | null;
  label?: string | null;
  poleCount?: number | null;
  type: string;
  amperage?: number | null;
  voltage?: number | null;
  circuitId?: string | null;
};

export type ApiResult<T> = {
  data: T;
};

